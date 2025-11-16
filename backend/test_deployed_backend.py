import requests
import json
import base64
import time

# Base URL for the deployed backend
BASE_URL = "https://lana-ai.onrender.com"

def test_health_endpoint():
    """Test the health endpoint to ensure the backend is running."""
    print("Testing health endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=30)
        if response.status_code == 200:
            print("✓ Health endpoint is working")
            print(f"  Response: {response.json()}")
            return True
        else:
            print(f"✗ Health endpoint failed with status {response.status_code}")
            return False
    except Exception as e:
        print(f"✗ Health endpoint failed with exception: {e}")
        return False

def test_structured_lesson():
    """Test the structured lesson endpoint."""
    print("\nTesting structured lesson endpoint...")
    try:
        payload = {
            "topic": "photosynthesis",
            "age": 12
        }
        response = requests.post(f"{BASE_URL}/api/structured-lesson", json=payload, timeout=30)
        if response.status_code == 200:
            data = response.json()
            print("✓ Structured lesson endpoint is working")
            print(f"  Topic: {payload['topic']}")
            print(f"  Introduction: {data.get('introduction', 'N/A')[:50]}...")
            print(f"  Number of sections: {len(data.get('sections', []))}")
            print(f"  Number of quiz items: {len(data.get('quiz', []))}")
            return True
        else:
            print(f"✗ Structured lesson endpoint failed with status {response.status_code}")
            print(f"  Response headers: {response.headers}")
            print(f"  Response text: {response.text}")
            return False
    except Exception as e:
        print(f"✗ Structured lesson endpoint failed with exception: {e}")
        return False

def test_tts_synthesis():
    """Test the TTS synthesis endpoint."""
    print("\nTesting TTS synthesis endpoint...")
    try:
        payload = {
            "text": "Hello, this is a test of the text to speech functionality.",
            "voice": "leda"
        }
        response = requests.post(f"{BASE_URL}/api/tts/synthesize", json=payload, timeout=30)
        if response.status_code == 200:
            data = response.json()
            print("✓ TTS synthesis endpoint is working")
            print(f"  Audio data length: {len(data.get('audio_base64', ''))} characters")
            print(f"  Duration: {data.get('duration_seconds', 0)} seconds")
            # Try to decode base64 to verify it's valid
            try:
                audio_data = base64.b64decode(data.get('audio_base64', ''))
                print(f"  Audio data decoded successfully: {len(audio_data)} bytes")
            except Exception as decode_error:
                print(f"  Warning: Could not decode audio data: {decode_error}")
            return True
        else:
            print(f"✗ TTS synthesis endpoint failed with status {response.status_code}")
            print(f"  Response headers: {response.headers}")
            print(f"  Response text: {response.text}")
            return False
    except Exception as e:
        print(f"✗ TTS synthesis endpoint failed with exception: {e}")
        return False

def test_math_solver():
    """Test the math solver endpoint."""
    print("\nTesting math solver endpoint...")
    try:
        payload = {
            "problem": "Solve for x: 2x + 5 = 15",
            "grade_level": 7,
            "show_steps": True
        }
        response = requests.post(f"{BASE_URL}/api/math-solver/solve", json=payload, timeout=30)
        if response.status_code == 200:
            data = response.json()
            print("✓ Math solver endpoint is working")
            print(f"  Problem: {data.get('problem', 'N/A')}")
            print(f"  Solution: {data.get('solution', 'N/A')[:50]}...")
            if data.get('steps'):
                print(f"  Number of steps: {len(data.get('steps', []))}")
            return True
        else:
            print(f"✗ Math solver endpoint failed with status {response.status_code}")
            print(f"  Response headers: {response.headers}")
            print(f"  Response text: {response.text}")
            return False
    except Exception as e:
        print(f"✗ Math solver endpoint failed with exception: {e}")
        return False

def test_lessons_list():
    """Test the lessons list endpoint."""
    print("\nTesting lessons list endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/api/lessons", params={"limit": 5}, timeout=30)
        if response.status_code == 200:
            data = response.json()
            print("✓ Lessons list endpoint is working")
            print(f"  Number of topics returned: {len(data)}")
            if data:
                print(f"  Sample topics: {data[:3]}")
            return True
        else:
            print(f"✗ Lessons list endpoint failed with status {response.status_code}")
            print(f"  Response headers: {response.headers}")
            print(f"  Response text: {response.text}")
            return False
    except Exception as e:
        print(f"✗ Lessons list endpoint failed with exception: {e}")
        return False

def main():
    """Run all tests and provide feedback."""
    print(f"Testing backend at: {BASE_URL}")
    print("=" * 50)
    
    # Test health endpoint first
    health_ok = test_health_endpoint()
    
    # Run all other tests regardless of health check result
    results = []
    results.append(test_structured_lesson())
    results.append(test_tts_synthesis())
    results.append(test_math_solver())
    results.append(test_lessons_list())
    
    # Summary
    print("\n" + "=" * 50)
    print("TEST SUMMARY")
    print("=" * 50)
    passed = sum(results)
    total = len(results)
    print(f"Tests passed: {passed}/{total}")
    
    if passed == total and health_ok:
        print("✓ All tests passed! The backend is functioning correctly.")
    else:
        print("✗ Some tests failed. Please check the backend implementation.")
    
    # Additional notes
    print("\nAdditional Notes:")
    print("- Supabase history functionality requires authentication and cannot be tested without valid credentials")
    print("- For a complete test of history functionality, you would need to:")
    print("  1. Register a user account")
    print("  2. Obtain a valid authentication token")
    print("  3. Create a session ID")
    print("  4. Use these credentials to access the history endpoints")

if __name__ == "__main__":
    main()