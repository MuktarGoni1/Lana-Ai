import requests
import json

def test_endpoint(url, method="GET", data=None, headers=None, description=""):
    """Test an endpoint and return results"""
    print(f"\n--- {description} ---")
    print(f"Endpoint: {method} {url}")
    
    try:
        if method == "GET":
            response = requests.get(url, headers=headers, timeout=15)
        elif method == "POST":
            response = requests.post(url, json=data, headers=headers, timeout=15)
        
        print(f"Status: {response.status_code}")
        
        # Try to parse JSON response
        try:
            json_response = response.json()
            print(f"Response: {json.dumps(json_response, indent=2)[:300]}...")
        except:
            print(f"Response (non-JSON): {response.text[:300]}...")
            
        return response.status_code, response.text
    except Exception as e:
        print(f"Error: {str(e)}")
        return None, str(e)

def main():
    base_url = "http://api.lanamind.com"
    
    print("BACKEND ENDPOINT REVIEW")
    print("=" * 50)
    
    # 1. Health Check
    test_endpoint(
        f"{base_url}/health",
        "GET",
        description="Health Check Endpoint"
    )
    
    # 2. Root Endpoint
    test_endpoint(
        f"{base_url}/",
        "GET",
        description="Root Endpoint"
    )
    
    # 3. Cache Reset
    test_endpoint(
        f"{base_url}/api/cache/reset",
        "POST",
        description="Cache Reset Endpoint"
    )
    
    # 4. Metrics
    test_endpoint(
        f"{base_url}/api/metrics",
        "GET",
        description="Metrics Endpoint"
    )
    
    # 5. Structured Lesson
    test_endpoint(
        f"{base_url}/api/structured-lesson",
        "POST",
        data={"topic": "basic math", "age": 10},
        description="Structured Lesson Endpoint"
    )
    
    # 6. Math Solver
    test_endpoint(
        f"{base_url}/api/math-solver/solve",
        "POST",
        data={"problem": "What is 2+2?"},
        description="Math Solver Endpoint"
    )
    
    # 7. TTS
    test_endpoint(
        f"{base_url}/api/tts",
        "POST",
        data={"text": "Hello world"},
        description="Text-to-Speech Endpoint"
    )
    
    # 8. Chat
    test_endpoint(
        f"{base_url}/api/chat",
        "POST",
        data={"user_id": "test_user", "message": "Hello", "age": 10},
        description="Chat Endpoint"
    )
    
    print("\n" + "=" * 50)
    print("Review completed.")

if __name__ == "__main__":
    main()