"""API routes."""

from .health import router as health_router
from .agents import router as agents_router
from .scores import router as scores_router
from .badge import router as badge_router
from .premium import router as premium_router

__all__ = [
    "health_router",
    "agents_router",
    "scores_router",
    "badge_router",
    "premium_router",
]
