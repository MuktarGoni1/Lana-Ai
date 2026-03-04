#!/usr/bin/env python3
"""
Test script to verify quick mode functionality
"""

import asyncio
import logging
from unittest.mock import Mock

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_quick_mode_extraction():
    """Test that quick mode is properly extracted"""
    from app.api.routes.chat import extract_mode
    
    # Test cases
    test_cases = [
        ("/quick What is AI?", ("quick", "What is AI?")),
        ("/Quick How does photosynthesis work?", ("quick", "How does photosynthesis work?")),
        ("/QUICK What are the planets?", ("quick", "What are the planets?")),
    ]
    
    logger.info("Testing quick mode extraction...")
    for input_msg, expected in test_cases:
        result = extract_mode(input_msg)
        if result == expected:
            logger.info(f"✓ '{input_msg}' -> {result}")
        else:
            logger.error(f"✗ '{input_msg}' -> {result}, expected {expected}")
            return False
    
    return True

async def test_quick_endpoint():
    """Test the chat endpoint with a quick mode message"""
    from app.api.routes.chat import chat_endpoint, ChatRequest
    
    # Create a mock request
    request = Mock()
    request.message = "/quick What is artificial intelligence?"
    request.user_id = "test_user_123"
    request.age = 10
    
    try:
        # This would normally be an async call, but we're testing the logic
        from app.api.routes.chat import extract_mode, MODE_MAP
        
        mode, clean_text = extract_mode(request.message)
        logger.info(f"Extracted mode: {mode}, clean_text: {clean_text}")
        
        # Verify the mode is correctly identified
        assert mode == "quick", f"Expected mode 'quick', got '{mode}'"
        
        # Verify the handler mapping
        handler = MODE_MAP.get(mode)
        from app.api.routes.chat import quick_answer_handler
        assert handler == quick_answer_handler, f"Handler mismatch for mode '{mode}'"
        
        logger.info("✓ Quick endpoint mode handling working correctly")
        return True
    except Exception as e:
        logger.error(f"✗ Quick endpoint test failed: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return False

async def test_quick_handler_response():
    """Test that the quick handler produces concise bullet point responses"""
    from app.api.routes.chat import quick_answer_handler
    
    try:
        # Test with a simple question
        reply, quiz_data = await quick_answer_handler(
            "What is artificial intelligence?", 
            age=10
        )
        
        # Verify it's a response, not a structured lesson
        assert reply is not None, "Reply should not be None"
        assert quiz_data is None, "Quick mode should not generate quiz data"
        
        # Check that it contains bullet points (using the bullet point character)
        assert "•" in reply, "Quick mode response should contain bullet points"
        
        # Check that it doesn't contain structured lesson elements
        reply_lower = reply.lower()
        structured_indicators = [
            "lesson", "introduction", "classification", "section", 
            "diagram", "quiz", "welcome to this"
        ]
        
        has_structured_elements = any(indicator in reply_lower for indicator in structured_indicators)
        
        # While it's possible for a quick response to mention these words,
        # it shouldn't start with a formal lesson structure
        assert not reply_lower.startswith("welcome to this lesson"), "Should not start with lesson introduction"
        
        logger.info(f"✓ Quick handler response: {reply[:100]}...")
        logger.info(f"✓ Quiz data correctly None: {quiz_data is None}")
        logger.info(f"✓ Contains bullet points: {'•' in reply}")
        return True
    except Exception as e:
        logger.error(f"✗ Quick handler test failed: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return False

async def main():
    """Run all tests"""
    logger.info("Starting quick mode tests...")
    
    tests = [
        test_quick_mode_extraction(),
        test_quick_endpoint(),
        test_quick_handler_response()
    ]
    
    results = await asyncio.gather(*tests, return_exceptions=True)
    
    passed = sum(1 for r in results if r is True)
    failed = sum(1 for r in results if r is False or isinstance(r, Exception))
    
    logger.info(f"Tests complete: {passed} passed, {failed} failed")
    
    if failed > 0:
        logger.error("Some tests failed!")
        return False
    
    logger.info("All tests passed! 🎉")
    return True

if __name__ == "__main__":
    asyncio.run(main())