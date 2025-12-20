// src/hooks/use-tts.ts
// Function: Audio management
// Responsibilities:
//  * Audio blob fetching
//  * Segment queuing logic
//  * Play/Pause state management
//  * Audio resource cleanup

import { useState, useRef, useEffect, useCallback } from "react";
import rateLimiter from "@/lib/rate-limiter";

interface UseTTSReturn {
  audioUrl: string | null;
  isTtsLoading: boolean;
  ttsError: string | null;
  isPlaying: boolean;
  isRetrying: boolean;
  isQueuePreloading: boolean;
  preloadTTS: (segments: string[]) => Promise<void>;
  togglePlayPause: () => Promise<void>;
  cleanup: () => void;
}

export function useTTS() {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isTtsLoading, setIsTtsLoading] = useState(false);
  const [ttsError, setTtsError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isQueuePreloading, setIsQueuePreloading] = useState(false);
  const [audioQueue, setAudioQueue] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentIndexRef = useRef(0);
  const objectUrlsRef = useRef<string[]>([]);

  // Keep currentIndexRef in sync with currentIndex
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  // Cleanup function to release audio resources
  const cleanup = useCallback(() => {
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
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  // Fetch TTS blob URL
  const fetchTTSBlobUrl = useCallback(async (text: string, isRetry = false): Promise<string | null> => {
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
      return null;
    } finally {
      if (isRetry) {
        setIsRetrying(false);
      }
    }
  }, []);

  // Preload TTS audio
  const preloadTTS = useCallback(async (segments: string[]) => {
    try {
      setIsTtsLoading(true);
      setTtsError(null); // Clear previous errors
      
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
  }, [fetchTTSBlobUrl]);

  // Play TTS audio
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
        // Note: This assumes segments are passed in separately, which would need to be handled
        // in the component using this hook
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
  }, [audioUrl, audioQueue]);

  // Toggle play/pause
  const togglePlayPause = useCallback(async () => {
    if (isTtsLoading || isQueuePreloading || isRetrying) return;
    const hasPrepared = !!(audioUrl || audioQueue.length);
    if (!audioRef.current) {
      // In a real implementation, we would need to pass segments to this hook
      // For now, we'll just return and expect the component to handle preloading
      return;
    }
    if (audioRef.current.paused) {
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
  }, [audioUrl, audioQueue, isTtsLoading, isQueuePreloading, isRetrying]);

  return {
    audioUrl,
    isTtsLoading,
    ttsError,
    isPlaying,
    isRetrying,
    isQueuePreloading,
    preloadTTS,
    togglePlayPause,
    cleanup
  };
}