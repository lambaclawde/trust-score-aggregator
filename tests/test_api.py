"""Tests for API endpoints."""

import pytest
from fastapi.testclient import TestClient

from api.main import app


@pytest.fixture
def client():
    """Create a test client."""
    return TestClient(app)


class TestHealthEndpoint:
    """Tests for health check endpoint."""

    def test_health_check(self, client):
        """Health endpoint should return healthy status."""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "timestamp" in data
        assert data["version"] == "0.1.0"

    def test_root_endpoint(self, client):
        """Root endpoint should return API info."""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Trust Score Aggregator API"
        assert "version" in data
        assert "docs" in data


class TestAgentEndpoints:
    """Tests for agent endpoints."""

    def test_list_agents_empty(self, client):
        """Empty database should return empty list."""
        response = client.get("/v1/agents")
        assert response.status_code == 200
        data = response.json()
        assert data["agents"] == []
        assert data["total"] == 0

    def test_list_agents_pagination(self, client):
        """Pagination parameters should be accepted."""
        response = client.get("/v1/agents?page=1&page_size=10")
        assert response.status_code == 200
        data = response.json()
        assert "page" in data
        assert "page_size" in data

    def test_get_agent_not_found(self, client):
        """Non-existent agent should return 404."""
        agent_id = "0x" + "00" * 32
        response = client.get(f"/v1/agents/{agent_id}")
        assert response.status_code == 404


class TestScoreEndpoints:
    """Tests for score endpoints."""

    def test_get_score_not_found(self, client):
        """Non-existent agent should return 404."""
        agent_id = "0x" + "00" * 32
        response = client.get(f"/v1/agents/{agent_id}/score")
        assert response.status_code == 404

    def test_batch_scores_empty(self, client):
        """Empty batch should return empty results."""
        response = client.post("/v1/batch/scores", json={"agent_ids": []})
        assert response.status_code == 200
        data = response.json()
        assert data["scores"] == []

    def test_batch_scores_limit(self, client):
        """Batch over 50 should return error."""
        agent_ids = ["0x" + f"{i:064x}" for i in range(51)]
        response = client.post("/v1/batch/scores", json={"agent_ids": agent_ids})
        assert response.status_code == 400
