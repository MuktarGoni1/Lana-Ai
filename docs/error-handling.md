# Error Handling Documentation

This document describes the error handling strategies and patterns used throughout the Lana AI application.

## Error Types

### 1. API Errors
API errors are handled through the `ApiError` class which extends the standard JavaScript `Error` class.

**Common API Error Status Codes:**
- **400 Bad Request**: Invalid input or malformed requests
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **429 Too Many Requests**: Rate limiting exceeded
- **500 Internal Server Error**: Server-side errors
- **502 Bad Gateway**: Upstream service errors
- **503 Service Unavailable**: Temporary service unavailability
- **504 Gateway Timeout**: Upstream service timeout

### 2. Network Errors
Network errors are handled through the `NetworkError` class and occur when there are connectivity issues.

### 3. Validation Errors
Validation errors occur when input data doesn't meet the required criteria.

## Error Handling Patterns

### Frontend Error Handling

1. **API Client Level**: The `apiClient` automatically handles retries and maps HTTP status codes to user-friendly messages.

2. **Component Level**: Components should catch and display errors appropriately to users.

3. **Global Error Boundaries**: React error boundaries catch unhandled errors and display fallback UI.

### Backend Error Handling

1. **FastAPI Exception Handlers**: Custom exception handlers for different error types.

2. **Pydantic Validation**: Automatic validation of request data with descriptive error messages.

3. **Middleware Error Handling**: Global middleware for consistent error responses.

## User-Friendly Error Messages

The application maps technical error codes to user-friendly messages:

| Status Code | User Message |
|-------------|--------------|
| 400 | Bad request - please check your input |
| 401 | Authentication required - please sign in |
| 403 | Access denied - insufficient permissions |
| 404 | Resource not found |
| 429 | Too many requests - please try again later |
| 500 | Server error - please try again later |
| 502-504 | Service temporarily unavailable - please try again later |

## Retry Mechanisms

The application implements automatic retry mechanisms for transient errors:

- **Network Errors**: Up to 2 retries with exponential backoff
- **Rate Limiting**: Automatic delay calculation based on rate limit headers
- **Server Errors**: Up to 2 retries with exponential backoff

## Logging and Monitoring

### Development Logging
In development mode, detailed error information is logged to the console for debugging purposes.

### Production Monitoring
In production, errors can be sent to monitoring services for analysis and alerting.

## Best Practices

1. **Always Handle Errors**: Never let errors go unhandled, especially in async operations.

2. **Provide Context**: Include relevant context information when logging errors.

3. **Graceful Degradation**: Provide fallback behavior when non-critical operations fail.

4. **User Feedback**: Always inform users when errors occur and what they can do about it.

5. **Security**: Never expose sensitive information in error messages to users.

## Rate Limiting Errors

When rate limits are exceeded:
1. Users receive a clear message indicating they need to wait
2. The application calculates and displays the wait time
3. Requests are automatically queued and retried after the wait period

## Testing Error Scenarios

The application includes tests for various error scenarios:
- API error handling
- Network error handling
- Rate limiting
- Validation errors