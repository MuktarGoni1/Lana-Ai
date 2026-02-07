// components/chat-with-sidebar.tsx
"use client"

import React from "react"
import { useState, useEffect, useCallback } from "react"
import dynamic from "next/dynamic"
import { Suspense } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup,
  SidebarGroupContent, SidebarGroupLabel, SidebarHeader,
  SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarProvider, SidebarTrigger,
} from "@/components/ui/sidebar"
import { History, Library, Plus, MessageSquare, Settings, Mail, LogIn, LogOut, AlertCircle, Video } from "lucide-react"
import { uuid } from "@/lib/client-utils"
import Logo from "@/components/logo"
import { useRouter, useSearchParams } from "next/navigation"
import { apiClient } from "@/lib/api-client"
import { useApi } from "@/hooks/use-api"
import { ApiError } from "@/lib/errors";
import { supabase } from "@/lib/db"
import { useToast } from "@/hooks/use-toast"
import type { User } from "@supabase/supabase-js"
import { useEnhancedAuth } from "@/hooks/useEnhancedAuth"

// Centralized API base with optional proxying via Next.js rewrites
// Using unified API configuration
import { API_BASE } from '@/lib/api-config';

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

// Add a debounce helper function
const debounce = (func: Function, wait: number) => {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

function ChatWithSidebarContent() {
  const [view, setView] = useState<"chat" | "video-learning">("chat")
  const [question, setQuestion] = useState<string>("")
  const [history, setHistory] = useState<ChatHistory[]>([])
  const [sid, setSid] = useState<string | null>(null)
  // Replace individual auth state variables with useEnhancedAuth hook
  const { user, isAuthenticated, isLoading: authLoading } = useEnhancedAuth();
  const [role, setRole] = useState<string | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false)
  const [historyError, setHistoryError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  
  // Create a debounced version of fetchHistory
  const debouncedFetchHistory = useCallback(
    debounce((forceRefresh = false) => {
      fetchHistory(forceRefresh);
    }, 1000), // 1 second debounce
    []
  );
  
  /* 1️⃣ Initialize & persist session id once */
  useEffect(() => {
    const initSessionId = async () => {
      // Check authentication state first to avoid race conditions
      let id;
      
      // If user is authenticated, use their user ID as the session ID
      if (user && user.id) {
        id = user.id;
      } else {
        // For guest users, generate a standard session ID
        id = `guest_${uuid()}`;
      }
      
      setSid(id);
      
      // Check for topic parameter from term-plan navigation
      const topicParam = searchParams.get("topic");
      if (topicParam) {
        setQuestion(topicParam);
        setView("chat");
        // Clean up URL without causing a page reload
        window.history.replaceState({}, '', '/');
      }
    };
    
    initSessionId();
  }, [user])

  /* 2️⃣ Fetch history whenever sid changes */
  const api = useApi();
  
  const fetchHistory = useCallback(async (forceRefresh = false) => {
    if (!sid) return;
    setLoadingHistory(true);
    setHistoryError(null);
    try {
      const bypassCache = forceRefresh || (Date.now() % 30000 < 100);
      const headers: Record<string, string> = {};
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }
      const data = await api.get<ChatHistory[]>(
        `/history?sid=${sid}&limit=50`,
        { headers },
        bypassCache
      );
      setHistory(data);
    } catch (e) {
      if (e instanceof ApiError) {
        switch (e.status) {
          case 401:
            // Don't show error message for authenticated users
            if (!isAuthenticated) {
              setHistoryError("Please login or register to save search history.");
            }
            break;
          case 403:
            setHistoryError("Access denied. Please login with proper credentials.");
            break;
          case 404:
            setHistoryError("History not found.");
            break;
          case 429:
            // Handle rate limiting - don't show error to user, just silently fail
            console.warn("Rate limit exceeded for history fetch");
            break;
          case 500:
            setHistoryError("Server error. Please try again later.");
            break;
          default:
            // Only show error messages to unauthenticated users for other errors
            if (!isAuthenticated) {
              setHistoryError("Failed to fetch history.");
            }
        }
      } else {
        // Only show error messages to unauthenticated users for network errors
        if (!isAuthenticated) {
          setHistoryError("Failed to fetch history.");
        }
      }
    } finally {
      setLoadingHistory(false);
    }
  }, [sid, accessToken, api, isAuthenticated]);

  // Fetch user session - simplified with useEnhancedAuth
  useEffect(() => {
    if (user) {
      setRole(user.user_metadata?.role || null)
      // Get access token
      const getAccessToken = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setAccessToken(session.access_token || null)
        }
      }
      getAccessToken()
      
      // Update session ID to use authenticated user ID
      try {
        if (user?.id) {
          setSid(user.id);
        }
      } catch (error) {
        console.error('Error updating session ID:', error);
      }
      
      if (sid) {
        debouncedFetchHistory(true); // use debounced version
      }
    }
    
    if (sid && accessToken) {
      debouncedFetchHistory(true); // use debounced version
      // Reduce polling frequency to avoid rate limiting
      // Changed from 30 seconds to 5 minutes (300000ms)
      const refreshInterval = setInterval(() => {
        if (sid && accessToken) debouncedFetchHistory(false); // use debounced version
      }, 300000); // 5 minutes instead of 30 seconds
      return () => clearInterval(refreshInterval);
    }
  }, [user, sid, accessToken, debouncedFetchHistory]);

  /* 3️⃣ Action handlers */
  const handleNewChat = async () => {
    if (!sid) return
    try {
      // Generate a fresh session id locally instead of calling a non-existent /reset
      let newSid = uuid();
      
      // For authenticated users, use their user ID
      if (user?.id) {
        newSid = user.id;
      }
      
      setSid(newSid)
      await debouncedFetchHistory() // use debounced version
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

  const handleSelect = (title: string, fromMode?: string) => {
    setQuestion(title)
    setView("video-learning")
  }

  // Centralized navigation handlers for consistency
  const handleNavigateToVideoLearning = useCallback((title: string, fromMode?: string) => {
    setQuestion(title);
    setView("video-learning");
  }, []);

  const handleNavigateToChat = useCallback(() => {
    setView("chat");
    debouncedFetchHistory();
  }, [debouncedFetchHistory]);

  const handleNavigateToHomepage = useCallback(() => {
    router.push('/homepage');
  }, [router]);

  const handleNavigateToLogin = useCallback(() => {
    router.push('/login');
  }, [router]);

  const handleNavigateToSettings = useCallback(() => {
    router.push('/settings');
  }, [router]);

  const handleNavigateToFeedback = useCallback(() => {
    router.push('/feedback');
  }, [router]);

  const handleBack = () => {
    setView("chat")
    debouncedFetchHistory() // use debounced version
  }

  /* 4️⃣ Routing */
  if (view === "video-learning") {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="standalone-video-learning-view"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="w-full h-full"
        >
          <PersonalisedAiTutor
            question={question}
            onBack={handleNavigateToChat}
          />
        </motion.div>
      </AnimatePresence>
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

            {/* Video Lessons */}
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => router.push('/video-explainer')}
                      className="w-full justify-start gap-3 bg-zinc-900 hover:bg-zinc-800 text-white border border-white/10"
                    >
                      <Video className="size-4" />
                      <span>Video Lessons</span>
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
                  {/* Authentication Check - Show guest access message for unauthenticated users */}
                  {!isAuthenticated && !authLoading && !loadingHistory && (
                    <SidebarMenuItem>
                      <div className="flex flex-col items-center gap-3 p-4 text-center">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/10">
                          <LogIn className="w-6 h-6 text-white/60" />
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm text-white/80 font-medium">
                            Guest Mode - Limited Features
                          </p>
                          <p className="text-xs text-white/60">
                            Login to save history and unlock full features
                          </p>
                          <SidebarMenuButton
                            onClick={handleNavigateToLogin}
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
                  {isAuthenticated && (
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
                <SidebarMenuButton 
                  onClick={handleNavigateToFeedback}
                  className="text-white/60 hover:text-white/80 w-full justify-start gap-2"
                >
                  <MessageSquare className="size-4" />
                  <span className="text-sm">Feedback</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
  
              {/* Settings */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={handleNavigateToSettings}
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
                    onClick={handleNavigateToHomepage}
                    className="text-white/60 hover:text-white w-full justify-start gap-2"
                  >
                    <Mail className="w-4 h-4" />
                    <span className="text-sm">Parent Dashboard</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
  
              {/* Auth action - Log out if authenticated, Log in if not */}
              <SidebarMenuItem>
                {isAuthenticated ? (
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
                    onClick={handleNavigateToLogin}
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
              <AnimatePresence mode="wait">
                <motion.div
                  key="chat-view"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="w-full h-full"
                >
                  <Suspense fallback={
                    <div className="flex-1 flex items-center justify-center bg-black">
                      <div className="text-white animate-pulse">Loading Chat...</div>
                    </div>
                  }>
                    <AnimatedAIChat
                      onNavigateToVideoLearning={handleNavigateToVideoLearning}
                      onSend={debouncedFetchHistory}
                      user={user}
                    />
                  </Suspense>
                </motion.div>
              </AnimatePresence>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key="video-learning-view"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="w-full h-full"
                >
                  <Suspense fallback={
                    <div className="flex-1 flex items-center justify-center bg-black">
                      <div className="text-white animate-pulse">Loading Video Learning...</div>
                    </div>
                  }>
                    <PersonalisedAiTutor
                      question={question}
                      onBack={handleNavigateToChat}
                    />
                  </Suspense>
                </motion.div>
              </AnimatePresence>
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