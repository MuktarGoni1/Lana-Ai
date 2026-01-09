from typing import Optional
from fastapi import Depends, HTTPException, status, Request
import jwt
from pydantic import BaseModel
from app.settings import Settings, load_settings


class CurrentUser(BaseModel):
    id: str
    email: Optional[str] = None


def get_settings() -> Settings:
    # Simple non-cached settings loader; FastAPI will reuse in process
    return load_settings()


def get_current_user(
    request: Request,
    settings: Settings = Depends(get_settings),
) -> CurrentUser:
    auth = request.headers.get("Authorization")
    if not auth or not auth.lower().startswith("bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")
    token = auth.split(" ", 1)[1]
    try:
        data = jwt.decode(token, settings.api_secret_key, algorithms=["HS256"])
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    uid = (data.get("sub") or data.get("user_id") or "").strip()
    if not uid:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
    return CurrentUser(id=uid, email=data.get("email"))