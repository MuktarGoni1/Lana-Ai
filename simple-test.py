import requests
import json

print("Simple test of TTS endpoint...")

try:
    tts_data = {
        "text": "This is a test."
    }
    response = requests.post(
        "http://api.lanamind.com/api/tts",
        headers={"Content-Type": "application/json"},
        data=json.dumps(tts_data),
        timeout=10
    )
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        print("Success!")
    else:
        print(f"Error: {response.text}")
except Exception as e:
    print(f"Exception: {e}")

print("Done.")