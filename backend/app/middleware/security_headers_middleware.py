from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from starlette.types import ASGIApp

from app.settings import load_settings

_settings = load_settings()


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Middleware to add security headers to all responses."""

    async def dispatch(self, request: Request, call_next):
        """Add security headers to response."""
        response = await call_next(request)

        # Security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = (
            "geolocation=(), microphone=(), camera=()"
        )

        # Check if this is a documentation route
        is_docs_route = (
            request.url.path in ["/docs", "/redoc"] or
            request.url.path.startswith("/docs/") or
            request.url.path.startswith("/redoc/")
        )

        # Content Security Policy
        # Use production CSP when not in debug mode
        if not _settings.api_debug:
            if is_docs_route:
                # More permissive CSP for documentation routes to allow Swagger UI resources
                csp_policy = (
                    "default-src 'self'; "
                    "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/; "
                    "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/; "
                    "img-src 'self' data: https:; "
                    "font-src 'self' data: https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/; "
                    "connect-src 'self' https:; "
                    "media-src 'self'; "
                    "object-src 'none'; "
                    "base-uri 'self'; "
                    "form-action 'self'; "
                    "frame-ancestors 'none'; "
                    "upgrade-insecure-requests"
                )
            else:
                # Strict CSP for all other routes
                csp_policy = (
                    "default-src 'self'; "
                    "script-src 'self'; "
                    "style-src 'self' 'unsafe-inline'; "
                    "img-src 'self' data: https:; "
                    "font-src 'self' data:; "
                    "connect-src 'self' https:; "
                    "media-src 'self'; "
                    "object-src 'none'; "
                    "base-uri 'self'; "
                    "form-action 'self'; "
                    "frame-ancestors 'none'; "
                    "upgrade-insecure-requests"
                )
            response.headers["Content-Security-Policy"] = csp_policy

        # HSTS (HTTP Strict Transport Security)
        if request.url.scheme == "https":
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains; preload"
            )

        # Cache control for API responses
        if request.url.path.startswith("/api/"):
            response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
            response.headers["Pragma"] = "no-cache"
            response.headers["Expires"] = "0"

        return response