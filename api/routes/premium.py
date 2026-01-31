"""Premium API endpoints - x402 Paid Features.

These endpoints require ETH micropayments via the x402 protocol.
"""

import json
import logging
from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Request, HTTPException, Query
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from ..middleware.x402 import x402_required
from ..middleware.rate_limit import limiter, BASIC_LIMIT
from ..utils.validation import validate_agent_id
from ..config import settings
from indexer.models.database import (
    ComputedScore, Feedback, Agent,
    get_session, get_engine
)
from indexer.models.schemas import ScoreSchema, CategoryScore
from scoring import TrustScoreAggregator

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/v1/premium", tags=["premium"])

# Lazy engine initialization
_engine = None


def get_db_engine():
    global _engine
    if _engine is None:
        _engine = get_engine(settings.database_url)
    return _engine


def computed_to_schema(computed: ComputedScore) -> ScoreSchema:
    """Convert ComputedScore to ScoreSchema."""
    categories = []
    if computed.category_scores:
        try:
            cat_data = json.loads(computed.category_scores)
            for cat_id, data in cat_data.items():
                categories.append(
                    CategoryScore(
                        category=cat_id,
                        score=round(data["score"], 2),
                        count=data["count"],
                    )
                )
        except (json.JSONDecodeError, KeyError):
            pass

    return ScoreSchema(
        agent_id=computed.agent_id,
        overall_score=computed.overall_score,
        feedback_count=computed.feedback_count,
        positive_count=computed.positive_count,
        negative_count=computed.negative_count,
        categories=categories,
        computed_at=computed.computed_at,
    )


# Response Models

class FullScoreResponse(BaseModel):
    """Full score with category breakdown."""
    agent_id: str
    overall_score: float
    feedback_count: int
    positive_count: int
    negative_count: int
    categories: list
    computed_at: datetime
    time_series: Optional[list] = None


class BatchScoreItem(BaseModel):
    """Single item in batch score response."""
    agent_id: str
    score: float
    feedback_count: int
    positive_count: int
    negative_count: int


class BatchScoreResponse(BaseModel):
    """Batch score response."""
    scores: List[BatchScoreItem]
    not_found: List[str]
    total_requested: int


class LeaderboardEntry(BaseModel):
    """Leaderboard entry."""
    rank: int
    agent_id: str
    owner: Optional[str]
    overall_score: float
    feedback_count: int
    positive_count: int
    negative_count: int


class LeaderboardResponse(BaseModel):
    """Leaderboard response."""
    entries: List[LeaderboardEntry]
    total_agents: int
    updated_at: datetime


class AnalyticsResponse(BaseModel):
    """Agent analytics response."""
    agent_id: str
    overall_score: float
    score_trend: str  # "rising", "falling", "stable"
    trend_percentage: float
    feedback_count: int
    positive_ratio: float
    recent_feedback: List[dict]
    category_breakdown: List[dict]
    computed_at: datetime


class BatchScoreRequest(BaseModel):
    """Batch score request body."""
    agent_ids: List[str]


# Endpoints

@router.get("/agents/{agent_id}/score/full")
@x402_required(price_eth="0.0001")
async def get_full_score(request: Request, agent_id: str):
    """
    Get full trust score with category breakdown.

    Requires: 0.0001 ETH payment

    Returns detailed score with:
    - Overall score (0-100)
    - Category breakdown
    - Positive/negative counts
    - Historical data
    """
    validated_id = validate_agent_id(agent_id)

    engine = get_db_engine()
    session = get_session(engine)

    try:
        computed = session.query(ComputedScore).filter_by(agent_id=validated_id).first()

        if not computed:
            # Try to compute on-demand
            aggregator = TrustScoreAggregator(engine)
            computed = aggregator.compute_and_save(validated_id)

            if not computed:
                raise HTTPException(status_code=404, detail="No feedback found for agent")

        # Parse category scores
        categories = []
        if computed.category_scores:
            try:
                cat_data = json.loads(computed.category_scores)
                for cat_id, data in cat_data.items():
                    categories.append({
                        "category": cat_id,
                        "score": round(data["score"], 2),
                        "count": data["count"],
                    })
            except (json.JSONDecodeError, KeyError):
                pass

        return {
            "agent_id": computed.agent_id,
            "overall_score": computed.overall_score,
            "feedback_count": computed.feedback_count,
            "positive_count": computed.positive_count,
            "negative_count": computed.negative_count,
            "categories": categories,
            "computed_at": computed.computed_at.isoformat(),
            "payment_verified": True,
            "payer": getattr(request.state, "payer", None),
        }
    finally:
        session.close()


@router.post("/batch/scores")
@x402_required(price_eth="0.0005")  # Higher price for batch
async def batch_scores(request: Request, body: BatchScoreRequest):
    """
    Get scores for multiple agents in one request.

    Requires: 0.0005 ETH payment
    Maximum: 50 agents per request

    More efficient than individual requests for bulk lookups.
    """
    if len(body.agent_ids) > 50:
        raise HTTPException(
            status_code=400,
            detail="Maximum 50 agents per batch request"
        )

    engine = get_db_engine()
    session = get_session(engine)

    try:
        scores = []
        not_found = []

        for agent_id in body.agent_ids:
            try:
                validated_id = validate_agent_id(agent_id)
            except HTTPException:
                not_found.append(agent_id)
                continue

            computed = session.query(ComputedScore).filter_by(agent_id=validated_id).first()

            if computed:
                scores.append(BatchScoreItem(
                    agent_id=computed.agent_id,
                    score=computed.overall_score,
                    feedback_count=computed.feedback_count,
                    positive_count=computed.positive_count,
                    negative_count=computed.negative_count,
                ))
            else:
                not_found.append(agent_id)

        return BatchScoreResponse(
            scores=scores,
            not_found=not_found,
            total_requested=len(body.agent_ids),
        )
    finally:
        session.close()


@router.get("/leaderboard")
@x402_required(price_eth="0.0002")
async def get_leaderboard(
    request: Request,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    order: str = Query("desc", regex="^(asc|desc)$"),
):
    """
    Get agent leaderboard ranked by trust score.

    Requires: 0.0002 ETH payment

    Returns ranked list of agents with scores.
    """
    engine = get_db_engine()
    session = get_session(engine)

    try:
        from sqlalchemy import desc, asc

        query = session.query(ComputedScore)

        if order == "desc":
            query = query.order_by(desc(ComputedScore.overall_score))
        else:
            query = query.order_by(asc(ComputedScore.overall_score))

        total = query.count()
        results = query.offset(offset).limit(limit).all()

        entries = []
        for i, computed in enumerate(results):
            # Get agent owner if available
            agent = session.query(Agent).filter_by(id=computed.agent_id).first()
            owner = agent.owner if agent else None

            entries.append(LeaderboardEntry(
                rank=offset + i + 1,
                agent_id=computed.agent_id,
                owner=owner,
                overall_score=computed.overall_score,
                feedback_count=computed.feedback_count,
                positive_count=computed.positive_count,
                negative_count=computed.negative_count,
            ))

        return LeaderboardResponse(
            entries=entries,
            total_agents=total,
            updated_at=datetime.utcnow(),
        )
    finally:
        session.close()


@router.get("/agents/{agent_id}/analytics")
@x402_required(price_eth="0.0003")
async def get_analytics(request: Request, agent_id: str):
    """
    Get detailed analytics for an agent.

    Requires: 0.0003 ETH payment

    Returns:
    - Score trend analysis
    - Recent feedback
    - Category breakdown
    """
    validated_id = validate_agent_id(agent_id)

    engine = get_db_engine()
    session = get_session(engine)

    try:
        computed = session.query(ComputedScore).filter_by(agent_id=validated_id).first()

        if not computed:
            raise HTTPException(status_code=404, detail="No score data for agent")

        # Get recent feedback
        recent_feedback = (
            session.query(Feedback)
            .filter(Feedback.subject == validated_id)
            .filter(Feedback.revoked == False)
            .order_by(Feedback.timestamp.desc())
            .limit(10)
            .all()
        )

        # Calculate trend (compare to 30 days ago)
        # For now, use a simple heuristic based on recent feedback sentiment
        recent_positive = sum(1 for f in recent_feedback if f.value > 0)
        recent_negative = sum(1 for f in recent_feedback if f.value < 0)

        if recent_positive > recent_negative * 1.5:
            trend = "rising"
            trend_pct = 5.0
        elif recent_negative > recent_positive * 1.5:
            trend = "falling"
            trend_pct = -5.0
        else:
            trend = "stable"
            trend_pct = 0.0

        # Parse categories
        categories = []
        if computed.category_scores:
            try:
                cat_data = json.loads(computed.category_scores)
                for cat_id, data in cat_data.items():
                    categories.append({
                        "category": cat_id,
                        "score": round(data["score"], 2),
                        "count": data["count"],
                    })
            except (json.JSONDecodeError, KeyError):
                pass

        # Format recent feedback
        feedback_list = []
        for f in recent_feedback:
            feedback_list.append({
                "id": f.id,
                "value": f.value,
                "tag": f.tag1,
                "timestamp": f.timestamp.isoformat() if f.timestamp else None,
            })

        positive_ratio = 0.0
        if computed.feedback_count > 0:
            positive_ratio = computed.positive_count / computed.feedback_count

        return AnalyticsResponse(
            agent_id=validated_id,
            overall_score=computed.overall_score,
            score_trend=trend,
            trend_percentage=trend_pct,
            feedback_count=computed.feedback_count,
            positive_ratio=round(positive_ratio, 3),
            recent_feedback=feedback_list,
            category_breakdown=categories,
            computed_at=computed.computed_at,
        )
    finally:
        session.close()


# Payment info endpoint (free)
@router.get("/pricing")
async def get_pricing(request: Request):
    """
    Get pricing information for premium endpoints.

    This endpoint is free and returns current pricing.
    """
    return {
        "currency": "ETH",
        "payment_address": settings.payment_recipient,
        "endpoints": {
            "/v1/premium/agents/{id}/score/full": {
                "price_eth": "0.0001",
                "description": "Full score with category breakdown",
            },
            "/v1/premium/batch/scores": {
                "price_eth": "0.0005",
                "description": "Batch score lookup (up to 50 agents)",
            },
            "/v1/premium/leaderboard": {
                "price_eth": "0.0002",
                "description": "Agent leaderboard by trust score",
            },
            "/v1/premium/agents/{id}/analytics": {
                "price_eth": "0.0003",
                "description": "Detailed agent analytics",
            },
        },
        "instructions": (
            "To access paid endpoints, send the required ETH to the payment address, "
            "then include the transaction hash in the X-Payment header: "
            "X-Payment: 0x<tx_hash>:1"
        ),
    }
