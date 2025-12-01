# Lana AI Backend API Endpoint Analysis Report

## Overview
This report provides a comprehensive analysis of all API endpoints in the Lana AI backend system, covering URL structure, HTTP methods, request/response formats, status codes, error handling, and other important aspects.

## Endpoint Analysis

### 1. Health Endpoints

#### 1.1 Health Check
- **URL**: `/health`
- **Method**: GET
- **Purpose**: Liveness probe for Render and tests
- **Expected Response**: 
  ```json
  {"status": "ok"}
  ```
- **Status Codes**: 
  - 200: Service is healthy
- **Authentication**: Not required
- **Rate Limiting**: None

#### 1.2 Database Health Check
- **URL**: `/api/health/db`
- **Method**: GET
- **Purpose**: Check Supabase connectivity
- **Expected Response**: 
  ```json
  {"status": "ok", "service": "supabase", "count": 0}
  ```
- **Status Codes**: 
  - 200: Database connection successful
  - 500: Database connection failed
- **Authentication**: Not required
- **Rate Limiting**: None

### 2. Root Endpoints

#### 2.1 API Root
- **URL**: `/`
- **Method**: GET
- **Purpose**: Confirm API accessibility
- **Expected Response**: 
  ```json
  {"message": "Welcome to Lana AI API", "status": "online"}
  ```
- **Status Codes**: 
  - 200: API is accessible
- **Authentication**: Not required
- **Rate Limiting**: None

### 3. Lesson Endpoints

#### 3.1 Create Structured Lesson
- **URL**: `/api/structured-lesson`
- **Method**: POST
- **Purpose**: Generate a structured lesson from a topic
- **Request Body**:
  ```json
  {
    "topic": "string",
    "age": "integer (optional)"
  }
  ```
- **Response Format**:
  ```json
  {
    "id": "string",
    "introduction": "string",
    "classifications": [
      {
        "type": "string",
        "description": "string"
      }
    ],
    "sections": [
      {
        "title": "string",
        "content": "string"
      }
    ],
    "diagram": "string",
    "quiz": [
      {
        "q": "string",
        "options": ["string"],
        "answer": "string"
      }
    ]
  }
  ```
- **Status Codes**: 
  - 200: Lesson generated successfully
  - 400: Invalid request data
  - 500: Internal server error
- **Authentication**: Not required
- **Rate Limiting**: None
- **Caching**: Uses in-memory cache with TTL

#### 3.2 Stream Structured Lesson
- **URL**: `/api/structured-lesson/stream`
- **Method**: POST
- **Purpose**: Stream a structured lesson as SSE
- **Request Body**: Same as structured lesson endpoint
- **Response Format**: Server-Sent Events stream
- **Status Codes**: 
  - 200: Stream started successfully
  - 400: Invalid request data
  - 500: Internal server error
- **Authentication**: Not required
- **Rate Limiting**: None

#### 3.3 Get Lessons List
- **URL**: `/api/lessons/`
- **Method**: GET
- **Purpose**: Get popular lesson topics
- **Query Parameters**: 
  - `limit`: integer (1-50, default: 10)
- **Response Format**: Array of strings
- **Status Codes**: 
  - 200: Topics retrieved successfully
- **Authentication**: Not required
- **Rate Limiting**: None

#### 3.4 Get Specific Lesson
- **URL**: `/api/lessons/{lesson_id}`
- **Method**: GET
- **Purpose**: Get a specific lesson by ID
- **Path Parameters**: 
  - `lesson_id`: string
- **Response Format**: Lesson object
- **Status Codes**: 
  - 200: Lesson retrieved successfully
  - 404: Lesson not found
- **Authentication**: Not required
- **Rate Limiting**: None

#### 3.5 Get Lesson Quiz
- **URL**: `/api/lessons/{lesson_id}/quiz`
- **Method**: GET
- **Purpose**: Get quiz data for a specific lesson
- **Path Parameters**: 
  - `lesson_id`: string
- **Response Format**: Array of quiz items
- **Status Codes**: 
  - 200: Quiz retrieved successfully
  - 404: Lesson not found
- **Authentication**: Not required
- **Rate Limiting**: None

### 4. Text-to-Speech (TTS) Endpoints

#### 4.1 Synthesize Speech
- **URL**: `/api/tts/`
- **Method**: POST
- **Purpose**: Convert text to speech and return audio
- **Request Body**:
  ```json
  {
    "text": "string",
    "voice": "string (optional, default: 'leda')"
  }
  ```
- **Response Format**: Streaming audio/wav
- **Status Codes**: 
  - 200: Audio generated successfully
  - 400: Invalid request data
  - 503: TTS service unavailable
  - 500: Internal server error
- **Authentication**: Not required
- **Rate Limiting**: Yes (middleware-based)
- **Headers**: 
  - `Cache-Control`: no-store
  - `Content-Disposition`: inline; filename="speech.wav"

#### 4.2 Synthesize Lesson Speech
- **URL**: `/api/tts/lesson`
- **Method**: POST
- **Purpose**: Convert structured lesson to speech
- **Request Body**:
  ```json
  {
    "lesson": {},
    "mode": "string (optional, default: 'full')",
    "section_index": "integer (optional)",
    "voice": "string (optional, default: 'leda')"
  }
  ```
- **Response Format**: Streaming audio/wav
- **Status Codes**: 
  - 200: Audio generated successfully
  - 400: Invalid request data
  - 503: TTS service unavailable
  - 500: Internal server error
- **Authentication**: Not required
- **Rate Limiting**: Yes (middleware-based)

### 5. Math Solver Endpoints

#### 5.1 Solve Math Problem
- **URL**: `/api/math-solver/solve`
- **Method**: POST
- **Purpose**: Solve a math problem using Groq
- **Request Body**:
  ```json
  {
    "problem": "string"
  }
  ```
- **Response Format**: Math solution object
- **Status Codes**: 
  - 200: Problem solved successfully
  - 400: Invalid request data
  - 500: Internal server error
- **Authentication**: Not required
- **Rate Limiting**: None

### 6. Chat Endpoints

#### 6.1 Unified Chat Endpoint
- **URL**: `/api/chat/`
- **Method**: POST
- **Purpose**: Handle different chat modes based on user input
- **Request Body**:
  ```json
  {
    "user_id": "string",
    "message": "string",
    "age": "integer (optional)"
  }
  ```
- **Response Format**:
  ```json
  {
    "mode": "string",
    "reply": "string",
    "quiz": [
      {
        "q": "string",
        "options": ["string"],
        "answer": "string"
      }
    ],
    "error": "string (optional)"
  }
  ```
- **Supported Modes**:
  - `default`: Structured lesson mode
  - `maths`: Math tutor mode
  - `chat`: Friendly conversation mode
  - `quick`: Concise bullet point answers
- **Status Codes**: 
  - 200: Chat response generated successfully
  - 400: Invalid request data
  - 500: Internal server error
- **Authentication**: Not required
- **Rate Limiting**: None

### 7. History Endpoints

#### 7.1 Get Chat History
- **URL**: `/api/history`
- **Method**: GET
- **Purpose**: Get history for a user-owned session
- **Query Parameters**: 
  - `sid`: string (required)
  - `limit`: integer (1-500, default: 100)
- **Response Format**: Array of chat messages
- **Status Codes**: 
  - 200: History retrieved successfully
  - 403: Forbidden (user doesn't own session)
  - 404: Session not found
  - 500: Internal server error
- **Authentication**: Required
- **Rate Limiting**: None

#### 7.2 Post Chat Message
- **URL**: `/api/history`
- **Method**: POST
- **Purpose**: Append a message to chat history
- **Request Body**:
  ```json
  {
    "sid": "string",
    "role": "string",
    "content": "string"
  }
  ```
- **Response Format**:
  ```json
  {"ok": true}
  ```
- **Status Codes**: 
  - 200: Message stored successfully
  - 403: Forbidden (user doesn't own session)
  - 500: Internal server error
- **Authentication**: Required
- **Rate Limiting**: None

### 8. Jobs Endpoints

#### 8.1 Get Job Status
- **URL**: `/api/jobs/{job_id}/status`
- **Method**: GET
- **Purpose**: Get the status of a job
- **Path Parameters**: 
  - `job_id`: string
- **Response Format**:
  ```json
  {
    "job_id": "string",
    "status": "string",
    "progress": "integer (optional)",
    "result": "object (optional)",
    "failed_reason": "string (optional)"
  }
  ```
- **Status Codes**: 
  - 200: Job status retrieved successfully
  - 404: Job not found
  - 500: Internal server error
- **Authentication**: Required
- **Rate Limiting**: None

### 9. Cache Management Endpoints

#### 9.1 Reset Cache
- **URL**: `/api/cache/reset`
- **Method**: POST
- **Purpose**: Reset in-memory caches
- **Request Body**:
  ```json
  {
    "namespaces": ["string"] (optional)
  }
  ```
- **Response Format**:
  ```json
  {"ok": true, "namespaces": "all" or array}
  ```
- **Status Codes**: 
  - 200: Cache reset successfully
  - 500: Internal server error
- **Authentication**: Not required
- **Rate Limiting**: None

### 10. Metrics Endpoints

#### 10.1 Get Metrics
- **URL**: `/api/metrics`
- **Method**: GET
- **Purpose**: Return basic per-path timing metrics
- **Response Format**: Metrics object
- **Status Codes**: 
  - 200: Metrics retrieved successfully
- **Authentication**: Not required
- **Rate Limiting**: None

## Security Analysis

### Authentication & Authorization
- Most endpoints do not require authentication
- History and Jobs endpoints require authentication
- JWT-based authentication using Supabase

### Data Validation
- Strong input validation using Pydantic models
- Sanitization of user inputs to prevent XSS attacks
- Length limits on text inputs
- Character restrictions to prevent injection attacks

### Rate Limiting
- TTS endpoints have rate limiting middleware
- Other endpoints do not have explicit rate limiting

### CORS Configuration
- Configurable CORS origins
- Defaults to localhost:3001 and lana-ai.onrender.com

## Performance Considerations

### Caching
- Structured lessons use in-memory caching with TTL
- Cache warming on startup
- Cache reset endpoint for clearing stale data

### Deduplication
- Single-flight pattern for expensive operations
- Prevents duplicate LLM calls for the same request

### Streaming
- TTS responses use streaming for faster delivery
- Structured lesson streaming endpoint for real-time UI updates

## Error Handling

### Standard Error Responses
- Consistent error message format
- Appropriate HTTP status codes
- Detailed error messages for debugging

### Fallback Mechanisms
- Stub responses for failed LLM calls
- Clear error messaging instead of generic templates
- Graceful degradation when external services are unavailable

## Recommendations

### Immediate Issues
1. **TTS Service**: Google API key is blocked/leaked, needs replacement
2. **LLM Integration**: Some structured lesson generation falls back to stub responses despite working Groq API

### Improvements
1. **Add Rate Limiting**: Implement rate limiting for all endpoints to prevent abuse
2. **Enhance Monitoring**: Add more detailed logging and monitoring for all endpoints
3. **Improve Documentation**: Create comprehensive API documentation with examples
4. **Add Tests**: Expand test coverage for all endpoints
5. **Security Hardening**: Review and strengthen authentication mechanisms

### Best Practices
1. **Consistent Error Handling**: Ensure all endpoints follow the same error response format
2. **Input Validation**: Continue using strong input validation for all endpoints
3. **Performance Optimization**: Monitor and optimize response times
4. **Security Audits**: Regular security audits of all endpoints