#!/usr/bin/env python3
"""
Test script to verify frontend integration with backend for quick mode
"""

import asyncio
import logging
import json
from unittest.mock import Mock

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_frontend_api_route():
    """Test the frontend API route that proxies to the backend"""
    try:
        # Simulate the frontend API route behavior
        from app.api.routes.chat import extract_mode, MODE_MAP
        
        # Test quick mode message as it would come from frontend
        message = "/quick What is artificial intelligence?"
        user_id = "test_user_frontend_123"
        age = 10
        
        # Extract mode (this is what the frontend API route does)
        mode, clean_text = extract_mode(message)
        logger.info(f"Frontend would extract - Mode: {mode}, Clean text: {clean_text}")
        
        # Verify the mode is correctly identified
        assert mode == "quick", f"Expected mode 'quick', got '{mode}'"
        
        # Get the appropriate handler
        handler = MODE_MAP.get(mode)
        from app.api.routes.chat import quick_answer_handler
        assert handler == quick_answer_handler, f"Handler mismatch for mode '{mode}'"
        
        logger.info("✓ Frontend mode extraction working correctly")
        return True
    except Exception as e:
        logger.error(f"✗ Frontend API route test failed: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return False

async def test_age_based_personalization():
    """Test that age-based personalization works in quick mode"""
    from app.api.routes.chat import quick_answer_handler
    
    try:
        # Test with different ages to verify age-based responses
        test_cases = [
            (3, "Young child - very simple explanation"),
            (8, "Child - clear simple explanations"),
            (15, "Teenager - more complex language"),
            (25, "Adult - standard vocabulary")
        ]
        
        for age, description in test_cases:
            reply, quiz_data = await quick_answer_handler(
                "What is photosynthesis?", 
                age=age
            )
            
            # Verify it's a response
            assert reply is not None, f"Reply should not be None for {description}"
            assert quiz_data is None, f"Quick mode should not generate quiz data for {description}"
            
            # Check that it contains bullet points
            assert "•" in reply, f"Quick mode response should contain bullet points for {description}"
            
            logger.info(f"✓ Age {age} ({description}): Response generated with bullet points")
        
        return True
    except Exception as e:
        logger.error(f"✗ Age-based personalization test failed: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return False

async def main():
    """Run all tests"""
    logger.info("Starting frontend integration tests for quick mode...")
    
    tests = [
        test_frontend_api_route(),
        test_age_based_personalization()
    ]
    
    results = await asyncio.gather(*tests, return_exceptions=True)
    
    passed = sum(1 for r in results if r is True)
    failed = sum(1 for r in results if r is False or isinstance(r, Exception))
    
    logger.info(f"Integration tests complete: {passed} passed, {failed} failed")
    
    if failed > 0:
        logger.error("Some integration tests failed!")
        return False
    
    logger.info("All integration tests passed! 🎉")
    return True

if __name__ == "__main__":
    asyncio.run(main())