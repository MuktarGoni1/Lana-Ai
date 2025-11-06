{
  "name": "lana-ai",
  "version": "0.1.0",
  "private": True,
  "type": "module",
  "scripts": {
    "build": "next build",
    "dev": "next dev -p 3001",
    "dev:network": "next dev -p 3001 -H 192.168.105.168",
    "lint": "next lint",
    "start": "next start",
    "test": "jest --config=jest.config.cjs",
    "test:watch": "jest --config=jest.config.cjs --watch"
  },
  "dependencies": {
    "@hookform/resolvers": "^3.9.1",
    "@radix-ui/react-accordion": "^1.2.2",
    "@radix-ui/react-alert-dialog": "^1.1.4",
    "@radix-ui/react-aspect-ratio": "^1.1.1",
    "@radix-ui/react-avatar": "^1.1.2",
    "@radix-ui/react-checkbox": "^1.1.3",
    "@radix-ui/react-collapsible": "^1.1.2",
    "@radix-ui/react-context-menu": "^2.2.4",
    "@radix-ui/react-dialog": "^1.1.4",
    "@radix-ui/react-dropdown-menu": "^2.1.4",
    "@radix-ui/react-hover-card": "^1.1.4",
    "@radix-ui/react-label": "^2.1.1",
    "@radix-ui/react-menubar": "^1.1.4",
    "@radix-ui/react-navigation-menu": "^1.2.3",
    "@radix-ui/react-popover": "^1.1.4",
    "@radix-ui/react-progress": "^1.1.1",
    "@radix-ui/react-radio-group": "^1.2.2",
    "@radix-ui/react-scroll-area": "^1.2.2",
    "@radix-ui/react-select": "^2.1.4",
    "@radix-ui/react-separator": "^1.1.1",
    "@radix-ui/react-slider": "^1.2.2",
    "@radix-ui/react-slot": "^1.1.1",
    "@radix-ui/react-switch": "^1.1.2",
    "@radix-ui/react-tabs": "^1.1.2",
    "@radix-ui/react-toast": "^1.2.4",
    "@radix-ui/react-toggle": "^1.1.1",
    "@radix-ui/react-toggle-group": "^1.1.1",
    "@radix-ui/react-tooltip": "^1.1.6",
    "@supabase/ssr": "^0.7.0",
    "@supabase/supabase-js": "^2.76.1",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "cmdk": "^1.0.4",
    "date-fns": "^4.1.0",
    "embla-carousel-react": "^8.5.1",
    "framer-motion": "^11.11.17",
    "geist": "^1.3.1",
    "input-otp": "^1.4.1",
    "isomorphic-dompurify": "^2.19.0",
    "lucide-react": "^0.454.0",
    "next": "^14.2.4",
    "next-themes": "^0.4.4",
    "react": "^18.3.1",
    "react-day-picker": "^9.8.0",
    "react-dom": "^18.3.1",
    "react-error-boundary": "^6.0.0",
    "react-hook-form": "^7.54.1",
    "react-resizable-panels": "^2.1.7",
    "recharts": "^2.15.0",
    "sonner": "^1.7.1",
    "tailwind-merge": "^2.5.5",
    "tailwindcss-animate": "^1.0.7",
    "vaul": "^0.9.6",
    "zod": "^3.24.1"
  },
  "devDependencies": {
    "@eslint/js": "^9.3.0",
    "@swc/jest": "^0.2.39",
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.1.0",
    "@testing-library/user-event": "^14.5.2",
    "@types/jest": "^29.5.14",
    "@types/node": "^20.14.9",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "autoprefixer": "^10.4.19",
    "eslint": "^8.57.0",
    "eslint-config-next": "14.2.4",
    "globals": "^15.6.0",
    "identity-obj-proxy": "^3.0.0",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.4",
    "typescript": "^5.5.2",
    "typescript-eslint": "^7.14.1"
  }
}
"""
Application settings module.
Provides configuration settings for the application.
"""

from app.config import (
    API_DEBUG,
    API_SECRET_KEY,
    GROQ_API_KEY,
    GOOGLE_API_KEY,
    DATABASE_URL,
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_ANON_KEY,
    SUPABASE_KEY,
    TTS_API_KEY,
    MATH_SOLVER_API_KEY,
    CORS_ORIGINS,
    RATE_LIMIT_PER_MINUTE
)

class Settings:
    """Settings class to hold application configuration."""
    
    def __init__(self):
        self.api_debug = API_DEBUG
        self.api_secret_key = API_SECRET_KEY
        self.groq_api_key = GROQ_API_KEY
        self.google_api_key = GOOGLE_API_KEY
        self.database_url = DATABASE_URL
        self.supabase_url = SUPABASE_URL
        self.supabase_service_role_key = SUPABASE_SERVICE_ROLE_KEY
        self.supabase_anon_key = SUPABASE_ANON_KEY
        self.supabase_key = SUPABASE_KEY
        self.tts_api_key = TTS_API_KEY
        self.math_solver_api_key = MATH_SOLVER_API_KEY
        self.cors_origins = CORS_ORIGINS
        self.rate_limit_per_minute = RATE_LIMIT_PER_MINUTE

def load_settings():
    """Load and return application settings."""
    return Settings()
