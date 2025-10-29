import json
from typing import Any, Dict, List, Optional

import orjson
from groq import AsyncGroq
from loguru import logger
from sympy import Eq, sympify, solve, simplify

from app.repositories.interfaces import ICacheRepository
from app.schemas import MathProblemRequest, MathSolutionResponse, MathStep


class MathSolverService:
    """Math problem solving service."""

    def __init__(self, cache_repo: ICacheRepository, groq_client: AsyncGroq):
        """Initialize math solver."""
        self.cache_repo = cache_repo
        self.groq_client = groq_client

    async def solve_problem(self, question: str) -> MathSolutionResponse:
        """Solve math problem (P-1: Async by Default)."""
        # Try SymPy first for deterministic solving
        try:
            return await self._solve_with_sympy(question)
        except Exception as e:
            logger.info(f"SymPy failed, using LLM: {e}")
            return await self._solve_with_llm(question)

    async def _solve_with_sympy(self, question: str) -> MathSolutionResponse:
        """Solve using SymPy."""
        if "=" in question:
            # Handle equations
            lhs, rhs = question.split("=", 1)
            equation = Eq(sympify(lhs.strip()), sympify(rhs.strip()))
            solutions = solve(equation)

            steps = [
                MathStep(
                    explanation="Parse the equation", expression=question, result=""
                ),
                MathStep(
                    explanation="Solve for the variable",
                    expression=str(equation),
                    result=str(solutions),
                ),
            ]

            final_answer = str(solutions[0]) if solutions else "No solution"
        else:
            # Handle expressions
            expr = sympify(question)
            simplified = simplify(expr)

            steps = [
                MathStep(
                    explanation="Parse the expression", expression=question, result=""
                ),
                MathStep(explanation="Simplify", expression="", result=str(simplified)),
            ]

            final_answer = str(simplified)

        return MathSolutionResponse(final_answer=final_answer, steps=steps)

    async def _solve_with_llm(self, question: str) -> MathSolutionResponse:
        """Solve using LLM."""
        system_prompt = """Return strictly JSON:
{
  "steps": [{"explanation": "", "expression": "", "result": ""}],
  "final_answer": ""
}
Show clear, correct steps. Output only valid JSON."""

        response = await self.groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": question},
            ],
            temperature=0.1,
            max_tokens=500,
            stream=False,
        )

        content = response.choices[0].message.content

        try:
            llm_response = orjson.loads(content)
            return MathSolutionResponse(
                steps=[MathStep(**step) for step in llm_response.get("steps", [])],
                final_answer=llm_response.get("final_answer", ""),
            )
        except orjson.JSONDecodeError as e:
            logger.error(f"LLM response JSON decode error: {e}")
            return MathSolutionResponse(
                steps=[
                    MathStep(
                        explanation="Error parsing LLM response.",
                        expression="",
                        result="",
                    )
                ],
                final_answer="Error",
            )
