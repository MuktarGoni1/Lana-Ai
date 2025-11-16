from fastapi.testclient import TestClient
from backend.main import app
import app.api.routes.tts as tts_module
from app.services.tts_service import TTSService

client = TestClient(app)

def test_tts_empty_text_returns_400():
    resp = client.post('/api/tts/', json={'text': ''})
    assert resp.status_code == 400

def test_tts_unavailable_returns_503_when_service_missing():
    # Force TTS service to be unavailable
    tts_module._TTS_SERVICE = TTSService(gemini_client=None)
    resp = client.post('/api/tts/', json={'text': 'Hello world'})
    assert resp.status_code == 503