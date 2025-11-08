"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, CheckCircle, Loader2, Mail, User, Sparkles } from "lucide-react";

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
    className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.05] 
             text-white placeholder-white/20 text-sm
             focus:outline-none focus:border-white/10 focus:bg-white/[0.05]
             transition-all duration-200"
  />
);

const StyledSelect = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select
    {...props}
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

const BackButton = ({ onClick }: { onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
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

// --- Success State Component ---
const SuccessState = ({ email, onReset }: { email: string; onReset: () => void }) => (
  <FormWrapper>
    <FormCard>
      <div className="text-center space-y-6">
        <div className="w-14 h-14 rounded-xl bg-white/[0.05] flex items-center justify-center mx-auto">
          <CheckCircle className="w-7 h-7 text-white/70" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-white">
            Check your inbox
          </h1>
          <p className="text-white/40 text-sm">
            We've sent a magic link to
          </p>
          <p className="text-white/70 font-medium">
            {email}
          </p>
        </div>

        <div className="pt-4 space-y-3">
          <p className="text-xs text-white/30">
            Didn't receive it? Check your spam folder.
          </p>
          
          <button 
            onClick={onReset}
            className="text-sm text-white/30 hover:text-white/50 transition-colors duration-200"
          >
            Use a different email
          </button>
        </div>
      </div>
    </FormCard>
  </FormWrapper>
);

// --- Parent Registration Flow ---
function ParentFlow() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
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
    
    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { 
          data: { role: "guardian" },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });
      if (signInError) throw signInError;
      
      const { error: upsertError } = await supabase.from("guardians").upsert({
        email: email.trim(),
        weekly_report: true,
        monthly_report: false,
      }, { onConflict: 'email' });
      if (upsertError) {
        console.warn('[ParentFlow] Failed to create guardian record:', upsertError);
        // Continue as auth was successful
      }
      
      // Mark user as needing term plan onboarding
      localStorage.setItem('lana_first_time_term_plan', 'true');
      
      setSent(true);
    } catch (error: unknown) {
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to send magic link. Please try again.", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return <SuccessState email={email} onReset={() => { setSent(false); setEmail(""); }} />;
  }

  return (
    <FormWrapper>
      <FormCard>
        <form onSubmit={handleParentSubmit} className="space-y-6">
          <FormHeader 
            icon={Mail} 
            title="Parent Registration" 
            subtitle="Monitor your child's learning journey"
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
            
            <PrimaryButton type="submit" loading={loading}>
              Send Magic Link
            </PrimaryButton>
            
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
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ 
    childEmail: "", 
    guardianEmail: "", 
    nickname: "", 
    age: "" as number | "", 
    grade: "" 
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'age' ? (value === '' ? '' : Number(value)) : value 
    }));
  };

  const handleChildSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { nickname, age, grade, childEmail, guardianEmail } = formData;
    
    if (!childEmail || !guardianEmail || !nickname || !age || !grade) {
      toast({ 
        title: "Missing information", 
        description: "Please fill in all fields.", 
        variant: "destructive" 
      });
      return;
    }
    
    setLoading(true);
    try {
      const child_uid = crypto.randomUUID();
      const password = crypto.randomUUID();

      const { error: signUpError } = await supabase.auth.signUp({
        email: childEmail,
        password,
        options: { 
          data: { role: "child", nickname, age, grade, guardian_email: guardianEmail },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });
      if (signUpError) throw signUpError;
      
      const { error: insertError } = await supabase.from("users").insert({
        id: child_uid,
        email: childEmail,
        user_metadata: { 
          role: "child", 
          nickname, 
          age, 
          grade, 
          guardian_email: guardianEmail 
        },
      });
      if (insertError) {
        console.warn('[ChildFlow] Failed to create user record:', insertError);
        // Continue as auth was successful
      }
      
      localStorage.setItem('lana_sid', child_uid);
      
      // Mark user as needing term plan onboarding
      localStorage.setItem('lana_first_time_term_plan', 'true');
      
      router.push("/onboarding");
    } catch (error: unknown) {
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to create account. Please try again.", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormWrapper>
      <FormCard>
        <form onSubmit={handleChildSubmit} className="space-y-6">
          <FormHeader 
            icon={User} 
            title="Student Registration" 
            subtitle="Start your personalized learning journey"
          />
          
          <div className="space-y-3">
            <div>
              <label htmlFor="childEmail" className="block text-xs text-white/40 mb-2">
                Student email
              </label>
              <StyledInput 
                id="childEmail" 
                name="childEmail" 
                type="email" 
                value={formData.childEmail} 
                onChange={handleInputChange} 
                placeholder="student@example.com" 
                required 
              />
            </div>
            
            <div>
              <label htmlFor="guardianEmail" className="block text-xs text-white/40 mb-2">
                Parent email
              </label>
              <StyledInput 
                id="guardianEmail" 
                name="guardianEmail" 
                type="email" 
                value={formData.guardianEmail} 
                onChange={handleInputChange} 
                placeholder="parent@example.com" 
                required 
              />
            </div>
            
            <div>
              <label htmlFor="nickname" className="block text-xs text-white/40 mb-2">
                Nickname
              </label>
              <StyledInput 
                id="nickname" 
                name="nickname" 
                value={formData.nickname} 
                onChange={handleInputChange} 
                placeholder="How should we call you?" 
                required 
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="age" className="block text-xs text-white/40 mb-2">
                  Age
                </label>
                <StyledInput 
                  id="age" 
                  name="age" 
                  type="number" 
                  min="6" 
                  max="18" 
                  value={formData.age} 
                  onChange={handleInputChange} 
                  placeholder="14" 
                  required 
                />
              </div>
              
              <div>
                <label htmlFor="grade" className="block text-xs text-white/40 mb-2">
                  Grade
                </label>
                <StyledSelect 
                  id="grade" 
                  name="grade" 
                  value={formData.grade} 
                  onChange={handleInputChange} 
                  required
                >
                  <option value="" disabled>Select</option>
                  {[...Array(7)].map((_, i) => (
                    <option key={i+6} value={i+6}>Grade {i+6}</option>
                  ))}
                  <option value="college">College</option>
                </StyledSelect>
              </div>
            </div>
            
            <PrimaryButton type="submit" loading={loading}>
              Create Account
            </PrimaryButton>
          </div>
          
          <BackButton onClick={() => router.push("/register")} />
        </form>
      </FormCard>
    </FormWrapper>
  );
}

// --- Email Login Flow ---
function EmailLoginFlow() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    
    if (!trimmed) {
      toast({ 
        title: "Email required", 
        description: "Please enter your email address.", 
        variant: "destructive" 
      });
      return;
    }

    setLoading(true);
    try {
      // Check if user exists and send magic link
      const { error } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });
      
      if (error) throw error;
      setSent(true);
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send magic link. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return <SuccessState email={email} onReset={() => { setSent(false); setEmail(""); }} />;
  }

  return (
    <FormWrapper>
      <FormCard>
        <form onSubmit={handleSubmit} className="space-y-6">
          <FormHeader 
            icon={Mail} 
            title="Welcome back" 
            subtitle="Sign in to continue learning"
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
                placeholder="Enter your email"
                required
              />
            </div>
            
            <PrimaryButton type="submit" loading={loading}>
              Send Magic Link
            </PrimaryButton>
            
            <p className="text-xs text-white/20 text-center">
              No password required • Secure authentication
            </p>
          </div>

          <div className="pt-6 border-t border-white/[0.05]">
            <p className="text-sm text-white/30 text-center">
              New to Lana?{" "}
              <button 
                type="button"
                onClick={() => router.push("/register")}
                className="text-white/60 hover:text-white/80 transition-colors duration-200"
              >
                Create an account
              </button>
            </p>
          </div>
        </form>
      </FormCard>
    </FormWrapper>
  );
}

// --- Main Component ---
function RegisterFormContent() {
  const searchParams = useSearchParams();
  const role = searchParams.get("role");

  if (role === "parent") return <ParentFlow />;
  if (role === "child") return <ChildFlow />;
  return <EmailLoginFlow />;
}

// --- Loading State ---
const LoadingState = () => (
  <FormWrapper>
    <div className="flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-8 h-8 border-2 border-white/10 border-t-white/30 rounded-full animate-spin mx-auto" />
        <p className="text-white/30 text-sm">Loading...</p>
      </div>
    </div>
  </FormWrapper>
);

export default function RegisterForm() {
  return (
    <Suspense fallback={<LoadingState />}>
      <RegisterFormContent />
    </Suspense>
  );
}