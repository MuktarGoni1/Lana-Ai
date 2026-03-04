import os
from dotenv import load_dotenv
load_dotenv('.env')

print("Testing structured lesson generation...")

try:
    from groq import Groq
    api_key = os.getenv("GROQ_API_KEY")
    if api_key:
        client = Groq(api_key=api_key)
        
        # Test the same prompt used in the structured lesson generation
        print("Testing structured lesson prompt...")
        sys_prompt = (
            "You are a helpful tutor who produces a structured lesson as strict JSON. "
            "Return ONLY valid JSON with these exact keys: "
            "introduction (string), "
            "classifications (array of objects with type and description string fields), "
            "sections (array of objects with title and content string fields), "
            "diagram (string), "
            "quiz_questions (array of objects with question, options array, and answer string fields). "
            "Each quiz question must have exactly 4 options. "
            "For the learner's age group: general audience. "
            "Keep language clear for the learner. For scientific topics, provide specific details and examples. "
            "Do not provide generic responses. Each section should contain substantial educational content. "
            "IMPORTANT: Respond ONLY with valid JSON, no markdown code blocks, no extra text, no explanations. "
            "Start your response with '{' and end with '}'. "
            "Example format: {\"introduction\": \"...\", \"classifications\":[{\"type\":\"...\",\"description\":\"...\"}], \"sections\":[{\"title\":\"...\",\"content\":\"...\"}], \"diagram\":\"...\", \"quiz_questions\":[{\"question\":\"...\",\"options\":[\"...\",\"...\",\"...\",\"...\"],\"answer\":\"...\"}]}"
        )
        
        user_prompt = {
            "topic": "math",
            "requirements": "Educational, concise, accurate, friendly. Provide specific details for scientific topics. Do not provide generic template responses. Each section should contain substantial educational content relevant to the specific topic.",
            "format": "Return ONLY valid JSON with the exact keys specified in the system prompt. No markdown code blocks."
        }
        
        import json
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            temperature=0.3,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": sys_prompt},
                {"role": "user", "content": json.dumps(user_prompt)},
            ],
        )
        
        content = completion.choices[0].message.content
        print("Response received:")
        print(content[:200] + "..." if len(content) > 200 else content)
        
        # Try to parse the JSON
        try:
            data = json.loads(content)
            print("✓ JSON parsing successful!")
            print(f"Introduction: {data.get('introduction', '')[:100]}...")
        except json.JSONDecodeError as e:
            print(f"✗ JSON parsing failed: {e}")
            print("Raw content:")
            print(repr(content))
            
    else:
        print("No Groq API key found")
        
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()