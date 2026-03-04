"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/db";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { User, BookOpen, Copy, Check, Plus, Home, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";

interface ChildSearch {
  id: string;
  title: string;
  created_at: string | null;
}

interface Child {
  id: string;
  name: string;
  searches: ChildSearch[];
}

export default function GuardianDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: authLoading } = useUnifiedAuth();

  const [children, setChildren] = useState<Child[]>([]);
  const [parentEmail, setParentEmail] = useState("");
  const [weeklyReport, setWeeklyReport] = useState(true);
  const [monthlyReport, setMonthlyReport] = useState(true);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !user) {
      router.push("/login");
      return;
    }

    const email = user.email ?? "";
    setParentEmail(email);
    void loadDashboard(email, user.id);
  }, [authLoading, isAuthenticated, router, user]);

  async function loadDashboard(email: string, parentId: string) {
    try {
      setLoading(true);

      const { data: settings, error: settingsError } = await supabase
        .from("guardian_settings")
        .select("weekly_report, monthly_report")
        .eq("email", email)
        .maybeSingle();

      if (settingsError) throw settingsError;

      setWeeklyReport(settings?.weekly_report ?? true);
      setMonthlyReport(settings?.monthly_report ?? true);

      const { data: childProfiles, error: childError } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("parent_id", parentId)
        .eq("role", "child");

      if (childError) throw childError;

      const childrenData: Child[] = [];
      for (const child of childProfiles ?? []) {
        const { data: searches, error: searchesError } = await supabase
          .from("searches")
          .select("id, title, created_at")
          .eq("user_id", child.id)
          .order("created_at", { ascending: false })
          .limit(10);

        if (searchesError) throw searchesError;

        childrenData.push({
          id: child.id,
          name: child.full_name || `Child ${child.id.slice(0, 8)}`,
          searches: searches ?? [],
        });
      }

      setChildren(childrenData);
    } catch (error) {
      console.error("Error loading guardian dashboard:", error);
      toast({
        title: "Error loading data",
        description: "Failed to load guardian dashboard data. Please try again.",
        variant: "destructive",
      });
      setChildren([]);
    } finally {
      setLoading(false);
    }
  }

  async function updateReportPreference(kind: "weekly_report" | "monthly_report", checked: boolean) {
    const previousWeekly = weeklyReport;
    const previousMonthly = monthlyReport;

    if (kind === "weekly_report") setWeeklyReport(checked);
    if (kind === "monthly_report") setMonthlyReport(checked);

    try {
      const { error } = await supabase.from("guardian_settings").upsert(
        {
          email: parentEmail,
          weekly_report: kind === "weekly_report" ? checked : weeklyReport,
          monthly_report: kind === "monthly_report" ? checked : monthlyReport,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "email" }
      );

      if (error) throw error;
    } catch (error: any) {
      setWeeklyReport(previousWeekly);
      setMonthlyReport(previousMonthly);
      toast({
        title: "Update failed",
        description: error?.message || "Could not update report preferences.",
        variant: "destructive",
      });
    }
  }

  async function copyInvite() {
    const link = "https://www.lanamind.com/register";
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const refreshData = async () => {
    if (!user) return;
    setRefreshing(true);
    await loadDashboard(parentEmail, user.id);
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-white/60" />
          <p className="text-white/60">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white px-6 py-10">
      <div className="max-w-5xl mx-auto space-y-10">
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
              {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Refresh"}
            </Button>
            <button
              onClick={() => router.push("/")}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-sm flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Home</span>
            </button>
          </div>
        </div>

        <div className="rounded-2xl bg-white/5 border border-white/10 p-6 space-y-4">
          <h2 className="text-lg font-semibold">Report Preferences</h2>
          <div className="flex items-center justify-between">
            <Label className="text-white/80">Weekly report</Label>
            <Switch checked={weeklyReport} onCheckedChange={(c) => updateReportPreference("weekly_report", c)} />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-white/80">Monthly report</Label>
            <Switch checked={monthlyReport} onCheckedChange={(c) => updateReportPreference("monthly_report", c)} />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={() => router.push("/onboarding")}
            className="px-4 py-2 rounded-xl bg-white text-black font-medium hover:bg-white/90 transition-all duration-200 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Child
          </Button>
          <Button
            onClick={() => router.push("/children")}
            variant="outline"
            className="px-4 py-2 rounded-xl border border-white/20 text-white font-medium hover:bg-white/10 transition-all duration-200 flex items-center gap-2"
          >
            <User className="w-4 h-4" />
            Manage All Children
          </Button>
          <button
            onClick={copyInvite}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-sm flex items-center gap-2"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied!" : "Invite Child"}
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {children.map((child) => (
            <div
              key={child.id}
              className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-white/60" />
                  <span className="font-semibold truncate max-w-[180px]">{child.name}</span>
                </div>
                <span className="text-xs text-white/50 truncate max-w-[100px]">ID {child.id.slice(0, 8)}...</span>
              </div>

              <div className="mt-4">
                <h3 className="text-sm font-medium text-white/70 mb-2 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Recent searches
                </h3>
                <ul className="list-disc list-inside text-sm text-white/80 space-y-1 max-h-32 overflow-y-auto">
                  {child.searches.map((s) => (
                    <li key={s.created_at || s.id} className="truncate">
                      {s.title}
                    </li>
                  ))}
                </ul>
                {!child.searches.length && <p className="text-white/50 text-sm">No searches yet.</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
