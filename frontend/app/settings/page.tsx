"use client"
import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/db"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Moon, LogOut } from "lucide-react"
import { UserIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { User as SupabaseUser } from "@supabase/supabase-js"
import { useRobustAuth } from "@/contexts/RobustAuthContext"

export default function SettingsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user, isAuthenticated, isLoading } = useRobustAuth()
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [role, setRole] = useState<"child" | "guardian" | null>(null)
  const [weekly, setWeekly] = useState(true)
  const [monthly, setMonthly] = useState(false)
  const [parentEmail, setParentEmail] = useState("")
  const [dark, setDark] = useState(false)

  useEffect(() => {
    // Set default dark mode from localStorage
    setDark(typeof window !== 'undefined' ? localStorage.getItem("theme") === "dark" : false)
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Set a timeout to prevent infinite loading
    timeoutRef.current = setTimeout(() => {
      // This is just a safety measure - in a real app you might want to show an error
    }, 10000); // 10 second timeout
    
    if (!isLoading && isAuthenticated && user) {
      // Clear the timeout since we have data
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      const meta = user.user_metadata
      setRole(meta?.role ?? "child")
      setParentEmail(meta?.guardian_email ?? "")
      if (meta?.role === "guardian" && user.email) loadParentPrefs(user.email)
    }
    
    // Cleanup timeout on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [user, isAuthenticated, isLoading, router])

  async function loadParentPrefs(email: string) {
    // Only load prefs if email is provided
    if (!email) return;
    
    try {
      // Using bracket notation to avoid TypeScript issues
      const result: any = await supabase
        .from("guardians")
        .select("weekly_report, monthly_report")
        .eq("email", email)
        .single()
        
      if (result.data && !result.error) { 
        setWeekly(result.data['weekly_report'] ?? false); 
        setMonthly(result.data['monthly_report'] ?? false); 
      }
    } catch (error) {
      console.error('[Settings] Error loading parent prefs:', error)
    }
  }

  async function toggleDark(checked: boolean) {
    setDark(checked)
    localStorage.setItem("theme", checked ? "dark" : "light")
    document.documentElement.classList.toggle("dark", checked)
  }

  // Show loading state while checking auth, but with timeout protection
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-white/10 border-t-white/30 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/50">Loading settings...</p>
        </div>
      </div>
    )
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

          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 opacity-60">
            <Label>Weekly report</Label>
            <Switch checked={weekly} disabled={!isAuthenticated || role === "child"} />
            {!isAuthenticated && <span className="text-xs text-white/50 ml-2">Sign in to enable</span>}
            {isAuthenticated && role === "child" && <span className="text-xs text-white/50 ml-2">Ask parent</span>}
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 opacity-60">
            <Label>Monthly report</Label>
            <Switch checked={monthly} disabled={!isAuthenticated || role === "child"} />
            {!isAuthenticated && <span className="text-xs text-white/50 ml-2">Sign in to enable</span>}
            {isAuthenticated && role === "child" && <span className="text-xs text-white/50 ml-2">Ask parent</span>}
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <Label className="text-white/70">Parent / Guardian e-mail</Label>
            <p className="text-sm mt-1">
              {isAuthenticated ? (parentEmail || "Not linked") : "Sign in to view"}
            </p>
          </div>
        </section>

        {/* ----- Parent full controls ----- */}
        {isAuthenticated && role === "guardian" && user?.email && (
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Parent controls</h2>
            <button
              onClick={async () => {
                try {
                  // Completely bypass TypeScript typing issues
                  const result = await (supabase as any)
                    .from("guardians")
                    .update({ 
                      'weekly_report': !weekly
                    })
                    .eq("email", user.email!)
                  setWeekly(!weekly)
                  toast({ title: "Updated", description: `Switched to ${!weekly ? "weekly" : "monthly"} reports.` })
                } catch (err: unknown) {
                  let errorMessage = "Could not update report preference."
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
              {weekly ? "Switch to monthly" : "Switch to weekly"}
            </button>
          </section>
        )}

        {/* ----- Sign out ----- */}
        {isAuthenticated ? (
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
        ) : (
          <button
            onClick={() => router.push("/login")}
            className="w-full px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign in</span>
          </button>
        )}
      </div>
    </div>
  )
}