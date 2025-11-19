// components/chat-with-sidebar.tsx
"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup,
  SidebarGroupContent, SidebarGroupLabel, SidebarHeader,
  SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarProvider, SidebarTrigger,
} from "@/components/ui/sidebar"
import { History, Library, Plus, MessageSquare, Settings, Mail, LogIn, LogOut, AlertCircle } from "lucide-react"
import { uuid } from "@/lib/client-utils"
import Logo from "@/components/logo"
import { useRouter, useSearchParams } from "next/navigation"
import { apiClient } from "@/lib/api-client"
import { useApi } from "@/hooks/use-api"
import { ApiError } from "@/lib/errors";
import { supabase } from "@/lib/db"
import { useToast } from "@/hooks/use-toast"
import type { User } from "@supabase/supabase-js"

// Centralized API base with optional proxying via Next.js rewrites
// When NEXT_PUBLIC_USE_PROXY=true, calls use relative paths and are proxied by Next
const API_BASE = process.env.NEXT_PUBLIC_USE_PROXY === 'true'
  ? ''
  : (process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000");

// Lazy load heavy components
const AnimatedAIChat = dynamic(() => import("@/components/animated-ai-chat").then(mod => mod.AnimatedAIChat), {
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-black">
      <div className="space-y-4 w-full max-w-2xl mx-auto p-6">
        <Skeleton className="h-16 w-full bg-white/10 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full bg-white/10" />
          <Skeleton className="h-4 w-3/4 bg-white/10" />
          <Skeleton className="h-4 w-1/2 bg-white/10" />
        </div>
        <Skeleton className="h-12 w-32 bg-white/10 rounded-lg" />
      </div>
    </div>
  ),
  ssr: false
})

const PersonalisedAiTutor = dynamic(() => import("@/components/personalised-Ai-tutor"), {
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-black">
      <div className="text-white animate-pulse">Loading Video Learning...</div>
    </div>
  ),
  ssr: false
})

interface ChatHistory {
  id: string
  title: string
  timestamp: string
}

function ChatWithSidebarContent() {
  const [view, setView] = useState<"chat" | "video-learning">("chat")
  const [question, setQuestion] = useState<string>("")
  const [history, setHistory] = useState<ChatHistory[]>([])
  const [sid, setSid] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false)
  const [historyError, setHistoryError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  
  /* 1️⃣ Initialize & persist session id once */
  useEffect(() => {
    const id = localStorage.getItem("lana_sid") || uuid()
    localStorage.setItem("lana_sid", id)
    setSid(id)
    
    // Check for topic parameter from term-plan navigation
    const topicParam = searchParams.get("topic")
    if (topicParam) {
      setQuestion(topicParam)
      setView("chat")
      // Clean up URL without causing a page reload
      window.history.replaceState({}, '', '/')
    }
  }, [])

  /* 2️⃣ Fetch history whenever sid changes */
  const api = useApi();
  
  const fetchHistory = async (forceRefresh = false) => {
    if (!user || !sid) return;
    setLoadingHistory(true);
    setHistoryError(null);
    try {
      const bypassCache = forceRefresh || (Date.now() % 30000 < 100);
      const headers: Record<string, string> = {};
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }
      const data = await api.get<ChatHistory[]>(
        `${API_BASE}/api/history?sid=${sid}`,
        { headers },
        bypassCache
      );
      setHistory(data);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        setHistoryError("Please login or register to save search history.");
      } else {
        setHistoryError("Failed to fetch history.");
      }
    } finally {
      setLoadingHistory(false);
    }
  };

  // Fetch user session
  useEffect(() => {
    const fetchUserSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        setRole(session.user.user_metadata?.role || null);
        setAccessToken(session.access_token || null);
        // Ensure session id is namespaced by user id to satisfy backend auth checks
        try {
          const currentSid = localStorage.getItem("lana_sid");
          const uidPrefix = `${session.user.id}:`;
          if (currentSid && !currentSid.startsWith(uidPrefix)) {
            const newSid = `${session.user.id}:${currentSid}`;
            localStorage.setItem("lana_sid", newSid);
            setSid(newSid);
          }
        } catch {}
        if (sid) {
          fetchHistory(true); // ensure immediate fresh load
        }
      }
    };
    fetchUserSession();
  
    if (sid && accessToken) {
      fetchHistory(true); // refresh when tokens present
      const refreshInterval = setInterval(() => {
        if (sid && accessToken) fetchHistory(false); // periodic refresh can use cache
      }, 30000);
      return () => clearInterval(refreshInterval);
    }
  }, [sid, accessToken]);

  /* 3️⃣ Action handlers */
  const handleNewChat = async () => {
    if (!sid) return
    try {
      // Generate a fresh session id locally instead of calling a non-existent /reset
      const newSid = uuid()
      localStorage.setItem("lana_sid", newSid)
      setSid(newSid)
      await fetchHistory()
      setView("chat")
    } catch (error) {
      console.error("Failed to start new chat:", error)
      toast({
        title: "Error",
        description: "Failed to start a new chat. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleSelect = (title: string) => {
    setQuestion(title)
    setView("video-learning")
  }

  const handleBack = () => {
    setView("chat")
    fetchHistory()
  }

  /* 4️⃣ Routing */
  if (view === "video-learning") {
    return (
      <PersonalisedAiTutor
        question={question}
        onBack={handleBack}
      />
    )
  }

  /* 5️⃣ Nothing renders until sid is ready */
  if (!sid) return null

  return (
    <div className="flex min-h-screen">
      <SidebarProvider>
        <Sidebar className="border-r border-white/10">
          <SidebarHeader className="border-b border-white/10">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton size="lg">
                  <Logo className="w-24 h-24 md:w-14 md:h-14" />
                  <span className="font-semibold text-white">LANA AI</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>
  
          <SidebarContent className="gap-0">
            {/* New Chat */}
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={handleNewChat}
                      className="w-full justify-start gap-3 bg-white/5 hover:bg-white/10 text-white border border-white/10"
                    >
                      <Plus className="size-4" />
                      <span>New Chat</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
  
            {/* Live History - Secure Authentication Check */}
            <SidebarGroup>
              <SidebarGroupLabel className="text-white/70 flex items-center gap-2">
                <History className="size-4" />
                Recent Chats
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {/* Authentication Check - Show login prompt for unauthenticated users */}
                  {!user && !loadingHistory && (
                    <SidebarMenuItem>
                      <div className="flex flex-col items-center gap-3 p-4 text-center">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/10">
                          <LogIn className="w-6 h-6 text-white/60" />
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm text-white/80 font-medium">
                            Please login or register to save search history.
                          </p>
                          <SidebarMenuButton
                            onClick={() => router.push("/login")}
                            className="w-full justify-center bg-white/10 hover:bg-white/20 text-white border border-white/20"
                          >
                            <LogIn className="w-4 h-4" />
                            <span>Login or Register</span>
                          </SidebarMenuButton>
                        </div>
                      </div>
                    </SidebarMenuItem>
                  )}
                  
                  {/* Authenticated users see full History functionality */}
                  {user && (
                    <>
                      {loadingHistory && (
                        <SidebarMenuItem>
                          <div className="flex items-center gap-2 p-2 text-white/50">
                            <div className="w-4 h-4 border-2 border-white/10 border-t-white/30 rounded-full animate-spin" />
                            <span className="text-sm">Loading...</span>
                          </div>
                        </SidebarMenuItem>
                      )}
                      
                      {historyError && historyError !== 'Authentication required' && (
                        <SidebarMenuItem>
                          <div className="flex items-center gap-2 p-2 text-red-400">
                            <AlertCircle className="size-4" />
                            <span className="text-sm">Failed to load history</span>
                          </div>
                        </SidebarMenuItem>
                      )}
                      
                      {history.length === 0 && !loadingHistory && (
                        <SidebarMenuItem>
                          <span className="text-xs text-white/50 px-2">No history yet</span>
                        </SidebarMenuItem>
                      )}
                      
                      {(Array.isArray(history) ? history : []).map((chat) => (
                        <SidebarMenuItem key={chat.id}>
                          <SidebarMenuButton
                            onClick={() => handleSelect(chat.title)}
                            className="items-start py-2 text-white/80 hover:text-white hover:bg-white/5"
                          >
                            <span className="font-medium text-sm truncate">{chat.title}</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </>
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
  
            {/* Library placeholder */}
            <SidebarGroup>
              <SidebarGroupLabel className="text-white/70 flex items-center gap-2">
                <Library className="size-4" />
                Library
              </SidebarGroupLabel>
              <SidebarGroupContent />
            </SidebarGroup>
          </SidebarContent>
  
          {/* Footer actions */}
          <SidebarFooter className="border-t border-white/10">
            <SidebarMenu>
              {/* Feedback */}
              <SidebarMenuItem>
                <SidebarMenuButton className="text-white/60 hover:text-white/80 w-full justify-start gap-2">
                  <MessageSquare className="size-4" />
                  <span className="text-sm">Feedback</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
  
              {/* Settings */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => router.push("/settings")}
                  className="text-white/60 hover:text-white/80 w-full justify-start gap-2"
                >
                  <Settings className="size-4" />
                  <span className="text-sm">Settings</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
  
              {/* Parent Dashboard - only show for guardians */}
              {role === "guardian" && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => router.push("/guardian")}
                    className="text-white/60 hover:text-white w-full justify-start gap-2"
                  >
                    <Mail className="w-4 h-4" />
                    <span className="text-sm">Parent Dashboard</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
  
              {/* Auth action - Log out if authenticated, Log in if not */}
              <SidebarMenuItem>
                {user ? (
                  <SidebarMenuButton
                    onClick={async () => {
                      await supabase.auth.signOut();
                      router.push("/homepage");
                    }}
                    className="text-white/60 hover:text-white w-full justify-start gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm">Log out</span>
                  </SidebarMenuButton>
                ) : (
                  <SidebarMenuButton
                    onClick={() => router.push("/login")}
                    className="text-white/60 hover:text-white w-full justify-start gap-2"
                  >
                    <LogIn className="w-4 h-4" />
                    <span className="text-sm">Log in</span>
                  </SidebarMenuButton>
                )}
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
  
        <SidebarInset className="bg-black">
          <header className="flex h-12 shrink-0 items-center gap-2 border-b border-white/10 px-4">
            <SidebarTrigger className="text-white/60 hover:text-white" />
            <div className="flex items-center gap-2 text-sm text-white/60">
              <span>LANA AI</span>
            </div>
          </header>
          <div className="flex-1">
            {view === "chat" ? (
              <Suspense fallback={
                <div className="flex-1 flex items-center justify-center bg-black">
                  <div className="text-white animate-pulse">Loading Chat...</div>
                </div>
              }>
                <AnimatedAIChat
                  onNavigateToVideoLearning={handleSelect}
                  onSend={fetchHistory}
                />
              </Suspense>
            ) : (
              <Suspense fallback={
                <div className="flex-1 flex items-center justify-center bg-black">
                  <div className="text-white animate-pulse">Loading Video Learning...</div>
                </div>
              }>
                <PersonalisedAiTutor
                  question={question}
                  onBack={() => setView("chat")}
                />
              </Suspense>
            )}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}

export default function ChatWithSidebar() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center">Loading...</div>}>
      <ChatWithSidebarContent />
    </Suspense>
  )
}