"""Main event indexer."""

import asyncio
import logging
import signal
import sys
from datetime import datetime

from web3 import Web3

from .config import config, IDENTITY_REGISTRY_ABI, REPUTATION_REGISTRY_ABI
from .listeners import IdentityListener, ReputationListener
from .models.database import init_db, get_session, IndexerState

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


class EventIndexer:
    """Main event indexer class."""

    def __init__(self):
        self.running = False
        self.w3 = Web3(Web3.HTTPProvider(config.rpc_url))

        # Initialize database
        self.engine = init_db(config.database_url)

        # Initialize contracts
        self.identity_contract = self.w3.eth.contract(
            address=Web3.to_checksum_address(config.identity_registry),
            abi=IDENTITY_REGISTRY_ABI,
        )
        self.reputation_contract = self.w3.eth.contract(
            address=Web3.to_checksum_address(config.reputation_registry),
            abi=REPUTATION_REGISTRY_ABI,
        )

        # Initialize listeners
        self.identity_listener = IdentityListener(
            self.w3, self.identity_contract, self.engine
        )
        self.reputation_listener = ReputationListener(
            self.w3, self.reputation_contract, self.engine
        )

    def get_last_indexed_block(self) -> int:
        """Get the last indexed block number."""
        session = get_session(self.engine)
        try:
            state = session.query(IndexerState).filter_by(key="last_block").first()
            if state:
                return int(state.value)
            return config.start_block
        finally:
            session.close()

    def set_last_indexed_block(self, block_number: int):
        """Set the last indexed block number."""
        session = get_session(self.engine)
        try:
            state = session.query(IndexerState).filter_by(key="last_block").first()
            if state:
                state.value = str(block_number)
                state.updated_at = datetime.utcnow()
            else:
                state = IndexerState(key="last_block", value=str(block_number))
                session.add(state)
            session.commit()
        except Exception as e:
            session.rollback()
            logger.error(f"Error setting last indexed block: {e}")
        finally:
            session.close()

    async def index_block_range(self, from_block: int, to_block: int) -> int:
        """Index events in a block range."""
        total_events = 0

        # Process identity events
        identity_count = await self.identity_listener.fetch_events(from_block, to_block)
        total_events += identity_count

        # Process reputation events
        reputation_count = await self.reputation_listener.fetch_events(
            from_block, to_block
        )
        total_events += reputation_count

        if total_events > 0:
            logger.info(
                f"Indexed {total_events} events from blocks {from_block} to {to_block}"
            )

        return total_events

    async def run(self):
        """Run the indexer."""
        self.running = True

        # Check connection
        if not self.w3.is_connected():
            logger.error("Cannot connect to Ethereum node")
            return

        chain_id = self.w3.eth.chain_id
        logger.info(f"Connected to chain ID: {chain_id}")
        logger.info(f"Identity Registry: {config.identity_registry}")
        logger.info(f"Reputation Registry: {config.reputation_registry}")

        last_block = self.get_last_indexed_block()
        logger.info(f"Starting from block: {last_block}")

        while self.running:
            try:
                current_block = self.w3.eth.block_number

                if last_block < current_block:
                    # Process in batches
                    to_block = min(last_block + config.batch_size, current_block)

                    await self.index_block_range(last_block + 1, to_block)

                    last_block = to_block
                    self.set_last_indexed_block(last_block)

                else:
                    # Wait for new blocks
                    await asyncio.sleep(config.poll_interval)

            except Exception as e:
                logger.error(f"Indexer error: {e}")
                await asyncio.sleep(config.poll_interval)

    def stop(self):
        """Stop the indexer."""
        logger.info("Stopping indexer...")
        self.running = False


def main():
    """Entry point."""
    indexer = EventIndexer()

    # Handle shutdown signals
    def signal_handler(sig, frame):
        indexer.stop()
        sys.exit(0)

    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    # Run indexer
    asyncio.run(indexer.run())


if __name__ == "__main__":
    main()
