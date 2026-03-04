#!/usr/bin/env python3
"""
Test script to verify mode switching fix works correctly
"""

import asyncio
import json
import logging
from typing import Dict, Any, Optional

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_chat_handler():
    """Test chat handler returns string response"""
    logger.info("Testing chat handler...")
    
    try:
        from app.api.routes.chat import chat_handler
        
        # Test chat handler
        reply, quiz_data = await chat_handler(
            "Hello, how are you?", 
            user_id="test_user", 
            age=12
        )
        
        # Verify response structure
        if not isinstance(reply, str) or len(reply) == 0:
            logger.error(f"Chat handler failed: Invalid reply format")
            return False
            
        # Chat mode should not generate quiz data
        if quiz_data is not None:
            logger.error(f"Chat handler failed: Should not generate quiz data")
            return False
            
        logger.info(f"Chat handler test passed - Reply length: {len(reply)}")
        return True
        
    except Exception as e:
        logger.error(f"Error testing chat handler: {e}")
        return False

async def test_quick_handler():
    """Test quick answer handler returns string response"""
    logger.info("Testing quick answer handler...")
    
    try:
        from app.api.routes.chat import quick_answer_handler
        
        # Test quick answer handler
        reply, quiz_data = await quick_answer_handler(
            "What is the capital of France?", 
            age=12,
            user_id="test_user"
        )
        
        # Verify response structure
        if not isinstance(reply, str) or len(reply) == 0:
            logger.error(f"Quick answer handler failed: Invalid reply format")
            return False
            
        logger.info(f"Quick answer handler test passed - Reply length: {len(reply)}")
        return True
        
    except Exception as e:
        logger.error(f"Error testing quick answer handler: {e}")
        return False

async def test_lesson_handler():
    """Test structured lesson handler returns dict response"""
    logger.info("Testing structured lesson handler...")
    
    try:
        from app.api.routes.chat import structured_lesson_handler
        
        # Test structured lesson handler
        reply, quiz_data = await structured_lesson_handler(
            "photosynthesis", 
            age=12
        )
        
        # Verify response structure
        if not isinstance(reply, dict):
            logger.error(f"Lesson handler failed: Expected dict response, got {type(reply)}")
            return False
            
        # Check that reply has required fields
        required_fields = ["introduction", "sections"]
        for field in required_fields:
            if field not in reply:
                logger.error(f"Lesson handler failed: Missing required field '{field}'")
                return False
                
        logger.info(f"Lesson handler test passed - Reply keys: {list(reply.keys())}")
        return True
        
    except Exception as e:
        logger.error(f"Error testing lesson handler: {e}")
        return False

async def test_maths_handler():
    """Test maths tutor handler returns dict response"""
    logger.info("Testing maths tutor handler...")
    
    try:
        from app.api.routes.chat import maths_tutor_handler
        
        # Test maths tutor handler
        reply, quiz_data = await maths_tutor_handler(
            "2+2", 
            age=12
        )
        
        # Verify response structure
        if not isinstance(reply, dict):
            logger.error(f"Maths handler failed: Expected dict response, got {type(reply)}")
            return False
            
        # Check that reply has required fields
        required_fields = ["problem", "solution"]
        for field in required_fields:
            if field not in reply:
                logger.error(f"Maths handler failed: Missing required field '{field}'")
                return False
                
        logger.info(f"Maths handler test passed - Reply keys: {list(reply.keys())}")
        return True
        
    except Exception as e:
        logger.error(f"Error testing maths handler: {e}")
        return False

async def test_mode_routing():
    """Test that the chat endpoint correctly routes to different handlers"""
    logger.info("Testing mode routing...")
    
    try:
        from app.api.routes.chat import chat_endpoint
        from app.api.routes.chat import ChatRequest
        
        # Test chat mode
        chat_request = ChatRequest(
            user_id="test_user",
            message="/Chat Hello, how are you?",
            age=12
        )
        
        response = await chat_endpoint(chat_request)
        
        if response.mode != "chat":
            logger.error(f"Mode routing failed: Expected 'chat', got '{response.mode}'")
            return False
            
        if not isinstance(response.reply, str):
            logger.error(f"Mode routing failed: Chat mode should return string reply")
            return False
            
        logger.info(f"Chat mode routing test passed - Mode: {response.mode}")
        
        # Test lesson mode
        lesson_request = ChatRequest(
            user_id="test_user",
            message="/lesson photosynthesis",
            age=12
        )
        
        response = await chat_endpoint(lesson_request)
        
        if response.mode != "lesson":
            logger.error(f"Mode routing failed: Expected 'lesson', got '{response.mode}'")
            return False
            
        # Lesson mode should return dict as JSON string
        if not isinstance(response.reply, str):
            logger.error(f"Mode routing failed: Lesson mode should return string reply")
            return False
            
        # Try to parse as JSON
        try:
            lesson_data = json.loads(response.reply)
            if not isinstance(lesson_data, dict):
                logger.error(f"Mode routing failed: Lesson reply should be JSON dict")
                return False
        except json.JSONDecodeError:
            logger.error(f"Mode routing failed: Lesson reply should be valid JSON")
            return False
            
        logger.info(f"Lesson mode routing test passed - Mode: {response.mode}")
        return True
        
    except Exception as e:
        logger.error(f"Error testing mode routing: {e}")
        return False

async def main():
    """Run all tests"""
    logger.info("Running mode switching fix tests...")
    
    tests = [
        test_chat_handler,
        test_quick_handler,
        test_lesson_handler,
        test_maths_handler,
        test_mode_routing
    ]
    
    results = []
    for test in tests:
        try:
            result = await test()
            results.append(result)
            logger.info(f"Test {test.__name__}: {'PASSED' if result else 'FAILED'}")
        except Exception as e:
            logger.error(f"Test {test.__name__} failed with exception: {e}")
            results.append(False)
    
    all_passed = all(results)
    logger.info(f"All tests {'PASSED' if all_passed else 'FAILED'}")
    
    if all_passed:
        logger.info("✅ Mode switching fix is working correctly!")
    else:
        logger.error("❌ Some tests failed. Please check the implementation.")
    
    return all_passed

if __name__ == "__main__":
    asyncio.run(main())