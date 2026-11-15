# Dockerfile for Python ML API Service
FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

COPY ml_api/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY ml_api/ ./ml_api/
COPY "Voting Model/model/" ./"Voting Model/model/"

WORKDIR /app/ml_api
ENV PORT=5000
EXPOSE 5000

CMD ["gunicorn", "app:app", "-b", "0.0.0.0:5000", "-w", "2", "--timeout", "60"]
