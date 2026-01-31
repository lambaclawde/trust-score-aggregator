# Trust Score Aggregator

An open-source trust score aggregation system for ERC-8004 agents on Ethereum. Indexes reputation feedback from on-chain registries and computes weighted trust scores.

## Features

- **Event Indexer**: Listens to IdentityRegistry and ReputationRegistry events
- **Scoring Engine**: Time-decayed weighted aggregation of feedback
- **REST API**: Query agent trust scores programmatically
- **Premium API**: x402 payment-gated advanced endpoints
- **On-chain Oracle**: Smart contract for paid score queries
- **Frontend**: Score lookup, leaderboard, and API documentation

## Architecture

```
Ethereum Mainnet (ERC-8004 Registries)
         |
         v
  Event Indexer (Python/web3.py)
         |
         v
   SQLite/PostgreSQL
         |
   +-----+-----+------+
   v           v      v
Scoring     REST    Oracle
Engine      API     Updater
              |
              v
          Frontend
       (React + Vite)
```

## Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+ (for contracts and frontend)
- An Ethereum RPC endpoint (Alchemy, Infura, etc.)

### Installation

```bash
# Clone the repository
git clone https://github.com/lambaclawde/trust-score-aggregator.git
cd trust-score-aggregator

# Create virtual environment
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows

# Install Python dependencies
pip install -r requirements.txt

# Copy environment config
cp .env.example .env
# Edit .env with your RPC URL
```

### Run the Indexer

```bash
python scripts/start_indexer.py
```

The indexer will sync from the start block and poll for new events.

### Run the API

```bash
python scripts/start_api.py
```

API available at `http://localhost:8000`.

### Run the Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend available at `http://localhost:3000`.

## API Endpoints

### Free Tier

| Endpoint | Description |
|----------|-------------|
| `GET /v1/agents` | List all agents |
| `GET /v1/agents/{id}` | Get agent info |
| `GET /v1/agents/{id}/score` | Get basic trust score |
| `GET /v1/agents/{id}/feedback` | Get feedback history |
| `GET /v1/agents/stats` | Get global statistics |
| `GET /health` | Health check |
| `GET /health/ready` | Readiness check |
| `GET /health/live` | Liveness check |

### Premium Tier (x402 Payment Required)

| Endpoint | Price | Description |
|----------|-------|-------------|
| `GET /v1/premium/agents/{id}/score/full` | 0.0001 ETH | Full score with categories |
| `POST /v1/premium/batch/scores` | 0.0005 ETH | Batch score lookup (up to 50) |
| `GET /v1/premium/leaderboard` | 0.0002 ETH | Top agents by score |
| `GET /v1/premium/agents/{id}/analytics` | 0.0003 ETH | Detailed agent analytics |

### x402 Payment Protocol

Premium endpoints return HTTP 402 with payment instructions:

```json
{
  "error": "Payment Required",
  "payment": {
    "recipient": "0x...",
    "amount": 100000000000000,
    "chain_id": 1,
    "token": "ETH"
  }
}
```

To authenticate after payment:
1. Send ETH to the recipient address
2. Sign: `x402-payment:{tx_hash}:{recipient}:{amount}:{timestamp}`
3. Add header: `Authorization: x402 {tx_hash}:{your_address}:{amount}:{timestamp}:{signature}`

## Production Deployment

### Environment Variables

See `.env.example` for all options. Key production settings:

```bash
ENVIRONMENT=production
DEBUG=false
CORS_ORIGINS=https://yourdomain.com
DATABASE_URL=postgresql://user:pass@host:5432/dbname
REDIS_URL=redis://localhost:6379/0  # For distributed rate limiting
WORKERS=4
```

### Security Checklist

- [ ] Never commit `.env` files with secrets
- [ ] Use secrets manager for private keys
- [ ] Set `ENVIRONMENT=production`
- [ ] Configure specific `CORS_ORIGINS`
- [ ] Use PostgreSQL (not SQLite) for production
- [ ] Set up Redis for distributed rate limiting
- [ ] Enable HTTPS via reverse proxy

### Deployment Options

**Railway/Render:**
```bash
# Set environment variables in dashboard
# Deploy via GitHub integration
```

**Docker:**
```bash
docker build -t trust-score-api .
docker run -p 8000:8000 --env-file .env trust-score-api
```

**Manual:**
```bash
# Install gunicorn
pip install gunicorn

# Run with workers
gunicorn api.main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000
```

## On-chain Oracle

The `TrustScoreOracle` contract provides paid on-chain score queries:

- `getScore(agentId)` - Query score for 0.001 ETH
- `getScoreBatch(agentIds[])` - Batch query
- `updateScore(agentId, score)` - Owner only

Revenue flows to the contract owner.

### Deploy Contract

```bash
cd contracts
npm install
npx hardhat run scripts/deploy.ts --network mainnet
```

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

Scores are normalized to 0-100 scale.

## Configuration

See `.env.example` for all configuration options including:

- RPC endpoints
- Contract addresses (mainnet and Sepolia)
- API settings
- Indexer settings
- Rate limits
- Payment configuration

## ERC-8004 Contract Addresses

**Mainnet:**
- IdentityRegistry: `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`
- ReputationRegistry: `0x8004BAa17C55a88189AE136b182e5fdA19dE9b63`

**Sepolia:**
- IdentityRegistry: `0x8004A818BFB912233c491871b3d84c89A494BD9e`
- ReputationRegistry: `0x8004B663056A597Dffe9eCcC1965A193B7388713`

## License

MIT License - see LICENSE file.

## Contributing

Contributions welcome! Please open an issue or PR.
