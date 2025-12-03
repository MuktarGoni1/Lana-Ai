import jwt
from fastapi.testclient import TestClient
import sys, os
sys.path.append(os.getcwd())

from main import app
from app.api.routes.lessons import get_lesson_service
from app.repositories.memory_lesson_repository import MemoryLessonRepository
from app.repositories.memory_cache_repository import MemoryCacheRepository
from app.services.lesson_service import LessonService
from app.settings import load_settings


def setup_overridden_service():
    repo = MemoryLessonRepository()
    cache = MemoryCacheRepository()
    service = LessonService(cache_repository=cache, lesson_repository=repo)
    # Prepopulate a lesson for userA
    user_id = "userA"
    topic = "algebra"
    lesson = {
        "id": "1",
        "topic": topic,
        "difficulty": "easy",
        "type": "standard",
        "content": "content",
        "quiz": [
            {"q": "2+2?", "options": ["3", "4"], "answer": "4"}
        ],
    }
    # Save to history to assign id and uid
    import asyncio
    asyncio.run(repo.save_lesson_history(user_id, topic, lesson))
    return service


def make_token(sub: str) -> str:
    settings = load_settings()
    payload = {"sub": sub, "email": f"{sub}@example.com"}
    return jwt.encode(payload, settings.api_secret_key, algorithm="HS256")


def test_get_lesson_requires_auth():
    overridden = setup_overridden_service()
    app.dependency_overrides[get_lesson_service] = lambda: overridden
    client = TestClient(app)
    resp = client.get("/api/lessons/1")
    assert resp.status_code == 401


def test_get_lesson_only_owner_has_access():
    overridden = setup_overridden_service()
    app.dependency_overrides[get_lesson_service] = lambda: overridden
    client = TestClient(app)

    # Owner token
    token_owner = make_token("userA")
    resp_ok = client.get(
        "/api/lessons/1",
        headers={"Authorization": f"Bearer {token_owner}"},
    )
    assert resp_ok.status_code == 200
    assert resp_ok.json().get("topic") == "algebra"

    # Non-owner token
    token_other = make_token("userB")
    resp_forbidden = client.get(
        "/api/lessons/1",
        headers={"Authorization": f"Bearer {token_other}"},
    )
    assert resp_forbidden.status_code == 404


def test_get_lesson_quiz_scoped_to_owner():
    overridden = setup_overridden_service()
    app.dependency_overrides[get_lesson_service] = lambda: overridden
    client = TestClient(app)

    token_owner = make_token("userA")
    resp_ok = client.get(
        "/api/lessons/1/quiz",
        headers={"Authorization": f"Bearer {token_owner}"},
    )
    assert resp_ok.status_code == 200
    data = resp_ok.json()
    assert isinstance(data, list) and len(data) == 1

    token_other = make_token("userB")
    resp_forbidden = client.get(
        "/api/lessons/1/quiz",
        headers={"Authorization": f"Bearer {token_other}"},
    )
    assert resp_forbidden.status_code == 404
