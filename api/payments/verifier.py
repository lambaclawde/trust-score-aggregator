"""On-chain payment verification for x402 protocol."""

import logging
import os
from datetime import datetime, timedelta
from typing import Optional
from dataclasses import dataclass
from web3 import Web3
from eth_account.messages import encode_defunct

from .models import PaymentReceipt, get_session, get_engine

logger = logging.getLogger(__name__)

# USDC contract addresses by chain
USDC_ADDRESSES = {
    1: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",  # Ethereum mainnet
    8453: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",  # Base
    84532: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",  # Base Sepolia
}

# Minimum confirmations required
MIN_CONFIRMATIONS = 1


@dataclass
class PaymentProof:
    """Parsed payment proof from request headers."""
    tx_hash: str
    chain_id: int
    payer: Optional[str] = None


@dataclass
class VerificationResult:
    """Result of payment verification."""
    valid: bool
    error: Optional[str] = None
    receipt: Optional[PaymentReceipt] = None
    payer: Optional[str] = None


class PaymentVerifier:
    """Verifies x402 payments on-chain."""

    def __init__(
        self,
        recipient_address: str,
        min_payment_wei: int,
        database_url: str,
        rpc_url: Optional[str] = None,
    ):
        self.recipient = Web3.to_checksum_address(recipient_address)
        self.min_payment_wei = min_payment_wei
        self.database_url = database_url

        # Initialize Web3
        rpc = rpc_url or os.getenv("RPC_URL", "https://eth.llamarpc.com")
        self.w3 = Web3(Web3.HTTPProvider(rpc))

        # Initialize database
        self.engine = get_engine(database_url)

    def parse_payment_header(self, header: str) -> Optional[PaymentProof]:
        """Parse X-Payment header.

        Format: tx_hash:chain_id or just tx_hash (defaults to chain 1)
        """
        if not header:
            return None

        parts = header.strip().split(":")
        tx_hash = parts[0]

        # Validate tx hash format
        if not tx_hash.startswith("0x") or len(tx_hash) != 66:
            return None

        chain_id = int(parts[1]) if len(parts) > 1 else 1
        payer = parts[2] if len(parts) > 2 else None

        return PaymentProof(tx_hash=tx_hash, chain_id=chain_id, payer=payer)

    def check_existing_receipt(self, tx_hash: str) -> Optional[PaymentReceipt]:
        """Check if we already have a valid receipt for this tx."""
        session = get_session(self.engine)
        try:
            receipt = session.query(PaymentReceipt).filter_by(tx_hash=tx_hash).first()
            if receipt:
                # Check if receipt has uses remaining
                if receipt.uses_remaining > 0:
                    # Check expiry
                    if receipt.expires_at and receipt.expires_at < datetime.utcnow():
                        return None
                    return receipt
            return None
        finally:
            session.close()

    def use_receipt(self, tx_hash: str) -> bool:
        """Decrement uses_remaining for a receipt."""
        session = get_session(self.engine)
        try:
            receipt = session.query(PaymentReceipt).filter_by(tx_hash=tx_hash).first()
            if receipt and receipt.uses_remaining > 0:
                receipt.uses_remaining -= 1
                session.commit()
                return True
            return False
        finally:
            session.close()

    def verify_eth_payment(
        self,
        tx_hash: str,
        chain_id: int,
        endpoint: Optional[str] = None,
    ) -> VerificationResult:
        """Verify an ETH payment transaction."""

        # Check if we already verified this transaction
        existing = self.check_existing_receipt(tx_hash)
        if existing:
            # Use the existing receipt
            self.use_receipt(tx_hash)
            return VerificationResult(
                valid=True,
                receipt=existing,
                payer=existing.payer,
            )

        try:
            # Get transaction
            tx = self.w3.eth.get_transaction(tx_hash)
            if not tx:
                return VerificationResult(valid=False, error="Transaction not found")

            # Get receipt to confirm it succeeded
            receipt = self.w3.eth.get_transaction_receipt(tx_hash)
            if not receipt or receipt.status != 1:
                return VerificationResult(valid=False, error="Transaction failed or pending")

            # Check confirmations
            current_block = self.w3.eth.block_number
            confirmations = current_block - receipt.blockNumber
            if confirmations < MIN_CONFIRMATIONS:
                return VerificationResult(
                    valid=False,
                    error=f"Insufficient confirmations: {confirmations}/{MIN_CONFIRMATIONS}"
                )

            # Check recipient
            if tx.to and tx.to.lower() != self.recipient.lower():
                return VerificationResult(
                    valid=False,
                    error=f"Wrong recipient: {tx.to}"
                )

            # Check amount
            if tx.value < self.min_payment_wei:
                return VerificationResult(
                    valid=False,
                    error=f"Insufficient payment: {tx.value} < {self.min_payment_wei}"
                )

            # Calculate uses based on payment amount (1 use per min_payment)
            uses = max(1, tx.value // self.min_payment_wei)

            # Store receipt
            payment_receipt = self._store_receipt(
                tx_hash=tx_hash,
                payer=tx["from"],
                amount_wei=str(tx.value),
                amount_eth=float(Web3.from_wei(tx.value, "ether")),
                token="ETH",
                chain_id=chain_id,
                block_number=receipt.blockNumber,
                endpoint=endpoint,
                uses=uses,
            )

            # Decrement one use immediately
            self.use_receipt(tx_hash)

            return VerificationResult(
                valid=True,
                receipt=payment_receipt,
                payer=tx["from"],
            )

        except Exception as e:
            logger.error(f"Error verifying payment {tx_hash}: {e}")
            return VerificationResult(valid=False, error=str(e))

    def _store_receipt(
        self,
        tx_hash: str,
        payer: str,
        amount_wei: str,
        amount_eth: float,
        token: str,
        chain_id: int,
        block_number: int,
        endpoint: Optional[str],
        uses: int = 1,
    ) -> PaymentReceipt:
        """Store a verified payment receipt."""
        session = get_session(self.engine)
        try:
            receipt = PaymentReceipt(
                tx_hash=tx_hash,
                payer=payer,
                recipient=self.recipient,
                amount_wei=amount_wei,
                amount_eth=amount_eth,
                token=token,
                chain_id=chain_id,
                block_number=block_number,
                endpoint=endpoint,
                uses_remaining=uses,
                expires_at=datetime.utcnow() + timedelta(days=30),  # 30 day expiry
            )
            session.add(receipt)
            session.commit()
            session.refresh(receipt)
            return receipt
        finally:
            session.close()

    def get_payment_details(self, price_eth: str, endpoint: str) -> dict:
        """Get payment details for 402 response."""
        return {
            "x402_version": "1",
            "accepts": [
                {
                    "scheme": "exact",
                    "network": "ethereum",
                    "asset": "ETH",
                    "payTo": self.recipient,
                    "amount": price_eth,
                    "extra": {
                        "endpoint": endpoint,
                        "name": "TrustScore API",
                    }
                }
            ],
            "instructions": (
                f"Send {price_eth} ETH to {self.recipient}, then include "
                "the transaction hash in the X-Payment header: "
                "X-Payment: 0x<tx_hash>:1"
            ),
        }
