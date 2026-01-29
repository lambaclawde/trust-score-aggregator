"""Oracle updater - pushes trust scores on-chain."""

import json
import logging
import os
import time
from datetime import datetime
from typing import Optional

from dotenv import load_dotenv
from web3 import Web3
from eth_account import Account

from indexer.models.database import ComputedScore, get_session, init_db
from scoring import TrustScoreAggregator

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Oracle contract ABI (minimal for updates)
ORACLE_ABI = [
    {
        "inputs": [
            {"internalType": "bytes32", "name": "agentId", "type": "bytes32"},
            {"internalType": "uint256", "name": "score", "type": "uint256"},
        ],
        "name": "updateScore",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
    },
    {
        "inputs": [
            {"internalType": "bytes32[]", "name": "agentIds", "type": "bytes32[]"},
            {"internalType": "uint256[]", "name": "newScores", "type": "uint256[]"},
        ],
        "name": "updateScoreBatch",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
    },
    {
        "inputs": [{"internalType": "bytes32", "name": "agentId", "type": "bytes32"}],
        "name": "getScoreView",
        "outputs": [
            {"internalType": "uint256", "name": "score", "type": "uint256"},
            {"internalType": "uint256", "name": "lastUpdated", "type": "uint256"},
            {"internalType": "bool", "name": "exists", "type": "bool"},
        ],
        "stateMutability": "view",
        "type": "function",
    },
]


class OracleUpdater:
    """Updates trust scores on the TrustScoreOracle contract."""

    def __init__(
        self,
        rpc_url: str,
        oracle_address: str,
        private_key: str,
        database_url: str,
        batch_size: int = 50,
        min_score_change: float = 1.0,
    ):
        """
        Initialize oracle updater.

        Args:
            rpc_url: Ethereum RPC URL
            oracle_address: TrustScoreOracle contract address
            private_key: Private key for signing transactions
            database_url: SQLAlchemy database URL
            batch_size: Maximum scores per batch update
            min_score_change: Minimum score change to trigger update
        """
        self.w3 = Web3(Web3.HTTPProvider(rpc_url))
        self.account = Account.from_key(private_key)
        self.batch_size = batch_size
        self.min_score_change = min_score_change

        # Initialize contract
        self.contract = self.w3.eth.contract(
            address=Web3.to_checksum_address(oracle_address),
            abi=ORACLE_ABI,
        )

        # Initialize database
        self.engine = init_db(database_url)
        self.aggregator = TrustScoreAggregator(self.engine)

    def score_to_chain_value(self, score: float) -> int:
        """Convert 0-100 score to 0-10000 on-chain value."""
        return int(score * 100)

    def get_on_chain_score(self, agent_id: str) -> Optional[int]:
        """Get current score from chain."""
        try:
            agent_bytes = bytes.fromhex(agent_id[2:] if agent_id.startswith("0x") else agent_id)
            score, last_updated, exists = self.contract.functions.getScoreView(
                agent_bytes
            ).call()
            if exists:
                return score
            return None
        except Exception as e:
            logger.error(f"Error fetching on-chain score for {agent_id}: {e}")
            return None

    def should_update(self, agent_id: str, new_score: float) -> bool:
        """Check if score should be updated based on change threshold."""
        on_chain = self.get_on_chain_score(agent_id)
        if on_chain is None:
            return True

        # Convert on-chain value back to 0-100 scale
        current_score = on_chain / 100

        return abs(new_score - current_score) >= self.min_score_change

    def update_single(self, agent_id: str, score: float) -> Optional[str]:
        """Update a single score on-chain."""
        try:
            agent_bytes = bytes.fromhex(agent_id[2:] if agent_id.startswith("0x") else agent_id)
            chain_score = self.score_to_chain_value(score)

            # Build transaction
            tx = self.contract.functions.updateScore(
                agent_bytes, chain_score
            ).build_transaction(
                {
                    "from": self.account.address,
                    "nonce": self.w3.eth.get_transaction_count(self.account.address),
                    "gas": 100000,
                    "maxFeePerGas": self.w3.eth.gas_price * 2,
                    "maxPriorityFeePerGas": self.w3.to_wei(1, "gwei"),
                }
            )

            # Sign and send
            signed = self.account.sign_transaction(tx)
            tx_hash = self.w3.eth.send_raw_transaction(signed.raw_transaction)

            logger.info(f"Sent update for {agent_id}: score={score}, tx={tx_hash.hex()}")
            return tx_hash.hex()

        except Exception as e:
            logger.error(f"Error updating score for {agent_id}: {e}")
            return None

    def update_batch(self, updates: list[tuple[str, float]]) -> Optional[str]:
        """Update multiple scores in a single transaction."""
        if not updates:
            return None

        try:
            agent_bytes_list = []
            scores_list = []

            for agent_id, score in updates:
                agent_bytes = bytes.fromhex(
                    agent_id[2:] if agent_id.startswith("0x") else agent_id
                )
                agent_bytes_list.append(agent_bytes)
                scores_list.append(self.score_to_chain_value(score))

            # Build transaction
            tx = self.contract.functions.updateScoreBatch(
                agent_bytes_list, scores_list
            ).build_transaction(
                {
                    "from": self.account.address,
                    "nonce": self.w3.eth.get_transaction_count(self.account.address),
                    "gas": 50000 + 30000 * len(updates),  # Base + per-update gas
                    "maxFeePerGas": self.w3.eth.gas_price * 2,
                    "maxPriorityFeePerGas": self.w3.to_wei(1, "gwei"),
                }
            )

            # Sign and send
            signed = self.account.sign_transaction(tx)
            tx_hash = self.w3.eth.send_raw_transaction(signed.raw_transaction)

            logger.info(f"Sent batch update for {len(updates)} agents, tx={tx_hash.hex()}")
            return tx_hash.hex()

        except Exception as e:
            logger.error(f"Error in batch update: {e}")
            return None

    def mark_pushed(self, agent_ids: list[str]):
        """Mark scores as pushed to chain."""
        session = get_session(self.engine)
        try:
            for agent_id in agent_ids:
                score = session.query(ComputedScore).filter_by(agent_id=agent_id).first()
                if score:
                    score.pushed_to_chain = True
                    score.pushed_at = datetime.utcnow()
            session.commit()
        except Exception as e:
            session.rollback()
            logger.error(f"Error marking scores as pushed: {e}")
        finally:
            session.close()

    def run_update_cycle(self) -> int:
        """
        Run a single update cycle.

        Returns number of scores updated.
        """
        # First, recompute all scores
        logger.info("Recomputing all scores...")
        self.aggregator.compute_all_scores()

        # Get unpushed scores
        unpushed = self.aggregator.get_unpushed_scores(limit=self.batch_size * 10)
        logger.info(f"Found {len(unpushed)} unpushed scores")

        # Filter by change threshold
        updates_needed = []
        for score in unpushed:
            if self.should_update(score.agent_id, score.overall_score):
                updates_needed.append((score.agent_id, score.overall_score))

        logger.info(f"{len(updates_needed)} scores need updating (above threshold)")

        if not updates_needed:
            return 0

        # Update in batches
        updated_count = 0
        for i in range(0, len(updates_needed), self.batch_size):
            batch = updates_needed[i : i + self.batch_size]

            tx_hash = self.update_batch(batch)
            if tx_hash:
                # Wait for confirmation
                try:
                    receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
                    if receipt["status"] == 1:
                        agent_ids = [aid for aid, _ in batch]
                        self.mark_pushed(agent_ids)
                        updated_count += len(batch)
                        logger.info(f"Batch confirmed: {len(batch)} scores updated")
                    else:
                        logger.error(f"Batch transaction failed: {tx_hash}")
                except Exception as e:
                    logger.error(f"Error waiting for transaction: {e}")

            # Small delay between batches
            time.sleep(2)

        return updated_count

    def run_daemon(self, interval_hours: float = 6):
        """Run as a daemon, updating periodically."""
        logger.info(f"Starting oracle updater daemon (interval: {interval_hours}h)")

        while True:
            try:
                updated = self.run_update_cycle()
                logger.info(f"Update cycle complete: {updated} scores pushed")
            except Exception as e:
                logger.error(f"Error in update cycle: {e}")

            # Sleep until next cycle
            sleep_seconds = interval_hours * 3600
            logger.info(f"Sleeping for {interval_hours} hours...")
            time.sleep(sleep_seconds)


def main():
    """Entry point."""
    rpc_url = os.getenv("RPC_URL", "https://eth.llamarpc.com")
    oracle_address = os.getenv("ORACLE_CONTRACT")
    private_key = os.getenv("ORACLE_OWNER_KEY")
    database_url = os.getenv("DATABASE_URL", "sqlite:///data/trust_scores.db")

    if not oracle_address:
        logger.error("ORACLE_CONTRACT not set in environment")
        return

    if not private_key:
        logger.error("ORACLE_OWNER_KEY not set in environment")
        return

    updater = OracleUpdater(
        rpc_url=rpc_url,
        oracle_address=oracle_address,
        private_key=private_key,
        database_url=database_url,
    )

    # Run single cycle or daemon based on args
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == "--daemon":
        interval = float(sys.argv[2]) if len(sys.argv) > 2 else 6
        updater.run_daemon(interval_hours=interval)
    else:
        updater.run_update_cycle()


if __name__ == "__main__":
    main()
