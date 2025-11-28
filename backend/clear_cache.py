import requests

# Clear the cache
url = "http://localhost:8000/api/cache/reset"
try:
    response = requests.post(url)
    print(f"Cache reset response: {response.status_code}")
    print(f"Response: {response.json()}")
except Exception as e:
    print(f"Error resetting cache: {e}")