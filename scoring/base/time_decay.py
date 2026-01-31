"""Time decay functions - Basic Stub.

This is a placeholder. The actual time decay algorithm
is in the trust-score-premium package.
"""

import math
from datetime import datetime


class TimeDecay:
    """Time decay calculator stub.

    For the full time decay algorithm, use the premium package.
    """

    def __init__(self, half_life_days: int = 90):
        """Initialize time decay calculator."""
        self.half_life_days = half_life_days

    def calculate_weight(self, feedback_time: datetime, current_time: datetime = None) -> float:
        """Calculate time-decayed weight.

        Stub implementation returns 1.0 (no decay).
        For actual time decay, use the premium package.
        """
        return 1.0

    def calculate_weight_from_days(self, age_days: float) -> float:
        """Calculate weight from age in days.

        Stub implementation returns 1.0 (no decay).
        """
        return 1.0


# Default instance
default_decay = TimeDecay(half_life_days=90)
