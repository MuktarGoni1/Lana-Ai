'use client';

import { useState, useEffect } from 'react';
import { useVideoGeneration } from '@/hooks/useVideoGeneration';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Video, AlertCircle, CheckCircle2 } from 'lucide-react';

interface VideoGeneratorProps {
  onVideoComplete?: (jobId: string, videoUrl: string) => void;
  initialTopic?: string;
}

export function VideoGenerator({ onVideoComplete, initialTopic }: VideoGeneratorProps) {
  const [topic, setTopic] = useState(initialTopic || '');
  const { job, isLoading, error, generateVideo } = useVideoGeneration();

  // Update topic when initialTopic prop changes (e.g., from URL)
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
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      default:
        return 'text-blue-600';
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="w-6 h-6" />
          Create AI Video Lesson
        </CardTitle>
        <CardDescription>
          Enter a topic and we'll generate an explainer video for you
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="topic" className="text-sm font-medium">
              Topic
            </label>
            <Input
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., How photosynthesis works, What is quantum computing..."
              disabled={isLoading}
              className="w-full"
            />
          </div>
          
          <Button 
            type="submit" 
            disabled={isLoading || !topic.trim()}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Video className="mr-2 h-4 w-4" />
                Generate Video
              </>
            )}
          </Button>
        </form>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {job && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className={`text-sm font-medium ${getStatusColor(job.status)}`}>
                  {getStatusMessage(job.status)}
                </span>
                <span className="text-sm text-muted-foreground">
                  {job.progress}%
                </span>
              </div>
              <Progress value={job.progress} className="h-2" />
            </div>

            {job.status === 'completed' && job.videoUrl && (
              <div className="space-y-4">
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Your video is ready!
                  </AlertDescription>
                </Alert>
                
                <div className="aspect-video bg-black rounded-lg overflow-hidden">
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
                    className="flex-1"
                    onClick={() => window.open(`/api/video/download/${job.jobId}`, '_blank')}
                  >
                    Download Video
                  </Button>
                  {onVideoComplete && (
                    <Button
                      className="flex-1"
                      onClick={() => onVideoComplete(job.jobId, job.videoUrl!)}
                    >
                      Add to Library
                    </Button>
                  )}
                </div>
              </div>
            )}

            {job.status === 'failed' && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {job.error || 'Video generation failed. Please try again.'}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
