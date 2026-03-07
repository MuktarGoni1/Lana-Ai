"use client"
import { useEffect, useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/db"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Moon, 
  LogOut, 
  Save, 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  User as UserIcon, 
  Settings as SettingsIcon, 
  Loader,
  User,
  Mail,
  Calendar,
  Camera,
  Upload
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext"

function useSettingsAuth() {
  const unifiedAuth = useUnifiedAuth();
  return {
    user: unifiedAuth.user,
    isAuthenticated: unifiedAuth.isAuthenticated,
    isLoading: unifiedAuth.isLoading,
  };
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export default function SettingsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const auth = useSettingsAuth()
  const [role, setRole] = useState<"child" | "guardian" | null>(null)
  const [weekly, setWeekly] = useState(true)
  const [monthly, setMonthly] = useState(false)
  const [parentEmail, setParentEmail] = useState("")
  const [dark, setDark] = useState(false)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [saveError, setSaveError] = useState<string>("")
  const [initialLoadComplete, setInitialLoadComplete] = useState(false)
  
  // Profile states
  const [displayName, setDisplayName] = useState("")
  const [isEditingName, setIsEditingName] = useState(false)
  const [savingName, setSavingName] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [createdAt, setCreatedAt] = useState<string>("")

  useEffect(() => {
    if (auth && !auth.isLoading) {
      if (!auth.isAuthenticated) {
        router.push("/login");
        return;
      }
      
      if (auth.user) {
        const meta = auth.user.user_metadata;
        const userRole = meta?.role;
        
        if (userRole && (userRole === "guardian" || userRole === "parent")) {
          setRole("guardian");
        } else if (userRole && userRole === "child") {
          setRole("child");
        } else {
          setRole("guardian");
        }
        
        setParentEmail(meta?.guardian_email ?? "");
        setDisplayName(meta?.full_name || auth.user.email?.split('@')[0] || "");
        setAvatarUrl(meta?.avatar_url || null);
        
        // Format creation date
        if (auth.user.created_at) {
          const date = new Date(auth.user.created_at);
          setCreatedAt(date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          }));
        }
        
        setDark(localStorage.getItem("theme") === "dark");
        
        if ((userRole === "guardian" || meta?.role === "guardian") && auth.user.email) {
          loadParentPrefs(auth.user.email);
        }
        setInitialLoadComplete(true);
      }
    }
  }, [auth, router]);

  async function loadParentPrefs(email: string) {
    if (!email) return;
    
    const { data, error } = await supabase
      .from("guardian_settings")
      .select("weekly_report, monthly_report")
      .eq("email", email)
      .single()
      
    if (error) {
      console.error('[Settings] Error loading preferences:', error);
      toast({
        title: "Load Error",
        description: "Could not load your report preferences.",
        variant: "destructive",
      });
      return;
    }
      
    if (data) { 
      setWeekly(data.weekly_report ?? true); 
      setMonthly(data.monthly_report ?? false); 
    }
  }

  const saveReportPreferences = useCallback(async (newWeekly: boolean, newMonthly: boolean) => {
    if (!auth.user?.email || role !== "guardian") return;
    
    setSaveStatus('saving');
    setSaveError("");
    
    try {
      const { error } = await supabase
        .from("guardian_settings")
        .upsert({
          email: auth.user.email,
          weekly_report: newWeekly,
          monthly_report: newMonthly,
          updated_at: new Date().toISOString(),
        }, { onConflict: "email" })
      
      if (error) throw error;
      
      setSaveStatus('saved');
      setWeekly(newWeekly);
      setMonthly(newMonthly);
      
      toast({ 
        title: "Saved", 
        description: "Report preferences updated successfully." 
      });
      
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err: unknown) {
      console.error('[Settings] Save error:', err);
      setSaveStatus('error');
      const errorMessage = err instanceof Error ? err.message : "Could not save preferences.";
      setSaveError(errorMessage);
      toast({
        title: "Save Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [auth.user?.email, role, toast]);

  const handleWeeklyToggle = async (checked: boolean) => {
    await saveReportPreferences(checked, monthly);
  };

  const handleMonthlyToggle = async (checked: boolean) => {
    await saveReportPreferences(weekly, checked);
  };

  async function toggleDark(checked: boolean) {
    setDark(checked)
    localStorage.setItem("theme", checked ? "dark" : "light")
    document.documentElement.classList.toggle("dark", checked)
  }

  async function saveDisplayName() {
    if (!auth.user || !displayName.trim()) return;
    
    setSavingName(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          ...auth.user.user_metadata,
          full_name: displayName.trim()
        }
      });
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Display name updated.",
      });
      setIsEditingName(false);
    } catch (err) {
      console.error('[Settings] Name update error:', err);
      toast({
        title: "Update Failed",
        description: "Could not update display name.",
        variant: "destructive",
      });
    } finally {
      setSavingName(false);
    }
  }

  async function handleAvatarUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !auth.user) return;
    
    setUploadingAvatar(true);
    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${auth.user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      // Update user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          ...auth.user.user_metadata,
          avatar_url: publicUrl
        }
      });
      
      if (updateError) throw updateError;
      
      setAvatarUrl(publicUrl);
      toast({
        title: "Success",
        description: "Profile picture updated.",
      });
    } catch (err) {
      console.error('[Settings] Avatar upload error:', err);
      toast({
        title: "Upload Failed",
        description: "Could not upload profile picture.",
        variant: "destructive",
      });
    } finally {
      setUploadingAvatar(false);
    }
  }

  if (!auth || auth.isLoading || !initialLoadComplete) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-white/10 border-t-white/30 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/50">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (auth && !auth.isLoading && !auth.isAuthenticated) {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center px-6 py-10">
      <div className="w-full max-w-2xl space-y-8">
        <h1 className="text-3xl font-bold">Settings</h1>

        {/* ----- Profile ----- */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <User className="w-5 h-5" />
            Profile
          </h2>
          
          <div className="p-6 rounded-xl bg-white/5 border border-white/10 space-y-6">
            {/* Avatar */}
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-2xl font-bold overflow-hidden">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    displayName.charAt(0).toUpperCase()
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute bottom-0 right-0 w-8 h-8 bg-white text-black rounded-full flex items-center justify-center hover:bg-gray-200 disabled:opacity-50"
                >
                  {uploadingAvatar ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>
              <div>
                <p className="font-medium">Profile Picture</p>
                <p className="text-sm text-white/50">Click to upload a new photo</p>
              </div>
            </div>
            
            {/* Display Name */}
            <div className="space-y-2">
              <Label className="text-white/70">Display Name</Label>
              {isEditingName ? (
                <div className="flex gap-2">
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your name"
                    className="flex-1 bg-white/5 border-white/10 text-white"
                  />
                  <Button
                    onClick={saveDisplayName}
                    disabled={savingName}
                    size="sm"
                  >
                    {savingName ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDisplayName(auth.user?.user_metadata?.full_name || "");
                      setIsEditingName(false);
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                  <span>{displayName || "Not set"}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditingName(true)}
                  >
                    Edit
                  </Button>
                </div>
              )}
            </div>
            
            {/* Email */}
            <div className="space-y-2">
              <Label className="text-white/70">Email</Label>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-white/5 text-white/70">
                <Mail className="w-4 h-4" />
                <span>{auth.user?.email}</span>
              </div>
            </div>
            
            {/* Account Created */}
            {createdAt && (
              <div className="space-y-2">
                <Label className="text-white/70">Member Since</Label>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-white/5 text-white/70">
                  <Calendar className="w-4 h-4" />
                  <span>{createdAt}</span>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ----- Appearance ----- */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Moon className="w-5 h-5" />
            Appearance
          </h2>
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
            <Label>Dark mode</Label>
            <Switch checked={dark} onCheckedChange={toggleDark} />
          </div>
        </section>

        {/* ----- Reports ----- */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <UserIcon className="w-5 h-5" />
            Reports
            {saveStatus === 'saving' && (
              <Loader2 className="w-4 h-4 animate-spin ml-2 text-blue-400" />
            )}
            {saveStatus === 'saved' && (
              <CheckCircle className="w-4 h-4 ml-2 text-green-400" />
            )}
            {saveStatus === 'error' && (
              <AlertCircle className="w-4 h-4 ml-2 text-red-400" />
            )}
          </h2>

          {saveStatus === 'error' && saveError && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {saveError}
            </div>
          )}

          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex flex-col">
              <Label>Weekly report</Label>
              <span className="text-xs text-white/50">Receive progress updates every week</span>
            </div>
            <Switch 
              checked={weekly} 
              onCheckedChange={handleWeeklyToggle}
              disabled={role === "child" || saveStatus === 'saving'}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex flex-col">
              <Label>Monthly report</Label>
              <span className="text-xs text-white/50">Receive monthly summary reports</span>
            </div>
            <Switch 
              checked={monthly} 
              onCheckedChange={handleMonthlyToggle}
              disabled={role === "child" || saveStatus === 'saving'}
            />
          </div>

          {role === "child" && (
            <p className="text-sm text-white/50 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Ask your parent to manage report preferences
            </p>
          )}

          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <Label className="text-white/70">Parent / Guardian e-mail</Label>
            <p className="text-sm mt-1">{parentEmail || "Not linked"}</p>
          </div>
        </section>

        {/* ----- Parent full controls ----- */}
        {role === "guardian" && auth.user?.email && (
          <section className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <SettingsIcon className="w-5 h-5" />
              Parent Controls
            </h2>
            
            <button
              onClick={() => router.push("/children")}
              className="w-full px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-left flex items-center justify-between group"
            >
              <span>Manage Children</span>
              <span className="text-white/50 group-hover:text-white transition-colors">Add, edit or remove children →</span>
            </button>
          </section>
        )}

        {/* ----- Account ----- */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Account</h2>
          
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
            className="w-full px-4 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign out</span>
          </button>
        </section>
      </div>
    </div>
  )
}

function X({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className={className}
    >
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  )
}
