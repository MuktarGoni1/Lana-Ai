# Database Configuration Guide

This guide explains how to securely configure and manage the database for the Lana AI application.

## Overview

The application uses PostgreSQL as its primary database with Supabase as the backend service. All database credentials and configuration should be stored securely using environment variables.

## Environment Variables

The following environment variables are used for database configuration:

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | Full database connection URL | None | Yes (recommended) |
| `DB_HOST` | Database host | localhost | No (if DATABASE_URL set) |
| `DB_PORT` | Database port | 5432 | No (if DATABASE_URL set) |
| `DB_NAME` | Database name | lana_ai | No (if DATABASE_URL set) |
| `DB_USER` | Database username | postgres | No (if DATABASE_URL set) |
| `DB_PASSWORD` | Database password | None | No (if DATABASE_URL set) |
| `DB_POOL_MIN_SIZE` | Minimum connection pool size | 5 | No |
| `DB_POOL_MAX_SIZE` | Maximum connection pool size | 20 | No |
| `DB_SSL_MODE` | SSL mode for connections | prefer | No |

## Supabase Configuration

Since the application uses Supabase, you should primarily use the `DATABASE_URL` environment variable which Supabase provides.

### Setting Environment Variables in Render

1. Go to your Render dashboard
2. Navigate to your service settings
3. Go to the "Environment" tab
4. Add the following environment variables:
   - `DATABASE_URL` (set `sync: false` for security)
   - Any other database-related variables as needed

### Local Development

For local development, create a `.env` file in the `backend` directory:

```env
# Database Configuration
DATABASE_URL=your_supabase_database_url_here
DB_POOL_MIN_SIZE=5
DB_POOL_MAX_SIZE=20
DB_SSL_MODE=require
```

## Security Best Practices

### Credential Storage

1. **Never commit credentials to version control**
   - Add `.env` to `.gitignore`
   - Use `sync: false` for sensitive variables in Render

2. **Use connection pooling**
   - Configure appropriate pool sizes
   - Monitor connection usage

3. **Enable SSL connections**
   - Set `DB_SSL_MODE=require` in production
   - Use Supabase's built-in SSL support

### Database Access Control

1. **Principle of least privilege**
   - Create database users with minimal required permissions
   - Use separate credentials for different services

2. **Row Level Security (RLS)**
   - Enable RLS on all tables
   - Implement proper policies for data isolation

## Database Schema Management

### Applying Schema Changes

1. **Backup before changes**
   - Always backup production data before schema changes
   - Test changes in staging environment first

2. **Migration strategy**
   - Use version-controlled migration scripts
   - Apply migrations during deployment

### Indexing and Performance

1. **Create appropriate indexes**
   - Index frequently queried columns
   - Monitor query performance

2. **Connection pooling**
   - Configure appropriate pool sizes based on usage
   - Monitor for connection leaks

## Testing Database Connectivity

### Local Testing

You can test database connectivity using the provided test script:

```bash
cd backend
python -c "from app.db_config import get_database_url; print('Database URL:', get_database_url())"
```

### Connection Testing Script

Create a test script to verify database connectivity:

```python
# test_db_connection.py
import asyncio
from app.db_manager import db_manager

async def test_connection():
    try:
        await db_manager.initialize()
        result = await db_manager.execute_query("SELECT version()")
        print("Database connection successful!")
        print("PostgreSQL version:", result[0]['version'])
    except Exception as e:
        print(f"Database connection failed: {e}")
    finally:
        await db_manager.close()

if __name__ == "__main__":
    asyncio.run(test_connection())
```

## Troubleshooting

### Common Issues

1. **Connection refused**
   - Check database host and port
   - Verify network connectivity
   - Ensure database service is running

2. **Authentication failed**
   - Verify username and password
   - Check database user permissions
   - Ensure SSL settings are correct

3. **Connection pool exhausted**
   - Increase pool size
   - Check for connection leaks
   - Optimize query performance

### Log Messages

Monitor the application logs for database-related messages:
- Connection initialization
- Query execution times
- Error messages

## Monitoring and Maintenance

### Health Checks

Implement database health checks in your application:

```python
async def check_database_health():
    try:
        result = await db_manager.execute_query("SELECT 1")
        return len(result) > 0
    except:
        return False
```

### Performance Monitoring

1. **Query performance**
   - Monitor slow queries
   - Use EXPLAIN ANALYZE for optimization

2. **Connection usage**
   - Monitor active connections
   - Track pool utilization

## Example Configuration

### Production Environment (Render)
```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/[DATABASE]?sslmode=require
DB_POOL_MIN_SIZE=5
DB_POOL_MAX_SIZE=20
DB_SSL_MODE=require
```

### Local Development (.env)
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/lana_ai?sslmode=prefer
DB_POOL_MIN_SIZE=2
DB_POOL_MAX_SIZE=10
DB_SSL_MODE=prefer
```

With this configuration, the application will securely connect to the database with proper connection pooling and SSL encryption.