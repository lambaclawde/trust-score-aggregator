"""FastAPI application - Production Ready."""

import logging
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from .config import settings
from .middleware.rate_limit import limiter
from .routes import health_router, agents_router, scores_router, badge_router, premium_router
from indexer.models.database import init_db

# Configure logging
logging.basicConfig(
    level=logging.DEBUG if settings.debug else logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    logger.info(f"Starting Trust Score Aggregator API v{settings.api_version}")
    logger.info(f"Environment: {settings.environment}")
    logger.info(f"Chain ID: {settings.chain_id}")

    # Initialize database on startup
    init_db(settings.database_url)
    logger.info("Database initialized")

    yield

    logger.info("Shutting down Trust Score Aggregator API")


# Create FastAPI app
app = FastAPI(
    title="Trust Score Aggregator",
    description="Trust score aggregation API for ERC-8004 agents",
    version=settings.api_version,
    lifespan=lifespan,
    docs_url="/docs" if settings.environment != "production" else None,
    redoc_url="/redoc" if settings.environment != "production" else None,
)

# Add rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Add CORS with proper configuration
cors_origins = settings.cors_origins
if cors_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["*"],
    )
    logger.info(f"CORS enabled for origins: {cors_origins}")
else:
    logger.warning("CORS disabled - no origins configured")


# Custom error handler with logging
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle uncaught exceptions."""
    # Log the full exception for debugging
    logger.error(
        f"Unhandled exception on {request.method} {request.url.path}: {exc}",
        exc_info=True,
    )

    # Return generic error to client (don't expose internals)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )


# Include routers
app.include_router(health_router)
app.include_router(agents_router)
app.include_router(scores_router)
app.include_router(badge_router)
app.include_router(premium_router)


def run():
    """Run the API server."""
    import uvicorn

    # Production settings
    reload = settings.environment != "production"
    workers = 1 if reload else int(os.getenv("WORKERS", "4"))

    logger.info(f"Starting server on {settings.host}:{settings.port}")
    logger.info(f"Reload: {reload}, Workers: {workers}")

    uvicorn.run(
        "api.main:app",
        host=settings.host,
        port=settings.port,
        reload=reload,
        workers=workers if not reload else 1,
        log_level="debug" if settings.debug else "info",
    )


if __name__ == "__main__":
    run()
