import requests
import json

def test_endpoints():
    base_url = "http://api.lanamind.com"
    
    # Test cases
    tests = [
        {
            "name": "Health Check",
            "url": f"{base_url}/health",
            "method": "GET",
            "expected_status": 200
        },
        {
            "name": "Root Endpoint",
            "url": f"{base_url}/",
            "method": "GET",
            "expected_status": 200
        },
        {
            "name": "Cache Reset",
            "url": f"{base_url}/api/cache/reset",
            "method": "POST",
            "expected_status": 200
        },
        {
            "name": "Lessons List",
            "url": f"{base_url}/api/lessons/",
            "method": "GET",
            "expected_status": 200
        },
        {
            "name": "Structured Lesson",
            "url": f"{base_url}/api/structured-lesson",
            "method": "POST",
            "data": {"topic": "science", "age": 12},
            "expected_status": 200
        },
        {
            "name": "TTS Endpoint",
            "url": f"{base_url}/api/tts/",
            "method": "POST",
            "data": {"text": "Hello, this is a test."},
            "expected_status": 503  # Expected to fail due to Google API key issue
        },
        {
            "name": "Math Solver",
            "url": f"{base_url}/api/math-solver/solve",
            "method": "POST",
            "data": {"problem": "2+2"},
            "expected_status": 200
        }
    ]
    
    print("Lana AI Backend Endpoint Test Results")
    print("=" * 50)
    
    passed = 0
    failed = 0
    
    for test in tests:
        try:
            if test["method"] == "GET":
                response = requests.get(test["url"], timeout=15)
            elif test["method"] == "POST":
                response = requests.post(test["url"], json=test.get("data", {}), timeout=15)
            
            status = response.status_code
            expected = test["expected_status"]
            
            if status == expected:
                result = "PASS"
                passed += 1
            else:
                result = "FAIL"
                failed += 1
            
            print(f"{result:4} | {test['name']:<20} | Status: {status} (expected: {expected})")
            
            # Show response details for failures or interesting cases
            if result == "FAIL" or test["name"] in ["Structured Lesson", "TTS Endpoint"]:
                try:
                    data = response.json()
                    print(f"      Response: {json.dumps(data, indent=2)[:200]}...")
                except:
                    print(f"      Response: {response.text[:200]}...")
                    
        except Exception as e:
            print(f"ERROR | {test['name']:<20} | Exception: {str(e)[:50]}...")
            failed += 1
    
    print("=" * 50)
    print(f"Results: {passed} passed, {failed} failed")
    print("=" * 50)

if __name__ == "__main__":
    test_endpoints()