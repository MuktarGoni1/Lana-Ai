"""Reusable dependencies for the application."""

from fastapi import Depends, HTTPException, Security, status
from fastapi.security import HTTPBearer
from fastapi.security.http import HTTPAuthorizationCredentials
from supabase import create_client, Client
from config import settings
import logging

logger = logging.getLogger(__name__)
security = HTTPBearer()

def get_supabase_client() -> Client:
    """
    Get Supabase client for backend operations.
    IMPORTANT: Uses service role key, not anon key!
    """
    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Supabase not properly configured"
        )
    
    return create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_SERVICE_KEY
    )

async def verify_token(
    credentials: HTTPAuthorizationCredentials = Security(security),
    supabase: Client = Depends(get_supabase_client)
) -> dict:
    """
    Verify Supabase JWT token and extract user info.
    This dependency should be used on ALL protected routes.
    
    Raises:
        HTTPException: If token is invalid or expired
    """
    try:
        token = credentials.credentials
        
        # Verify token with Supabase
        user_response = supabase.auth.get_user(token)
        
        if not user_response or not user_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token"
            )
        
        # Extract user data
        user_data = {
            "id": user_response.user.id,
            "email": user_response.user.email,
            "role": user_response.user.user_metadata.get("role", "user") if user_response.user.user_metadata else "user"
        }
        
        logger.info(f"User authenticated: {user_data['id']}")
        return user_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Token verification failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )

async def get_current_user(
    user_data: dict = Depends(verify_token)
) -> dict:
    """
    Get current authenticated user.
    Use this dependency in your routes.
    """
    return user_data

async def require_admin(
    current_user: dict = Depends(get_current_user)
):
    """
    Ensure user has admin role.
    Use this dependency for admin-only routes.
    """
    if current_user.get("role") != "admin":
        logger.warning(f"Non-admin user {current_user['id']} attempted admin access")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user

async def require_role(required_role: str):
    """
    Factory function for role-based access control.
    
    Usage:
        @router.get("/moderator-only", dependencies=[Depends(require_role("moderator"))])
    """
    async def role_checker(current_user: dict = Depends(get_current_user)):
        if current_user.get("role") != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"{required_role.capitalize()} access required"
            )
        return current_user
    return role_checker