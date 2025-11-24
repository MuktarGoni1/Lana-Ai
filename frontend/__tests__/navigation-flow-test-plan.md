# Navigation Flow Testing Plan

## Overview
This document outlines the comprehensive end-to-end testing plan for the application's navigation and routing flows, covering registration, login, and onboarding processes for both parent and child users.

## Test Cases

### 1. Registration Flow Testing

#### 1.1 Parent Registration
- [ ] Navigate to `/register` and select "Parent/Guardian"
- [ ] Verify redirect to `/register/form?role=parent`
- [ ] Enter valid email and submit form
- [ ] Verify magic link is sent (check email or mock API response)
- [ ] Verify redirect to `/register/magic-link-sent`
- [ ] Simulate clicking magic link to `/auth/confirmed/guardian`
- [ ] Verify successful authentication and redirect to `/homepage`

#### 1.2 Child Registration
- [ ] Navigate to `/register` and select "Student"
- [ ] Verify redirect to `/register/form?role=child`
- [ ] Enter valid child details (nickname, age, grade) and guardian email
- [ ] Submit form
- [ ] Verify successful registration and redirect to `/homepage`

#### 1.3 Registration Form Validation
- [ ] Attempt parent registration with invalid email
- [ ] Verify appropriate error message is displayed
- [ ] Attempt child registration with missing fields
- [ ] Verify appropriate validation errors are shown
- [ ] Attempt child registration with invalid age (< 8 or > 18)
- [ ] Verify appropriate error message is displayed

### 2. Login Flow Testing

#### 2.1 Parent Login
- [ ] Navigate to `/login`
- [ ] Select "Sign in as Parent"
- [ ] Verify redirect to `/login?flow=parent`
- [ ] Enter valid email and submit form
- [ ] Verify magic link is sent
- [ ] Verify redirect to `/login?magic-link-sent=true`
- [ ] Simulate clicking magic link to `/auth/auto-login`
- [ ] Verify successful authentication and redirect to `/homepage`

#### 2.2 Child Login
- [ ] Navigate to `/child-login`
- [ ] Enter valid email and submit form
- [ ] Verify magic link is sent
- [ ] Verify redirect to `/login?magic-link-sent=true`
- [ ] Simulate clicking magic link to `/auth/auto-login`
- [ ] Verify successful authentication and redirect to `/homepage`

#### 2.3 Login Form Validation
- [ ] Attempt parent login with invalid email
- [ ] Verify appropriate error message is displayed
- [ ] Attempt child login with invalid email
- [ ] Verify appropriate error message is displayed

### 3. Button Functionality Testing

#### 3.1 Registration Buttons
- [ ] Test "Send Magic Link" button for parent registration
- [ ] Verify loading state during submission
- [ ] Verify disabled state during submission
- [ ] Test "Register" button for child registration
- [ ] Verify loading state during submission
- [ ] Verify disabled state during submission

#### 3.2 Login Buttons
- [ ] Test "Send Magic Link" button for parent login
- [ ] Verify loading state during submission
- [ ] Verify disabled state during submission
- [ ] Test "Send Magic Link" button for child login
- [ ] Verify loading state during submission
- [ ] Verify disabled state during submission

#### 3.3 Navigation Buttons
- [ ] Test "Back to options" button on registration forms
- [ ] Verify proper navigation back to `/register`
- [ ] Test "Back to options" button on login forms
- [ ] Verify proper navigation back to `/login`
- [ ] Test "Parent login" button on child login page
- [ ] Verify proper navigation to `/login`

### 4. Child Account Management Testing

#### 4.1 Adding New Child Account
- [ ] As a parent user, navigate to account management section
- [ ] Add a new child account with valid details
- [ ] Verify child account is successfully created
- [ ] Verify proper linking between parent and child accounts

#### 4.2 Child Account Access
- [ ] As a child user, log in with registered credentials
- [ ] Verify access to appropriate features
- [ ] Verify restricted access to parent-only features

#### 4.3 Parent Account Management
- [ ] As a parent user, view linked child accounts
- [ ] Verify ability to manage child accounts
- [ ] Verify proper display of child account information

### 5. Navigation Validation Testing

#### 5.1 Internal Links
- [ ] Test all internal navigation links throughout the application
- [ ] Verify proper route resolution for each link
- [ ] Verify no broken links or dead ends

#### 5.2 Browser History
- [ ] Test browser back button functionality after each navigation
- [ ] Verify proper history management
- [ ] Verify no infinite redirect loops

#### 5.3 Deep Linking
- [ ] Test direct access to various application routes
- [ ] Verify proper authentication checks for protected routes
- [ ] Verify proper redirects for unauthenticated access to protected routes

### 6. Onboarding Flow Testing

#### 6.1 Incomplete Onboarding Redirect
- [ ] Register new parent account
- [ ] Verify redirect to `/term-plan?onboarding=1` for incomplete onboarding
- [ ] Register new child account
- [ ] Verify redirect to `/term-plan?onboarding=1` for incomplete onboarding

#### 6.2 Onboarding Completion
- [ ] Complete study plan creation on `/term-plan`
- [ ] Click "Save plan and continue"
- [ ] Verify onboarding completion flag is set
- [ ] Verify redirect to `/homepage`

#### 6.3 Skip Onboarding
- [ ] Navigate to `/term-plan?onboarding=1`
- [ ] Click "Skip to homepage" button
- [ ] Verify redirect to `/homepage`

## Edge Cases and Error Handling

### Authentication Edge Cases
- [ ] Test expired session handling
- [ ] Test concurrent login/logout scenarios
- [ ] Test authentication with network interruptions
- [ ] Test authentication with invalid tokens

### Error Handling
- [ ] Test registration with duplicate email
- [ ] Test login with non-existent email
- [ ] Test registration with server errors
- [ ] Test login with server errors
- [ ] Test onboarding with network failures

## Performance Testing

### Load Testing
- [ ] Test registration flow with multiple concurrent users
- [ ] Test login flow with multiple concurrent users
- [ ] Test onboarding flow with multiple concurrent users

### Responsiveness
- [ ] Test all flows on different screen sizes
- [ ] Test all flows on mobile devices
- [ ] Test all flows on tablet devices

## Security Testing

### Authentication Security
- [ ] Test secure handling of authentication tokens
- [ ] Test proper session management
- [ ] Test protection against session hijacking
- [ ] Test secure storage of sensitive information

### Authorization
- [ ] Test role-based access control
- [ ] Test proper restriction of unauthorized access
- [ ] Test privilege escalation prevention

## Implementation Notes

### Test Automation
- Implement automated tests for critical paths
- Use mocking for external dependencies
- Implement comprehensive error scenario testing

### Manual Testing
- Perform manual testing for UI/UX validation
- Conduct cross-browser testing
- Perform accessibility testing

### Monitoring
- Implement logging for navigation events
- Monitor error rates and failure points
- Track user journey analytics