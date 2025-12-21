"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/db"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Moon, LogOut, UserIcon, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext"
import type { Database } from "@/types/supabase"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type UserRole = "child" | "guardian"

interface GuardianPrefs {
  weekly_report: boolean
  monthly_report: boolean
}

// ---------------------------------------------------------------------------
// Custom Hooks
// ---------------------------------------------------------------------------

/**
 * Safe theme hook that handles SSR and prevents flash
 */
function useTheme() {
  const [theme, setThemeState] = useState<"light" | "dark">("light")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Check localStorage and system preference
    const stored = localStorage.getItem("theme")
    if (stored === "dark" || stored === "light") {
      setThemeState(stored)
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setThemeState("dark")
    }
  }, [])

  const setTheme = useCallback((newTheme: "light" | "dark") => {
    setThemeState(newTheme)
    localStorage.setItem("theme", newTheme)
    document.documentElement.classList.toggle("dark", newTheme === "dark")
  }, [])

  return { theme, setTheme, mounted }
}

/**
 * Hook for loading guardian preferences from Supabase
 */
function useGuardianPrefs(email: string | null | undefined, role: UserRole | null) {
  const [prefs, setPrefs] = useState<GuardianPrefs>({
    weekly_report: true,
    monthly_report: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadPrefs = useCallback(async () => {
    if (!email || role !== "guardian") return

    setLoading(true)
    setError(null)

    try {
      const { data, error: queryError } = await supabase
        .from("guardians")
        .select("weekly_report, monthly_report")
        .eq("email", email)
        .single<{
          weekly_report: boolean;
          monthly_report: boolean;
        }>()

      if (queryError) {
        // PGRST116 = no rows found, not really an error for us
        if (queryError.code !== "PGRST116") {
          throw queryError
        }
      }

      if (data) {
        setPrefs({
          weekly_report: data.weekly_report ?? true,
          monthly_report: data.monthly_report ?? false,
        })
      }
    } catch (err) {
      console.error("[Settings] Failed to load guardian prefs:", err)
      setError("Failed to load preferences")
    } finally {
      setLoading(false)
    }
  }, [email, role])

  useEffect(() => {
    loadPrefs()
  }, [loadPrefs])

  const updatePrefs = useCallback(
    async (updates: Partial<Database['public']['Tables']['guardians']['Update']>): Promise<boolean> => {
      if (!email) return false

      setLoading(true)
      try {
        const sb: any = supabase;
        const { error: updateError } = await sb
          .from("guardians")
          .update(updates)
          .eq("email", email)

        if (updateError) throw updateError

        setPrefs((prev) => ({
          ...prev,
          weekly_report: updates.weekly_report ?? prev.weekly_report,
          monthly_report: updates.monthly_report ?? prev.monthly_report
        }))
        return true
      } catch (err) {
        console.error("[Settings] Failed to update guardian prefs:", err)
        setError("Failed to update preferences")
        return false
      } finally {
        setLoading(false)
      }
    },
    [email, supabase, setError, setLoading, setPrefs]
  )

  return { prefs, loading, error, updatePrefs, refetch: loadPrefs }
}

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

interface SettingCardProps {
  children: React.ReactNode
  disabled?: boolean
}

function SettingCard({ children, disabled }: SettingCardProps) {
  return (
    <div
      className={`
        flex items-center justify-between p-4 rounded-xl 
        bg-white/5 border border-white/10
        ${disabled ? "opacity-60" : ""}
      `}
    >
      {children}
    </div>
  )
}

interface SectionHeaderProps {
  icon: React.ReactNode
  title: string
}

function SectionHeader({ icon, title }: SectionHeaderProps) {
  return (
    <h2 className="text-xl font-semibold flex items-center gap-2">
      {icon}
      {title}
    </h2>
  )
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

export default function SettingsPage() {
  const router = useRouter()
  const { toast } = useToast()
  
  // ✅ Hook called at top level, unconditionally
  const { user, isAuthenticated, isLoading: authLoading } = useUnifiedAuth()
  const { theme, setTheme, mounted: themeMounted } = useTheme()
  
  // Derived state
  const role: UserRole | null = user?.user_metadata?.role ?? null
  const userEmail = user?.email ?? null
  const parentEmail = user?.user_metadata?.guardian_email ?? ""
  
  // Guardian preferences
  const {
    prefs: guardianPrefs,
    loading: prefsLoading,
    updatePrefs,
  } = useGuardianPrefs(userEmail, role)

  // Loading states
  const [signingOut, setSigningOut] = useState(false)
  const [updatingReport, setUpdatingReport] = useState(false)

  // -------------------------------------------------------------------------
  // Auth redirect (let AuthGuard handle this, but keep as fallback)
  // -------------------------------------------------------------------------
  useEffect(() => {
    // Only redirect after auth has finished loading
    if (!authLoading && !isAuthenticated) {
      router.replace("/login")
    }
  }, [authLoading, isAuthenticated, router])

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------
  const handleThemeToggle = useCallback(
    (checked: boolean) => {
      setTheme(checked ? "dark" : "light")
    },
    [setTheme]
  )

  const handleReportToggle = useCallback(async () => {
    if (!userEmail || role !== "guardian") return

    setUpdatingReport(true)
    const newWeekly = !guardianPrefs.weekly_report
    
    const success = await updatePrefs({ weekly_report: newWeekly })
    
    if (success) {
      toast({
        title: "Preferences updated",
        description: `Switched to ${newWeekly ? "weekly" : "monthly"} reports.`,
      })
    } else {
      toast({
        title: "Update failed",
        description: "Could not update report preference. Please try again.",
        variant: "destructive",
      })
    }
    
    setUpdatingReport(false)
  }, [userEmail, role, guardianPrefs.weekly_report, toast])

  const handleSignOut = useCallback(async () => {
    setSigningOut(true)
    
    try {
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        throw error
      }
      
      // Clear any local state/storage
      localStorage.removeItem("theme")
      
      // Navigate to login
      router.replace("/login")
    } catch (err) {
      console.error("[Settings] Sign out error:", err)
      toast({
        title: "Sign out failed",
        description: "Could not sign out. Please try again.",
        variant: "destructive",
      })
      setSigningOut(false)
    }
  }, [router, toast])

  // -------------------------------------------------------------------------
  // Loading State
  // -------------------------------------------------------------------------
  if (authLoading || !themeMounted) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-white/30" />
          <p className="text-white/50">Loading settings...</p>
        </div>
      </div>
    )
  }

  // -------------------------------------------------------------------------
  // Not Authenticated (fallback, AuthGuard should handle this)
  // -------------------------------------------------------------------------
  if (!isAuthenticated || !user) {
    return null // Router will redirect
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center px-6 py-10">
      <div className="w-full max-w-2xl space-y-8">
        <h1 className="text-3xl font-bold">Settings</h1>

        {/* ----- Appearance Section ----- */}
        <section className="space-y-4">
          <SectionHeader 
            icon={<Moon className="w-5 h-5" />} 
            title="Appearance" 
          />
          <SettingCard>
            <Label htmlFor="dark-mode">Dark mode</Label>
            <Switch
              id="dark-mode"
              checked={theme === "dark"}
              onCheckedChange={handleThemeToggle}
            />
          </SettingCard>
        </section>

        {/* ----- Reports Section ----- */}
        <section className="space-y-4">
          <SectionHeader 
            icon={<UserIcon className="w-5 h-5" />} 
            title="Reports" 
          />

          <SettingCard disabled={role === "child"}>
            <div className="flex items-center gap-2">
              <Label htmlFor="weekly-report">Weekly report</Label>
              {role === "child" && (
                <span className="text-xs text-white/50">(Ask parent)</span>
              )}
            </div>
            <Switch
              id="weekly-report"
              checked={guardianPrefs.weekly_report}
              disabled={role === "child" || prefsLoading}
            />
          </SettingCard>

          <SettingCard disabled={role === "child"}>
            <div className="flex items-center gap-2">
              <Label htmlFor="monthly-report">Monthly report</Label>
              {role === "child" && (
                <span className="text-xs text-white/50">(Ask parent)</span>
              )}
            </div>
            <Switch
              id="monthly-report"
              checked={guardianPrefs.monthly_report}
              disabled={role === "child" || prefsLoading}
            />
          </SettingCard>

          <SettingCard>
            <div>
              <Label className="text-white/70">Parent / Guardian email</Label>
              <p className="text-sm mt-1">
                {parentEmail || "Not linked"}
              </p>
            </div>
          </SettingCard>
        </section>

        {/* ----- Guardian Controls ----- */}
        {role === "guardian" && userEmail && (
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Parent Controls</h2>
            <button
              onClick={handleReportToggle}
              disabled={updatingReport || prefsLoading}
              className={`
                w-full px-4 py-3 rounded-xl 
                bg-white/10 hover:bg-white/20 
                border border-white/20 
                text-left transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center gap-2
              `}
            >
              {updatingReport && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>
                {guardianPrefs.weekly_report 
                  ? "Switch to monthly reports" 
                  : "Switch to weekly reports"}
              </span>
            </button>
          </section>
        )}

        {/* ----- Sign Out ----- */}
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className={`
            w-full px-4 py-3 rounded-xl 
            bg-white/10 hover:bg-white/20 
            border border-white/20 
            flex items-center justify-center gap-2
            transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          {signingOut ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <LogOut className="w-4 h-4" />
          )}
          <span>{signingOut ? "Signing out..." : "Sign out"}</span>
        </button>
      </div>
    </div>
  )
}