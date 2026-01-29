"""Time decay functions for scoring."""

import math
from datetime import datetime, timedelta


class TimeDecay:
    """Time decay calculator for feedback weighting."""

    def __init__(self, half_life_days: int = 90):
        """
        Initialize time decay calculator.

        Args:
            half_life_days: Number of days for weight to decay to 50%
        """
        self.half_life_days = half_life_days
        # Decay constant: ln(2) / half_life
        self.decay_constant = math.log(2) / half_life_days

    def calculate_weight(self, feedback_time: datetime, current_time: datetime = None) -> float:
        """
        Calculate time-decayed weight for feedback.

        Formula: weight = 2^(-age_days / half_life)

        Args:
            feedback_time: When the feedback was given
            current_time: Reference time (defaults to now)

        Returns:
            Weight between 0 and 1
        """
        if current_time is None:
            current_time = datetime.utcnow()

        # Calculate age in days
        age = current_time - feedback_time
        age_days = age.total_seconds() / (24 * 60 * 60)

        # Exponential decay: 2^(-age/half_life)
        weight = math.pow(2, -age_days / self.half_life_days)

        return weight

    def calculate_weight_from_days(self, age_days: float) -> float:
        """
        Calculate weight from age in days.

        Args:
            age_days: Age of feedback in days

        Returns:
            Weight between 0 and 1
        """
        return math.pow(2, -age_days / self.half_life_days)

    def effective_window_days(self, min_weight: float = 0.01) -> float:
        """
        Calculate days until weight drops below threshold.

        Args:
            min_weight: Minimum weight threshold

        Returns:
            Number of days
        """
        # Solve: min_weight = 2^(-days/half_life)
        # days = -half_life * log2(min_weight)
        return -self.half_life_days * math.log2(min_weight)


# Default instance with 90-day half-life
default_decay = TimeDecay(half_life_days=90)
