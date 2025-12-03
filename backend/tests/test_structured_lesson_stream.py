from fastapi.testclient import TestClient
from main import app


client = TestClient(app)


def test_structured_lesson_stream_endpoint_exists():
    payload = {"topic": "Photosynthesis", "age": 10}
    resp = client.post("/api/structured-lesson/stream", json=payload)
    assert resp.status_code == 200
    # StreamingResponse returns full content in TestClient
    content_type = resp.headers.get("content-type", "")
    assert "text/event-stream" in content_type
    body = resp.text
    assert body.startswith("data: ")
    assert '"type": "done"' in body or '"type":"done"' in body
