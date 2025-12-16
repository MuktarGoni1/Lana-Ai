import json
import logging
from typing import Any, Dict, List, Optional

import orjson
# from groq import AsyncGroq
from sympy import Eq, sympify, solve, simplify
import re
import hashlib

logger = logging.getLogger(__name__)

MATH_RE = re.compile(
    r"\b(solve|simplify|factor|expand|integrate|derivative|equation|"
    r"sqrt|log|sin|cos|tan|polynomial|quadratic|linear|matrix|"
    r"\d+[-+/^=]|\w+\s=)\b",
    flags=re.I,
)

def is_math(q: str) -> bool:
    return bool(MATH_RE.search(q))

from app.repositories.interfaces import ICacheRepository
from app.schemas import MathProblemRequest, MathSolutionResponse, MathStep

def _normalize_question(q: str) -> str:
    q = (q or "").strip()
    return re.sub(r"\s+", " ", q).lower()

def _cache_key_for(question: str) -> str:
    norm = _normalize_question(question)
    return hashlib.md5(norm.encode()).hexdigest()[:24]


class MathSolverService:
    """Math problem solving service."""

    def __init__(self, cache_repo: ICacheRepository, groq_client=None):
        """Initialize math solver."""
        self.cache_repo = cache_repo
        self.groq_client = groq_client

    async def solve_problem(self, question: str) -> Any:
        """Solve or classify based on Groq gate when available.
        - If Groq returns a JSON with {"type":"math"}, solve via SymPy.
        - Otherwise, return the educational JSON directly.
        Fallbacks: SymPy first; LLM solver if SymPy fails."""
        # Cache lookup
        key = _cache_key_for(question)
        try:
            cached = await self.cache_repo.get(key, namespace="math")
            if cached is not None:
                if isinstance(cached, dict) and "problem" in cached and "solution" in cached:
                    return MathSolutionResponse(**cached)
                return cached
        except Exception:
            pass
        # Fast regex-based math detection
        if is_math(question):
            try:
                solved = await self._solve_with_sympy(question)
                try:
                    await self.cache_repo.set(key, solved.model_dump(), namespace="math")
                except Exception:
                    pass
                return solved
            except Exception as e:
                logger.info(f"SymPy failed for detected math; using LLM: {e}")
                llm_result = await self._solve_with_llm(question)
                try:
                    payload = (
                        llm_result.model_dump() if hasattr(llm_result, "model_dump") else (
                            llm_result.dict() if hasattr(llm_result, "dict") else llm_result
                        )
                    )
                    await self.cache_repo.set(key, payload, namespace="math")
                except Exception:
                    pass
                return llm_result

        # Groq-based gate path
        if self.groq_client:
            llm_raw = await self._classify_with_llm(question)
            if isinstance(llm_raw, str) and llm_raw:
                text = llm_raw.strip()
                # Prefer robust JSON parsing then branch on type
                try:
                    parsed = orjson.loads(text)
                    if isinstance(parsed, dict) and parsed.get("type") == "math":
                        topic = parsed.get("topic", question)
                        try:
                            solved = await self._solve_with_sympy(topic)
                            try:
                                await self.cache_repo.set(key, solved.model_dump(), namespace="math")
                            except Exception:
                                pass
                            return solved
                        except Exception as e:
                            logger.info(f"SymPy failed after gate, using LLM: {e}")
                            llm_result = await self._solve_with_llm(question)
                            try:
                                payload = (
                                    llm_result.model_dump() if hasattr(llm_result, "model_dump") else (
                                        llm_result.dict() if hasattr(llm_result, "dict") else llm_result
                                    )
                                )
                                await self.cache_repo.set(key, payload, namespace="math")
                            except Exception:
                                pass
                            return llm_result
                    else:
                        return parsed
                except Exception:
                    # Fallback to heuristic detection if parsing fails
                    if text.startswith('{"type": "math"') or text.startswith('{"type":"math"'):
                        try:
                            data = json.loads(text)
                            topic = data.get("topic", question)
                            solved = await self._solve_with_sympy(topic)
                            try:
                                await self.cache_repo.set(key, solved.model_dump(), namespace="math")
                            except Exception:
                                pass
                            return solved
                        except Exception:
                            try:
                                solved = await self._solve_with_sympy(question)
                                try:
                                    await self.cache_repo.set(key, solved.model_dump(), namespace="math")
                                except Exception:
                                    pass
                                return solved
                            except Exception as e:
                                logger.info(f"SymPy failed after gate non-JSON, using LLM: {e}")
                                llm_result = await self._solve_with_llm(question)
                                try:
                                    payload = (
                                        llm_result.model_dump() if hasattr(llm_result, "model_dump") else (
                                            llm_result.dict() if hasattr(llm_result, "dict") else llm_result
                                        )
                                    )
                                    await self.cache_repo.set(key, payload, namespace="math")
                                except Exception:
                                    pass
                                return llm_result
                    else:
                        try:
                            solved = await self._solve_with_sympy(question)
                            try:
                                await self.cache_repo.set(key, solved.model_dump(), namespace="math")
                            except Exception:
                                pass
                            return solved
                        except Exception as e:
                            logger.info(f"SymPy failed after gate non-JSON, using LLM: {e}")
                            llm_result = await self._solve_with_llm(question)
                            try:
                                payload = (
                                    llm_result.model_dump() if hasattr(llm_result, "model_dump") else (
                                        llm_result.dict() if hasattr(llm_result, "dict") else llm_result
                                    )
                                )
                                await self.cache_repo.set(key, payload, namespace="math")
                            except Exception:
                                pass
                            return llm_result

        # No Groq or empty gate response: original behavior
        try:
            solved = await self._solve_with_sympy(question)
            try:
                await self.cache_repo.set(key, solved.model_dump(), namespace="math")
            except Exception:
                pass
            return solved
        except Exception as e:
            logger.info(f"SymPy failed, using LLM: {e}")
            llm_result = await self._solve_with_llm(question)
            try:
                payload = (
                    llm_result.model_dump() if hasattr(llm_result, "model_dump") else (
                        llm_result.dict() if hasattr(llm_result, "dict") else llm_result
                    )
                )
                await self.cache_repo.set(key, payload, namespace="math")
            except Exception:
                pass
            return llm_result

    async def _solve_with_sympy(self, question: str) -> MathSolutionResponse:
        """Solve using SymPy."""
        if "=" in question:
            # Handle equations
            lhs, rhs = question.split("=", 1)
            equation = Eq(sympify(lhs.strip()), sympify(rhs.strip()))
            solutions = solve(equation)

            steps = [
                MathStep(description="Parse the equation", expression=question),
                MathStep(description="Solve for the variable", expression=str(equation)),
            ]

            solution_text = str(solutions[0]) if solutions else "No solution"
        else:
            # Handle expressions
            expr = sympify(question)
            simplified = simplify(expr)

            steps = [
                MathStep(description="Parse the expression", expression=question),
                MathStep(description="Simplify", expression=str(simplified)),
            ]

            solution_text = str(simplified)

        return MathSolutionResponse(problem=question, solution=solution_text, steps=steps)

    async def _groq_create(self, **kwargs):
        """Call Groq client create, supporting sync or async SDK."""
        try:
            result = self.groq_client.chat.completions.create(**kwargs)
            # If coroutine-like, await
            if hasattr(result, "__await__"):
                result = await result
            return result
        except Exception as e:
            logger.error(f"Groq create failed: {e}")
            raise

    async def _classify_with_llm(self, question: str) -> str:
        """Use Groq to classify the input following Lana AI rules exactly."""
        system_prompt = (
            "You are Lana AI.\n"
            "FIRST, examine the user's input:\n\n"
            "1. If the input is a maths question (algebra, arithmetic, calculus, equations, simplification, etc.) → immediately output ONLY the exact JSON shape below and nothing else:\n\n"
            "{\n"
            '  "type": "math",\n'
            '  "topic": "<copy of user input>",\n'
            '  "solve": true\n'
            "}\n\n"
            "2. Otherwise (plain English, science, history, etc.) → produce the normal educational JSON you usually generate.\n\n"
            "Do not add markdown, commentary, or apologies. Output only the JSON."
        )
        try:
            resp = await self._groq_create(
                model="llama-3.1-8b-instant",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": question},
                ],
                temperature=0,
                max_tokens=256,
                stream=False,
            )
            content = resp.choices[0].message.content
            return content.strip() if isinstance(content, str) else ""
        except Exception as e:
            logger.error(f"Groq classification failed: {e}")
            return ""

    async def _solve_with_llm(self, question: str) -> MathSolutionResponse:
        """Solve using LLM when Groq client is available; otherwise return error."""
        if not self.groq_client:
            logger.warning("Groq client not configured; returning error response.")
            return MathSolutionResponse(
                problem=question,
                solution="",
                steps=[MathStep(description="LLM not available", expression=None)],
                error="LLM client not configured",
            )

        system_prompt = """Return strictly JSON:\n{\n  \"steps\": [{\"explanation\": \"\", \"expression\": \"\", \"result\": \"\"}],\n  \"final_answer\": \"\"\n}\nShow clear, correct steps. Output only valid JSON."""

        response = await self._groq_create(
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
            # Map possible fields to our schema
            final = llm_response.get("final_answer") or llm_response.get("solution") or ""
            raw_steps = llm_response.get("steps", [])
            steps: List[MathStep] = []
            for s in raw_steps:
                desc = s.get("explanation") or s.get("description") or ""
                expr = s.get("expression")
                steps.append(MathStep(description=desc, expression=expr))
            return MathSolutionResponse(problem=question, solution=final, steps=steps)
        except orjson.JSONDecodeError as e:
            logger.error(f"LLM response JSON decode error: {e}")
            return MathSolutionResponse(
                problem=question,
                solution="",
                steps=[MathStep(description="Error parsing LLM response.", expression=None)],
                error="Invalid LLM JSON",
            )