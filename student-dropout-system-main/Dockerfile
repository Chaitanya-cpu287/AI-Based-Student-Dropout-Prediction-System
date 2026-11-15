# EduGuard - Production Dockerfile for Backend & Full-Stack Deployment
FROM node:20-alpine AS backend-build

WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --only=production

COPY backend ./
COPY frontend ../frontend

FROM python:3.12-slim AS runner

# Install Node.js runtime and supervisor
RUN apt-get update && apt-get install -y --no-install-recommends \
    nodejs \
    npm \
    supervisor \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy Python ML requirements and install
COPY ml_api/requirements.txt ./ml_api/
RUN pip install --no-cache-dir -r ./ml_api/requirements.txt

# Copy ML API source code and models
COPY ml_api ./ml_api
COPY "Voting Model" ./"Voting Model"

# Copy Backend and Frontend
COPY --from=backend-build /app/backend ./backend
COPY frontend ./frontend

# Create supervisor configuration to run both Python ML API and Node Backend
RUN echo '[supervisord]' > /etc/supervisor/conf.d/supervisord.conf && \
    echo 'nodaemon=true' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo '[program:ml_api]' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'command=gunicorn app:app -b 127.0.0.1:5000 -w 2 --timeout 60' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'directory=/app/ml_api' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'autostart=true' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'autorestart=true' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo '[program:backend]' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'command=node server.js' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'directory=/app/backend' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'autostart=true' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'autorestart=true' >> /etc/supervisor/conf.d/supervisord.conf

ENV PORT=3000
ENV ML_API_URL=http://127.0.0.1:5000
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
