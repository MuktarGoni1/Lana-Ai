Your Personalized AI Lesson Tutor

Lana AI is an intelligent learning assistant that adapts to every student's age and level of understanding. It delivers simple, structured, and clear explanations, creates lesson plans, and generates performance reports directly for parents or guardians.

Each learner is paired with a personalized AI tutor — an explainer that helps them grasp difficult concepts, stay consistent, and improve faster.

Core Features:

Personalized lessons tailored to each learner's pace.

Clear, structured explanations for better understanding.

Automatic progress reports sent to parents.

AI tutor/avatar that engages and motivates students.

Vision: To make learning personal, intelligent, and transparent — helping every child learn better, and every parent stay connected to their progress. 🚀 Tech Stack

Frontend: Next.js + Tailwind CSS
Backend: FastAPI + Supabase
AI Layer: llama
Deployment: Render

## Deployment Configuration

For deployment on Render, we provide a template configuration file `backend/render.yaml.example`. To deploy:

1. Copy the template to create your own configuration:
   ```bash
   cp backend/render.yaml.example backend/render.yaml
   ```

2. Add your sensitive environment variables directly in the Render dashboard:
   - GROQ_API_KEY
   - GOOGLE_API_KEY
   - SUPABASE_URL
   - SUPABASE_SERVICE_ROLE_KEY
   - SUPABASE_ANON_KEY

The `render.yaml` file is intentionally excluded from version control to protect sensitive credentials.