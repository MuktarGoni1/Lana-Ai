"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import { Play, Pause, RotateCcw, Volume2, MessageSquare, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useEnhancedAuth } from "@/hooks/useEnhancedAuth";
import PremiumFeatureGuard from "@/components/PremiumFeatureGuard";
import nextDynamic from "next/dynamic";

// Ensure this page is not statically generated
export const dynamic = 'force-dynamic';

// Dynamically import the original AI tutor component
const OriginalPersonalisedAiTutor = nextDynamic(
  () => import("@/components/personalised-Ai-tutor"), 
  { 
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
          <p className="text-white/60">Loading AI Tutor...</p>
        </div>
      </div>
    )
  }
);



function PersonalisedAiTutorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading, isPro, checkingPro } = useEnhancedAuth();
  
  // State for the UI elements
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentText, setCurrentText] = useState("Hello! I'm Lana, your AI tutor. Today we are going to explore the wonders of the solar system...");
  const [keyTakeaways, setKeyTakeaways] = useState([
    "The Sun is a medium-sized star.",
    "Jupiter is the largest planet.",
    "Gravity keeps planets in orbit."
  ]);
  
  // Optional: Get question from URL params if passed from another page
  const question = searchParams.get('q') || undefined;
  
  // Simulate updating text from AI responses
  useEffect(() => {
    if (question) {
      setCurrentText(`In response to your question "${question}", I'm explaining the relevant concepts...`);
    }
  }, [question]);
  
  // Handle back navigation based on authentication status
  const handleBackNavigation = () => {
    if (isAuthenticated) {
      // If user is authenticated, navigate to homepage instead of back
      router.push('/homepage');
    } else {
      // If user is not authenticated, go back in history
      router.back();
    }
  };
  
  // Handler for play/pause functionality
  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };
  
  // Handler for restart functionality
  const handleRestart = () => {
    // Reset the current text and simulate starting over
    setCurrentText("Hello! I'm Lana, your AI tutor. Today we are going to explore the wonders of the solar system...");
    setIsPlaying(true);
  };
  
  return (
    <div className="min-h-screen bg-black">
      {/* Top navigation bar with back button */}
      <div className="p-4 border-b border-gray-700 bg-gray-900 sticky top-0 z-50">
        <button
          onClick={handleBackNavigation}
          className="flex items-center gap-2 text-gray-300 hover:text-white hover:bg-gray-800 px-4 py-2 rounded-lg transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-left">
            <path d="m12 19-7-7 7-7"/>
            <path d="M19 12H5"/>
          </svg>
          Back
        </button>
      </div>
      
      <PremiumFeatureGuard featureName="Personalised AI Tutor" showUpgradeOption={true}>
        {/* If user is not Pro, show the original component */}
        {!checkingPro && !isPro ? (
          <OriginalPersonalisedAiTutor 
            question={question} 
            onBack={handleBackNavigation} 
          />
        ) : (
          <div className="max-w-5xl mx-auto p-4 space-y-6">
            {/* 1. The Avatar Section (Video Player) */}
            <Card className="relative aspect-video overflow-hidden rounded-3xl border-0 shadow-2xl bg-gray-900">
              {/* Replace this with your actual D-ID Video Stream / Element */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-full bg-black flex items-center justify-center">
                  <div className="text-center p-8">
                    <div className="w-24 h-24 mx-auto mb-6 bg-blue-600 rounded-full flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bot">
                        <path d="M12 8V4H8"/>
                        <rect width="16" height="12" x="4" y="8" rx="2"/>
                        <path d="M2 14h2"/>
                        <path d="M20 14h2"/>
                        <path d="M15 13v2"/>
                        <path d="M9 13v2"/>
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Lana AI Tutor</h3>
                    <p className="text-gray-400">Engaging with personalized learning experience</p>
                  </div>
                  <div className="absolute bottom-0 w-full h-32 bg-gradient-to-t from-black to-transparent" />
                </div>
              </div>

              {/* Video Overlay Controls */}
              <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button 
                    size="icon" 
                    variant="secondary" 
                    className="rounded-full w-12 h-12 bg-gray-700 hover:bg-gray-600 border-0"
                    onClick={handlePlayPause}
                  >
                    {isPlaying ? <Pause className="text-white" /> : <Play className="text-white fill-current" />}
                  </Button>
                  <Button size="icon" variant="ghost" className="text-gray-300" onClick={handleRestart}>
                    <RotateCcw />
                  </Button>
                </div>
                <div className="flex items-center gap-4 bg-gray-800 px-4 py-2 rounded-2xl">
                  <Volume2 className="text-gray-300 w-4 h-4" />
                  <div className="w-24 h-1 bg-gray-700 rounded-full">
                    <div className="w-2/3 h-full bg-blue-500 rounded-full" />
                  </div>
                </div>
              </div>
            </Card>

            {/* 2. The Text Response Field (The Lesson Content) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-4">
                <div className="flex items-center gap-2 text-blue-400 font-semibold text-sm uppercase tracking-wider">
                  <MessageSquare className="w-4 h-4" /> Live Explanation
                </div>
                <Card className="p-8 rounded-3xl border-gray-700 bg-gray-900 min-h-[300px]">
                  <p className="text-xl leading-relaxed text-white">
                    {currentText}
                  </p>
                  {/* Animated Cursor effect for "typing" feel */}
                  <span className="inline-block w-2 h-6 bg-blue-500 ml-1 animate-pulse align-middle" />
                </Card>
              </div>

              {/* 3. Sidebar: Key Takeaways (The "Pro" Touch) */}
              <div className="space-y-4">
                <h3 className="font-bold text-gray-500 uppercase text-xs tracking-widest">Key Takeaways</h3>
                <div className="space-y-3">
                  {keyTakeaways.map((point, i) => (
                    <div key={i} className="p-4 rounded-2xl bg-gray-800 border border-gray-700 text-sm font-medium flex gap-3">
                      <span className="text-blue-400">{i + 1}.</span> {point}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </PremiumFeatureGuard>
    </div>
  );
}

export default function PersonalisedAiTutorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    }>
      <PersonalisedAiTutorContent />
    </Suspense>
  );
}