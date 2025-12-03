# Frontend-Backend Endpoint Mapping

This document describes the API endpoints used in the Lana AI application and their mappings between the frontend and backend.

## Structured Lesson Endpoints

### POST /api/structured-lesson/stream
- **Frontend Usage**: Streaming structured lessons with Server-Sent Events
- **Backend Implementation**: FastAPI endpoint that generates and streams lesson content
- **Response Format**: JSON with lesson structure including introduction, sections, classifications, diagram, and quiz
- **Purpose**: Provides fast, streaming delivery of educational content

### POST /api/structured-lesson
- **Frontend Usage**: Non-streaming structured lessons (fallback)
- **Backend Implementation**: FastAPI endpoint that generates complete lesson content
- **Response Format**: JSON with complete lesson structure
- **Purpose**: Synchronous alternative to streaming endpoint

## Text-to-Speech Endpoints

### POST /api/tts
- **Frontend Usage**: Converting text to speech audio
- **Backend Implementation**: Google Gemini TTS service with caching
- **Response Format**: Audio/WAV stream
- **Purpose**: Provides audio narration for lesson content

### POST /api/tts/lesson
- **Frontend Usage**: Converting entire lessons to speech
- **Backend Implementation**: Specialized TTS service for structured lessons
- **Response Format**: Audio/WAV stream
- **Purpose**: Provides complete lesson audio narration

## Math Solver Endpoints

### POST /api/solve-math
- **Frontend Usage**: Solving mathematical problems with step-by-step explanations
- **Backend Implementation**: Combination of SymPy for deterministic solving and LLM for complex problems
- **Response Format**: JSON with solution steps and final answer
- **Purpose**: Educational math problem solving

## Utility Endpoints

### GET /health
- **Frontend Usage**: System health checks
- **Backend Implementation**: Health status endpoint
- **Response Format**: JSON with system status information
- **Purpose**: Monitoring and diagnostics

### GET /api/cache/stats
- **Frontend Usage**: Cache performance monitoring
- **Backend Implementation**: Cache statistics endpoint
- **Response Format**: JSON with cache hit/miss ratios and performance metrics
- **Purpose**: Performance monitoring and optimization

### POST /api/cache/reset
- **Frontend Usage**: Cache clearing for testing and maintenance
- **Backend Implementation**: Cache reset endpoint
- **Response Format**: JSON confirmation
- **Purpose**: Cache management

## Authentication Endpoints

Handled through Supabase authentication services:
- User registration
- Login/logout
- Session management
- Password reset

## Rate Limiting

Endpoints are protected by rate limiting on both frontend and backend:
- `/api/structured-lesson/stream`: 5 requests/minute (production), 10 requests/minute (development)
- `/api/tts`: 1 request/minute (production), 3 requests/minute (development)
- `/api/tts/lesson`: 1 request/minute (production), 3 requests/minute (development)

## Error Handling

All endpoints follow consistent error handling patterns:
- HTTP status codes for error classification
- JSON error responses with descriptive messages
- Client-side error mapping to user-friendly messages
- Automatic retry mechanisms for transient errors