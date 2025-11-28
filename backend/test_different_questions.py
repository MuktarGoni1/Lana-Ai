import requests
import json

# Test the structured lesson endpoint with different topics
url = "http://localhost:8000/api/structured-lesson"
headers = {
    "Content-Type": "application/json"
}

# Test with different topics
test_topics = [
    "gravity",
    "photosynthesis", 
    "democracy",
    "machine learning"
]

for topic in test_topics:
    print(f"\n=== Testing topic: {topic} ===")
    data = {
        "topic": topic,
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
            
            # Check content quality
            sections = lesson.get('sections', [])
            if sections:
                print("Section content lengths:")
                for i, section in enumerate(sections):
                    content_length = len(section.get("content", ""))
                    print(f"  Section {i+1} ({section.get('title', 'N/A')}): {content_length} characters")
        else:
            print(f"Error: {response.text}")
            
    except Exception as e:
        print(f"Error: {e}")

print("\n=== Testing with invalid request ===")
# Test with invalid request
invalid_data = {
    "topic": "",  # Empty topic
    "age": 12
}

try:
    response = requests.post(url, headers=headers, data=json.dumps(invalid_data))
    print(f"Status Code: {response.status_code}")
    print(f"Expected error for invalid request: {response.status_code == 422}")  # 422 for validation error
except Exception as e:
    print(f"Error: {e}")