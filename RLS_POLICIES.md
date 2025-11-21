# Recommended Row Level Security (RLS) Policies for Lana AI Database

## Overview
This document outlines the recommended Row Level Security (RLS) policies for the Lana AI database tables to ensure proper access control and data security.

## Table: users

### RLS Policy Recommendations:

1. **Enable RLS**:
```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
```

2. **Policy for user to read their own record**:
```sql
CREATE POLICY "Users can view their own record" 
ON users FOR SELECT 
USING (auth.uid() = id);
```

3. **Policy for user to update their own record**:
```sql
CREATE POLICY "Users can update their own record" 
ON users FOR UPDATE 
USING (auth.uid() = id);
```

4. **Policy for admin/service role to insert records**:
```sql
CREATE POLICY "Admins and service role can insert user records" 
ON users FOR INSERT 
WITH CHECK (auth.role() = 'service_role' OR auth.jwt() ->> 'role' = 'admin');
```

## Table: guardians

### RLS Policy Recommendations:

1. **Enable RLS**:
```sql
ALTER TABLE guardians ENABLE ROW LEVEL SECURITY;
```

2. **Policy for guardian to read their own records**:
```sql
CREATE POLICY "Guardians can view their own records" 
ON guardians FOR SELECT 
USING (email = auth.jwt() ->> 'email');
```

3. **Policy for guardian to insert their own records**:
```sql
CREATE POLICY "Guardians can insert their own records" 
ON guardians FOR INSERT 
WITH CHECK (email = auth.jwt() ->> 'email');
```

4. **Policy for guardian to update their own records**:
```sql
CREATE POLICY "Guardians can update their own records" 
ON guardians FOR UPDATE 
USING (email = auth.jwt() ->> 'email');
```

5. **Policy for admin/service role to manage all records**:
```sql
CREATE POLICY "Admins and service role can manage all guardian records" 
ON guardians FOR ALL 
USING (auth.role() = 'service_role' OR auth.jwt() ->> 'role' = 'admin');
```

## Table: searches

### RLS Policy Recommendations:

1. **Enable RLS**:
```sql
ALTER TABLE searches ENABLE ROW LEVEL SECURITY;
```

2. **Policy for user to read their own searches**:
```sql
CREATE POLICY "Users can view their own searches" 
ON searches FOR SELECT 
USING (uid = auth.uid());
```

3. **Policy for user to insert their own searches**:
```sql
CREATE POLICY "Users can insert their own searches" 
ON searches FOR INSERT 
WITH CHECK (uid = auth.uid());
```

4. **Policy for user to delete their own searches**:
```sql
CREATE POLICY "Users can delete their own searches" 
ON searches FOR DELETE 
USING (uid = auth.uid());
```

5. **Policy for admin/service role to manage all searches**:
```sql
CREATE POLICY "Admins and service role can manage all searches" 
ON searches FOR ALL 
USING (auth.role() = 'service_role' OR auth.jwt() ->> 'role' = 'admin');
```

## Implementation Notes

1. **Service Role**: The application should use the service role key for server-side operations that need to bypass RLS policies.

2. **Authentication**: All client-side operations should be authenticated through Supabase Auth to ensure proper JWT tokens are available for RLS checks.

3. **Testing**: These policies should be tested thoroughly in a development environment before deploying to production.

4. **Monitoring**: Enable Supabase's audit logging to monitor policy violations and unauthorized access attempts.

## Error Handling in Application Code

The application code has been updated to gracefully handle RLS policy violations:

1. **In onboarding flow**: When inserting into the `users` table, if RLS prevents the insert, the application continues with guardian linking and shows a user-friendly message.

2. **In guardian dashboard**: When fetching child information, the application handles cases where RLS policies might restrict access to certain records.

3. **In term-plan**: When saving study plans, the application uses localStorage as a fallback when database operations are restricted by RLS policies.

## Future Considerations

1. **Fine-grained access control**: Consider implementing more granular policies based on user roles and permissions.

2. **Row-level access logs**: Implement logging for all database operations to track access patterns and potential security issues.

3. **Policy review**: Regularly review and update RLS policies as the application evolves and new requirements emerge.