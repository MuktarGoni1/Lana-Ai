import os
import sys

# Load environment variables
from dotenv import load_dotenv
load_dotenv('.env')

print("Testing Google GenAI method...")

try:
    import google.genai as genai
    import google.genai.types as genai_types
    print("✓ Google GenAI SDK imported successfully")
    
    # Try to initialize client
    api_key = os.getenv("GOOGLE_API_KEY")
    if api_key:
        print(f"API key found (length: {len(api_key)})")
        try:
            client = genai.Client(api_key=api_key)
            print("✓ Client initialized successfully")
            
            # Try to call generate_content without any extra parameters
            print("Testing generate_content method...")
            try:
                # Test with minimal parameters
                response = client.models.generate_content(
                    model="gemini-2.0-flash-tts",
                    contents="Hello, world!",
                    config=genai_types.GenerateContentConfig(
                        response_modalities=["AUDIO"],
                        speech_config=genai_types.SpeechConfig(
                            voice_config=genai_types.VoiceConfig(
                                prebuilt_voice_config=genai_types.PrebuiltVoiceConfig(
                                    voice_name="Aoede",
                                )
                            )
                        ),
                    ),
                )
                print("✓ Method call successful")
            except Exception as e:
                print(f"✗ Method call failed: {e}")
                # Let's check if it's the request_options issue
                import traceback
                traceback.print_exc()
                
        except Exception as e:
            print(f"✗ Failed to initialize client: {e}")
    else:
        print("✗ No API key found")
        
except ImportError as e:
    print(f"✗ Failed to import Google GenAI SDK: {e}")
except Exception as e:
    print(f"✗ Unexpected error: {e}")

print("Done.")