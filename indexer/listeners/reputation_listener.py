"""Reputation Registry event listener."""

import logging
from datetime import datetime
from web3 import Web3
from web3.contract import Contract

from ..models.database import Feedback, get_session

logger = logging.getLogger(__name__)


def bytes32_to_hex(value) -> str:
    """Convert bytes32 to hex string."""
    if isinstance(value, bytes):
        return "0x" + value.hex()
    if isinstance(value, str) and not value.startswith("0x"):
        return "0x" + value
    return value


class ReputationListener:
    """Listens to ReputationRegistry events."""

    def __init__(self, w3: Web3, contract: Contract, engine):
        self.w3 = w3
        self.contract = contract
        self.engine = engine

    def process_new_feedback_event(self, event) -> Feedback:
        """Process a NewFeedback event."""
        args = event["args"]

        feedback_id = bytes32_to_hex(args["feedbackId"])
        subject = bytes32_to_hex(args["subject"])
        author = bytes32_to_hex(args["author"])

        # Get block timestamp
        block = self.w3.eth.get_block(event["blockNumber"])
        timestamp = datetime.utcfromtimestamp(block["timestamp"])

        feedback = Feedback(
            id=feedback_id,
            subject=subject,
            author=author,
            tag1=bytes32_to_hex(args.get("tag1", b"\x00" * 32)) if args.get("tag1") else None,
            tag2=bytes32_to_hex(args.get("tag2", b"\x00" * 32)) if args.get("tag2") else None,
            tag3=bytes32_to_hex(args.get("tag3", b"\x00" * 32)) if args.get("tag3") else None,
            value=args["value"],
            value_decimals=args.get("valueDecimals", 0),
            comment=args.get("comment", ""),
            revoked=False,
            block_number=event["blockNumber"],
            tx_hash=bytes32_to_hex(event["transactionHash"]),
            timestamp=timestamp,
        )

        session = get_session(self.engine)
        try:
            existing = session.query(Feedback).filter_by(id=feedback_id).first()
            if existing:
                logger.warning(f"Duplicate feedback ID: {feedback_id}")
            else:
                session.add(feedback)
                logger.info(
                    f"New feedback: {feedback_id} for subject {subject} value={args['value']}"
                )
            session.commit()
        except Exception as e:
            session.rollback()
            logger.error(f"Error processing NewFeedback event: {e}")
            raise
        finally:
            session.close()

        return feedback

    def process_feedback_revoked_event(self, event):
        """Process a FeedbackRevoked event."""
        args = event["args"]
        feedback_id = bytes32_to_hex(args["feedbackId"])

        session = get_session(self.engine)
        try:
            feedback = session.query(Feedback).filter_by(id=feedback_id).first()
            if feedback:
                feedback.revoked = True
                session.commit()
                logger.info(f"Feedback revoked: {feedback_id}")
            else:
                logger.warning(f"Revoked unknown feedback: {feedback_id}")
        except Exception as e:
            session.rollback()
            logger.error(f"Error processing FeedbackRevoked event: {e}")
            raise
        finally:
            session.close()

    async def fetch_events(self, from_block: int, to_block: int) -> int:
        """Fetch and process events in a block range."""
        count = 0

        # Fetch NewFeedback events
        try:
            feedback_filter = self.contract.events.NewFeedback.create_filter(
                fromBlock=from_block, toBlock=to_block
            )
            for event in feedback_filter.get_all_entries():
                self.process_new_feedback_event(event)
                count += 1
        except Exception as e:
            logger.error(f"Error fetching NewFeedback events: {e}")

        # Fetch FeedbackRevoked events
        try:
            revoked_filter = self.contract.events.FeedbackRevoked.create_filter(
                fromBlock=from_block, toBlock=to_block
            )
            for event in revoked_filter.get_all_entries():
                self.process_feedback_revoked_event(event)
                count += 1
        except Exception as e:
            logger.error(f"Error fetching FeedbackRevoked events: {e}")

        return count
