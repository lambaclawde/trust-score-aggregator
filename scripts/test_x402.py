#!/usr/bin/env python3
"""Test script for x402 payment flow.

This script demonstrates how to use the x402 payment protocol
to access premium API endpoints.

Usage:
    # Test without payment (get 402 response)
    python scripts/test_x402.py

    # Test with a real transaction hash
    python scripts/test_x402.py 0x<your_tx_hash>
"""

import sys
import requests
import json

API_BASE = "http://localhost:8000"


def test_pricing():
    """Test the free pricing endpoint."""
    print("\n=== Testing Pricing Endpoint (Free) ===")
    resp = requests.get(f"{API_BASE}/v1/premium/pricing")
    print(f"Status: {resp.status_code}")
    print(json.dumps(resp.json(), indent=2))
    return resp.json()


def test_without_payment():
    """Test premium endpoint without payment."""
    print("\n=== Testing Leaderboard Without Payment ===")
    resp = requests.get(f"{API_BASE}/v1/premium/leaderboard")
    print(f"Status: {resp.status_code}")
    print(f"X-Payment-Required: {resp.headers.get('X-Payment-Required')}")
    print(f"X-Payment-Price: {resp.headers.get('X-Payment-Price')}")
    print(json.dumps(resp.json(), indent=2))


def test_with_payment(tx_hash: str, chain_id: int = 1):
    """Test premium endpoint with payment proof."""
    print(f"\n=== Testing Leaderboard With Payment ===")
    print(f"TX Hash: {tx_hash}")
    print(f"Chain ID: {chain_id}")

    headers = {
        "X-Payment": f"{tx_hash}:{chain_id}"
    }

    resp = requests.get(
        f"{API_BASE}/v1/premium/leaderboard",
        headers=headers
    )

    print(f"Status: {resp.status_code}")
    if resp.status_code == 200:
        print("Payment verified successfully!")
        print(json.dumps(resp.json(), indent=2))
    else:
        print("Payment verification failed:")
        print(json.dumps(resp.json(), indent=2))


def main():
    # Test pricing endpoint
    pricing = test_pricing()

    # Test without payment
    test_without_payment()

    # Test with payment if tx hash provided
    if len(sys.argv) > 1:
        tx_hash = sys.argv[1]
        chain_id = int(sys.argv[2]) if len(sys.argv) > 2 else 1
        test_with_payment(tx_hash, chain_id)
    else:
        print("\n=== How to Test With Payment ===")
        print(f"1. Send 0.0002 ETH to: {pricing['payment_address']}")
        print("2. Run: python scripts/test_x402.py 0x<tx_hash>")


if __name__ == "__main__":
    main()
