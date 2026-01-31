"""Score endpoints - Production Ready."""

import json
import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, Query, Request
from pydantic import BaseModel

from ..middleware.rate_limit import limiter, FREE_LIMIT, BASIC_LIMIT
from ..utils.validation import validate_agent_id
from indexer.models.database import ComputedScore, get_session, get_engine
from indexer.models.schemas import ScoreSchema, CategoryScore
from scoring import TrustScoreAggregator
from ..config import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/v1", tags=["scores"])

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


class SimpleScoreResponse(BaseModel):
    """Simple score response (free tier)."""

    agent_id: str
    score: float
    feedback_count: int


@router.get("/agents/{agent_id}/score", response_model=SimpleScoreResponse)
@limiter.limit(FREE_LIMIT)
async def get_score(request: Request, agent_id: str):
    """
    Get trust score for an agent (free tier).

    Returns basic score without category breakdown.
    """
    # Validate agent ID
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
                raise HTTPException(
                    status_code=404, detail="No feedback found for agent"
                )

        return SimpleScoreResponse(
            agent_id=computed.agent_id,
            score=computed.overall_score,
            feedback_count=computed.feedback_count,
        )
    finally:
        session.close()


@router.get("/agents/{agent_id}/score/full", response_model=ScoreSchema)
@limiter.limit(BASIC_LIMIT)
async def get_full_score(request: Request, agent_id: str):
    """
    Get full trust score with categories (paid tier).

    Requires API key with Basic or Premium plan.
    """
    # Validate agent ID
    validated_id = validate_agent_id(agent_id)

    engine = get_db_engine()
    session = get_session(engine)

    try:
        computed = session.query(ComputedScore).filter_by(agent_id=validated_id).first()

        if not computed:
            aggregator = TrustScoreAggregator(engine)
            computed = aggregator.compute_and_save(validated_id)

            if not computed:
                raise HTTPException(
                    status_code=404, detail="No feedback found for agent"
                )

        return computed_to_schema(computed)
    finally:
        session.close()


class BatchScoreRequest(BaseModel):
    """Batch score request."""

    agent_ids: list[str]


class BatchScoreResponse(BaseModel):
    """Batch score response."""

    scores: list[SimpleScoreResponse]
    not_found: list[str]


@router.post("/batch/scores", response_model=BatchScoreResponse)
@limiter.limit(BASIC_LIMIT)
async def get_batch_scores(request: Request, body: BatchScoreRequest):
    """
    Get scores for multiple agents (paid tier).

    Maximum 50 agents per request.
    Requires API key with Basic or Premium plan.
    """
    if len(body.agent_ids) > 50:
        raise HTTPException(
            status_code=400, detail="Maximum 50 agents per batch request"
        )

    engine = get_db_engine()
    session = get_session(engine)

    try:
        scores = []
        not_found = []

        for agent_id in body.agent_ids:
            # Validate each agent ID
            try:
                validated_id = validate_agent_id(agent_id)
            except HTTPException:
                not_found.append(agent_id)
                continue

            computed = (
                session.query(ComputedScore).filter_by(agent_id=validated_id).first()
            )

            if computed:
                scores.append(
                    SimpleScoreResponse(
                        agent_id=computed.agent_id,
                        score=computed.overall_score,
                        feedback_count=computed.feedback_count,
                    )
                )
            else:
                not_found.append(agent_id)

        return BatchScoreResponse(scores=scores, not_found=not_found)
    finally:
        session.close()


@router.post("/agents/{agent_id}/score/refresh", response_model=ScoreSchema)
@limiter.limit(BASIC_LIMIT)
async def refresh_score(request: Request, agent_id: str):
    """
    Force recompute score for an agent (paid tier).

    Useful after new feedback is added.
    """
    # Validate agent ID
    validated_id = validate_agent_id(agent_id)

    engine = get_db_engine()

    aggregator = TrustScoreAggregator(engine)
    computed = aggregator.compute_and_save(validated_id)

    if not computed:
        raise HTTPException(status_code=404, detail="No feedback found for agent")

    return computed_to_schema(computed)


class LeaderboardAgent(BaseModel):
    """Leaderboard agent entry."""
    agent_id: str
    overall_score: float
    feedback_count: int
    positive_count: int
    negative_count: int


class LeaderboardResponse(BaseModel):
    """Leaderboard response."""
    agents: list[LeaderboardAgent]
    total: int


@router.get("/leaderboard", response_model=LeaderboardResponse)
@limiter.limit(FREE_LIMIT)
async def get_leaderboard(
    request: Request,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """
    Get agent leaderboard (free tier).

    Returns top agents ranked by trust score.
    For detailed analytics, use the premium leaderboard endpoint.
    """
    engine = get_db_engine()
    session = get_session(engine)

    try:
        from sqlalchemy import desc

        query = session.query(ComputedScore).order_by(desc(ComputedScore.overall_score))
        total = query.count()
        results = query.offset(offset).limit(limit).all()

        agents = [
            LeaderboardAgent(
                agent_id=c.agent_id,
                overall_score=c.overall_score,
                feedback_count=c.feedback_count,
                positive_count=c.positive_count,
                negative_count=c.negative_count,
            )
            for c in results
        ]

        return LeaderboardResponse(agents=agents, total=total)
    finally:
        session.close()
