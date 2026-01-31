"""x402 Payment Required middleware - Stub Implementation.

This is a basic stub. For the full x402 payment middleware,
install the trust-score-premium package.
"""

import logging
from typing import Optional
from functools import wraps

from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)

# Try to import premium x402 implementation
try:
    from trust_score_premium.api.x402 import (
        x402_required as _premium_x402_required,
        X402Middleware as _PremiumX402Middleware,
        PAYMENT_CONFIG,
    )
    PREMIUM_AVAILABLE = True
    logger.info("Premium x402 middleware loaded")
except ImportError:
    PREMIUM_AVAILABLE = False
    logger.info("Premium x402 not available - using stub")


def x402_required(price_eth: Optional[str] = None):
    """Decorator to require x402 payment for an endpoint.

    Stub implementation - returns 402 with upgrade message.
    For actual payment processing, install trust-score-premium.
    """
    if PREMIUM_AVAILABLE:
        return _premium_x402_required(price_eth)

    def decorator(func):
        @wraps(func)
        async def wrapper(request: Request, *args, **kwargs):
            # Stub: Always return 402 with upgrade message
            return JSONResponse(
                status_code=402,
                content={
                    "error": "Payment Required",
                    "message": "Premium features require the trust-score-premium package",
                    "upgrade": "Contact support to enable premium features",
                },
                headers={
                    "X-Payment-Required": "true",
                }
            )
        return wrapper
    return decorator


class X402Middleware:
    """ASGI middleware for x402 payments - Stub.

    For actual payment processing, install trust-score-premium.
    """

    def __init__(self, app, paid_routes: list[str] = None):
        if PREMIUM_AVAILABLE:
            self._middleware = _PremiumX402Middleware(app, paid_routes)
        else:
            self.app = app
            self.paid_routes = paid_routes or []

    async def __call__(self, scope, receive, send):
        if PREMIUM_AVAILABLE:
            await self._middleware(scope, receive, send)
        else:
            # Stub: Pass through without payment check
            await self.app(scope, receive, send)
