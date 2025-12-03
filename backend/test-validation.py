import os
import json
from dotenv import load_dotenv
load_dotenv('.env')

print("Testing structured lesson validation...")

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
        
        # Parse the JSON
        data = json.loads(content)
        
        # Simulate the validation logic
        print("\nSimulating validation logic...")
        
        # Process sections
        sections = []
        for s in data.get("sections", []):
            if isinstance(s, dict) and "title" in s and "content" in s:
                sections.append(s)
                
        print(f"Sections found: {len(sections)}")
        for i, section in enumerate(sections):
            print(f"  Section {i+1}: '{section.get('title', '')}' - {len(section.get('content', ''))} chars")
            
        # Check validation criteria
        has_sections = bool(sections)
        has_min_sections = len(sections) >= 1
        section_content_check = all(len(s.get('content', '')) > 10 for s in sections) if sections else False
        
        print(f"\nValidation results:")
        print(f"  Has sections: {has_sections}")
        print(f"  Has minimum sections (>=1): {has_min_sections}")
        print(f"  All sections have substantial content (>10 chars): {section_content_check}")
        
        has_substantial_content = (
            has_sections and has_min_sections and section_content_check
        )
        
        print(f"  Overall substantial content: {has_substantial_content}")
        
        if not has_substantial_content:
            print("❌ Would fall back to stub lesson")
        else:
            print("✅ Would accept the LLM response")
            
    else:
        print("No Groq API key found")
        
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()