"""Health check endpoints - Production Ready."""

import logging
from datetime import datetime
from typing import Optional
from fastapi import APIRouter
from pydantic import BaseModel

from ..config import settings
from indexer.models.database import get_engine, get_session, Agent, IndexerState

logger = logging.getLogger(__name__)
router = APIRouter(tags=["health"])


class DependencyStatus(BaseModel):
    """Status of a dependency."""
    name: str
    status: str  # "healthy", "degraded", "unhealthy"
    latency_ms: Optional[float] = None
    message: Optional[str] = None


class HealthResponse(BaseModel):
    """Health check response."""
    status: str  # "healthy", "degraded", "unhealthy"
    timestamp: datetime
    version: str
    environment: str
    chain_id: int
    dependencies: list[DependencyStatus]


class ReadinessResponse(BaseModel):
    """Readiness check response."""
    ready: bool
    agents_indexed: int
    last_block: Optional[int]
    blocks_behind: Optional[int]


def check_database() -> DependencyStatus:
    """Check database connectivity."""
    import time
    start = time.time()
    try:
        engine = get_engine(settings.database_url)
        session = get_session(engine)
        # Simple query to verify connectivity
        count = session.query(Agent).count()
        session.close()
        latency = (time.time() - start) * 1000
        return DependencyStatus(
            name="database",
            status="healthy",
            latency_ms=round(latency, 2),
            message=f"{count} agents indexed"
        )
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return DependencyStatus(
            name="database",
            status="unhealthy",
            message=str(e)
        )


def check_rpc() -> DependencyStatus:
    """Check RPC connectivity (if configured)."""
    import os
    import time
    rpc_url = os.getenv("RPC_URL")
    if not rpc_url:
        return DependencyStatus(
            name="rpc",
            status="degraded",
            message="RPC_URL not configured"
        )

    try:
        from web3 import Web3
        start = time.time()
        w3 = Web3(Web3.HTTPProvider(rpc_url))
        block = w3.eth.block_number
        latency = (time.time() - start) * 1000
        return DependencyStatus(
            name="rpc",
            status="healthy",
            latency_ms=round(latency, 2),
            message=f"Block {block}"
        )
    except Exception as e:
        logger.error(f"RPC health check failed: {e}")
        return DependencyStatus(
            name="rpc",
            status="unhealthy",
            message=str(e)[:100]
        )


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Check API health with dependency status."""
    dependencies = [
        check_database(),
    ]

    # Determine overall status
    statuses = [d.status for d in dependencies]
    if all(s == "healthy" for s in statuses):
        overall = "healthy"
    elif any(s == "unhealthy" for s in statuses):
        overall = "unhealthy"
    else:
        overall = "degraded"

    return HealthResponse(
        status=overall,
        timestamp=datetime.utcnow(),
        version=settings.api_version,
        environment=settings.environment,
        chain_id=settings.chain_id,
        dependencies=dependencies,
    )


@router.get("/health/ready", response_model=ReadinessResponse)
async def readiness_check():
    """Check if the service is ready to serve requests."""
    try:
        engine = get_engine(settings.database_url)
        session = get_session(engine)

        # Get agent count
        agents_indexed = session.query(Agent).count()

        # Get last indexed block
        state = session.query(IndexerState).filter_by(key="last_block").first()
        last_block = int(state.value) if state else None

        session.close()

        # Calculate blocks behind (if RPC available)
        blocks_behind = None
        try:
            import os
            from web3 import Web3
            rpc_url = os.getenv("RPC_URL")
            if rpc_url and last_block:
                w3 = Web3(Web3.HTTPProvider(rpc_url))
                current = w3.eth.block_number
                blocks_behind = current - last_block
        except Exception:
            pass

        # Service is ready if we have indexed some agents
        ready = agents_indexed > 0

        return ReadinessResponse(
            ready=ready,
            agents_indexed=agents_indexed,
            last_block=last_block,
            blocks_behind=blocks_behind,
        )
    except Exception as e:
        logger.error(f"Readiness check failed: {e}")
        return ReadinessResponse(
            ready=False,
            agents_indexed=0,
            last_block=None,
            blocks_behind=None,
        )


@router.get("/health/live")
async def liveness_check():
    """Simple liveness check for Kubernetes."""
    return {"alive": True}


@router.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": "Trust Score Aggregator API",
        "version": settings.api_version,
        "environment": settings.environment,
        "docs": "/docs" if settings.environment != "production" else None,
    }
