import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env')

# Add the backend directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

def test_groq_functionality():
    """Test if Groq functionality is working correctly."""
    print("=" * 60)
    print("GROQ FUNCTIONALITY TEST")
    print("=" * 60)
    
    # Check if Groq API key is set
    groq_api_key = os.getenv("GROQ_API_KEY")
    if not groq_api_key:
        print("❌ ERROR: GROQ_API_KEY not found in environment variables")
        return
    
    print(f"✅ GROQ_API_KEY found (length: {len(groq_api_key)})")
    
    try:
        # Import Groq
        from groq import Groq
        print("✅ Groq SDK imported successfully")
        
        # Initialize Groq client
        client = Groq(api_key=groq_api_key)
        print("✅ Groq client initialized successfully")
        
        # Test a simple request
        print("\nTesting simple Groq request...")
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": "Say hello in one word"}],
            max_tokens=10
        )
        
        content = response.choices[0].message.content
        print(f"✅ Simple request successful: '{content}'")
        
        # Test structured lesson generation
        print("\nTesting structured lesson generation...")
        sys_prompt = (
            "You are lana, a helpful tutor who produces a structured lesson as strict JSON. "
            "Return ONLY valid JSON with these exact keys: "
            "introduction (string), "
            "classifications (array of objects with type and description string fields), "
            "sections (array of objects with title and content string fields), "
            "diagram (string), "
            "quiz_questions (array of objects with question, options array, and answer string fields). "
            "Each quiz question must have exactly 4 options. "
            "Keep each section content at least 100 words. Include 4 quiz questions with 4 options each. "
            "IMPORTANT: Respond ONLY with valid JSON, no markdown code blocks, no extra text, no explanations. "
            "Start your response with '{' and end with '}'. "
        )
        
        user_prompt = "Topic: photosynthesis"
        
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": sys_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.4,
            max_tokens=1200,
            top_p=0.9,
            stream=False,
        )
        
        raw_content = response.choices[0].message.content or ""
        print(f"✅ Structured lesson request successful")
        print(f"Response length: {len(raw_content)} characters")
        print(f"Response preview: {raw_content[:200]}...")
        
        # Try to parse the JSON
        import json
        import re
        
        # Clean up the response
        clean_content = raw_content.strip()
        
        # Remove markdown code blocks
        while clean_content.startswith('```'):
            if clean_content.startswith('```json'):
                clean_content = clean_content[7:].strip()
            else:
                clean_content = clean_content[3:].strip()
        
        while clean_content.endswith('```'):
            clean_content = clean_content[:-3].strip()
        
        # Remove control characters
        clean_content = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]', '', clean_content)
        
        # Try to parse JSON
        try:
            data = json.loads(clean_content)
            print("✅ JSON parsing successful")
            print(f"JSON keys: {list(data.keys())}")
            
            # Check if required keys are present
            required_keys = ["introduction", "classifications", "sections", "diagram", "quiz_questions"]
            missing_keys = [key for key in required_keys if key not in data]
            if missing_keys:
                print(f"⚠️  Missing keys: {missing_keys}")
            else:
                print("✅ All required keys present")
                
            # Check sections
            if "sections" in data and len(data["sections"]) > 0:
                print(f"✅ Sections found: {len(data['sections'])}")
                for i, section in enumerate(data["sections"][:2]):
                    print(f"  Section {i+1}: {section.get('title', 'No title')[:50]}...")
            else:
                print("⚠️  No sections found")
                
            # Check quiz questions
            quiz_data = data.get("quiz", data.get("quiz_questions", []))
            if quiz_data and len(quiz_data) > 0:
                print(f"✅ Quiz questions found: {len(quiz_data)}")
                for i, quiz in enumerate(quiz_data[:2]):
                    print(f"  Quiz {i+1}: {quiz.get('question', quiz.get('q', 'No question'))[:50]}...")
            else:
                print("⚠️  No quiz questions found")
                
        except json.JSONDecodeError as e:
            print(f"❌ JSON parsing failed: {e}")
            print(f"Clean content preview: {clean_content[:200]}...")
            
    except Exception as e:
        print(f"❌ FAILED: Groq functionality error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_groq_functionality()