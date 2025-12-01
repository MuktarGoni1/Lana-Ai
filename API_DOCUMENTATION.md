# API Documentation

## Overview

This document provides detailed information about the Lana AI API endpoints, including request/response formats, authentication requirements, and usage examples.

## Base URL

```
https://api.lana.ai
```

## Authentication

Most API endpoints require authentication using a valid Supabase JWT token. Include the token in the `Authorization` header:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

## Error Handling

All API responses follow a consistent error format:

```json
{
  "error": "Error message",
  "message": "Detailed error description"
}
```

## API Endpoints

### Health Check

#### `GET /health`

Check the health status of the API.

**Response:**
```json
{
  "status": "ok"
}
```

### Structured Lessons

#### `POST /api/structured-lesson`

Generate a structured lesson on a specific topic.

**Request Body:**
```json
{
  "topic": "Photosynthesis",
  "age": 12
}
```

**Response:**
```json
{
  "introduction": "Photosynthesis is the process by which plants convert light energy into chemical energy...",
  "classifications": [
    {
      "type": "Process",
      "description": "Biological process in plants"
    }
  ],
  "sections": [
    {
      "title": "What is Photosynthesis?",
      "content": "Photosynthesis is the process by which green plants and some other organisms use sunlight to synthesize foods from carbon dioxide and water..."
    }
  ],
  "diagram": "Photosynthesis process diagram description",
  "quiz": [
    {
      "question": "What do plants need for photosynthesis?",
      "options": ["Sunlight", "Water", "Carbon dioxide", "All of the above"],
      "answer": "All of the above"
    }
  ]
}
```

#### `POST /api/structured-lesson/stream`

Stream a structured lesson on a specific topic.

**Request Body:**
```json
{
  "topic": "Cellular Respiration",
  "age": 14
}
```

**Response:**
Server-Sent Events stream with lesson content.

### Math Solver

#### `POST /api/solve-math`

Solve a mathematical problem.

**Request Body:**
```json
{
  "problem": "Solve for x: 2x + 5 = 15",
  "age": 13
}
```

**Response:**
```json
{
  "problem": "Solve for x: 2x + 5 = 15",
  "solution": "x = 5",
  "steps": [
    "Subtract 5 from both sides: 2x = 10",
    "Divide both sides by 2: x = 5"
  ]
}
```

### Text-to-Speech

#### `POST /api/tts`

Convert text to speech.

**Request Body:**
```json
{
  "text": "Welcome to Lana AI, your personalized learning assistant."
}
```

**Response:**
Audio/WAV stream

#### `POST /api/tts/lesson`

Convert an entire lesson to speech.

**Request Body:**
```json
{
  "lesson": {
    "introduction": "Welcome to this lesson on photosynthesis...",
    "sections": [
      {
        "title": "What is Photosynthesis?",
        "content": "Photosynthesis is the process by which..."
      }
    ]
  }
}
```

**Response:**
Audio/WAV stream

### User History

#### `GET /api/history`

Get user's search history.

**Response:**
```json
[
  {
    "id": "history_item_id",
    "uid": "user_id",
    "title": "Photosynthesis",
    "created_at": "2023-01-01T00:00:00Z"
  }
]
```

#### `POST /api/history`

Add an item to user's search history.

**Request Body:**
```json
{
  "title": "Cellular Respiration"
}
```

**Response:**
```json
{
  "id": "new_history_item_id",
  "uid": "user_id",
  "title": "Cellular Respiration",
  "created_at": "2023-01-01T00:00:00Z"
}
```

#### `DELETE /api/history/{id}`

Delete an item from user's search history.

**Response:**
```json
{
  "message": "History item deleted successfully"
}
```

### User Profile

#### `GET /api/profile`

Get user profile information.

**Response:**
```json
{
  "id": "user_id",
  "email": "user@example.com",
  "name": "John Doe",
  "age": 12,
  "created_at": "2023-01-01T00:00:00Z"
}
```

#### `PUT /api/profile`

Update user profile information.

**Request Body:**
```json
{
  "name": "John Smith",
  "age": 13
}
```

**Response:**
```json
{
  "id": "user_id",
  "email": "user@example.com",
  "name": "John Smith",
  "age": 13,
  "created_at": "2023-01-01T00:00:00Z"
}
```

### Cache Management

#### `GET /api/cache/stats`

Get cache performance statistics.

**Response:**
```json
{
  "hits": 100,
  "misses": 20,
  "hit_rate": 83.33
}
```

#### `POST /api/cache/reset`

Reset cache.

**Response:**
```json
{
  "message": "Cache reset successfully"
}
```

## Rate Limiting

API endpoints are subject to rate limiting to prevent abuse:

- `/api/structured-lesson/stream`: 5 requests per minute
- `/api/tts`: 1 request per minute
- All other endpoints: 60 requests per minute

Exceeding rate limits will result in a 429 (Too Many Requests) response.

## Usage Examples

### JavaScript Example

```javascript
// Get user profile
async function getUserProfile() {
  try {
    const response = await fetch('https://api.lana.ai/api/profile', {
      headers: {
        'Authorization': `Bearer ${jwtToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const profile = await response.json();
    console.log('User profile:', profile);
  } catch (error) {
    console.error('Error fetching user profile:', error);
  }
}

// Generate a structured lesson
async function generateLesson(topic, age) {
  try {
    const response = await fetch('https://api.lana.ai/api/structured-lesson', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${jwtToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ topic, age })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const lesson = await response.json();
    console.log('Generated lesson:', lesson);
  } catch (error) {
    console.error('Error generating lesson:', error);
  }
}
```

### Python Example

```python
import requests
import json

# Get user profile
def get_user_profile(jwt_token):
    url = "https://api.lana.ai/api/profile"
    headers = {
        "Authorization": f"Bearer {jwt_token}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching user profile: {e}")
        return None

# Generate a structured lesson
def generate_lesson(jwt_token, topic, age):
    url = "https://api.lana.ai/api/structured-lesson"
    headers = {
        "Authorization": f"Bearer {jwt_token}",
        "Content-Type": "application/json"
    }
    data = {
        "topic": topic,
        "age": age
    }
    
    try:
        response = requests.post(url, headers=headers, json=data)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error generating lesson: {e}")
        return None
```

## Best Practices

1. **Handle Errors Gracefully**
   - Always check response status codes
   - Implement retry logic for transient errors
   - Provide meaningful error messages to users

2. **Respect Rate Limits**
   - Implement rate limiting in your client
   - Use exponential backoff for retries
   - Cache responses when appropriate

3. **Secure Authentication**
   - Never expose JWT tokens in client-side code
   - Use secure storage for tokens
   - Implement token refresh mechanisms

4. **Monitor Usage**
   - Track API usage patterns
   - Monitor for unusual activity
   - Set up alerts for quota limits

## Support

For API support, contact:
- Email: api-support@lana.ai
- Documentation: https://docs.lana.ai