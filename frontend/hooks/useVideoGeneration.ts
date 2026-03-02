'use client';

import { useState, useCallback, useEffect } from 'react';

export interface VideoJob {
  jobId: string;
  status: 'pending' | 'scripting' | 'generating_assets' | 'rendering' | 'completed' | 'failed';
  progress: number;
  topic: string;
  videoUrl?: string;
  error?: string;
  createdAt: number;
  completedAt?: number;
  manifest?: any;
}

interface UseVideoGenerationReturn {
  job: VideoJob | null;
  isLoading: boolean;
  error: string | null;
  generateVideo: (topic: string, style?: string, maxDuration?: number) => Promise<void>;
  pollStatus: (jobId: string) => void;
  stopPolling: () => void;
}

export function useVideoGeneration(): UseVideoGenerationReturn {
  const [job, setJob] = useState<VideoJob | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  const stopPolling = useCallback(() => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  }, [pollingInterval]);

  const generateVideo = useCallback(async (
    topic: string,
    style?: string,
    maxDuration?: number
  ) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/video/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic,
          style,
          maxDuration: maxDuration || 180,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate video');
      }

      const data = await response.json();
      setJob({
        jobId: data.jobId,
        status: 'pending',
        progress: 0,
        topic,
        createdAt: Date.now(),
      });

      // Start polling
      pollStatus(data.jobId);
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  }, []);

  const pollStatus = useCallback((jobId: string) => {
    stopPolling();

    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/video/status/${jobId}`);
        
        if (!response.ok) {
          throw new Error('Failed to get status');
        }

        const data = await response.json();
        
        setJob(prev => ({
          ...prev!,
          status: data.status,
          progress: data.progress,
          videoUrl: data.videoUrl,
          error: data.error,
          completedAt: data.completedAt,
          manifest: data.manifest,
        }));

        // Stop polling if job is complete or failed
        if (data.status === 'completed' || data.status === 'failed') {
          setIsLoading(false);
          stopPolling();
        }
      } catch (err: any) {
        console.error('Polling error:', err);
        // Don't stop polling on error, retry next interval
      }
    };

    // Check immediately
    checkStatus();

    // Then check every 5 seconds
    const interval = setInterval(checkStatus, 5000);
    setPollingInterval(interval);
  }, [stopPolling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return {
    job,
    isLoading,
    error,
    generateVideo,
    pollStatus,
    stopPolling,
  };
}
