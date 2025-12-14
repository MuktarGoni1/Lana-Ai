import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

# Test if we can import and use the chat handler
try:
    from app.api.routes.chat import chat_handler
    import asyncio
    
    # Test the chat handler with a mock Groq client
    async def test_chat_handler():
        # Test with None client (should return error message)
        result, _ = await chat_handler("Hello", groq_client=None)
        print("Result with None client:", result)
        
        # Check if we get the expected error message
        if "Chat mode requires the AI service to be configured" in result:
            print("✓ Chat handler correctly identifies missing AI service")
        else:
            print("✗ Chat handler did not return expected error message")
    
    asyncio.run(test_chat_handler())
    
except Exception as e:
    print(f"Error importing or testing chat handler: {e}")
    import traceback
    traceback.print_exc()