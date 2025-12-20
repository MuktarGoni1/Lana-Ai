# Lana AI Response Structure Standards and Mode Switching

## Overview

Lana AI provides different modes of interaction with standardized response structures to ensure consistency and proper handling across all components.

## Default Mode

By default, Lana AI uses the **Structured Lesson** mode for all user questions unless explicitly changed. This mode provides comprehensive, educational content with sections, classifications, and quizzes.

## Available Modes

### 1. Structured Lesson Mode (`/lesson`)
- **Trigger**: Type `/lesson` followed by your topic
- **Purpose**: Detailed educational content with structured sections
- **Default**: This is the default mode for all questions

### 2. Maths Tutor Mode (`/Maths`)
- **Trigger**: Type `/Maths` followed by your math problem
- **Purpose**: Step-by-step math problem solving with explanations

### 3. Chat Mode (`/Chat`)
- **Trigger**: Type `/Chat` followed by your question
- **Purpose**: Open-ended conversational AI responses

### 4. Quick Answer Mode (`/quick`)
- **Trigger**: Type `/quick` followed by your question
- **Purpose**: Concise, bullet-point style answers

## Response Structure Standards

### Structured Lesson Response

```json
{
  "id": "unique-lesson-id",
  "introduction": "Brief overview of the topic",
  "classifications": [
    {
      "type": "Category name",
      "description": "Description of this category"
    }
  ],
  "sections": [
    {
      "title": "Section title",
      "content": "Detailed content for this section"
    }
  ],
  "diagram": "Text description of relevant diagrams",
  "quiz": [
    {
      "q": "Quiz question",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answer": "Correct option"
    }
  ]
}
```

### Math Solution Response

```json
{
  "problem": "Original math problem",
  "solution": "Final answer",
  "steps": [
    {
      "description": "Step explanation",
      "expression": "Mathematical expression (optional)"
    }
  ],
  "error": "Error message if applicable (optional)"
}
```

## Mode Switching and Persistence

### How Modes are Selected
1. **Command-based**: Users can type mode commands like `/lesson`, `/Maths`, `/Chat`, or `/quick`
2. **Default**: If no mode is specified, Structured Lesson mode is used
3. **Session Persistence**: The last selected mode is remembered throughout the session

### Mode Persistence
- Modes are stored in session storage
- The selected mode persists throughout the user's session
- Users can change modes at any time
- Default mode is automatically applied to all new questions

## Validation Standards

All responses are validated for:
1. **Structure**: Required fields must be present
2. **Content**: Fields must contain meaningful content (not empty or whitespace only)
3. **Format**: Data types must match expected formats
4. **Sanitization**: Content is sanitized for safe display

### Validation Rules

#### Structured Lesson
- `introduction` must be a non-empty string
- `sections` must be an array with at least one item
- Each section must have non-empty `title` and `content`
- `quiz` (if present) must be an array
- Each quiz item must have a question, at least 2 options, and an answer

#### Math Solution
- `problem` and `solution` must be non-empty strings
- `steps` (if present) must be an array
- Each step must have a non-empty description

## Error Handling

When invalid responses are received:
1. The system attempts to sanitize and repair the content
2. If sanitization fails, a user-friendly error message is displayed
3. Users can retry their request

## Best Practices for Developers

1. **Always validate responses** before rendering
2. **Sanitize content** to prevent XSS attacks
3. **Handle errors gracefully** with meaningful messages
4. **Respect mode persistence** for consistent user experience
5. **Provide clear placeholders** for each mode