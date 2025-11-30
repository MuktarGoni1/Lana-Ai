import requests
import json

# Test the structured lesson endpoint
url = "http://lana-ai.onrender.com/api/structured-lesson"
data = {
    "topic": "Basic Mathematics",
    "age": 10
}

headers = {
    "Content-Type": "application/json"
}

try:
    response = requests.post(url, data=json.dumps(data), headers=headers)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")