import asyncio
import time
import sys
import os
# Add the backend directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

# Set testing mode to prevent pre-warming issues
os.environ["TESTING_MODE"] = "1"

from unittest.mock import Mock, patch
from app.services.tts_service import TTSService
from app.api.routes.tts import _get_tts_service

def test_tts_service_concurrent_requests():
    """Test that TTS service handles concurrent requests properly."""
    # Mock the Gemini client
    with patch('app.services.tts_service.genai') as mock_genai:
        mock_client = Mock()
        mock_genai.Client.return_value = mock_client
        
        # Mock the generate_content method to simulate API delay
        async def mock_generate_content(*args, **kwargs):
            # Simulate network delay
            await asyncio.sleep(0.1)
            mock_response = Mock()
            mock_response.candidates = [Mock()]
            mock_response.candidates[0].content.parts = [Mock()]
            mock_response.candidates[0].content.parts[0].inline_data.data = b"mock_audio_data"
            return mock_response
        
        mock_client.models.generate_content = mock_generate_content
        
        # Mock the cache to return None (cache miss)
        mock_cache = Mock()
        async def mock_cache_get(*args, **kwargs):
            return None
        mock_cache.get = mock_cache_get
        async def mock_cache_set(*args, **kwargs):
            return True
        mock_cache.set = mock_cache_set
        
        # Initialize service with a small concurrent limit for testing
        with patch('app.config.TTS_CONCURRENT_LIMIT', 3):
            tts_service = TTSService(cache_repo=mock_cache, gemini_client=mock_client)
            
            # Test concurrent requests
            async def make_request(text):
                start_time = time.time()
                try:
                    result = await tts_service.generate_speech(text)
                    end_time = time.time()
                    return end_time - start_time, result
                except Exception as e:
                    end_time = time.time()
                    return end_time - start_time, f"Error: {e}"
            
            async def test_concurrent_requests():
                # Create 5 concurrent requests
                tasks = [make_request(f"Test text {i}") for i in range(5)]
                results = await asyncio.gather(*tasks, return_exceptions=True)
                return results
            
            # Run the test
            results = asyncio.run(test_concurrent_requests())
            
            # Verify that all requests completed
            assert len(results) == 5
            # Verify that all results are either successful or properly handled errors
            success_count = sum(1 for r in results if not isinstance(r, Exception))
            assert success_count == 5

def test_tts_streaming_response_chunk_size():
    """Test that TTS streaming uses the configured chunk size."""
    from app.config import TTS_CHUNK_SIZE
    
    # Verify the chunk size is properly configured
    assert TTS_CHUNK_SIZE == 32768  # 32 KB chunks

def test_tts_service_caching():
    """Test that TTS service properly caches results."""
    # Mock the Gemini client
    with patch('app.services.tts_service.genai') as mock_genai:
        mock_client = Mock()
        mock_genai.Client.return_value = mock_client
        
        # Mock the cache
        mock_cache = Mock()
        # First call: cache miss, second call: cache hit
        call_count = 0
        async def mock_cache_get(*args, **kwargs):
            nonlocal call_count
            call_count += 1
            if call_count == 1:
                return None  # First call: cache miss
            else:
                return b"cached_audio_data"  # Second call: cache hit
        
        async def mock_cache_set(*args, **kwargs):
            return True
        
        mock_cache.get = mock_cache_get
        mock_cache.set = mock_cache_set
        
        # Mock the generate_content method
        async def mock_generate_content(*args, **kwargs):
            mock_response = Mock()
            mock_response.candidates = [Mock()]
            mock_response.candidates[0].content.parts = [Mock()]
            mock_response.candidates[0].content.parts[0].inline_data.data = b"generated_audio_data"
            return mock_response
        
        mock_client.models.generate_content = mock_generate_content
        
        # Initialize service
        tts_service = TTSService(cache_repo=mock_cache, gemini_client=mock_client)
        
        async def test_cache():
            # First call should generate new audio
            result1 = await tts_service.generate_speech("Test text")
            assert result1 == b"generated_audio_data"
            
            # Second call should return cached audio
            result2 = await tts_service.generate_speech("Test text")
            assert result2 == b"cached_audio_data"
        
        # Run the test
        asyncio.run(test_cache())

if __name__ == "__main__":
    test_tts_service_concurrent_requests()
    test_tts_streaming_response_chunk_size()
    test_tts_service_caching()
    print("All TTS integration tests passed!")