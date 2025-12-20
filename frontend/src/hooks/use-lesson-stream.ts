// src/hooks/use-lesson-stream.ts
// Function: Lesson streaming management
// Responsibilities:
//  * API_BASE connection handling
//  * AbortController integration
//  * Response streaming implementation
//  * saveSearch side-effect coordination

import { useState, useRef, useCallback } from "react";
import { API_BASE } from '../../lib/api-config';
import rateLimiter from "../../lib/rate-limiter";
import { saveSearch } from '../../lib/search';
import { isValidLessonResponse, sanitizeLessonContent } from "../../lib/response-validation";

interface Lesson {
  id?: string;
  introduction?: string;
  classifications?: Array<{ type: string; description: string }>;
  sections?: Array<{ title?: string; content?: string }>;
  diagram?: string;
  quiz?: Array<{ q: string; options: string[]; answer: string }>;
}

interface UseLessonStreamReturn {
  lessonJson: Lesson | null;
  isTyping: boolean;
  error: string | null;
  retryCount: number;
  handleSendMessage: (question: string, userAge: number | null) => Promise<void>;
  setError: (error: string | null) => void;
  setRetryCount: (count: number) => void;
}

export function useLessonStream(): UseLessonStreamReturn {
  const [lessonJson, setLessonJson] = useState<Lesson | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  const MAX_RETRIES = 3;

  const handleSendMessage = useCallback(async (question: string, userAge: number | null) => {
    const q = question.trim();
    if (!q) return;

    // Reset retry count for new requests
    setRetryCount(0);
    setError(null); // Clear previous errors for new requests
    
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setIsTyping(true);
    setLessonJson(null);

    // ✅ OPTIMIZED structured-lesson STREAMING path — FAST MODE
    try {
      // Debug: surface API base and outgoing topic
      if (process.env.NODE_ENV === 'development') {
        console.info('[lesson-stream] request', { API_BASE, topic: q, age: userAge });
      }
      
      // Check rate limit before making request
      const endpoint = '/api/structured-lesson';
      if (!rateLimiter.isAllowed(endpoint)) {
        const waitTime = rateLimiter.getTimeUntilNextRequest(endpoint);
        setError(`Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds before trying again.`);
        setIsTyping(false);
        return;
      }
      
      // Use relative path for frontend API routes to handle proxying
      // The frontend API route at /api/structured-lesson will proxy to the backend
      const lessonEndpoint = '/api/structured-lesson';
      const response = await fetch(lessonEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
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
      
      setIsTyping(false);
      
      if (process.env.NODE_ENV === 'development') {
        const introPreview = (finalLesson?.introduction || '').slice(0, 120);
        console.info('[lesson] done', { topicSent: q, introPreview });
      }
      
      // Start save search immediately (parallel processing)
      const savePromise = saveSearch(q.trim()).then(saveResult => {
        console.log('✅ saveSearch result:', saveResult);
      }).catch(console.error);
      
      // Ensure save completes
      await savePromise;
      return;
    } catch (e: unknown) {
      // Treat AbortError (timeout or manual abort) as benign, avoid retry loops
      if (e instanceof Error && e.name === "AbortError") {
        if (process.env.NODE_ENV === 'development') console.debug('[lesson-stream] aborted');
        setError("Request was cancelled or timed out. Please try again.");
      } else {
        const errorMessage = e instanceof Error ? e.message : "Streaming failed";
        setError(errorMessage);
        if (process.env.NODE_ENV === 'development') {
          console.error('[lesson-stream] catch', e);
        }
        // Only retry on non-abort errors
        if (retryCount < MAX_RETRIES) {
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
            handleSendMessage(question, userAge);
          }, 1000 * (retryCount + 1)); 
        }
      }
    } finally {
      setIsTyping(false);
    }
  }, [retryCount]);

  return {
    lessonJson,
    isTyping,
    error,
    retryCount,
    handleSendMessage,
    setError,
    setRetryCount
  };
}