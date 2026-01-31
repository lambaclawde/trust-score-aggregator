"""Agent endpoints - Production Ready."""

from typing import Optional
from fastapi import APIRouter, HTTPException, Query, Request
from pydantic import BaseModel

from ..middleware.rate_limit import limiter, FREE_LIMIT
from ..utils.validation import validate_ethereum_address, validate_agent_id
from indexer.models.database import Agent, Feedback, get_session, get_engine
from indexer.models.schemas import AgentSchema, FeedbackSchema
from ..config import settings

router = APIRouter(prefix="/v1/agents", tags=["agents"])

# Lazy engine initialization
_engine = None


def get_db_engine():
    global _engine
    if _engine is None:
        _engine = get_engine(settings.database_url)
    return _engine


class AgentListResponse(BaseModel):
    """Agent list response."""
    agents: list[AgentSchema]
    total: int
    page: int
    page_size: int


class AgentStatsResponse(BaseModel):
    """Global agent statistics."""
    total_agents: int
    total_feedback: int
    agents_with_feedback: int
    chain_id: int


@router.get("/stats", response_model=AgentStatsResponse)
@limiter.limit(FREE_LIMIT)
async def get_stats(request: Request):
    """Get global agent statistics."""
    engine = get_db_engine()
    session = get_session(engine)

    try:
        total_agents = session.query(Agent).count()
        total_feedback = session.query(Feedback).filter(Feedback.revoked == False).count()

        # Count agents with at least one feedback
        from sqlalchemy import func
        agents_with_feedback = (
            session.query(func.count(func.distinct(Feedback.subject)))
            .filter(Feedback.revoked == False)
            .scalar()
        )

        return AgentStatsResponse(
            total_agents=total_agents,
            total_feedback=total_feedback,
            agents_with_feedback=agents_with_feedback or 0,
            chain_id=settings.chain_id,
        )
    finally:
        session.close()


@router.get("", response_model=AgentListResponse)
@limiter.limit(FREE_LIMIT)
async def list_agents(
    request: Request,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    owner: Optional[str] = Query(None, description="Filter by owner address"),
):
    """List registered agents."""
    engine = get_db_engine()
    session = get_session(engine)

    try:
        query = session.query(Agent)

        if owner:
            # Validate owner address format
            validated_owner = validate_ethereum_address(owner)
            query = query.filter(Agent.owner.ilike(validated_owner))

        total = query.count()
        agents = (
            query.order_by(Agent.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )

        return AgentListResponse(
            agents=[AgentSchema.model_validate(a) for a in agents],
            total=total,
            page=page,
            page_size=page_size,
        )
    finally:
        session.close()


@router.get("/{agent_id}", response_model=AgentSchema)
@limiter.limit(FREE_LIMIT)
async def get_agent(request: Request, agent_id: str):
    """Get agent by ID."""
    # Validate agent ID
    validated_id = validate_agent_id(agent_id)

    engine = get_db_engine()
    session = get_session(engine)

    try:
        agent = session.query(Agent).filter_by(id=validated_id).first()

        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found")

        return AgentSchema.model_validate(agent)
    finally:
        session.close()


class FeedbackListResponse(BaseModel):
    """Feedback list response."""
    feedback: list[FeedbackSchema]
    total: int


@router.get("/{agent_id}/feedback", response_model=FeedbackListResponse)
@limiter.limit(FREE_LIMIT)
async def get_agent_feedback(
    request: Request,
    agent_id: str,
    include_revoked: bool = Query(False, description="Include revoked feedback"),
    limit: int = Query(50, ge=1, le=200),
):
    """Get feedback for an agent."""
    # Validate agent ID
    validated_id = validate_agent_id(agent_id)

    engine = get_db_engine()
    session = get_session(engine)

    try:
        query = session.query(Feedback).filter(Feedback.subject == validated_id)

        if not include_revoked:
            query = query.filter(Feedback.revoked == False)

        total = query.count()
        feedback = query.order_by(Feedback.timestamp.desc()).limit(limit).all()

        return FeedbackListResponse(
            feedback=[FeedbackSchema.model_validate(f) for f in feedback],
            total=total,
        )
    finally:
        session.close()
