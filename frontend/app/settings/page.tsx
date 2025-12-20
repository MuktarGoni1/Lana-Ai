"use client"

import { useCallback, useEffect, useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { Moon, LogOut, Loader2, Shield, Bell, User as UserIcon } from "lucide-react"

import { supabase } from "@/lib/db"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { useRobustAuth } from "@/contexts/RobustAuthContext"

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------
interface GuardianPreferences {
  weekly_report: boolean
  monthly_report: boolean
}

interface SettingsState {
  role: "child" | "guardian" | null
  parentEmail: string
  preferences: GuardianPreferences
  isLoading: boolean
  error: string | null
}

// -----------------------------------------------------------------------------
// Custom Hook: useGuardianPreferences
// -----------------------------------------------------------------------------
function useGuardianPreferences(email: string | null | undefined, role: string | null): {
  preferences: GuardianPreferences;
  isLoading: boolean;
  error: string | null;
  updatePreference: <K extends keyof GuardianPreferences>(key: K, value: GuardianPreferences[K]) => Promise<boolean>;
  refetch: () => Promise<void>;
} {
  const [preferences, setPreferences] = useState<GuardianPreferences>({
    weekly_report: true,
    monthly_report: false,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Fetch preferences
  const fetchPreferences = useCallback(async () => {
    if (!email || role !== "guardian") return

    setIsLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from("guardians")
        .select("weekly_report, monthly_report")
        .eq("email", email)
        .single()

      if (fetchError) {
        // Handle "no rows" gracefully - user might not have preferences yet
        if (fetchError.code === "PGRST116") {
          // No preferences found, use defaults
          return
        }
        throw fetchError
      }

      if (data) {
        setPreferences({
          weekly_report: data.weekly_report ?? true,
          monthly_report: data.monthly_report ?? false,
        })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load preferences"
      setError(message)
      console.error("[Settings] Failed to load preferences:", err)
    } finally {
      setIsLoading(false)
    }
  }, [email, role])

  // Update a single preference
  const updatePreference = useCallback(
    async <K extends keyof GuardianPreferences>(
      key: K,
      value: GuardianPreferences[K]
    ): Promise<boolean> => {
      if (!email) return false

      try {
        const { error: updateError } = await supabase
          .from("guardians")
          .upsert(
            { 
              email, 
              [key]: value,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "email" }
          )

        if (updateError) throw updateError

        setPreferences((prev) => ({ ...prev, [key]: value }))
        
        toast({
          title: "Settings updated",
          description: `${key.replace("_", " ")} preference saved.`,
        })
        
        return true
      } catch (err) {
        const message = err instanceof Error ? err.message : "Update failed"
        toast({
          title: "Update failed",
          description: message,
          variant: "destructive",
        })
        return false
      }
    },
    [email, toast]
  )

  // Load preferences on mount
  useEffect(() => {
    fetchPreferences()
  }, [fetchPreferences])

  return {
    preferences,
    isLoading,
    error,
    updatePreference,
    refetch: fetchPreferences,
  }
}

// -----------------------------------------------------------------------------
// Custom Hook: useSettings (combines auth + preferences)
// -----------------------------------------------------------------------------
function useSettings(): {
  user: import("@supabase/supabase-js").User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  role: "child" | "guardian";
  parentEmail: string;
  preferences: GuardianPreferences;
  updatePreference: <K extends keyof GuardianPreferences>(key: K, value: GuardianPreferences[K]) => Promise<boolean>;
  handleSignOut: () => Promise<void>;
} {
  const { user, isAuthenticated, isLoading: authLoading, signOut } = useRobustAuth()
  const router = useRouter()
  
  const role = useMemo(() => {
    return (user?.user_metadata?.role as "child" | "guardian") ?? "child"
  }, [user?.user_metadata?.role])

  const parentEmail = useMemo(() => {
    return user?.user_metadata?.guardian_email ?? ""
  }, [user?.user_metadata?.guardian_email])

  const {
    preferences,
    isLoading: prefsLoading,
    updatePreference,
  } = useGuardianPreferences(user?.email, role)

  // Handle sign out with proper cleanup
  const handleSignOut = useCallback(async () => {
    try {
      await signOut()
      router.push("/login")
    } catch (error) {
      console.error("[Settings] Sign out failed:", error)
      // Force redirect even on error - user wants to leave
      router.push("/login")
    }
  }, [signOut, router])

  return {
    user,
    isAuthenticated,
    isLoading: authLoading || prefsLoading,
    role,
    parentEmail,
    preferences,
    updatePreference,
    handleSignOut,
  }
}

// -----------------------------------------------------------------------------
// Sub-components
// -----------------------------------------------------------------------------
function SettingsSkeleton() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center px-6 py-10">
      <div className="w-full max-w-2xl space-y-8">
        <Skeleton className="h-10 w-48" />
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-24" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-16 w-full" />
          </CardContent>
        </Card>
        
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  )
}

interface SettingRowProps {
  label: string
  description?: string
  checked: boolean
  disabled?: boolean
  loading?: boolean
  onCheckedChange?: (checked: boolean) => void
  hint?: string
}

function SettingRow({
  label,
  description,
  checked,
  disabled = false,
  loading = false,
  onCheckedChange,
  hint,
}: SettingRowProps) {
  return (
    <div 
      className={`
        flex items-center justify-between p-4 rounded-xl 
        bg-muted/50 border border-border
        ${disabled ? "opacity-60" : ""}
      `}
    >
      <div className="flex-1">
        <Label className="text-sm font-medium">{label}</Label>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        <Switch
          checked={checked}
          disabled={disabled || loading}
          onCheckedChange={onCheckedChange}
          aria-label={label}
        />
        {hint && (
          <span className="text-xs text-muted-foreground ml-2">{hint}</span>
        )}
      </div>
    </div>
  )
}

// -----------------------------------------------------------------------------
// Main Component
// -----------------------------------------------------------------------------
function SettingsContent() {
  const {
    isLoading,
    isAuthenticated,
    role,
    parentEmail,
    preferences,
    updatePreference,
    handleSignOut,
    user,
  } = useSettings()

  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [signingOut, setSigningOut] = useState(false)
  const [updatingPref, setUpdatingPref] = useState<string | null>(null)
  const router = useRouter()

  // Handle hydration for theme
  useEffect(() => {
    setMounted(true)
  }, [])

  // Redirect if not authenticated (after loading completes)
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isLoading, isAuthenticated, router])

  // Handle preference toggle with loading state
  const handlePreferenceToggle = useCallback(
    async (key: keyof GuardianPreferences, currentValue: boolean) => {
      setUpdatingPref(key)
      try {
        await updatePreference(key, !currentValue)
      } finally {
        setUpdatingPref(null)
      }
    },
    [updatePreference]
  )

  // Handle sign out with loading state
  const onSignOut = useCallback(async () => {
    setSigningOut(true)
    await handleSignOut()
    // No need to setSigningOut(false) - we're navigating away
  }, [handleSignOut])

  // Show skeleton while loading
  if (isLoading || !isAuthenticated) {
    return <SettingsSkeleton />
  }

  const isDark = mounted ? theme === "dark" : false
  const isGuardian = role === "guardian"

  // Sanitize email for display
  const displayEmail = parentEmail 
    ? parentEmail.replace(/[<>]/g, "") 
    : null

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center px-4 sm:px-6 py-10">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account preferences
          </p>
        </div>

        {/* Appearance Section */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Moon className="w-5 h-5" />
              Appearance
            </CardTitle>
            <CardDescription>
              Customize how the app looks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SettingRow
              label="Dark mode"
              description="Use dark theme across the app"
              checked={isDark}
              disabled={!mounted}
              onCheckedChange={(checked) => {
                startTransition(() => {
                  setTheme(checked ? "dark" : "light")
                })
              }}
            />
          </CardContent>
        </Card>

        {/* Reports Section */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bell className="w-5 h-5" />
              Reports
            </CardTitle>
            <CardDescription>
              {isGuardian 
                ? "Configure learning progress reports" 
                : "Report settings are managed by your guardian"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <SettingRow
              label="Weekly report"
              description="Receive a summary every week"
              checked={preferences.weekly_report}
              disabled={!isGuardian}
              loading={updatingPref === "weekly_report"}
              onCheckedChange={
                isGuardian 
                  ? () => handlePreferenceToggle("weekly_report", preferences.weekly_report)
                  : undefined
              }
              hint={!isGuardian ? "Guardian only" : undefined}
            />

            <SettingRow
              label="Monthly report"
              description="Receive a detailed monthly summary"
              checked={preferences.monthly_report}
              disabled={!isGuardian}
              loading={updatingPref === "monthly_report"}
              onCheckedChange={
                isGuardian
                  ? () => handlePreferenceToggle("monthly_report", preferences.monthly_report)
                  : undefined
              }
              hint={!isGuardian ? "Guardian only" : undefined}
            />

            {/* Guardian Email Display */}
            <div className="p-4 rounded-xl bg-muted/50 border border-border">
              <div className="flex items-center gap-2 mb-1">
                <UserIcon className="w-4 h-4 text-muted-foreground" />
                <Label className="text-sm font-medium text-muted-foreground">
                  Guardian Email
                </Label>
              </div>
              <p className="text-sm font-mono">
                {displayEmail || (
                  <span className="text-muted-foreground italic">
                    Not linked
                  </span>
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Guardian Controls */}
        {isGuardian && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="w-5 h-5" />
                Guardian Controls
              </CardTitle>
              <CardDescription>
                Manage parental controls and restrictions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push("/settings/parental-controls")}
              >
                Manage content restrictions
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push("/settings/linked-accounts")}
              >
                View linked child accounts
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Account Section */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Account</CardTitle>
            <CardDescription>
              {user?.email}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              className="w-full"
              onClick={onSignOut}
              disabled={signingOut}
            >
              {signingOut ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing out...
                </>
              ) : (
                <>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign out
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Version Info */}
        <p className="text-center text-xs text-muted-foreground">
          Version 1.0.0
        </p>
      </div>
    </div>
  )
}

// -----------------------------------------------------------------------------
// Page Export with Error Boundary
// -----------------------------------------------------------------------------
export default function SettingsPage() {
  return <SettingsContent />
}