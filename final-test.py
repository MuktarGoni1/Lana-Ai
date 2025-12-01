import requests
import json

print("Final test of backend services...")

# Test 1: Health endpoint
try:
    print("\n1. Testing health endpoint:")
    response = requests.get("http://api.lanamind.com/health", timeout=10)
    print(f"   Status Code: {response.status_code}")
    print(f"   Response: {response.text}")
except Exception as e:
    print(f"   Error: {e}")

# Test 2: Cache reset endpoint
try:
    print("\n2. Testing cache reset endpoint:")
    response = requests.post("http://api.lanamind.com/api/cache/reset")
    print(f"   Status Code: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"   Response: {data}")
    else:
        print(f"   Error response: {response.text}")
except Exception as e:
    print(f"   Error: {e}")

# Test 3: Structured lesson endpoint (this should work now)
try:
    print("\n3. Testing structured lesson endpoint:")
    lesson_data = {
        "topic": "basic arithmetic",
        "age": 10
    }
    response = requests.post(
        "http://api.lanamind.com/api/structured-lesson",
        headers={"Content-Type": "application/json"},
        data=json.dumps(lesson_data),
        timeout=30
    )
    print(f"   Status Code: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        if "introduction" in data:
            intro = data['introduction']
            if "Unable to generate a detailed lesson" in intro:
                print(f"   Response: Still getting stub response - {intro[:50]}...")
            else:
                print(f"   Response: Got dynamic content - {intro[:100]}...")
                print(f"   Sections: {len(data.get('sections', []))}")
                print(f"   Quiz questions: {len(data.get('quiz', []))}")
    else:
        print(f"   Error response: {response.text}")
except Exception as e:
    print(f"   Error: {e}")

print("\nDone.")