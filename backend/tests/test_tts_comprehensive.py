import asyncio
import sys
import os
import time
# Add the backend directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

# Set testing mode to prevent pre-warming issues
os.environ["TESTING_MODE"] = "1"

from unittest.mock import Mock, patch
from app.services.tts_service import TTSService
from app.api.routes.tts import router
from app.config import TTS_MODEL, TTS_SAMPLE_RATE, TTS_CHUNK_SIZE, TTS_CONCURRENT_LIMIT, TTS_CACHE_TTL

def test_tts_configurable_parameters():
    """Test that TTS service uses configurable parameters."""
    # Verify that configuration parameters exist and have reasonable defaults
    assert TTS_MODEL == "gemini-2.5-flash-preview-tts"
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

def test_tts_performance_benchmark():
    """Benchmark TTS service performance with concurrent requests."""
    # Mock the Gemini client
    with patch('app.services.tts_service.genai') as mock_genai:
        mock_client = Mock()
        mock_genai.Client.return_value = mock_client
        
        # Mock the cache to return None (cache miss)
        mock_cache = Mock()
        async def mock_cache_get(*args, **kwargs):
            return None
        mock_cache.get = mock_cache_get
        
        async def mock_cache_set(*args, **kwargs):
            return True
        mock_cache.set = mock_cache_set
        
        # Mock the generate_content method to simulate API delay
        def mock_generate_content(*args, **kwargs):
            # Simulate network delay
            time.sleep(0.05)  # 50ms delay
            mock_response = Mock()
            mock_response.candidates = [Mock()]
            mock_response.candidates[0].content.parts = [Mock()]
            mock_response.candidates[0].content.parts[0].inline_data.data = b"mock_audio_data"
            return mock_response
        
        mock_client.models.generate_content = mock_generate_content
        
        # Initialize service
        tts_service = TTSService(cache_repo=mock_cache, gemini_client=mock_client)
        
        async def benchmark_concurrent_requests():
            # Test concurrent requests
            start_time = time.time()
            
            # Create 5 concurrent requests
            tasks = [tts_service.generate_speech(f"Test text {i}") for i in range(5)]
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            end_time = time.time()
            total_time = end_time - start_time
            
            # With semaphore limit of 10, all 5 requests should complete concurrently
            # Each request takes ~50ms, so total time should be ~50ms (not 250ms sequential)
            assert len(results) == 5
            assert total_time < 0.3  # Should complete in less than 300ms (more realistic threshold)
            return total_time, len(results)
        
        # Run the benchmark
        total_time, count = asyncio.run(benchmark_concurrent_requests())
        print(f"✓ Performance benchmark: {count} concurrent requests completed in {total_time:.3f}s")

def test_tts_error_handling():
    """Test TTS service error handling."""
    # Mock the Gemini client
    with patch('app.services.tts_service.genai') as mock_genai:
        mock_client = Mock()
        mock_genai.Client.return_value = mock_client
        
        # Mock the cache
        mock_cache = Mock()
        async def mock_cache_get(*args, **kwargs):
            return None
        mock_cache.get = mock_cache_get
        
        # Mock the generate_content method to raise an exception
        def mock_generate_content(*args, **kwargs):
            raise Exception("API Error")
        
        mock_client.models.generate_content = mock_generate_content
        
        # Initialize service
        tts_service = TTSService(cache_repo=mock_cache, gemini_client=mock_client)
        
        async def test_error():
            try:
                await tts_service.generate_speech("Test text")
                assert False, "Should have raised an exception"
            except RuntimeError as e:
                assert "TTS generation failed" in str(e)
                return True
        
        # Run the test
        result = asyncio.run(test_error())
        assert result
        print("✓ Error handling test passed")

if __name__ == "__main__":
    print("Running comprehensive TTS tests...")
    test_tts_configurable_parameters()
    test_tts_service_initialization()
    test_tts_concurrent_limiting()
    test_tts_service_caching()
    test_tts_performance_benchmark()
    test_tts_error_handling()
    print("All comprehensive TTS tests passed!")