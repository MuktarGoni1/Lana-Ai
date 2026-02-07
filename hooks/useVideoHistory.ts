'use client';

import { useState, useCallback, useEffect } from 'react';

export interface VideoHistoryItem {
  jobId: string;
  status: string;
  progress: number;
  topic: string;
  videoUrl?: string;
  createdAt: number;
  completedAt?: number;
}

interface UseVideoHistoryReturn {
  videos: VideoHistoryItem[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useVideoHistory(): UseVideoHistoryReturn {
  const [videos, setVideos] = useState<VideoHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/video/jobs');

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch video history');
      }

      const data = await response.json();
      setVideos(data.jobs || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return {
    videos,
    isLoading,
    error,
    refetch: fetchHistory,
  };
}
