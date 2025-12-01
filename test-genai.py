import sys
import os

# Add backend to path
sys.path.insert(0, 'c:\\Users\\Muktar Goni Usman\\.qoder\\lana-frontend\\backend')

# Load environment variables
from dotenv import load_dotenv
load_dotenv('c:\\Users\\Muktar Goni Usman\\.qoder\\lana-frontend\\backend\\.env')

print("Testing Google GenAI SDK...")

# Try to import and test the SDK
try:
    import google.genai as genai
    import google.genai.types as genai_types
    print("✓ Google GenAI SDK imported successfully")
    
    # Check the version if possible
    try:
        print(f"Google GenAI version: {genai.__version__}")
    except:
        print("Could not determine Google GenAI version")
    
    # Try to initialize client
    api_key = os.getenv("GOOGLE_API_KEY")
    if api_key:
        print(f"API key found (length: {len(api_key)})")
        try:
            client = genai.Client(api_key=api_key)
            print("✓ Client initialized successfully")
            
            # Try to check the method signature
            import inspect
            try:
                sig = inspect.signature(client.models.generate_content)
                print(f"generate_content signature: {sig}")
            except Exception as e:
                print(f"Could not get method signature: {e}")
                
        except Exception as e:
            print(f"✗ Failed to initialize client: {e}")
    else:
        print("✗ No API key found")
        
except ImportError as e:
    print(f"✗ Failed to import Google GenAI SDK: {e}")
except Exception as e:
    print(f"✗ Unexpected error: {e}")

print("Done.")