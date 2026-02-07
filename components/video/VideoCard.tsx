'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
import { Play, Download, Clock, Calendar } from 'lucide-react';

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
        return <Badge className="bg-green-600 hover:bg-green-700">Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'rendering':
      case 'generating_assets':
      case 'scripting':
        return <Badge variant="secondary">In Progress</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const isCompleted = video.status === 'completed';
  const isInProgress = !['completed', 'failed'].includes(video.status);

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {/* Thumbnail placeholder */}
            <div 
              className={`w-24 h-16 rounded-lg flex items-center justify-center shrink-0 ${
                isCompleted 
                  ? 'bg-gradient-to-br from-blue-500 to-purple-600 cursor-pointer' 
                  : 'bg-gray-200'
              }`}
              onClick={() => isCompleted && setIsPlaying(true)}
            >
              {isCompleted ? (
                <Play className="w-6 h-6 text-white" />
              ) : (
                <div className="w-6 h-6 rounded-full border-2 border-gray-400 border-t-transparent animate-spin" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-medium truncate" title={video.topic}>
                  {video.topic}
                </h4>
                {getStatusBadge(video.status)}
              </div>

              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(video.createdAt)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatTime(video.createdAt)}
                </span>
              </div>

              {isInProgress && (
                <div className="mt-3">
                  <Progress value={video.progress} className="h-1.5" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {video.progress}% complete
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            {isCompleted && video.videoUrl && (
              <div className="shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`/api/video/download/${video.jobId}`, '_blank')}
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Video Player Dialog */}
      <Dialog open={isPlaying} onOpenChange={setIsPlaying}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{video.topic}</DialogTitle>
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
