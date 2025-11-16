import requests
import json
import time

# Test the health endpoint
def test_health_endpoint():
    try:
        response = requests.get('http://localhost:8000/health', timeout=5)
        print(f"Health endpoint status: {response.status_code}")
        print(f"Health endpoint response: {response.json()}")
        return response.status_code == 200
    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to backend server. Make sure it's running on port 8000.")
        return False
    except Exception as e:
        print(f"Error testing health endpoint: {e}")
        return False

# Test the root endpoint
def test_root_endpoint():
    try:
        response = requests.get('http://localhost:8000/', timeout=5)
        print(f"Root endpoint status: {response.status_code}")
        print(f"Root endpoint response: {response.json()}")
        return response.status_code == 200
    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to backend server. Make sure it's running on port 8000.")
        return False
    except Exception as e:
        print(f"Error testing root endpoint: {e}")
        return False

# Test the structured lesson endpoint
def test_structured_lesson_endpoint():
    try:
        payload = {
            "topic": "photosynthesis",
            "age": 12
        }
        response = requests.post('http://localhost:8000/api/structured-lesson', json=payload, timeout=10)
        print(f"Structured lesson endpoint status: {response.status_code}")
        if response.status_code == 200:
            print(f"Structured lesson endpoint response: {response.json()}")
        else:
            print(f"Structured lesson endpoint error: {response.text}")
        return response.status_code == 200
    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to backend server. Make sure it's running on port 8000.")
        return False
    except Exception as e:
        print(f"Error testing structured lesson endpoint: {e}")
        return False

if __name__ == "__main__":
    print("Testing backend API endpoints...")
    print("=" * 50)
    
    # Test health endpoint
    print("Testing /health endpoint:")
    health_ok = test_health_endpoint()
    print()
    
    # Test root endpoint
    print("Testing / endpoint:")
    root_ok = test_root_endpoint()
    print()
    
    # Test structured lesson endpoint
    print("Testing /api/structured-lesson endpoint:")
    lesson_ok = test_structured_lesson_endpoint()
    print()
    
    print("=" * 50)
    print("Test Summary:")
    print(f"Health endpoint: {'PASS' if health_ok else 'FAIL'}")
    print(f"Root endpoint: {'PASS' if root_ok else 'FAIL'}")
    print(f"Structured lesson endpoint: {'PASS' if lesson_ok else 'FAIL'}")
    
    if health_ok and root_ok and lesson_ok:
        print("All tests passed!")
    else:
        print("Some tests failed!")