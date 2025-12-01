"use client";

import React, { useEffect, useRef, useCallback, useState, useMemo } from "react";
import { cn, fetchWithTimeoutAndRetry } from "@/lib/utils";
import { z } from "zod";
import DOMPurify from "isomorphic-dompurify";
import rateLimiter from "@/lib/rate-limiter";
import { getSelectedMode, saveSelectedMode } from "@/lib/mode-storage";
import { isValidLessonResponse, isValidMathSolutionResponse, sanitizeLessonContent, sanitizeMathSolutionContent } from "@/lib/response-validation";
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
  RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import VideoLearningPage from "./personalised-Ai-tutor";
import { useMotionValue } from "framer-motion";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import Logo from '@/components/logo';
import { saveSearch } from '@/lib/search'
import { getCurrentUserAge } from '@/lib/services/userService';
import { isGuestClient } from '@/lib/guest';
import { createClient } from '@/lib/supabase/client';

// Centralized API base with optional proxying via Next.js rewrites
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

export default function AnimatedChatWithVideo() {
  const [question, setQuestion] = useState("");
  const handleNavigate = (text: string) => setQuestion(text.trim());

  return question ? (
    <VideoLearningPage 
      question={question} 
      onBack={() => setQuestion("")}
    />
  ) : (
    <AnimatedAIChat
      onNavigateToVideoLearning={handleNavigate}
      onSend={() => {}}
    />
  );
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
}
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, containerClassName, showRing = true, ...props }, ref) => {
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
            className="absolute inset-0 rounded-md pointer-events-none ring-2 ring-white/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

/* ------------------------------------------------------------------ */
/* NEW lesson card component (inline)                                 */
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
      // Check if we have a lesson ID to use the new endpoint
      if (lesson?.id) {
        // Use the new endpoint that retrieves quiz by lesson ID
        router.push(`/quiz?lessonId=${lesson.id}`);
        return;
      }
      
      // Fallback to the old method if no lesson ID is available
      if (!lesson?.quiz || !Array.isArray(lesson.quiz) || lesson.quiz.length === 0) {
        console.warn("No quiz data available", lesson?.quiz);
        return;
      }
      
      // Transform quiz data to match frontend expectations
      const transformedQuiz = lesson.quiz.map((item: any) => ({
        q: item.q || item.question || "",  // Handle both 'q' and 'question' properties
        options: Array.isArray(item.options) ? item.options : [],
        answer: item.answer || ""
      })).filter(item => item.q && item.options.length > 0);
      
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
  const blocks: { title?: string; content: string }[] = [];

  // TTS state and actions
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isTtsLoading, setIsTtsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioQueue, setAudioQueue] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentIndexRef = useRef(0);
  const [isQueuePreloading, setIsQueuePreloading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex]);

  const getFullLessonText = useCallback(() => {
    const lines: string[] = [];
    for (const b of blocks) {
      if (b.title) lines.push(`${b.title}`);
      lines.push(b.content);
    }
    return lines.join("\n\n");
  }, [blocks]);

  const objectUrlsRef = useRef<string[]>([]);
  const fetchTTSBlobUrl = useCallback(async (text: string, isRetry = false) => {
    try {
      if (isRetry) {
        setIsRetrying(true);
      }
      
      // Check rate limit before making request
      const endpoint = '/api/tts';
      if (!rateLimiter.isAllowed(endpoint)) {
        const waitTime = rateLimiter.getTimeUntilNextRequest(endpoint);
        throw new Error(`Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds before trying again.`);
      }
      
      // Use the API base for TTS requests to ensure proper routing
      const res = await fetch(`${API_BASE}/api/tts/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) {
        // Handle different error cases
        if (res.status === 503) {
          throw new Error('Audio service temporarily unavailable. Please try again later.');
        } else if (res.status === 400) {
          throw new Error('Invalid request to audio service.');
        } else {
          throw new Error(`Audio service error: ${res.status}`);
        }
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      objectUrlsRef.current.push(url);
      return url;
    } finally {
      if (isRetry) {
        setIsRetrying(false);
      }
    }
  }, []);

  // Cleanup audio and revoke object URLs on unmount to prevent leaks
  useEffect(() => {
    return () => {
      try {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = "";
        }
        for (const u of objectUrlsRef.current) {
          URL.revokeObjectURL(u);
        }
        objectUrlsRef.current = [];
      } catch (e) {
        // Swallow cleanup errors
      }
    };
  }, []);

  const segments = useMemo(() => {
    const segs: string[] = [];
    // Build segments directly from lesson structure for speed
    if (typeof lesson?.introduction === "string") {
      const intro = lesson.introduction.trim();
      segs.push(intro.length > 600 ? intro.slice(0, 600) : intro);
    }
    if (Array.isArray(lesson?.sections)) {
      for (const section of lesson.sections) {
        if (section?.content) {
          const c = String(section.content).trim();
          if (c) segs.push(c.length > 900 ? c.slice(0, 900) : c);
        }
      }
    }
    return segs.length ? segs : [getFullLessonText()];
  }, [lesson, getFullLessonText]);

  const preloadTTS = useCallback(async () => {
    try {
      setIsTtsLoading(true);
      if (!segments.length) return;
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
        }
      }
      
      if (firstUrl) {
        setAudioUrl(firstUrl);
        setAudioQueue([firstUrl]);
        setCurrentIndex(0);
        // Preload the next segment in background if available
        if (segments.length > 1) {
          setIsQueuePreloading(true);
          fetchTTSBlobUrl(segments[1])
            .then((u) => setAudioQueue((q) => [...q, u]))
            .catch(console.error)
            .finally(() => setIsQueuePreloading(false));
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsTtsLoading(false);
    }
  }, [segments, fetchTTSBlobUrl]);

  const playTTS = useCallback(() => {
    const src = audioQueue[currentIndexRef.current] || audioUrl;
    if (!src) return;
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
                  const qq = q.slice();
                  qq[nextIndex] = retryUrl;
                  return qq;
                });
              }
            } else {
              setAudioQueue((q) => {
                const qq = q.slice();
                qq[nextIndex] = u;
                return qq;
              });
            }
          } catch (e) {
            console.error(e);
          }
        }
        setCurrentIndex(nextIndex);
        currentIndexRef.current = nextIndex;
        const nextSrc = audioQueue[nextIndex];
        if (nextSrc) {
          if (audioRef.current) {
            audioRef.current.src = nextSrc;
            audioRef.current.play().catch(console.error);
          }
        } else {
          setIsPlaying(false);
        }
      });
    } else {
      audioRef.current.src = src;
    }
    audioRef.current.play().catch(console.error);
  }, [audioUrl, audioQueue, segments, fetchTTSBlobUrl]);

  const togglePlayPause = useCallback(async () => {
    if (isTtsLoading || isQueuePreloading || isRetrying) return;
    const hasPrepared = !!(audioUrl || audioQueue.length);
    if (!audioRef.current) {
      if (!hasPrepared) {
        await preloadTTS();
      }
      playTTS();
      return;
    }
    if (audioRef.current.paused) {
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
  }, [audioUrl, audioQueue, isTtsLoading, isQueuePreloading, isRetrying, preloadTTS, playTTS]);

  // Auto-preload audio once streaming completes to reduce wait time
  useEffect(() => {
    if (isStreamingComplete && !audioUrl && !isTtsLoading && !isRetrying) {
      preloadTTS();
    }
  }, [isStreamingComplete, audioUrl, isTtsLoading, isRetrying, preloadTTS]);

  // Handle error responses differently
  if (isErrorResponse) {
    blocks.push({ 
      title: "Service Temporarily Unavailable", 
      content: lesson.introduction || "We're experiencing high demand. Please try again in a few minutes." 
    });
    
    // Add helpful suggestions
    if (lesson.sections && lesson.sections.length > 0) {
      blocks.push({ 
        title: lesson.sections[0].title || "Suggestions", 
        content: lesson.sections[0].content || "1. Try rephrasing your question\n2. Ask about a different topic\n3. Check back in a few minutes" 
      });
    }
  } else {
    if (lesson.introduction && typeof lesson.introduction === "string" && lesson.introduction.trim()) {
      blocks.push({
        title: "Introduction",
        content: lesson.introduction.trim(),
      });
    }

    if (
      Array.isArray(lesson.classifications) &&
      lesson.classifications.length > 0
    ) {
      const classificationContent = lesson.classifications
        .map((c: { type?: string; description?: string }) => {
          if (c?.type && c?.description) {
            return `• ${c.type}: ${c.description}`;
          }
          return null;
        })
        .filter(Boolean)
        .join("\n");

      if (classificationContent) {
        blocks.push({
          title: "Classifications / Types",
          content: classificationContent,
        });
      }
    }

    // Detailed sections (now after classifications)
    if (Array.isArray(lesson.sections)) {
      for (const section of lesson.sections) {
        if (section?.title && section?.content && section.title.trim() && section.content.trim()) {
          blocks.push({
            title: normalizeTitle(section.title.trim()),
            content: section.content.trim(),
          });
        }
      }
    }

    if (lesson.diagram && lesson.diagram.trim()) {
      blocks.push({
        title: "Diagram Description",
        content: lesson.diagram.trim(),
      });
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6 max-w-3xl mx-auto"
    >
      <div className={cn("rounded-xl p-6 border space-y-6", 
        isErrorResponse 
          ? "bg-red-500/10 border-red-500/20" 
          : "bg-white/5 backdrop-blur-sm border-white/10"
      )}>
        {blocks.map((block, idx) => (
          <div key={idx} className="space-y-2">
            {block.title && (
              <h3 className={cn("font-bold tracking-wide", 
                isErrorResponse ? "text-red-200 text-lg" : "text-white text-lg"
              )}>
                {block.title}
              </h3>
            )}
            <div className={cn("text-sm leading-relaxed whitespace-pre-wrap font-sans", 
              isErrorResponse ? "text-red-100/90" : "text-white/85"
            )}>
              {block.content.split("\n").map((line, i) => (
                <div key={i}>{sanitizeLine(line) || "\u00A0"}</div>
              ))}
            </div>
          </div>
        ))}

        {!blocks.length && (
          <p className="text-white/60 italic text-sm">No lesson content available.</p>
        )}
      </div>

      {/* Show error-specific message or normal controls */}
      {isErrorResponse ? (
        <div className="flex justify-end mt-6">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => window.location.reload()}
            className="px-5 py-2 bg-white/10 text-white rounded-lg text-sm font-medium border border-white/20 hover:bg-white/20 transition-shadow flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Try Again
          </motion.button>
        </div>
      ) : (
        /* ➤ ONLY SHOW LISTEN + QUIZ AFTER STREAMING COMPLETES */
        isStreamingComplete && (
          <div className="flex justify-end mt-6 gap-3">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={togglePlayPause}
              disabled={isTtsLoading || isQueuePreloading || isRetrying}
              aria-pressed={isPlaying}
              className="px-5 py-2 bg-white/10 text-white rounded-lg text-sm font-medium border border-white/20 hover:bg-white/20 transition-shadow flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isTtsLoading || isQueuePreloading || isRetrying ? (
                <LoaderIcon className="w-3.5 h-3.5 animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-3.5 h-3.5" />
              ) : (
                <Play className="w-3.5 h-3.5" />
              )}
              {isTtsLoading || isQueuePreloading || isRetrying
                ? "Preparing audio…"
                : isPlaying
                ? "Pause"
                : audioUrl || audioQueue.length
                ? "Play"
                : "Prepare & Listen"}
            </motion.button>

            {lesson.quiz && lesson.quiz.length > 0 && (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleTakeQuiz}
                className="px-5 py-2 bg-white text-black rounded-lg text-sm font-medium shadow-md hover:shadow-lg transition-shadow flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Take Quiz
              </motion.button>
            )}
          </div>
        )
      )}
    </motion.div>
  );
};

/* ------------------------------------------------------------------ */
/* NEW math solution card component                                   */
/* ------------------------------------------------------------------ */

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

const MathSolutionCard = ({ data }: { data: MathSolutionUI }) => {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const buildSummaryText = useCallback(() => {
    const steps = (data.steps || []).slice(0, 2);
    const stepText = steps
      .map((s, i) => `${i + 1}. ${s.description}${s.expression ? ` (${s.expression})` : ''}`)
      .join("; ");
    return `For the problem: ${data.problem}. The final answer is ${data.solution}. Steps: ${stepText}.`;
  }, [data]);

  const fetchTTSBlobUrl = useCallback(async (text: string) => {
    setIsLoading(true);
    try {
      // Check rate limit before making request
      const endpoint = '/api/tts';
      if (!rateLimiter.isAllowed(endpoint)) {
        const waitTime = rateLimiter.getTimeUntilNextRequest(endpoint);
        throw new Error(`Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds before trying again.`);
      }
      
      // Use the API base for TTS requests to ensure proper routing
      const res = await fetch(`${API_BASE}/api/tts/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error(`Audio error ${res.status}`);
      const blob = await res.blob();
      return URL.createObjectURL(blob);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const togglePlay = useCallback(async () => {
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio();
        audioRef.current.onended = () => setIsPlaying(false);
      }
      if (!audioUrl) {
        const text = buildSummaryText();
        const url = await fetchTTSBlobUrl(text);
        setAudioUrl(url);
        audioRef.current.src = url;
      }
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (e) {
      console.error('Math TTS playback error', e);
    }
  }, [audioUrl, isPlaying, buildSummaryText, fetchTTSBlobUrl]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  if (data.error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-200 text-sm">
        {data.error}
      </div>
    );
  }

  return (
    <motion.div
      className="lesson-card p-5 bg-white/5 rounded-xl border border-white/10"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg">Math Solution</h2>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={togglePlay}
          className="px-4 py-1.5 bg-white text-black rounded-md text-xs font-medium shadow hover:shadow-md"
          disabled={isLoading}
        >
          {isLoading ? "Preparing…" : isPlaying ? "Pause" : "Play"}
        </motion.button>
      </div>
      <div className="space-y-3">
        <div className="text-white/80 text-sm">Problem</div>
        <div className="bg-white/5 border border-white/10 rounded-md p-3 text-white/90 text-sm">{data.problem}</div>
        <div className="text-white/80 text-sm mt-2">Final Answer</div>
        <div className="bg-white/10 border border-white/20 rounded-md p-3 text-white text-base font-semibold">{data.solution}</div>
        {data.steps && data.steps.length > 0 && (
          <div className="mt-3">
            <div className="text-white/80 text-sm mb-1">Steps</div>
            <ul className="space-y-1 text-white/90 text-sm">
              {data.steps.map((s, idx) => (
                <li key={idx} className="flex gap-2">
                  <span className="text-white/50">{idx + 1}.</span>
                  <span>{s.description}{s.expression ? ` — ${s.expression}` : ''}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </motion.div>
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
  
  // Initialize with stored mode if available
  useEffect(() => {
    const storedMode = getSelectedMode();
    if (storedMode) {
      // Set the initial value based on the stored mode
      switch (storedMode) {
        case "lesson":
          setValue("/lesson ");
          break;
        case "maths":
          setValue("/Maths ");
          break;
        case "chat":
          setValue("/Chat ");
          break;
        case "quick":
          setValue("/quick ");
          break;
        default:
          // For any other mode or default, we don't set a specific value
          break;
      }
    }
  }, []);
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
  const streamingThrottleRef = useRef<{ latestShort?: string; latestLong?: string; lastFlushTs: number; timer?: ReturnType<typeof setTimeout> | null }>({ lastFlushTs: 0, timer: null });
  const flushStreamingUpdates = useCallback(() => {
    const latestShort = streamingThrottleRef.current.latestShort;
    const latestLong = streamingThrottleRef.current.latestLong;
    if (latestShort !== undefined) setStreamingText(latestShort);
    if (latestLong !== undefined) setStoredLong(latestLong);
    streamingThrottleRef.current.lastFlushTs = Date.now();
    streamingThrottleRef.current.timer = null;
  }, []);
  useEffect(() => {
    return () => {
      if (streamingThrottleRef.current.timer) {
        clearTimeout(streamingThrottleRef.current.timer);
        streamingThrottleRef.current.timer = null;
      }
    };
  }, []);
  const [lessonJson, setLessonJson] = useState<Lesson | null>(null);   // NEW
  const [mathSolution, setMathSolution] = useState<MathSolutionUI | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const stallTickerRef = useRef<ReturnType<typeof setInterval> | null>(null);
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
    { icon: <BookOpen className="w-4 h-4" />, label: "Maths Tutor", description: "Add maths equations for simple solutions with explainer", prefix: "/Maths", placeholder: "Please input a maths question", action: () => handleModeClick("maths") },
    { icon: <Play className="w-4 h-4" />, label: "Chat", description: "Chat and ask your friendly AI", prefix: "/Chat", placeholder: "Please input your question", action: () => handleModeClick("chat") },
    { icon: <Sparkles className="w-4 h-4" />, label: "Quick Answer", description: "Concise explanation", prefix: "/quick", placeholder: "Please input your question for a quick answer", action: () => handleModeClick("quick") },
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
        setValue("/Maths ");
        break;
      case "chat":
        setValue("/Chat ");
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

  const modeSuggestions = [
    {
      icon: <Video className="w-4 h-4" />,
      label: "Explanation Mode",
      description: "Comprehensive Ai explanations",
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

  /* --- effects ----------------------------------------------------- */
  // Retrieve user age on component mount - ONLY for authenticated users
  useEffect(() => {
    const loadAge = async () => {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        
        // Only proceed if user is properly authenticated
        if (session?.user) {
          // First try to get age from user metadata
          const age = (session.user as any).user_metadata?.age;
          if (age) {
            setUserAge(age);
            return;
          }
          
          // If not in metadata, we don't have a users table, so we can't query it
          // The age should be in the user metadata from Supabase auth
          console.debug('User age not found in metadata, using null');
        }
      } catch (error) {
        console.error('Error retrieving user age:', error);
      }
    };
    
    loadAge();
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
    } else if (value.startsWith("/Maths")) {
      return "/Maths - Please input a maths question";
    } else if (value.startsWith("/Chat")) {
      return "/Chat - Please input your question";
    } else if (value.startsWith("/quick")) {
      return "/quick - Please input your question for a quick answer";
    }
    // Default to structured lesson mode
    return "/lesson - Please input a topic for structured learning";
  };

  /* --- handlers ---------------------------------------------------- */
  const handleSendMessage = async () => {
    const q = value.trim();
    if (!q) return;

    // Input validation using Zod
    const messageSchema = z.object({
      content: z.string().min(1, "Message cannot be empty").max(1000, "Message too long")
    });

    try {
      messageSchema.parse({ content: q });
    } catch (error) {
      if (error instanceof z.ZodError) {
        setError(`Invalid input: ${error.errors[0].message}`);
        return;
      }
    }

    // Sanitize input to prevent XSS
    const sanitizedInput = DOMPurify.sanitize(q);

    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setIsTyping(true);
    setStreamingText("");
    setStoredLong("");
    setShowVideoButton(false);
    setLessonJson(null);
    setMathSolution(null);
    setError(null);

    // legacy video path
    if (sanitizedInput.startsWith("/video")) {
      const sid = localStorage.getItem("lana_sid") || "";

      let sseReconnectAttempts = 0;
      let sseLastMsgAt = Date.now();
      let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

      const connectSSE = () => {
        const es = new EventSource(
          `${API_BASE}/ask/stream?q=${encodeURIComponent(sanitizedInput)}&sid=${encodeURIComponent(sid)}`,
          { withCredentials: false }
        );

        es.onmessage = (ev) => {
          sseLastMsgAt = Date.now();
          try {
            const data = JSON.parse(ev.data);
            if (data.error) {
              setError("Error: " + data.error);
              es.close();
              setIsTyping(false);
              return;
            }

            // Throttle UI updates to ~20fps
            if (data.short !== undefined) streamingThrottleRef.current.latestShort = data.short;
            if (data.long) streamingThrottleRef.current.latestLong = data.long;

            const now = Date.now();
            const delta = now - (streamingThrottleRef.current.lastFlushTs || 0);
            if (delta >= 50) {
              flushStreamingUpdates();
            } else if (!streamingThrottleRef.current.timer) {
              streamingThrottleRef.current.timer = setTimeout(() => flushStreamingUpdates(), 50 - delta);
            }

            if (data.done) {
              try { es.close(); } catch {}
              if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null; }
              setIsTyping(false);
              setShowVideoButton(true);
            }
          } catch (e) {
            console.error('Error parsing EventSource data:', e);
            setError('Failed to parse response data');
            try { es.close(); } catch {}
            if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null; }
            setIsTyping(false);
          }
        };

        es.onerror = (e) => {
          console.error('EventSource error:', e);
          try { es.close(); } catch {}
          if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null; }
          if (sseReconnectAttempts < 2) {
            const backoff = 300 * Math.pow(2, sseReconnectAttempts);
            sseReconnectAttempts++;
            setTimeout(connectSSE, backoff);
          } else {
            setError("Connection failed");
            setIsTyping(false);
          }
        };

        // Heartbeat: reconnect if no messages in 8s
        if (heartbeatTimer) { clearInterval(heartbeatTimer); }
        heartbeatTimer = setInterval(() => {
          if (Date.now() - sseLastMsgAt > 8000) {
            try { es.close(); } catch {}
            if (sseReconnectAttempts < 2) {
              const backoff = 300 * Math.pow(2, sseReconnectAttempts);
              sseReconnectAttempts++;
              setTimeout(connectSSE, backoff);
            } else {
              if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null; }
              setError("Connection timed out");
              setIsTyping(false);
            }
          }
        }, 1000);

        abortRef.current?.signal.addEventListener("abort", () => {
          try { es.close(); } catch {}
          if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null; }
        });
      };

      connectSSE();
      return;
    }

    // Fast math detection and solver path
    const MATH_RE = /\b(solve|simplify|factor|expand|integrate|derivative|equation|sqrt|log|sin|cos|tan|polynomial|quadratic|linear|matrix|\d+[-+/^=]|\w+\s=)\b/i;
    if (MATH_RE.test(sanitizedInput)) {
      try {
        setIsTyping(true);
        const savePromise = saveSearch(sanitizedInput.trim()).catch(() => {});
        const res = await fetchWithTimeoutAndRetry(`${API_BASE}/api/math-solver/solve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ problem: sanitizedInput, show_steps: true }),
          signal: abortRef.current.signal,
        }, { timeoutMs: 10_000, retries: 2, retryDelayMs: 300 });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        // Validate and sanitize the math solution response
        let data: MathSolutionUI;
        if (!isValidMathSolutionResponse(json)) {
          console.warn('[math-solver] Invalid math solution response structure', json);
          // Try to sanitize the content
          const sanitizedSolution = sanitizeMathSolutionContent(json);
          if (!isValidMathSolutionResponse(sanitizedSolution)) {
            throw new Error("Received an invalid math solution format from the server.");
          }
          // Use sanitized content
          data = {
            problem: sanitizedSolution.problem || q,
            solution: sanitizedSolution.solution || '',
            steps: Array.isArray(sanitizedSolution.steps) ? sanitizedSolution.steps.map((s: any) => ({ description: s.description || '', expression: s.expression || null })) : undefined,
            error: sanitizedSolution.error || null,
          };
        } else {
          // Even if valid, sanitize the content for display
          const sanitizedSolution = sanitizeMathSolutionContent(json);
          data = {
            problem: sanitizedSolution.problem || q,
            solution: sanitizedSolution.solution || '',
            steps: Array.isArray(sanitizedSolution.steps) ? sanitizedSolution.steps.map((s: any) => ({ description: s.description || s.explanation || '', expression: s.expression || null })) : undefined,
            error: sanitizedSolution.error || null,
          };
        }
        if (data.error) setError(data.error);
        setMathSolution(data);
        setIsTyping(false);
        await savePromise;
        return;
      } catch (e: any) {
        setError(e?.message || 'Math solving failed');
        setIsTyping(false);
        return;
      }
    }

    // ✅ OPTIMIZED structured-lesson STREAMING path — FAST MODE
    try {
      // Debug: surface API base and outgoing topic
      if (process.env.NODE_ENV === 'development') {
        console.info('[lesson-stream] request', { API_BASE, topic: sanitizedInput, age: userAge })
      }
      // Add explicit SSE Accept header and a connection timeout to avoid hanging
      const connectTimer = setTimeout(() => {
        try { abortRef.current?.abort(); } catch {}
      }, Number(process.env.NEXT_PUBLIC_STREAM_TIMEOUT_MS ?? 15000));
      // Build payload — omit age for guest users to remove age restrictions
      const isGuest = isGuestClient()
      const payload: any = { topic: sanitizedInput }
      if (!isGuest && typeof userAge === 'number') {
        payload.age = userAge
      }
      
      // Check rate limit before making request
      const endpoint = '/api/structured-lesson/stream';
      if (!rateLimiter.isAllowed(endpoint)) {
        const waitTime = rateLimiter.getTimeUntilNextRequest(endpoint);
        setError(`Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds before trying again.`);
        setIsTyping(false);
        return;
      }
      
      const response = await fetch(`${API_BASE}/api/structured-lesson/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "text/event-stream",
        },
        body: JSON.stringify(payload),
        signal: abortRef.current.signal,
      });
      clearTimeout(connectTimer);

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

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();

      // Detect stalled streams and abort to trigger retry
      let lastChunkAt = Date.now();
      const stallMs = Number(process.env.NEXT_PUBLIC_STREAM_STALL_MS ?? 8000);
      stallTickerRef.current = setInterval(() => {
        if (Date.now() - lastChunkAt > stallMs) {
          try { abortRef.current?.abort(); } catch {}
        }
      }, 1000);

      let buffer = "";
      let finalLesson: Lesson | null = null;
      let isComplete = false;
      
      setIsTyping(true)
      
      // Start save search immediately (parallel processing)
      const savePromise = saveSearch(sanitizedInput.trim()).then(saveResult => {
        console.log('✅ saveSearch result:', saveResult)
        if (saveResult?.message) {
          setSaveMessage(saveResult.message)
          setShowSaveMessage(true)
          setTimeout(() => {
            setShowSaveMessage(false)
            setTimeout(() => setSaveMessage(null), 300)
          }, 5000)
        }
      }).catch(console.error);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        lastChunkAt = Date.now();

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const ln of lines) {
          if (!ln.startsWith("data:")) continue;
          try {
            const msg = JSON.parse(ln.slice(5).trim());

            switch (msg.type) {
              case "done":
                // ULTRA-FAST processing - instant response
                finalLesson = msg.lesson;
                
                // Validate and sanitize the lesson response
                if (!isValidLessonResponse(finalLesson)) {
                  console.warn('[lesson-stream] Invalid lesson response structure', finalLesson);
                  // Try to sanitize the content
                  const sanitizedLesson = sanitizeLessonContent(finalLesson);
                  if (isValidLessonResponse(sanitizedLesson)) {
                    finalLesson = sanitizedLesson;
                  } else {
                    // If still invalid, show an error
                    setError("Received an invalid response format from the server. Please try again.");
                    setIsTyping(false);
                    return;
                  }
                } else {
                  // Even if valid, sanitize the content for display
                  finalLesson = sanitizeLessonContent(finalLesson);
                }
                
                isComplete = true;
                setLessonJson(finalLesson);
                setShowVideoButton(true);
                setIsTyping(false);
                if (process.env.NODE_ENV === 'development') {
                  const introPreview = (finalLesson?.introduction || '').slice(0, 120)
                  console.info('[lesson-stream] done', { topicSent: sanitizedInput, introPreview })
                }
                
                // Ensure save completes
                await savePromise;
                return; 

              case "error":
                setError(msg.message);
                setIsTyping(false);
                if (process.env.NODE_ENV === 'development') {
                  console.warn('[lesson-stream] error', msg)
                }
                return;
            }
          } catch (e) {
            // Skip malformed messages
          }
        }
      }
    } catch (e: unknown) {
      // Treat AbortError (timeout or manual abort) as benign, avoid retry loops
      if (e instanceof Error && e.name === "AbortError") {
        if (process.env.NODE_ENV === 'development') console.debug('[lesson-stream] aborted');
        setError("Request was cancelled or timed out. Please try again.");
      } else {
        const errorMessage = e instanceof Error ? e.message : "Streaming failed";
        setError(errorMessage);
        if (process.env.NODE_ENV === 'development') {
          console.error('[lesson-stream] catch', e)
        }
        // Only retry on non-abort errors
        if (retryCount < MAX_RETRIES) {
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
            handleSendMessage();
          }, 1000 * (retryCount + 1)); 
        }
      }
    } finally {
      // Cleanup stall detection
      if (stallTickerRef.current) {
        try { clearInterval(stallTickerRef.current); } catch {}
        stallTickerRef.current = null;
      }
      setIsTyping(false);
      setValue('')
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
        {/* Save message notification - positioned above logo */
        <AnimatePresence>
          {saveMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: showSaveMessage ? 1 : 0, y: showSaveMessage ? 0 : -10 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="mb-6"
            >
              <div
                role="status"
                aria-live="polite"
                aria-atomic="true"
                className={cn(
                "border rounded-xl p-3 text-sm max-w-md mx-auto",
                saveMessage.includes('saved') || saveMessage.includes('history') 
                  ? "bg-green-500/10 border-green-500/20 text-green-200" 
                  : "bg-blue-500/10 border-blue-500/20 text-blue-200"
              )}
              >
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
     }
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
                ref={autoRef}
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  adjustHeight();
                }}
                onKeyDown={handleKeyDown}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                placeholder={getModePlaceholder()}
                containerClassName="w-full"
                className="w-full px-4 py-3 resize-none bg-transparent border-none text-white/90 text-sm placeholder:text-white/30 min-h-[60px]"
                showRing={false}
              />
            </div>

            {/* AI response area — moved OUTSIDE input container */}
            {error && (
              <div className="px-4 pb-4">
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  role="alert"
                  aria-live="assertive"
                  aria-atomic="true"
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

            {mathSolution && (
              <div className="px-4 pb-4">
                <MathSolutionCard data={mathSolution} />
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