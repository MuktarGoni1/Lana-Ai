'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { VideoHistoryItem } from '@/hooks/useVideoHistory';
import { Play, Download, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

interface VideoCardProps {
  video: VideoHistoryItem;
}

export function VideoCard({ video }: VideoCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30">Completed</Badge>;
      case 'failed':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30">Failed</Badge>;
      case 'rendering':
      case 'generating_assets':
      case 'scripting':
        return <Badge className="bg-zinc-700 text-zinc-300 border-zinc-600">In Progress</Badge>;
      default:
        return <Badge variant="outline" className="border-zinc-700 text-zinc-400">Pending</Badge>;
    }
  };

  const isCompleted = video.status === 'completed';
  const isInProgress = !['completed', 'failed'].includes(video.status);

  return (
    <>
      <motion.div
        whileHover={{ scale: 1.01 }}
        className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors"
      >
        <div className="flex items-start gap-4">
          <div 
            className={`w-24 h-16 rounded-lg flex items-center justify-center shrink-0 ${
              isCompleted 
                ? 'bg-gradient-to-br from-zinc-700 to-zinc-800 cursor-pointer hover:from-zinc-600 hover:to-zinc-700' 
                : 'bg-zinc-800'
            }`}
            onClick={() => isCompleted && setIsPlaying(true)}
          >
            {isCompleted ? (
              <Play className="w-6 h-6 text-white" />
            ) : (
              <div className="w-6 h-6 rounded-full border-2 border-zinc-600 border-t-transparent animate-spin" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-medium text-white truncate" title={video.topic}>
                {video.topic}
              </h4>
              {getStatusBadge(video.status)}
            </div>

            <div className="flex items-center gap-4 mt-2 text-sm text-zinc-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDate(video.createdAt)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatTime(video.createdAt)}
              </span>
            </div>

            {isInProgress && (
              <div className="mt-3">
                <Progress value={video.progress} className="h-1 bg-zinc-800" />
                <p className="text-xs text-zinc-500 mt-1">
                  {video.progress}% complete
                </p>
              </div>
            )}
          </div>

          {isCompleted && video.videoUrl && (
            <div className="shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(`/api/video/download/${video.jobId}`, '_blank')}
                className="text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </motion.div>

      <Dialog open={isPlaying} onOpenChange={setIsPlaying}>
        <DialogContent className="max-w-4xl bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-white">{video.topic}</DialogTitle>
          </DialogHeader>
          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            <video
              src={`/api/video/download/${video.jobId}`}
              controls
              autoPlay
              className="w-full h-full"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
