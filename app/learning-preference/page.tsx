"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useEnhancedAuth } from "@/hooks/useEnhancedAuth";
import { supabase } from "@/lib/db";
import { Bot, Video, ArrowRight, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function LearningPreferencePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useEnhancedAuth();
  const { toast } = useToast();
  const [preference, setPreference] = useState<"avatar" | "video" | null>(null);
  const [loading, setLoading] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  const handleSubmit = async () => {
    if (!preference) {
      toast({
        title: "Selection Required",
        description: "Please select a learning preference.",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Save preference to user metadata
      const { error } = await supabase.auth.updateUser({
        data: {
          learning_preference: preference,
          onboarding_step: 2
        }
      });
      
      if (error) throw error;
      
      toast({
        title: "Preference Saved",
        description: "Successfully saved learning preference."
      });
      
      router.push("/schedule");
    } catch (error: any) {
      console.error("Preference save error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save preference. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-white/10 border-t-white/30 rounded-full animate-spin mx-auto" />
          <p className="text-white/30 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        {/* Progress indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white/20 rounded-full"></div>
            <div className="w-2 h-2 bg-white/80 rounded-full"></div>
            <div className="w-2 h-2 bg-white/20 rounded-full"></div>
            <div className="w-2 h-2 bg-white/20 rounded-full"></div>
            <div className="w-2 h-2 bg-white/20 rounded-full"></div>
          </div>
        </div>
        
        <div className="bg-white/[0.02] backdrop-blur-sm rounded-2xl border border-white/[0.05] p-8 space-y-6">
          <div className="space-y-3">
            <div className="w-14 h-14 rounded-xl bg-white/[0.05] flex items-center justify-center mx-auto">
              <Bot className="w-7 h-7 text-white/70" />
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold text-white">Learning Style</h1>
              <p className="text-white/40 text-sm">How would you prefer to learn?</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <button
              onClick={() => setPreference("avatar")}
              className={`w-full p-6 rounded-xl border-2 transition-all duration-200 ${
                preference === "avatar" 
                  ? "border-white bg-white/10" 
                  : "border-white/20 hover:border-white/40"
              }`}
            >
              <div className="text-4xl mb-4">👤</div>
              <h3 className="font-medium text-lg mb-2">Personalized Avatar Explainer</h3>
              <p className="text-sm text-white/50">
                Interactive AI tutor that explains concepts in a conversational way
              </p>
            </button>
            
            <button
              onClick={() => setPreference("video")}
              className={`w-full p-6 rounded-xl border-2 transition-all duration-200 ${
                preference === "video" 
                  ? "border-white bg-white/10" 
                  : "border-white/20 hover:border-white/40"
              }`}
            >
              <div className="text-4xl mb-4">🎥</div>
              <h3 className="font-medium text-lg mb-2">Visual Explainer Videos</h3>
              <p className="text-sm text-white/50">
                Engaging animated videos that break down complex topics
              </p>
            </button>
          </div>
          
          <button
            onClick={handleSubmit}
            disabled={!preference || loading}
            className="w-full px-6 py-3 rounded-xl bg-white text-black font-medium text-sm
                     hover:bg-white/90 transition-all duration-200
                     disabled:opacity-50 disabled:cursor-not-allowed
                     flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <span>Continue</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}