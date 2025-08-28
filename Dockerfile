FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=5057 \
    HOST=0.0.0.0

WORKDIR /app

# Install runtime deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates && rm -rf /var/lib/apt/lists/*

# Copy backend only (smaller image); adjust if you need assets
COPY backend/ /app/backend/

RUN python -m venv /venv \
 && /venv/bin/pip install --upgrade pip \
 && /venv/bin/pip install requests

EXPOSE 5057

CMD ["/venv/bin/python", "/app/backend/server.py"]


