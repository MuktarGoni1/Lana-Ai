import requests
import json

# Test the structured lesson endpoint directly
url = "https://lana-ai.onrender.com/api/structured-lesson"
headers = {
    "Content-Type": "application/json"
}

# Test with different topics
topics = ["Graham", "plot"]

for topic in topics:
    print(f"\n=== Testing topic: {topic} ===")
    data = {
        "topic": topic,
        "age": 10
    }

    try:
        response = requests.post(url, headers=headers, data=json.dumps(data))
        print(f"Status Code: {response.status_code}")
        #print(f"Response: {response.json()}")
        
        # Check if it's a stub response by looking at the content
        lesson = response.json()
        if "introduction" in lesson:
            intro = lesson["introduction"]
            sections = lesson.get("sections", [])
            quiz = lesson.get("quiz", [])
            
            print(f"\nIntroduction: {intro}")
            print(f"Number of sections: {len(sections)}")
            print(f"Number of quiz questions: {len(quiz)}")
            
            if sections:
                print("\nSection content lengths:")
                for i, section in enumerate(sections):
                    content_length = len(section.get("content", ""))
                    print(f"  Section {i+1} ({section.get('title', 'N/A')}): {content_length} characters")
                    
    except Exception as e:
        print(f"Error: {e}")