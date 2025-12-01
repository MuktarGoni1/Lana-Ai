import requests
import json
import time

def test_endpoint(url, method="GET", data=None, headers=None, description=""):
    """Test an endpoint and return results"""
    print(f"\n{description}")
    print(f"URL: {url}")
    print(f"Method: {method}")
    
    start_time = time.time()
    
    try:
        if method == "GET":
            response = requests.get(url, headers=headers, timeout=30)
        elif method == "POST":
            response = requests.post(url, json=data, headers=headers, timeout=30)
        
        elapsed_time = time.time() - start_time
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Time: {elapsed_time:.2f}s")
        
        # Try to parse JSON response
        try:
            json_response = response.json()
            print(f"Response: {json.dumps(json_response, indent=2)[:200]}...")
        except:
            print(f"Response (non-JSON): {response.text[:200]}...")
            
        return {
            "url": url,
            "method": method,
            "status_code": response.status_code,
            "response_time": elapsed_time,
            "success": 200 <= response.status_code < 300,
            "error": None
        }
    except Exception as e:
        elapsed_time = time.time() - start_time
        print(f"Error: {str(e)}")
        print(f"Response Time: {elapsed_time:.2f}s")
        return {
            "url": url,
            "method": method,
            "status_code": None,
            "response_time": elapsed_time,
            "success": False,
            "error": str(e)
        }

def main():
    base_url = "http://api.lanamind.com"
    
    print("=" * 60)
    print("COMPREHENSIVE BACKEND ENDPOINT TEST")
    print("=" * 60)
    
    results = []
    
    # 1. Health endpoints
    results.append(test_endpoint(
        f"{base_url}/health",
        "GET",
        description="1. Health Check Endpoint"
    ))
    
    # 2. Root endpoint
    results.append(test_endpoint(
        f"{base_url}/",
        "GET",
        description="2. Root Endpoint"
    ))
    
    # 3. Cache reset endpoint
    results.append(test_endpoint(
        f"{base_url}/api/cache/reset",
        "POST",
        description="3. Cache Reset Endpoint"
    ))
    
    # 4. Metrics endpoint
    results.append(test_endpoint(
        f"{base_url}/api/metrics",
        "GET",
        description="4. Metrics Endpoint"
    ))
    
    # 5. Lessons endpoints
    results.append(test_endpoint(
        f"{base_url}/api/lessons",
        "GET",
        description="5. Get Popular Lessons Endpoint"
    ))
    
    # 6. Structured lesson endpoint
    results.append(test_endpoint(
        f"{base_url}/api/structured-lesson",
        "POST",
        data={"topic": "mathematics", "age": 10},
        description="6. Create Structured Lesson Endpoint"
    ))
    
    # 7. Structured lesson stream endpoint
    results.append(test_endpoint(
        f"{base_url}/api/structured-lesson/stream",
        "POST",
        data={"topic": "science", "age": 12},
        description="7. Stream Structured Lesson Endpoint"
    ))
    
    # 8. Math solver endpoint
    results.append(test_endpoint(
        f"{base_url}/api/math-solver/solve",
        "POST",
        data={"problem": "2 + 2"},
        description="8. Math Solver Endpoint"
    ))
    
    # 9. TTS endpoint
    results.append(test_endpoint(
        f"{base_url}/api/tts",
        "POST",
        data={"text": "Hello, this is a test."},
        description="9. Text-to-Speech Endpoint"
    ))
    
    # 10. TTS lesson endpoint
    results.append(test_endpoint(
        f"{base_url}/api/tts/lesson",
        "POST",
        data={
            "lesson": {
                "introduction": "This is a test lesson.",
                "sections": [{"title": "Section 1", "content": "Content here."}],
                "quiz": []
            }
        },
        description="10. TTS Lesson Endpoint"
    ))
    
    # 11. Chat endpoint
    results.append(test_endpoint(
        f"{base_url}/api/chat",
        "POST",
        data={"user_id": "test_user", "message": "Hello", "age": 10},
        description="11. Chat Endpoint"
    ))
    
    # Summary
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    
    successful = sum(1 for r in results if r["success"])
    failed = len(results) - successful
    
    print(f"Total Endpoints Tested: {len(results)}")
    print(f"Successful: {successful}")
    print(f"Failed: {failed}")
    
    print("\nDetailed Results:")
    for result in results:
        status = "✓ PASS" if result["success"] else "✗ FAIL"
        time_str = f"{result['response_time']:.2f}s" if result['response_time'] else "N/A"
        print(f"  {status} {result['method']} {result['url']} ({time_str})")
        if not result["success"]:
            if result["status_code"]:
                print(f"    Status: {result['status_code']}")
            if result["error"]:
                print(f"    Error: {result['error']}")
    
    # Performance analysis
    print("\nPerformance Analysis:")
    response_times = [r["response_time"] for r in results if r["response_time"] is not None]
    if response_times:
        avg_time = sum(response_times) / len(response_times)
        max_time = max(response_times)
        min_time = min(response_times)
        print(f"  Average Response Time: {avg_time:.2f}s")
        print(f"  Fastest Response: {min_time:.2f}s")
        print(f"  Slowest Response: {max_time:.2f}s")
    
    print("\nTest completed.")

if __name__ == "__main__":
    main()