# Deployment Guide

This document provides detailed instructions for deploying the Lana AI application.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Local Development](#local-development)
- [Docker Deployment](#docker-deployment)
- [Production Deployment](#production-deployment)
- [Render Deployment](#render-deployment)
- [Troubleshooting](#troubleshooting)

## Prerequisites

- Node.js 18+ and npm 9+
- Python 3.11+
- Docker and Docker Compose (optional but recommended)
- Git

## Environment Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd lana-ai
```

2. Copy environment templates:
```bash
cp .env.development .env.development.local
cp .env.production .env.production.local
```

3. Edit the environment files with your actual values.

## Local Development

### Option 1: Using Docker (Recommended)

Start all services:
```bash
docker-compose up -d
```

Access the application:
- Frontend: http://localhost:3001
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

View logs:
```bash
docker-compose logs -f frontend
docker-compose logs -f backend
```

Stop services:
```bash
docker-compose down
```

### Option 2: Manual Setup

Install all dependencies:
```bash
npm run install:all
```

Start both services:
```bash
npm run dev
```

Or start separately:
```bash
# Terminal 1 - Backend
cd backend
python -m uvicorn main:app --reload --port 8000

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## Docker Deployment

### Development

```bash
# Build and start
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Production

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Start production services
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Scale backend instances
docker-compose -f docker-compose.prod.yml up -d --scale backend=3
```

## Production Deployment

### Environment Variables

Ensure these are set in `.env.production.local`:

```bash
# Required
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_ANON_KEY=
GROQ_API_KEY=

# Optional but recommended
SENTRY_DSN=
REDIS_URL=
```

### Build Steps

1. Build frontend:
```bash
cd frontend
npm ci
npm run build
```

2. Build backend (if using Docker):
```bash
docker build -t lana-backend:latest ./backend
```

### Health Checks

Verify deployment:
```bash
# Frontend health
curl http://localhost:3001

# Backend health
curl http://localhost:8000/health

# API documentation
curl http://localhost:8000/docs
```

## Render Deployment

### Frontend (Web Service)

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Configure:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
4. Add environment variables from `.env.production`
5. Deploy

### Backend (Web Service)

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Configure:
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Add environment variables from `.env.production`
5. Deploy

### Using render.yaml

```bash
# Install Render CLI
curl -fsSL https://render.com/install | bash

# Deploy from render.yaml
render blueprint apply
```

## Troubleshooting

### Port Already in Use

```bash
# Find process using port
lsof -i :3001
lsof -i :8000

# Kill process
kill -9 <PID>
```

### Docker Issues

```bash
# Clean up Docker resources
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache
```

### Environment Variable Issues

```bash
# Verify environment files exist
ls -la .env*

# Check environment variables are loaded
docker-compose config
```

### Backend Won't Start

1. Check Python version: `python --version` (should be 3.11+)
2. Install dependencies: `pip install -r requirements.txt`
3. Check for port conflicts
4. Verify Supabase credentials

### Frontend Build Fails

1. Clear npm cache: `npm cache clean --force`
2. Delete node_modules: `rm -rf node_modules`
3. Reinstall: `npm install`
4. Check Node version: `node --version` (should be 18+)

## Monitoring

### Logs

```bash
# View all logs
docker-compose logs

# Follow logs
docker-compose logs -f

# View specific service
docker-compose logs -f backend
```

### Metrics

Backend metrics endpoint:
```bash
curl http://localhost:8000/metrics
```

### Health Checks

```bash
# Frontend
curl -f http://localhost:3001 || echo "Frontend unhealthy"

# Backend
curl -f http://localhost:8000/health || echo "Backend unhealthy"
```

## Security Checklist

- [ ] Change default API_SECRET_KEY
- [ ] Use strong passwords for all services
- [ ] Enable HTTPS in production
- [ ] Configure CORS origins properly
- [ ] Set up rate limiting
- [ ] Enable Sentry for error tracking
- [ ] Regular security updates
- [ ] Database backups configured

## Support

For deployment issues:
1. Check logs: `docker-compose logs`
2. Verify environment variables
3. Check service health endpoints
4. Review documentation in `docs/`
