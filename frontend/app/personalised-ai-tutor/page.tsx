"use client";

import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";

const PersonalisedAiTutor = dynamic(
  () => import("@/components/personalised-Ai-tutor"), 
  { 
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 text-white animate-spin mx-auto" />
          <p className="text-white/60">Loading AI Tutor...</p>
        </div>
      </div>
    )
  }
);

function PersonalisedAiTutorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading } = useUnifiedAuth();
  
  // Optional: Get question from URL params if passed from another page
  const question = searchParams.get('q') || undefined;
  
  // Handle back navigation based on authentication status
  const handleBackNavigation = () => {
    if (isAuthenticated) {
      // If user is authenticated, navigate to homepage instead of back
      router.push('/');
    } else {
      // If user is not authenticated, go back in history
      router.back();
    }
  };
  
  return (
    <div className="min-h-screen bg-black">
      {/* Top navigation bar with back button */}
      <div className="p-3 sm:p-4 border-b border-white/10 bg-black/20 backdrop-blur-sm sticky top-0 z-50">
        <button
          onClick={handleBackNavigation}
          className="flex items-center gap-2 text-white/80 hover:text-white hover:bg-white/10 px-3 py-2 rounded-lg transition-colors text-sm sm:text-base active:scale-95 min-h-[40px]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-left">
            <path d="m12 19-7-7 7-7"/>
            <path d="M19 12H5"/>
          </svg>
          <span className="hidden sm:inline">Back</span>
        </button>
      </div>
      
      <PersonalisedAiTutor
        question={question}
        onBack={handleBackNavigation}
      />
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
