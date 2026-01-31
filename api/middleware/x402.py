"""x402 Payment Required middleware - Full Implementation.

Implements the HTTP 402 Payment Required protocol for micropayments.
Accepts ETH payments on Ethereum mainnet.
"""

import logging
from typing import Optional
from functools import wraps

from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from web3 import Web3

from ..config import settings
from ..payments.verifier import PaymentVerifier

logger = logging.getLogger(__name__)

# Initialize payment verifier lazily
_verifier: Optional[PaymentVerifier] = None


def get_verifier() -> PaymentVerifier:
    """Get or create payment verifier."""
    global _verifier
    if _verifier is None:
        min_payment_wei = Web3.to_wei(settings.payment_price_eth, "ether")
        _verifier = PaymentVerifier(
            recipient_address=settings.payment_recipient,
            min_payment_wei=min_payment_wei,
            database_url=settings.database_url,
        )
    return _verifier


def x402_required(price_eth: Optional[str] = None):
    """Decorator to require x402 payment for an endpoint.

    Args:
        price_eth: Price in ETH (e.g., "0.0001"). Defaults to settings.
    """
    actual_price = price_eth or settings.payment_price_eth

    def decorator(func):
        @wraps(func)
        async def wrapper(request: Request, *args, **kwargs):
            verifier = get_verifier()
            endpoint = str(request.url.path)

            # Check for payment proof in headers
            payment_header = request.headers.get("X-Payment")

            if not payment_header:
                # Return 402 with payment details
                payment_details = verifier.get_payment_details(actual_price, endpoint)
                return JSONResponse(
                    status_code=402,
                    content={
                        "error": "Payment Required",
                        "message": f"This endpoint requires a payment of {actual_price} ETH",
                        "payment": payment_details,
                    },
                    headers={
                        "X-Payment-Required": "true",
                        "X-Payment-Price": actual_price,
                        "X-Payment-Address": settings.payment_recipient,
                    }
                )

            # Parse payment proof
            proof = verifier.parse_payment_header(payment_header)
            if not proof:
                return JSONResponse(
                    status_code=400,
                    content={
                        "error": "Invalid Payment Header",
                        "message": "X-Payment header format: 0x<tx_hash>:chain_id",
                    }
                )

            # Verify payment
            result = verifier.verify_eth_payment(
                tx_hash=proof.tx_hash,
                chain_id=proof.chain_id,
                endpoint=endpoint,
            )

            if not result.valid:
                return JSONResponse(
                    status_code=402,
                    content={
                        "error": "Payment Verification Failed",
                        "message": result.error,
                        "payment": verifier.get_payment_details(actual_price, endpoint),
                    },
                    headers={
                        "X-Payment-Required": "true",
                        "X-Payment-Price": actual_price,
                    }
                )

            # Payment verified - add payer to request state
            request.state.payer = result.payer
            request.state.payment_receipt = result.receipt

            # Execute the endpoint
            return await func(request, *args, **kwargs)

        return wrapper
    return decorator


class X402Middleware:
    """ASGI middleware for x402 payments.

    Use this for route-level payment gating when you want to apply
    payment requirements to multiple routes at once.
    """

    def __init__(self, app, paid_routes: list[str] = None, price_eth: Optional[str] = None):
        self.app = app
        self.paid_routes = paid_routes or []
        self.price_eth = price_eth or settings.payment_price_eth

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        path = scope["path"]

        # Check if this route requires payment
        requires_payment = any(
            path.startswith(route) for route in self.paid_routes
        )

        if not requires_payment:
            await self.app(scope, receive, send)
            return

        # Get headers
        headers = dict(scope.get("headers", []))
        payment_header = headers.get(b"x-payment", b"").decode()

        if not payment_header:
            # Return 402
            response = JSONResponse(
                status_code=402,
                content={
                    "error": "Payment Required",
                    "message": f"This endpoint requires a payment of {self.price_eth} ETH",
                    "payment": {
                        "address": settings.payment_recipient,
                        "amount": self.price_eth,
                        "instructions": f"Include X-Payment: 0x<tx_hash>:1 header",
                    },
                },
                headers={
                    "X-Payment-Required": "true",
                    "X-Payment-Price": self.price_eth,
                }
            )
            await response(scope, receive, send)
            return

        # Verify and pass through
        verifier = get_verifier()
        proof = verifier.parse_payment_header(payment_header)

        if not proof:
            response = JSONResponse(
                status_code=400,
                content={"error": "Invalid X-Payment header format"},
            )
            await response(scope, receive, send)
            return

        result = verifier.verify_eth_payment(
            tx_hash=proof.tx_hash,
            chain_id=proof.chain_id,
            endpoint=path,
        )

        if not result.valid:
            response = JSONResponse(
                status_code=402,
                content={
                    "error": "Payment Verification Failed",
                    "message": result.error,
                },
            )
            await response(scope, receive, send)
            return

        # Payment verified - continue to app
        await self.app(scope, receive, send)
