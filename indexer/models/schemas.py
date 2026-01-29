"""Pydantic schemas for API responses."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class AgentSchema(BaseModel):
    """Agent response schema."""

    id: str = Field(..., description="Agent identifier (bytes32)")
    owner: str = Field(..., description="Owner address")
    metadata_uri: Optional[str] = Field(None, description="Metadata URI")
    block_number: int = Field(..., description="Registration block")
    created_at: datetime

    class Config:
        from_attributes = True


class FeedbackSchema(BaseModel):
    """Feedback response schema."""

    id: str = Field(..., description="Feedback ID (bytes32)")
    subject: str = Field(..., description="Subject agent ID")
    author: str = Field(..., description="Author agent ID")
    tag1: Optional[str] = Field(None, description="Category tag")
    value: int = Field(..., description="Feedback value")
    value_decimals: int = Field(0, description="Value decimals")
    comment: Optional[str] = Field(None, description="Comment")
    revoked: bool = Field(False, description="Whether revoked")
    timestamp: datetime
    block_number: int

    class Config:
        from_attributes = True


class CategoryScore(BaseModel):
    """Score for a specific category."""

    category: str
    score: float = Field(..., ge=0, le=100)
    count: int


class ScoreSchema(BaseModel):
    """Trust score response schema."""

    agent_id: str = Field(..., description="Agent identifier")
    overall_score: float = Field(..., ge=0, le=100, description="Overall trust score")
    feedback_count: int = Field(..., description="Total feedback count")
    positive_count: int = Field(..., description="Positive feedback count")
    negative_count: int = Field(..., description="Negative feedback count")
    categories: list[CategoryScore] = Field(
        default_factory=list, description="Per-category scores"
    )
    computed_at: datetime


class ScoreBatchResponse(BaseModel):
    """Batch score response."""

    scores: list[ScoreSchema]
    total: int
