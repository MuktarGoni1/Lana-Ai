## 🛡 Security & Stability

### Robust Error Mapping (Q-2)
All API calls MUST include robust `.catch()` blocks to prevent component crashes and MUST map Backend error codes (e.g., 400, 500) to clean, user-friendly messages.

### Mandatory Secure Input (S-1)
All user inputs MUST be validated locally (e.g., form validation) before transmission and sanitized if the content is to be rendered back to the user.

## 🏛 Architecture & Quality

### Enforced Data Contracts (A-3)
The use of the `any` type in data structures is FORBIDDEN. All API responses and state data MUST be defined using explicit TypeScript Interfaces or Classes.

### Strict Layer Separation (A-1)
Component logic MUST be minimal. All data fetching, business logic, and state manipulation MUST be confined to Services or the dedicated State Management layer.

### TDD Protocol Enforcement (Q-1)
Generate a Jest/Vitest unit test (including component rendering edge cases) before generating the implementation code.

### No Vendor Client in Components (A-4)
Direct use of the Supabase client or other external data access is FORBIDDEN within presentation components.

### Self-Describing Code (Q-4)
All components, services, and interfaces MUST include complete TSDoc comments detailing purpose, parameters, and return types.

### Consistent Style (Q-3)
Code MUST strictly adhere to project ESLint and Prettier formatting rules without warnings.

## ⚡ Performance & Setup

### Async by Default (P-1)
All data fetching MUST use the asynchronous pattern (async/await).

### Optimized Caching Strategy (P-3 Shared)
Include suggestions or integration points for client-side caching (e.g., SWR or dedicated state management features) for read-heavy operations.

### Explicit Dependency Declaration (Q-5)
The final output MUST include the exact `npm install` command for any new library used.

## 🐍 Backend Rules (FastAPI / Server-Side Focus)
These rules govern the API's security, data integrity, and high-concurrency handling.

### 🛡 Security & Stability

### Authorization Check First (S-2)
For all sensitive operations, the authorization check (MUST verify user ownership/permissions) is the FIRST line of service logic.

### Mandatory Secure Input (S-1)
Use Pydantic validation as the required security gateway for all incoming request data.

### Secret Isolation (S-3)
All configuration and credentials MUST be accessed via environment variables; hardcoding is FORBIDDEN.

### Hashing Algorithm Standard (S-4)
Use only modern, salted hashing (e.g., bcrypt, argon2) for credentials.

## 🏛 Architecture & Quality

### Strict Layer Separation (A-1)
Code MUST strictly follow the Controller -> Service -> Repository architecture.

### Dependency Inversion (A-2)
Services MUST depend on Repository Abstract Base Classes (abstractions), not concrete Supabase implementations.

### No Vendor Client in Services (A-4)
Raw `supabase.client` or database-specific logic MUST be confined exclusively to the Repository layer.

### Enforced Data Contracts (A-3)
All Request and Response data MUST be defined using Pydantic Models.

### TDD Protocol Enforcement (Q-1)
Generate a Pytest unit test (including edge cases) before generating the function implementation.

### Self-Describing Code (Q-4)
All functions/classes MUST include complete Python Docstrings.

### Consistent Style (Q-3)
Code MUST adhere to PEP8 and project-specific formatting (e.g., Black).

## ⚡ Performance & Setup

### N+1 Query Elimination (P-2)
Loops containing database queries are FORBIDDEN. Use joins or batching for related data retrieval.

### Async by Default (P-1)
All I/O operations (DB, network) MUST be implemented using `async def` and `await`.

### Payload Size Constraint (P-4)
Database select statements MUST explicitly choose required fields; avoid `SELECT *`.

### Explicit Dependency Declaration (Q-5)
The final output MUST include the exact `pip install` command for any new library used.