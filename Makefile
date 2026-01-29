.PHONY: install dev api indexer test lint format clean docker-build docker-up docker-down

# Python
install:
	pip install -r requirements.txt

dev:
	pip install -r requirements.txt
	pip install -e ".[dev]"

api:
	python scripts/start_api.py

indexer:
	python scripts/start_indexer.py

oracle:
	python -m oracle_updater.main

scores:
	python scripts/compute_scores.py

test:
	pytest tests/ -v

lint:
	ruff check .
	black --check .

format:
	ruff check --fix .
	black .

# Frontend
frontend-install:
	cd frontend && npm install

frontend-dev:
	cd frontend && npm run dev

frontend-build:
	cd frontend && npm run build

# Contracts
contracts-install:
	cd contracts && npm install

contracts-compile:
	cd contracts && npx hardhat compile

contracts-test:
	cd contracts && npx hardhat test

contracts-deploy-sepolia:
	cd contracts && npx hardhat run scripts/deploy.ts --network sepolia

contracts-deploy-mainnet:
	cd contracts && npx hardhat run scripts/deploy.ts --network mainnet

# Docker
docker-build:
	docker-compose build

docker-up:
	docker-compose up -d

docker-down:
	docker-compose down

docker-logs:
	docker-compose logs -f

# Database
db-init:
	python -c "from indexer.models.database import init_db; init_db('sqlite:///data/trust_scores.db')"

db-reset:
	rm -f data/trust_scores.db
	make db-init

# Cleanup
clean:
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	rm -rf .pytest_cache .ruff_cache
	rm -rf frontend/node_modules frontend/dist
	rm -rf contracts/node_modules contracts/artifacts contracts/cache
