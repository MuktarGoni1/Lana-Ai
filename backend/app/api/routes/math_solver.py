"""
Math Solver API routes.
"""

from fastapi import APIRouter, HTTPException, Depends, status
from app.schemas import MathProblemRequest, MathSolutionResponse
from app.services.math_solver_service import MathSolverService
from app.repositories.memory_cache_repository import MemoryCacheRepository
from app.settings import load_settings
from app.api.dependencies.auth import get_current_user
from groq import Groq

router = APIRouter()

# Initialize shared cache and Groq client once per process
_settings = load_settings()
_CACHE = MemoryCacheRepository()
_GROQ = Groq(api_key=_settings.groq_api_key) if _settings.groq_api_key else None


# Dependency provider for MathSolverService using shared singletons
def get_math_solver_service() -> MathSolverService:
    return MathSolverService(cache_repo=_CACHE, groq_client=_GROQ)


@router.post("/solve")
async def solve_math_problem(
    request: MathProblemRequest,
    service: MathSolverService = Depends(get_math_solver_service),
    user=Depends(get_current_user),  # Require authentication
):
    """Solve a math problem using Groq gate:
    - If gate returns `type: math`, solve via SymPy.
    - Otherwise, return the educational JSON directly.
    - Requires authentication to prevent abuse."""

    # Validate problem is not empty
    if not request.problem or not request.problem.strip():
        raise HTTPException(status_code=400, detail="Problem cannot be empty")

    # Validate problem length to prevent resource exhaustion
    MAX_PROBLEM_LENGTH = 1000
    if len(request.problem) > MAX_PROBLEM_LENGTH:
        raise HTTPException(
            status_code=400,
            detail=f"Problem too long. Maximum length is {MAX_PROBLEM_LENGTH} characters",
        )

    result = await service.solve_problem(request.problem)
    return result
