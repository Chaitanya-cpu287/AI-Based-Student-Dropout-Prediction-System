# Dockerfile for Backend API & Static Frontend
FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache curl

COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm ci --only=production

COPY backend/ /app/backend/
COPY frontend/ /app/frontend/

ENV PORT=3000
EXPOSE 3000

CMD ["node", "server.js"]
