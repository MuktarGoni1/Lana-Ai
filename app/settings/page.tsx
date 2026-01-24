"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/db"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Moon, LogOut } from "lucide-react"
import { UserIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { User as SupabaseUser } from "@supabase/supabase-js"
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext"

// Use the unified auth context directly since it's available through the provider
function useSettingsAuth() {
  const unifiedAuth = useUnifiedAuth();
  
  // Return the auth state in the same format as before for compatibility
  return {
    user: unifiedAuth.user,
    isAuthenticated: unifiedAuth.isAuthenticated,
    isLoading: unifiedAuth.isLoading,
  };
}

export default function SettingsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const auth = useSettingsAuth()
  const [role, setRole] = useState<"child" | "guardian" | null>(null)
  const [weekly, setWeekly] = useState(true)
  const [monthly, setMonthly] = useState(false)
  const [parentEmail, setParentEmail] = useState("")
  const [dark, setDark] = useState(false)

  useEffect(() => {
    // Guard against unauthenticated access - but be more lenient to prevent redirect loops
    if (auth && !auth.isLoading) {
      if (!auth.isAuthenticated) {
        console.log('[SettingsPage] User not authenticated, redirecting to login');
        router.push("/login");
        return;
      }
      
      if (auth.user) {
        const meta = auth.user.user_metadata;
        // Ensure role is properly set based on user metadata
        const userRole = meta?.role;
        if (userRole && (userRole === "guardian" || userRole === "parent")) {
          setRole("guardian"); // Map both guardian and parent to guardian for settings
        } else if (userRole && userRole === "child") {
          setRole("child");
        } else {
          // Default to guardian if no role is set, assuming the user registered as a guardian
          setRole("guardian");
        }
        setParentEmail(meta?.guardian_email ?? "");
        setDark(localStorage.getItem("theme") === "dark");
        if ((userRole === "guardian" || meta?.role === "guardian") && auth.user.email) {
          loadParentPrefs(auth.user.email);
        }
      }
    }
  }, [auth, router]);

  async function loadParentPrefs(email: string) {
    // Only load prefs if email is provided
    if (!email) return;
    
    const { data, error } = await supabase
      .from("guardians")
      .select("weekly_report, monthly_report")
      .eq("email", email)
      .single()
      
    if (data && !error) { 
      setWeekly(data.weekly_report ?? false); 
      setMonthly(data.monthly_report ?? false); 
    }
  }

  async function toggleDark(checked: boolean) {
    setDark(checked)
    localStorage.setItem("theme", checked ? "dark" : "light")
    document.documentElement.classList.toggle("dark", checked)
  }

  // Show loading state while checking auth
  if (!auth || auth.isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-white/10 border-t-white/30 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/50">Loading settings...</p>
        </div>
      </div>
    );
  }

  // If authentication failed completely, redirect to login
  if (auth && !auth.isLoading && !auth.isAuthenticated) {
    console.log('[SettingsPage] Authentication failed, redirecting to login');
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center px-6 py-10">
      <div className="w-full max-w-2xl space-y-8">
        <h1 className="text-3xl font-bold">Settings</h1>

        {/* ----- Universal ----- */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2"><Moon className="w-5 h-5" />Appearance</h2>
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
            <Label>Dark mode</Label>
            <Switch checked={dark} onCheckedChange={toggleDark} />
          </div>
        </section>

        {/* ----- Reports (child = view-only) ----- */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2"><UserIcon className="w-5 h-5" />Reports</h2>

          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
            <Label>Weekly report</Label>
            <Switch checked={weekly} disabled={role === "child"} />
            {role === "child" && <span className="text-xs text-white/50 ml-2">Ask parent</span>}
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
            <Label>Monthly report</Label>
            <Switch checked={monthly} disabled={role === "child"} />
            {role === "child" && <span className="text-xs text-white/50 ml-2">Ask parent</span>}
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <Label className="text-white/70">Parent / Guardian e-mail</Label>
            <p className="text-sm mt-1">{parentEmail || "Not linked"}</p>
          </div>
        </section>

        {/* ----- Parent full controls ----- */}
        {role === "guardian" && auth.user?.email && (
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Parent controls</h2>
            <button
              onClick={async () => {
                try {
                  // Update both weekly and monthly reports
                  const newWeekly = !weekly;
                  const newMonthly = !monthly;
                  
                  const { error } = await supabase
                    .from("guardians")
                    .update({ 
                      weekly_report: newWeekly,
                      monthly_report: newMonthly
                    })
                    .eq("email", auth.user!.email!)
                  
                  if (error) throw error
                  
                  setWeekly(newWeekly)
                  setMonthly(newMonthly)
                  toast({ title: "Updated", description: `Report preferences updated.` })
                } catch (err: unknown) {
                  let errorMessage = "Could not update report preferences."
                  if (err instanceof Error) {
                    errorMessage = err.message
                  }
                  toast({
                    title: "Update failed",
                    description: errorMessage,
                    variant: "destructive",
                  })
                }
              }}
              className="w-full px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-left"
            >
              Update Report Preferences
            </button>
            
            {/* Child management section */}
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Children Management</h3>
              <button
                onClick={() => router.push("/children")}
                className="w-full px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-left"
              >
                Add or Manage Children
              </button>
            </div>
          </section>
        )}

        {/* ----- Sign out ----- */}
        <button
          onClick={async () => {
            try {
              await supabase.auth.signOut()
              router.push("/login")
            } catch (error) {
              console.error('[Settings] Logout error:', error)
              toast({
                title: "Logout failed",
                description: "Could not sign out. Please try again.",
                variant: "destructive",
              })
            }
          }}
          className="w-full px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  )
}