"""Vercel serverless function entry point."""

from .main import app

# Vercel expects a handler named 'app' or 'handler'
handler = app
