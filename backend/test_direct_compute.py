import asyncio
import sys
import os

# Add the current directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

async def test_direct_compute():
    try:
        # Import the main module
        import main
        
        # Test the _compute_structured_lesson function directly
        topic = "photosynthesis"
        age = 10
        cache_key = f"test_direct_{topic}_{age}"
        
        print("Testing _compute_structured_lesson directly...")
        result, source = await main._compute_structured_lesson(cache_key, topic, age)
        
        print(f"Result source: {source}")
        print(f"Introduction: {result.introduction}")
        print(f"Number of sections: {len(result.sections)}")
        print(f"Number of quiz questions: {len(result.quiz)}")
        
        # Check section content
        for i, section in enumerate(result.sections):
            print(f"  Section {i+1} ({section.title}): {len(section.content)} characters")
            
        # Check if it's a stub or LLM response
        if source == "llm":
            print("SUCCESS: Got response from LLM!")
        else:
            print("Got stub response")
            
    except Exception as e:
        print(f"Error in direct compute test: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_direct_compute())