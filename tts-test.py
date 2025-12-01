import os
import sys
import asyncio
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env')

# Add the backend directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from app.services.tts_service import TTSService

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_tts_functionality():
    """Test the TTS functionality with the current Google API key."""
    print("=" * 60)
    print("TTS FUNCTIONALITY TEST")
    print("=" * 60)
    
    # Check if Google API key is set
    google_api_key = os.getenv("GOOGLE_API_KEY")
    if not google_api_key:
        print("❌ ERROR: GOOGLE_API_KEY not found in environment variables")
        return
    
    print(f"✅ GOOGLE_API_KEY found (length: {len(google_api_key)})")
    
    try:
        # Initialize TTS service
        print("\nInitializing TTS service...")
        tts_service = TTSService()
        
        if tts_service.gemini_client:
            print("✅ Gemini client initialized successfully")
        else:
            print("❌ FAILED: Gemini client not initialized")
            return
        
        # Test cases
        test_cases = [
            {
                "name": "Basic Text",
                "text": "Hello, this is a test of the text to speech service.",
                "voice": "aoede"
            },
            {
                "name": "Educational Content",
                "text": "Let's learn about photosynthesis. Plants convert sunlight into energy through a process called photosynthesis.",
                "voice": "charon"
            },
            {
                "name": "Short Phrase",
                "text": "Well done!",
                "voice": "echo"
            }
        ]
        
        # Run tests
        for i, test_case in enumerate(test_cases, 1):
            print(f"\n--- Test Case {i}: {test_case['name']} ---")
            try:
                print(f"Generating speech for: '{test_case['text']}' with voice '{test_case['voice']}'")
                
                # Generate speech
                audio_bytes = await tts_service.generate_speech(
                    text=test_case['text'], 
                    voice_name=test_case['voice']
                )
                
                print(f"✅ SUCCESS: Generated {len(audio_bytes)} bytes of audio data")
                
                # Test synthesis (base64 encoding)
                base64_audio = await tts_service.synthesize(
                    text=test_case['text'], 
                    voice_name=test_case['voice']
                )
                
                print(f"✅ SUCCESS: Generated {len(base64_audio)} characters of base64 audio data")
                
            except Exception as e:
                print(f"❌ FAILED: {str(e)}")
                logger.error(f"Test case {i} failed: {e}", exc_info=True)
        
        # Test error handling
        print(f"\n--- Error Handling Test ---")
        try:
            print("Testing with empty text...")
            await tts_service.generate_speech("", "aoede")
            print("❌ FAILED: Should have raised an error for empty text")
        except Exception as e:
            print(f"✅ SUCCESS: Properly handled empty text error: {str(e)}")
            
        print(f"\n--- Performance Test ---")
        import time
        
        # Test performance with a medium-length text
        test_text = "This is a performance test to measure the response time of the TTS service. " * 5
        start_time = time.time()
        
        try:
            audio_bytes = await tts_service.generate_speech(test_text, "aoede")
            end_time = time.time()
            
            duration = end_time - start_time
            print(f"✅ SUCCESS: Generated {len(audio_bytes)} bytes in {duration:.2f} seconds")
            
            if duration < 5:
                print("✅ PERFORMANCE: Response time is acceptable (< 5 seconds)")
            else:
                print(f"⚠️  WARNING: Response time is slow ({duration:.2f} seconds > 5 seconds)")
                
        except Exception as e:
            print(f"❌ FAILED: Performance test error: {str(e)}")
            
    except Exception as e:
        print(f"❌ FAILED: TTS service initialization error: {str(e)}")
        logger.error(f"TTS service error: {e}", exc_info=True)

if __name__ == "__main__":
    asyncio.run(test_tts_functionality())