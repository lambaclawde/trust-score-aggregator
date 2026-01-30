"""Agent endpoints."""

from typing import Optional
from fastapi import APIRouter, HTTPException, Query, Request
from pydantic import BaseModel

from ..middleware.rate_limit import limiter, FREE_LIMIT
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
            query = query.filter(Agent.owner == owner)

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
    engine = get_db_engine()
    session = get_session(engine)

    try:
        # Agent IDs are stored as plain integers (e.g., "0", "1", "2")
        agent = session.query(Agent).filter_by(id=agent_id).first()

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
    engine = get_db_engine()
    session = get_session(engine)

    try:
        # Agent IDs are stored as plain integers
        query = session.query(Feedback).filter(Feedback.subject == agent_id)

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
