'use client';

import { useSearchParams } from 'next/navigation';
import { VideoGenerator } from '@/components/video/VideoGenerator';
import { VideoHistory } from '@/components/video/VideoHistory';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Video, Sparkles, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

function VideoExplainerContent() {
  const searchParams = useSearchParams();
  const topicFromUrl = searchParams.get('topic');

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Chat
            </Link>
            
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                <Video className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">AI Video Lessons</h1>
                <p className="text-zinc-400">
                  Generate custom explainer videos on any topic using AI
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid gap-8 lg:grid-cols-[1fr,400px]"
          >
            <div className="space-y-8">
              <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6">
                <VideoGenerator initialTopic={topicFromUrl || undefined} />
              </div>
            </div>

            <div className="space-y-8">
              <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6">
                <VideoHistory />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function VideoExplainerPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="container mx-auto py-8 px-4">
          <div className="max-w-6xl mx-auto space-y-8">
            <Skeleton className="h-12 w-64 bg-zinc-800" />
            <Skeleton className="h-4 w-96 bg-zinc-800" />
            <div className="grid gap-8 lg:grid-cols-[1fr,400px]">
              <Skeleton className="h-96 bg-zinc-800 rounded-2xl" />
              <Skeleton className="h-96 bg-zinc-800 rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    }>
      <VideoExplainerContent />
    </Suspense>
  );
}
