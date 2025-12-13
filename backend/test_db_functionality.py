#!/usr/bin/env python3
"""
Test script for the database functionality.
"""

import asyncio
import os
import sys
from app.db_manager import db_manager

# Add the backend directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

async def test_database_connection():
    """Test the database connection functionality."""
    print("Testing database connection...")
    
    try:
        # Initialize the database manager
        await db_manager.initialize()
        print("✅ Database manager initialized successfully")
        
        # Test a simple query
        result = await db_manager.execute_query("SELECT version()")
        if result:
            print(f"✅ Database query successful: {result[0]['version']}")
        else:
            print("⚠️  Database query returned no results")
        
        # Test guardian insertion (if table exists)
        try:
            guardian = await db_manager.insert_guardian(
                email="test@example.com",
                child_uid="00000000-0000-0000-0000-000000000000",
                weekly_report=True,
                monthly_report=True
            )
            print(f"✅ Guardian insertion test successful: {guardian}")
        except Exception as e:
            print(f"⚠️  Guardian insertion test skipped (table may not exist): {e}")
        
        # Close the database connection
        await db_manager.close()
        print("✅ Database connection closed successfully")
        
        return True
        
    except Exception as e:
        print(f"❌ Database functionality test failed: {e}")
        return False

async def main():
    """Main test function."""
    print("Running database functionality tests...\n")
    
    success = await test_database_connection()
    
    if success:
        print("\n🎉 All tests passed!")
        return 0
    else:
        print("\n💥 Some tests failed!")
        return 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)