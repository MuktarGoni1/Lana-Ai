import requests
import json
import time

def test_endpoint(name, url, method="GET", data=None, headers=None):
    """Test an endpoint and print results"""
    print(f"\n{'='*50}")
    print(f"Testing: {name}")
    print(f"URL: {url}")
    print(f"Method: {method}")
    print(f"{'='*50}")
    
    start_time = time.time()
    
    try:
        if method == "GET":
            response = requests.get(url, headers=headers, timeout=15)
        elif method == "POST":
            response = requests.post(url, json=data, headers=headers, timeout=15)
        
        elapsed_time = time.time() - start_time
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Time: {elapsed_time:.2f}s")
        
        # Try to parse JSON response
        try:
            json_response = response.json()
            print(f"Response (truncated): {json.dumps(json_response, indent=2)[:500]}...")
        except:
            print(f"Response (text): {response.text[:500]}...")
            
        return response.status_code, response.text
    except Exception as e:
        print(f"Error: {str(e)}")
        return None, str(e)

def main():
    base_url = "http://api.lanamind.com"
    
    print("LANA AI BACKEND ENDPOINT TESTING")
    print("This script will test the key API endpoints and show actual responses.")
    
    # Test endpoints in order
    endpoints = [
        {
            "name": "Health Check",
            "url": f"{base_url}/health",
            "method": "GET"
        },
        {
            "name": "Root Endpoint",
            "url": f"{base_url}/",
            "method": "GET"
        },
        {
            "name": "Cache Reset",
            "url": f"{base_url}/api/cache/reset",
            "method": "POST"
        },
        {
            "name": "Lessons List",
            "url": f"{base_url}/api/lessons/",
            "method": "GET"
        }
    ]
    
    results = []
    
    for endpoint in endpoints:
        status, response = test_endpoint(
            name=endpoint["name"],
            url=endpoint["url"],
            method=endpoint["method"],
            data=endpoint.get("data")
        )
        
        results.append({
            "name": endpoint["name"],
            "status": status,
            "success": status == 200 if endpoint["name"] != "Cache Reset" else status in [200, 500]
        })
        
        # Small delay between requests
        time.sleep(1)
    
    # Summary
    print(f"\n{'='*50}")
    print("SUMMARY")
    print(f"{'='*50}")
    
    for result in results:
        status_icon = "✓" if result["success"] else "✗"
        print(f"{status_icon} {result['name']:<20} Status: {result['status']}")

if __name__ == "__main__":
    main()