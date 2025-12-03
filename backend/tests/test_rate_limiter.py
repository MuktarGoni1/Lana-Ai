from app.middleware.rate_limit_middleware import RateLimitMiddleware


class DummyApp:
    def __call__(self, scope, receive, send):
        pass


def test_in_memory_rate_limit_blocks_after_threshold():
    mw = RateLimitMiddleware(DummyApp())
    key = "test:limit"
    limit = 5
    window = 60

    allowed_count = 0
    for _ in range(10):
        ok, count = mw.check_rate_limit(key, limit, window)
        if ok:
            allowed_count += 1
    assert allowed_count == limit

