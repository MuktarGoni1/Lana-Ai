import os
import sys
import asyncio
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env')

# Add the current directory to the Python path
sys.path.insert(0, os.path.dirname(__file__))

def test_google_api_key():
    """Test if Google API key is properly loaded."""
    print("Testing Google API Key...")
    
    google_api_key = os.getenv("GOOGLE_API_KEY")
    if not google_api_key:
        print("❌ ERROR: GOOGLE_API_KEY not found in environment variables")
        return False
    
    print(f"✅ GOOGLE_API_KEY found (length: {len(google_api_key)})")
    print(f"Key starts with: {google_api_key[:10]}...")
    return True

def test_google_genai_import():
    """Test if Google GenAI SDK can be imported."""
    print("\nTesting Google GenAI SDK import...")
    
    try:
        import google.genai as genai
        import google.genai.types as genai_types
        print("✅ Google GenAI SDK imported successfully")
        return True
    except ImportError as e:
        print(f"❌ FAILED: Google GenAI SDK import error: {e}")
        return False
    except Exception as e:
        print(f"❌ FAILED: Unexpected error importing Google GenAI SDK: {e}")
        return False

def test_gemini_client_initialization():
    """Test if Gemini client can be initialized."""
    print("\nTesting Gemini client initialization...")
    
    try:
        import google.genai as genai
        google_api_key = os.getenv("GOOGLE_API_KEY")
        
        if not google_api_key:
            print("❌ FAILED: No Google API key available")
            return False
            
        client = genai.Client(api_key=google_api_key)
        print("✅ Gemini client initialized successfully")
        return True
    except Exception as e:
        print(f"❌ FAILED: Gemini client initialization error: {e}")
        return False

def main():
    """Main test function."""
    print("=" * 60)
    print("GOOGLE TTS SERVICE VERIFICATION")
    print("=" * 60)
    
    # Run all tests
    tests = [
        test_google_api_key,
        test_google_genai_import,
        test_gemini_client_initialization
    ]
    
    results = []
    for test in tests:
        try:
            result = test()
            results.append(result)
        except Exception as e:
            print(f"❌ Test failed with exception: {e}")
            results.append(False)
    
    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    
    passed = sum(results)
    total = len(results)
    
    print(f"Tests passed: {passed}/{total}")
    
    if passed == total:
        print("✅ All tests passed! TTS service should work correctly.")
    else:
        print("❌ Some tests failed. TTS service may not work properly.")
        print("\nRecommendations:")
        if not results[0]:
            print("  - Check that GOOGLE_API_KEY is set correctly in .env file")
        if not results[1]:
            print("  - Verify google-genai package is installed: pip install google-genai")
        if not results[2]:
            print("  - Check that the Google API key is valid and has TTS permissions")

if __name__ == "__main__":
    main()