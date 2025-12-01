import requests
import json

# Test cache reset endpoint
print("Testing cache reset endpoint...")
try:
    response = requests.post("http://lana-ai.onrender.com/api/cache/reset")
    
    print(f"Cache reset status code: {response.status_code}")
    print(f"Cache reset response: {response.text}")
    
    if response.status_code == 200:
        try:
            json_data = response.json()
            if json_data.get("ok"):
                print("✅ SUCCESS: Cache reset successful")
            else:
                print("❌ FAILURE: Cache reset failed")
                print(f"Error: {json_data.get('error', 'Unknown error')}")
        except json.JSONDecodeError:
            print("Response is not valid JSON")
    else:
        print(f"Request failed with status code {response.status_code}")
        
except requests.exceptions.RequestException as e:
    print(f"Request error: {e}")