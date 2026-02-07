'use client';

import { useSearchParams } from 'next/navigation';
import { VideoGenerator } from '@/components/video/VideoGenerator';
import { VideoHistory } from '@/components/video/VideoHistory';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

function VideoExplainerContent() {
  const searchParams = useSearchParams();
  const topicFromUrl = searchParams.get('topic');

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">AI Video Lessons</h1>
          <p className="text-muted-foreground">
            Generate custom explainer videos on any topic using AI
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr,400px]">
          {/* Main content - Video Generator */}
          <div className="space-y-8">
            <VideoGenerator initialTopic={topicFromUrl || undefined} />
          </div>

          {/* Sidebar - Video History */}
          <div className="space-y-8">
            <VideoHistory />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VideoExplainerPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-6xl mx-auto space-y-8">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-4 w-96" />
          <div className="grid gap-8 lg:grid-cols-[1fr,400px]">
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
          </div>
        </div>
      </div>
    }>
      <VideoExplainerContent />
    </Suspense>
  );
}
