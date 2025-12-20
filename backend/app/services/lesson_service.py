import uuid
from typing import List, Dict, Any, Optional, Tuple
import logging
import hashlib
import asyncio
import json
import re
from app.repositories.interfaces import ICacheRepository
from app.repositories.memory_cache_repository import MemoryCacheRepository

logger = logging.getLogger(__name__)

# In-memory cache for lessons (similar to what's in main.py and chat.py)
_INFLIGHT_LESSONS: dict[str, asyncio.Future] = {}

class LessonService:
    """Centralized service for lesson generation and management."""

    def __init__(self, cache_repository: Optional[ICacheRepository] = None):
        self.cache_repository = cache_repository or MemoryCacheRepository()
        
    async def _stub_lesson(self, topic: str, age: Optional[int] = None, mode: str = "lesson") -> Dict[str, Any]:
        """Generate a stub lesson with clear error messaging instead of generic templates."""
        logger.info(f"Generating stub lesson for topic: '{topic}' with age: {age} and mode: {mode}")
        
        # Create a clear error message instead of generic template
        error_message = f"Unable to generate a detailed {mode} about '{topic}' at this time. This could be due to high demand or a temporary issue. Please try again later or ask about a different topic."
        
        # Create minimal valid response with clear error messaging
        intro = error_message
        classifications = []
        
        # Create sections with helpful information based on mode
        sections = [
            {
                "title": "Service Temporarily Unavailable", 
                "content": error_message
            },
            {
                "title": "Try These Alternatives",
                "content": "1. Try rephrasing your question\n2. Ask about a different topic\n3. Check back in a few minutes\n4. Contact support if the issue persists"
            }
        ]
        
        # Create a helpful quiz
        quiz = [
            {
                "q": f"What should you do when a {mode} fails to generate?",
                "options": [
                    "A) Try rephrasing the question",
                    "B) Ask about a different topic", 
                    "C) Check back later",
                    "D) All of the above"
                ],
                "answer": "D) All of the above"
            }
        ]
        
        response = {
            "id": str(uuid.uuid4()),
            "introduction": intro,
            "classifications": classifications,
            "sections": sections,
            "diagram": "",
            "quiz": quiz,
        }
        logger.info(f"Stub lesson generated with error messaging for '{topic}' in mode: {mode}")
        return response

    async def _compute_structured_lesson(self, cache_key: str, topic: str, age: Optional[int], groq_client) -> Tuple[Dict[str, Any], str]:
        """Compute structured lesson using LLM or fallback to stub."""
        if groq_client is not None:
            raw_excerpt = ""
            try:
                # Enhanced system prompt with better age-based instructions
                age_str = ""
                if age is not None:
                    if age <= 2:
                        age_str = "toddler"
                    elif age <= 5:
                        age_str = "preschooler"
                    elif age <= 12:
                        age_str = "child"
                    elif age <= 18:
                        age_str = "teenager"
                    else:
                        age_str = "adult"
                
                sys_prompt = (
                    "You are a helpful tutor who produces a structured lesson as strict JSON. "
                    "Return ONLY valid JSON with these exact keys: "
                    "introduction (string), "
                    "classifications (array of objects with type and description string fields), "
                    "sections (array of objects with title and content string fields), "
                    "diagram (string), "
                    "quiz_questions (array of objects with question, options array, and answer string fields). "
                    "Each quiz question must have exactly 4 options. "
                    "For the learner's age group: "
                    f"{age_str if age_str else 'general audience'}. "
                    "Keep language clear for the learner. For scientific topics, provide specific details and examples. "
                    "Do not provide generic responses. Each section should contain substantial educational content. "
                    "IMPORTANT: Respond ONLY with valid JSON, no markdown code blocks, no extra text, no explanations. "
                    "Start your response with '{' and end with '}'. "
                    "Example format: {\"introduction\": \"...\", \"classifications\":[{\"type\":\"...\",\"description\":\"...\"}], \"sections\":[{\"title\":\"...\",\"content\":\"...\"}], \"diagram\":\"...\", \"quiz_questions\":[{\"question\":\"...\",\"options\":[\"...\",\"...\",\"...\",\"...\"],\"answer\":\"...\"}]}")
                
                # Enhanced user prompt with better age-based context
                user_prompt = {
                    "topic": topic,
                    "requirements": "Educational, concise, accurate, friendly. Provide specific details for scientific topics. Do not provide generic template responses. Each section should contain substantial educational content relevant to the specific topic.",
                    "format": "Return ONLY valid JSON with the exact keys specified in the system prompt. No markdown code blocks."
                }
                
                if age is not None:
                    user_prompt["age_group"] = age_str
                    user_prompt["age"] = age
                    
                completion = groq_client.chat.completions.create(
                    model="llama-3.1-8b-instant",
                    temperature=0.3,
                    response_format={"type": "json_object"},
                    messages=[
                        {"role": "system", "content": sys_prompt},
                        {"role": "user", "content": json.dumps(user_prompt)},
                    ],
                )
                content = completion.choices[0].message.content
                raw_excerpt = (content or "")[:300]
                
                # Parse JSON with robust normalization for string fields
                try:
                    data = json.loads(content)
                except json.JSONDecodeError as e:
                    logger.error(f"Failed to parse JSON from LLM for topic '{topic}': {e}. Content: {content[:200]}...")
                    # Try to repair JSON
                    try:
                        # Clean up the content
                        repaired = content.strip()
                        
                        # Remove markdown code blocks
                        if repaired.startswith('```json'):
                            repaired = repaired[7:].strip()
                        elif repaired.startswith('```'):
                            repaired = repaired[3:].strip()
                        
                        if repaired.endswith('```'):
                            repaired = repaired[:-3].strip()
                        
                        # Fix invalid control characters by removing them
                        repaired = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]', '', repaired)
                        
                        # Try to parse the repaired JSON
                        data = json.loads(repaired)
                        logger.info(f"Successfully parsed repaired JSON for topic '{topic}'")
                    except Exception as repair_error:
                        logger.error(f"Failed to repair JSON for topic '{topic}': {repair_error}")
                        raise

                def _to_str(val: Optional[object], default: str = "") -> str:
                    try:
                        if isinstance(val, str):
                            return val
                        if isinstance(val, dict) and "text" in val:
                            t = val.get("text")
                            return t if isinstance(t, str) else default
                        if val is None:
                            return default
                        return str(val)
                    except Exception:
                        return default

                intro_norm = _to_str(data.get("introduction"), default="")
                diagram_norm = _to_str(data.get("diagram"), default="")

                # Keep list items strict
                classifications = []
                for c in data.get("classifications", []):
                    if isinstance(c, dict) and "type" in c and "description" in c:
                        classifications.append({
                            "type": c["type"],
                            "description": c["description"]
                        })

                sections = []
                for s in data.get("sections", []):
                    if isinstance(s, dict) and "title" in s and "content" in s:
                        sections.append({
                            "title": s["title"],
                            "content": s["content"]
                        })

                # Map question field to q for QuizItem compatibility
                quiz_data = data.get("quiz", data.get("quiz_questions", []))
                quiz_items = []
                for q_item in quiz_data:
                    # Handle different possible field names
                    if isinstance(q_item, dict):
                        # Create a copy and handle different field names
                        quiz_item_copy = q_item.copy()
                        
                        # Handle question field (could be 'question', 'q', or other names)
                        if "question" in quiz_item_copy:
                            quiz_item_copy["q"] = quiz_item_copy.pop("question")
                        elif "q" in quiz_item_copy:
                            # Already has 'q' field, no change needed
                            pass
                        else:
                            # Try to find a suitable field for the question
                            question_field = None
                            for field in ["text", "problem", "prompt"]:
                                if field in quiz_item_copy:
                                    question_field = field
                                    break
                            if question_field:
                                quiz_item_copy["q"] = quiz_item_copy.pop(question_field)
                            else:
                                # Skip this quiz item if no question field found
                                continue
                        
                        # Ensure we have the required fields
                        if "q" in quiz_item_copy and "options" in quiz_item_copy and "answer" in quiz_item_copy:
                            # Handle options that might be objects with an "option" key
                            options = []
                            for opt in quiz_item_copy["options"]:
                                if isinstance(opt, dict) and "option" in opt:
                                    options.append(str(opt["option"]))
                                else:
                                    options.append(str(opt))
                            quiz_items.append({
                                "q": quiz_item_copy["q"],
                                "options": options,
                                "answer": quiz_item_copy["answer"]
                            })
                quiz = quiz_items

                resp = {
                    "id": str(uuid.uuid4()),
                    "introduction": intro_norm,
                    "classifications": classifications,
                    "sections": sections,
                    "diagram": diagram_norm,
                    "quiz": quiz,
                }
                # Accept LLM response if it has at least one section with content
                # This is more lenient to avoid falling back to stubs unnecessarily
                has_minimal_content = (
                    resp["sections"] and len(resp["sections"]) >= 1 and  # At least 1 section
                    any(len(s["content"]) > 10 for s in resp["sections"])  # At least one section with meaningful content
                )
                
                # If we have quiz questions, that's a bonus but not required
                if resp["quiz"]:
                    has_minimal_content = has_minimal_content and len(resp["quiz"]) >= 1  # At least 1 quiz question
                
                # Log detailed quality metrics for debugging
                logger.info(f"LLM response quality check for '{topic}': "
                           f"Has sections: {bool(resp['sections'])}, "
                           f"Has quiz: {bool(resp['quiz'])}, "
                           f"Section count: {len(resp['sections']) if resp['sections'] else 0}, "
                           f"Quiz count: {len(resp['quiz']) if resp['quiz'] else 0}")
                
                if resp["sections"]:
                    section_details = [(s["title"], len(s["content"])) for s in resp["sections"]]
                    logger.info(f"Section details: {section_details}")
                
                if resp["quiz"]:
                    logger.info(f"Quiz questions: {len(resp['quiz'])}")
                
                if has_minimal_content:
                    # Cache the result
                    try:
                        await self.cache_repository.set(cache_key, resp, namespace="lessons")
                        logger.info(f"LLM response for '{topic}' accepted and cached")
                    except Exception as cache_error:
                        logger.warning(f"Failed to cache LLM response for '{topic}': {cache_error}")
                    return resp, "llm"
                # Log when we're falling back to stub due to incomplete or low-quality LLM response
                logger.warning(f"LLM response for '{topic}' was low-quality - falling back to stub. "
                              f"Sections: {len(resp['sections']) if resp['sections'] else 0}, "
                              f"Quiz: {len(resp['quiz']) if resp['quiz'] else 0}, "
                              f"Section quality: {[len(s['content']) for s in resp['sections']] if resp['sections'] else []}")
                return await self._stub_lesson(topic, age, "lesson"), "stub"
            except Exception as e:
                # Include raw excerpt to aid troubleshooting and reduce persistent stub fallbacks
                try:
                    logger.warning(f"Structured lesson LLM error for topic '{topic}': {e}. raw_excerpt={raw_excerpt}")
                except Exception:
                    logger.warning(f"Structured lesson LLM error for topic '{topic}': {e}")
                return await self._stub_lesson(topic, age, "lesson"), "stub"
        else:
            return await self._stub_lesson(topic, age), "stub"

    async def _get_or_compute_lesson(self, cache_key: str, topic: str, age: Optional[int], groq_client) -> Tuple[Dict[str, Any], str]:
        """Get or compute lesson with deduplication."""
        fut = _INFLIGHT_LESSONS.get(cache_key)
        if fut and not fut.done():
            return await fut
        loop = asyncio.get_event_loop()
        fut = loop.create_future()
        _INFLIGHT_LESSONS[cache_key] = fut
        async def _run():
            try:
                result = await self._compute_structured_lesson(cache_key, topic, age, groq_client)
                fut.set_result(result)
            except Exception as e:
                logger.error(f"Structured lesson compute failed: {e}")
                stub_result = await self._stub_lesson(topic, age, "lesson")
                stub_result["id"] = str(uuid.uuid4())
                fut.set_result((stub_result, "stub"))
            finally:
                _INFLIGHT_LESSONS.pop(cache_key, None)
        asyncio.create_task(_run())
        return await fut

    async def generate_structured_lesson(self, topic: str, age: Optional[int] = None, groq_client=None, mode: str = "lesson") -> Tuple[Dict[str, Any], str]:
        """Generate a structured lesson for a given topic and optional age."""
        if not topic:
            raise ValueError("Topic cannot be empty")
            
        # Build cache key and try cache first
        cache_key = hashlib.md5(f"{topic}|{age}".encode()).hexdigest()[:16]
        try:
            cached = await self.cache_repository.get(cache_key, namespace="lessons")
            if cached:
                logger.info(f"Lesson for '{topic}' retrieved from cache.")
                return cached, "cache"
        except Exception:
            pass
            
        # Compute with single-flight to avoid duplicate LLM calls
        lesson, src = await self._get_or_compute_lesson(cache_key, topic, age, groq_client)
        return lesson, src