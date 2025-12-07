import sys
import os
# Add the parent directory to the path so we can import the main module
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from fastapi.testclient import TestClient
import pytest

from main import app
from app.api.routes.history import get_current_user, CurrentUser, get_history_service
from app.services.history_service import HistoryService, ForbiddenError


class FakeRepo:
    async def get_history(self, sid: str, limit: int = 100):
        return [{"sid": sid, "role": "user", "content": "hello", "created_at": ""}]

    async def append_message(self, sid: str, role: str, content: str) -> bool:
        return True


def fake_user():
    return CurrentUser(id="user123")


def fake_service():
    return HistoryService(FakeRepo())


client = TestClient(app)


def setup_module(module):
    app.dependency_overrides[get_current_user] = fake_user
    app.dependency_overrides[get_history_service] = fake_service


def teardown_module(module):
    app.dependency_overrides.clear()


def test_get_history_ok():
    resp = client.get("/api/history", params={"sid": "user123:abc", "limit": 1})
    assert resp.status_code == 200
    body = resp.json()
    assert isinstance(body, list)
    assert body[0]["title"] == "hello"


def test_get_history_forbidden_maps_403(monkeypatch):
    async def bad_get(*args, **kwargs):
        raise ForbiddenError("bad")

    service = fake_service()
    monkeypatch.setattr(service, "get_history", bad_get)

    def override_service():
        return service

    app.dependency_overrides[get_history_service] = override_service
    resp = client.get("/api/history", params={"sid": "user123:abc", "limit": 1})
    assert resp.status_code == 403


def test_post_history_forbidden_role_maps_403(monkeypatch):
    async def bad_append(*args, **kwargs):
        raise ForbiddenError("bad role")

    service = fake_service()
    monkeypatch.setattr(service, "append_message", bad_append)

    def override_service():
        return service

    app.dependency_overrides[get_history_service] = override_service
    resp = client.post("/api/history", json={"sid": "user123:abc", "role": "system", "content": "x"})
    assert resp.status_code == 403
