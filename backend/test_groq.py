import os
from dotenv import load_dotenv
from groq import Groq

# Load environment variables
load_dotenv('.env')

# Get the API key
groq_api_key = os.getenv('GROQ_API_KEY')
print(f"GROQ_API_KEY exists: {bool(groq_api_key)}")
print(f"Key length: {len(groq_api_key) if groq_api_key else 0}")

# Initialize the client
client = Groq(api_key=groq_api_key) if groq_api_key else None

if client:
    try:
        # Test the client with a simple request
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "user", "content": "Say hello world"}
            ],
            max_tokens=10
        )
        print("Groq client test successful!")
        print(f"Response: {response.choices[0].message.content}")
    except Exception as e:
        print(f"Groq client test failed: {e}")
else:
    print("Groq client not initialized - no API key")