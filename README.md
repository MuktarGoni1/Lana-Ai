# Lana AI - Educational AI Tutoring Platform

[![Frontend](https://img.shields.io/badge/Frontend-Next.js%2016-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Backend](https://img.shields.io/badge/Backend-FastAPI-blue?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Database](https://img.shields.io/badge/Database-Supabase-green?style=for-the-badge&logo=supabase)](https://supabase.com/)

## Project Structure

This is a monorepo containing both the frontend and backend of the Lana AI educational platform.

```
lana-ai/
├── frontend/          # Next.js 16 + React 18 + TypeScript
│   ├── app/          # App Router pages
│   ├── components/   # React components
│   ├── hooks/        # Custom React hooks
│   ├── lib/          # Utilities and API clients
│   ├── types/        # TypeScript definitions
│   └── public/       # Static assets
│
├── backend/           # Python FastAPI + Supabase
│   ├── main.py       # FastAPI application
│   ├── app/          # Backend modules
│   ├── tests/        # Backend tests
│   └── requirements.txt
│
├── supabase/          # Database migrations
├── docs/             # Documentation
└── docker-compose.yml # Docker orchestration
```

## Quick Start

### Prerequisites

- Node.js 18+ and npm 9+
- Python 3.11+
- Docker and Docker Compose (optional)

### Option 1: Using Docker (Recommended)

```bash
# Start all services
docker-compose up -d

# Frontend: http://localhost:3001
# Backend: http://localhost:8000
```

### Option 2: Manual Setup

```bash
# Install all dependencies
npm run install:all

# Start both frontend and backend
npm run dev

# Or start separately:
npm run dev:frontend  # Port 3001
npm run dev:backend   # Port 8000
```

## Environment Variables

Create `.env` files in respective directories:

### Frontend (`frontend/.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_API_BASE=http://localhost:8000
```

### Backend (`backend/.env`)
```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_key
GROQ_API_KEY=your_groq_key
VIDEO_API_URL=your_video_api_url
VIDEO_API_KEY=your_video_api_key
```

## Architecture

### Frontend (Next.js)

- **Framework**: Next.js 16 with App Router
- **Styling**: Tailwind CSS + Radix UI
- **Auth**: Supabase Auth with middleware
- **State**: React hooks + Context
- **API**: Proxies to backend via Next.js API routes

### Backend (FastAPI)

- **Framework**: FastAPI (Python)
- **AI/ML**: Groq API for lesson generation
- **Video**: External video generation service
- **Database**: Supabase (PostgreSQL)
- **Auth**: JWT validation with Supabase

### Progressive Lesson Delivery

The system implements progressive rendering:

1. **Lesson + Quiz** (P0): Render immediately when available
2. **Video** (P1): Generate async, show progress indicator

```
User clicks lesson
    │
    ▼
Check cache → Render lesson + quiz immediately
    │
    ▼
Start video generation (async)
    │
    ▼
Show progress bar → Auto-play when ready
```

## Available Scripts

### Root Level

```bash
npm run dev              # Start both frontend and backend
npm run build            # Build frontend for production
npm run test             # Run frontend tests
npm run test:backend     # Run backend tests
npm run lint             # Run frontend linting
npm run docker:up        # Start with Docker
npm run docker:down      # Stop Docker containers
```

### Frontend Only

```bash
cd frontend
npm run dev              # Dev server on port 3001
npm run build            # Production build
npm run test             # Jest tests
npm run lint             # ESLint
```

### Backend Only

```bash
cd backend
python -m uvicorn main:app --reload --port 8000
pytest                   # Run tests
```

## API Route Mappings

### Frontend API Routes (Next.js)

| Route | Method | Description |
|-------|--------|-------------|
| `/api/structured-lesson/stream` | POST | Stream lesson generation |
| `/api/lesson/generate-job` | POST | Create async lesson job |
| `/api/video/generate` | POST | Start video generation |
| `/api/video/status/[jobId]` | GET | Poll video status |

### Backend API Routes (FastAPI)

| Route | Method | Description |
|-------|--------|-------------|
| `/api/structured-lesson` | POST | Generate lesson content |
| `/api/tts` | POST | Text-to-speech |
| `/health` | GET | Health check |

## Database Schema

Key tables:

- `lesson_units` - Stores lesson content and video status
- `lesson_generation_jobs` - Async job queue
- `topics` - Learning topics
- `profiles` - User profiles

See `supabase/migrations/` for full schema.

## Video Generation Flow

1. Lesson renders immediately (no video wait)
2. Video generation auto-starts in background
3. Progress updates via polling (5s intervals)
4. Video player appears when ready

## Deployment

### Frontend (Vercel)

```bash
cd frontend
vercel --prod
```

### Backend (Render/Railway)

```bash
cd backend
# Deploy with Dockerfile
```

### Full Stack (Docker)

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## Contributing

1. Create feature branch
2. Make changes in respective folder (`frontend/` or `backend/`)
3. Test both services: `npm run dev`
4. Submit PR

## License

Private - All rights reserved.

## Support

For issues or questions, please refer to the documentation in `docs/` or create an issue.
