import requests
import json

# Test health endpoint
try:
    response = requests.get("http://api.lanamind.com/health", timeout=10)
    print("Health endpoint:")
    print(f"  Status: {response.status_code}")
    print(f"  Response: {response.json()}")
except Exception as e:
    print(f"Health endpoint error: {e}")

# Test root endpoint
try:
    response = requests.get("http://api.lanamind.com/", timeout=10)
    print("\nRoot endpoint:")
    print(f"  Status: {response.status_code}")
    print(f"  Response: {response.json()}")
except Exception as e:
    print(f"Root endpoint error: {e}")

# Test cache reset endpoint
try:
    response = requests.post("http://api.lanamind.com/api/cache/reset", timeout=10)
    print("\nCache reset endpoint:")
    print(f"  Status: {response.status_code}")
    print(f"  Response: {response.json()}")
except Exception as e:
    print(f"Cache reset endpoint error: {e}")