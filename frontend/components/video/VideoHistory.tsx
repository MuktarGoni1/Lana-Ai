'use client';

import { useVideoHistory } from '@/hooks/useVideoHistory';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { VideoCard } from './VideoCard';
import { RefreshCw, Film, Video } from 'lucide-react';
import { motion } from 'framer-motion';

export function VideoHistory() {
  const { videos, isLoading, error, refetch } = useVideoHistory();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Completed</Badge>;
      case 'failed':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Failed</Badge>;
      case 'rendering':
        return <Badge className="bg-zinc-700 text-zinc-300 border-zinc-600">Rendering</Badge>;
      case 'generating_assets':
        return <Badge className="bg-zinc-700 text-zinc-300 border-zinc-600">Generating Assets</Badge>;
      case 'scripting':
        return <Badge className="bg-zinc-700 text-zinc-300 border-zinc-600">Writing Script</Badge>;
      default:
        return <Badge variant="outline" className="border-zinc-700 text-zinc-400">Pending</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center">
            <Film className="w-5 h-5 text-zinc-400" />
          </div>
          <div>
            <Skeleton className="h-5 w-24 bg-zinc-800" />
            <Skeleton className="h-4 w-32 mt-1 bg-zinc-800" />
          </div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full bg-zinc-800 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center">
            <Film className="w-5 h-5 text-zinc-400" />
          </div>
          <div>
            <h3 className="text-white font-medium">Your Videos</h3>
          </div>
        </div>
        <div className="text-center py-8">
          <p className="text-red-400 mb-4">{error}</p>
          <Button onClick={refetch} variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center">
            <Film className="w-5 h-5 text-zinc-400" />
          </div>
          <div>
            <h3 className="text-white font-medium">Your Videos</h3>
            <p className="text-zinc-500 text-sm">
              {videos.length} {videos.length === 1 ? 'video' : 'videos'} generated
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={refetch} className="text-zinc-400 hover:text-white">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {videos.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12 border border-dashed border-zinc-800 rounded-xl"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-900 mb-4">
            <Video className="w-8 h-8 text-zinc-500" />
          </div>
          <h3 className="text-zinc-300 font-medium mb-2">No videos yet</h3>
          <p className="text-zinc-500 text-sm">
            Generate your first AI video lesson above!
          </p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {videos.map((video) => (
            <motion.div
              key={video.jobId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <VideoCard video={video} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
