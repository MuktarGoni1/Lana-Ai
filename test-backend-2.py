import requests
import json

# Test with a different topic
print("Testing with 'Goldman apparatus' topic...")
try:
    lesson_data = {
        "topic": "Goldman apparatus",
        "age": 10
    }
    
    lesson_response = requests.post(
        "http://lana-ai.onrender.com/api/structured-lesson",
        headers={"Content-Type": "application/json"},
        data=json.dumps(lesson_data)
    )
    
    print(f"Lesson status code: {lesson_response.status_code}")
    
    if lesson_response.status_code == 200:
        json_data = lesson_response.json()
        print(f"Introduction: {json_data.get('introduction', '')}")
        
        if "introduction" in json_data and "Unable to generate a detailed lesson" in json_data["introduction"]:
            print("✅ SUCCESS: Error response detected instead of hardcoded template")
        elif "introduction" in json_data and json_data["introduction"].startswith("Let's learn about"):
            print("❌ FAILURE: Still receiving hardcoded template response")
        else:
            print("✅ SUCCESS: Received dynamic content (likely from LLM)")
    else:
        print(f"Request failed with status code {lesson_response.status_code}")
        print(f"Response: {lesson_response.text}")
        
except requests.exceptions.RequestException as e:
    print(f"Request error: {e}")