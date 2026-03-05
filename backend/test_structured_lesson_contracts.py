from fastapi.testclient import TestClient

from app.services.lesson_service import LessonContractError, LessonService
from main import app
import main as main_module


client = TestClient(app)


def test_normalize_accepts_direct_backend_shape():
    service = LessonService()
    payload = {
        "id": "abc",
        "introduction": "Photosynthesis converts light energy.",
        "sections": [{"title": "Overview", "content": "Plants use chlorophyll to absorb sunlight."}],
        "quiz": [{"q": "What is chlorophyll?", "options": ["Pigment", "Root", "Leaf"], "answer": "Pigment"}],
    }

    normalized = service.normalize_lesson_payload(payload)

    assert normalized["introduction"] == payload["introduction"]
    assert normalized["sections"][0]["title"] == "Overview"
    assert normalized["quiz"][0]["q"] == "What is chlorophyll?"


def test_normalize_accepts_legacy_envelope_shape():
    service = LessonService()
    payload = {
        "payload": {
            "lesson_content": {
                "summary": "Fractions represent parts of a whole.",
                "sections": [{"heading": "Basics", "body": "A fraction has numerator and denominator."}],
                "questions": [
                    {
                        "question": "What is the top number called?",
                        "options": ["Numerator", "Denominator", "Decimal"],
                        "answer": "Numerator",
                    }
                ],
            }
        }
    }

    normalized = service.normalize_lesson_payload(payload)

    assert normalized["introduction"] == "Fractions represent parts of a whole."
    assert normalized["sections"][0]["content"] == "A fraction has numerator and denominator."
    assert normalized["quiz"][0]["q"] == "What is the top number called?"


def test_normalize_rejects_empty_lesson_payload():
    service = LessonService()

    try:
        service.normalize_lesson_payload({"lesson": {"sections": []}})
        raised = False
    except LessonContractError as exc:
        raised = True
        assert exc.code == "INVALID_LESSON_PAYLOAD"

    assert raised


def test_structured_lesson_json_error_has_code_and_request_id(monkeypatch):
    async def fake_generate(*args, **kwargs):
        raise LessonContractError("EMPTY_LESSON", "Backend returned empty lesson")

    monkeypatch.setattr(main_module._LESSON_SERVICE, "generate_structured_lesson", fake_generate)

    resp = client.post("/api/structured-lesson", json={"topic": "Fractions", "age": 10})

    assert resp.status_code == 502
    detail = resp.json().get("detail", {})
    assert detail["code"] == "EMPTY_LESSON"
    assert "request_id" in detail


def test_structured_lesson_stream_error_has_code_and_request_id(monkeypatch):
    async def fake_generate(*args, **kwargs):
        raise LessonContractError("EMPTY_LESSON", "Backend returned empty lesson")

    monkeypatch.setattr(main_module._LESSON_SERVICE, "generate_structured_lesson", fake_generate)

    resp = client.post("/api/structured-lesson/stream", json={"topic": "Fractions", "age": 10})

    assert resp.status_code == 502
    assert '"type": "error"' in resp.text
    assert '"code": "EMPTY_LESSON"' in resp.text
    assert '"request_id":' in resp.text
