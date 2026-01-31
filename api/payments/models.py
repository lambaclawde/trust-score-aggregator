"""Payment receipt database models."""

from datetime import datetime
from sqlalchemy import (
    Column,
    String,
    Float,
    DateTime,
    Integer,
    Index,
    create_engine,
)
from sqlalchemy.orm import declarative_base, sessionmaker

Base = declarative_base()


class PaymentReceipt(Base):
    """Record of verified x402 payments."""

    __tablename__ = "payment_receipts"

    tx_hash = Column(String(66), primary_key=True)  # Transaction hash
    payer = Column(String(42), nullable=False, index=True)  # Payer address
    recipient = Column(String(42), nullable=False)  # Our wallet
    amount_wei = Column(String(78), nullable=False)  # Amount in wei (string for precision)
    amount_eth = Column(Float, nullable=False)  # Human-readable amount
    token = Column(String(10), nullable=False, default="ETH")  # ETH or USDC
    chain_id = Column(Integer, nullable=False)
    block_number = Column(Integer, nullable=False)
    endpoint = Column(String(256), nullable=True)  # API endpoint paid for
    uses_remaining = Column(Integer, nullable=False, default=1)  # Multi-use receipts
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)  # Optional expiry

    __table_args__ = (
        Index("ix_payment_receipts_payer_created", "payer", "created_at"),
    )


def get_engine(database_url: str):
    """Create database engine."""
    return create_engine(database_url, echo=False)


def get_session(engine):
    """Create database session."""
    Session = sessionmaker(bind=engine)
    return Session()


def init_payment_db(database_url: str):
    """Initialize payment tables."""
    engine = get_engine(database_url)
    Base.metadata.create_all(engine)
    return engine
