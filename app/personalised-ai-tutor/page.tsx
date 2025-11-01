"use client";

import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

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
  
  // Optional: Get question from URL params if passed from another page
  const question = searchParams.get('q') || undefined;
  
  return (
    <PersonalisedAiTutor
      question={question}
      onBack={() => router.back()}
    />
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