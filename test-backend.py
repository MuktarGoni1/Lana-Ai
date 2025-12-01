import requests
import json

# Test health endpoint
print("Testing health endpoint...")
try:
    health_response = requests.get("http://lana-ai.onrender.com/health")
    print(f"Health status code: {health_response.status_code}")
    print(f"Health response: {health_response.text}")
    
    # Test structured lesson endpoint
    print("\nTesting structured lesson endpoint...")
    lesson_data = {
        "topic": "Mahogany",
        "age": 10
    }
    
    lesson_response = requests.post(
        "http://lana-ai.onrender.com/api/structured-lesson",
        headers={"Content-Type": "application/json"},
        data=json.dumps(lesson_data)
    )
    
    print(f"Lesson status code: {lesson_response.status_code}")
    print(f"Lesson response: {lesson_response.text}")
    
    if lesson_response.status_code == 200:
        try:
            json_data = lesson_response.json()
            if "introduction" in json_data and "Unable to generate a detailed lesson" in json_data["introduction"]:
                print("✅ SUCCESS: Error response detected instead of hardcoded template")
            elif "introduction" in json_data and json_data["introduction"].startswith("Let's learn about"):
                print("❌ FAILURE: Still receiving hardcoded template response")
            else:
                print("✅ SUCCESS: Received dynamic content (likely from LLM)")
                print(f"Introduction preview: {json_data.get('introduction', '')[:100]}...")
        except json.JSONDecodeError:
            print("Response is not valid JSON")
    else:
        print(f"Request failed with status code {lesson_response.status_code}")
        
except requests.exceptions.RequestException as e:
    print(f"Request error: {e}")