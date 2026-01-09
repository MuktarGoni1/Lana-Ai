# Lana AI Modes Analysis

## Overview
Lana AI implements a multi-modal educational platform using FastAPI. The backend is structured around specific "Modes" that cater to different learning styles and requirements.

## Core Modes

### 1. Structured Lesson Mode
- **Purpose**: Generates comprehensive, structured educational content.
- **Endpoint**: `POST /api/structured-lesson`
- **Implementation**: `backend/main.py`
- **Logic**:
  - Accepts a `topic` and optional `age`.
  - Uses `LLMClient` (Groq/Llama-3) to generate a JSON structure containing:
    - Introduction
    - Classifications
    - Sections (Title/Content)
    - Quiz
  - Fallback: Static stub content if LLM is unavailable.
  - Streaming: `POST /api/structured-lesson/stream` supports SSE for real-time delivery.

### 2. Quick Mode
- **Purpose**: Provides rapid, concise summaries and key takeaways.
- **Endpoint**: `POST /api/quick/generate`
- **Implementation**: `backend/app/api/routes/quick_mode.py`
- **Logic**:
  - Similar to Structured Lesson but prompted for brevity and simplicity.
  - Returns a `QuickModeResponse` with "Essential Points" and "Key Takeaway".
  - Uses `LLMClient` for generation.

### 3. Math Solver Mode
- **Purpose**: Solves math problems with step-by-step explanations.
- **Endpoint**: `POST /api/math-solver/solve`
- **Implementation**: `backend/app/services/math_solver_service.py`
- **Logic**:
  - **Hybrid Approach**:
    1. **Cache Check**: Hashes input (SHA-256) to check for existing solutions.
    2. **SymPy**: Attempts to solve symbolically (algebra, equations) first.
    3. **LLM Fallback**: If SymPy fails, uses Groq/Llama-3 to generate steps and solution.
  - **Gate**: Optionally uses LLM to classify input as "math" or "general" before solving.

### 4. Text-to-Speech (TTS) Mode
- **Purpose**: Converts text to audio for accessibility and engagement.
- **Endpoint**: `POST /api/tts/synthesize`
- **Implementation**: `backend/app/services/tts_service.py`
- **Logic**:
  - **Gemini Integration**: Uses Google's Gemini Flash TTS model.
  - **Caching**: Hashes text+voice to cache audio files (MD5).
  - **Fallback**: Generates silent WAV if API fails (placeholder).
  - **Streaming**: Supports audio streaming.

### 5. Chat/History
- **Purpose**: Manages user interaction history.
- **Endpoint**: `/api/history`
- **Implementation**: `backend/app/services/history_service.py`
- **Logic**:
  - Stores messages with Session ID (SID).
  - Sanitizes inputs to prevent XSS.

## Architecture & Data Flow

### 1. Centralized LLM Client
- `backend/app/services/llm_client.py`
- **Singleton Pattern**: Ensures only one instance of Groq/Gemini clients exists.
- **Security**: Centralizes API Key access; handles missing keys gracefully.

### 2. Service Layer
- Business logic is encapsulated in `services/` (e.g., `MathSolverService`, `LessonService`).
- **Dependency Injection**: Routes inject services using FastAPI's `Depends`.

### 3. Caching
- **Implementation**: `backend/app/repositories/memory_cache_repository.py`
- **Strategy**: In-memory caching for Math and TTS to reduce API costs and latency.
- **Keys**: Hashed strings (SHA-256/MD5).

### 4. Security
- **Input Sanitization**: HTML entity encoding to prevent XSS.
- **Rate Limiting**: Middleware limits requests per minute.
- **Environment Variables**: Secrets managed via `.env` and `config.py`.

## Validation
- **Pydantic Models**: Strictly validate request/response bodies (e.g., `StructuredLessonRequest`).
- **Error Handling**: Custom exception handlers for 404/500 errors.
