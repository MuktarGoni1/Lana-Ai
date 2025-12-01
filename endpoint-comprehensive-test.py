import requests
import json
import time
from typing import Dict, Any, Optional

def test_endpoint(url: str, method: str = "GET", data: Optional[Dict[Any, Any]] = None, 
                  headers: Optional[Dict[str, str]] = None, description: str = "") -> tuple:
    """Test an endpoint and return results"""
    print(f"\n--- {description} ---")
    print(f"Endpoint: {method} {url}")
    
    start_time = time.time()
    
    try:
        if method == "GET":
            response = requests.get(url, headers=headers, timeout=15)
        elif method == "POST":
            response = requests.post(url, json=data, headers=headers, timeout=15)
        
        elapsed_time = time.time() - start_time
        
        print(f"Status: {response.status_code}")
        print(f"Response Time: {elapsed_time:.2f}s")
        
        # Try to parse JSON response
        try:
            json_response = response.json()
            print(f"Response: {json.dumps(json_response, indent=2)[:300]}...")
        except:
            print(f"Response (non-JSON): {response.text[:300]}...")
            
        return response.status_code, response.text, elapsed_time
    except Exception as e:
        print(f"Error: {str(e)}")
        return None, str(e), time.time() - start_time

def main():
    base_url = "http://api.lanamind.com"
    
    print("COMPREHENSIVE ENDPOINT ANALYSIS")
    print("=" * 40)
    
    # Test each major endpoint category
    endpoints = [
        {
            "name": "Health Check",
            "url": f"{base_url}/health",
            "method": "GET",
            "expected_status": 200
        },
        {
            "name": "Root",
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
            "name": "Structured Lesson",
            "url": f"{base_url}/api/structured-lesson",
            "method": "POST",
            "data": {"topic": "science", "age": 12},
            "expected_status": 200
        },
        {
            "name": "TTS",
            "url": f"{base_url}/api/tts/",
            "method": "POST",
            "data": {"text": "Hello, this is a test."},
            "expected_status": 200
        },
        {
            "name": "Lessons List",
            "url": f"{base_url}/api/lessons/",
            "method": "GET",
            "expected_status": 200
        },
        {
            "name": "Math Solver",
            "url": f"{base_url}/api/math-solver/solve",
            "method": "POST",
            "data": {"problem": "2+2"},
            "expected_status": 200
        },
        {
            "name": "Chat",
            "url": f"{base_url}/api/chat/",
            "method": "POST",
            "data": {"user_id": "test-user", "message": "Hello"},
            "expected_status": 200
        }
    ]
    
    results = []
    
    for endpoint in endpoints:
        status, response, elapsed_time = test_endpoint(
            url=endpoint["url"],
            method=endpoint["method"],
            data=endpoint.get("data"),
            description=endpoint["name"]
        )
        
        results.append({
            "name": endpoint["name"],
            "url": endpoint["url"],
            "method": endpoint["method"],
            "status": status,
            "expected_status": endpoint["expected_status"],
            "response_time": elapsed_time,
            "passed": status == endpoint["expected_status"]
        })
    
    # Print summary
    print("\n" + "=" * 50)
    print("ENDPOINT TEST SUMMARY")
    print("=" * 50)
    
    passed_count = 0
    failed_count = 0
    
    for result in results:
        status_icon = "✓" if result["passed"] else "✗"
        print(f"{status_icon} {result['name']:<20} {result['status']:<5} ({result['response_time']:.2f}s)")
        if result["passed"]:
            passed_count += 1
        else:
            failed_count += 1
    
    print(f"\nTotal: {len(results)} | Passed: {passed_count} | Failed: {failed_count}")

if __name__ == "__main__":
    main()