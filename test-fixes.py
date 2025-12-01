import requests
import json

print("Testing fixes for API at http://api.lanamind.com")

# Test 1: Health endpoint
try:
    print("\n1. Testing health endpoint:")
    response = requests.get("http://api.lanamind.com/health", timeout=10)
    print(f"   Status Code: {response.status_code}")
    print(f"   Response: {response.text}")
except Exception as e:
    print(f"   Error: {e}")

# Test 2: Structured lesson endpoint with a simple topic
try:
    print("\n2. Testing structured lesson endpoint with 'math' topic:")
    lesson_data = {
        "topic": "math",
        "age": 10
    }
    response = requests.post(
        "http://api.lanamind.com/api/structured-lesson",
        headers={"Content-Type": "application/json"},
        data=json.dumps(lesson_data),
        timeout=30  # Increased timeout
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
    else:
        print(f"   Error response: {response.text}")
except Exception as e:
    print(f"   Error: {e}")

# Test 3: TTS endpoint
try:
    print("\n3. Testing TTS endpoint:")
    tts_data = {
        "text": "This is a test of the text to speech service."
    }
    response = requests.post(
        "http://api.lanamind.com/api/tts",
        headers={"Content-Type": "application/json"},
        data=json.dumps(tts_data),
        timeout=30  # Increased timeout
    )
    print(f"   Status Code: {response.status_code}")
    if response.status_code == 200:
        print(f"   Success: TTS service is working")
        print(f"   Content-Type: {response.headers.get('Content-Type', 'Unknown')}")
        print(f"   Content-Length: {len(response.content)} bytes")
    else:
        print(f"   Error response: {response.text}")
except Exception as e:
    print(f"   Error: {e}")

# Test 4: Cache reset endpoint
try:
    print("\n4. Testing cache reset endpoint:")
    response = requests.post("http://api.lanamind.com/api/cache/reset")
    print(f"   Status Code: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"   Response: {data}")
    else:
        print(f"   Error response: {response.text}")
except Exception as e:
    print(f"   Error: {e}")

print("\nDone.")