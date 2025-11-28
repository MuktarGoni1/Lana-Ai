import requests
import json

# Test the structured lesson endpoint directly
url = "https://lana-ai.onrender.com/api/structured-lesson"
headers = {
    "Content-Type": "application/json"
}

# Test with a more specific topic that should generate substantial content
topics = ["photosynthesis", "water cycle", "solar system"]

for topic in topics:
    print(f"\n=== Testing topic: {topic} ===")
    data = {
        "topic": topic,
        "age": 10
    }
    
    try:
        response = requests.post(url, headers=headers, data=json.dumps(data))
        print(f"Status Code: {response.status_code}")
        lesson = response.json()
        
        if "introduction" in lesson:
            intro = lesson["introduction"]
            sections = lesson.get("sections", [])
            quiz = lesson.get("quiz", [])
            
            print(f"Introduction: {intro}")
            print(f"Number of sections: {len(sections)}")
            print(f"Number of quiz questions: {len(quiz)}")
            
            # Check content quality
            if sections:
                print("\nSections:")
                for i, section in enumerate(sections):
                    title = section.get("title", "N/A")
                    content = section.get("content", "")
                    content_length = len(content)
                    print(f"  {i+1}. {title} ({content_length} chars): {content[:100]}{'...' if len(content) > 100 else ''}")
                    
                # Check if this looks like a real response or stub
                if "Let's learn about" in intro:
                    print("  ⚠️  This appears to be a stub response")
                else:
                    print("  ✅ This appears to be an LLM-generated response")
                    
                # Quality check
                avg_content_length = sum(len(s.get("content", "")) for s in sections) / len(sections)
                print(f"  Average section length: {avg_content_length:.1f} characters")
                    
        else:
            print("No introduction found in response")
            
    except Exception as e:
        print(f"Error: {e}")

print("\n=== Testing cache reset ===")
# Try to reset cache to force fresh responses
try:
    reset_url = "https://lana-ai.onrender.com/api/cache/reset"
    reset_response = requests.post(reset_url)
    print(f"Cache reset status: {reset_response.status_code}")
except Exception as e:
    print(f"Cache reset error: {e}")