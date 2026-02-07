"use client";

import React, { useEffect, useRef, useCallback, useState, useMemo } from "react";
import { cn, fetchWithTimeoutAndRetry } from "@/lib/utils";
import { z } from "zod";
import DOMPurify from "isomorphic-dompurify";
import rateLimiter from "@/lib/rate-limiter";
import { getSelectedMode, saveSelectedMode } from "@/lib/mode-storage";
import { isValidLessonResponse, isValidMathSolutionResponse, sanitizeLessonContent, sanitizeMathSolutionContent } from "@/lib/response-validation";
import { getErrorMessage } from "@/lib/api-errors";
import { decodeHTMLEntities } from "@/lib/html-entity-decoder";
import { updateUserAge } from "@/lib/services/userService";
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
  Plus,
  CheckIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import VideoLearningPage from "./personalised-Ai-tutor";
import { useMotionValue } from "framer-motion";

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
      user={undefined} // Will be passed from parent component
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
  mode?: string; // Add mode prop for visual indication
  onValueChange?: (value: string) => void; // Add callback for value changes
}
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, containerClassName, showRing = true, mode, onValueChange, value = '', ...props }, ref) => {
    const [focused, setFocused] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    
    // Get the current mode prefix from the value
    const stringValue = typeof value === 'string' ? value : '';
    const modeMatch = stringValue.match(/^\/\w+\s/);
    const modePrefix = modeMatch ? modeMatch[0] : '';
    const content = stringValue.slice(modePrefix.length);
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (onValueChange && textareaRef.current) {
        const target = textareaRef.current;
        const cursorPosition = target.selectionStart;
        
        // If we're at the beginning or within the mode prefix, handle special deletion
        if (cursorPosition <= modePrefix.length && modePrefix) {
          if (e.key === 'Backspace' || e.key === 'Delete') {
            e.preventDefault();
            // Remove the entire mode prefix
            onValueChange(content);
            // Set cursor to the beginning of the content after update
            setTimeout(() => {
              if (textareaRef.current) {
                textareaRef.current.selectionStart = 0;
                textareaRef.current.selectionEnd = 0;
              }
            }, 0);
          } else if (e.key.length === 1) { // Regular character input
            e.preventDefault();
            // Replace the entire mode prefix with the new character plus content
            onValueChange(e.key + content);
            // Set cursor after the new character
            setTimeout(() => {
              if (textareaRef.current) {
                textareaRef.current.selectionStart = 1;
                textareaRef.current.selectionEnd = 1;
              }
            }, 0);
          }
        }
        
        // Handle the original onKeyDown if it exists
        if (props.onKeyDown) {
          props.onKeyDown(e);
        }
      }
    };
    
    return (
      <div className={cn("relative", containerClassName)}>
        <textarea
          className={cn(
            "flex min-h-[60px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm",
            "transition-all duration-200 ease-in-out placeholder:text-muted-foreground",
            "disabled:cursor-not-allowed disabled:opacity-50",
            showRing && "focus:outline-none",
            className
          )}
          ref={(node) => {
            if (node) {
              (textareaRef as React.MutableRefObject<HTMLTextAreaElement>).current = node;
              if (typeof ref === 'function') {
                ref(node);
              } else if (ref) {
                ref.current = node;
              }
            }
          }}
          value={value}
          onChange={(e) => {
            if (onValueChange) {
              onValueChange(e.target.value);
            }
            if (props.onChange) {
              props.onChange(e);
            }
          }}
          onKeyDown={handleKeyDown}
          onFocus={(e) => {
            setFocused(true);
            if (props.onFocus) props.onFocus(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            if (props.onBlur) props.onBlur(e);
          }}
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
  q?: string;
  question?: string;
  Q?: string; // Alternative field name
  options?: string[];
  choices?: string[]; // Alternative field name
  answer?: string;
  correct?: string; // Alternative field name
  explanation?: string;
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
    // First decode HTML entities, then sanitize formatting
    const decodedLine = decodeHTMLEntities(line);
    return decodedLine
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
      // Check if quiz data exists and has valid content
      if (!lesson?.quiz || !Array.isArray(lesson.quiz) || lesson.quiz.length === 0) {
        console.warn("No quiz data available", lesson?.quiz);
        // Don't show error, just don't show the quiz button
        return;
      }
      
      // Transform quiz data to match frontend expectations
      const transformedQuiz = lesson.quiz.map((item: any) => ({
        q: item.q || item.question || item.Q || "",  // Handle 'q', 'question', or 'Q' properties
        options: Array.isArray(item.options) ? item.options : 
                 Array.isArray(item.choices) ? item.choices : [], // Handle 'choices' as well
        answer: item.answer || item.correct || ""
      })).filter(item => {
        // Filter to only include items that have both a question and options
        return item.q && item.q.trim() !== "" && Array.isArray(item.options) && item.options.length > 0;
      });
      
      if (transformedQuiz.length === 0) {
        console.warn("No valid quiz items after transformation", lesson.quiz);
        // Don't show error, just don't show the quiz button
        return;
      }
      
      const data = encodeURIComponent(JSON.stringify(transformedQuiz));
      router.push(`/quiz?data=${data}`);
      
      // Only try the lesson ID approach if we also have a lesson ID
      // This is kept for future compatibility when backend endpoint is ready
      /* 
      if (lesson?.id) {
        // Use the new endpoint that retrieves quiz by lesson ID
        router.push(`/quiz?lessonId=${lesson.id}`);
        return;
      }
      */
    } catch (err) {
      console.error("Failed to navigate to quiz:", err);
    }
  };

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

  const blocks = useMemo(() => {
    const blocks: { title?: string; content: string }[] = [];
    // Track seen content to prevent duplicates
    const seenContent = new Set<string>();
    
    // Helper function to check if content is already seen (case-insensitive, trimmed)
    const isContentSeen = (content: string): boolean => {
      const normalized = content.trim().toLowerCase();
      return seenContent.has(normalized);
    };
    
    // Helper function to add content if not seen
    const addContent = (title: string, content: string) => {
      const normalized = content.trim().toLowerCase();
      if (!seenContent.has(normalized)) {
        seenContent.add(normalized);
        blocks.push({ title, content: content.trim() });
      }
    };
    
    // Handle error responses differently
    if (isErrorResponse) {
      const errorContent = lesson.introduction || "We're experiencing high demand. Please try again in a few minutes.";
      addContent("Service Temporarily Unavailable", errorContent);
      
      // Add helpful suggestions
      if (lesson.sections && lesson.sections.length > 0) {
        const suggestionContent = lesson.sections[0].content || "1. Try rephrasing your question\n2. Ask about a different topic\n3. Check back in a few minutes";
        addContent(lesson.sections[0].title || "Suggestions", suggestionContent);
      }
    } else {
      if (lesson.introduction && typeof lesson.introduction === "string" && lesson.introduction.trim()) {
        addContent("Introduction", lesson.introduction);
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
          addContent("Classifications / Types", classificationContent);
        }
      }

      // Detailed sections (now after classifications)
      if (Array.isArray(lesson.sections)) {
        for (const section of lesson.sections) {
          if (section?.title && section?.content && section.title.trim() && section.content.trim()) {
            addContent(normalizeTitle(section.title.trim()), section.content);
          }
        }
      }

      if (lesson.diagram && lesson.diagram.trim()) {
        // Skip diagram section entirely as requested
        // addContent("Diagram Description", lesson.diagram);
      }
    }
    
    return blocks;
  }, [lesson, isErrorResponse, normalizeTitle]);

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
      const res = await fetch(`https://api.lanamind.com/api/tts/`, {
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

            {lesson.quiz && Array.isArray(lesson.quiz) && lesson.quiz.some(item => 
              (item.q || item.question || item.Q) && 
              ((Array.isArray(item.options) && item.options.length > 0) || 
               (Array.isArray(item.choices) && item.choices.length > 0))
            ) && (
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
      const res = await fetch(`https://api.lanamind.com/api/tts/`, {
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
        // Don't set audioRef.current to null as it's a ref
        // Just clear the audio source to free memory
      }
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, []); // Empty dependency array to run only once on unmount

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

interface ChatResponse {
  mode: string;
  reply: string;
  quiz?: LessonQuizItem[];
  error?: string;
}

// Extended ChatResponse that includes lesson fields for better type safety
interface ExtendedChatResponse extends ChatResponse {
  introduction?: string;
  classifications?: Array<{ type: string; description: string }>;
  sections?: LessonSection[];
  diagram?: string;
}

// Define QuickModeResponse type to match backend API
interface QuickModeResponse {
  introduction?: string | null;
  classifications: Array<{ type: string; description: string }>;
  sections: Array<{ title: string; content: string }>;
  diagram: string;
  quiz: Array<{
    question: string;
    options: string[];
    answer: string;
  }>;
}

// Type guard functions
function isLessonResponse(response: any): response is Lesson {
  // Check if response has lesson-specific properties with meaningful content
  if (!response) return false;
  
  // Check for introduction with actual content
  if (response.introduction && typeof response.introduction === 'string' && response.introduction.trim() !== '') {
    return true;
  }
  
  // Check for sections with actual content
  if (Array.isArray(response.sections) && response.sections.length > 0) {
    // Check if at least one section has meaningful content
    return response.sections.some((section: any) => 
      (section && typeof section === 'object' && 
       ((section.title && typeof section.title === 'string' && section.title.trim() !== '') || 
        (section.content && typeof section.content === 'string' && section.content.trim() !== '')))
    );
  }
  
  // Check for quiz with actual content (enhanced validation)
  if (Array.isArray(response.quiz) && response.quiz.length > 0) {
    return response.quiz.some((quizItem: any) => {
      if (!quizItem || typeof quizItem !== 'object') return false;
      // Check for question field (could be 'q', 'question', or 'Q')
      const hasQuestion = !!(quizItem.q || quizItem.question || quizItem.Q);
      // Check for options field (could be 'options' or 'choices')
      const hasOptions = Array.isArray(quizItem.options) || Array.isArray(quizItem.choices);
      const optionsArray = Array.isArray(quizItem.options) ? quizItem.options : 
                           Array.isArray(quizItem.choices) ? quizItem.choices : [];
      return hasQuestion && optionsArray.length > 0;
    });
  }
  
  return false;
}

function isMathResponse(response: any): response is MathSolutionUI {
  return response && 'problem' in response && 'solution' in response && 
         typeof response.problem === 'string' && typeof response.solution === 'string' &&
         !Array.isArray(response.quiz); // Ensure it's not a lesson response with quiz
}

function isChatResponse(response: any): response is ChatResponse {
  // Check if it has reply and mode properties
  // Prioritize chat responses that have a reply property with actual content
  // NOTE: We check for reply and mode presence first, regardless of other properties
  // This ensures chat responses are always prioritized over lesson responses
  return response && 
         'reply' in response && 
         'mode' in response && 
         (typeof response.reply === 'string' || typeof response.reply === 'object') &&
         !isMathResponse(response);
  // Note: We don't check !isLessonResponse here to avoid conflicts
  // If a response has both chat and lesson properties, prioritize chat
}

// Helper function to summarize lesson responses for quick mode
const summarizeLessonResponse = (lesson: any): string => {
  let summaryParts: string[] = [];
  
  // Add introduction if available
  if (lesson.introduction && typeof lesson.introduction === 'string') {
    summaryParts.push(lesson.introduction);
  }
  
  // Add content from sections if available
  if (Array.isArray(lesson.sections) && lesson.sections.length > 0) {
    lesson.sections.forEach((section: any) => {
      if (section && typeof section === 'object') {
        if (section.title && typeof section.title === 'string') {
          summaryParts.push(section.title);
        }
        if (section.content && typeof section.content === 'string') {
          summaryParts.push(section.content);
        }
      }
    });
  }
  
  // Combine parts and limit length for quick response
  let fullSummary = summaryParts.join(' ');
  
  // Limit to a reasonable length for quick responses (e.g., first 300 characters)
  if (fullSummary.length > 300) {
    fullSummary = fullSummary.substring(0, 300) + '...';
  }
  
  return fullSummary || 'No content available.';
};

interface AnimatedAIChatProps {
  onNavigateToVideoLearning: (title: string) => void
  sessionId?: string        
  onSend?: () => void
  user?: any // Supabase user object
}

  export function AnimatedAIChat({ onNavigateToVideoLearning, user }: AnimatedAIChatProps) {
  /* --- state ------------------------------------------------------- */
  const [value, setValue] = useState("");
  
  // Initialize with stored mode if available
  useEffect(() => {
    const storedMode = getSelectedMode();
    if (storedMode) {
      // Save the stored mode to session storage (just to ensure it's set)
      saveSelectedMode(storedMode);
      setSelectedMode(storedMode);
    } else {
      // Default to lesson mode when no stored mode exists
      saveSelectedMode('lesson');
      setSelectedMode('lesson');
    }
    // Initialize with empty value - the mode will be indicated visually
    setValue("");
  }, []);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [selectedMode, setSelectedMode] = useState<string>('lesson'); // Track selected mode for UI
  const [modeFeedback, setModeFeedback] = useState<string | null>(null); // Track mode selection feedback
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
  const [lessonJson, setLessonJson] = useState<Lesson | ChatResponse | null>(null);   // NEW
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
  const [showAgeModal, setShowAgeModal] = useState(false);
  const [inputAge, setInputAge] = useState<string>('');
  const [ageValidationError, setAgeValidationError] = useState<string>('');
  const [conversationHistory, setConversationHistory] = useState<Array<{role: string, content: string}>>([]);
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

  // Function to handle mode button clicks and save the selected mode
  const handleModeClick = (mode: string) => {
    // Save the selected mode to session storage
    saveSelectedMode(mode);
    
    // Update the selected mode state for UI feedback
    setSelectedMode(mode);
    
    // Clear conversation history when switching between different types of modes
    // but preserve history when switching between chat and quick modes
    const isChatToQuick = (selectedMode === 'chat' && mode === 'quick') || (selectedMode === 'quick' && mode === 'chat');
    if (mode !== selectedMode && !isChatToQuick) {
      setConversationHistory([]);
    }
    
    // Provide visual feedback for mode selection
    setModeFeedback(mode);
    setTimeout(() => {
      setModeFeedback(null);
    }, 1000); // Clear feedback after 1 second
    
    // Clear the input field and let the placeholder show the mode hint
    setValue("");
    
    // Focus the textarea
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 0);
  };

  const modeSuggestions = [
    {
      icon: <Video className="w-4 h-4" />,
      label: "AI Video Lesson",
      description: "Generate custom explainer video",
      action: () => {
        const topic = value.trim();
        if (topic) {
          router.push(`/video-explainer?topic=${encodeURIComponent(topic)}`);
        } else {
          router.push("/video-explainer");
        }
      },
    },
    {
      icon: <Video className="w-4 h-4" />,
      label: "Avatar Tutor",
      description: "Interactive AI tutor session",
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
  // Cleanup function for AbortController to prevent memory leaks
  useEffect(() => {
    return () => {
      // Abort any ongoing requests when component unmounts
      abortRef.current?.abort();
      abortRef.current = null;
      
      // Clear any ongoing timeouts/intervals
      if (stallTickerRef.current) {
        clearInterval(stallTickerRef.current);
        stallTickerRef.current = null;
      }
    };
  }, []);

  // Helper function to validate age
  const validateAge = (ageStr: string): number | null => {
    const ageNum = parseInt(ageStr, 10);
    if (isNaN(ageNum) || ageNum < 5 || ageNum > 100) {
      return null;
    }
    return ageNum;
  };

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
          
          // Check if we've already shown the age modal in this session
          const hasSeenAgePrompt = sessionStorage.getItem('hasSeenAgePrompt');
          if (!hasSeenAgePrompt) {
            setShowAgeModal(true);
            sessionStorage.setItem('hasSeenAgePrompt', 'true');
          }
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

  // Function to get the appropriate placeholder based on the currently selected mode
  const getModePlaceholder = (): string => {
    // If there's input text that starts with a mode prefix, use that mode
    if (value.startsWith("/lesson")) {
      return "/lesson - Please input a topic for structured learning";
    } else if (value.startsWith("/maths")) {
      return "/maths - Please input a maths question";
    } else if (value.startsWith("/chat")) {
      return "/chat - Please input your question";
    } else if (value.startsWith("/quick")) {
      return "/quick - Please input your question for a quick answer";
    }
    
    // Otherwise, use the currently stored mode
    const currentMode = getSelectedMode() || 'lesson';
    switch (currentMode) {
      case "lesson":
        return "/lesson - Please input a topic for structured learning";
      case "maths":
        return "/maths - Please input a maths question";
      case "chat":
        return "/chat - Please input your question";
      case "quick":
        return "/quick - Please input your question for a quick answer";
      default:
        // Default to structured lesson mode
        return "/lesson - Please input a topic for structured learning";
    }
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

  // Handle age submission
  const handleAgeSubmit = async () => {
    const validatedAge = validateAge(inputAge);
    
    if (validatedAge === null) {
      setAgeValidationError('Please enter a valid age between 5 and 100');
      return;
    }
    
    setAgeValidationError('');
    
    // Update user age in Supabase
    const success = await updateUserAge(validatedAge);
    if (success) {
      setUserAge(validatedAge);
      setShowAgeModal(false);
      setInputAge('');
    } else {
      setAgeValidationError('Failed to save age. Please try again.');
    }
  };

  // Handle dismissing the age modal without saving
  const handleDismissAgeModal = () => {
    setShowAgeModal(false);
    setInputAge('');
    setAgeValidationError('');
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

    // Check if the user is authenticated and age is missing for educational modes
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const isAuthenticated = !!session?.user;
    
    // Use the current mode from the input field for routing, with fallback to selected UI mode
    const SUPPORTED_MODES = ['chat', 'quick', 'lesson', 'maths'];
        
    // Check if the input explicitly contains a mode prefix
    const hasExplicitModePrefix = /^\/\/(chat|quick|lesson|maths)\b/.test(sanitizedInput);
        
    const mode = hasExplicitModePrefix 
      ? getCurrentMode(sanitizedInput)
      : (getSelectedMode() || 'lesson');
        
    // Show age modal if user is authenticated, age is missing, and they're using an educational mode
    if (isAuthenticated && userAge === null && ['chat', 'quick', 'lesson', 'maths'].includes(mode)) {
      const hasSeenAgePrompt = sessionStorage.getItem('hasSeenAgePrompt');
      if (!hasSeenAgePrompt) {
        setShowAgeModal(true);
        sessionStorage.setItem('hasSeenAgePrompt', 'true');
        return; // Don't proceed with sending the message
      }
    }

    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setIsTyping(true);
    setStreamingText("");
    setStoredLong("");
    setShowVideoButton(false);
    setLessonJson(null);
    setMathSolution(null);
    setError(null);
        
    // Extract the actual message content by removing the mode prefix
    const modeMatch = sanitizedInput.match(/^\/?(\w+)\s*(.*)/);
    const cleanText = modeMatch && SUPPORTED_MODES.includes(modeMatch[1].toLowerCase()) 
      ? modeMatch[2] 
      : sanitizedInput;
        
    // Ensure we have a proper message for the API
    const apiMessage = cleanText.trim() || sanitizedInput;
          
    // For all modes, use the appropriate API endpoint based on mode
    if (SUPPORTED_MODES.includes(mode)) {
      try {
        // Get session ID for user identification
        const { data: { user } } = await supabase.auth.getUser();
        const sid = user?.id || `guest_${Date.now()}`;
            
        // Use the user age from state
        const userAgeForPayload = userAge;
            
        // Prepare request payload based on mode
        let payload: any, endpoint: string, response: Response;
            
        if (mode === 'maths') {
          // For maths mode, use the math solver endpoint
          payload = {
            problem: apiMessage,
            show_steps: true
          };
          endpoint = '/api/math-solver/solve';
                  
          if (!rateLimiter.isAllowed(endpoint)) { // Use the actual endpoint for rate limiting
            const waitTime = rateLimiter.getTimeUntilNextRequest(endpoint);
            setError(`Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds before trying again.`);
            setIsTyping(false);
            return;
          }
                  
          response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
            signal: abortRef.current.signal,
          });
              
          if (!response.ok) {
            const errorMessage = getErrorMessage(response.status, "math");
            throw new Error(errorMessage);
          }
              
          const mathResponse = await response.json();
                    
          // Handle math response from math solver endpoint
          if (mathResponse.error) {
            setError(mathResponse.error);
          } else {
            // Convert math solver response to MathSolutionUI format
            const mathData: MathSolutionUI = {
              problem: apiMessage,
              solution: mathResponse.solution || mathResponse.result || '',
              steps: mathResponse.steps || mathResponse.working || undefined,
              error: null,
            };
            setMathSolution(mathData);
            // Also set lessonJson to the math response so it can be properly rendered
            setLessonJson(mathData as any);
            saveSelectedMode('maths');
          }
        } else if (mode === 'chat') {
          // For chat mode, use the frontend API gateway
          const chatPayload = {
            message: apiMessage,
            userId: sid,
            age: userAgeForPayload,
            mode: mode
          };
          const chatEndpoint = '/api/chat';
                  
          if (!rateLimiter.isAllowed('/api/chat')) { // Use original path for rate limiting
            const waitTime = rateLimiter.getTimeUntilNextRequest('/api/chat');
            setError(`Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds before trying again.`);
            setIsTyping(false);
            return;
          }
                  
          const chatResponseData = await fetch(chatEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(chatPayload),
            signal: abortRef.current.signal,
          });
                  
          if (!chatResponseData.ok) {
            const errorMessage = getErrorMessage(chatResponseData.status, "chat");
            throw new Error(errorMessage);
          }
                  
          const chatResponse: ChatResponse = await chatResponseData.json();
                  
          if (chatResponse.error) {
            setError(chatResponse.error);
          } else {
            // Handle the response based on its type
            if (chatResponse.mode === 'chat' || chatResponse.mode === 'quick') { // Use response.mode instead of selectedMode
              // Safely handle the reply field in case it's not a string
              const replyText = typeof chatResponse.reply === 'string' ? chatResponse.reply : JSON.stringify(chatResponse.reply || 'No response');
              // For chat/quick modes, DO NOT set lessonJson to avoid duplicate rendering
              // Chat responses are handled in conversation history only
              // Clear streaming text to prevent duplication
              setStreamingText("");
              setStoredLong("");
              // Clear lessonJson to ensure no duplicate rendering
              setLessonJson(null);
              saveSelectedMode(chatResponse.mode);
                                
              // Update conversation history with both user message and AI response
              setConversationHistory(prev => [
                ...prev,
                { role: 'user', content: apiMessage },
                { role: 'assistant', content: replyText }
              ]);
            } else if (chatResponse.mode === 'lesson') {
              // For lesson mode, the response should be treated as a structured response
              setLessonJson(chatResponse as Lesson);
              saveSelectedMode(chatResponse.mode);
            } else if (chatResponse.mode === 'maths') {
              // For math mode, convert the response to MathSolutionUI format
              const mathData: MathSolutionUI = {
                problem: apiMessage,
                solution: chatResponse.reply || '',
                steps: chatResponse.quiz ? chatResponse.quiz.map((item: any) => ({
                  description: item.q || 'Step',
                  expression: item.options ? item.options.join(', ') : null
                })) : undefined,
                error: null,
              };
              setMathSolution(mathData);
              setLessonJson(mathData as any);
              saveSelectedMode(chatResponse.mode);
            }
          }
        }
        else if (mode === 'quick') {
          // For quick mode, use the quick mode endpoint
          const quickPayload = {
            topic: apiMessage,
            age: userAgeForPayload
          };
          const quickEndpoint = '/api/quick/generate';
                      
          if (!rateLimiter.isAllowed(quickEndpoint)) { // Use the actual endpoint for rate limiting
            const waitTime = rateLimiter.getTimeUntilNextRequest(quickEndpoint);
            setError(`Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds before trying again.`);
            setIsTyping(false);
            return;
          }
                      
          const quickResponse = await fetch(quickEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(quickPayload),
            signal: abortRef.current.signal,
          });
                      
          if (!quickResponse.ok) {
            const errorMessage = getErrorMessage(quickResponse.status, "quick");
            throw new Error(errorMessage);
          }
                      
          const quickApiResponse = await quickResponse.json();
                    
          if (quickApiResponse.error) {
            setError(quickApiResponse.error);
          } else {
            // For quick mode, convert the response to a proper lesson format
            const convertedLesson: Lesson = {
              introduction: quickApiResponse.introduction || '',
              classifications: quickApiResponse.classifications || [],
              sections: quickApiResponse.sections || [],
              diagram: quickApiResponse.diagram || '',
              quiz: quickApiResponse.quiz ? quickApiResponse.quiz.map((item: any) => ({
                q: item.question || item.q || 'Question',
                options: item.options || [],
                answer: item.answer || ''
              })) : []
            };
            // Set lessonJson for quick mode to display structured lesson card
            setLessonJson(convertedLesson);
            // Clear any previous streaming text
            setStreamingText("");
            setStoredLong("");
            saveSelectedMode('quick');
                      
            // DO NOT update conversation history for quick mode
            // Quick mode responses should appear as structured lesson cards, not in chat history
          }
        } else { // lesson mode
          // For lesson mode, use the structured lesson endpoint
          const lessonPayload = {
            topic: apiMessage,
            age: userAgeForPayload
          };
          const lessonEndpoint = '/api/structured-lesson';
                  
          if (!rateLimiter.isAllowed(lessonEndpoint)) { // Use the actual endpoint for rate limiting
            const waitTime = rateLimiter.getTimeUntilNextRequest(lessonEndpoint);
            setError(`Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds before trying again.`);
            setIsTyping(false);
            return;
          }
                  
          const lessonResponseData = await fetch(lessonEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(lessonPayload),
            signal: abortRef.current.signal,
          });
                  
          if (!lessonResponseData.ok) {
            const errorMessage = getErrorMessage(lessonResponseData.status, "lesson");
            throw new Error(errorMessage);
          }
                  
          const lessonResponse = await lessonResponseData.json();
                  
          if (lessonResponse.error) {
            setError(lessonResponse.error);
          } else {
            // For lesson mode, handle the response as a structured lesson
            setLessonJson(lessonResponse as Lesson);
            saveSelectedMode('lesson');
          }
        }
        
        setIsTyping(false);
        setShowVideoButton(true);
        
        // Save search history
        const savePromise = saveSearch(sanitizedInput.trim()).catch(console.error);
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
      // If we successfully processed a supported mode, return early to avoid fallback processing
      return;
    }
    
    // All requests should be handled by the explicit mode handling above
    // If we reach this point, it means no explicit mode was detected
    // So we default to lesson mode for backward compatibility
    try {
      // Build payload for lesson mode as fallback
      const { data: { user } } = await supabase.auth.getUser();
      const sid = user?.id || `guest_${Date.now()}`;
      const payload: any = {
        message: sanitizedInput,
        userId: sid,
        age: userAge,
        mode: 'lesson'
      };
      
      // Check rate limit before making request
      const endpoint = '/api/chat';
      if (!rateLimiter.isAllowed(endpoint)) {
        const waitTime = rateLimiter.getTimeUntilNextRequest(endpoint);
        setError(`Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds before trying again.`);
        setIsTyping(false);
        return;
      }
      
      // Use the frontend API gateway
      const lessonEndpoint = '/api/chat';
      const response = await fetch(lessonEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(payload),
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        const errorMessage = getErrorMessage(response.status, "lesson");
        throw new Error(errorMessage);
      }

      // Handle non-streaming response (regular JSON)
      const finalLesson = await response.json();
      
      // Handle response from frontend API gateway
      if (finalLesson.error) {
        throw new Error(finalLesson.error);
      }
      
      // Validate and sanitize the lesson response
      if (!isValidLessonResponse(finalLesson)) {
        console.warn('[lesson] Invalid lesson response structure', finalLesson);
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
        console.info('[lesson] done', { topicSent: sanitizedInput, introPreview });
      }
      
      // Start save search immediately (parallel processing)
      const savePromise = saveSearch(sanitizedInput.trim()).then(saveResult => {
        console.log('✅ saveSearch result:', saveResult);
        if (saveResult?.message) {
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
      // Treat AbortError (timeout or manual abort) as benign, avoid retry loops
      if (e instanceof Error && e.name === "AbortError") {
        if (process.env.NODE_ENV === 'development') console.debug('[lesson] aborted');
        setError("Request was cancelled or timed out. Please try again.");
      } else {
        const errorMessage = e instanceof Error ? e.message : "Request failed";
        setError(errorMessage);
        if (process.env.NODE_ENV === 'development') {
          console.error('[lesson] catch', e)
        }
      }
    } finally {
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

  // Add hidden file input element ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAttachFile = () => {
    // Trigger the hidden file input
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const removeAttachment = (idx: number) =>
    setAttachments((prev) => prev.filter((_, i) => i !== idx));

  // Handle file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/png', 
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
      'text/markdown'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      setError('Unsupported file type. Please upload an image (JPEG, PNG, GIF, WebP), PDF, or text file.');
      return;
    }
    
    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setError('File size too large. Maximum size is 10MB.');
      return;
    }
    
    // Add file to attachments
    setAttachments((prev) => [...prev, file.name]);
    
    // Process the file to extract text or send to backend
    try {
      await processFile(file);
    } catch (err) {
      console.error('Error processing file:', err);
      setError('Error processing file. Please try again.');
    }
  };

  // Process the uploaded file
  const processFile = async (file: File) => {
    // For image files, we need to convert to base64 and send to backend
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        const base64String = event.target?.result as string;
        
        // For now, inform user that image processing is simulated
        // In a real implementation, this would send to a backend service for OCR/NLP processing
        setError('Image uploaded successfully! Processing images is coming soon. The system can currently process text content from images. Adding this file as an attachment.');
        
        // Simulate processing delay
        setTimeout(() => {
          setError(null);
          
          // Inform user about image processing capability
          setSaveMessage('Image uploaded. Our AI can analyze images in upcoming updates!');
          setShowSaveMessage(true);
          setTimeout(() => {
            setShowSaveMessage(false);
            setTimeout(() => setSaveMessage(null), 300);
          }, 3000);
        }, 2000);
      };
      
      reader.onerror = () => {
        setError('Error reading image file.');
      };
      
      reader.readAsDataURL(file);
    } else if (file.type === 'application/pdf') {
      // For PDF files, we'd typically use a PDF extraction library
      // For now, we'll just send the file for processing
      setError('PDF processing coming soon. For now, please take a screenshot of the content and upload the image.');
    } else {
      // For text files, read the content
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        const textContent = event.target?.result as string;
        
        // Process the text content
        try {
          // Use the currently selected mode from component state
          const currentMode = selectedMode || 'lesson';
          
          // Prepare payload for text processing
          const payload = {
            message: textContent,
            userId: user?.id || `guest_${Date.now()}`,
            age: userAge,
            mode: currentMode
          };
          
          // Send to appropriate endpoint
          const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          });
          
          if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
          }
          
          const result = await response.json();
          
          // Update UI based on response type
          if (result.error) {
            setError(result.error);
          } else {
            // Handle the response based on mode
            if (currentMode === 'maths') {
              // For math mode, expect a math solution
              const mathData: MathSolutionUI = {
                problem: result.problem || textContent,
                solution: result.solution || result.result || '',
                steps: result.steps || result.working || undefined,
                error: null,
              };
              setMathSolution(mathData);
              setLessonJson(mathData as any);
            } else {
              // For other modes, treat as a lesson response
              setLessonJson(result as Lesson);
            }
          }
        } catch (err) {
          console.error('Error processing text file:', err);
          setError('Error processing text file. Please try again.');
        }
      };
      
      reader.onerror = () => {
        setError('Error reading text file.');
      };
      
      reader.readAsText(file);
    }
  };

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
            className="relative backdrop-blur-2xl bg-white/5 rounded-3xl border border-white/10 shadow-2xl overflow-hidden"
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
                          // Save the selected mode based on the prefix without pre-filling the input
                          const modeFromPrefix = s.prefix.replace('/', '').toLowerCase();
                          saveSelectedMode(modeFromPrefix);
                          setSelectedMode(modeFromPrefix); // Update UI state
                          setModeFeedback(modeFromPrefix); // Show visual feedback
                          setTimeout(() => {
                            setModeFeedback(null);
                          }, 1000); // Clear feedback after 1 second
                          setValue(""); // Clear the input field
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
                      <div className="w-5 h-5 flex-center text-white/60 rounded-lg">{s.icon}</div>
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
                onValueChange={(newValue) => {
                  setValue(newValue);
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

            {/* mode selection buttons */}
            <div className="px-4 flex flex-wrap gap-1 justify-center">
              {commandSuggestions.map((suggestion, idx) => {
                const mode = suggestion.prefix.replace('/', '').toLowerCase();
                const isSelected = selectedMode === mode;
                const isFeedback = modeFeedback === mode;
                
                return (
                  <motion.button
                    key={suggestion.label}
                    onClick={() => handleModeClick(mode)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1 transition-all min-w-[70px]",
                      isSelected
                        ? "bg-white text-black shadow-md shadow-white/20"
                        : "bg-white/10 text-white/80 hover:bg-white/20",
                      isFeedback && "animate-pulse"
                    )}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="flex items-center">{suggestion.icon}</span>
                    <span className="truncate max-w-[50px]">{suggestion.label.split(' ')[0]}</span>
                  </motion.button>
                );
              })}
            </div>

            {/* Conversation history for chat and quick modes */}
            {(selectedMode === 'chat' || selectedMode === 'quick') && conversationHistory.length > 0 && (
              <div className="px-4 pb-2 max-h-96 overflow-y-auto">
                {conversationHistory.map((msg, index) => (
                  <div 
                    key={index} 
                    className={`mb-3 p-3 rounded-2xl ${
                      msg.role === 'user' 
                        ? 'bg-white/10 ml-10 text-right' 
                        : 'bg-white/5 mr-10 text-left'
                    }`}
                  >
                    <div className="text-xs text-white/60 mb-1">
                      {msg.role === 'user' ? 'You' : 'Assistant'}
                    </div>
                    <div className="text-white/90 text-sm">
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* AI response area */}
            {error && (
              <div className="px-4 pb-4">
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  role="alert"
                  aria-live="assertive"
                  aria-atomic="true"
                  className="bg-red-500/10 border border-red-500/20 rounded-2xl p-3 text-red-200 text-sm"
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
                {/* Strictly prioritize isChatResponse() guard before any other checks */}
                {isChatResponse(lessonJson) ? (
                  /* If it's a chat response, return null to prevent duplicate rendering */
                  /* Chat responses are handled in conversation history only */
                  null
                ) : (
                  /* For all non-chat responses, check the mode and render appropriately */
                  /* Quick mode should show lesson cards (like lesson mode), but not in conversation history */
                  selectedMode !== 'chat' && (
                    isMathResponse(lessonJson) ? (
                      <MathSolutionCard 
                        data={lessonJson as MathSolutionUI} 
                      />
                    ) : (
                      <StructuredLessonCard 
                        lesson={lessonJson as Lesson} 
                        isStreamingComplete={!isTyping} 
                      />
                    )
                  )
                )}
              </div>
            )}

            {/* Math solutions are now handled through lessonJson to ensure consistent rendering */}

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
                      className="flex items-center gap-2 text-xs bg-white/5 py-1.5 px-3 rounded-xl text-white/80 border border-white/10"
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
                  className="p-2 text-white/50 hover:text-white rounded-xl"
                >
                  <Paperclip className="w-4 h-4" />
                </motion.button>
                {/* Hidden file input for image uploads */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*,application/pdf,text/plain,text/markdown"
                  className="hidden"
                  multiple={false}
                />
                <motion.button
                  onClick={() => setShowCommandPalette((p) => !p)}
                  whileTap={{ scale: 0.94 }}
                  className="p-2 text-white/50 hover:text-white rounded-xl"
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
                  "px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2",
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

            {/* "Get more explanatiom" button */}
            {showVideoButton && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 border-t border-white/10"
              >
                <button
                  onClick={() => onNavigateToVideoLearning?.(
                    (lessonJson && isLessonResponse(lessonJson) ? (lessonJson as Lesson).introduction?.split('\n')[0] || value.trim() : value.trim()) || "Generated Lesson"
                  )}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white"
                >
                  <Video className="w-4 h-4" />
                  <span>Create lesson</span>
                </button>
              </motion.div>
            )}
          </motion.div>

          {/* mode buttons - only show when no lesson content and input not focused */}
          {!lessonJson && !inputFocused && (
            <div className="w-full mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto">
              {modeSuggestions.map((mode, idx) => (
                <motion.button
                  key={mode.label}
                  onClick={mode.action}
                  className="group flex items-center gap-3 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-2xl text-sm text-white/80 hover:text-white transition-all border border-white/10 hover:border-white/20 min-w-[180px]"
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
          )}
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

      {/* Age Modal */}
      {showAgeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-gray-900 border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold text-white">Personalize Your Experience</h3>
              <button 
                onClick={handleDismissAgeModal}
                className="text-white/60 hover:text-white"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-white/80 mb-6">
              Please input your age for a more personalized response
            </p>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="age-input" className="block text-sm font-medium text-white/80 mb-2">
                  Your Age
                </label>
                <input
                  id="age-input"
                  type="number"
                  value={inputAge}
                  onChange={(e) => setInputAge(e.target.value)}
                  min="5"
                  max="100"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
                  placeholder="Enter your age (5-100)"
                />
                {ageValidationError && (
                  <p className="mt-2 text-sm text-red-400">{ageValidationError}</p>
                )}
              </div>
              
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleAgeSubmit}
                  className="flex-1 bg-white text-black py-2.5 px-4 rounded-xl font-medium hover:bg-white/90 transition-colors"
                >
                  Submit
                </button>
                <button
                  onClick={handleDismissAgeModal}
                  className="bg-white/10 text-white py-2.5 px-4 rounded-xl font-medium hover:bg-white/20 transition-colors"
                >
                  Skip
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}