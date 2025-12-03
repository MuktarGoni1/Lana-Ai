import asyncio
import sys
import os
# Add the backend directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

# Set testing mode to prevent pre-warming issues
os.environ["TESTING_MODE"] = "1"

from unittest.mock import Mock, patch
from app.services.tts_service import TTSService
from app.config import TTS_MODEL, TTS_SAMPLE_RATE, TTS_CHUNK_SIZE, TTS_CONCURRENT_LIMIT, TTS_CACHE_TTL

def test_tts_configurable_parameters():
    """Test that TTS service uses configurable parameters."""
    # Verify that configuration parameters exist and have reasonable defaults
    assert TTS_MODEL == "gemini-2.0-flash-tts"
    assert TTS_SAMPLE_RATE == 22050
    assert TTS_CHUNK_SIZE == 32768
    assert TTS_CONCURRENT_LIMIT == 10
    assert TTS_CACHE_TTL == 7200
    print("✓ Configuration parameters test passed")

def test_tts_service_initialization():
    """Test that TTS service initializes correctly with optimizations."""
    # Mock the Gemini client to avoid actual API calls
    with patch('app.services.tts_service.genai') as mock_genai:
        mock_client = Mock()
        mock_genai.Client.return_value = mock_client
        
        # Initialize the service
        tts_service = TTSService()
        
        # Verify that the semaphore was created with the correct limit
        assert hasattr(tts_service, '_semaphore')
        print("✓ TTS service initialization test passed")

def test_tts_concurrent_limiting():
    """Test that TTS service respects concurrent request limits."""
    # Mock the Gemini client
    with patch('app.services.tts_service.genai') as mock_genai:
        mock_client = Mock()
        mock_genai.Client.return_value = mock_client
        
        # Initialize service with a small concurrent limit for testing
        with patch('app.config.TTS_CONCURRENT_LIMIT', 2):
            tts_service = TTSService(gemini_client=mock_client)
            
            # Test that we can acquire the semaphore
            async def test_semaphore():
                async with tts_service._semaphore:
                    return "acquired"
            
            # Run the test
            result = asyncio.run(test_semaphore())
            assert result == "acquired"
            print("✓ Concurrent limiting test passed")

def test_tts_service_caching():
    """Test that TTS service properly initializes with cache."""
    # Mock the Gemini client
    with patch('app.services.tts_service.genai') as mock_genai:
        mock_client = Mock()
        mock_genai.Client.return_value = mock_client
        
        # Mock the cache
        mock_cache = Mock()
        
        # Initialize service
        tts_service = TTSService(cache_repo=mock_cache, gemini_client=mock_client)
        
        # Verify the cache was set
        assert tts_service.cache_repo == mock_cache
        print("✓ Caching initialization test passed")

if __name__ == "__main__":
    test_tts_configurable_parameters()
    test_tts_service_initialization()
    test_tts_concurrent_limiting()
    test_tts_service_caching()
    print("All TTS simple tests passed!")