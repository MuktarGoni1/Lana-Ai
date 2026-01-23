// Lana AI - Main Homepage Component
// This file serves as the primary entry point for the Lana AI application
// Contains the complete chat interface with all core functionality

"use client";

import React, { useEffect, useRef, useCallback, useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import rateLimiter from "@/lib/rate-limiter";
import { isValidLessonResponse, sanitizeLessonContent } from '@/lib/response-validation';
import { decodeHTMLEntities } from '@/lib/html-entity-decoder';
import { getSelectedMode, saveSelectedMode } from '@/lib/mode-storage';
import {
  Paperclip,
  Command,
  SendIcon,
  XIcon,
  LoaderIcon,
  Sparkles,
  Play,
  Pause,
  Video,
  BookOpen,
  PersonStandingIcon,
  AlertCircle,
  RefreshCw,
  CheckIcon,
  Plus,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useMotionValue } from "framer-motion";

import { useRouter } from "next/navigation";
import Logo from '@/components/logo';
import { saveSearch } from '@/lib/search'
import { supabase } from '@/lib/db';
import { useComprehensiveAuth } from '@/contexts/ComprehensiveAuthContext';
import { useToast } from '@/hooks/use-toast';

// Centralized API base for both components in this file
// Using unified API configuration
import { API_BASE } from '@/lib/api-config';

/* ------------------------------------------------------------------ */
/* 1. wrapper                                                           */
/* ------------------------------------------------------------------ */
const styles = `
  .lesson-card h2 {
    font-weight: 700;
    text-decoration: none;
    color: white;
    letter-spacing: 0.3px;
  }
`;

// inject once with guard to avoid duplicates during HMR
if (typeof document !== "undefined") {
  const existing = document.getElementById("lana-inline-styles");
  if (!existing) {
    const style = document.createElement("style");
    style.id = "lana-inline-styles";
    style.innerHTML = styles;
    document.head.appendChild(style);
  }
}

import ChatWithSidebar from '@/components/chat-with-sidebar';

// Main Homepage Component for Lana AI
// This component serves as the primary interface for users to interact with the AI tutor
export default function HomePage() {
  const { user, isAuthenticated, isLoading, refreshUser } = useComprehensiveAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const handleNavigate = (text: string) => setQuestion(text.trim());

  // Handle session timeout
  useEffect(() => {
    // Set up a periodic check for session validity
    const sessionCheckInterval = setInterval(async () => {
      if (isAuthenticated) {
        try {
          // Try to refresh the session to check if it's still valid
          const { data: { session }, error } = await supabase.auth.getSession();

          if (error || !session) {
            // Session has expired or there was an error
            toast({
              title: "Session Expired",
              description: "Your session has expired. Please log in again.",
              variant: "destructive"
            });
            router.push("/login");
          }
        } catch (error) {
          console.error("Error checking session:", error);
        }
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    // Clean up interval on unmount
    return () => clearInterval(sessionCheckInterval);
  }, [isAuthenticated, router, toast]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-white/10 border-t-white/30 rounded-full animate-spin mx-auto" />
          <p className="text-white/30 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // Allow guest users on homepage with limited functionality
  // Authenticated users get full access, guests get basic access
  if (!isAuthenticated) {
    console.log('[Homepage] Guest access granted');
  }
  // Return the ChatWithSidebar component to maintain the sidebar
  return <ChatWithSidebar />;
}