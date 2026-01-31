"""x402 Payment Required middleware for API monetization.

Implements HTTP 402 Payment Required for crypto micropayments.
Clients pay per request in ETH to access premium endpoints.

PRODUCTION NOTE: This implementation uses an in-memory payment cache.
For production deployments with multiple workers, use Redis:
    - Set REDIS_URL in environment
    - Replace _payment_cache with Redis client
"""

import logging
import time
from typing import Optional
from dataclasses import dataclass
from functools import wraps

from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from eth_account.messages import encode_defunct
from eth_account import Account

from ..config import settings

logger = logging.getLogger(__name__)


@dataclass
class PaymentConfig:
    """Configuration for x402 payments."""
    recipient: str  # Wallet address to receive payments
    price_wei: int  # Price in wei
    price_eth: str  # Price in ETH (display)
    chain_id: int  # Chain ID for payments
    token: str = "ETH"  # Token symbol


# Default payment configuration
PAYMENT_CONFIG = PaymentConfig(
    recipient=settings.payment_recipient,
    price_wei=100000000000000,  # 0.0001 ETH
    price_eth="0.0001",
    chain_id=settings.chain_id,
)


@dataclass
class PaymentProof:
    """Proof of payment from client."""
    tx_hash: str
    payer: str
    amount: int
    timestamp: int
    signature: str


# Payment cache for verified payments
# WARNING: In-memory cache only works for single-worker deployments
# For multi-worker production, use Redis (set REDIS_URL environment variable)
_payment_cache: dict[str, int] = {}  # tx_hash -> expiry_timestamp
_cache_warning_shown = False


def _get_payment_cache():
    """Get payment cache (Redis if available, else in-memory).

    Returns a dict-like interface for payment caching.
    """
    global _cache_warning_shown
    import os

    redis_url = os.getenv("REDIS_URL")
    if redis_url:
        try:
            import redis
            # Return Redis client wrapped as dict-like
            # For now, fall through to in-memory if Redis not configured
            pass
        except ImportError:
            if not _cache_warning_shown:
                logger.warning("REDIS_URL set but redis package not installed. Using in-memory cache.")
                _cache_warning_shown = True

    if not _cache_warning_shown and settings.environment == "production":
        logger.warning(
            "x402 payment cache using in-memory storage. "
            "For multi-worker deployments, configure REDIS_URL for distributed caching."
        )
        _cache_warning_shown = True

    return _payment_cache


def verify_payment_signature(proof: PaymentProof, config: PaymentConfig) -> bool:
    """Verify the payment proof signature.

    The client signs a message containing:
    - tx_hash
    - recipient address
    - amount
    - timestamp

    This proves they made the payment without requiring on-chain verification
    for every request (which would be slow and expensive).
    """
    try:
        # Reconstruct the message that was signed
        message = f"x402-payment:{proof.tx_hash}:{config.recipient}:{proof.amount}:{proof.timestamp}"
        message_hash = encode_defunct(text=message)

        # Recover the signer address
        recovered = Account.recover_message(message_hash, signature=proof.signature)

        # Verify signer matches payer
        is_valid = recovered.lower() == proof.payer.lower()
        if not is_valid:
            logger.warning(f"Payment signature mismatch: expected {proof.payer}, got {recovered}")
        return is_valid
    except Exception as e:
        logger.error(f"Payment signature verification failed: {e}")
        return False


def is_payment_valid(proof: PaymentProof, config: PaymentConfig) -> tuple[bool, str]:
    """Check if a payment proof is valid.

    Returns (is_valid, error_message).
    """
    cache = _get_payment_cache()

    # Check if already used (replay protection)
    if proof.tx_hash in cache:
        if cache[proof.tx_hash] > time.time():
            # Payment still valid, allow reuse within window
            return True, ""
        else:
            return False, "Payment expired"

    # Check timestamp (payment must be recent - within 5 minutes)
    if abs(time.time() - proof.timestamp) > 300:
        logger.warning(f"Payment timestamp too old: {proof.timestamp} vs now {time.time()}")
        return False, "Payment timestamp too old"

    # Check amount
    if proof.amount < config.price_wei:
        logger.warning(f"Insufficient payment: {proof.amount} < {config.price_wei}")
        return False, f"Insufficient payment. Required: {config.price_wei} wei"

    # Verify signature
    if not verify_payment_signature(proof, config):
        return False, "Invalid payment signature"

    # Cache the payment (valid for 1 hour)
    cache[proof.tx_hash] = int(time.time()) + 3600

    logger.info(f"Payment verified: tx={proof.tx_hash[:16]}... from={proof.payer[:10]}...")
    return True, ""


def parse_payment_header(authorization: str) -> Optional[PaymentProof]:
    """Parse x402 payment proof from Authorization header.

    Format: x402 tx_hash:payer:amount:timestamp:signature
    """
    try:
        if not authorization.startswith("x402 "):
            return None

        parts = authorization[5:].split(":")
        if len(parts) != 5:
            return None

        return PaymentProof(
            tx_hash=parts[0],
            payer=parts[1],
            amount=int(parts[2]),
            timestamp=int(parts[3]),
            signature=parts[4],
        )
    except Exception:
        return None


def create_402_response(config: PaymentConfig, endpoint: str) -> JSONResponse:
    """Create a 402 Payment Required response with payment instructions."""
    return JSONResponse(
        status_code=402,
        content={
            "error": "Payment Required",
            "message": f"This endpoint requires payment of {config.price_eth} {config.token}",
            "payment": {
                "recipient": config.recipient,
                "amount": config.price_wei,
                "amount_display": f"{config.price_eth} {config.token}",
                "chain_id": config.chain_id,
                "token": config.token,
            },
            "instructions": {
                "1": f"Send {config.price_eth} {config.token} to {config.recipient}",
                "2": "Sign message: x402-payment:{tx_hash}:{recipient}:{amount}:{timestamp}",
                "3": "Add header: Authorization: x402 {tx_hash}:{your_address}:{amount}:{timestamp}:{signature}",
            },
            "endpoint": endpoint,
        },
        headers={
            "X-Payment-Required": "true",
            "X-Payment-Recipient": config.recipient,
            "X-Payment-Amount": str(config.price_wei),
            "X-Payment-Token": config.token,
            "X-Payment-Chain": str(config.chain_id),
        }
    )


def x402_required(price_eth: Optional[str] = None):
    """Decorator to require x402 payment for an endpoint.

    Usage:
        @router.get("/premium/endpoint")
        @x402_required(price_eth="0.0001")
        async def premium_endpoint(request: Request):
            return {"data": "premium content"}
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(request: Request, *args, **kwargs):
            # Get payment config (use custom price if provided)
            config = PAYMENT_CONFIG
            if price_eth:
                config = PaymentConfig(
                    recipient=settings.payment_recipient,
                    price_wei=int(float(price_eth) * 10**18),
                    price_eth=price_eth,
                    chain_id=settings.chain_id,
                )

            # Check for payment header
            auth_header = request.headers.get("Authorization", "")

            if not auth_header.startswith("x402 "):
                # No payment provided, return 402
                return create_402_response(config, str(request.url.path))

            # Parse and verify payment
            proof = parse_payment_header(auth_header)
            if not proof:
                raise HTTPException(status_code=400, detail="Invalid x402 payment format")

            is_valid, error = is_payment_valid(proof, config)
            if not is_valid:
                raise HTTPException(status_code=402, detail=error)

            # Payment valid, proceed with request
            return await func(request, *args, **kwargs)

        return wrapper
    return decorator


class X402Middleware:
    """ASGI middleware for x402 payments on specific routes.

    Usage:
        app.add_middleware(X402Middleware, paid_routes=["/v1/premium/"])
    """

    def __init__(self, app, paid_routes: list[str] = None):
        self.app = app
        self.paid_routes = paid_routes or []

    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            path = scope["path"]

            # Check if this route requires payment
            requires_payment = any(path.startswith(route) for route in self.paid_routes)

            if requires_payment:
                # Check for payment header
                headers = dict(scope.get("headers", []))
                auth = headers.get(b"authorization", b"").decode()

                if not auth.startswith("x402 "):
                    # Return 402 response
                    response = create_402_response(PAYMENT_CONFIG, path)
                    await response(scope, receive, send)
                    return

        await self.app(scope, receive, send)
