import requests
import json

print("Checking service status...")

# Test 1: Health endpoint
try:
    print("\n1. Testing health endpoint:")
    response = requests.get("https://lanamind.com/health", timeout=10)
    print(f"   Status Code: {response.status_code}")
    print(f"   Response: {response.text}")
except Exception as e:
    print(f"   Error: {e}")

# Test 2: Structured lesson endpoint
try:
    print("\n2. Testing structured lesson endpoint:")
    lesson_data = {
        "topic": "photosynthesis",
        "age": 15
    }
    response = requests.post(
        "https://lanamind.com/api/structured-lesson",
        headers={"Content-Type": "application/json"},
        data=json.dumps(lesson_data),
        timeout=15
    )
    print(f"   Status Code: {response.status_code}")
    if response.status_code == 200:
        print(f"   Success: Received lesson data")
        data = response.json()
        if "introduction" in data:
            print(f"   Introduction preview: {data['introduction'][:100]}...")
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
        "https://lanamind.com/api/tts",
        headers={"Content-Type": "application/json"},
        data=json.dumps(tts_data),
        timeout=15
    )
    print(f"   Status Code: {response.status_code}")
    if response.status_code == 200:
        print(f"   Success: TTS service is working")
        print(f"   Content-Type: {response.headers.get('Content-Type', 'Unknown')}")
    else:
        print(f"   Error response: {response.text}")
except Exception as e:
    print(f"   Error: {e}")

print("\nDone.")