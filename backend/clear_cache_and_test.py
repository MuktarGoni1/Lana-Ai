import requests
import json

# First, clear the cache
print("Clearing cache...")
cache_reset_url = "http://localhost:8000/api/cache/reset"
try:
    response = requests.post(cache_reset_url)
    print(f"Cache reset response: {response.status_code}")
    if response.status_code == 200:
        print("Cache cleared successfully")
    else:
        print(f"Cache reset failed: {response.text}")
except Exception as e:
    print(f"Error clearing cache: {e}")

# Wait a moment for cache to clear
import time
time.sleep(1)

# Now test with a new topic
print("\nTesting with new topic after cache clear...")
url = "http://localhost:8000/api/structured-lesson"
headers = {
    "Content-Type": "application/json"
}

# Test with a new topic that shouldn't be cached
data = {
    "topic": "black holes",
    "age": 12
}

try:
    response = requests.post(url, headers=headers, data=json.dumps(data))
    print(f"Status Code: {response.status_code}")
    print(f"Content Source: {response.headers.get('x-content-source', 'unknown')}")
    
    if response.status_code == 200:
        lesson = response.json()
        print(f"Introduction: {lesson.get('introduction', 'N/A')[:100]}...")
        print(f"Number of sections: {len(lesson.get('sections', []))}")
        print(f"Number of quiz questions: {len(lesson.get('quiz', []))}")
        
        # Check if this looks like a real response or stub
        intro = lesson.get('introduction', '')
        sections = lesson.get('sections', [])
        
        if "Let's learn about" in intro and sections:
            section_content_lengths = [len(s.get("content", "")) for s in sections]
            has_substantial_content = any(length > 50 for length in section_content_lengths)
            if has_substantial_content:
                print("This looks like a real LLM response!")
            else:
                print("This looks like a stub response with minimal content")
        else:
            print("This looks like a real LLM response!")
            
        # Show section details
        if sections:
            print("Section content lengths:")
            for i, section in enumerate(sections):
                content_length = len(section.get("content", ""))
                print(f"  Section {i+1} ({section.get('title', 'N/A')}): {content_length} characters")
    else:
        print(f"Error: {response.text}")
        
except Exception as e:
    print(f"Error: {e}")