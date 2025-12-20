import os
from dotenv import load_dotenv
load_dotenv('.env')

print("Testing TTS with correct model...")

try:
    import google.genai as genai
    import google.genai.types as genai_types
    api_key = os.getenv("GOOGLE_API_KEY")
    if api_key:
        client = genai.Client(api_key=api_key)
        
        # Test with the correct model
        print("Testing generate_content with gemini-2.5-flash-preview-tts...")
        response = client.models.generate_content(
            model="gemini-2.5-flash-preview-tts",
            contents="Hello, this is a test of the text to speech service.",
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
        print("✓ TTS generation successful!")
        print(f"Response type: {type(response)}")
        
        # Check the response structure
        if hasattr(response, 'candidates') and response.candidates:
            parts = response.candidates[0].content.parts
            if parts:
                inline_data = parts[0].inline_data
                if inline_data:
                    print(f"Audio data type: {type(inline_data.data)}")
                    print(f"Audio data length: {len(inline_data.data) if isinstance(inline_data.data, (bytes, str)) else 'unknown'}")
                    
    else:
        print("No API key found")
        
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()