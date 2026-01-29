"""Health check endpoints."""

from datetime import datetime
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(tags=["health"])


class HealthResponse(BaseModel):
    """Health check response."""

    status: str
    timestamp: datetime
    version: str


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Check API health."""
    return HealthResponse(
        status="healthy",
        timestamp=datetime.utcnow(),
        version="0.1.0",
    )


@router.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": "Trust Score Aggregator API",
        "version": "0.1.0",
        "docs": "/docs",
    }
