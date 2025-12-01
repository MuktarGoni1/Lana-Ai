import os
import sys

# Add backend to path
sys.path.insert(0, 'c:\\Users\\Muktar Goni Usman\\.qoder\\lana-frontend\\backend')

# Load environment variables
from dotenv import load_dotenv
load_dotenv('c:\\Users\\Muktar Goni Usman\\.qoder\\lana-frontend\\backend\\.env')

print("Debugging TTS service...")

# Check if Google GenAI is available
GOOGLE_GENAI_AVAILABLE = False
genai = None
genai_types = None

try:
    import google.genai as genai
    import google.genai.types as genai_types
    GOOGLE_GENAI_AVAILABLE = True
    print("✓ Google GenAI SDK is available")
except (ImportError, ModuleNotFoundError) as e:
    print(f"✗ Google GenAI SDK not available: {e}")

# Check API key
api_key = os.getenv("GOOGLE_API_KEY")
if api_key:
    print(f"✓ Google API key found (length: {len(api_key)})")
else:
    print("✗ No Google API key found")

# Try to initialize client
if GOOGLE_GENAI_AVAILABLE and api_key:
    try:
        client = genai.Client(api_key=api_key)
        print("✓ Gemini client initialized successfully")
        
        # Try a simple test
        try:
            print("Testing generate_content method...")
            # Check if the method signature is what we expect
            import inspect
            sig = inspect.signature(client.models.generate_content)
            print(f"generate_content signature: {sig}")
            
        except Exception as e:
            print(f"Error checking method signature: {e}")
            
    except Exception as e:
        print(f"✗ Failed to initialize Gemini client: {e}")
else:
    print("Cannot initialize client - missing dependencies or API key")

print("Done.")