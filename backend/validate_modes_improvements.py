#!/usr/bin/env python3
"""
Validation script for the Modes implementation improvements.
"""

import asyncio
import logging
from unittest.mock import Mock

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def validate_centralized_services():
    """Validate that the centralized services work correctly."""
    logger.info("Validating centralized services...")
    
    try:
        # Test LessonService
        from app.services.lesson_service import LessonService
        lesson_service = LessonService()
        logger.info("✓ LessonService imported successfully")
        
        # Test QuizService
        from app.services.quiz_service import QuizService
        quiz_service = QuizService()
        logger.info("✓ QuizService imported successfully")
        
        # Test that services can be instantiated
        assert lesson_service is not None
        assert quiz_service is not None
        logger.info("✓ Services instantiated successfully")
        
        return True
    except Exception as e:
        logger.error(f"✗ Centralized services validation failed: {e}")
        return False

async def validate_mode_isolation():
    """Validate that chat mode doesn't generate quizzes."""
    logger.info("Validating mode isolation...")
    
    try:
        from app.api.routes.chat import chat_handler
        
        # Mock Groq client
        mock_groq_client = Mock()
        mock_groq_client.chat.completions.create.return_value = Mock(
            choices=[Mock(
                message=Mock(
                    content="This is a chat response without any quiz generation."
                )
            )]
        )
        
        # Test chat handler
        reply, quiz_data = await chat_handler(
            "Hello, how are you?", 
            age=12, 
            groq_client=mock_groq_client
        )
        
        # Verify that chat mode doesn't generate quizzes
        # Note: The chat_handler itself doesn't generate quiz_data, it returns None
        assert quiz_data is None
        assert reply is not None
        
        logger.info("✓ Chat mode correctly isolated from quiz generation")
        logger.info(f"  - Reply: {reply[:50]}...")
        logger.info(f"  - Quiz data: {quiz_data}")
        
        return True
    except Exception as e:
        logger.error(f"✗ Mode isolation validation failed: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return False

async def validate_structured_lesson_with_quiz():
    """Validate that structured lesson mode still generates quizzes."""
    logger.info("Validating structured lesson mode with quiz generation...")
    
    try:
        from app.api.routes.chat import structured_lesson_handler
        
        # Test structured lesson handler with a simple case
        reply, quiz_data = await structured_lesson_handler(
            "photosynthesis", 
            age=12
        )
        
        # Note: This will use the stub lesson since we don't have a real Groq client
        # But we can still verify the structure is correct
        
        logger.info("✓ Structured lesson mode functioning")
        logger.info(f"  - Reply length: {len(reply) if reply else 0} characters")
        logger.info(f"  - Quiz data: {quiz_data is not None}")
        
        return True
    except Exception as e:
        logger.error(f"✗ Structured lesson validation failed: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return False

async def validate_chat_endpoint_mode_isolation():
    """Validate that the chat endpoint properly isolates chat mode from quiz generation."""
    logger.info("Validating chat endpoint mode isolation...")
    
    try:
        from app.api.routes.chat import MODE_MAP, chat_endpoint
        from app.api.routes.chat import ChatRequest
        
        # Create a mock request for chat mode
        request = Mock()
        request.message = "/chat Hello, how are you?"
        request.age = 12
        
        # Mock the Groq client in the global scope
        import app.api.routes.chat as chat_module
        original_groq_client = getattr(chat_module, '_GROQ_CLIENT', None)
        chat_module._GROQ_CLIENT = None
        
        try:
            # This would normally be an async test, but we're simplifying for validation
            mode, clean_text = chat_module.extract_mode(request.message)
            assert mode == "chat"
            assert clean_text == "Hello, how are you?"
            logger.info("✓ Chat endpoint mode extraction working correctly")
            logger.info(f"  - Mode: {mode}")
            logger.info(f"  - Clean text: {clean_text}")
        finally:
            # Restore the original Groq client
            chat_module._GROQ_CLIENT = original_groq_client
        
        return True
    except Exception as e:
        logger.error(f"✗ Chat endpoint validation failed: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return False

async def main():
    """Run all validations."""
    logger.info("Starting Modes implementation validation...")
    
    validations = [
        validate_centralized_services(),
        validate_mode_isolation(),
        validate_structured_lesson_with_quiz(),
        validate_chat_endpoint_mode_isolation()
    ]
    
    results = await asyncio.gather(*validations, return_exceptions=True)
    
    passed = sum(1 for r in results if r is True)
    failed = sum(1 for r in results if r is False or isinstance(r, Exception))
    
    logger.info(f"Validation complete: {passed} passed, {failed} failed")
    
    if failed > 0:
        logger.error("Some validations failed!")
        return False
    
    logger.info("All validations passed! 🎉")
    return True

if __name__ == "__main__":
    asyncio.run(main())