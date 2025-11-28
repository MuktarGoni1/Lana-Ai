import requests
import json

# Test the structured lesson endpoint directly
url = "http://localhost:8000/api/structured-lesson"
headers = {
    "Content-Type": "application/json"
}

# Test with a simple topic
data = {
    "topic": "photosynthesis",
    "age": 10
}

try:
    response = requests.post(url, headers=headers, data=json.dumps(data))
    print(f"Status Code: {response.status_code}")
    print(f"Response Headers: {dict(response.headers)}")
    
    if response.status_code == 200:
        lesson = response.json()
        print("API endpoint test successful!")
        print(f"Introduction: {lesson.get('introduction', 'N/A')}")
        print(f"Number of sections: {len(lesson.get('sections', []))}")
        print(f"Number of quiz questions: {len(lesson.get('quiz', []))}")
        
        # Check content quality
        sections = lesson.get('sections', [])
        if sections:
            print("\nSection content lengths:")
            for i, section in enumerate(sections):
                content_length = len(section.get("content", ""))
                print(f"  Section {i+1} ({section.get('title', 'N/A')}): {content_length} characters")
    else:
        print(f"API endpoint test failed with status code: {response.status_code}")
        print(f"Response: {response.text}")
        
except Exception as e:
    print(f"Error: {e}")