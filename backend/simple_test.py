import asyncio
import sys
import os

# Add the current directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

async def test():
    try:
        import main
        print(f"Groq client available: {main._GROQ_CLIENT is not None}")
        
        # Test with a simple topic
        topic = "photosynthesis"
        age = 10
        cache_key = f"test_{topic}_{age}"
        
        from main import _compute_structured_lesson
        print("Calling _compute_structured_lesson...")
        result, source = await _compute_structured_lesson(cache_key, topic, age)
        print(f"Result source: {source}")
        print(f"Introduction: {result.introduction}")
        print(f"Number of sections: {len(result.sections)}")
        print(f"Number of quiz questions: {len(result.quiz)}")
        
        if source == "llm":
            print("SUCCESS: Got response from LLM!")
        else:
            print("Still getting stub response")
            
        # Print section content lengths
        for i, section in enumerate(result.sections):
            print(f"  Section {i+1} ({section.title}): {len(section.content)} characters")
            
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test())