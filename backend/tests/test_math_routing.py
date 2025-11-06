import pytest

from app.repositories.memory_cache_repository import MemoryCacheRepository
from app.services.math_solver_service import MathSolverService


@pytest.mark.asyncio
async def test_non_math_bypasses_sympy_and_uses_llm(monkeypatch):
    cache = MemoryCacheRepository()
    # Any truthy object to enable LLM gate path
    service = MathSolverService(cache_repo=cache, groq_client=object())

    # If SymPy is called, fail the test to ensure bypass
    async def fail_sympy(_):
        raise AssertionError("SymPy should not be called for non-math input")

    monkeypatch.setattr(service, "_solve_with_sympy", fail_sympy)

    # Return deterministic non-math classification JSON
    async def fake_classify(_question: str) -> str:
        return '{"type":"science","topic":"photons","description":"..."}'

    monkeypatch.setattr(service, "_classify_with_llm", fake_classify)

    result = await service.solve_problem("What are photons?")

    assert isinstance(result, dict)
    assert result.get("type") == "science"
    assert result.get("topic") == "photons"