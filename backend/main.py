# backend/main.py
"""
Simplified FastAPI application for Lana AI Backend.
"""

import logging

# FastAPI imports
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.middleware.security_headers_middleware import SecurityHeadersMiddleware
from app.settings import load_settings

from app.api.routes.tts import router as tts_router
from app.api.router import api_router
from fastapi.responses import StreamingResponse
import json
try:
    from groq import Groq
except Exception:
    Groq = None

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Create FastAPI application
app = FastAPI(
    title="Lana AI API",
    description="Backend API for Lana AI educational platform",
    version="1.0.0",
)

# Load settings for global config
settings = load_settings()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add security headers middleware
app.add_middleware(SecurityHeadersMiddleware)

# Root endpoint
@app.get("/", tags=["Root"]) 
async def root():
    """Simple root endpoint to confirm API is accessible."""
    return {"message": "Welcome to Lana AI API", "status": "online"}

# Removed duplicate sample lesson endpoints; use `/api/lessons` router from app.api.routes.lessons
# Removed duplicate math solver sample; use `/api/math-solver/solve` route from app.api.routes.math_solver
# Include modular API routes under /api
# (only TTS for now to avoid pulling extra dependencies)
# app.include_router(tts_router, prefix="/api/tts")
app.include_router(api_router, prefix="/api")

from pydantic import BaseModel, Field, field_validator
from typing import List, Optional


def sanitize_text(text: str) -> str:
    import re, html
    if not text:
        return ""
    text = html.escape(text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


class ClassificationItem(BaseModel):
    type: str
    description: str

    @field_validator("type", "description")
    def _san(cls, v):
        return sanitize_text(v)


class SectionItem(BaseModel):
    title: str
    content: str

    @field_validator("title", "content")
    def _san(cls, v):
        return sanitize_text(v)


class QuizItem(BaseModel):
    question: str
    options: List[str]
    answer: str

    @field_validator("question", "answer")
    def _san(cls, v):
        return sanitize_text(v)

    @field_validator("options")
    def _san_opts(cls, v):
        return [sanitize_text(o) for o in v]


class StructuredLessonRequest(BaseModel):
    topic: str
    age: Optional[int] = None

    @field_validator("topic")
    def _val_topic(cls, v):
        v = sanitize_text(v.strip())
        if len(v) < 2:
            raise ValueError("Topic too short")
        return v


class StructuredLessonResponse(BaseModel):
    introduction: Optional[str] = None
    classifications: List[ClassificationItem] = []
    sections: List[SectionItem]
    diagram: str = ""
    quiz: List[QuizItem]


@app.post("/api/structured-lesson", response_model=StructuredLessonResponse, tags=["Lessons"]) 
async def create_structured_lesson(req: StructuredLessonRequest):
    """Create a structured lesson from a topic and optional age constraints."""
    def _stub(topic: str) -> StructuredLessonResponse:
        intro = f"Let's learn about {topic} in a clear, friendly way."
        classifications = [ClassificationItem(type="Category", description=topic.title())]
        sections = [
            SectionItem(title="Overview", content=f"{topic} — key ideas and examples."),
            SectionItem(title="Details", content=f"Deeper look at {topic}."),
        ]
        quiz = [
            QuizItem(question=f"What is {topic}?", options=[f"A {topic} concept", "Not related"], answer=f"A {topic} concept"),
        ]
        return StructuredLessonResponse(
            introduction=intro,
            classifications=classifications,
            sections=sections,
            diagram="",
            quiz=quiz,
        )

    topic = req.topic
    age = req.age
    # Use LLM if configured; otherwise fall back to stub
    if Groq and GROQ_API_KEY:
        try:
            client = Groq(api_key=GROQ_API_KEY)
            sys_prompt = (
                "You are a helpful tutor who produces a structured lesson as strict JSON. "
                "Return only JSON with keys: introduction (string), classifications (array of {type, description}), "
                "sections (array of {title, content}), diagram (string; ASCII or description), "
                "quiz (array of {question, options, answer}). Keep language clear for the learner."
            )
            user_prompt = {
                "topic": topic,
                "age": age,
                "requirements": "Educational, concise, accurate, friendly."
            }
            completion = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                temperature=0.3,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": sys_prompt},
                    {"role": "user", "content": json.dumps(user_prompt)},
                ],
            )
            content = completion.choices[0].message.content
            data = json.loads(content)
            resp = StructuredLessonResponse(
                introduction=data.get("introduction"),
                classifications=[ClassificationItem(**c) for c in data.get("classifications", [])],
                sections=[SectionItem(**s) for s in data.get("sections", [])],
                diagram=data.get("diagram", ""),
                quiz=[QuizItem(**q) for q in data.get("quiz", [])],
            )
            # Ensure minimum content
            if not resp.sections:
                return _stub(topic)
            return resp
        except Exception as e:
            logger.warning(f"Structured lesson LLM error: {e}")
            return _stub(topic)
    else:
        return _stub(topic)
class TTSRequest(BaseModel):
    text: str


class TTSResponse(BaseModel):
    message: str
    text: str
    audio_url: str


@app.post("/api/tts/synthesize_stub", response_model=TTSResponse, tags=["Text-to-Speech"]) 
async def synthesize_speech(req: TTSRequest):
    """Stub TTS endpoint demonstrating Pydantic request/response models."""
    return TTSResponse(
        message="TTS synthesis stub",
        text=req.text,
        audio_url="This would be a URL to the synthesized audio",
    )
    # History endpoints moved to app.api.routes.history

# Health endpoint for tests
@app.get("/health")
async def health():
    """Liveness probe for Render and tests."""
    return {"status": "ok"}
from typing import Any, Dict, List, Optional
from fastapi import HTTPException, Query
from pydantic import BaseModel

from app.config import SUPABASE_URL, SUPABASE_KEY
from app.repositories.interfaces import IChatRepository
try:
    from app.repositories.supabase_chat_repository import SupabaseChatRepository
except Exception:
    SupabaseChatRepository = None  # Graceful if supabase SDK not installed


class InMemoryChatRepository(IChatRepository):
    """Simple in-memory chat repository for development fallback."""

    def __init__(self) -> None:
        self._store: Dict[str, List[Dict[str, Any]]] = {}

    async def append_message(self, sid: str, role: str, content: str) -> bool:
        if not sid:
            return False
        self._store.setdefault(sid, []).append(
            {
                "sid": sid,
                "role": role,
                "content": content,
                "created_at": "",
            }
        )
        return True

    async def get_history(self, sid: str, limit: int = 100) -> List[Dict[str, Any]]:
        messages = self._store.get(sid, [])
        return messages[:limit]



@app.post("/api/structured-lesson/stream", tags=["Lessons"])
async def stream_structured_lesson(req: StructuredLessonRequest):
    """Stream a structured lesson as a single SSE 'done' event for fast UI consumption."""
    try:
        # Reuse the non-stream generator for content
        lesson = await create_structured_lesson(req)
        async def event_generator():
            # Use model_dump for Pydantic v2 compatibility
            try:
                payload_lesson = lesson.model_dump()
            except Exception:
                payload_lesson = lesson.dict()
            payload = {"type": "done", "lesson": payload_lesson}
            yield f"data: {json.dumps(payload)}\n\n"
        return StreamingResponse(event_generator(), media_type="text/event-stream")
    except Exception as e:
        err = {"type": "error", "message": str(e)}
        async def error_stream():
            yield f"data: {json.dumps(err)}\n\n"
        return StreamingResponse(error_stream(), media_type="text/event-stream")
