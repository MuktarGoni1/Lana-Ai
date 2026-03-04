import os
from dotenv import load_dotenv
load_dotenv('.env')

print("Testing Groq API...")

try:
    from groq import Groq
    api_key = os.getenv("GROQ_API_KEY")
    if api_key:
        print(f"Groq API key found (length: {len(api_key)})")
        client = Groq(api_key=api_key)
        
        # Test a simple request
        print("Testing Groq client...")
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": "Hello, world!"}],
            max_tokens=10
        )
        print("✓ Groq client test successful!")
        print(f"Response: {response.choices[0].message.content}")
    else:
        print("No Groq API key found")
        
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()