import requests
import json

r = requests.post('http://localhost:8000/api/structured-lesson', 
                  headers={'Content-Type': 'application/json'}, 
                  json={'topic': 'photosynthesis', 'age': 10})

print(f'Status: {r.status_code}')
print(f'Headers: {dict(r.headers)}')
print(f'Content source: {r.headers.get("X-Content-Source", "unknown")}')
data = r.json()
print(f'Sections: {len(data.get("sections", []))}')

# Check if it's a stub response
intro = data.get("introduction", "")
if "Let's learn about" in intro:
    print("This is a stub response")
else:
    print("This might be an LLM response")
    print(f"Introduction: {intro[:100]}...")