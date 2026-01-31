"""Premium API endpoints with x402 payment requirement."""

from typing import Optional
from fastapi import APIRouter, HTTPException, Query, Request
from pydantic import BaseModel

from ..middleware.x402 import x402_required
from indexer.models.database import Agent, Feedback, get_session, get_engine
from indexer.models.schemas import AgentSchema, FeedbackSchema
from scoring.base.aggregator import TrustScoreAggregator
from ..config import settings

router = APIRouter(prefix="/v1/premium", tags=["premium"])

# Lazy engine initialization
_engine = None
_aggregator = None


def get_db_engine():
    global _engine
    if _engine is None:
        _engine = get_engine(settings.database_url)
    return _engine


def get_aggregator():
    global _aggregator
    if _aggregator is None:
        _aggregator = TrustScoreAggregator(get_db_engine())
    return _aggregator


class FullScoreResponse(BaseModel):
    """Full trust score with breakdown."""
    agent_id: str
    overall_score: float
    confidence: float
    feedback_count: int
    categories: dict[str, float]
    recent_trend: str  # "up", "down", "stable"
    percentile: float  # Rank among all agents


class BatchScoreRequest(BaseModel):
    """Batch score lookup request."""
    agent_ids: list[str]


class BatchScoreResponse(BaseModel):
    """Batch score lookup response."""
    scores: dict[str, Optional[float]]
    not_found: list[str]


class LeaderboardEntry(BaseModel):
    """Leaderboard entry."""
    rank: int
    agent_id: str
    owner: str
    score: float
    feedback_count: int


class LeaderboardResponse(BaseModel):
    """Leaderboard response."""
    entries: list[LeaderboardEntry]
    total_agents: int
    updated_at: str


@router.get("/agents/{agent_id}/score/full", response_model=FullScoreResponse)
@x402_required(price_eth="0.0001")
async def get_full_score(request: Request, agent_id: str):
    """Get full trust score with category breakdown.

    Requires x402 payment of 0.0001 ETH.
    """
    engine = get_db_engine()
    session = get_session(engine)
    aggregator = get_aggregator()

    try:
        # Verify agent exists
        agent = session.query(Agent).filter_by(id=agent_id).first()
        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found")

        # Get feedback for this agent
        feedback_list = (
            session.query(Feedback)
            .filter(Feedback.subject == agent_id, Feedback.revoked == False)
            .all()
        )

        if not feedback_list:
            return FullScoreResponse(
                agent_id=agent_id,
                overall_score=0.0,
                confidence=0.0,
                feedback_count=0,
                categories={},
                recent_trend="stable",
                percentile=0.0,
            )

        # Calculate scores
        overall = aggregator.compute_score(agent_id)
        categories = aggregator.compute_category_scores(agent_id)

        # Calculate percentile (rank among all agents)
        all_agents = session.query(Agent).count()
        agents_with_lower = 0  # Would need to compute all scores
        percentile = 50.0  # Placeholder

        # Determine trend (compare recent vs older feedback)
        recent_trend = "stable"
        if len(feedback_list) >= 5:
            recent = feedback_list[:len(feedback_list)//2]
            older = feedback_list[len(feedback_list)//2:]
            recent_avg = sum(f.value for f in recent) / len(recent)
            older_avg = sum(f.value for f in older) / len(older)
            if recent_avg > older_avg * 1.1:
                recent_trend = "up"
            elif recent_avg < older_avg * 0.9:
                recent_trend = "down"

        return FullScoreResponse(
            agent_id=agent_id,
            overall_score=overall,
            confidence=min(1.0, len(feedback_list) / 10),
            feedback_count=len(feedback_list),
            categories=categories,
            recent_trend=recent_trend,
            percentile=percentile,
        )
    finally:
        session.close()


@router.post("/batch/scores", response_model=BatchScoreResponse)
@x402_required(price_eth="0.0005")  # Higher price for batch
async def batch_scores(request: Request, body: BatchScoreRequest):
    """Get trust scores for multiple agents in one request.

    Requires x402 payment of 0.0005 ETH.
    Max 50 agents per request.
    """
    if len(body.agent_ids) > 50:
        raise HTTPException(status_code=400, detail="Max 50 agents per batch")

    engine = get_db_engine()
    aggregator = get_aggregator()

    scores = {}
    not_found = []

    for agent_id in body.agent_ids:
        try:
            score = aggregator.compute_score(agent_id)
            scores[agent_id] = score if score > 0 else None
            if score == 0:
                not_found.append(agent_id)
        except Exception:
            not_found.append(agent_id)
            scores[agent_id] = None

    return BatchScoreResponse(scores=scores, not_found=not_found)


@router.get("/leaderboard", response_model=LeaderboardResponse)
@x402_required(price_eth="0.0002")
async def get_leaderboard(
    request: Request,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
):
    """Get top agents ranked by trust score.

    Requires x402 payment of 0.0002 ETH.
    """
    engine = get_db_engine()
    session = get_session(engine)
    aggregator = get_aggregator()

    try:
        # Get all agents with feedback
        agents = session.query(Agent).all()
        total = len(agents)

        # Calculate scores for all agents (in production, this would be cached)
        scored_agents = []
        for agent in agents:
            feedback_count = (
                session.query(Feedback)
                .filter(Feedback.subject == agent.id, Feedback.revoked == False)
                .count()
            )
            if feedback_count > 0:
                score = aggregator.compute_score(agent.id)
                scored_agents.append({
                    "agent": agent,
                    "score": score,
                    "feedback_count": feedback_count,
                })

        # Sort by score descending
        scored_agents.sort(key=lambda x: x["score"], reverse=True)

        # Apply pagination
        paginated = scored_agents[offset:offset + limit]

        entries = [
            LeaderboardEntry(
                rank=offset + i + 1,
                agent_id=item["agent"].id,
                owner=item["agent"].owner,
                score=item["score"],
                feedback_count=item["feedback_count"],
            )
            for i, item in enumerate(paginated)
        ]

        from datetime import datetime
        return LeaderboardResponse(
            entries=entries,
            total_agents=total,
            updated_at=datetime.utcnow().isoformat(),
        )
    finally:
        session.close()


@router.get("/agents/{agent_id}/analytics")
@x402_required(price_eth="0.0003")
async def get_agent_analytics(request: Request, agent_id: str):
    """Get detailed analytics for an agent.

    Requires x402 payment of 0.0003 ETH.
    """
    engine = get_db_engine()
    session = get_session(engine)

    try:
        agent = session.query(Agent).filter_by(id=agent_id).first()
        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found")

        feedback_list = (
            session.query(Feedback)
            .filter(Feedback.subject == agent_id)
            .order_by(Feedback.timestamp.desc())
            .all()
        )

        # Calculate analytics
        total = len(feedback_list)
        active = len([f for f in feedback_list if not f.revoked])
        revoked = total - active

        positive = len([f for f in feedback_list if f.value > 0 and not f.revoked])
        negative = len([f for f in feedback_list if f.value < 0 and not f.revoked])
        neutral = active - positive - negative

        # Get unique reviewers
        reviewers = set(f.author for f in feedback_list)

        # Time-based stats
        from datetime import datetime, timedelta
        now = datetime.utcnow()
        last_24h = len([f for f in feedback_list if f.timestamp and (now - f.timestamp).days < 1])
        last_7d = len([f for f in feedback_list if f.timestamp and (now - f.timestamp).days < 7])
        last_30d = len([f for f in feedback_list if f.timestamp and (now - f.timestamp).days < 30])

        return {
            "agent_id": agent_id,
            "owner": agent.owner,
            "registered_block": agent.block_number,
            "feedback": {
                "total": total,
                "active": active,
                "revoked": revoked,
                "positive": positive,
                "negative": negative,
                "neutral": neutral,
            },
            "reviewers": {
                "unique_count": len(reviewers),
            },
            "activity": {
                "last_24h": last_24h,
                "last_7d": last_7d,
                "last_30d": last_30d,
            },
        }
    finally:
        session.close()
