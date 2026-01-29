"""Tests for scoring functionality."""

import pytest
from datetime import datetime, timedelta

from scoring.base.aggregator import TrustScoreAggregator
from indexer.models.database import Base, Feedback, Agent


class TestTrustScoreAggregator:
    """Tests for TrustScoreAggregator class."""

    def test_normalize_positive_value(self):
        """Positive values should normalize above 50."""
        from indexer.models.database import init_db
        engine = init_db("sqlite:///:memory:")
        aggregator = TrustScoreAggregator(engine)

        score = aggregator.normalize_value(100, 0)
        assert score == 100.0

        score = aggregator.normalize_value(50, 0)
        assert score == 75.0

    def test_normalize_negative_value(self):
        """Negative values should normalize below 50."""
        from indexer.models.database import init_db
        engine = init_db("sqlite:///:memory:")
        aggregator = TrustScoreAggregator(engine)

        score = aggregator.normalize_value(-100, 0)
        assert score == 0.0

        score = aggregator.normalize_value(-50, 0)
        assert score == 25.0

    def test_normalize_zero_value(self):
        """Zero should normalize to 50 (neutral)."""
        from indexer.models.database import init_db
        engine = init_db("sqlite:///:memory:")
        aggregator = TrustScoreAggregator(engine)

        score = aggregator.normalize_value(0, 0)
        assert score == 50.0

    def test_normalize_with_decimals(self):
        """Values with decimals should be scaled correctly."""
        from indexer.models.database import init_db
        engine = init_db("sqlite:///:memory:")
        aggregator = TrustScoreAggregator(engine)

        # 1000 with 1 decimal = 100
        score = aggregator.normalize_value(1000, 1)
        assert score == 100.0

        # 500 with 1 decimal = 50
        score = aggregator.normalize_value(500, 1)
        assert score == 75.0

    def test_normalize_clamps_extreme_values(self):
        """Extreme values should be clamped to -100 to 100 range."""
        from indexer.models.database import init_db
        engine = init_db("sqlite:///:memory:")
        aggregator = TrustScoreAggregator(engine)

        score = aggregator.normalize_value(500, 0)
        assert score == 100.0

        score = aggregator.normalize_value(-500, 0)
        assert score == 0.0

    def test_no_feedback_returns_none(self):
        """No feedback should return None."""
        from indexer.models.database import init_db
        engine = init_db("sqlite:///:memory:")
        aggregator = TrustScoreAggregator(engine)

        result = aggregator.compute_score("0x" + "00" * 32)
        assert result is None
