"""
Chat API routes with mode-based functionality.
"""
from fastapi import APIRouter, HTTPException
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
from app.services.lesson_service import LessonService
from app.services.quiz_service import QuizService
from app.repositories.memory_cache_repository import MemoryCacheRepository

# Initialize services
_CACHE = MemoryCacheRepository()
_lesson_service = LessonService()
_quiz_service = QuizService()

# Conversation history storage (in-memory for now, could be extended to use Redis or database)
_conversation_histories: Dict[str, List[Dict[str, str]]] = {}

# Try to import Groq
try:
    from groq import Groq
    GROQ_AVAILABLE = True
except ImportError:
    Groq = None
    GROQ_AVAILABLE = False

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
    
    # Default to chat mode if no command found
    return "chat", message.strip()

def get_user_history(user_id: str, limit: int = 10) -> List[Dict[str, str]]:
    """Get conversation history for a user."""
    history = _conversation_histories.get(user_id, [])
    return history[-limit:] if len(history) > limit else history

def add_to_history(user_id: str, role: str, content: str):
    """Add a message to user's conversation history."""
    if user_id not in _conversation_histories:
        _conversation_histories[user_id] = []
    
    _conversation_histories[user_id].append({
        "role": role,
        "content": content
    })
    
    # Keep only the last 20 messages to prevent memory issues
    if len(_conversation_histories[user_id]) > 20:
        _conversation_histories[user_id] = _conversation_histories[user_id][-20:]

async def structured_lesson_handler(text: str, age: Optional[int] = None, groq_client=None) -> tuple[Dict[str, Any], Optional[List[Dict[str, Any]]]]:
    """Handle structured lesson mode - generates full topic walkthrough with quiz."""
    if not text:
        return {"error": "Please provide a topic for the lesson."}, None
    
    try:
        # Use the centralized lesson service
        lesson, src = await _lesson_service.generate_structured_lesson(text, age, groq_client, "lesson")
        
        # Extract quiz if available
        quiz_data = None
        if lesson.get("quiz"):
            quiz_data = lesson["quiz"]
        elif groq_client:
            # Generate quiz using the quiz service if not in lesson
            quiz_data = await _quiz_service.generate_quiz_for_lesson(text, groq_client)
        
        return lesson, quiz_data
    except Exception as e:
        logger.error(f"Error in structured lesson handler: {e}")
        return {"error": f"Sorry, I couldn't generate a lesson about {text}. Please try another topic."}, None
    except Exception as e:
        logger.error(f"Error in structured lesson handler: {e}")
        return f"Sorry, I couldn't generate a lesson about {text}. Please try another topic.", None

async def maths_tutor_handler(text: str, age: Optional[int] = None, groq_client=None) -> tuple[Dict[str, Any], Optional[List[Dict[str, Any]]]]:
    """Handle maths tutor mode - solves equations step-by-step with quiz."""
    if not text:
        return {"error": "Please provide a math problem to solve."}, None
    
    try:
        # Try to initialize Groq client if not provided and available
        if groq_client is None and GROQ_AVAILABLE:
            try:
                from main import settings
                if settings.groq_api_key:
                    groq_client = Groq(api_key=settings.groq_api_key)
            except Exception:
                pass
        
        # Initialize math solver service
        math_service = MathSolverService(cache_repo=_CACHE, groq_client=groq_client)
        
        # Use the existing math solver service
        result = await math_service.solve_problem(text)
        
        # Convert result to dictionary format
        math_solution = {
            "problem": text,
            "solution": getattr(result, 'solution', ''),
            "steps": []
        }
        
        # Add steps if available
        if hasattr(result, 'steps') and result.steps:
            math_solution["steps"] = [
                {
                    "description": step.description,
                    "expression": step.expression if hasattr(step, 'expression') else None
                }
                for step in result.steps
                if hasattr(step, 'description')
            ]
        
        # Generate a quiz question related to the math problem using the quiz service
        quiz_data = await _quiz_service.generate_quiz_for_math_problem(text, groq_client)
        
        return math_solution, quiz_data
    except Exception as e:
        logger.error(f"Error in maths tutor handler: {e}")
        return {"error": f"Sorry, I couldn't solve the math problem: {text}. Please check the format and try again."}, None

async def chat_handler(text: str, user_id: str, age: Optional[int] = None, groq_client=None) -> tuple[str, None]:
    """Handle chat mode - friendly open-ended conversation WITHOUT quiz generation."""
    if not text:
        return "Hello! What would you like to chat about?", None
    
    try:
        # Try to initialize Groq client if not provided and available
        if groq_client is None and GROQ_AVAILABLE:
            try:
                from main import settings
                if settings.groq_api_key:
                    groq_client = Groq(api_key=settings.groq_api_key)
            except Exception:
                pass
        
        if not groq_client:
            return "Chat mode requires the AI service to be configured.", None
        
        # Get conversation history for context
        history = get_user_history(user_id)
        
        # Create age-appropriate system prompt
        age_context = ""
        if age is not None:
            if age <= 5:
                age_context = "The user is a young child. Use simple words, short sentences, and be playful."
            elif age <= 12:
                age_context = "The user is a child. Use clear explanations, examples, and be encouraging."
            elif age <= 18:
                age_context = "The user is a teenager. You can use more complex concepts and be relatable."
            else:
                age_context = "The user is an adult. You can use advanced vocabulary and deeper insights."
        
        # Personalize based on user's conversation history
        personalization = ""
        if history:
            personalization = "Remember the ongoing conversation with the user and reference previous messages when relevant."
        
        system_prompt = f"""You are Lana AI, a friendly and knowledgeable educational assistant. 
{age_context} {personalization}
Respond in a conversational, helpful tone. Keep the conversation natural and engaging, like a human tutor would. 
Do not offer to generate quizzes or structured lessons unless specifically asked.
Be personalized and remember previous interactions."""

        # Prepare messages with history context
        messages = [{"role": "system", "content": system_prompt}]
        
        # Add conversation history
        for hist_item in history:
            messages.append({"role": hist_item["role"], "content": hist_item["content"]})
        
        # Add current user message
        messages.append({"role": "user", "content": text})
        
        response = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=messages,
            temperature=0.7,
            max_tokens=500
        )
        
        reply = response.choices[0].message.content
        
        # Add interaction to history
        if reply:
            add_to_history(user_id, "user", text)
            add_to_history(user_id, "assistant", reply)
        
        return reply or "I'm here to help! What else would you like to know?", None
    except Exception as e:
        logger.error(f"Error in chat handler: {e}")
        return "Sorry, I'm having trouble chatting right now. Please try again.", None

async def quick_answer_handler(text: str, age: Optional[int] = None, groq_client=None, user_id: str = "default_user") -> tuple[str, None]:
    """Handle quick answer mode - concise bullet point answers."""
    if not text:
        return "Please provide a question for a quick answer.", None
    
    try:
        # Try to initialize Groq client if not provided and available
        if groq_client is None and GROQ_AVAILABLE:
            try:
                from main import settings
                if settings.groq_api_key:
                    groq_client = Groq(api_key=settings.groq_api_key)
            except Exception:
                pass
        
        if not groq_client:
            return "Quick answer mode requires the AI service to be configured.", None
        
        # Create highly targeted age-appropriate system prompt for concise answers
        if age is not None:
            if age <= 5:
                # For young children - very simple language and short answers
                system_prompt = (
                    "You are Lana, a helpful AI assistant for young children. "
                    "Provide extremely simple, clear answers in just 2-3 short sentence. "
                    "Use basic words a 5-year-old can understand. "
                    "No markdown, no formatting, just plain text. "
                    "Example: 'The sky looks blue because of light.'"
                )
            elif age <= 12:
                # For children - clear explanations in 1-2 sentences
                system_prompt = (
                    "You are Lana, a helpful AI assistant for children. "
                    "Give clear, simple answers in 2-3 short sentences. "
                    "Use words a child can understand. "
                    "No markdown, no formatting, just plain text. "
                    "Example: 'Plants need sunlight, water, and soil to grow healthy.'"
                )
            elif age <= 18:
                # For teenagers - slightly more detailed but still concise
                system_prompt = (
                    "You are Lana, a helpful AI assistant for teenagers. "
                    "Provide concise answers in 2-3 sentences. "
                    "Be clear and to the point. "
                    "No markdown, no formatting, just plain text. "
                    "Example: 'Photosynthesis is how plants convert sunlight into energy to grow.'"
                )
            else:
                # For adults - concise but complete explanations
                system_prompt = (
                    "You are Lana, a helpful AI assistant. "
                    "Give concise, accurate answers in 2-3 sentences. "
                    "Be informative but brief. "
                    "No markdown, no formatting, just plain text. "
                    "Example: 'Quantum computing uses quantum bits (qubits) that can exist in multiple states simultaneously, unlike classical bits.'"
                )
        else:
            # Default concise answer prompt for unknown age
            system_prompt = (
                "You are Lana, a helpful AI assistant. "
                "Provide concise, clear answers in exactly 2-3 sentences. "
                "Be direct and avoid unnecessary elaboration. "
                "No markdown, no formatting, just plain text. "
                "Example: 'The Earth orbits the Sun due to gravitational attraction.'"
            )
        
        # Configure for ultra-concise responses
        response = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": text}
            ],
            temperature=0.2,      # Low temperature for consistent, factual responses
            max_tokens=150,        # Strict limit for brevity
            top_p=0.8,            # Moderate diversity
            frequency_penalty=0.3, # Penalize repetition
            presence_penalty=0.0   # Neutral on topic exploration
        )
        
        reply = response.choices[0].message.content
        # Ensure we have a response, with a fallback
        return reply or "I don't have a quick answer for that. Try rephrasing your question.", None
    except Exception as e:
        logger.error(f"Error in quick answer handler: {e}")
        return "Sorry, I couldn't provide a quick answer right now. Please try again.", None

MODE_MAP = {
    "default": chat_handler,
    "maths": maths_tutor_handler,
    "chat": chat_handler,
    "quick": quick_answer_handler,
    "lesson": structured_lesson_handler
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
        
        # If _GROQ_CLIENT is None, try to initialize it
        if _GROQ_CLIENT is None and GROQ_AVAILABLE:
            try:
                from main import settings
                if settings.groq_api_key:
                    _GROQ_CLIENT = Groq(api_key=settings.groq_api_key)
            except Exception as e:
                logger.warning(f"Could not initialize Groq client in chat endpoint: {e}")
        
        # Extract mode and clean text from message
        mode, clean_text = extract_mode(request.message)
        
        # Validate mode - ensure we use the correct handler
        if mode not in MODE_MAP:
            # If mode is not recognized, default to chat mode for conversational responses
            logger.warning(f"Unrecognized mode '{mode}' provided, defaulting to chat mode")
            mode = "chat"
        
        # Get the appropriate handler
        handler = MODE_MAP[mode]
        
        # Log the mode being used for debugging
        logger.info(f"Using mode: {mode} for message: {request.message[:50]}... User ID: {request.user_id}")
        
        # Call the handler with Groq client
        if mode == "chat":
            # Pass user_id for chat mode to enable conversation history
            reply, quiz_data = await handler(clean_text, request.user_id, request.age, _GROQ_CLIENT)
        else:
            reply, quiz_data = await handler(clean_text, request.age, _GROQ_CLIENT)
        
        # For chat mode, explicitly set quiz_data to None to prevent quiz generation
        if mode == "chat":
            quiz_data = None
        
        # Format reply as JSON for lesson and maths modes
        formatted_reply = reply
        if mode == "lesson" and isinstance(reply, dict):
            # For lesson mode, return the structured lesson as JSON
            formatted_reply = json.dumps(reply)
        elif mode == "maths" and isinstance(reply, dict):
            # For maths mode, return the solution as JSON
            formatted_reply = json.dumps(reply)
        
        # Log the response details
        reply_length = len(formatted_reply) if isinstance(formatted_reply, str) else 0
        quiz_count = len(quiz_data) if quiz_data else 0
        logger.info(f"Generated response for mode: {mode}, reply length: {reply_length}, quiz items: {quiz_count}")
        
        return ChatResponse(
            mode=mode,
            reply=formatted_reply,
            quiz=quiz_data
        )
    except Exception as e:
        logger.error(f"Error in chat endpoint: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
