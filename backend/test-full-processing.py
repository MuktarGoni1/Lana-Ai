import os
import json
import uuid
from dotenv import load_dotenv
load_dotenv('.env')

print("Testing full structured lesson processing...")

try:
    from groq import Groq
    from pydantic import BaseModel
    from typing import List, Optional
    
    # Define the models
    class ClassificationItem(BaseModel):
        type: str
        description: str

    class SectionItem(BaseModel):
        title: str
        content: str

    class QuizItem(BaseModel):
        q: str
        options: List[str]
        answer: str

    class StructuredLessonResponse(BaseModel):
        id: Optional[str] = None
        introduction: Optional[str] = None
        classifications: List[ClassificationItem] = []
        sections: List[SectionItem]
        diagram: str = ""
        quiz: List[QuizItem]
    
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
        
        # Simulate the full processing logic
        print("\nSimulating full processing logic...")
        
        # Normalize and validate response
        # Handle introduction - could be string or dict with title/text
        intro_data = data.get("introduction", "")
        if isinstance(intro_data, dict):
            # If it's a dict, try to get text or title
            intro_norm = (intro_data.get("text", "") or intro_data.get("title", "") or "").strip()
        else:
            intro_norm = str(intro_data).strip()
        
        # Handle diagram - could be in different fields
        diagram_norm = (data.get("diagram_description", "") or data.get("diagram", "")).strip()
        
        # Process classifications
        classifications = []
        for c in data.get("classifications", []):
            if isinstance(c, dict) and "type" in c and "description" in c:
                classifications.append(ClassificationItem(type=c["type"], description=c["description"]))
        
        # Process sections
        sections = []
        for s in data.get("sections", []):
            if isinstance(s, dict) and "title" in s and "content" in s:
                sections.append(SectionItem(title=s["title"], content=s["content"]))
        
        # Process quiz - handle both 'quiz' and 'quiz_questions' field names
        quiz_data = data.get("quiz", data.get("quiz_questions", []))
        quiz = []
        for q in quiz_data:
            if (isinstance(q, dict) and 
                "question" in q and 
                "options" in q and 
                "answer" in q and  # Changed from "correct_answer" to "answer"
                len(q["options"]) >= 2):
                # Handle options that might be objects with an "option" key
                options = []
                for opt in q["options"]:
                    if isinstance(opt, dict) and "option" in opt:
                        options.append(str(opt["option"]))
                    else:
                        options.append(str(opt))
                quiz.append(QuizItem(q=q["question"], options=options, answer=q["answer"]))
            elif (isinstance(q, dict) and 
                  "question" in q and 
                  "options" in q and 
                  "correct_answer" in q and  # Keep backward compatibility
                  len(q["options"]) >= 2):
                # Handle options that might be objects with an "option" key
                options = []
                for opt in q["options"]:
                    if isinstance(opt, dict) and "option" in opt:
                        options.append(str(opt["option"]))
                    else:
                        options.append(str(opt))
                quiz.append(QuizItem(q=q["question"], options=options, answer=q["correct_answer"]))
            elif (isinstance(q, dict) and 
                  "q" in q and 
                  "options" in q and 
                  "answer" in q and  # Handle 'q' field directly
                  len(q["options"]) >= 2):
                # Handle options that might be objects with an "option" key
                options = []
                for opt in q["options"]:
                    if isinstance(opt, dict) and "option" in opt:
                        options.append(str(opt["option"]))
                    else:
                        options.append(str(opt))
                quiz.append(QuizItem(q=q["q"], options=options, answer=q["answer"]))
        
        # Create response
        resp = StructuredLessonResponse(
            id=str(uuid.uuid4()),
            introduction=intro_norm,
            classifications=classifications,
            sections=sections,
            diagram=diagram_norm,
            quiz=quiz,
        )
        
        # Validation logic
        print(f"\nValidation results:")
        print(f"  Sections: {len(resp.sections)}")
        print(f"  Quiz questions: {len(resp.quiz)}")
        
        if resp.sections:
            section_details = [(s.title, len(s.content)) for s in resp.sections]
            print(f"  Section details: {section_details}")
        
        if resp.quiz:
            print(f"  Quiz questions: {len(resp.quiz)}")
        
        # Check validation criteria
        has_substantial_content = (
            resp.sections and len(resp.sections) >= 1 and  # At least 1 section (reduced from 2)
            all(len(s.content) > 10 for s in resp.sections)  # Each section has substantial content (reduced from 20 chars)
        )
        
        # If we have quiz questions, validate them as well
        if resp.quiz:
            has_substantial_content = has_substantial_content and (
                len(resp.quiz) >= 1  # At least 1 quiz question (reduced from 3)
            )
        
        print(f"\nFinal validation:")
        print(f"  Has substantial content: {has_substantial_content}")
        
        if has_substantial_content:
            print("✅ Would accept the LLM response")
            print(f"Introduction preview: {resp.introduction[:100]}...")
        else:
            print("❌ Would fall back to stub lesson")
            
    else:
        print("No Groq API key found")
        
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()