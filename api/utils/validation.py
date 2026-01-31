"""Input validation utilities."""

import re
from fastapi import HTTPException


def validate_ethereum_address(address: str) -> str:
    """Validate and normalize an Ethereum address.

    Args:
        address: The address to validate

    Returns:
        The normalized (checksummed) address

    Raises:
        HTTPException: If the address is invalid
    """
    if not address:
        raise HTTPException(status_code=400, detail="Address is required")

    # Basic format check
    if not re.match(r"^0x[a-fA-F0-9]{40}$", address):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid Ethereum address format: {address}"
        )

    return address.lower()


def validate_agent_id(agent_id: str) -> str:
    """Validate an agent ID.

    Agent IDs are positive integers stored as strings.

    Args:
        agent_id: The agent ID to validate

    Returns:
        The validated agent ID

    Raises:
        HTTPException: If the agent ID is invalid
    """
    if not agent_id:
        raise HTTPException(status_code=400, detail="Agent ID is required")

    # Agent IDs are positive integers
    try:
        id_int = int(agent_id)
        if id_int < 0:
            raise ValueError("Negative ID")
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid agent ID: {agent_id}. Must be a positive integer."
        )

    return agent_id


def validate_pagination(page: int, page_size: int, max_page_size: int = 100) -> tuple[int, int]:
    """Validate pagination parameters.

    Args:
        page: Page number (1-indexed)
        page_size: Number of items per page
        max_page_size: Maximum allowed page size

    Returns:
        Tuple of (validated_page, validated_page_size)

    Raises:
        HTTPException: If parameters are invalid
    """
    if page < 1:
        raise HTTPException(status_code=400, detail="Page must be >= 1")

    if page_size < 1:
        raise HTTPException(status_code=400, detail="Page size must be >= 1")

    if page_size > max_page_size:
        raise HTTPException(
            status_code=400,
            detail=f"Page size must be <= {max_page_size}"
        )

    return page, page_size
