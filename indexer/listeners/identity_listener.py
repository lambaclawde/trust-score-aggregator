"""Identity Registry event listener."""

import logging
from datetime import datetime
from web3 import Web3
from web3.contract import Contract

from ..models.database import Agent, get_session

logger = logging.getLogger(__name__)


class IdentityListener:
    """Listens to IdentityRegistry events."""

    def __init__(self, w3: Web3, contract: Contract, engine):
        self.w3 = w3
        self.contract = contract
        self.engine = engine

    def process_registered_event(self, event) -> Agent:
        """Process a Registered event."""
        args = event["args"]
        agent_id = args["id"].hex() if isinstance(args["id"], bytes) else args["id"]

        # Ensure proper formatting
        if not agent_id.startswith("0x"):
            agent_id = "0x" + agent_id

        agent = Agent(
            id=agent_id,
            owner=args["owner"],
            metadata_uri=args.get("metadataURI", ""),
            block_number=event["blockNumber"],
            tx_hash=event["transactionHash"].hex()
            if isinstance(event["transactionHash"], bytes)
            else event["transactionHash"],
        )

        session = get_session(self.engine)
        try:
            existing = session.query(Agent).filter_by(id=agent_id).first()
            if existing:
                existing.metadata_uri = agent.metadata_uri
                existing.updated_at = datetime.utcnow()
                logger.info(f"Updated agent: {agent_id}")
            else:
                session.add(agent)
                logger.info(f"New agent registered: {agent_id}")
            session.commit()
        except Exception as e:
            session.rollback()
            logger.error(f"Error processing Registered event: {e}")
            raise
        finally:
            session.close()

        return agent

    def process_metadata_updated_event(self, event):
        """Process a MetadataUpdated event."""
        args = event["args"]
        agent_id = args["id"].hex() if isinstance(args["id"], bytes) else args["id"]

        if not agent_id.startswith("0x"):
            agent_id = "0x" + agent_id

        session = get_session(self.engine)
        try:
            agent = session.query(Agent).filter_by(id=agent_id).first()
            if agent:
                agent.metadata_uri = args.get("metadataURI", "")
                agent.updated_at = datetime.utcnow()
                session.commit()
                logger.info(f"Metadata updated for agent: {agent_id}")
            else:
                logger.warning(f"MetadataUpdated for unknown agent: {agent_id}")
        except Exception as e:
            session.rollback()
            logger.error(f"Error processing MetadataUpdated event: {e}")
            raise
        finally:
            session.close()

    async def fetch_events(self, from_block: int, to_block: int) -> int:
        """Fetch and process events in a block range."""
        count = 0

        # Fetch Registered events
        try:
            registered_filter = self.contract.events.Registered.create_filter(
                fromBlock=from_block, toBlock=to_block
            )
            for event in registered_filter.get_all_entries():
                self.process_registered_event(event)
                count += 1
        except Exception as e:
            logger.error(f"Error fetching Registered events: {e}")

        # Fetch MetadataUpdated events
        try:
            metadata_filter = self.contract.events.MetadataUpdated.create_filter(
                fromBlock=from_block, toBlock=to_block
            )
            for event in metadata_filter.get_all_entries():
                self.process_metadata_updated_event(event)
                count += 1
        except Exception as e:
            logger.error(f"Error fetching MetadataUpdated events: {e}")

        return count
