'use client';

import { useVideoHistory } from '@/hooks/useVideoHistory';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { VideoCard } from './VideoCard';
import { Video, RefreshCw, Film } from 'lucide-react';

export function VideoHistory() {
  const { videos, isLoading, error, refetch } = useVideoHistory();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-600">Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'rendering':
        return <Badge variant="secondary">Rendering</Badge>;
      case 'generating_assets':
        return <Badge variant="secondary">Generating Assets</Badge>;
      case 'scripting':
        return <Badge variant="secondary">Writing Script</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Your Videos</CardTitle>
          <CardDescription>Loading your video history...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Your Videos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={refetch} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Film className="w-5 h-5" />
            Your Videos
          </CardTitle>
          <CardDescription>
            {videos.length} {videos.length === 1 ? 'video' : 'videos'} generated
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={refetch}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {videos.length === 0 ? (
          <div className="text-center py-12">
            <Video className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No videos yet</h3>
            <p className="text-muted-foreground">
              Generate your first AI video lesson above!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {videos.map((video) => (
              <VideoCard key={video.jobId} video={video} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
