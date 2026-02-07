'use client';

import { useState, useEffect } from 'react';
import { useVideoGeneration } from '@/hooks/useVideoGeneration';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle2, Sparkles, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface VideoGeneratorProps {
  onVideoComplete?: (jobId: string, videoUrl: string) => void;
  initialTopic?: string;
}

export function VideoGenerator({ onVideoComplete, initialTopic }: VideoGeneratorProps) {
  const [topic, setTopic] = useState(initialTopic || '');
  const { job, isLoading, error, generateVideo } = useVideoGeneration();

  useEffect(() => {
    if (initialTopic) {
      setTopic(initialTopic);
    }
  }, [initialTopic]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    
    await generateVideo(topic);
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Initializing...';
      case 'scripting':
        return 'Generating script with AI...';
      case 'generating_assets':
        return 'Creating audio and images...';
      case 'rendering':
        return 'Rendering video on AWS Lambda...';
      case 'completed':
        return 'Video ready!';
      case 'failed':
        return 'Generation failed';
      default:
        return 'Processing...';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-400';
      case 'failed':
        return 'text-red-400';
      default:
        return 'text-blue-400';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 border-green-500/20';
      case 'failed':
        return 'bg-red-500/10 border-red-500/20';
      default:
        return 'bg-blue-500/10 border-blue-500/20';
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700 mb-4">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-xl font-semibold text-white">Create AI Video Lesson</h2>
        <p className="text-zinc-400 text-sm mt-1">
          Enter a topic and we&apos;ll generate an explainer video for you
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="topic" className="text-sm font-medium text-zinc-300">
            Topic
          </label>
          <Input
            id="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., How photosynthesis works, What is quantum computing..."
            disabled={isLoading}
            className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-zinc-500 focus:ring-zinc-500"
          />
        </div>
        
        <Button 
          type="submit" 
          disabled={isLoading || !topic.trim()}
          className="w-full bg-white text-black hover:bg-zinc-200 border-0"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Zap className="mr-2 h-4 w-4" />
              Generate Video
            </>
          )}
        </Button>
      </form>

      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 text-red-400">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {job && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            <div className={`rounded-xl border p-4 ${getStatusBg(job.status)}`}>
              <div className="flex justify-between items-center mb-3">
                <span className={`text-sm font-medium ${getStatusColor(job.status)}`}>
                  {getStatusMessage(job.status)}
                </span>
                <span className="text-sm text-zinc-400">
                  {job.progress}%
                </span>
              </div>
              <Progress value={job.progress} className="h-1.5 bg-zinc-800" />
            </div>

            {job.status === 'completed' && job.videoUrl && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <Alert className="bg-green-500/10 border-green-500/20">
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                  <AlertDescription className="text-green-400">
                    Your video is ready!
                  </AlertDescription>
                </Alert>
                
                <div className="aspect-video bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800">
                  <video
                    src={`/api/video/download/${job.jobId}`}
                    controls
                    className="w-full h-full"
                    poster={job.manifest?.scenes?.[0]?.imagePrompt ? undefined : undefined}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                    onClick={() => window.open(`/api/video/download/${job.jobId}`, '_blank')}
                  >
                    Download Video
                  </Button>
                  {onVideoComplete && (
                    <Button
                      className="flex-1 bg-white text-black hover:bg-zinc-200"
                      onClick={() => onVideoComplete(job.jobId, job.videoUrl!)}
                    >
                      Add to Library
                    </Button>
                  )}
                </div>
              </motion.div>
            )}

            {job.status === 'failed' && (
              <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 text-red-400">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {job.error || 'Video generation failed. Please try again.'}
                </AlertDescription>
              </Alert>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
