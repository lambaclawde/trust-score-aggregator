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
        # agentId is uint256 in the contract
        agent_id = str(args["agentId"])

        agent = Agent(
            id=agent_id,
            owner=args["owner"],
            metadata_uri=args.get("agentURI", ""),
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

    def process_uri_updated_event(self, event):
        """Process an AgentURIUpdated event."""
        args = event["args"]
        agent_id = str(args["agentId"])

        session = get_session(self.engine)
        try:
            agent = session.query(Agent).filter_by(id=agent_id).first()
            if agent:
                agent.metadata_uri = args.get("agentURI", "")
                agent.updated_at = datetime.utcnow()
                session.commit()
                logger.info(f"URI updated for agent: {agent_id}")
            else:
                logger.warning(f"AgentURIUpdated for unknown agent: {agent_id}")
        except Exception as e:
            session.rollback()
            logger.error(f"Error processing AgentURIUpdated event: {e}")
            raise
        finally:
            session.close()

    async def fetch_events(self, from_block: int, to_block: int) -> int:
        """Fetch and process events in a block range."""
        count = 0

        # Fetch Registered events using get_logs
        try:
            events = self.contract.events.Registered.get_logs(
                from_block=from_block, to_block=to_block
            )
            for event in events:
                self.process_registered_event(event)
                count += 1
        except Exception as e:
            logger.error(f"Error fetching Registered events: {e}")

        # Fetch AgentURIUpdated events
        try:
            events = self.contract.events.AgentURIUpdated.get_logs(
                from_block=from_block, to_block=to_block
            )
            for event in events:
                self.process_uri_updated_event(event)
                count += 1
        except Exception as e:
            logger.error(f"Error fetching AgentURIUpdated events: {e}")

        return count
