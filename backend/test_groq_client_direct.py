import sys
import os

# Add the current directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Test the Groq client directly
try:
    import main
    print(f"Groq client available: {main._GROQ_CLIENT is not None}")
    
    if main._GROQ_CLIENT:
        print("Testing direct Groq call...")
        try:
            # Test with a simple prompt
            response = main._GROQ_CLIENT.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[
                    {"role": "user", "content": "Say hello world in one word"}
                ],
                max_tokens=10
            )
            print("Direct Groq call successful!")
            print(f"Response: {response.choices[0].message.content}")
        except Exception as e:
            print(f"Direct Groq call failed: {e}")
            print(f"Error type: {type(e)}")
    else:
        print("No Groq client available")
        # Check settings
        from app.settings import load_settings
        settings = load_settings()
        print(f"GROQ_API_KEY exists: {bool(settings.groq_api_key)}")
        print(f"GROQ_API_KEY length: {len(settings.groq_api_key) if settings.groq_api_key else 0}")
        
except Exception as e:
    print(f"Error importing main: {e}")
    import traceback
    traceback.print_exc()