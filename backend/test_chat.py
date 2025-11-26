import requests
import json

# Test the chat endpoint
url = "http://localhost:8000/api/chat"
headers = {"Content-Type": "application/json"}

# Test different modes
test_cases = [
    {
        "name": "Default mode",
        "data": {
            "user_id": "test_user",
            "message": "/default Explain photosynthesis",
            "age": 10
        }
    },
    {
        "name": "Maths mode",
        "data": {
            "user_id": "test_user",
            "message": "/maths 2x + 5 = 15",
            "age": 12
        }
    },
    {
        "name": "Chat mode",
        "data": {
            "user_id": "test_user",
            "message": "/chat Hello, how are you?",
            "age": 8
        }
    },
    {
        "name": "Quick mode",
        "data": {
            "user_id": "test_user",
            "message": "/quick What is the capital of France?",
            "age": 10
        }
    }
]

for test_case in test_cases:
    print(f"\n--- Testing {test_case['name']} ---")
    try:
        response = requests.post(url, headers=headers, data=json.dumps(test_case['data']))
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"Mode: {result['mode']}")
            print(f"Reply preview: {result['reply'][:100]}...")
            if result['quiz']:
                print(f"Quiz questions: {len(result['quiz'])}")
            else:
                print("No quiz data")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Error: {e}")


# Test quick mode specifically
test_case = {
    "name": "Quick mode",
    "data": {
        "user_id": "test_user",
        "message": "/quick What is the capital of France?",
        "age": 10
    }
}

print(f"\n--- Testing {test_case['name']} ---")
try:
    response = requests.post(url, headers=headers, data=json.dumps(test_case['data']))
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print(f"Mode: {result['mode']}")
        print(f"Reply: {result['reply']}")
        if result['quiz']:
            print(f"Quiz questions: {len(result['quiz'])}")
        else:
            print("No quiz data")
    else:
        print(f"Error: {response.text}")
except Exception as e:
    print(f"Error: {e}")
