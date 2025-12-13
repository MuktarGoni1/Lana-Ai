# Database Usage Guide

This guide explains how to use the database functionality in the Lana AI application.

## Overview

The application uses PostgreSQL as its primary database with Supabase as the backend service. The database functionality is implemented using asyncpg for asynchronous database operations with connection pooling for optimal performance.

## Database Manager

The `DatabaseManager` class in `app/db_manager.py` provides a high-level interface for database operations:

### Key Features

1. **Connection Pooling**: Automatically manages database connections with pooling
2. **Asynchronous Operations**: All database operations are asynchronous
3. **Security**: Uses environment variables for secure credential management
4. **Error Handling**: Proper error handling and logging

### Usage Example

```python
from app.db_manager import db_manager

# Initialize the database manager
await db_manager.initialize()

# Execute a query
results = await db_manager.execute_query("SELECT * FROM searches WHERE uid = $1", user_id)

# Insert or update a guardian
guardian = await db_manager.insert_guardian(
    email="parent@example.com",
    child_uid="user-uuid-here",
    weekly_report=True,
    monthly_report=True
)

# Close the database connection
await db_manager.close()
```

## Database Operations

### Query Execution

Execute SELECT queries and return results:

```python
results = await db_manager.execute_query(
    "SELECT * FROM searches WHERE uid = $1 AND created_at > $2",
    user_id,
    start_date
)
```

### Command Execution

Execute INSERT, UPDATE, DELETE commands:

```python
status = await db_manager.execute_command(
    "UPDATE guardians SET monthly_report = $1 WHERE email = $2",
    False,
    "parent@example.com"
)
```

### Guardian Management

Insert or update guardian records with proper conflict handling:

```python
guardian = await db_manager.insert_guardian(
    email="parent@example.com",
    child_uid="user-uuid-here",
    weekly_report=True,
    monthly_report=True
)
```

## Integration with Application State

The database manager is automatically integrated with the application state in `main.py`:

1. **Initialization**: The database connection pool is initialized when the application starts
2. **Health Checks**: Database health is included in the readiness probe
3. **Cleanup**: Database connections are properly closed when the application shuts down

## Using in Job Processors

To use the database in job processors:

```python
from app.db_manager import db_manager

async def process_monthly_report_job(job: Job, token: str):
    # Execute database queries
    users = await db_manager.execute_query(
        "SELECT * FROM guardians WHERE monthly_report = true"
    )
    
    for user in users:
        # Process user data
        pass
```

## Transaction Support

For operations that need to be atomic, you can use transactions:

```python
async with db_manager.get_connection() as conn:
    async with conn.transaction():
        await conn.execute("INSERT INTO searches (uid, title) VALUES ($1, $2)", uid, title)
        await conn.execute("UPDATE guardians SET last_report = NOW() WHERE child_uid = $1", uid)
```

## Error Handling

All database operations should be wrapped in try-except blocks:

```python
try:
    results = await db_manager.execute_query("SELECT * FROM searches")
except asyncpg.exceptions.PostgreSQLError as e:
    logger.error(f"Database error: {e}")
except Exception as e:
    logger.error(f"Unexpected error: {e}")
```

## Performance Considerations

1. **Connection Pooling**: The database manager uses connection pooling to optimize performance
2. **Prepared Statements**: Use parameterized queries to benefit from prepared statement caching
3. **Batch Operations**: For bulk operations, use batch inserts/updates when possible

## Testing Database Operations

### Unit Tests

```python
import pytest
from app.db_manager import db_manager

@pytest.mark.asyncio
async def test_insert_guardian():
    await db_manager.initialize()
    
    guardian = await db_manager.insert_guardian(
        email="test@example.com",
        child_uid="test-uuid",
        weekly_report=True
    )
    
    assert guardian["email"] == "test@example.com"
    
    await db_manager.close()
```

### Integration Tests

Create integration tests that verify database operations work correctly with the actual database.

## Security Best Practices

1. **Always use parameterized queries** to prevent SQL injection
2. **Store credentials securely** using environment variables
3. **Use connection pooling** to prevent connection exhaustion
4. **Implement proper error handling** without exposing sensitive information
5. **Enable SSL connections** in production environments

## Monitoring and Logging

The database manager includes built-in logging for:

1. Connection pool initialization
2. Query execution
3. Error conditions

Monitor these logs for performance and error tracking.

## Troubleshooting

### Common Issues

1. **Connection timeouts**: Check database host, port, and network connectivity
2. **Authentication failures**: Verify database credentials
3. **Permission errors**: Check database user permissions
4. **Pool exhaustion**: Monitor connection pool usage and adjust sizes as needed

### Debugging Tips

1. Enable debug logging to see detailed database operations
2. Use database profiling tools to identify slow queries
3. Monitor connection pool statistics
4. Check database logs for errors

## Example Implementation

Here's a complete example of using the database manager in a job processor:

```python
from app.db_manager import db_manager
from app.middleware.security_logger import log_sensitive_operation

async def process_monthly_report_job(job: Job, token: str):
    """Process monthly reports with database operations."""
    try:
        # Log the operation
        log_sensitive_operation(
            operation="monthly_report_generation",
            user_id="system",
            user_email="system@lanamind.com"
        )
        
        # Get users who want monthly reports
        users = await db_manager.execute_query(
            "SELECT * FROM guardians WHERE monthly_report = true"
        )
        
        reports_sent = 0
        for user in users:
            try:
                # Get user's search history
                searches = await db_manager.execute_query(
                    "SELECT * FROM searches WHERE uid = $1 ORDER BY created_at DESC LIMIT 10",
                    user["child_uid"]
                )
                
                # Generate and send report
                # ... report generation logic ...
                
                reports_sent += 1
            except Exception as e:
                logger.error(f"Error processing report for user {user['email']}: {e}")
                continue
        
        logger.info(f"Monthly reports processed: {reports_sent}")
        return {"reports_sent": reports_sent}
        
    except Exception as e:
        logger.error(f"Monthly report job failed: {e}")
        raise
```

This implementation provides a robust, secure, and performant database interface for the application.