import requests
import json

print("Testing API at http://api.lanamind.com with different topics")

# Test with a simple topic
try:
    print("\n1. Testing with 'math' topic:")
    lesson_data = {
        "topic": "math",
        "age": 10
    }
    response = requests.post(
        "http://api.lanamind.com/api/structured-lesson",
        headers={"Content-Type": "application/json"},
        data=json.dumps(lesson_data),
        timeout=15
    )
    print(f"   Status Code: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        if "introduction" in data:
            print(f"   Introduction: {data['introduction']}")
    else:
        print(f"   Error response: {response.text}")
except Exception as e:
    print(f"   Error: {e}")

# Test with another topic
try:
    print("\n2. Testing with 'science' topic:")
    lesson_data = {
        "topic": "science",
        "age": 12
    }
    response = requests.post(
        "http://api.lanamind.com/api/structured-lesson",
        headers={"Content-Type": "application/json"},
        data=json.dumps(lesson_data),
        timeout=15
    )
    print(f"   Status Code: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        if "introduction" in data:
            print(f"   Introduction: {data['introduction']}")
    else:
        print(f"   Error response: {response.text}")
except Exception as e:
    print(f"   Error: {e}")

print("\nDone.")