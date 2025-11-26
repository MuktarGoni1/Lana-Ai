"""
Chat API routes with mode-based functionality.
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import json
import re
import logging
import hashlib
import asyncio

logger = logging.getLogger(__name__)

router = APIRouter()

# Import the necessary modules without creating circular dependencies
from app.schemas import MathProblemRequest, MathSolutionResponse
from app.services.math_solver_service import MathSolverService
from app.repositories.memory_cache_repository import MemoryCacheRepository
from app.repositories.interfaces import ICacheRepository

# Initialize math solver service for math mode
_CACHE = MemoryCacheRepository()
# We'll initialize the math service in the handler functions to avoid circular imports

class ChatRequest(BaseModel):
    """Request model for chat messages."""
    user_id: str
    message: str
    age: Optional[int] = None

class ChatResponse(BaseModel):
    """Response model for chat messages."""
    mode: str
    reply: str
    quiz: Optional[List[Dict[str, Any]]] = None
    error: Optional[str] = None

def extract_mode(message: str) -> tuple[str, str]:
    """Extract mode and clean text from message.
    
    Returns:
        tuple: (mode, clean_text)
    """
    # Regex to match mode commands at the beginning of the message
    mode_pattern = r"^/(\w+)\s*(.*)"
    match = re.match(mode_pattern, message.strip())
    
    if match:
        mode = match.group(1).lower()
        clean_text = match.group(2).strip()
        return mode, clean_text
    
    # Default mode if no command found
    return "default", message.strip()

# Stub lesson generation (similar to what's in main.py)
class ClassificationItem(BaseModel):
    type: str
    description: str

class SectionItem(BaseModel):
    title: str
    content: str

class QuizItem(BaseModel):
    q: str
    options: List[str]
    answer: str

class StructuredLessonResponse(BaseModel):
    id: Optional[str] = None
    introduction: Optional[str] = None
    classifications: List[ClassificationItem] = []
    sections: List[SectionItem]
    diagram: str = ""
    quiz: List[QuizItem]

async def _stub_lesson(topic: str, age: Optional[int] = None) -> StructuredLessonResponse:
    # Create age-appropriate introduction
    age_str = ""
    if age is not None:
        if age <= 2:
            age_str = "in a simple, fun way"
        elif age <= 5:
            age_str = "in a clear, friendly way"
        elif age <= 12:
            age_str = "in an engaging way"
        elif age <= 18:
            age_str = "in a detailed way"
        else:
            age_str = "in depth"
    
    intro = f"Let's learn about {topic} {age_str}!"
    classifications = [ClassificationItem(type="Category", description=topic.title())]
    
    # Create age-appropriate sections
    if age is not None and age <= 5:
        sections = [
            SectionItem(title="Overview", content=f"{topic} - key ideas and examples."),
            SectionItem(title="Details", content=f"Deeper look at {topic}."),
        ]
    elif age is not None and age <= 12:
        sections = [
            SectionItem(title="What is it?", content=f"{topic} - key ideas and examples."),
            SectionItem(title="How does it work?", content=f"Understanding how {topic} works."),
            SectionItem(title="Why is it important?", content=f"Learning why {topic} matters."),
        ]
    else:
        sections = [
            SectionItem(title="Introduction", content=f"Understanding {topic} - key concepts and definitions."),
            SectionItem(title="Key Principles", content=f"Core principles and theories of {topic}."),
            SectionItem(title="Applications", content=f"How {topic} is applied in real-world scenarios."),
        ]
    
    # Generate age-appropriate quiz questions
    if age is not None and age <= 5:
        quiz = [
            QuizItem(q=f"What is {topic}?", options=[f"A) A {topic} concept", f"B) A {topic} skill", f"C) A {topic} application", "D) All of the above"], answer="D) All of the above"),
            QuizItem(q=f"Which is a key aspect of {topic}?", options=[f"A) {topic} principles", f"B) {topic} applications", f"C) {topic} benefits", "D) All of the above"], answer="D) All of the above"),
            QuizItem(q=f"How is {topic} typically used?", options=[f"A) In {topic} projects", f"B) For {topic} development", f"C) As a {topic} tool", "D) All of the above"], answer="D) All of the above"),
            QuizItem(q=f"What should you know about {topic}?", options=[f"A) {topic} basics", f"B) {topic} advanced concepts", f"C) {topic} best practices", "D) All of the above"], answer="D) All of the above"),
        ]
    elif age is not None and age <= 12:
        quiz = [
            QuizItem(q=f"What is {topic}?", options=[f"A) A {topic} concept", f"B) A {topic} skill", f"C) A {topic} application", "D) All of the above"], answer="D) All of the above"),
            QuizItem(q=f"Why is {topic} important?", options=[f"A) It helps us understand the world", f"B) It has practical applications", f"C) It builds critical thinking", "D) All of the above"], answer="D) All of the above"),
            QuizItem(q=f"How can {topic} be used?", options=[f"A) In school projects", f"B) In daily life", f"C) In future careers", "D) All of the above"], answer="D) All of the above"),
            QuizItem(q=f"What should you remember about {topic}?", options=[f"A) Key definitions", f"B) Main concepts", f"C) Real-world examples", "D) All of the above"], answer="D) All of the above"),
        ]
    else:
        quiz = [
            QuizItem(q=f"What is {topic}?", options=[f"A) A {topic} concept", f"B) A {topic} skill", f"C) A {topic} application", "D) All of the above"], answer="D) All of the above"),
            QuizItem(q=f"Which is a key aspect of {topic}?", options=[f"A) {topic} principles", f"B) {topic} applications", f"C) {topic} benefits", "D) All of the above"], answer="D) All of the above"),
            QuizItem(q=f"How is {topic} typically used?", options=[f"A) In {topic} projects", f"B) For {topic} development", f"C) As a {topic} tool", "D) All of the above"], answer="D) All of the above"),
            QuizItem(q=f"What should you know about {topic}?", options=[f"A) {topic} basics", f"B) {topic} advanced concepts", f"C) {topic} best practices", "D) All of the above"], answer="D) All of the above"),
        ]
    
    import uuid
    return StructuredLessonResponse(
        id=str(uuid.uuid4()),
        introduction=intro,
        classifications=classifications,
        sections=sections,
        diagram="",
        quiz=quiz,
    )

# In-memory cache for lessons (similar to what's in main.py)
_INFLIGHT_LESSONS: dict[str, asyncio.Future] = {}

async def _compute_structured_lesson(cache_key: str, topic: str, age: Optional[int], groq_client) -> tuple[StructuredLessonResponse, str]:
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
                "Return only JSON with keys: introduction (string), classifications (array of {type, description}), "
                "sections (array of {title, content}), diagram (string; ASCII or description), "
                "quiz (array of {question, options, answer}). For quiz questions, create 4 multiple choice questions with 4 options each. "
                "Make sure the questions test understanding of the topic and have clear correct answers. "
                "Keep language clear for the learner. For scientific topics, provide specific details and examples. "
                "Do not provide generic responses. Each section should contain substantial educational content. "
                "If you cannot provide a quality response for the specific topic, indicate so explicitly."
            )
            
            # Enhanced user prompt with better age-based context
            user_prompt = {
                "topic": topic,
                "requirements": "Educational, concise, accurate, friendly. Provide specific details for scientific topics. Do not provide generic template responses. Each section should contain substantial educational content relevant to the specific topic."
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

            # Keep list items strict; they already map to our pydantic models
            classifications = [ClassificationItem(**c) for c in data.get("classifications", [])]
            sections = [SectionItem(**s) for s in data.get("sections", [])]
            # Map question field to q for QuizItem compatibility
            quiz_data = data.get("quiz", [])
            quiz_items = []
            for q_item in quiz_data:
                # Create a copy and rename question to q
                quiz_item_copy = q_item.copy()
                if "question" in quiz_item_copy:
                    quiz_item_copy["q"] = quiz_item_copy.pop("question")
                quiz_items.append(QuizItem(**quiz_item_copy))
            quiz = quiz_items

            resp = StructuredLessonResponse(
                id=str(uuid.uuid4()),
                introduction=intro_norm,
                classifications=classifications,
                sections=sections,
                diagram=diagram_norm,
                quiz=quiz,
            )
            # Only cache and return LLM response if it has both sections and quiz questions
            # Also validate that content is substantial (not just generic templates)
            has_substantial_content = (
                resp.sections and resp.quiz and
                len(resp.sections) >= 2 and  # At least 2 sections
                all(len(s.content) > 50 for s in resp.sections) and  # Each section has substantial content
                len(resp.quiz) >= 3  # At least 3 quiz questions
            )
            
            if has_substantial_content:
                # Note: We're not caching here to avoid circular imports
                return resp, "llm"
            # Log when we're falling back to stub due to incomplete or low-quality LLM response
            logger.warning(f"LLM response for '{topic}' was low-quality - falling back to stub. "
                          f"Sections: {len(resp.sections)}, Quiz: {len(resp.quiz)}, "
                          f"Section quality: {[len(s.content) for s in resp.sections]}")
            return await _stub_lesson(topic, age), "stub"
        except Exception as e:
            # Include raw excerpt to aid troubleshooting and reduce persistent stub fallbacks
            try:
                logger.warning(f"Structured lesson LLM error for topic '{topic}': {e}. raw_excerpt={raw_excerpt}")
            except Exception:
                logger.warning(f"Structured lesson LLM error for topic '{topic}': {e}")
            return await _stub_lesson(topic, age), "stub"
    else:
        return await _stub_lesson(topic, age), "stub"

async def _get_or_compute_lesson(cache_key: str, topic: str, age: Optional[int], groq_client) -> tuple[StructuredLessonResponse, str]:
    """Get or compute lesson with deduplication."""
    fut = _INFLIGHT_LESSONS.get(cache_key)
    if fut and not fut.done():
        return await fut
    loop = asyncio.get_event_loop()
    fut = loop.create_future()
    _INFLIGHT_LESSONS[cache_key] = fut
    async def _run():
        try:
            result = await _compute_structured_lesson(cache_key, topic, age, groq_client)
            fut.set_result(result)
        except Exception as e:
            logger.error(f"Structured lesson compute failed: {e}")
            import uuid
            stub_result = await _stub_lesson(topic, age)
            stub_result.id = str(uuid.uuid4())
            fut.set_result((stub_result, "stub"))
        finally:
            _INFLIGHT_LESSONS.pop(cache_key, None)
    asyncio.create_task(_run())
    return await fut

async def structured_lesson_handler(text: str, age: Optional[int] = None, groq_client=None) -> tuple[str, Optional[List[Dict[str, Any]]]]:
    """Handle structured lesson mode - generates full topic walkthrough with quiz."""
    if not text:
        return "Please provide a topic for the lesson.", None
    
    try:
        # Use the structured lesson generation logic
        cache_key = hashlib.md5(f"{text}|{age}".encode()).hexdigest()[:16]
        lesson, src = await _get_or_compute_lesson(cache_key, text, age, groq_client)
        
        # Format the lesson as a string response
        response_parts = []
        
        if lesson.introduction:
            response_parts.append(lesson.introduction)
        
        if lesson.sections:
            for section in lesson.sections:
                if section.title:
                    response_parts.append(f"\n**{section.title}**")
                if section.content:
                    response_parts.append(section.content)
        
        if lesson.diagram:
            response_parts.append(f"\nDiagram:\n{lesson.diagram}")
        
        response_text = "\n\n".join(response_parts)
        
        # Extract quiz if available
        quiz_data = None
        if lesson.quiz:
            quiz_data = []
            for quiz_item in lesson.quiz:
                quiz_data.append({
                    "q": quiz_item.q,
                    "options": quiz_item.options,
                    "answer": quiz_item.answer
                })
        
        return response_text, quiz_data
    except Exception as e:
        logger.error(f"Error in structured lesson handler: {e}")
        return f"Sorry, I couldn't generate a lesson about {text}. Please try another topic.", None

async def maths_tutor_handler(text: str, age: Optional[int] = None, groq_client=None) -> tuple[str, Optional[List[Dict[str, Any]]]]:
    """Handle maths tutor mode - solves equations step-by-step with quiz."""
    if not text:
        return "Please provide a math problem to solve.", None
    
    try:
        # Initialize math solver service
        math_service = MathSolverService(cache_repo=_CACHE, groq_client=groq_client)
        
        # Use the existing math solver service
        result = await math_service.solve_problem(text)
        
        # Format the solution as a string response
        response_parts = []
        
        if hasattr(result, 'steps') and result.steps:
            for step in result.steps:
                if step.description:
                    response_parts.append(step.description)
                if step.expression:
                    response_parts.append(f"  {step.expression}")
        
        if hasattr(result, 'solution') and result.solution:
            response_parts.append(f"\nFinal Answer: {result.solution}")
        
        response_text = "\n".join(response_parts)
        
        # Generate a quiz question related to the math problem
        quiz_data = None
        try:
            if groq_client:
                # Generate a quiz question about the concept
                quiz_prompt = f"Create one multiple-choice quiz question (with answer) about the math concept in this problem: {text}"
                
                quiz_response = groq_client.chat.completions.create(
                    model="llama-3.1-8b-instant",
                    messages=[
                        {"role": "system", "content": "Return ONLY valid JSON in this exact format: {\"q\": \"question text\", \"options\": [\"A) option1\", \"B) option2\", \"C) option3\", \"D) option4\"], \"answer\": \"A) option1\"}"},
                        {"role": "user", "content": quiz_prompt}
                    ],
                    temperature=0.3,
                    max_tokens=200
                )
                
                quiz_content = quiz_response.choices[0].message.content
                if quiz_content:
                    try:
                        quiz_json = json.loads(quiz_content)
                        quiz_data = [quiz_json]
                    except json.JSONDecodeError:
                        pass
        except Exception as e:
            logger.warning(f"Could not generate quiz for math problem: {e}")
        
        return response_text, quiz_data
    except Exception as e:
        logger.error(f"Error in maths tutor handler: {e}")
        return f"Sorry, I couldn't solve the math problem: {text}. Please check the format and try again.", None

async def chat_handler(text: str, age: Optional[int] = None, groq_client=None) -> tuple[str, None]:
    """Handle chat mode - friendly open-ended conversation."""
    if not text:
        return "Hello! What would you like to chat about?", None
    
    try:
        if not groq_client:
            return "Chat mode requires the AI service to be configured.", None
        
        # Create age-appropriate system prompt
        age_context = ""
        if age is not None:
            if age <= 5:
                age_context = "The user is a young child. Use simple words and short sentences."
            elif age <= 12:
                age_context = "The user is a child. Use clear explanations and examples."
            elif age <= 18:
                age_context = "The user is a teenager. You can use more complex concepts."
            else:
                age_context = "The user is an adult. You can use advanced vocabulary and concepts."
        
        system_prompt = f"You are Lana AI, a friendly and knowledgeable educational assistant. {age_context} Respond in a conversational, helpful tone."
        
        response = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": text}
            ],
            temperature=0.7,
            max_tokens=500
        )
        
        reply = response.choices[0].message.content
        return reply or "I'm here to help! What else would you like to know?", None
    except Exception as e:
        logger.error(f"Error in chat handler: {e}")
        return "Sorry, I'm having trouble chatting right now. Please try again.", None

async def quick_answer_handler(text: str, age: Optional[int] = None, groq_client=None) -> tuple[str, None]:
    """Handle quick answer mode - concise bullet point answers."""
    if not text:
        return "Please provide a question for a quick answer.", None
    
    try:
        if not groq_client:
            return "Quick answer mode requires the AI service to be configured.", None
        
        # Create age-appropriate system prompt
        age_context = ""
        if age is not None:
            if age <= 5:
                age_context = "The user is a young child. Use very simple words and short sentences."
            elif age <= 12:
                age_context = "The user is a child. Use clear, simple explanations."
            elif age <= 18:
                age_context = "The user is a teenager. You can use slightly more complex language."
            else:
                age_context = "The user is an adult. You can use standard vocabulary."
        
        system_prompt = f"You are Lana AI. Provide a concise answer in 1-2 short sentences. {age_context} Do not use markdown or formatting."
        
        response = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": text}
            ],
            temperature=0.3,
            max_tokens=200
        )
        
        reply = response.choices[0].message.content
        return reply or "I don't have a quick answer for that. Try asking in a different way.", None
    except Exception as e:
        logger.error(f"Error in quick answer handler: {e}")
        return "Sorry, I couldn't provide a quick answer right now. Please try again.", None

MODE_MAP = {
    "default": structured_lesson_handler,
    "maths": maths_tutor_handler,
    "chat": chat_handler,
    "quick": quick_answer_handler
}

@router.post("/", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """Unified chat endpoint that handles different modes based on user input."""
    try:
        # Import Groq client here to avoid circular imports
        try:
            from main import _GROQ_CLIENT
        except ImportError:
            _GROQ_CLIENT = None
        
        # Extract mode and clean text from message
        mode, clean_text = extract_mode(request.message)
        
        # Validate mode
        if mode not in MODE_MAP:
            mode = "default"  # Default to structured lesson if mode not recognized
        
        # Get the appropriate handler
        handler = MODE_MAP[mode]
        
        # Call the handler with Groq client
        reply, quiz_data = await handler(clean_text, request.age, _GROQ_CLIENT)
        
        return ChatResponse(
            mode=mode,
            reply=reply,
            quiz=quiz_data
        )
    except Exception as e:
        logger.error(f"Error in chat endpoint: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")