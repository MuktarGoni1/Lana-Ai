# Supabase Testing Suite

This directory contains a comprehensive testing suite for verifying Supabase connections and retrieving authenticated user data.

## Components

### 1. Connection Testing (`connection-test.ts`)
- Tests Supabase client initialization and connectivity
- Validates environment variable configuration
- Measures connection latency
- Tests both regular and admin client connections

### 2. User Retrieval (`user-retrieval.ts`)
- Retrieves authenticated users from Supabase Auth
- Supports pagination for large datasets
- Provides search functionality by email
- Handles data transformation and filtering

### 3. Test Suite (`test-suite.ts`)
- Runs a comprehensive test suite combining all tests
- Provides formatted output for results
- Includes utility functions for user listing and search

### 4. API Endpoint (`app/api/supabase-test/route.ts`)
- Exposes testing functionality via HTTP API
- Supports different actions: test, users, search

### 5. Frontend Component (`app/supabase-test/page.tsx`)
- Provides a user interface for running tests
- Allows selection of different test actions
- Displays formatted test results

## Usage

### Running Tests via API

1. **Full Test Suite**
   ```
   GET /api/supabase-test?action=test
   ```

2. **Get All Users**
   ```
   GET /api/supabase-test?action=users
   ```

3. **Search Users by Email**
   ```
   GET /api/supabase-test?action=search&email=user@example.com
   ```

### Running Tests via Frontend

Navigate to `/supabase-test` in your browser to access the testing interface.

### Running Unit Tests

```bash
npm test supabase.test.ts
```

## Security Considerations

- The testing suite uses the Supabase admin client which has elevated privileges
- Ensure this functionality is only accessible in development environments
- Never expose the SUPABASE_SERVICE_ROLE_KEY in client-side code
- The API endpoint should be protected in production environments

## Environment Variables Required

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (for admin operations)

## Functions

### `testSupabaseConnection()`
Tests the Supabase connection and returns connection status, latency, and any errors.

### `testSupabaseAuth()`
Tests the Supabase Auth connection and returns user count.

### `getAuthenticatedUsers(page, perPage)`
Retrieves a paginated list of authenticated users.

### `getAllAuthenticatedUsers()`
Retrieves all authenticated users (use with caution for large datasets).

### `searchUsersByEmail(email)`
Searches for users by email.

### `runSupabaseTestSuite()`
Runs the complete test suite and returns a formatted report.

### `getFormattedUserList()`
Returns a formatted list of all authenticated users.

### `searchAndFormatUsersByEmail(email)`
Searches for users by email and returns formatted results.