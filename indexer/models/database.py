"""SQLAlchemy database models."""

from datetime import datetime
from sqlalchemy import (
    Column,
    String,
    Integer,
    Float,
    Boolean,
    DateTime,
    Text,
    Index,
    create_engine,
)
from sqlalchemy.orm import declarative_base, sessionmaker

Base = declarative_base()


class Agent(Base):
    """Registered ERC-8004 agent."""

    __tablename__ = "agents"

    id = Column(String(66), primary_key=True)  # bytes32 hex
    owner = Column(String(42), nullable=False)  # address
    metadata_uri = Column(Text, nullable=True)
    block_number = Column(Integer, nullable=False)
    tx_hash = Column(String(66), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (Index("ix_agents_owner", "owner"),)


class Feedback(Base):
    """Reputation feedback entry."""

    __tablename__ = "feedback"

    id = Column(String(66), primary_key=True)  # feedbackId bytes32
    subject = Column(String(66), nullable=False, index=True)  # agent being rated
    author = Column(String(66), nullable=False, index=True)  # who gave feedback
    tag1 = Column(String(66), nullable=True)  # category tag
    tag2 = Column(String(66), nullable=True)
    tag3 = Column(String(66), nullable=True)
    value = Column(Integer, nullable=False)  # raw value
    value_decimals = Column(Integer, nullable=False, default=0)
    comment = Column(Text, nullable=True)
    revoked = Column(Boolean, default=False, index=True)
    block_number = Column(Integer, nullable=False)
    tx_hash = Column(String(66), nullable=False)
    timestamp = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index("ix_feedback_subject_revoked", "subject", "revoked"),
        Index("ix_feedback_timestamp", "timestamp"),
    )


class ComputedScore(Base):
    """Computed trust score for an agent."""

    __tablename__ = "computed_scores"

    agent_id = Column(String(66), primary_key=True)
    overall_score = Column(Float, nullable=False)  # 0-100
    feedback_count = Column(Integer, nullable=False, default=0)
    positive_count = Column(Integer, nullable=False, default=0)
    negative_count = Column(Integer, nullable=False, default=0)
    category_scores = Column(Text, nullable=True)  # JSON string
    computed_at = Column(DateTime, default=datetime.utcnow)
    pushed_to_chain = Column(Boolean, default=False)
    pushed_at = Column(DateTime, nullable=True)

    __table_args__ = (Index("ix_computed_scores_pushed", "pushed_to_chain"),)


class IndexerState(Base):
    """Indexer state tracking."""

    __tablename__ = "indexer_state"

    key = Column(String(64), primary_key=True)
    value = Column(Text, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


def get_engine(database_url: str):
    """Create database engine."""
    return create_engine(database_url, echo=False)


def get_session(engine):
    """Create database session."""
    Session = sessionmaker(bind=engine)
    return Session()


def init_db(database_url: str):
    """Initialize database tables."""
    engine = get_engine(database_url)
    Base.metadata.create_all(engine)
    return engine
