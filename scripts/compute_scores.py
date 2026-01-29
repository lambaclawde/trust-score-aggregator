#!/usr/bin/env python3
"""Compute all trust scores."""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

from indexer.models.database import init_db
from scoring import TrustScoreAggregator


def main():
    database_url = os.getenv("DATABASE_URL", "sqlite:///data/trust_scores.db")

    print(f"Initializing database: {database_url}")
    engine = init_db(database_url)

    print("Computing all scores...")
    aggregator = TrustScoreAggregator(engine)
    count = aggregator.compute_all_scores()

    print(f"Computed {count} scores")


if __name__ == "__main__":
    main()
