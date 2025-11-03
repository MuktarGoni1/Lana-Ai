# 🚀 Frontend Pre-Deployment Checklist
## Next.js + Supabase Production Readiness

> **Critical**: This checklist MUST be completed before deploying to production. Each unchecked item is a potential production incident.

---

## 🔒 SECURITY (Zero Tolerance)

### Authentication & Authorization
- [ ] **No Service Role Key on Frontend** - Only `NEXT_PUBLIC_SUPABASE_ANON_KEY` is used
  ```typescript
  // ❌ FORBIDDEN
  const supabase = createClient(url, process.env.SUPABASE_SERVICE_KEY);
  
  // ✅ REQUIRED
  const supabase = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  ```

- [ ] **Protected Routes Have Middleware** - All `/dashboard/*` and `/admin/*` routes check auth
  ```typescript
  // middleware.ts must exist and check authentication
  export async function middleware(req: NextRequest) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session && req.nextUrl.pathname.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }
  ```

- [ ] **No Hardcoded Secrets** - Check all files for API keys, tokens, passwords
  ```bash
  # Run this command to scan for secrets
  grep -r "sk_live" "pk_live" "secret" "password" "api_key" --include="*.ts" --include="*.tsx"
  ```

- [ ] **Environment Variables Properly Prefixed**
  - Public vars: `NEXT_PUBLIC_*` (accessible in browser)
  - Private vars: No prefix (only available server-side)
  ```env
  # ✅ CORRECT
  NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
  BACKEND_API_URL=http://api.internal  # Not exposed to browser
  
  # ❌ WRONG - Don't expose private keys
  NEXT_PUBLIC_SUPABASE_SERVICE_KEY=...
  ```

### Input Validation & Sanitization
- [ ] **All Form Inputs Are Validated** - Using Zod or similar
  ```typescript
  // ✅ REQUIRED
  import { z } from 'zod';
  
  const FormSchema = z.object({
    name: z.string().min(1).max(100),
    email: z.string().email(),
    age: z.number().positive().max(120),
  });
  ```

- [ ] **User Content Is Sanitized** - Before rendering HTML
  ```typescript
  // ✅ REQUIRED
  import DOMPurify from 'isomorphic-dompurify';
  
  const sanitized = DOMPurify.sanitize(userInput, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em'],
  });
  ```

- [ ] **No Direct HTML Injection** - Audit all `dangerouslySetInnerHTML` usage
  ```bash
  # Find all instances
  grep -r "dangerouslySetInnerHTML" --include="*.tsx" --include="*.ts"
  ```

### Data Exposure
- [ ] **No Sensitive Data in Client Components** - Move to Server Components
  ```typescript
  // ❌ BAD - API keys in client component
  'use client'
  function MyComponent() {
    const apiKey = process.env.NEXT_PUBLIC_SECRET_KEY; // Exposed!
  }
  
  // ✅ GOOD - Sensitive ops in Server Component
  async function MyServerComponent() {
    const data = await fetchSensitiveData(); // Not exposed to browser
    return <div>{data.publicInfo}</div>;
  }
  ```

- [ ] **No Console.logs with Sensitive Data** - Remove all debug logs
  ```bash
  # Find and remove
  grep -r "console.log" --include="*.ts" --include="*.tsx"
  ```

- [ ] **Error Messages Don't Expose System Details**
  ```typescript
  // ❌ BAD
  catch (error) {
    toast.error(`Database error: ${error.message}`); // Shows SQL details!
  }
  
  // ✅ GOOD
  catch (error) {
    console.error('Failed to load data:', error); // Logs for debugging
    toast.error('Unable to load data. Please try again.'); // User-friendly
  }
  ```

---

## ⚡ PERFORMANCE

### Code Splitting & Loading
- [ ] **Heavy Components Are Lazy Loaded**
  ```typescript
  // ✅ REQUIRED for charts, editors, heavy UI
  import dynamic from 'next/dynamic';
  
  const HeavyChart = dynamic(() => import('./HeavyChart'), {
    loading: () => <Spinner />,
    ssr: false,
  });
  ```

- [ ] **Images Use Next.js Image Component**
  ```typescript
  // ❌ FORBIDDEN
  <img src="/photo.jpg" alt="Photo" />
  
  // ✅ REQUIRED
  import Image from 'next/image';
  <Image src="/photo.jpg" alt="Photo" width={500} height={300} />
  ```

- [ ] **Large Libraries Are Tree-Shaken**
  ```typescript
  // ❌ BAD - Imports entire library
  import _ from 'lodash';
  
  // ✅ GOOD - Imports only what's needed
  import { debounce } from 'lodash';
  ```

### Data Fetching
- [ ] **Server Components Used for Initial Data** - Not Client Components with useEffect
  ```typescript
  // ✅ PREFERRED - Server Component (no loading state needed)
  async function ProductList() {
    const supabase = createServerClient();
    const { data } = await supabase.from('products').select('*');
    return <div>{data.map(...)}</div>;
  }
  
  // ⚠️ ACCEPTABLE - Client Component (but less optimal)
  'use client'
  function ProductList() {
    const { data, isLoading } = useQuery(['products'], fetchProducts);
    if (isLoading) return <Spinner />;
    return <div>{data.map(...)}</div>;
  }
  ```

- [ ] **All List Endpoints Use Pagination**
  ```typescript
  // ❌ FORBIDDEN - Loads all records
  const { data } = await supabase.from('products').select('*');
  
  // ✅ REQUIRED - Paginated
  const { data } = await supabase
    .from('products')
    .select('*')
    .range(page * pageSize, (page + 1) * pageSize - 1);
  ```

- [ ] **Expensive Queries Are Cached**
  ```typescript
  // Server Component with caching
  async function getData() {
    const response = await fetch('https://api.example.com/data', {
      next: { revalidate: 3600 } // Cache for 1 hour
    });
    return response.json();
  }
  
  // Client Component with React Query
  const { data } = useQuery({
    queryKey: ['data'],
    queryFn: fetchData,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  ```

### Bundle Size
- [ ] **Bundle Size Is Under Limits** - Run bundle analyzer
  ```bash
  # Install and run
  npm install @next/bundle-analyzer
  ANALYZE=true npm run build
  
  # Check output:
  # - First Load JS should be < 200kb per page
  # - Shared by all should be < 100kb
  ```

- [ ] **Unused Dependencies Removed**
  ```bash
  # Check for unused packages
  npx depcheck
  ```

- [ ] **Production Build Is Tested**
  ```bash
  npm run build
  npm run start
  # Test all critical user flows
  ```

---

## 🎨 USER EXPERIENCE

### Loading States
- [ ] **All Async Operations Have Loading Indicators**
  ```typescript
  // ✅ REQUIRED
  function ProductForm() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const handleSubmit = async () => {
      setIsSubmitting(true);
      try {
        await createProduct(data);
      } finally {
        setIsSubmitting(false);
      }
    };
    
    return (
      <button disabled={isSubmitting}>
        {isSubmitting ? 'Creating...' : 'Create Product'}
      </button>
    );
  }
  ```

- [ ] **Skeleton Screens for Data Loading** - Not just spinners
  ```typescript
  // ✅ GOOD
  function ProductCard({ isLoading, product }) {
    if (isLoading) {
      return (
        <div className="animate-pulse">
          <div className="h-48 bg-gray-200 rounded" />
          <div className="h-4 bg-gray-200 rounded mt-2" />
        </div>
      );
    }
    return <div>{product.name}</div>;
  }
  ```

### Error Handling
- [ ] **All API Calls Have Error Handling**
  ```typescript
  // ✅ REQUIRED
  async function fetchData() {
    try {
      const response = await fetch('/api/data');
      if (!response.ok) throw new Error('Failed to fetch');
      return await response.json();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Unable to load data');
      throw error;
    }
  }
  ```

- [ ] **Error Boundaries Wrap Components**
  ```typescript
  // app/layout.tsx or specific sections
  <ErrorBoundary fallback={<ErrorFallback />}>
    <YourComponent />
  </ErrorBoundary>
  ```

- [ ] **Error Pages Exist** - `app/error.tsx` and `app/not-found.tsx`
  ```typescript
  // app/error.tsx
  'use client'
  export default function Error({ error, reset }) {
    return (
      <div>
        <h2>Something went wrong!</h2>
        <button onClick={() => reset()}>Try again</button>
      </div>
    );
  }
  ```

### Accessibility
- [ ] **All Interactive Elements Are Keyboard Accessible**
  ```typescript
  // ✅ GOOD - Can be clicked or pressed with Enter
  <button onClick={handleClick}>Submit</button>
  
  // ❌ BAD - Not keyboard accessible
  <div onClick={handleClick}>Submit</div>
  ```

- [ ] **Images Have Alt Text**
  ```typescript
  // ✅ REQUIRED
  <Image src="/logo.png" alt="Company Logo" width={100} height={100} />
  ```

- [ ] **Forms Have Proper Labels**
  ```typescript
  // ✅ REQUIRED
  <label htmlFor="email">Email</label>
  <input id="email" type="email" name="email" />
  ```

- [ ] **Color Contrast Meets WCAG Standards** - Use accessibility checker
  ```bash
  # Run Lighthouse audit
  # Or use online tool: https://webaim.org/resources/contrastchecker/
  ```

---

## 🏗️ ARCHITECTURE

### Component Structure
- [ ] **No Direct Supabase Calls in Components** - Use service layer
  ```typescript
  // ❌ FORBIDDEN
  'use client'
  function UserProfile({ userId }) {
    const [user, setUser] = useState(null);
    const supabase = createClient();
    
    useEffect(() => {
      supabase.from('users').select('*').eq('id', userId).single()
        .then(({ data }) => setUser(data));
    }, [userId]);
  }
  
  // ✅ REQUIRED
  'use client'
  function UserProfile({ userId }) {
    const userService = new UserService();
    const { data: user } = useQuery(['user', userId], 
      () => userService.getUser(userId)
    );
  }
  ```

- [ ] **Server Components Used Where Possible** - Check each Client Component
  ```typescript
  // Ask: Does this component need useState, useEffect, or event handlers?
  // If NO → Make it a Server Component (remove 'use client')
  ```

- [ ] **Prop Drilling Avoided** - Use context or composition
  ```typescript
  // ❌ BAD - Passing through multiple levels
  <Parent user={user}>
    <Child user={user}>
      <GrandChild user={user} />
    </Child>
  </Parent>
  
  // ✅ GOOD - Use context
  <UserProvider value={user}>
    <Parent>
      <Child>
        <GrandChild /> {/* Gets user from context */}
      </Child>
    </Parent>
  </UserProvider>
  ```

### Type Safety
- [ ] **No `any` Types** - All external data is validated
  ```bash
  # Find all instances
  grep -r ": any" --include="*.ts" --include="*.tsx"
  ```

- [ ] **Supabase Types Are Generated and Used**
  ```bash
  # Generate types
  supabase gen types typescript --project-id <project-id> > types/supabase.ts
  ```
  ```typescript
  // ✅ Use generated types
  import type { Database } from '@/types/supabase';
  type User = Database['public']['Tables']['users']['Row'];
  ```

- [ ] **All API Responses Are Validated**
  ```typescript
  // ✅ REQUIRED - Runtime validation
  import { z } from 'zod';
  
  const UserSchema = z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    name: z.string(),
  });
  
  const response = await fetch('/api/user');
  const data = await response.json();
  const user = UserSchema.parse(data); // Throws if invalid
  ```

### File Organization
- [ ] **Features Are Grouped by Domain** - Not by type
  ```
  ❌ BAD
  components/
    Button.tsx
    UserCard.tsx
    OrderCard.tsx
  hooks/
    useUser.ts
    useOrders.ts
  
  ✅ GOOD
  features/
    users/
      components/UserCard.tsx
      hooks/useUser.ts
      services/userService.ts
    orders/
      components/OrderCard.tsx
      hooks/useOrders.ts
      services/orderService.ts
  shared/
    components/Button.tsx
  ```

---

## 🧪 TESTING

### Test Coverage
- [ ] **Critical User Flows Have Tests**
  - [ ] Authentication (login, logout, signup)
  - [ ] Data creation (forms)
  - [ ] Payment flows (if applicable)
  - [ ] Navigation between protected routes

- [ ] **Edge Cases Are Tested**
  ```typescript
  // ✅ REQUIRED tests
  describe('ProductForm', () => {
    it('handles empty input', async () => {
      // Test submitting empty form
    });
    
    it('handles network errors', async () => {
      // Test when API fails
    });
    
    it('handles invalid data', async () => {
      // Test with bad input
    });
  });
  ```

- [ ] **All Tests Pass**
  ```bash
  npm test
  # Must show: Tests: X passed, X total
  # No failures, no skipped tests
  ```

### Manual Testing Checklist
- [ ] **Test in Production Mode**
  ```bash
  npm run build && npm run start
  ```

- [ ] **Test on Multiple Browsers**
  - [ ] Chrome/Edge
  - [ ] Firefox
  - [ ] Safari (if applicable)

- [ ] **Test on Mobile Devices**
  - [ ] iOS Safari
  - [ ] Android Chrome

- [ ] **Test Offline Behavior** - Graceful degradation
  - [ ] Open DevTools → Network → Offline
  - [ ] Verify error messages appear

- [ ] **Test with Slow Network** - Enable throttling
  - [ ] Open DevTools → Network → Slow 3G
  - [ ] Verify loading states work

---

## 🔧 CONFIGURATION

### Environment Setup
- [ ] **Production Environment Variables Set**
  ```env
  # Vercel/Netlify dashboard or .env.production
  NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
  NEXT_PUBLIC_API_URL=https://api.yourdomain.com
  NEXT_PUBLIC_ENV=production
  ```

- [ ] **Analytics/Monitoring Configured**
  - [ ] Vercel Analytics or Google Analytics
  - [ ] Error tracking (Sentry, Bugsnag)
  - [ ] Performance monitoring

### Build Configuration
- [ ] **next.config.js Is Production-Ready**
  ```javascript
  // next.config.js
  module.exports = {
    // ✅ Enable strict mode
    reactStrictMode: true,
    
    // ✅ Add security headers
    async headers() {
      return [
        {
          source: '/(.*)',
          headers: [
            {
              key: 'X-Frame-Options',
              value: 'DENY',
            },
            {
              key: 'X-Content-Type-Options',
              value: 'nosniff',
            },
            {
              key: 'Referrer-Policy',
              value: 'strict-origin-when-cross-origin',
            },
          ],
        },
      ];
    },
    
    // ✅ Optimize images
    images: {
      domains: ['yourdomain.com', 'xxx.supabase.co'],
      formats: ['image/avif', 'image/webp'],
    },
  };
  ```

- [ ] **.eslintrc Is Configured for Production**
  ```json
  {
    "extends": [
      "next/core-web-vitals",
      "plugin:@typescript-eslint/recommended"
    ],
    "rules": {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": "error",
      "no-console": ["warn", { "allow": ["warn", "error"] }]
    }
  }
  ```

- [ ] **TypeScript Is in Strict Mode**
  ```json
  // tsconfig.json
  {
    "compilerOptions": {
      "strict": true,
      "noUncheckedIndexedAccess": true,
      "noImplicitAny": true
    }
  }
  ```

### Dependencies
- [ ] **All Dependencies Are Up to Date**
  ```bash
  npm outdated
  npm update
  ```

- [ ] **No Critical Security Vulnerabilities**
  ```bash
  npm audit
  # Should show: 0 vulnerabilities
  ```

- [ ] **Package-lock.json Is Committed** - Ensures consistent builds

---

## 📊 MONITORING

### Pre-Deployment Metrics
- [ ] **Lighthouse Score Run** - Aim for 90+ in all categories
  ```bash
  # Run Lighthouse in Chrome DevTools or
  npx lighthouse https://your-staging-url.com --view
  
  # Target scores:
  # - Performance: 90+
  # - Accessibility: 90+
  # - Best Practices: 90+
  # - SEO: 90+
  ```

- [ ] **Core Web Vitals Meet Thresholds**
  - LCP (Largest Contentful Paint): < 2.5s
  - FID (First Input Delay): < 100ms
  - CLS (Cumulative Layout Shift): < 0.1

- [ ] **Page Size Analyzed**
  ```bash
  # Check bundle size
  npm run build
  
  # Look for:
  # ⚠️  Any page > 200kb First Load JS
  ```

### Post-Deployment Setup
- [ ] **Error Tracking Configured**
  ```typescript
  // Example with Sentry
  import * as Sentry from '@sentry/nextjs';
  
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NEXT_PUBLIC_ENV,
  });
  ```

- [ ] **Performance Monitoring Active**
  - [ ] Vercel Analytics enabled
  - [ ] Real User Monitoring (RUM) configured

- [ ] **Uptime Monitoring Configured**
  - [ ] UptimeRobot or similar
  - [ ] Alert email/SMS configured

---

## 🚀 DEPLOYMENT

### Pre-Deployment
- [ ] **Staging Environment Tested** - Exact production configuration
- [ ] **Database Migrations Run** - If any schema changes
- [ ] **Backup Created** - Current production state saved
- [ ] **Rollback Plan Documented** - How to revert if issues

### Deployment Checklist
- [ ] **Deploy During Low-Traffic Window** - Minimize user impact
- [ ] **Monitor Error Rates** - First 30 minutes after deploy
- [ ] **Check Key User Flows** - Login, signup, checkout, etc.
- [ ] **Verify Analytics Working** - Events being tracked

### Post-Deployment
- [ ] **Smoke Tests Pass**
  - [ ] Homepage loads
  - [ ] Login works
  - [ ] Protected routes work
  - [ ] Forms submit successfully

- [ ] **No Console Errors** - Check browser console on key pages

- [ ] **Performance Metrics Normal**
  - [ ] Page load times < 3s
  - [ ] API response times < 1s

---

## ✅ SIGN-OFF CHECKLIST

**Before marking deployment as complete, verify**:

### Security ✅
- [ ] No service role keys exposed
- [ ] All routes properly protected
- [ ] No hardcoded secrets
- [ ] All inputs validated and sanitized

### Performance ✅
- [ ] Images optimized
- [ ] Bundle size under limits
- [ ] Pagination implemented
- [ ] Heavy components lazy-loaded

### User Experience ✅
- [ ] All loading states working
- [ ] Error handling comprehensive
- [ ] Accessibility requirements met
- [ ] Mobile responsive

### Architecture ✅
- [ ] Service layer used consistently
- [ ] No direct Supabase calls in components
- [ ] Server Components used where possible
- [ ] No `any` types

### Testing ✅
- [ ] All tests passing
- [ ] Critical flows manually tested
- [ ] Tested on multiple browsers/devices
- [ ] Lighthouse score 90+

### Configuration ✅
- [ ] Production env vars set
- [ ] Security headers configured
- [ ] Monitoring/analytics active
- [ ] No security vulnerabilities

---

## 🔥 COMMON MISTAKES TO AVOID

### Last-Minute Anti-Patterns
- ❌ "It works on my machine" - Always test production build
- ❌ Deploying on Friday afternoon - Deploy early in week
- ❌ Skipping staging - Always test in environment identical to production
- ❌ Ignoring bundle size - Check every deploy
- ❌ No rollback plan - Always have a way to revert
- ❌ Deploying during peak hours - Use low-traffic windows
- ❌ Not monitoring after deploy - Watch for 30+ minutes
- ❌ Ignoring Lighthouse warnings - They indicate real issues

---

## 📝 DEPLOYMENT SIGN-OFF

**I certify that**:
- [ ] All items in this checklist are completed
- [ ] All tests pass in production build
- [ ] Staging environment matches production
- [ ] Rollback plan is documented
- [ ] Monitoring is configured
- [ ] Team is notified of deployment

**Deployed By**: _______________
**Date**: _______________
**Deployment Tag/Version**: _______________
**Rollback Commit**: _______________

---

## 🆘 IF SOMETHING GOES WRONG

### Immediate Actions
1. **Check error tracking dashboard** - See what's breaking
2. **Check analytics** - Are users affected?
3. **Rollback if critical** - Use documented rollback plan
4. **Communicate** - Notify team/users if user-facing

### Rollback Process
```bash
# Vercel
vercel rollback <deployment-url>

# Or redeploy previous commit
git revert HEAD
git push origin main
```

### Post-Incident
- [ ] Document what went wrong
- [ ] Update checklist to prevent recurrence
- [ ] Add tests for the issue
- [ ] Review monitoring alerts

---

**Remember**: It's better to delay deployment than to deploy broken code. Production incidents are expensive in both money and trust.