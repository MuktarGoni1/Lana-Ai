import asyncio
import sys
import os

# Add the current directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Test the TTS functionality
async def test_tts():
    try:
        # Import the TTS router to check if it loads correctly
        from app.api.routes.tts import router
        print("TTS router imported successfully")
        
        # Check if Google API key is available
        from app.settings import load_settings
        settings = load_settings()
        print(f"Google API Key exists: {bool(settings.google_api_key)}")
        
        # Try to initialize Gemini client
        try:
            from google import genai
            if settings.google_api_key:
                client = genai.Client(api_key=settings.google_api_key)
                print("Gemini client initialized successfully")
                
                # Test with a simple TTS request
                try:
                    # This would be the actual TTS call, but we'll just test initialization
                    print("Gemini client ready for TTS requests")
                except Exception as e:
                    print(f"TTS test failed: {e}")
            else:
                print("No Google API key available for TTS")
        except Exception as e:
            print(f"Failed to initialize Gemini client: {e}")
            
    except Exception as e:
        print(f"Error in TTS test: {e}")
        import traceback
        traceback.print_exc()

# Run the test
if __name__ == "__main__":
    asyncio.run(test_tts())