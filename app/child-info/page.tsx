"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";
import { supabase } from "@/lib/db";
import { User, GraduationCap, Calendar, ArrowRight, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ChildInfoPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useUnifiedAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    nickname: "",
    age: "",
    grade: "",
    interests: ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.nickname.trim()) {
      newErrors.nickname = "Nickname is required";
    } else if (formData.nickname.trim().length < 2) {
      newErrors.nickname = "Nickname must be at least 2 characters";
    }
    
    if (!formData.age) {
      newErrors.age = "Age is required";
    } else {
      const age = parseInt(formData.age);
      if (isNaN(age) || age < 6 || age > 18) {
        newErrors.age = "Age must be between 6 and 18";
      }
    }
    
    if (!formData.grade) {
      newErrors.grade = "Grade is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please correct the errors in the form.",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Save child information to user metadata
      const { error } = await supabase.auth.updateUser({
        data: {
          child_info: {
            nickname: formData.nickname.trim(),
            age: parseInt(formData.age),
            grade: formData.grade,
            interests: formData.interests.trim()
          },
          onboarding_step: 1
        }
      });
      
      if (error) throw error;
      
      toast({
        title: "Child Information Saved",
        description: "Successfully saved child details."
      });
      
      router.push("/learning-preference");
    } catch (error: any) {
      console.error("Child info save error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save child information. Please try again.",
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
      <div className="w-full max-w-md">
        {/* Progress indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white/80 rounded-full"></div>
            <div className="w-8 h-2 bg-white/20 rounded-full"></div>
            <div className="w-2 h-2 bg-white/20 rounded-full"></div>
            <div className="w-2 h-2 bg-white/20 rounded-full"></div>
            <div className="w-2 h-2 bg-white/20 rounded-full"></div>
          </div>
        </div>
        
        <div className="bg-white/[0.02] backdrop-blur-sm rounded-2xl border border-white/[0.05] p-8 space-y-6">
          <div className="text-center space-y-3">
            <div className="w-14 h-14 rounded-xl bg-white/[0.05] flex items-center justify-center mx-auto">
              <User className="w-7 h-7 text-white/70" />
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold text-white">Child Information</h1>
              <p className="text-white/40 text-sm">Help us personalize the learning experience</p>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="nickname" className="block text-xs text-white/40 mb-2">
                Child's Nickname
              </label>
              <input
                id="nickname"
                type="text"
                value={formData.nickname}
                onChange={(e) => {
                  setFormData({...formData, nickname: e.target.value});
                  if (errors.nickname) setErrors({...errors, nickname: ""});
                }}
                placeholder="Enter nickname"
                className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.05] 
                         text-white placeholder-white/20 text-sm
                         focus:outline-none focus:border-white/10 focus:bg-white/[0.05]
                         transition-all duration-200"
                required
              />
              {errors.nickname && (
                <p className="text-red-400 text-xs mt-1">{errors.nickname}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="age" className="block text-xs text-white/40 mb-2">
                Age (6-18 years)
              </label>
              <div className="relative">
                <input
                  id="age"
                  type="number"
                  min="6"
                  max="18"
                  value={formData.age}
                  onChange={(e) => {
                    setFormData({...formData, age: e.target.value});
                    if (errors.age) setErrors({...errors, age: ""});
                  }}
                  placeholder="Enter age"
                  className="w-full pl-10 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.05] 
                           text-white placeholder-white/20 text-sm
                           focus:outline-none focus:border-white/10 focus:bg-white/[0.05]
                           transition-all duration-200"
                  required
                />
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
              </div>
              {errors.age && (
                <p className="text-red-400 text-xs mt-1">{errors.age}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="grade" className="block text-xs text-white/40 mb-2">
                Current Grade
              </label>
              <div className="relative">
                <select
                  id="grade"
                  value={formData.grade}
                  onChange={(e) => {
                    setFormData({...formData, grade: e.target.value});
                    if (errors.grade) setErrors({...errors, grade: ""});
                  }}
                  className="w-full pl-10 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.05] 
                           text-white text-sm appearance-none
                           focus:outline-none focus:border-white/10 focus:bg-white/[0.05]
                           transition-all duration-200
                           [&>option]:bg-black [&>option]:text-white"
                  required
                >
                  <option value="" disabled className="bg-black text-white/50">
                    Select Grade
                  </option>
                  {Array.from({length: 7}, (_, i) => 6 + i).map(grade => (
                    <option key={grade} value={grade} className="bg-black">
                      Grade {grade}
                    </option>
                  ))}
                  <option value="college" className="bg-black">College</option>
                </select>
                <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
              </div>
              {errors.grade && (
                <p className="text-red-400 text-xs mt-1">{errors.grade}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="interests" className="block text-xs text-white/40 mb-2">
                Interests (Optional)
              </label>
              <textarea
                id="interests"
                value={formData.interests}
                onChange={(e) => setFormData({...formData, interests: e.target.value})}
                placeholder="What subjects or topics is your child interested in?"
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.05] 
                         text-white placeholder-white/20 text-sm
                         focus:outline-none focus:border-white/10 focus:bg-white/[0.05]
                         transition-all duration-200 resize-none"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 rounded-xl bg-white text-black font-medium text-sm
                       hover:bg-white/90 transition-all duration-200
                       disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>Continue</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}