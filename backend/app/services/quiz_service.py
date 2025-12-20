import logging
import json
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

class QuizService:
    """Centralized service for quiz generation and management."""

    def __init__(self):
        pass
        
    async def generate_quiz_for_lesson(self, topic: str, groq_client=None) -> Optional[List[Dict[str, Any]]]:
        """Generate a quiz for a given lesson topic."""
        if not groq_client:
            return None
            
        try:
            quiz_prompt = f"Create one multiple-choice quiz question (with answer) about this topic: {topic}"
            
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
                    return [quiz_json]
                except json.JSONDecodeError:
                    pass
        except Exception as e:
            logger.warning(f"Could not generate quiz for topic '{topic}': {e}")
            
        return None
        
    async def generate_quiz_for_math_problem(self, problem: str, groq_client=None) -> Optional[List[Dict[str, Any]]]:
        """Generate a quiz question related to a math problem."""
        if not groq_client:
            return None
            
        try:
            quiz_prompt = f"Create one multiple-choice quiz question (with answer) about the math concept in this problem: {problem}"
            
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
                    return [quiz_json]
                except json.JSONDecodeError:
                    pass
        except Exception as e:
            logger.warning(f"Could not generate quiz for math problem '{problem}': {e}")
            
        return None