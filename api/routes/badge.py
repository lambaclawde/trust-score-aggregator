"""Badge endpoint for embeddable trust score badges."""

from fastapi import APIRouter, HTTPException, Response
from fastapi.responses import Response as FastAPIResponse

from ..middleware.rate_limit import limiter, FREE_LIMIT
from indexer.models.database import ComputedScore, get_session, get_engine
from ..config import settings

router = APIRouter(prefix="/v1/badge", tags=["badge"])

# Lazy engine initialization
_engine = None


def get_db_engine():
    global _engine
    if _engine is None:
        _engine = get_engine(settings.database_url)
    return _engine


def get_score_color(score: float) -> str:
    """Get color hex based on score."""
    if score >= 80:
        return "10b981"  # emerald
    if score >= 60:
        return "34d399"  # emerald lighter
    if score >= 40:
        return "6b7280"  # gray
    if score >= 20:
        return "f59e0b"  # amber
    return "ef4444"  # red


def get_score_label(score: float) -> str:
    """Get label based on score."""
    if score >= 80:
        return "Excellent"
    if score >= 60:
        return "Good"
    if score >= 40:
        return "Neutral"
    if score >= 20:
        return "Poor"
    return "Risky"


def generate_badge_svg(score: float, label: str = "Trust Score") -> str:
    """Generate an SVG badge for the trust score."""
    color = get_score_color(score)
    score_text = f"{int(score)}"
    status = get_score_label(score)

    # Calculate widths
    label_width = len(label) * 6 + 10
    score_width = len(score_text) * 8 + len(status) * 6 + 20
    total_width = label_width + score_width

    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{total_width}" height="20">
  <linearGradient id="b" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="a">
    <rect width="{total_width}" height="20" rx="3" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#a)">
    <path fill="#555" d="M0 0h{label_width}v20H0z"/>
    <path fill="#{color}" d="M{label_width} 0h{score_width}v20H{label_width}z"/>
    <path fill="url(#b)" d="M0 0h{total_width}v20H0z"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
    <text x="{label_width/2}" y="15" fill="#010101" fill-opacity=".3">{label}</text>
    <text x="{label_width/2}" y="14">{label}</text>
    <text x="{label_width + score_width/2}" y="15" fill="#010101" fill-opacity=".3">{score_text} {status}</text>
    <text x="{label_width + score_width/2}" y="14">{score_text} {status}</text>
  </g>
</svg>'''

    return svg


@router.get("/{agent_id}")
async def get_badge(agent_id: str, label: str = "Trust Score"):
    """
    Get an SVG badge for an agent's trust score.

    Useful for embedding in READMEs or websites.
    """
    engine = get_db_engine()
    session = get_session(engine)

    try:
        # Normalize ID format
        if not agent_id.startswith("0x"):
            agent_id = "0x" + agent_id

        computed = session.query(ComputedScore).filter_by(agent_id=agent_id).first()

        if not computed:
            # Return a "no data" badge
            svg = generate_badge_svg(0, label="Trust Score")
            svg = svg.replace("0 Risky", "N/A")
            return Response(
                content=svg,
                media_type="image/svg+xml",
                headers={"Cache-Control": "max-age=300"},
            )

        svg = generate_badge_svg(computed.overall_score, label=label)

        return Response(
            content=svg,
            media_type="image/svg+xml",
            headers={"Cache-Control": "max-age=3600"},
        )
    finally:
        session.close()


@router.get("/{agent_id}/json")
async def get_badge_data(agent_id: str):
    """
    Get badge data as JSON (for custom badge implementations).
    """
    engine = get_db_engine()
    session = get_session(engine)

    try:
        # Normalize ID format
        if not agent_id.startswith("0x"):
            agent_id = "0x" + agent_id

        computed = session.query(ComputedScore).filter_by(agent_id=agent_id).first()

        if not computed:
            return {
                "schemaVersion": 1,
                "label": "Trust Score",
                "message": "N/A",
                "color": "gray",
            }

        return {
            "schemaVersion": 1,
            "label": "Trust Score",
            "message": f"{int(computed.overall_score)} {get_score_label(computed.overall_score)}",
            "color": get_score_color(computed.overall_score),
        }
    finally:
        session.close()
