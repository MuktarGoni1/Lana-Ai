import asyncio
import sys
import os

# Add the current directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

async def test_lesson_generation():
    try:
        import main
        
        print("Testing lesson generation with 'gravity' topic...")
        topic = "gravity"
        age = 12
        cache_key = f"test_debug_{topic}_{age}"
        
        # Clear any existing cache for this key
        try:
            await main._STRUCTURED_LESSON_CACHE.delete(cache_key, namespace="lessons")
        except:
            pass
        
        print("Calling _compute_structured_lesson...")
        result, source = await main._compute_structured_lesson(cache_key, topic, age)
        
        print(f"Result source: {source}")
        print(f"Introduction: {result.introduction}")
        print(f"Number of sections: {len(result.sections)}")
        print(f"Number of quiz questions: {len(result.quiz)}")
        
        # Check section content
        for i, section in enumerate(result.sections):
            print(f"  Section {i+1} ({section.title}): {len(section.content)} characters")
            print(f"    Content preview: {section.content[:100]}...")
            
        # Check quiz questions
        for i, quiz_item in enumerate(result.quiz):
            print(f"  Quiz {i+1}: {quiz_item.q}")
            print(f"    Options: {quiz_item.options}")
            print(f"    Answer: {quiz_item.answer}")
            
        # Check if it's a stub or LLM response
        if source == "llm":
            print("SUCCESS: Got response from LLM!")
        else:
            print("Got stub response")
            
        # Let's also check what's in the cache
        try:
            cached = await main._STRUCTURED_LESSON_CACHE.get(cache_key, namespace="lessons")
            if cached:
                print(f"Cached result exists: {cached is not None}")
            else:
                print("No cached result")
        except Exception as e:
            print(f"Cache check error: {e}")
            
    except Exception as e:
        print(f"Error in lesson generation test: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_lesson_generation())