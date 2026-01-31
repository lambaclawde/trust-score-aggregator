"""API configuration - Production Ready."""

import os
import sys
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()


def require_env(key: str, description: str) -> str:
    """Require an environment variable to be set."""
    value = os.getenv(key)
    if not value:
        print(f"ERROR: Required environment variable {key} is not set.")
        print(f"Description: {description}")
        sys.exit(1)
    return value


class APISettings(BaseSettings):
    """API configuration settings."""

    # Server
    host: str = os.getenv("API_HOST", "0.0.0.0")
    port: int = int(os.getenv("API_PORT", "8000"))

    # Environment
    environment: str = os.getenv("ENVIRONMENT", "development")
    debug: bool = os.getenv("DEBUG", "false").lower() == "true"

    # Database
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///data/trust_scores.db")

    # Rate limiting (requests per day)
    rate_limit_free: int = int(os.getenv("RATE_LIMIT_FREE", "100"))
    rate_limit_basic: int = int(os.getenv("RATE_LIMIT_BASIC", "10000"))
    rate_limit_premium: int = int(os.getenv("RATE_LIMIT_PREMIUM", "100000"))

    # CORS - Must be explicitly configured for production
    @property
    def cors_origins(self) -> list[str]:
        origins = os.getenv("CORS_ORIGINS", "")
        if origins:
            return [o.strip() for o in origins.split(",")]
        # Default: restrictive in production, permissive in development
        if self.environment == "production":
            return []  # No CORS by default in production
        return ["http://localhost:3000", "http://localhost:3001"]

    # Chain configuration
    chain_id: int = int(os.getenv("CHAIN_ID", "1"))

    # x402 Payment configuration - REQUIRED in production
    @property
    def payment_recipient(self) -> str:
        recipient = os.getenv("PAYMENT_RECIPIENT")
        if not recipient:
            if self.environment == "production":
                raise ValueError(
                    "PAYMENT_RECIPIENT environment variable is required in production"
                )
            # Development fallback (should not be used in production)
            return "0x0000000000000000000000000000000000000000"
        # Validate Ethereum address format
        if not recipient.startswith("0x") or len(recipient) != 42:
            raise ValueError(f"Invalid PAYMENT_RECIPIENT address: {recipient}")
        return recipient

    payment_price_eth: str = os.getenv("PAYMENT_PRICE_ETH", "0.0001")

    # Redis for production caching (optional in development)
    redis_url: str = os.getenv("REDIS_URL", "")

    # API versioning
    api_version: str = "1.0.0"

    class Config:
        env_prefix = ""


settings = APISettings()
