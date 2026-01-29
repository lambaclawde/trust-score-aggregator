#!/usr/bin/env python3
"""Start the API server."""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from api.main import run

if __name__ == "__main__":
    run()
