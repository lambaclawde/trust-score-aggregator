"""Trust score aggregation engine."""

import json
import logging
from collections import defaultdict
from datetime import datetime
from typing import Optional

from sqlalchemy import and_
from sqlalchemy.orm import Session

from indexer.models.database import Feedback, ComputedScore, get_session
from .time_decay import TimeDecay

logger = logging.getLogger(__name__)


class TrustScoreAggregator:
    """Aggregates feedback into trust scores."""

    def __init__(self, engine, half_life_days: int = 90):
        """
        Initialize aggregator.

        Args:
            engine: SQLAlchemy engine
            half_life_days: Time decay half-life in days
        """
        self.engine = engine
        self.time_decay = TimeDecay(half_life_days=half_life_days)

    def get_feedback_for_agent(self, agent_id: str) -> list[Feedback]:
        """Get all non-revoked feedback for an agent."""
        session = get_session(self.engine)
        try:
            feedback = (
                session.query(Feedback)
                .filter(
                    and_(
                        Feedback.subject == agent_id,
                        Feedback.revoked == False,
                    )
                )
                .order_by(Feedback.timestamp.desc())
                .all()
            )
            return feedback
        finally:
            session.close()

    def normalize_value(self, value: int, decimals: int) -> float:
        """
        Normalize feedback value to 0-100 scale.

        Assumes value is on a scale where:
        - Negative values are bad
        - 0 is neutral
        - Positive values are good
        """
        # Apply decimals
        normalized = value / (10**decimals) if decimals > 0 else value

        # Map to 0-100 scale (assuming typical range is -100 to 100)
        # Clamp to reasonable bounds
        normalized = max(-100, min(100, normalized))

        # Convert to 0-100 scale: -100 -> 0, 0 -> 50, 100 -> 100
        score = (normalized + 100) / 2

        return score

    def compute_score(
        self, agent_id: str, current_time: datetime = None
    ) -> Optional[ComputedScore]:
        """
        Compute trust score for an agent.

        Algorithm:
        1. Get all non-revoked feedback
        2. Apply time decay weighting
        3. Normalize values
        4. Aggregate by category
        5. Compute weighted average

        Args:
            agent_id: Agent identifier
            current_time: Reference time (defaults to now)

        Returns:
            ComputedScore or None if no feedback
        """
        if current_time is None:
            current_time = datetime.utcnow()

        feedback_list = self.get_feedback_for_agent(agent_id)

        if not feedback_list:
            return None

        # Track overall and per-category scores
        total_weighted_score = 0.0
        total_weight = 0.0
        positive_count = 0
        negative_count = 0

        category_scores = defaultdict(lambda: {"weighted_sum": 0.0, "weight_sum": 0.0, "count": 0})

        for feedback in feedback_list:
            # Calculate time decay weight
            weight = self.time_decay.calculate_weight(feedback.timestamp, current_time)

            # Normalize value
            normalized_score = self.normalize_value(
                feedback.value, feedback.value_decimals
            )

            # Count positive/negative
            if feedback.value > 0:
                positive_count += 1
            elif feedback.value < 0:
                negative_count += 1

            # Add to overall score
            total_weighted_score += normalized_score * weight
            total_weight += weight

            # Add to category score (using tag1 as primary category)
            if feedback.tag1 and feedback.tag1 != "0x" + "00" * 32:
                cat = feedback.tag1
                category_scores[cat]["weighted_sum"] += normalized_score * weight
                category_scores[cat]["weight_sum"] += weight
                category_scores[cat]["count"] += 1

        # Compute final scores
        overall_score = (
            total_weighted_score / total_weight if total_weight > 0 else 50.0
        )

        # Compute category scores
        category_results = {}
        for cat, data in category_scores.items():
            if data["weight_sum"] > 0:
                category_results[cat] = {
                    "score": data["weighted_sum"] / data["weight_sum"],
                    "count": data["count"],
                }

        # Create ComputedScore
        computed = ComputedScore(
            agent_id=agent_id,
            overall_score=round(overall_score, 2),
            feedback_count=len(feedback_list),
            positive_count=positive_count,
            negative_count=negative_count,
            category_scores=json.dumps(category_results),
            computed_at=current_time,
            pushed_to_chain=False,
        )

        return computed

    def compute_and_save(self, agent_id: str) -> Optional[ComputedScore]:
        """Compute and save score to database."""
        computed = self.compute_score(agent_id)

        if computed is None:
            return None

        session = get_session(self.engine)
        try:
            existing = (
                session.query(ComputedScore).filter_by(agent_id=agent_id).first()
            )
            if existing:
                existing.overall_score = computed.overall_score
                existing.feedback_count = computed.feedback_count
                existing.positive_count = computed.positive_count
                existing.negative_count = computed.negative_count
                existing.category_scores = computed.category_scores
                existing.computed_at = computed.computed_at
                existing.pushed_to_chain = False
            else:
                session.add(computed)
            session.commit()
            logger.info(f"Saved score for {agent_id}: {computed.overall_score}")
            return computed
        except Exception as e:
            session.rollback()
            logger.error(f"Error saving score: {e}")
            raise
        finally:
            session.close()

    def compute_all_scores(self) -> int:
        """Compute scores for all agents with feedback."""
        session = get_session(self.engine)
        try:
            # Get all unique subjects
            subjects = (
                session.query(Feedback.subject)
                .filter(Feedback.revoked == False)
                .distinct()
                .all()
            )

            count = 0
            for (subject,) in subjects:
                try:
                    self.compute_and_save(subject)
                    count += 1
                except Exception as e:
                    logger.error(f"Error computing score for {subject}: {e}")

            logger.info(f"Computed {count} scores")
            return count
        finally:
            session.close()

    def get_score(self, agent_id: str) -> Optional[ComputedScore]:
        """Get cached score from database."""
        session = get_session(self.engine)
        try:
            return session.query(ComputedScore).filter_by(agent_id=agent_id).first()
        finally:
            session.close()

    def get_unpushed_scores(self, limit: int = 100) -> list[ComputedScore]:
        """Get scores that haven't been pushed to chain."""
        session = get_session(self.engine)
        try:
            return (
                session.query(ComputedScore)
                .filter(ComputedScore.pushed_to_chain == False)
                .limit(limit)
                .all()
            )
        finally:
            session.close()
