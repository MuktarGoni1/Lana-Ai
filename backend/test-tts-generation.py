import os
import sys
import asyncio
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env')

# Add the current directory to the Python path
sys.path.insert(0, os.path.dirname(__file__))

async def test_tts_generation():
    """Test actual TTS generation with the Google API key."""
    print("=" * 60)
    print("TTS GENERATION TEST")
    print("=" * 60)
    
    try:
        # Import the TTS service
        from app.services.tts_service import TTSService
        
        # Initialize TTS service
        print("Initializing TTS service...")
        tts_service = TTSService()
        
        if not tts_service.gemini_client:
            print("❌ FAILED: Gemini client not initialized")
            return
            
        print("✅ TTS service initialized successfully")
        
        # Test voices available in Gemini TTS
        voices = ["aoede", "charon", "echo", "fenrir", "gale", "leda", "perseus", "zeus"]
        
        # Test with a simple phrase
        test_text = "Hello, this is a test of the text to speech service."
        
        print(f"\nTesting TTS generation for text: '{test_text}'")
        print("-" * 50)
        
        for i, voice in enumerate(voices[:3], 1):  # Test first 3 voices
            print(f"\n{i}. Testing voice: {voice}")
            try:
                # Generate speech
                audio_bytes = await tts_service.generate_speech(test_text, voice)
                print(f"   ✅ SUCCESS: Generated {len(audio_bytes)} bytes of audio data")
                
                # Test synthesis (base64 encoding)
                base64_audio = await tts_service.synthesize(test_text, voice)
                print(f"   ✅ SUCCESS: Generated {len(base64_audio)} characters of base64 audio data")
                
            except Exception as e:
                print(f"   ❌ FAILED: {str(e)}")
        
        # Test performance
        print(f"\n--- Performance Test ---")
        import time
        
        start_time = time.time()
        try:
            audio_bytes = await tts_service.generate_speech(
                "This is a performance test to measure the response time of the TTS service.", 
                "aoede"
            )
            end_time = time.time()
            
            duration = end_time - start_time
            print(f"✅ SUCCESS: Generated {len(audio_bytes)} bytes in {duration:.2f} seconds")
            
            if duration < 5:
                print("✅ PERFORMANCE: Response time is excellent (< 5 seconds)")
            elif duration < 10:
                print("⚠️  WARNING: Response time is acceptable but slow (5-10 seconds)")
            else:
                print(f"❌ POOR PERFORMANCE: Response time is too slow ({duration:.2f} seconds > 10 seconds)")
                
        except Exception as e:
            print(f"❌ FAILED: Performance test error: {str(e)}")
            
        # Test error handling
        print(f"\n--- Error Handling Test ---")
        try:
            print("Testing with empty text...")
            await tts_service.generate_speech("", "aoede")
            print("❌ FAILED: Should have raised an error for empty text")
        except Exception as e:
            print(f"✅ SUCCESS: Properly handled empty text error: {str(e)}")
            
    except Exception as e:
        print(f"❌ FAILED: TTS service test error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_tts_generation())