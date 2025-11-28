# Test the actual settings loading in main.py
import sys
import os

# Add the current directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import and test the settings from main.py
from app.settings import load_settings

settings = load_settings()
print(f"GROQ_API_KEY from settings: {bool(settings.groq_api_key)}")
print(f"Key length: {len(settings.groq_api_key) if settings.groq_api_key else 0}")
print(f"Key preview: {settings.groq_api_key[:10] if settings.groq_api_key else 'None'}...")

# Test importing Groq and initializing client
try:
    from groq import Groq
    if settings.groq_api_key:
        client = Groq(api_key=settings.groq_api_key)
        print("Groq client initialized successfully")
    else:
        print("No API key available")
except Exception as e:
    print(f"Error importing or initializing Groq: {e}")

# Test the actual _GROQ_CLIENT from main.py
try:
    import main
    print(f"_GROQ_CLIENT in main.py: {main._GROQ_CLIENT is not None}")
    if main._GROQ_CLIENT:
        print("Main.py Groq client is properly initialized")
    else:
        print("Main.py Groq client is None")
except Exception as e:
    print(f"Error importing main.py: {e}")