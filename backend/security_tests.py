#!/usr/bin/env python3
"""
Security tests for the Lana AI backend.

This script tests various security aspects of the backend implementation,
including authentication, authorization, rate limiting, and input validation.
"""

import asyncio
import aiohttp
import os
import json
from typing import Dict, Any

# Configuration
API_BASE_URL = os.environ.get('API_BASE_URL', 'http://localhost:8000')
TEST_USER_TOKEN = os.environ.get('TEST_USER_TOKEN', '')
ADMIN_USER_TOKEN = os.environ.get('ADMIN_USER_TOKEN', '')

async def test_unauthorized_access():
    """Test that unauthorized users cannot access admin endpoints."""
    print("Testing unauthorized access to admin endpoints...")
    
    async with aiohttp.ClientSession() as session:
        # Try to access the monthly reports endpoint without authentication
        async with session.post(f'{API_BASE_URL}/api/jobs/monthly-reports') as response:
            assert response.status == 401, f"Expected 401, got {response.status}"
            print("✓ Unauthenticated access correctly blocked")
        
        # Try to access the monthly reports endpoint with non-admin token
        headers = {'Authorization': f'Bearer {TEST_USER_TOKEN}'}
        async with session.post(f'{API_BASE_URL}/api/jobs/monthly-reports', headers=headers) as response:
            assert response.status == 403, f"Expected 403, got {response.status}"
            print("✓ Non-admin access correctly blocked")

async def test_rate_limiting():
    """Test that rate limiting works for admin endpoints."""
    print("Testing rate limiting...")
    
    headers = {'Authorization': f'Bearer {ADMIN_USER_TOKEN}'}
    
    async with aiohttp.ClientSession() as session:
        # Make multiple requests to trigger rate limiting
        success_count = 0
        rate_limit_count = 0
        
        for i in range(10):
            async with session.post(f'{API_BASE_URL}/api/jobs/monthly-reports', headers=headers) as response:
                if response.status == 200:
                    success_count += 1
                elif response.status == 429:
                    rate_limit_count += 1
                    # Check for Retry-After header
                    assert 'Retry-After' in response.headers, "Missing Retry-After header"
                else:
                    print(f"Unexpected status code: {response.status}")
        
        # We should have some rate limited requests
        assert rate_limit_count > 0, "Rate limiting not triggered"
        print(f"✓ Rate limiting working: {success_count} successful, {rate_limit_count} rate limited")

async def test_input_validation():
    """Test input validation in job processors."""
    print("Testing input validation...")
    
    # This would require direct access to the job processor functions
    # For now, we'll just verify the validation functions work correctly
    
    from app.jobs.job_processors import validate_email, sanitize_text
    
    # Test email validation
    assert validate_email("test@example.com") == True, "Valid email rejected"
    assert validate_email("invalid-email") == False, "Invalid email accepted"
    assert validate_email("") == False, "Empty email accepted"
    print("✓ Email validation working")
    
    # Test text sanitization
    sanitized = sanitize_text("<script>alert('xss')</script>Hello World")
    assert "<script>" not in sanitized, "XSS not sanitized"
    assert "Hello World" in sanitized, "Valid text removed"
    print("✓ Text sanitization working")

async def test_security_logging():
    """Test that security events are properly logged."""
    print("Testing security logging...")
    
    # This would require checking log files or log aggregation systems
    # For now, we'll just verify the logging functions exist and work
    
    from app.middleware.security_logger import log_unauthorized_access, log_admin_action
    
    # Test that logging functions don't raise exceptions
    log_unauthorized_access(
        user_id="test-user",
        user_email="test@example.com",
        ip_address="127.0.0.1",
        attempted_action="test_action",
        resource="/test/resource"
    )
    
    log_admin_action(
        action="test_action",
        user_id="admin-user",
        user_email="admin@example.com",
        ip_address="127.0.0.1"
    )
    
    print("✓ Security logging functions working")

async def main():
    """Run all security tests."""
    print("Running security tests...\n")
    
    try:
        await test_unauthorized_access()
        await test_rate_limiting()
        await test_input_validation()
        await test_security_logging()
        
        print("\n✓ All security tests passed!")
        
    except Exception as e:
        print(f"\n✗ Security test failed: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(main())