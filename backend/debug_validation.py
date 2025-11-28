import asyncio
import sys
import os
import json

# Add the current directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Simulate the exact LLM response we saw in the logs
llm_response_raw = '''```json
{
  "introduction": "Welcome to our lesson on photosynthesis! Photosynthesis is a magic process that happens in plants, where they use sunlight, water, and air to make their own food. This food is called glucose, and it gives plants the energy they need to grow big and strong. But that's not all - photosynthesis also helps to produce oxygen, which is essential for all living things, including humans! So, let's dive in and learn more about this amazing process.",
  "classifications": [
    {
      "type": "Scientific Process",
      "description": "Photosynthesis is a scientific process that involves the conversion of light energy into chemical energy."
    },
    {
      "type": "Ecosystem Process",
      "description": "Photosynthesis is an important process that occurs in ecosystems, where plants produce oxygen and glucose."
    },
    {
      "type": "Biology Topic",
      "description": "Photosynthesis is a fundamental topic in biology, where students learn about the process of how plants make their own food."
    }
  ],
  "sections": [
    {
      "title": "What is Photosynthesis?",
      "content": "Photosynthesis is the process by which plants, algae, and some bacteria convert light energy from the sun into chemical energy in the form of glucose. This process occurs in specialized organelles called chloroplasts, which are present in plant cells. Chloroplasts contain pigments such as chlorophyll, which absorbs light energy and transfers it to a molecule called ATP (adenosine triphosphate). ATP is then used to convert carbon dioxide and water into glucose and oxygen. This process is essential for life on Earth, as it provides energy and organic compounds for plants to grow and thrive. Without photosynthesis, plants would not be able to produce their own food, and humans and other animals would not have enough oxygen to breathe."
    },
    {
      "title": "The Ingredients of Photosynthesis",
      "content": "Photosynthesis requires three main ingredients: light energy, water, and carbon dioxide. Light energy is provided by the sun, which is absorbed by pigments such as chlorophyll in the chloroplasts of plant cells. Water is absorbed by the roots of plants and transported to the chloroplasts, where it is used to convert carbon dioxide into glucose. Carbon dioxide is absorbed from the air through small openings on the surface of plant leaves called stomata. In addition to these three main ingredients, photosynthesis also requires other essential nutrients such as nitrogen, phosphorus, and potassium. These nutrients are absorbed by the roots of plants and play a crucial role in the process of photosynthesis."
    },
    {
      "title": "The Products of Photosynthesis",
      "content": "The products of photosynthesis are glucose and oxygen. Glucose is a type of sugar that serves as a source of energy for plants. It is used to fuel the growth and development of plants, and is also stored in the form of starch in plant cells. Oxygen is a byproduct of photosynthesis, and is released into the air as a gas. This oxygen is essential for the survival of all living things, including humans, animals, and microorganisms. Without photosynthesis, the air would be devoid of oxygen, and life as we know it would not be possible. In addition to glucose and oxygen, photosynthesis also produces other important compounds such as cellulose, which is a key component of plant cell walls."
    },
    {
      "title": "The Importance of Photosynthesis",
      "content": "Photosynthesis is essential for life on Earth, as it provides energy and organic compounds for plants to grow and thrive. Without photosynthesis, plants would not be able to produce their own food, and humans and other animals would not have enough oxygen to breathe. Photosynthesis also plays a crucial role in the Earth's climate system, as it helps to regulate the amount of carbon dioxide in the atmosphere. By removing carbon dioxide from the air and releasing oxygen, photosynthesis helps to maintain a balance between the two gases, which is essential for life on Earth. In addition to its importance for life and the climate, photosynthesis also has economic and social implications, as it is a key component of many industries such as agriculture, forestry, and horticulture."
    }
  ],
  "diagram_description": "A diagram of a plant cell showing the chloroplasts, where photosynthesis takes place. The chloroplasts contain pigments such as chlorophyll, which absorbs light energy and transfers it to ATP. ATP is then used to convert carbon dioxide and water into glucose and oxygen.",
  "quiz_questions": [
    {
      "question": "What is the main product of photosynthesis?",
      "options": [
        "Glucose and oxygen",
        "Carbon dioxide and water",
        "Nitrogen and phosphorus",
        "Chlorophyll and ATP"
      ],
      "correct_answer": "Glucose and oxygen"
    },
    {
      "question": "What is the role of chlorophyll in photosynthesis?",
      "options": [
        "To absorb light energy and transfer it to ATP",
        "To convert carbon dioxide and water into glucose and oxygen",
        "To store energy in the form of starch",
        "To release oxygen into the air"
      ],
      "correct_answer": "To absorb light energy and transfer it to ATP"
    },
    {
      "question": "What is the source of light energy for photosynthesis?",
      "options": [
        "The sun",
        "The moon",
        "The stars",
        "The Earth's atmosphere"
      ],
      "correct_answer": "The sun"
    },
    {
      "question": "What is the byproduct of photosynthesis that is essential for human life?",
      "options": [
        "Glucose and oxygen",
        "Carbon dioxide and water",
        "Nitrogen and phosphorus",
        "Chlorophyll and ATP"
      ],
      "correct_answer": "Oxygen"
    }
  ]
}
```'''

async def test_validation():
    try:
        # Simulate the processing that happens in _compute_structured_lesson
        # Extract JSON if wrapped in markdown
        raw_excerpt = llm_response_raw.strip()
        if '```json' in raw_excerpt:
            start = raw_excerpt.find('```json') + 7
            end = raw_excerpt.find('```', start)
            if end != -1:
                raw_excerpt = raw_excerpt[start:end].strip()
        elif '```' in raw_excerpt:
            start = raw_excerpt.find('```') + 3
            end = raw_excerpt.find('```', start)
            if end != -1:
                raw_excerpt = raw_excerpt[start:end].strip()
        
        print("Raw excerpt extracted:")
        print(raw_excerpt[:200] + "..." if len(raw_excerpt) > 200 else raw_excerpt)
        
        # Parse JSON
        import orjson
        data = orjson.loads(raw_excerpt)
        
        # Process sections
        sections = []
        for s in data.get("sections", []):
            if isinstance(s, dict) and "title" in s and "content" in s:
                sections.append({"title": s["title"], "content": s["content"]})
        
        print(f"Processed sections: {len(sections)}")
        for i, section in enumerate(sections):
            print(f"  Section {i+1} ({section['title']}): {len(section['content'])} characters")
        
        # Process quiz
        quiz = []
        for q in data.get("quiz_questions", []):
            if (isinstance(q, dict) and 
                "question" in q and 
                "options" in q and 
                "correct_answer" in q and
                len(q["options"]) >= 2):
                quiz.append({
                    "q": q["question"], 
                    "options": q["options"], 
                    "answer": q["correct_answer"]
                })
        
        print(f"Processed quiz questions: {len(quiz)}")
        for i, q in enumerate(quiz):
            print(f"  Question {i+1}: {q['q']}")
            print(f"    Options: {len(q['options'])}")
            print(f"    Answer: {q['answer']}")
        
        # Check validation criteria
        has_substantial_content = (
            len(sections) >= 2 and  # At least 2 sections
            all(len(s["content"]) > 20 for s in sections) and  # Each section has substantial content
            len(quiz) >= 3  # At least 3 quiz questions
        )
        
        print(f"\nValidation result: {has_substantial_content}")
        print(f"  Sections criterion: {len(sections) >= 2}")
        print(f"  Content length criterion: {all(len(s['content']) > 20 for s in sections)}")
        print(f"  Quiz questions criterion: {len(quiz) >= 3}")
        
        if not has_substantial_content:
            print("Would fall back to stub")
        else:
            print("Would use LLM response")
            
    except Exception as e:
        print(f"Error in validation test: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_validation())