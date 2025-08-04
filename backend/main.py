# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="LANA-AI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js dev
    allow_methods=["*"],
)

class AskRequest(BaseModel):
    text: str

@app.post("/ask")
def ask(req: AskRequest):
    # Mock response for now
    return {
        "text": f"Here’s a quick answer to: {req.text}",
        "video_url": "https://res.cloudinary.com/demo/video/upload/lana_sample.mp4"
    }

@app.get("/health")
def health():
    return {"status": "ok"}