FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY indexer/ ./indexer/
COPY scoring/ ./scoring/
COPY api/ ./api/
COPY oracle_updater/ ./oracle_updater/
COPY scripts/ ./scripts/

# Create data directory
RUN mkdir -p /app/data

# Expose API port
EXPOSE 8000

# Default command runs the API
CMD ["python", "-m", "uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]
