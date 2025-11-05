import requests
import json

# Test the structured lesson API
print("Testing Structured Lesson API...")
lesson_response = requests.post(
    'http://localhost:8000/api/structured-lesson',
    json={'topic': 'photosynthesis', 'age': 12}
)
print(f"Status Code: {lesson_response.status_code}")
if lesson_response.status_code == 200:
    lesson_data = lesson_response.json()
    print(f"Lesson Title: {lesson_data.get('sections', [{}])[0].get('title', 'N/A')}")
    print("✓ Structured Lesson API is working correctly\n")
else:
    print(f"Error: {lesson_response.text}\n")

# Test the math solver API
print("Testing Math Solver API...")
math_response = requests.post(
    'http://localhost:8000/api/solve-math',
    json={'question': '2x + 5 = 15'}
)
print(f"Status Code: {math_response.status_code}")
if math_response.status_code == 200:
    math_data = math_response.json()
    print(f"Math Solution: {math_data.get('final_answer', 'N/A')}")
    print("✓ Math Solver API is working correctly\n")
else:
    print(f"Error: {math_response.text}\n")

# Test the TTS API
print("Testing TTS API...")
tts_response = requests.post(
    'http://localhost:8000/api/tts',
    json={'text': 'Hello, this is a test of the text to speech functionality.'}
)
print(f"Status Code: {tts_response.status_code}")
if tts_response.status_code == 200:
    print(f"Audio Content Type: {tts_response.headers.get('Content-Type', 'N/A')}")
    print(f"Audio Content Length: {len(tts_response.content)} bytes")
    print("✓ TTS API is working correctly\n")
else:
    print(f"Error: {tts_response.text}\n")

print("All tests completed!")