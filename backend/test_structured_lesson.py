import asyncio
import sys
import os

# Add the current directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Test the structured lesson functionality
async def test_structured_lesson():
    try:
        import main
        print(f"Groq client available: {main._GROQ_CLIENT is not None}")
        
        # Show more details about the Groq client
        if main._GROQ_CLIENT:
            print("Groq client is initialized")
        else:
            print("Groq client is None - checking why...")
            # Check settings
            from app.settings import load_settings
            settings = load_settings()
            print(f"  Settings GROQ_API_KEY exists: {bool(settings.groq_api_key)}")
            print(f"  Settings GROQ_API_KEY length: {len(settings.groq_api_key) if settings.groq_api_key else 0}")
        
        # Test with a simple topic
        topic = "photosynthesis"
        age = 10
        
        # Import the required classes
        from main import StructuredLessonRequest
        
        # Create a request
        request = StructuredLessonRequest(topic=topic, age=age)
        print(f"Created request for topic: {topic}")
        
        # Test the _compute_structured_lesson function directly
        cache_key = f"test_{topic}_{age}"
        from main import _compute_structured_lesson
        
        print("Calling _compute_structured_lesson...")
        result, source = await _compute_structured_lesson(cache_key, topic, age)
        print(f"Result source: {source}")
        print(f"Introduction: {result.introduction}")
        print(f"Number of sections: {len(result.sections)}")
        print(f"Number of quiz questions: {len(result.quiz)}")
        
        # Check if it's a stub or LLM response
        if source == "llm":
            print("SUCCESS: Got response from LLM!")
        else:
            print("INFO: Got response from stub (this might be expected if LLM fails)")
            
        # Print section content lengths to verify quality
        for i, section in enumerate(result.sections):
            print(f"  Section {i+1} ({section.title}): {len(section.content)} characters")
            
    except Exception as e:
        print(f"Error in test: {e}")
        import traceback
        traceback.print_exc()

# Run the async test
if __name__ == "__main__":
    asyncio.run(test_structured_lesson())