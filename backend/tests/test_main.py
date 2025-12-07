import sys
import os
# Add the parent directory to the path so we can import the main module
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from main import app
from fastapi.testclient import TestClient

client = TestClient(app)


def test_read_main():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "version": "1.0.0"}