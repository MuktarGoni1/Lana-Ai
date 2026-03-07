"""
Main API router that includes all route modules.
"""
from fastapi import APIRouter
from .routes import lessons, lesson_routes, math_solver, tts, history, jobs, chat, reports, guardian_reports, quick

# Create main API router
api_router = APIRouter()

# Include all route modules
# Register generation/status endpoints first so static routes resolve before dynamic lesson_id routes.
api_router.include_router(lesson_routes.router, tags=["lessons"])
api_router.include_router(lessons.router, prefix="/lessons", tags=["lessons"])
api_router.include_router(math_solver.router, prefix="/math-solver", tags=["math-solver"])
api_router.include_router(tts.router, prefix="/tts", tags=["tts"])
api_router.include_router(history.router, tags=["history"])
api_router.include_router(jobs.router, tags=["jobs"])
api_router.include_router(chat.router, prefix="/chat", tags=["chat"])
api_router.include_router(quick.router, prefix="/quick", tags=["quick"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
api_router.include_router(guardian_reports.router, prefix="/guardian-reports", tags=["guardian-reports"])
