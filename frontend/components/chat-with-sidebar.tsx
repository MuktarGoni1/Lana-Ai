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
import { supabase } from "@/lib/db"
import { useToast } from "@/hooks/use-toast"

// Centralized API base for this component
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

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
  const [user, setUser] = useState<any>(null)
  const [role, setRole] = useState<string | null>(null)
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
  
  const fetchHistory = async () => {
    if (!sid) return
    setLoadingHistory(true)
    setHistoryError(null)
    try {
      // Use cached data if available, bypass cache every 30 seconds
      const bypassCache = Date.now() % 30000 < 100; // Bypass cache ~every 30 seconds
      const data = await api.get<ChatHistory[]>(`${API_BASE}/history?sid=${sid}`, undefined, bypassCache);
      setHistory(data);
    } catch (error: unknown) {
      console.error('Failed to fetch history:', error);
      setHistory([]);
      setHistoryError('Unable to load chat history. Please check your connection.');
      toast({
        title: "Connection Error",
        description: "Unable to load chat history. Please check your connection.",
        variant: "destructive",
      });
    } finally {
      setLoadingHistory(false)
    }
  }

  useEffect(() => {
    if (sid) fetchHistory()
    
    // Set up periodic refresh of history data
    const refreshInterval = setInterval(() => {
      if (sid) fetchHistory();
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(refreshInterval);
  }, [sid])

  // Fetch user session
  useEffect(() => {
    const fetchUserSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        setRole(session.user.user_metadata?.role || null);
      }
    };
    fetchUserSession();
  }, []);

  /* 3️⃣ Action handlers */
  const handleNewChat = async () => {
    if (!sid) return
    try {
      await api.post(`${API_BASE}/reset`, { sid });
      // Clear any cached history data
      apiClient.clearCache();
      await fetchHistory();
      setView("chat");
    } catch (error) {
      console.error("Failed to reset chat:", error);
      toast({
        title: "Error",
        description: "Failed to start a new chat. Please try again.",
        variant: "destructive",
      });
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
  
            {/* Live History */}
            <SidebarGroup>
              <SidebarGroupLabel className="text-white/70 flex items-center gap-2">
                <History className="size-4" />
                Recent Chats
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {loadingHistory && (
                    <SidebarMenuItem>
                      <div className="flex items-center gap-2 p-2 text-white/50">
                        <div className="w-4 h-4 border-2 border-white/10 border-t-white/30 rounded-full animate-spin" />
                        <span className="text-sm">Loading...</span>
                      </div>
                    </SidebarMenuItem>
                  )}
                  
                  {historyError && (
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
                      router.push("/login");
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