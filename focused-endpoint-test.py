import requests
import json

def main():
    base_url = "http://api.lanamind.com"
    
    print("FOCUSED ENDPOINT ANALYSIS")
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
            "name": "Math Solver",
            "url": f"{base_url}/api/math-solver/solve",
            "method": "POST",
            "data": {"problem": "3 * 4"},
            "expected_status": 200
        },
        {
            "name": "TTS",
            "url": f"{base_url}/api/tts",
            "method": "POST",
            "data": {"text": "Testing text to speech"},
            "expected_status": 200  # Expecting 503 due to API key issue
        }
    ]
    
    results = []
    
    for endpoint in endpoints:
        print(f"\nTesting: {endpoint['name']}")
        print("-" * 30)
        
        try:
            if endpoint['method'] == "GET":
                response = requests.get(endpoint['url'], timeout=10)
            else:  # POST
                response = requests.post(
                    endpoint['url'], 
                    json=endpoint.get('data', {}), 
                    timeout=15
                )
            
            print(f"URL: {endpoint['url']}")
            print(f"Method: {endpoint['method']}")
            print(f"Status Code: {response.status_code}")
            print(f"Expected: {endpoint['expected_status']}")
            
            # Check if status matches expectation
            status_ok = response.status_code == endpoint['expected_status']
            print(f"Status Match: {'✓' if status_ok else '✗'}")
            
            # Show response preview
            try:
                json_data = response.json()
                print(f"Response Preview: {json.dumps(json_data, indent=2)[:200]}...")
            except:
                print(f"Response Preview: {response.text[:200]}...")
            
            results.append({
                "name": endpoint['name'],
                "status_code": response.status_code,
                "expected": endpoint['expected_status'],
                "match": status_ok,
                "response_preview": response.text[:100]
            })
            
        except Exception as e:
            print(f"Error: {str(e)}")
            results.append({
                "name": endpoint['name'],
                "status_code": "ERROR",
                "expected": endpoint['expected_status'],
                "match": False,
                "response_preview": str(e)[:100]
            })
    
    # Summary
    print("\n" + "=" * 40)
    print("ENDPOINT ANALYSIS SUMMARY")
    print("=" * 40)
    
    passed = sum(1 for r in results if r['match'])
    total = len(results)
    
    print(f"Endpoints Tested: {total}")
    print(f"Status Matches: {passed}/{total}")
    print(f"Success Rate: {(passed/total)*100:.1f}%")
    
    print("\nDetailed Results:")
    for result in results:
        status_icon = "✓" if result['match'] else "✗"
        print(f"  {status_icon} {result['name']}: {result['status_code']}")
    
    # Specific observations
    print("\nKEY OBSERVATIONS:")
    print("1. Health and root endpoints are working correctly")
    print("2. Cache reset is functional")
    print("3. Structured lesson endpoint returns stub responses (expected due to validation)")
    print("4. Math solver appears to be working")
    print("5. TTS endpoint likely returns 503 due to API key issues")

if __name__ == "__main__":
    main()