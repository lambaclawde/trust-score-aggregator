"""Tests for time decay functionality."""

import pytest
from datetime import datetime, timedelta

from scoring.base.time_decay import TimeDecay


class TestTimeDecay:
    """Tests for TimeDecay class."""

    def test_no_decay_for_current_time(self):
        """Weight should be 1.0 for feedback at current time."""
        decay = TimeDecay(half_life_days=90)
        now = datetime.utcnow()
        weight = decay.calculate_weight(now, now)
        assert abs(weight - 1.0) < 0.001

    def test_half_decay_at_half_life(self):
        """Weight should be 0.5 at half-life."""
        decay = TimeDecay(half_life_days=90)
        now = datetime.utcnow()
        past = now - timedelta(days=90)
        weight = decay.calculate_weight(past, now)
        assert abs(weight - 0.5) < 0.001

    def test_quarter_decay_at_double_half_life(self):
        """Weight should be 0.25 at 2x half-life."""
        decay = TimeDecay(half_life_days=90)
        now = datetime.utcnow()
        past = now - timedelta(days=180)
        weight = decay.calculate_weight(past, now)
        assert abs(weight - 0.25) < 0.001

    def test_custom_half_life(self):
        """Custom half-life should work correctly."""
        decay = TimeDecay(half_life_days=30)
        now = datetime.utcnow()
        past = now - timedelta(days=30)
        weight = decay.calculate_weight(past, now)
        assert abs(weight - 0.5) < 0.001

    def test_weight_from_days(self):
        """calculate_weight_from_days should match calculate_weight."""
        decay = TimeDecay(half_life_days=90)
        weight1 = decay.calculate_weight_from_days(45)

        now = datetime.utcnow()
        past = now - timedelta(days=45)
        weight2 = decay.calculate_weight(past, now)

        assert abs(weight1 - weight2) < 0.001

    def test_effective_window(self):
        """effective_window_days should return correct value."""
        decay = TimeDecay(half_life_days=90)
        # At 1% weight, should be about 598 days (log2(100) * 90)
        window = decay.effective_window_days(min_weight=0.01)
        assert 590 < window < 610

    def test_weight_always_positive(self):
        """Weight should always be positive."""
        decay = TimeDecay(half_life_days=90)
        now = datetime.utcnow()

        for days in [0, 1, 30, 90, 180, 365, 1000]:
            past = now - timedelta(days=days)
            weight = decay.calculate_weight(past, now)
            assert weight > 0
