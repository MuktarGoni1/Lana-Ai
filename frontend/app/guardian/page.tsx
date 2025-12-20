"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/db"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { User, BookOpen, Calendar, Mail, Copy, Check, Plus, Home, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Database } from "@/types/supabase"

// Define the type for the data we're selecting from guardians table
interface GuardianData {
  child_uid: string | null;
  weekly_report: boolean | null;
  monthly_report: boolean | null;
}

// Define the type for the data we're selecting from searches table
interface ChildSearch { 
  id: string;
  title: string;
  created_at: string | null;
}

interface Child {
  child_uid: string;
  weekly_report: boolean;
  monthly_report: boolean;
  email: string;
  searches: ChildSearch[];
}

// Define types for Supabase responses
type UsersRow = Database['public']['Tables']['users']['Row'];
type UpdateGuardian = Database['public']['Tables']['guardians']['Update'];

export default function GuardianDashboard() {
  const router = useRouter()
  const { toast } = useToast()
  const [children, setChildren] = useState<Child[]>([])
  const [parentEmail, setParentEmail] = useState("")
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  /* ---- auth ---- */
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return router.push("/login")
      const email = session.user.email
      setParentEmail(email ?? "")
      if (email) loadChildren(email)
    })
  }, [router])

  /* ---- data ---- */
  async function loadChildren(email: string) {
    try {
      setLoading(true)
      // Explicitly type the response
      const { data, error }: { data: GuardianData[] | null; error: any } = await supabase
        .from("guardians")
        .select("child_uid, weekly_report, monthly_report")
        .eq("email", email)
      
      if (error) {
        throw error
      }
      
      if (!data) {
        setChildren([])
        return
      }
      
      const childrenData: Child[] = []
      
      for (const g of data) {
        // Skip entries without child_uid
        if (!g.child_uid) {
          continue;
        }
        
        // Fetch child email - try to get it from auth metadata or use a fallback
        // Note: The 'users' table may not exist in the actual database schema
        let childEmail = "Anonymous child";
        try {
          const { data: userRow, error: userError }: { data: UsersRow | null; error: any } = await supabase
            .from("users")
            .select("email")
            .eq("id", g.child_uid)
            .single();
          
          if (!userError && userRow?.email) {
            childEmail = userRow.email;
          }
        } catch (userQueryError) {
          // If the users table doesn't exist or there's an error, that's okay
          console.debug('[GuardianDashboard] Could not fetch child email from users table:', userQueryError);
        }

        // Explicitly type the searches response
        const { data: searches, error: searchesError }: { data: ChildSearch[] | null; error: any } = await supabase
          .from("searches")
          .select("id,title,created_at")
          .eq("uid", g.child_uid)
          .order("created_at", { ascending: false })
          .limit(10)

        childrenData.push({
          child_uid: g.child_uid,
          weekly_report: g.weekly_report ?? false,
          monthly_report: g.monthly_report ?? false,
          email: childEmail,
          searches: searches ?? [],
        })
      }
      
      setChildren(childrenData)
    } catch (error) {
      console.error("Error loading children:", error)
      toast({
        title: "Error loading data",
        description: "Failed to load children information. Please try again.",
        variant: "destructive",
      })
      setChildren([])
    } finally {
      setLoading(false)
    }
  }

  async function toggleWeekly(child_uid: string, checked: boolean) {
    // Optimistic update with proper typing
    setChildren((prev: Child[]) => prev.map((k: Child) => 
      k.child_uid === child_uid ? { ...k, weekly_report: checked } : k
    ) as Child[])
    try {
      // Cast supabase to any to bypass typing issues (following the pattern used in authService)
      const sb: any = supabase;
      const { data, error } = await sb
        .from("guardians")
        .update({ weekly_report: checked })
        .eq("child_uid", child_uid)
        
      if (error) throw error
    } catch (err: unknown) {
      // revert on failure
      setChildren((prev: Child[]) => prev.map((k: Child) => 
        k.child_uid === child_uid ? { ...k, weekly_report: !checked } : k
      ) as Child[])
      toast({
        title: "Update failed",
        description: (err as Error)?.message || "Could not update weekly report.",
        variant: "destructive",
      })
    } finally {
      // Refresh data to ensure consistency
      loadChildren(parentEmail)
    }
  }
  
  async function toggleMonthly(child_uid: string, checked: boolean) {
    setChildren((prev: Child[]) => prev.map((k: Child) => 
      k.child_uid === child_uid ? { ...k, monthly_report: checked } : k
    ) as Child[])
    try {
      // Cast supabase to any to bypass typing issues (following the pattern used in authService)
      const sb: any = supabase;
      const { data, error } = await sb
        .from("guardians")
        .update({ monthly_report: checked })
        .eq("child_uid", child_uid)
        
      if (error) throw error
    } catch (err: unknown) {
      setChildren((prev: Child[]) => prev.map((k: Child) => 
        k.child_uid === child_uid ? { ...k, monthly_report: !checked } : k
      ) as Child[])
      toast({
        title: "Update failed",
        description: (err as Error)?.message || "Could not update monthly report.",
        variant: "destructive",
      })
    } finally {
      // Refresh data to ensure consistency
      loadChildren(parentEmail)
    }
  }

  async function copyInvite() {
    const link = "https://www.lanamind.com/register"
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast({
        title: "Link copied",
        description: "Invite link copied to clipboard successfully.",
      })
    } catch {
      const input = document.createElement("input")
      input.value = link
      document.body.appendChild(input)
      input.select()
      document.execCommand("copy")
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast({
        title: "Link copied",
        description: "Invite link copied to clipboard successfully.",
      })
    }
  }

  const refreshData = async () => {
    setRefreshing(true)
    await loadChildren(parentEmail)
    setRefreshing(false)
  }

  /* ---- loading state ---- */
  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-white/60" />
          <p className="text-white/60">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  /* ---- empty state ---- */
  if (!children.length)
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6 py-10">
        <div className="max-w-lg text-center space-y-6">
          <Mail className="w-14 h-14 mx-auto text-white/40 drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]" />
          <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
            No children linked yet
          </h1>
          <p className="text-white/60 leading-relaxed">
            To get started with Lana, you'll need to link at least one child account. You can do this in two ways:
          </p>
          
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
            <h2 className="font-semibold text-white/90">Option 1: Send an invite</h2>
            <p className="text-white/60 text-sm">
              Send your child this link to create their account and link it to yours:
            </p>
            <button
              onClick={copyInvite}
              className="w-full px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-sm transition-all duration-200 flex items-center justify-center gap-2"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied!" : "Copy invite link"}
            </button>
          </div>
          
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
            <h2 className="font-semibold text-white/90">Option 2: Add manually</h2>
            <p className="text-white/60 text-sm">
              If your child is nearby, you can set up their account directly:
            </p>
            <Button
              onClick={() => router.push("/onboarding")}
              className="w-full px-4 py-3 rounded-xl bg-white text-black font-medium hover:bg-white/90 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add child account
            </Button>
          </div>
          
          <div className="pt-4">
            <button
              onClick={() => router.push("/homepage")}
              className="px-5 py-2.5 rounded-xl bg-transparent hover:bg-white/5 border border-white/10 text-white/70 hover:text-white transition-all duration-200 flex items-center gap-2 mx-auto"
            >
              <Home className="w-4 h-4" />
              Back to home
            </button>
          </div>
        </div>
      </div>
    )

  /* ---- loaded state ---- */
  return (
    <div className="min-h-screen bg-black text-white px-6 py-10">
      <div className="max-w-5xl mx-auto space-y-10">
        {/* header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 flex items-center gap-3">
              <Mail className="w-8 h-8 drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]" />
              Parent Dashboard
            </h1>
            <p className="text-sm text-white/50 mt-1">{parentEmail}</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              onClick={refreshData}
              variant="outline"
              size="sm"
              className="border-white/20 text-white/70 hover:bg-white/10"
              disabled={refreshing}
            >
              {refreshing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Refresh"
              )}
            </Button>
            
            <button
              onClick={() => router.push("/homepage")}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-sm flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Home</span>
            </button>
          </div>
        </div>

        {/* Add child button */}
        <div className="flex justify-end">
          <Button
            onClick={() => router.push("/onboarding")}
            className="px-4 py-2 rounded-xl bg-white text-black font-medium hover:bg-white/90 transition-all duration-200 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Child
          </Button>
        </div>

        {/* children grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {children.map((kid) => (
            <div
              key={kid.child_uid}
              className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-200"
            >
              {/* child header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-white/60" />
                  <span className="font-semibold truncate max-w-[180px]">{kid.email}</span>
                </div>
                <span className="text-xs text-white/50 truncate max-w-[80px]">UID {kid.child_uid.slice(0, 8)}…</span>
              </div>

              {/* toggles */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-white/80">Weekly report</Label>
                  <Switch checked={kid.weekly_report} onCheckedChange={(c) => toggleWeekly(kid.child_uid, c)} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-white/80">Monthly report</Label>
                  <Switch checked={kid.monthly_report} onCheckedChange={(c) => toggleMonthly(kid.child_uid, c)} />
                </div>
              </div>

              {/* recent searches */}
              <div className="mt-6">
                <h3 className="text-sm font-medium text-white/70 mb-2 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />Recent searches
                </h3>
                <ul className="list-disc list-inside text-sm text-white/80 space-y-1 max-h-32 overflow-y-auto">
                  {kid.searches.map((s) => (
                    <li key={s.created_at || s.id} className="truncate">{s.title}</li>
                  ))}
                </ul>
                {!kid.searches.length && <p className="text-white/50 text-sm">No searches yet.</p>}
              </div>
            </div>
          ))}
        </div>

        {/* footer actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/10">
          <p className="text-sm text-white/50">Updates in real-time</p>
          <div className="flex items-center gap-3">
            <button
              onClick={copyInvite}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-sm flex items-center gap-2"
            >
              <Copy className="w-4 h-4" />
              Invite Child
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}