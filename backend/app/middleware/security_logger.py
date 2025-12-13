import logging
from typing import Optional, Dict, Any
import json
from datetime import datetime

# Set up security logger
security_logger = logging.getLogger("security")
security_logger.setLevel(logging.INFO)

# Create formatter
formatter = logging.Formatter(
    '%(asctime)s - SECURITY - %(levelname)s - %(message)s'
)

# Create handler if it doesn't exist
if not security_logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(formatter)
    security_logger.addHandler(handler)

def log_security_event(
    event_type: str,
    message: str,
    user_id: Optional[str] = None,
    user_email: Optional[str] = None,
    ip_address: Optional[str] = None,
    additional_data: Optional[Dict[str, Any]] = None
):
    """
    Log a security event with structured data.
    
    Args:
        event_type: Type of security event (e.g., "UNAUTHORIZED_ACCESS", "RATE_LIMIT_EXCEEDED")
        message: Human-readable description of the event
        user_id: User ID if available
        user_email: User email if available
        ip_address: IP address if available
        additional_data: Any additional data to log
    """
    log_data = {
        "event_type": event_type,
        "message": message,
        "timestamp": datetime.utcnow().isoformat(),
        "user_id": user_id,
        "user_email": user_email,
        "ip_address": ip_address,
        "additional_data": additional_data or {}
    }
    
    # Log the security event
    security_logger.info(json.dumps(log_data))

def log_unauthorized_access(
    user_id: Optional[str] = None,
    user_email: Optional[str] = None,
    ip_address: Optional[str] = None,
    attempted_action: Optional[str] = None,
    resource: Optional[str] = None
):
    """Log unauthorized access attempts."""
    log_security_event(
        event_type="UNAUTHORIZED_ACCESS",
        message=f"Unauthorized access attempt detected",
        user_id=user_id,
        user_email=user_email,
        ip_address=ip_address,
        additional_data={
            "attempted_action": attempted_action,
            "resource": resource
        }
    )

def log_rate_limit_exceeded(
    user_id: Optional[str] = None,
    user_email: Optional[str] = None,
    ip_address: Optional[str] = None,
    endpoint: Optional[str] = None,
    request_count: Optional[int] = None
):
    """Log rate limit exceeded events."""
    log_security_event(
        event_type="RATE_LIMIT_EXCEEDED",
        message=f"Rate limit exceeded",
        user_id=user_id,
        user_email=user_email,
        ip_address=ip_address,
        additional_data={
            "endpoint": endpoint,
            "request_count": request_count
        }
    )

def log_admin_action(
    action: str,
    user_id: str,
    user_email: str,
    ip_address: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None
):
    """Log administrative actions."""
    log_security_event(
        event_type="ADMIN_ACTION",
        message=f"Administrative action performed: {action}",
        user_id=user_id,
        user_email=user_email,
        ip_address=ip_address,
        additional_data=details or {}
    )

def log_sensitive_operation(
    operation: str,
    user_id: str,
    user_email: str,
    ip_address: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None
):
    """Log sensitive operations."""
    log_security_event(
        event_type="SENSITIVE_OPERATION",
        message=f"Sensitive operation performed: {operation}",
        user_id=user_id,
        user_email=user_email,
        ip_address=ip_address,
        additional_data=details or {}
    )