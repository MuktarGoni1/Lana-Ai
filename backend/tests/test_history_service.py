import pytest

from app.services.history_service import HistoryService, ForbiddenError


class FakeRepo:
    async def get_history(self, sid: str, limit: int = 100):
        return [
            {"sid": sid, "role": "user", "content": "hello", "created_at": "2025-01-01"},
            {"sid": sid, "role": "assistant", "content": "world", "created_at": "2025-01-02"},
        ][:limit]

    async def append_message(self, sid: str, role: str, content: str) -> bool:
        return True


@pytest.mark.asyncio
async def test_get_history_happy_path():
    service = HistoryService(FakeRepo())
    user_id = "user123"
    sid = f"{user_id}:session-1"
    out = await service.get_history(user_id, sid, limit=2)
    assert isinstance(out, list)
    assert out[0]["id"].startswith(sid)
    assert out[0]["title"] == "hello"


@pytest.mark.asyncio
async def test_get_history_forbidden_idor():
    service = HistoryService(FakeRepo())
    with pytest.raises(ForbiddenError):
        await service.get_history("user123", "other:session-1", limit=1)


@pytest.mark.asyncio
async def test_append_message_invalid_role():
    service = HistoryService(FakeRepo())
    sid = "user123:session-1"
    with pytest.raises(ForbiddenError):
        await service.append_message("user123", sid, "system", "text")


@pytest.mark.asyncio
async def test_append_message_idor():
    service = HistoryService(FakeRepo())
    with pytest.raises(ForbiddenError):
        await service.append_message("user123", "other:session-1", "user", "text")