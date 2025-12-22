// Lana AI - Main Homepage Component
// This file serves as the primary entry point for the Lana AI application
// Contains the complete chat interface with all core functionality

"use client";

import React, { useEffect, useRef, useCallback, useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import rateLimiter from "@/lib/rate-limiter";
import { isValidLessonResponse, sanitizeLessonContent } from "@/lib/response-validation";
import { saveSelectedMode } from "@/lib/mode-storage";
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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useMotionValue } from "framer-motion";
import { Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import Logo from '@/components/logo';
import { saveSearch } from '@/lib/search'
import { supabase } from '@/lib/db';
import { useEnhancedAuth } from '@/hooks/useEnhancedAuth';
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
  const { user, isAuthenticated, isLoading, refreshSession } = useEnhancedAuth();
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

/* ------------------------------------------------------------------ */
/* 2. textarea hook                                                     */
/* ------------------------------------------------------------------ */
interface UseAutoResizeTextareaProps {
  minHeight: number;
  maxHeight?: number;
}
function useAutoResizeTextarea({ minHeight, maxHeight }: UseAutoResizeTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const adjustHeight = useCallback(
    (reset?: boolean) => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      textarea.style.height = `${minHeight}px`;
      if (!reset) {
        const newHeight = Math.max(
          minHeight,
          Math.min(textarea.scrollHeight, maxHeight ?? Infinity)
        );
        textarea.style.height = `${newHeight}px`;
      }
    },
    [minHeight, maxHeight]
  );
  useEffect(() => adjustHeight(true), [adjustHeight]);
  return { textareaRef, adjustHeight };
}

/* ------------------------------------------------------------------ */
/* 3. textarea component                                                */
/* ------------------------------------------------------------------ */
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  containerClassName?: string;
  showRing?: boolean;
  mode?: string; // Add mode prop for visual indication
}
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, containerClassName, showRing = true, mode, ...props }, ref) => {
    const [focused, setFocused] = useState(false);
    return (
      <div className={cn("relative", containerClassName)}>
        <textarea
          className={cn(
            "flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
            "transition-all duration-200 ease-in-out placeholder:text-muted-foreground",
            "disabled:cursor-not-allowed disabled:opacity-50",
            showRing && "focus:outline-none",
            className
          )}
          ref={ref}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
        {showRing && focused && (
          <motion.span
            className="absolute inset-0 rounded-md pointer-events-none ring-2 ring-white/20 z-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
        {mode && (
          <div className="absolute top-2 right-3 text-xs text-white/80 pointer-events-none z-20 font-medium">
            {mode.charAt(0).toUpperCase() + mode.slice(1)} Mode
          </div>
        )}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

/* ------------------------------------------------------------------ */
/* lesson card component (inline)                                 */
/* ------------------------------------------------------------------ */

interface LessonSection {
  title?: string;
  content?: string;
}

interface LessonQuizItem {
  q: string;  
  options: string[];
  answer: string;
}

interface MathStepUI {
  description: string;
  expression?: string | null;
}

interface MathSolutionUI {
  problem: string;
  solution: string;
  steps?: MathStepUI[];
  error?: string | null;
}

interface Lesson {
  id?: string;
  introduction?: string;
  classifications?: Array<{ type: string; description: string }>;
  sections?: LessonSection[];
  diagram?: string;
  quiz?: LessonQuizItem[];
}

const StructuredLessonCard = ({ lesson, isStreamingComplete }: { lesson: Lesson; isStreamingComplete: boolean }) => {
  // Check if this is an error response
  const isErrorResponse = lesson.introduction && lesson.introduction.includes("Unable to generate a detailed lesson");
  
  // Lightly sanitize markdown-like tokens and normalize bullets per line

  const sanitizeLine = (line: string) => {
    return line
      .replaceAll("**", "")
      .replace(/^\s*[-*]\s+/, "• ")
      .replace(/`{1,3}/g, "")
      .trim();
  };

  // Normalize common section titles to a clean, consistent name
  const normalizeTitle = (title: string) => {
    const t = title.trim();
    if (/^\s*(what\s+is)\b/i.test(t)) return "Overview";
    if (/^\s*(definition)\b/i.test(t)) return "Overview";
    if (/^\s*overview\b/i.test(t)) return "Overview";
    return t.replace(/^\s*#+\s*/, "").trim();
  };
  const router = useRouter();
  const handleTakeQuiz = () => {
    try {
      // Always use the data-based approach since lesson ID approach won't work
      // (lessons are ephemeral and not retrievable by ID from the backend)
      
      // Check if we have quiz data available
      if (!lesson?.quiz || !Array.isArray(lesson.quiz) || lesson.quiz.length === 0) {
        console.warn("No quiz data available", lesson?.quiz);
        return;
      }
      
      // Transform quiz data to match frontend expectations
      const transformedQuiz = lesson.quiz.map((item) => ({
        q: item.q || (item as any).question || "",  // Handle both 'q' and 'question' properties
        options: Array.isArray(item.options) ? item.options : [],
        answer: item.answer || ""
      })).filter((item) => item.q && item.options.length > 0);
      
      if (transformedQuiz.length === 0) {
        console.warn("No valid quiz items after transformation", lesson.quiz);
        return;
      }
      
      const data = encodeURIComponent(JSON.stringify(transformedQuiz));
      router.push(`/quiz?data=${data}`);
    } catch (err) {
      console.error("Failed to navigate to quiz:", err);
    }
  };

  // Removed verbose debug logging for production readiness.
  // TTS state and actions
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isTtsLoading, setIsTtsLoading] = useState(false);
  const [ttsError, setTtsError] = useState<string | null>(null); // Local error state for TTS
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioQueue, setAudioQueue] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentIndexRef = useRef(0);
  const [isQueuePreloading, setIsQueuePreloading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex]);

  // Fixed: Properly generate blocks from lesson content
  const getFullLessonText = useCallback(() => {
    const lines: string[] = [];
    
    // Add introduction
    if (lesson?.introduction) {
      lines.push(lesson.introduction);
    }
    
    // Add sections
    if (Array.isArray(lesson?.sections)) {
      for (const section of lesson.sections) {
        if (section?.title) {
          lines.push(section.title);
        }
        if (section?.content) {
          lines.push(section.content);
        }
      }
    }
    
    return lines.join("\n\n");
  }, [lesson]);

  const objectUrlsRef = useRef<string[]>([]);
  
  const fetchLessonTTSBlobUrl = useCallback(async (lesson: any, mode: string = "full", sectionIndex?: number, isRetry = false) => {
    try {
      if (isRetry) {
        setIsRetrying(true);
      }
      
      // Validate input
      if (!lesson) {
        throw new Error("No lesson provided for text-to-speech");
      }
      
      // Check rate limit before making request
      const endpoint = '/api/tts/lesson';
      if (!rateLimiter.isAllowed(endpoint)) {
        const waitTime = rateLimiter.getTimeUntilNextRequest(endpoint);
        throw new Error(`Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds before trying again.`);
      }
      
      // Use the API base for TTS requests to ensure proper routing
      const res = await fetch(`/api/tts/lesson`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          lesson: lesson,
          mode: mode,
          section_index: sectionIndex
        }),
      });
      
      if (!res.ok) {
        // Handle different error cases with more specific messages
        let errorMessage = 'Audio service error';
        switch (res.status) {
          case 400:
            errorMessage = 'Invalid request to audio service.';
            break;
          case 429:
            errorMessage = 'Too many requests. Please wait before trying again.';
            break;
          case 500:
            errorMessage = 'Server error. Please try again later.';
            break;
          case 503:
            errorMessage = 'Audio service temporarily unavailable. Please try again later.';
            break;
          default:
            errorMessage = `Audio service error: ${res.status}`;
        }
        throw new Error(errorMessage);
      }
      
      const blob = await res.blob();
      if (!blob || blob.size === 0) {
        throw new Error("Received empty audio response");
      }
      
      const url = URL.createObjectURL(blob);
      objectUrlsRef.current.push(url);
      return url;
    } catch (error) {
      console.error("Lesson TTS Error:", error);
      setTtsError(error instanceof Error ? error.message : "Failed to generate audio");
      // Don't throw for retry attempts, just return null
      if (isRetry) {
        return null;
      }
      throw error;
    } finally {
      if (isRetry) {
        setIsRetrying(false);
      }
    }
  }, []);
  
  const fetchTTSBlobUrl = useCallback(async (text: string, isRetry = false) => {
    try {
      if (isRetry) {
        setIsRetrying(true);
      }
      
      // Validate input
      if (!text || !text.trim()) {
        throw new Error("No text provided for text-to-speech");
      }
      
      // Check rate limit before making request
      const endpoint = '/api/tts';
      if (!rateLimiter.isAllowed(endpoint)) {
        const waitTime = rateLimiter.getTimeUntilNextRequest(endpoint);
        throw new Error(`Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds before trying again.`);
      }
      
      // Use the API base for TTS requests to ensure proper routing
      const res = await fetch(`/api/tts/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim() }),
      });
      
      if (!res.ok) {
        // Handle different error cases with more specific messages
        let errorMessage = 'Audio service error';
        switch (res.status) {
          case 400:
            errorMessage = 'Invalid request to audio service.';
            break;
          case 429:
            errorMessage = 'Too many requests. Please wait before trying again.';
            break;
          case 500:
            errorMessage = 'Server error. Please try again later.';
            break;
          case 503:
            errorMessage = 'Audio service temporarily unavailable. Please try again later.';
            break;
          default:
            errorMessage = `Audio service error: ${res.status}`;
        }
        throw new Error(errorMessage);
      }
      
      const blob = await res.blob();
      if (!blob || blob.size === 0) {
        throw new Error("Received empty audio response");
      }
      
      const url = URL.createObjectURL(blob);
      objectUrlsRef.current.push(url);
      return url;
    } catch (error) {
      console.error("TTS Error:", error);
      setTtsError(error instanceof Error ? error.message : "Failed to generate audio");
      // Don't throw for retry attempts, just return null
      if (isRetry) {
        return null;
      }
      throw error;
    } finally {
      if (isRetry) {
        setIsRetrying(false);
      }
    }
  }, []);

  // Improved cleanup audio and revoke object URLs on unmount to prevent leaks
  useEffect(() => {
    return () => {
      try {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = "";
          audioRef.current = null;
        }
        for (const u of objectUrlsRef.current) {
          try {
            URL.revokeObjectURL(u);
          } catch (e) {
            console.warn('Failed to revoke object URL:', e);
          }
        }
        objectUrlsRef.current = [];
      } catch (e) {
        console.error('Error during audio cleanup:', e);
      }
    };
  }, []);

  const segments = useMemo(() => {
    const segs: string[] = [];
    // Build segments directly from lesson structure for speed
    if (typeof lesson?.introduction === "string") {
      const intro = lesson.introduction.trim();
      if (intro) segs.push(intro.length > 600 ? intro.slice(0, 600) : intro);
    }
    if (Array.isArray(lesson?.sections)) {
      for (const section of lesson.sections) {
        if (section?.content) {
          const c = String(section.content).trim();
          if (c) segs.push(c.length > 900 ? c.slice(0, 900) : c);
        }
      }
    }
    
    // Fallback to full text if no segments were created
    return segs.length ? segs : [getFullLessonText()].filter(text => text.trim().length > 0);
  }, [lesson, getFullLessonText]);

  const preloadTTS = useCallback(async () => {
    try {
      setIsTtsLoading(true);
      setTtsError(null); // Clear previous errors
      
      // If we have a structured lesson, use the lesson TTS endpoint
      if (lesson) {
        // For structured lessons, we can generate audio for the entire lesson
        const firstUrl = await fetchLessonTTSBlobUrl(lesson, "full");
        
        if (!firstUrl) {
          // If first attempt failed, try once more after a short delay
          await new Promise(resolve => setTimeout(resolve, 2000));
          const retryUrl = await fetchLessonTTSBlobUrl(lesson, "full", undefined, true /* isRetry */);
          if (retryUrl) {
            setAudioUrl(retryUrl);
            setAudioQueue([retryUrl]);
            setCurrentIndex(0);
          } else {
            throw new Error("Failed to generate audio after retry");
          }
        } else {
          setAudioUrl(firstUrl);
          setAudioQueue([firstUrl]);
          setCurrentIndex(0);
        }
        return;
      }
      
      // Fallback to text-based TTS if no structured lesson
      if (!segments.length) {
        throw new Error("No content available for text-to-speech");
      }
      
      const firstUrl = await fetchTTSBlobUrl(segments[0]);
      
      if (!firstUrl) {
        // If first attempt failed, try once more after a short delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        const retryUrl = await fetchTTSBlobUrl(segments[0], true /* isRetry */);
        if (retryUrl) {
          setAudioUrl(retryUrl);
          setAudioQueue([retryUrl]);
          setCurrentIndex(0);
          // Continue with preloading...
        } else {
          throw new Error("Failed to generate audio after retry");
        }
      } else {
        setAudioUrl(firstUrl);
        setAudioQueue([firstUrl]);
        setCurrentIndex(0);
        // Preload the next segment in background if available
        if (segments.length > 1) {
          setIsQueuePreloading(true);
          fetchTTSBlobUrl(segments[1])
            .then((u) => {
              if (u) {
                setAudioQueue((q) => [...q, u]);
              }
            })
            .catch((error) => {
              console.error("Error preloading next segment:", error);
              setTtsError(error instanceof Error ? error.message : "Failed to preload audio");
            })
            .finally(() => setIsQueuePreloading(false));
        }
      }
    } catch (e) {
      console.error("TTS Preload Error:", e);
      setTtsError(e instanceof Error ? e.message : "Failed to generate audio");
    } finally {
      setIsTtsLoading(false);
    }
  }, [lesson, segments, fetchTTSBlobUrl, fetchLessonTTSBlobUrl]);

  const playTTS = useCallback(() => {
    const src = audioQueue[currentIndexRef.current] || audioUrl;
    if (!src) {
      console.warn("No audio source available to play");
      setTtsError("No audio available to play");
      return;
    }
    
    if (!audioRef.current) {
      audioRef.current = new Audio(src);
      audioRef.current.addEventListener("play", () => setIsPlaying(true));
      audioRef.current.addEventListener("pause", () => setIsPlaying(false));
      audioRef.current.addEventListener("ended", async () => {
        const prevIndex = currentIndexRef.current;
        const nextIndex = prevIndex + 1;
        if (segments[nextIndex] && !audioQueue[nextIndex]) {
          try {
            const u = await fetchTTSBlobUrl(segments[nextIndex]);
            if (!u) {
              // If first attempt failed, try once more
              await new Promise(resolve => setTimeout(resolve, 1000));
              const retryUrl = await fetchTTSBlobUrl(segments[nextIndex], true /* isRetry */);
              if (retryUrl) {
                setAudioQueue((q) => {
                  const qq = [...q];
                  qq[nextIndex] = retryUrl;
                  return qq;
                });
              }
            } else {
              setAudioQueue((q) => {
                const qq = [...q];
                qq[nextIndex] = u;
                return qq;
              });
            }
          } catch (e) {
            console.error("Error loading next audio segment:", e);
            setTtsError(e instanceof Error ? e.message : "Failed to load next audio segment");
          }
        }
        setCurrentIndex(nextIndex);
        currentIndexRef.current = nextIndex;
        const nextSrc = audioQueue[nextIndex];
        if (nextSrc) {
          if (audioRef.current) {
            audioRef.current.src = nextSrc;
            audioRef.current.play().catch((error) => {
              console.error("Error playing audio:", error);
              setTtsError("Failed to play audio");
            });
          }
        } else {
          setIsPlaying(false);
        }
      });
    } else {
      audioRef.current.src = src;
    }
    
    audioRef.current.play().catch((error) => {
      console.error("Error playing audio:", error);
      setTtsError("Failed to play audio");
    });
  }, [audioUrl, audioQueue, segments, fetchTTSBlobUrl]);

  return (
    <div className={cn("lesson-card border rounded-xl p-6 space-y-6",
      isErrorResponse 
        ? "bg-red-500/10 border-red-500/20" 
        : "bg-white/5 border-white/10"
    )}>
      {/* header with logo and title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-lg",
            isErrorResponse ? "bg-red-500/20" : "bg-white/10"
          )}>
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-semibold">Lesson Preview</h2>
        </div>
        {lesson.quiz && lesson.quiz.length > 0 && !isErrorResponse && (
          <button
            onClick={handleTakeQuiz}
            className="px-3 py-1.5 text-sm bg-white text-black rounded-lg font-medium hover:bg-white/90 transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Take Quiz
          </button>
        )}
      </div>

      {/* lesson content */}
      <div className="space-y-4 text-sm">
        {isErrorResponse ? (
          // Show error content
          <div className="space-y-2">
            <h3 className="font-medium text-red-200">Service Temporarily Unavailable</h3>
            <p className="text-red-100/90 leading-relaxed">
              {lesson.introduction}
            </p>
            {lesson.sections && lesson.sections.length > 0 && (
              <div className="mt-3 p-3 bg-red-500/10 rounded-lg">
                <h4 className="font-medium text-red-200 mb-1">Suggestions</h4>
                <p className="text-red-100/80 text-xs">
                  {lesson.sections[0].content}
                </p>
              </div>
            )}
          </div>
        ) : (
          // Show normal lesson content
          <>
            {lesson?.introduction && (
              <div className="space-y-2">
                <h3 className="font-medium text-white/80">Introduction</h3>
                <p className="text-white/70 leading-relaxed">
                  {lesson.introduction}
                </p>
              </div>
            )}

            {Array.isArray(lesson?.sections) && lesson.sections.length > 0 && (
              <div className="space-y-3">
                {lesson.sections.map((section, idx) => (
                  <div key={idx} className="space-y-2">
                    {section.title && (
                      <h3 className="font-medium text-white/80">
                        {normalizeTitle(section.title)}
                      </h3>
                    )}
                    {section.content && (
                      <p className="text-white/70 leading-relaxed">
                        {section.content}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {lesson?.diagram && (
              <div className="space-y-2">
                <h3 className="font-medium text-white/80">Diagram</h3>
                <pre className="text-white/70 bg-black/20 p-3 rounded-lg text-xs whitespace-pre-wrap">
                  {lesson.diagram}
                </pre>
              </div>
            )}
          </>
        )}
      </div>

      {/* audio controls or error message */}
      {isErrorResponse ? (
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={() => window.location.reload()}
            className="px-3 py-1.5 text-sm bg-white/10 text-white rounded-lg font-medium hover:bg-white/20 transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Try Again
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={isPlaying ? () => audioRef.current?.pause() : playTTS}
            disabled={isTtsLoading || isRetrying}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </button>
          
          {isTtsLoading && (
            <div className="flex items-center gap-2 text-white/50 text-sm">
              <LoaderIcon className="w-4 h-4 animate-spin" />
              <span>Generating audio...</span>
            </div>
          )}
          
          {isRetrying && (
            <div className="flex items-center gap-2 text-white/50 text-sm">
              <LoaderIcon className="w-4 h-4 animate-spin" />
              <span>Retrying...</span>
            </div>
          )}
          
          {ttsError && (
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{ttsError}</span>
            </div>
          )}
          
          {!isTtsLoading && !isRetrying && (
            <button
              onClick={preloadTTS}
              className="text-xs text-white/50 hover:text-white/80 transition-colors"
            >
              Generate audio
            </button>
          )}
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* 4. chat                                                              */
/* ------------------------------------------------------------------ */
interface CommandSuggestion {
  icon: React.ReactNode;
  label: string;
  description: string;
  prefix: string;
  placeholder?: string;
  action?: () => void;
}
interface AnimatedAIChatProps {
  onNavigateToVideoLearning: (title: string) => void
  sessionId?: string        
  onSend?: () => void
}

export function AnimatedAIChat({ onNavigateToVideoLearning }: AnimatedAIChatProps) {
  /* --- state ------------------------------------------------------- */
  const [value, setValue] = useState("");
  const [attachments, setAttachments] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [inputFocused, setInputFocused] = useState(false);
  const [showVideoButton, setShowVideoButton] = useState(false);
  const [storedLong, setStoredLong] = useState("");
  const [lessonJson, setLessonJson] = useState<Lesson | null>(null);   // NEW
  const [mathSolution, setMathSolution] = useState<MathSolutionUI | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [error, setError] = useState<string | null>(null); 
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [showSaveMessage, setShowSaveMessage] = useState(false);
  const [userAge, setUserAge] = useState<number | null>(null);
  const router = useRouter();
  
  const { textareaRef: autoRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 60,
    maxHeight: 200,
  });

  /* --- command palette data ---------------------------------------- */
  const commandSuggestions: CommandSuggestion[] = [
    { icon: <PersonStandingIcon className="w-4 h-4" />, label: "Structured Lesson", description: "Detailed and structured breakdown of your topic.", prefix: "/lesson", placeholder: "Please input a topic for structured learning", action: () => handleModeClick("lesson") },
    { icon: <BookOpen className="w-4 h-4" />, label: "Maths Tutor", description: "Add maths equations for simple solutions with explainer", prefix: "/maths", placeholder: "Please input a maths question", action: () => handleModeClick("maths") },
    { icon: <Play className="w-4 h-4" />, label: "Chat", description: "Chat and ask your friendly AI", prefix: "/chat", placeholder: "Please input your question", action: () => handleModeClick("chat") },
    { icon: <Sparkles className="w-4 h-4" />, label: "Quick Answer", description: "Concise explanation", prefix: "/quick", placeholder: "Please input your question for a quick answer", action: () => handleModeClick("quick") },
  ];

  const modeSuggestions = [

    {
      icon: <Video className="w-4 h-4" />,
      label: "Explanation Mode",
      description: "Comprehensive AI explanations",
      action: () =>
        onNavigateToVideoLearning?.(
          value.trim() || "What would you like to learn?"
        ),
    },
    {
      icon: <Plus className="w-4 h-4" />, 
      label: "Add Term Plan",
      description: "Build a long-term study schedule",
      action: () => router.push("/term-plan"),
    },
  ];

  // Function to handle mode button clicks and activate command palette with placeholder text
  const handleModeClick = (mode: string) => {
    // Save the selected mode to session storage
    saveSelectedMode(mode);
    
    switch (mode) {
      case "lesson":
        setValue("/lesson ");
        break;
      case "maths":
        setValue("/maths ");
        break;
      case "chat":
        setValue("/chat ");
        break;
      case "quick":
        setValue("/quick ");
        break;
      default:
        // For any other mode, we don't set a specific value
        break;
    }
    setShowCommandPalette(true);
    // Focus the textarea after setting the value
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 0);
  };

  /* --- effects ----------------------------------------------------- */
  // Retrieve user age on component mount - ONLY for authenticated users
  useEffect(() => {
    const getUserAge = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        // Check for session error
        if (sessionError) {
          console.error('Error getting session:', sessionError);
          return;
        }
        
        // Only proceed if user is properly authenticated
        if (session?.user) {
          // First try to get age from user metadata
          const age = (session.user as any).user_metadata?.age;
          if (age) {
            const parsedAge = parseInt(age, 10);
            if (!isNaN(parsedAge) && parsedAge > 0) {
              setUserAge(parsedAge); // Ensure it's a valid number
              return;
            }
          }
          
          // If not in metadata, we don't have a users table, so we can't query it
          // The age should be in the user metadata from Supabase auth
          console.debug('User age not found in metadata, using null');
        }
      } catch (error) {
        console.error('Error retrieving user age:', error);
      }
    };
    
    getUserAge();
  }, []);

  useEffect(() => {
    if (value.startsWith("/") && !value.includes(" ")) {
      setShowCommandPalette(true);
      const idx = commandSuggestions.findIndex((cmd) => cmd.prefix.startsWith(value));
      setActiveSuggestion(idx);
    } else {
      setShowCommandPalette(false);
    }
  }, [value]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove); 
    };
  }, [mouseX, mouseY]);

  // Function to get the appropriate placeholder based on the current mode
  const getModePlaceholder = (): string => {
    if (value.startsWith("/lesson")) {
      return "/lesson - Please input a topic for structured learning";
    } else if (value.startsWith("/maths")) {
      return "/maths - Please input a maths question";
    } else if (value.startsWith("/chat")) {
      return "/chat - Please input your question";
    } else if (value.startsWith("/quick")) {
      return "/quick - Please input your question for a quick answer";
    }
    return "What would you like to learn today?";
  };

  // Function to get the current mode from input value
  const getCurrentMode = (inputValue: string): string => {
    const modeMatch = inputValue.match(/^\/?(\w+)\s*/);
    const SUPPORTED_MODES = ['chat', 'quick', 'lesson', 'maths'];
    if (modeMatch && SUPPORTED_MODES.includes(modeMatch[1].toLowerCase())) {
      return modeMatch[1].toLowerCase();
    }
    return 'lesson'; // Default mode
  };

  /* --- handlers ---------------------------------------------------- */
  const handleSendMessage = async () => {
    const q = value.trim();
    if (!q) return;

    // Reset retry count for new requests
    setRetryCount(0);
    setError(null); // Clear previous errors for new requests
    
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setIsTyping(true);
    setStreamingText("");
    setStoredLong("");
    setShowVideoButton(false);
    setLessonJson(null);

    // Handle mode-based routing for chat, quick, maths, and lesson modes
    const modeMatch = q.match(/^\/?(\w+)\s*(.*)/);
    const SUPPORTED_MODES = ['chat', 'quick', 'lesson', 'maths'];
    const mode = modeMatch && SUPPORTED_MODES.includes(modeMatch[1].toLowerCase()) 
      ? modeMatch[1].toLowerCase() 
      : 'lesson'; // Standardized to 'lesson' mode
    const cleanText = modeMatch && SUPPORTED_MODES.includes(modeMatch[1].toLowerCase()) 
      ? modeMatch[2] 
      : q;
    
    // Ensure we have a proper message for the API
    const apiMessage = cleanText.trim() || q;
    
    // For all modes, use the new chat API endpoint
    if (SUPPORTED_MODES.includes(mode)) {
      try {
        // Get session ID for user identification
        const sid = localStorage.getItem("lana_sid") || `guest_${Date.now()}`;
        
        // Prepare request payload
        const payload: any = {
          userId: sid,
          message: apiMessage,
          age: userAge,
          mode: mode
        };
        
        // Check rate limit before making request
        const endpoint = '/api/chat';
        if (!rateLimiter.isAllowed(endpoint)) {
          const waitTime = rateLimiter.getTimeUntilNextRequest(endpoint);
          setError(`Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds before trying again.`);
          setIsTyping(false);
          return;
        }
        
        // Make API call to chat endpoint
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          signal: abortRef.current.signal,
        });
        
        if (!response.ok) {
          let errorMessage = "Failed to get response from server";
          switch (response.status) {
            case 400:
              errorMessage = "Invalid request. Please try rephrasing your question.";
              break;
            case 401:
              errorMessage = "Authentication required. Please log in again.";
              break;
            case 429:
              errorMessage = "Too many requests. Please wait a moment and try again.";
              break;
            case 500:
              errorMessage = "Server error. Please try again later.";
              break;
            case 503:
              errorMessage = "Service temporarily unavailable. Please try again later.";
              break;
            default:
              errorMessage = `Server error (${response.status}). Please try again later.`;
          }
          throw new Error(errorMessage);
        }
        
        const chatResponse = await response.json();
        
        // Handle the response based on mode
        if (chatResponse.error) {
          setError(chatResponse.error);
        } else {
          // For chat mode, display the reply directly
          if (chatResponse.mode === 'chat') {
            setStreamingText(chatResponse.reply);
            setStoredLong(chatResponse.reply);
          } 
          // For quick mode, display the reply directly
          else if (chatResponse.mode === 'quick') {
            setStreamingText(chatResponse.reply);
            setStoredLong(chatResponse.reply);
          }
          // For lesson mode, handle as structured lesson
          else if (chatResponse.mode === 'lesson') {
            // Parse the reply as JSON if it's a structured lesson
            try {
              const lessonData = typeof chatResponse.reply === 'string' ? JSON.parse(chatResponse.reply) : chatResponse.reply;
              setLessonJson(lessonData);
            } catch (parseError) {
              // If parsing fails, check if it's already a valid lesson object
              if (typeof chatResponse.reply === 'object' && chatResponse.reply !== null) {
                setLessonJson(chatResponse.reply);
              } else {
                // If it's plain text, display it as regular text
                setStreamingText(typeof chatResponse.reply === 'string' ? chatResponse.reply : JSON.stringify(chatResponse.reply));
                setStoredLong(typeof chatResponse.reply === 'string' ? chatResponse.reply : JSON.stringify(chatResponse.reply));
              }
            }
          }
          // For maths mode, handle as math solution
          else if (chatResponse.mode === 'maths') {
            // Parse the reply as JSON if it's a math solution
            try {
              const mathData = typeof chatResponse.reply === 'string' ? JSON.parse(chatResponse.reply) : chatResponse.reply;
              setMathSolution(mathData);
            } catch (parseError) {
              // If parsing fails, check if it's already a valid math solution object
              if (typeof chatResponse.reply === 'object' && chatResponse.reply !== null) {
                setMathSolution(chatResponse.reply);
              } else {
                // If it's plain text, display it as regular text
                setStreamingText(typeof chatResponse.reply === 'string' ? chatResponse.reply : JSON.stringify(chatResponse.reply));
                setStoredLong(typeof chatResponse.reply === 'string' ? chatResponse.reply : JSON.stringify(chatResponse.reply));
              }
            }
          }
          // For other modes, display the reply directly
          else {
            setStreamingText(chatResponse.reply);
            setStoredLong(chatResponse.reply);
          }
        }
        
        setIsTyping(false);
        setShowVideoButton(true);
        
        // Save search history
        const savePromise = saveSearch(apiMessage.trim()).catch(console.error);
        await savePromise;
        
        return;
      } catch (e: unknown) {
        if (e instanceof Error && e.name === "AbortError") {
          if (process.env.NODE_ENV === 'development') console.debug('[chat] aborted');
          setError("Request was cancelled or timed out. Please try again.");
        } else {
          const errorMessage = e instanceof Error ? e.message : "Chat request failed";
          setError(errorMessage);
          if (process.env.NODE_ENV === 'development') {
            console.error('[chat] error', e);
          }
        }
      } finally {
        setIsTyping(false);
        setValue('');
      }
      return;
    }

    // legacy video path
    if (q.startsWith("/video")) {
      const sid = localStorage.getItem("lana_sid") || "";
      const es = new EventSource(
        `/ask/stream?q=${encodeURIComponent(q)}&sid=${encodeURIComponent(sid)}`,
        { withCredentials: false }
      );
      es.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data);
          if (data.error) {
            setError("Error: " + data.error);
            es.close();
            setIsTyping(false);
            return;
          }
          if (data.short !== undefined) setStreamingText(data.short);
          if (data.long) setStoredLong(data.long);
          if (data.done) {
            es.close();
            setIsTyping(false);
            setShowVideoButton(true);
          }
        } catch (e) {
          console.error('Error parsing EventSource data:', e);
          setError('Failed to parse response data');
          es.close();
          setIsTyping(false);
        }
      };
      es.onerror = (e) => {
        console.error('EventSource error:', e);
        setError("Connection failed");
        es.close();
        setIsTyping(false);
      };
      abortRef.current.signal.addEventListener("abort", () => es.close());
      return;
    }

    // Default structured lesson path for non-prefixed inputs
    try {
      // Debug: surface API base and outgoing topic
      if (process.env.NODE_ENV === 'development') {
        console.info('[homepage lesson-stream] request', { API_BASE, topic: q, age: userAge })
      }
      
      // Check rate limit before making request
      const endpoint = '/api/structured-lesson';
      if (!rateLimiter.isAllowed(endpoint)) {
        const waitTime = rateLimiter.getTimeUntilNextRequest(endpoint);
        setError(`Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds before trying again.`);
        setIsTyping(false);
        return;
      }
      
      const lessonEndpoint = '/api/structured-lesson';
      const response = await fetch(lessonEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: q, age: userAge }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        // Handle specific HTTP errors with user-friendly messages
        let errorMessage = "Failed to get response from server";
        switch (response.status) {
          case 400:
            errorMessage = "Invalid request. Please try rephrasing your question.";
            break;
          case 401:
            errorMessage = "Authentication required. Please log in again.";
            break;
          case 429:
            errorMessage = "Too many requests. Please wait a moment and try again.";
            break;
          case 500:
            errorMessage = "Server error. Please try again later.";
            break;
          case 503:
            errorMessage = "Service temporarily unavailable. Please try again later.";
            break;
          default:
            errorMessage = `Server error (${response.status}). Please try again later.`;
        }
        throw new Error(errorMessage);
      }

      // Handle non-streaming response (regular JSON)
      const finalLesson = await response.json();
      
      // Validate and sanitize the lesson response
      if (!isValidLessonResponse(finalLesson)) {
        console.warn('[homepage lesson] Invalid lesson response structure', finalLesson);
        // Try to sanitize the content
        const sanitizedLesson = sanitizeLessonContent(finalLesson);
        if (!isValidLessonResponse(sanitizedLesson)) {
          // If still invalid, show an error
          setError("Received an invalid response format from the server. Please try again.");
          setIsTyping(false);
          return;
        }
        setLessonJson(sanitizedLesson);
      } else {
        // Even if valid, sanitize the content for display
        const sanitizedLesson = sanitizeLessonContent(finalLesson);
        setLessonJson(sanitizedLesson);
      }
      
      setShowVideoButton(true);
      setIsTyping(false);
      
      if (process.env.NODE_ENV === 'development') {
        const introPreview = (finalLesson?.introduction || '').slice(0, 120);
        console.info('[homepage lesson] done', { topicSent: q, introPreview });
      }
      
      // Start save search immediately (parallel processing)
      const savePromise = saveSearch(q.trim()).then(saveResult => {
        console.log('✅ saveSearch result:', saveResult);
        // Only show messages for unauthenticated users or actual errors
        if (saveResult?.message && (saveResult.suggestion || !saveResult.success)) {
          // Only show messages to unauthenticated users
          // Authenticated users don't need to see success messages about saving to history
          setSaveMessage(saveResult.message);
          setShowSaveMessage(true);
          setTimeout(() => {
            setShowSaveMessage(false);
            setTimeout(() => setSaveMessage(null), 300);
          }, 5000);
        }
      }).catch(console.error);
      
      // Ensure save completes
      await savePromise;
      return;
    } catch (e: unknown) {
      if (e instanceof Error && e.name === "AbortError") {
        console.log("Request aborted");
        setError("Request cancelled");
      } else {
        const errorMessage = e instanceof Error ? e.message : "An unexpected error occurred";
        setError(errorMessage);
        console.error('[homepage lesson-stream] catch', e);
      }
      
      // Only retry for network-related errors or server errors, not client errors
      if (retryCount < MAX_RETRIES) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, retryCount) * 1000;
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          handleSendMessage();
        }, delay); 
      }
    } finally {
      // Don't clear the input value on error so user can retry
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showCommandPalette) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveSuggestion((p) => (p < commandSuggestions.length - 1 ? p + 1 : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveSuggestion((p) => (p > 0 ? p - 1 : commandSuggestions.length - 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (activeSuggestion >= 0) {
          const cmd = commandSuggestions[activeSuggestion];
          if (cmd.action) {
            cmd.action();
          } else {
            setValue(cmd.prefix);
            setShowCommandPalette(false);
            // Focus the textarea after selection
            setTimeout(() => {
              if (textareaRef.current) {
                textareaRef.current.focus();
              }
            }, 0);
          }
        }
      }
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleAttachFile = () =>
    setAttachments((prev) => [...prev, `file-${Math.random().toString(36).slice(2)}.pdf`]);

  const removeAttachment = (idx: number) =>
    setAttachments((prev) => prev.filter((_, i) => i !== idx));

  /* ------------------------------------------------------------------ */
  /* render                                                             */
  /* ------------------------------------------------------------------ */
  return (
    <div className="flex flex-col w-full items-center justify-center bg-transparent text-white p-6 relative overflow-hidden min-h-[calc(100vh-3rem)]">
      {/* animated blobs */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-[128px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gray-300/5 rounded-full blur-[128px] animate-pulse delay-700" />
        <div className="absolute top-1/4 right-1/3 w-64 h-64 bg-white/2 rounded-full blur-[96px] animate-pulse delay-1000" />
      </div>

      <div className="w-full max-w-2xl mx-auto relative">
        <motion.div
          className="relative z-10 space-y-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
        {/* Save message notification */}
        <AnimatePresence>
          {saveMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: showSaveMessage ? 1 : 0, y: showSaveMessage ? 0 : -10 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="mb-6"
            >
              <div className={cn(
                "border rounded-xl p-3 text-sm max-w-md mx-auto",
                saveMessage.includes('saved') || saveMessage.includes('history') 
                  ? "bg-green-500/10 border-green-500/20 text-green-200" 
                  : "bg-blue-500/10 border-blue-500/20 text-blue-200"
              )}>
                {saveMessage}
                {saveMessage.includes('consider registering') && (
                  <button 
                    onClick={() => router.push('/register')} 
                    className="ml-2 text-blue-300 hover:text-blue-100 underline"
                  >
                    Register
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hero section */}
        <div className="text-center space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="space-y-4"
          >
            {/* centred, bigger logo */}
            <div className="flex justify-center">
              <Logo
                width={160}
                height={100}
                className="object-contain"
              />
            </div>

            <motion.div
              className="h-px bg-gradient-to-r from-transparent via-white/30 to-transparent max-w-md mx-auto"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "100%", opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            />

            <motion.p
              className="text-lg text-white/70 max-w-lg mx-auto leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
                Get simple and clear breakdowns—any time.
              </motion.p>
            </motion.div>
          </div>

          {/* chat card */}
          <motion.div
            className="relative backdrop-blur-2xl bg-white/5 rounded-2xl border border-white/10 shadow-2xl"
            initial={{ scale: 0.98 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            {/* command palette */}
            <AnimatePresence>
              {showCommandPalette && (
                <motion.div
                  className="absolute left-4 right-4 bottom-full mb-2 backdrop-blur-xl bg-black/90 rounded-lg z-50 shadow-lg border border-white/10 overflow-hidden"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  transition={{ duration: 0.15 }}
                >
                  {commandSuggestions.map((s, idx) => (
                    <motion.div
                      key={s.prefix}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 text-xs transition-colors cursor-pointer",
                        activeSuggestion === idx
                          ? "bg-white/10 text-white"
                          : "text-white/70 hover:bg-white/5"
                      )}
                      onClick={() => {
                        if (s.action) {
                          s.action();
                        } else {
                          setValue(s.prefix);
                          setShowCommandPalette(false);
                        }
                        // Focus the textarea after selection
                        setTimeout(() => {
                          if (textareaRef.current) {
                            textareaRef.current.focus();
                          }
                        }, 0);
                      }}
                    >
                      <div className="w-5 h-5 flex-center text-white/60">{s.icon}</div>
                      <div className="font-medium">{s.label}</div>
                      <div className="text-white/40 ml-1">{s.prefix}</div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* input area */}
            <div className="p-4">
              <Textarea
                ref={(node) => {
                  (autoRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
                  if (textareaRef.current !== node) (textareaRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
                }}
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  adjustHeight();
                }}
                onKeyDown={handleKeyDown}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                placeholder={getModePlaceholder()}
                mode={getCurrentMode(value)}
                containerClassName="w-full"
                className="w-full px-4 py-3 resize-none bg-transparent border-none text-white/90 text-sm placeholder:text-white/30 min-h-[60px]"
                showRing={false}
              />
            </div>

            {/* Response area */}
            {error && (
              <div className="px-4 pb-4">
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-200 text-sm"
                >
                  {error}
                  <button 
                    onClick={() => setError(null)} 
                    className="ml-2 text-red-300 hover:text-red-100"
                  >
                    ✕
                  </button>
                </motion.div>
              </div>
            )}

            {lessonJson && (
              <div className="px-4 pb-4">
                <StructuredLessonCard 
                  lesson={lessonJson} 
                  isStreamingComplete={!isTyping} 
                />
              </div>
            )}

            {/* attachments */}
            <AnimatePresence>
              {attachments.length > 0 && (
                <motion.div
                  className="px-4 pb-3 flex gap-2 flex-wrap"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  {attachments.map((file, idx) => (
                    <motion.div
                      key={idx}
                      className="flex items-center gap-2 text-xs bg-white/5 py-1.5 px-3 rounded-lg text-white/80 border border-white/10"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                    >
                      <span>{file}</span>
                      <button
                        onClick={() => removeAttachment(idx)}
                        className="text-white/50 hover:text-white"
                      >
                        <XIcon className="w-3 h-3" />
                      </button>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* bottom bar */}
            <div className="p-4 border-t border-white/10 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <motion.button
                  type="button"
                  onClick={handleAttachFile}
                  whileTap={{ scale: 0.94 }}
                  className="p-2 text-white/50 hover:text-white rounded-lg"
                >
                  <Paperclip className="w-4 h-4" />
                </motion.button>
                <motion.button
                  onClick={() => setShowCommandPalette((p) => !p)}
                  whileTap={{ scale: 0.94 }}
                  className="p-2 text-white/50 hover:text-white rounded-lg"
                >
                  <Command className="w-4 h-4" />
                </motion.button>
              </div>

              <motion.button
                onClick={handleSendMessage}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                disabled={!value.trim() || isTyping}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2",
                  value.trim() && !isTyping
                    ? "bg-white text-black shadow-lg shadow-white/20"
                    : "bg-white/10 text-white/50"
                )}
              >
                {isTyping ? (
                  <LoaderIcon className="w-4 h-4 animate-spin" />
                ) : (
                  <SendIcon className="w-4 h-4" />
                )}
                <span>Search</span>
              </motion.button>
            </div>

            {/* "Create video lesson" button */}
            {showVideoButton && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 border-t border-white/10"
              >
                <button
                  onClick={() => onNavigateToVideoLearning?.(
                    lessonJson?.introduction?.split('\n')[0] || value.trim() || "Generated Lesson"
                  )}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white"
                >
                  <Video className="w-4 h-4" />
                  <span>Create lesson</span>
                </button>
              </motion.div>
            )}
          </motion.div>

          {/* mode buttons */}
          <div className="w-full mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto">
            {modeSuggestions.map((mode, idx) => (
              <motion.button
                key={mode.label}
                onClick={mode.action}
                className="group flex items-center gap-3 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-sm text-white/80 hover:text-white transition-all border border-white/10 hover:border-white/20 min-w-[180px]"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="text-white/70 group-hover:text-white transition-colors">
                  {mode.icon}
                </div>
                <div className="flex flex-col items-start">
                  <span className="font-medium">{mode.label}</span>
                  <span className="text-xs text-white/50 group-hover:text-white/80 transition-colors">
                    {mode.description}
                  </span>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* mouse glow — optimized, no re-renders */}
      {inputFocused && !lessonJson && (
        <motion.div
          className="fixed w-[50rem] h-[50rem] rounded-full pointer-events-none z-0 opacity-5 bg-gradient-to-r from-white via-gray-200 to-white blur-2xl"
          style={{
            x: mouseX,
            y: mouseY,
            translateX: "-50%",
            translateY: "-50%",
          }}
          transition={{ type: "spring", damping: 25, stiffness: 150, mass: 0.5 }}
        />
      )}
    </div>
  );
}