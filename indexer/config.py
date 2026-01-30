"""Indexer configuration."""

import os
from dataclasses import dataclass
from dotenv import load_dotenv

load_dotenv()


@dataclass
class IndexerConfig:
    """Configuration for the event indexer."""

    # Ethereum RPC
    rpc_url: str = os.getenv("RPC_URL", "https://eth.llamarpc.com")
    chain_id: int = int(os.getenv("CHAIN_ID", "1"))

    # ERC-8004 Contract addresses
    identity_registry: str = os.getenv(
        "IDENTITY_REGISTRY", "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432"
    )
    reputation_registry: str = os.getenv(
        "REPUTATION_REGISTRY", "0x8004BAa17C55a88189AE136b182e5fdA19dE9b63"
    )

    # Database
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///data/trust_scores.db")

    # Indexer settings
    start_block: int = int(os.getenv("INDEXER_START_BLOCK", "0"))
    poll_interval: int = int(os.getenv("INDEXER_POLL_INTERVAL", "12"))
    batch_size: int = int(os.getenv("INDEXER_BATCH_SIZE", "1000"))


# Contract ABIs (minimal required events) - matches ERC-8004 official contracts
IDENTITY_REGISTRY_ABI = [
    {
        "anonymous": False,
        "inputs": [
            {"indexed": True, "name": "agentId", "type": "uint256"},
            {"indexed": False, "name": "agentURI", "type": "string"},
            {"indexed": True, "name": "owner", "type": "address"},
        ],
        "name": "Registered",
        "type": "event",
    },
    {
        "anonymous": False,
        "inputs": [
            {"indexed": True, "name": "agentId", "type": "uint256"},
            {"indexed": False, "name": "agentURI", "type": "string"},
        ],
        "name": "AgentURIUpdated",
        "type": "event",
    },
]

REPUTATION_REGISTRY_ABI = [
    {
        "anonymous": False,
        "inputs": [
            {"indexed": True, "name": "agentId", "type": "uint256"},
            {"indexed": True, "name": "clientAddress", "type": "address"},
            {"indexed": False, "name": "feedbackIndex", "type": "uint64"},
            {"indexed": False, "name": "value", "type": "int128"},
            {"indexed": False, "name": "valueDecimals", "type": "uint8"},
            {"indexed": True, "name": "indexedTag1", "type": "string"},
            {"indexed": False, "name": "tag1", "type": "string"},
            {"indexed": False, "name": "tag2", "type": "string"},
            {"indexed": False, "name": "endpoint", "type": "string"},
            {"indexed": False, "name": "feedbackURI", "type": "string"},
            {"indexed": False, "name": "feedbackHash", "type": "bytes32"},
        ],
        "name": "NewFeedback",
        "type": "event",
    },
    {
        "anonymous": False,
        "inputs": [
            {"indexed": True, "name": "agentId", "type": "uint256"},
            {"indexed": True, "name": "clientAddress", "type": "address"},
            {"indexed": True, "name": "feedbackIndex", "type": "uint64"},
        ],
        "name": "FeedbackRevoked",
        "type": "event",
    },
]


config = IndexerConfig()
