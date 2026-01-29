# Contributing to Trust Score Aggregator

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Set up the development environment:

```bash
# Python dependencies
make dev

# Frontend dependencies
make frontend-install

# Contract dependencies
make contracts-install
```

## Development Workflow

### Running Locally

```bash
# Start the API server
make api

# Start the indexer (separate terminal)
make indexer

# Start the frontend (separate terminal)
make frontend-dev
```

### Code Style

- Python: We use `ruff` for linting and `black` for formatting
- TypeScript: Standard ESLint configuration
- Solidity: Follow the official Solidity style guide

Run linting:
```bash
make lint
```

Format code:
```bash
make format
```

### Testing

```bash
# Python tests
make test

# Contract tests
make contracts-test
```

## Pull Request Process

1. Create a feature branch from `main`
2. Make your changes
3. Ensure all tests pass
4. Update documentation if needed
5. Submit a pull request

### Commit Messages

Use clear, descriptive commit messages:
- `feat: Add batch score endpoint`
- `fix: Handle revoked feedback correctly`
- `docs: Update API documentation`
- `refactor: Simplify scoring algorithm`

## Project Structure

```
trust-score-aggregator/
├── api/              # REST API (FastAPI)
├── contracts/        # Solidity smart contracts
├── frontend/         # React frontend
├── indexer/          # Blockchain event indexer
├── oracle_updater/   # On-chain score pusher
├── scoring/          # Trust score algorithms
└── scripts/          # CLI utilities
```

## Questions?

Open an issue or reach out on GitHub.
