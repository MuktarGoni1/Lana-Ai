import requests
import json
import base64
import time

# Base URL for the deployed backend
BASE_URL = "https://lana-ai.onrender.com"

def test_endpoint(name, method, url, payload=None):
    """Test a single endpoint and return results."""
    print(f"\nTesting {name}...")
    try:
        if method == "GET":
            response = requests.get(url, timeout=30)
        elif method == "POST":
            response = requests.post(url, json=payload, timeout=30)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            try:
                data = response.json()
                print(f"Response Data: {json.dumps(data, indent=2)[:500]}...")
                print("✓ Test PASSED")
                return True
            except:
                print("Response text:", response.text[:500])
                print("✓ Test PASSED (non-JSON response)")
                return True
        else:
            print(f"Response text: {response.text}")
            print("✗ Test FAILED")
            return False
    except Exception as e:
        print(f"Exception: {e}")
        print("✗ Test FAILED")
        return False

def main():
    """Test each endpoint individually."""
    print(f"Testing backend at: {BASE_URL}")
    print("=" * 50)
    
    results = []
    
    # Test 1: Health endpoint
    results.append(test_endpoint(
        "Health Endpoint",
        "GET",
        f"{BASE_URL}/health"
    ))
    
    # Test 2: Structured Lesson
    results.append(test_endpoint(
        "Structured Lesson Endpoint",
        "POST",
        f"{BASE_URL}/api/structured-lesson",
        {
            "topic": "photosynthesis",
            "age": 12
        }
    ))
    
    # Test 3: TTS Synthesis
    results.append(test_endpoint(
        "TTS Synthesis Endpoint",
        "POST",
        f"{BASE_URL}/api/tts/synthesize",
        {
            "text": "Hello, this is a test.",
            "voice": "leda"
        }
    ))
    
    # Test 4: Math Solver
    results.append(test_endpoint(
        "Math Solver Endpoint",
        "POST",
        f"{BASE_URL}/api/math-solver/solve",
        {
            "problem": "Solve for x: 2x + 5 = 15",
            "grade_level": 7,
            "show_steps": True
        }
    ))
    
    # Test 5: Lessons List
    results.append(test_endpoint(
        "Lessons List Endpoint",
        "GET",
        f"{BASE_URL}/api/lessons?limit=3"
    ))
    
    # Summary
    print("\n" + "=" * 50)
    print("TEST SUMMARY")
    print("=" * 50)
    passed = sum(results)
    total = len(results)
    print(f"Tests passed: {passed}/{total}")
    
    if passed == total:
        print("✓ All tests passed! The backend is functioning correctly.")
    else:
        print("✗ Some tests failed. Please check the backend implementation.")

if __name__ == "__main__":
    main()