"""API configuration."""

import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()


class APISettings(BaseSettings):
    """API configuration settings."""

    # Server
    host: str = os.getenv("API_HOST", "0.0.0.0")
    port: int = int(os.getenv("API_PORT", "8000"))

    # Database
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///data/trust_scores.db")

    # Rate limiting (requests per day)
    rate_limit_free: int = int(os.getenv("RATE_LIMIT_FREE", "100"))
    rate_limit_basic: int = int(os.getenv("RATE_LIMIT_BASIC", "10000"))
    rate_limit_premium: int = int(os.getenv("RATE_LIMIT_PREMIUM", "100000"))

    # CORS
    cors_origins: list[str] = ["*"]

    # Chain configuration
    chain_id: int = int(os.getenv("CHAIN_ID", "11155111"))

    # x402 Payment configuration
    payment_recipient: str = os.getenv(
        "PAYMENT_RECIPIENT", "0x266C3434C2a723939836F109FE01Bcfb96346c88"
    )
    payment_price_eth: str = os.getenv("PAYMENT_PRICE_ETH", "0.0001")

    class Config:
        env_prefix = ""


settings = APISettings()
