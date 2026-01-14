# Dockerfile for HSC-JIT Backend
FROM python:3.11-slim as base

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# ========== Dependencies Stage ==========
FROM base as deps

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip setuptools wheel && \
    pip install --no-cache-dir -r requirements.txt

# ========== Production Stage ==========
FROM base as production

# Copy installed packages from deps stage
COPY --from=deps /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=deps /usr/local/bin /usr/local/bin

# Copy application
COPY . .

# Create non-root user
RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app
USER appuser

# Sentinel health check (validates data integrity every 5min)
HEALTHCHECK --interval=5m --timeout=60s --retries=3 --start-period=30s \
    CMD python3 scripts/sentinel.py || exit 1

# Expose port
EXPOSE 8000

# Run uvicorn (for production, use gunicorn with uvicorn workers)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
