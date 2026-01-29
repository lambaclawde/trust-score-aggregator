"""Rate limiting middleware."""

from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.middleware import SlowAPIMiddleware
from starlette.requests import Request

from ..config import settings


def get_api_key(request: Request) -> str:
    """Get API key from request headers or fall back to IP."""
    api_key = request.headers.get("X-API-Key")
    if api_key:
        return api_key
    return get_remote_address(request)


# Create limiter instance
limiter = Limiter(key_func=get_api_key)


class RateLimitMiddleware(SlowAPIMiddleware):
    """Custom rate limit middleware."""

    pass


def get_rate_limit(api_key: str = None) -> str:
    """
    Get rate limit string based on API key tier.

    Returns slowapi format: "100/day", "10000/day", etc.
    """
    if api_key is None:
        return f"{settings.rate_limit_free}/day"

    # TODO: Look up API key tier from database
    # For now, treat any API key as basic tier
    return f"{settings.rate_limit_basic}/day"


# Default rate limits by tier
FREE_LIMIT = f"{settings.rate_limit_free}/day"
BASIC_LIMIT = f"{settings.rate_limit_basic}/day"
PREMIUM_LIMIT = f"{settings.rate_limit_premium}/day"
