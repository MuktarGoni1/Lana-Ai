"""
Math Solver API routes.
"""
from fastapi import APIRouter, HTTPException, Depends
from app.schemas import MathProblemRequest, MathSolutionResponse
from app.services.math_solver_service import MathSolverService
from app.repositories.memory_cache_repository import MemoryCacheRepository
from app.services.llm_client import get_groq_client

router = APIRouter()

# Dependency provider for MathSolverService
def get_math_solver_service() -> MathSolverService:
    cache = MemoryCacheRepository()
    # Initialize Groq client if API key available
    groq_client = get_groq_client()
    return MathSolverService(cache_repo=cache, groq_client=groq_client)

@router.post("/solve")
async def solve_math_problem(request: MathProblemRequest, service: MathSolverService = Depends(get_math_solver_service)):
    """Solve a math problem using Groq gate:
    - If gate returns `type: math`, solve via SymPy.
    - Otherwise, return the educational JSON directly."""
    if not request.problem.strip():
        raise HTTPException(status_code=400, detail="Problem cannot be empty")
    result = await service.solve_problem(request.problem)
    return result