#!/usr/bin/env python3
"""
Test script for the email functionality in the monthly report job processor.
"""

import asyncio
import os
import sys
from datetime import datetime
from app.jobs.job_processors import send_monthly_report_email
from app.settings import Settings

# Add the backend directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

def create_mock_settings():
    """Create mock settings for testing."""
    return Settings(
        smtp_server=os.getenv("SMTP_SERVER", ""),
        smtp_port=int(os.getenv("SMTP_PORT", "587")),
        smtp_username=os.getenv("SMTP_USERNAME", ""),
        smtp_password=os.getenv("SMTP_PASSWORD", "")
    )

def create_mock_report_data():
    """Create mock report data for testing."""
    return {
        "user_email": "test@example.com",
        "child_name": "Test Child",
        "period": "December 2025",
        "total_lessons": 15,
        "topics_covered": ["Mathematics", "Science", "Language Arts"],
        "last_activity": "2025-12-10T14:30:00Z",
        "quiz_scores": [
            {"lesson_title": "Basic Addition", "score": 85, "date": "2025-12-01"},
            {"lesson_title": "Animal Classification", "score": 92, "date": "2025-12-05"},
            {"lesson_title": "Reading Comprehension", "score": 78, "date": "2025-12-08"}
        ],
        "average_score": 85.0,
        "performance_change": 5.5,
        "performance_trend": "improved"
    }

async def test_email_functionality():
    """Test the email sending functionality."""
    print("Testing email functionality...")
    
    # Create mock data
    settings = create_mock_settings()
    report_data = create_mock_report_data()
    
    print(f"Report data: {report_data}")
    print(f"Settings SMTP server: {settings.smtp_server}")
    
    # Test email sending
    try:
        await send_monthly_report_email(report_data, settings)
        print("✅ Email functionality test completed successfully")
        return True
    except Exception as e:
        print(f"❌ Email functionality test failed: {e}")
        return False

async def main():
    """Main test function."""
    print("Running email functionality tests...\n")
    
    success = await test_email_functionality()
    
    if success:
        print("\n🎉 All tests passed!")
        return 0
    else:
        print("\n💥 Some tests failed!")
        return 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)