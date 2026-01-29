# Trust Score Aggregator

An open-source trust score aggregation system for ERC-8004 agents on Ethereum. Indexes reputation feedback from on-chain registries and computes weighted trust scores.

## Features

- **Event Indexer**: Listens to IdentityRegistry and ReputationRegistry events
- **Scoring Engine**: Time-decayed weighted aggregation of feedback
- **REST API**: Query agent trust scores programmatically
- **On-chain Oracle**: Smart contract for paid score queries
- **Frontend**: Score lookup, leaderboard, and API documentation

## Architecture

```
Ethereum Mainnet (ERC-8004 Registries)
            │
            ▼
    Event Indexer (Python)
            │
            ▼
    SQLite Database
            │
    ┌───────┼───────┐
    ▼       ▼       ▼
Scoring   REST    Oracle
Engine    API     Updater
            │
            ▼
        Frontend
    (React + Vite)
```

## Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+ (for contracts)
- An Ethereum RPC endpoint

### Installation

```bash
# Clone the repository
git clone https://github.com/lambaclawde/trust-score-aggregator.git
cd trust-score-aggregator

# Install Python dependencies
pip install -r requirements.txt

# Copy environment config
cp .env.example .env
# Edit .env with your RPC URL and keys
```

### Run the Indexer

```bash
python scripts/start_indexer.py
```

### Run the API

```bash
python scripts/start_api.py
```

### Run the Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:3000`.

### Deploy the Oracle Contract

```bash
cd contracts
npm install
npx hardhat run scripts/deploy.ts --network sepolia
```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /v1/agents/{id}` | Get agent info |
| `GET /v1/agents/{id}/score` | Get trust score |
| `GET /v1/agents/{id}/feedback` | Get feedback history |
| `GET /health` | Health check |

## On-chain Oracle

The `TrustScoreOracle` contract provides paid on-chain score queries:

- `getScore(agentId)` - Query score for 0.001 ETH
- `getScoreBatch(agentIds[])` - Batch query

Revenue flows to the contract owner.

## Scoring Algorithm

1. Index all feedback events from ReputationRegistry
2. Filter out revoked feedback
3. Apply time decay (half-life = 90 days)
4. Normalize by valueDecimals
5. Aggregate by category
6. Compute weighted average

```
weight = 2^(-age_days / 90)
score = sum(value * weight) / sum(weight)
```

## Configuration

See `.env.example` for all configuration options.

## License

MIT License - see LICENSE file.

## Contributing

Contributions welcome! Please open an issue or PR.
