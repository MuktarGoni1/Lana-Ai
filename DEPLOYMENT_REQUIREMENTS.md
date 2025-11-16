# Lana AI Deployment Requirements

## Backend Requirements

### Environment Variables
The backend requires the following environment variables to be set:

1. **GOOGLE_API_KEY** - Google API key for TTS functionality
2. **GROQ_API_KEY** - Groq API key for LLM functionality
3. **SUPABASE_URL** - Supabase project URL
4. **SUPABASE_SERVICE_ROLE_KEY** - Supabase service role key for backend operations
5. **REDIS_URL** (optional) - Redis connection URL for caching (if not provided, in-memory cache is used)

### Python Dependencies
See `backend/requirements.txt` for the complete list of Python dependencies.

### Deployment Configuration
The backend is configured for deployment on Render (see `backend/render.yaml`).

## Frontend Requirements

### Environment Variables
The frontend requires the following environment variables to be set:

1. **NEXT_PUBLIC_SUPABASE_URL** - Supabase project URL (must match backend)
2. **NEXT_PUBLIC_SUPABASE_ANON_KEY** - Supabase anonymous key
3. **NEXT_PUBLIC_API_BASE** - Backend API URL (e.g., https://your-backend.onrender.com)

### Node Dependencies
See `frontend/package.json` for the complete list of Node dependencies.

### Deployment Configuration
The frontend is configured for deployment on Render (see `frontend/render.yaml`).

## Security Notes

- Never commit actual API keys or sensitive credentials to the repository
- Use the provided `.env.example` files as templates for local development
- Set environment variables in your hosting platform's dashboard
- The `.gitignore` files are configured to prevent accidental commits of sensitive files

## Development Setup

1. Copy `backend/.env.example` to `backend/.env` and fill in your values
2. Copy `frontend/.env.example` to `frontend/.env.local` and fill in your values
3. Install backend dependencies: `pip install -r backend/requirements.txt`
4. Install frontend dependencies: `cd frontend && npm install`
5. Run backend: `cd backend && python main.py`
6. Run frontend: `cd frontend && npm run dev`