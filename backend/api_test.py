import requests
import time

def test_structured_lesson():
    print("Testing Structured Lesson API...")
    try:
        response = requests.post(
            'http://localhost:8000/api/structured-lesson',
            json={'topic': 'photosynthesis', 'age': 12},
            timeout=30
        )
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Lesson Introduction: {data.get('introduction', '')[:50]}...")
            print("✓ Structured Lesson API is working\n")
        else:
            print(f"Error: {response.text}\n")
    except Exception as e:
        print(f"Error testing Structured Lesson API: {e}\n")

def test_math_solver():
    print("Testing Math Solver API...")
    try:
        response = requests.post(
            'http://localhost:8000/api/solve-math',
            json={'question': '2 + 3'},
            timeout=30
        )
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Math Answer: {data.get('final_answer', 'N/A')}")
            print("✓ Math Solver API is working\n")
        else:
            print(f"Error: {response.text}\n")
    except Exception as e:
        print(f"Error testing Math Solver API: {e}\n")

def test_tts():
    print("Testing TTS API...")
    try:
        response = requests.post(
            'http://localhost:8000/api/tts',
            json={'text': 'Hello world'},
            timeout=30
        )
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            print(f"Audio Content Type: {response.headers.get('Content-Type', 'N/A')}")
            print(f"Audio Content Length: {len(response.content)} bytes")
            print("✓ TTS API is working\n")
        else:
            print(f"Error: {response.text}\n")
    except Exception as e:
        print(f"Error testing TTS API: {e}\n")

if __name__ == "__main__":
    print("Running API Tests...\n")
    
    test_structured_lesson()
    time.sleep(2)  # Small delay between tests
    
    test_math_solver()
    time.sleep(2)  # Small delay between tests
    
    test_tts()
    
    print("All tests completed!")