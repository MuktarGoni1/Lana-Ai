"use client";

import React, { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, Loader2, Mail, User, Chrome } from "lucide-react";
import { formatErrorForToast } from "@/lib/utils/error-messages";

// --- Reusable Components ---
const FormWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-black flex items-center justify-center p-4">
    <div className="w-full max-w-md">
      {children}
    </div>
  </div>
);

const FormCard = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-white/[0.02] backdrop-blur-sm rounded-2xl border border-white/[0.05] p-8 space-y-6">
    {children}
  </div>
);

const StyledInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    suppressHydrationWarning
    className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.05] 
             text-white placeholder-white/20 text-sm
             focus:outline-none focus:border-white/10 focus:bg-white/[0.05]
             transition-all duration-200"
  />
);

const StyledSelect = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select
    {...props}
    suppressHydrationWarning
    className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.05] 
             text-white text-sm appearance-none
             focus:outline-none focus:border-white/10 focus:bg-white/[0.05]
             transition-all duration-200
             [&>option]:bg-black [&>option]:text-white"
  />
);

const PrimaryButton = ({ 
  loading, 
  children, 
  ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) => (
  <button
    {...props}
    suppressHydrationWarning
    disabled={loading || props.disabled}
    className="w-full px-6 py-3 rounded-xl bg-white text-black font-medium text-sm
             hover:bg-white/90 transition-all duration-200
             disabled:opacity-50 disabled:cursor-not-allowed
             flex items-center justify-center gap-2"
  >
    {loading ? (
      <>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading...</span>
      </>
    ) : (
      <>
        {children}
        <ArrowRight className="h-4 w-4" />
      </>
    )}
  </button>
);

const SecondaryButton = ({ 
  loading, 
  children, 
  ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) => (
  <button
    {...props}
    suppressHydrationWarning
    disabled={loading || props.disabled}
    className="w-full px-6 py-3 rounded-xl bg-white/[0.05] border border-white/[0.05] 
             text-white font-medium text-sm
             hover:bg-white/[0.1] transition-all duration-200
             disabled:opacity-50 disabled:cursor-not-allowed
             flex items-center justify-center gap-3"
  >
    {loading ? (
      <>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading...</span>
      </>
    ) : (
      <>
        {children}
      </>
    )}
  </button>
);

const BackButton = ({ onClick }: { onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    suppressHydrationWarning
    className="flex items-center gap-2 text-sm text-white/30 hover:text-white/50 
             transition-colors duration-200 mx-auto"
  >
    <ArrowLeft className="h-4 w-4" />
    Back to options
  </button>
);

const FormHeader = ({ 
  icon: Icon, 
  title, 
  subtitle 
}: { 
  icon: typeof Mail | typeof User;
  title: string;
  subtitle: string;
}) => (
  <div className="text-center space-y-3">
    <div className="w-14 h-14 rounded-xl bg-white/[0.05] flex items-center justify-center mx-auto">
      <Icon className="w-7 h-7 text-white/70" />
    </div>
    <div className="space-y-1">
      <h1 className="text-2xl font-semibold text-white">{title}</h1>
      <p className="text-white/40 text-sm">{subtitle}</p>
    </div>
  </div>
);

// --- Parent Registration Flow ---
function ParentFlow() {
  const [email, setEmail] = useState("");
  const { loginWithEmail, loginWithGoogle, isLoading } = useUnifiedAuth();
  const { toast } = useToast();
  const router = useRouter();

  const handleParentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast({ 
        title: "Email required", 
        description: "Please enter your email address.", 
        variant: "destructive" 
      });
      return;
    }
    
    try {
      const result = await loginWithEmail(email.trim());
      
      if (result.success) {
        // Navigate to unified magic link confirmation page
        try {
          router.replace(`/register/magic-link-sent?email=${encodeURIComponent(email.trim())}`)
        } catch (navErr) {
          console.warn('[ParentFlow] navigation error, falling back:', navErr)
          window.location.assign(`/register/magic-link-sent?email=${encodeURIComponent(email.trim())}`)
        }
      } else {
        const errorDetails = formatErrorForToast(result.error || "Failed to send magic link");
        toast({ 
          title: errorDetails.title, 
          description: errorDetails.description, 
          variant: errorDetails.variant || "destructive" 
        });
      }
    } catch (error: unknown) {
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to send magic link. Please try again.", 
        variant: "destructive" 
      });
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await loginWithGoogle();
      
      if (!result.success) {
        toast({ 
          title: "Error", 
          description: result.error || "Failed to initiate Google login. Please try again.", 
          variant: "destructive" 
        });
      }
      // For Google login, the redirect happens automatically
    } catch (error: unknown) {
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to initiate Google login. Please try again.", 
        variant: "destructive" 
      });
    }
  };

  return (
    <FormWrapper>
      <FormCard>
        <form onSubmit={handleParentSubmit} suppressHydrationWarning className="space-y-6">
          <FormHeader 
            icon={Mail} 
            title="Parent Login" 
            subtitle="Access your child's learning journey"
          />
          
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs text-white/40 mb-2">
                Email address
              </label>
              <StyledInput 
                id="email" 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="parent@example.com" 
                required 
              />
            </div>
            
            <PrimaryButton type="submit" loading={isLoading}>
              Login with Email
            </PrimaryButton>
            
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-black px-2 text-white/30">OR</span>
              </div>
            </div>
            
            <SecondaryButton onClick={handleGoogleLogin} loading={isLoading}>
              <Chrome className="h-4 w-4" />
              Login with Google
            </SecondaryButton>
            
            <p className="text-xs text-white/20 text-center">
              No password required • Secure authentication
            </p>
          </div>
          
          <BackButton onClick={() => router.push("/register")} />
        </form>
      </FormCard>
    </FormWrapper>
  );
}

// --- Child Registration Flow ---
function ChildFlow() {
  const router = useRouter();
  const { toast } = useToast();
  const { loginWithEmail, loginWithGoogle, isLoading } = useUnifiedAuth();
  const [email, setEmail] = useState("");

  const handleChildSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data
    if (!email.trim()) {
      toast({ title: "Email required", description: "Please enter your email address.", variant: "destructive" });
      return;
    }
    
    try {
      const result = await loginWithEmail(email.trim());
      
      if (result.success) {
        toast({ 
          title: "Success", 
          description: "Magic link sent to your email!" 
        });
        // Navigate to unified magic link confirmation page
        try {
          router.replace(`/register/magic-link-sent?email=${encodeURIComponent(email.trim())}`)
        } catch (navErr) {
          console.warn('[ChildFlow] navigation error, falling back:', navErr)
          window.location.assign(`/register/magic-link-sent?email=${encodeURIComponent(email.trim())}`)
        }
      } else {
        const errorDetails = formatErrorForToast(result.error || "Failed to send magic link");
        toast({ 
          title: errorDetails.title, 
          description: errorDetails.description, 
          variant: errorDetails.variant || "destructive" 
        });
      }
    } catch (error: unknown) {
      const errorDetails = formatErrorForToast(error);
      toast({ 
        title: errorDetails.title, 
        description: errorDetails.description, 
        variant: errorDetails.variant || "destructive" 
      });
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await loginWithGoogle();
      
      if (!result.success) {
        toast({ 
          title: "Error", 
          description: result.error || "Failed to initiate Google login. Please try again.", 
          variant: "destructive" 
        });
      }
      // For Google login, the redirect happens automatically
    } catch (error: unknown) {
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to initiate Google login. Please try again.", 
        variant: "destructive" 
      });
    }
  };

  return (
    <FormWrapper>
      <FormCard>
        <form onSubmit={handleChildSubmit} suppressHydrationWarning className="space-y-6">
          <FormHeader 
            icon={User} 
            title="Child Login" 
            subtitle="Continue your learning journey"
          />
          
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs text-white/40 mb-2">
                Email address
              </label>
              <StyledInput 
                id="email" 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="child@example.com" 
                required 
              />
            </div>
            
            <PrimaryButton type="submit" loading={isLoading}>
              Login with Email
            </PrimaryButton>
            
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-black px-2 text-white/30">OR</span>
              </div>
            </div>
            
            <SecondaryButton onClick={handleGoogleLogin} loading={isLoading}>
              <Chrome className="h-4 w-4" />
              Login with Google
            </SecondaryButton>
            
            <p className="text-xs text-white/20 text-center">
              No password required • Secure authentication
            </p>
          </div>
          
          <BackButton onClick={() => router.push("/register")} />
        </form>
      </FormCard>
    </FormWrapper>
  );
}

// --- Main Login Flow ---
function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const flow = searchParams.get("flow");
  const { isAuthenticated, isLoading } = useUnifiedAuth();
  const { toast } = useToast();

  // Redirect authenticated users
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      // Check onboarding status
      // For now, we'll redirect to the last visited page or homepage
      let lastVisited = null;
      
      // Try to get from localStorage
      if (typeof window !== 'undefined') {
        lastVisited = localStorage.getItem('lana_last_visited');
      }
      
      // Redirect to last visited page if available and not an auth page, otherwise homepage
      const redirectPath = lastVisited && 
                           !lastVisited.startsWith('/login') && 
                           !lastVisited.startsWith('/register') && 
                           !lastVisited.startsWith('/auth') && 
                           lastVisited !== '/landing-page' ? 
                           lastVisited : '/homepage';
      
      router.push(redirectPath);
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-white/10 border-t-white/30 rounded-full animate-spin mx-auto" />
          <p className="text-white/30 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (flow === "parent") {
    return <ParentFlow />;
  }
  
  if (flow === "child") {
    return <ChildFlow />;
  }

  return (
    <FormWrapper>
      <FormCard>
        <div className="space-y-6">
          <div className="text-center space-y-3">
            <div className="w-14 h-14 rounded-xl bg-white/[0.05] flex items-center justify-center mx-auto">
              <Mail className="w-7 h-7 text-white/70" />
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold text-white">Welcome Back</h1>
              <p className="text-white/40 text-sm">Sign in to continue your learning journey</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <button
              onClick={() => router.push("/login?flow=parent")}
              className="w-full px-6 py-3 rounded-xl bg-white/[0.05] border border-white/[0.05] 
                       text-white font-medium text-sm
                       hover:bg-white/[0.1] transition-all duration-200
                       flex items-center justify-center gap-3"
            >
              <Mail className="h-4 w-4" />
              Sign in as Parent
            </button>
            
            <button
              onClick={() => router.push("/login?flow=child")}
              className="w-full px-6 py-3 rounded-xl bg-white/[0.05] border border-white/[0.05] 
                       text-white font-medium text-sm
                       hover:bg-white/[0.1] transition-all duration-200
                       flex items-center justify-center gap-3"
            >
              <User className="h-4 w-4" />
              Sign in as Child
            </button>
            
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-black px-2 text-white/30">OR</span>
              </div>
            </div>
            
            <button
              onClick={() => router.push("/register")}
              className="w-full px-6 py-3 rounded-xl bg-white text-black font-medium text-sm
                       hover:bg-white/90 transition-all duration-200"
            >
              Create Account
            </button>
          </div>
        </div>
      </FormCard>
    </FormWrapper>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-white/10 border-t-white/30 rounded-full animate-spin mx-auto" />
          <p className="text-white/30 text-sm">Loading...</p>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}