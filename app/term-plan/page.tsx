"use client";

import React from "react";
import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEnhancedAuth } from "@/hooks/useEnhancedAuth";
import { Plus, X, BookOpen, ChevronDown, ChevronUp, Trash2, Loader2, ArrowRight, Sparkles, Calendar, Clock, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Logo from '@/components/logo';
import { supabase } from '@/lib/db';
import { useToast } from '@/hooks/use-toast';
import { dataSyncService } from '@/lib/services/dataSyncService';
import { handleErrorWithReload, resetErrorHandler } from '@/lib/error-handler';
/* ---------- Types ---------- */
interface Topic {
  id: string;
  name: string;
  dateAdded: string;
}

interface Subject {
  id: string;
  name: string;
  topics: Topic[];
  dateAdded: string;
  isExpanded: boolean;
}

/* ---------- main page ---------- */
import { Suspense } from "react";

function TermPlanPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useEnhancedAuth();
  const onboardingParam = searchParams.get("onboarding");
  const isOnboarding = onboardingParam === "1" || onboardingParam === "true";
  const returnTo = searchParams.get("returnTo");
  
  // Component definitions moved to top to avoid hoisting issues
  const AnimatedBackground = () => (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[128px] animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-[128px] animate-pulse delay-700" />
      <div className="absolute top-1/4 right-1/3 w-64 h-64 bg-pink-500/3 rounded-full blur-[96px] animate-pulse delay-1000" />
    </div>
  );
  
  
  // Authentication state is now handled by useEnhancedAuth hook
  
  // Check if this is a child user (no email) to adjust the flow
  // (isChildUser state already declared in the component definitions above)

  // Persist onboarding completion flag and redirect appropriately
  const [saving, setSaving] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>(() => {
    // Load from localStorage on initial render
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('lana_study_plan');
        return saved ? JSON.parse(saved) : [];
      } catch (e) {
        console.error('Failed to parse saved study plan:', e);
        return [];
      }
    }
    return [];
  });
  const [subjectInput, setSubjectInput] = useState("");
  const [topicInputs, setTopicInputs] = useState<{ [key: string]: string }>({});
  const [isChildUser, setIsChildUser] = useState(false);

  // Save subjects to localStorage whenever they change
  useEffect(() => {
    // Reset error handler on successful page load
    resetErrorHandler();
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('lana_study_plan', JSON.stringify(subjects));
    }
  }, [subjects]);  // Check if user is a child user
  useEffect(() => {
    if (user) {
      const isChild = user.email?.endsWith('@child.lana') || false;
      setIsChildUser(isChild);
    }
  }, [user]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      try {
        // Delay the redirect slightly to show the error message
        const timer = setTimeout(() => {
          router.push("/login");
        }, 3000);
        
        return () => clearTimeout(timer);
      } catch (err: any) {
        console.error('[term-plan] auth redirect error:', err.message);
        console.error('[term-plan] auth redirect error details:', err);
        // Use our error handler to reload the page instead of redirecting
        handleErrorWithReload(err, "Authentication check failed. Reloading page to try again...");
      }
    }
  }, [isAuthenticated, isLoading, router]);

  const saveToLocalAndCompleteOnboarding = async () => {
    setSaving(true);
    try {
      console.log('[term-plan] Saving subjects and topics to localStorage');
      console.log('[term-plan] Number of subjects to save:', subjects.length);
      
      // Save to localStorage
      localStorage.setItem('lana_study_plan', JSON.stringify(subjects));
      console.log('[term-plan] Successfully saved subjects and topics to localStorage');
      
      toast({ 
        title: 'Plan Saved Locally', 
        description: 'Your study plan has been saved locally and will be synced when connection is restored.' 
      });
      
      // Complete onboarding
      await completeOnboardingAndRedirect();
    } catch (err: any) {
      console.error('[term-plan] Error saving plan locally:', err.message);
      console.error('[term-plan] Save error details:', err);
      // Use our error handler to reload the page instead of continuing
      handleErrorWithReload(err, "Failed to save study plan locally. Reloading page to try again...");
    } finally {
      setSaving(false);
    }
  };
  
  const completeOnboardingAndRedirect = async () => {
    setSaving(true);
    try {
      console.log('[term-plan] Starting onboarding completion process');
      
      // Update user metadata to mark onboarding as complete
      if (user) {
        console.log('[term-plan] Updating user metadata with onboarding_complete flag');
        console.log('[term-plan] User ID:', user.id);
        
        const { error } = await supabase.auth.updateUser({
          data: { onboarding_complete: true },
        });
        
        if (error) {
          console.warn('[term-plan] failed to set onboarding_complete in metadata:', error.message);
          console.warn('[term-plan] metadata update error details:', error);
          toast({
            title: "Notice",
            description: "Unable to save onboarding status, but continuing anyway.",
            variant: "default",
          });
        } else {
          console.log('[term-plan] successfully updated user metadata with onboarding_complete flag');
        }
      } else {
        console.warn('[term-plan] no user found when trying to update user metadata');
        toast({
          title: "Notice",
          description: "Unable to save onboarding status, but continuing anyway.",
          variant: "default",
        });
      }

      // Cookie fallback to handle network failures and ensure middleware bypass
      try {
        console.log('[term-plan] Setting completion cookie');
        const oneYear = 60 * 60 * 24 * 365;
        document.cookie = `lana_onboarding_complete=1; Max-Age=${oneYear}; Path=/; SameSite=Lax`;
        console.log('[term-plan] successfully set completion cookie');
      } catch (cookieErr: any) {
        console.warn('[term-plan] failed to set completion cookie:', cookieErr.message);
        console.warn('[term-plan] cookie error details:', cookieErr);
        toast({
          title: "Notice",
          description: "Unable to save onboarding status locally, but continuing anyway.",
          variant: "default",
        });
      }

      // Success toast for UX feedback
      toast({ title: 'Onboarding Complete', description: 'Your plan has been saved. Redirecting to dashboard...' });

      // Redirect to homepage after onboarding completion
      console.log('[term-plan] redirecting to homepage after onboarding completion');
      router.push('/homepage');
    } catch (err: any) {
      console.error('[term-plan] completion error:', err.message);
      console.error('[term-plan] completion error details:', err);
      // Use our error handler to reload the page instead of redirecting
      handleErrorWithReload(err, "Onboarding completion failed. Reloading page to try again...");
    } finally {
      setSaving(false);
    }
  };
  
  // Save subjects and topics to localStorage before completing onboarding
  const saveAndCompleteOnboarding = async () => {
    setSaving(true);
    try {
      console.log('[term-plan] Saving subjects and topics');
      console.log('[term-plan] Number of subjects to save:', subjects.length);
      
      // Try to save to backend first
      if (!user?.email) {
        throw new Error('No authenticated user found');
      }
      
      // Save to localStorage as backup before attempting backend save
      try {
        localStorage.setItem('lana_study_plan_backup', JSON.stringify(subjects));
        console.log('[term-plan] Backup saved to localStorage');
      } catch (storageErr) {
        console.warn('[term-plan] Failed to save backup to localStorage:', storageErr);
      }
      
      // Save to backend API
      const response = await fetch('/api/study-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email,
          subjects
        }),
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to save study plan');
      }
      
      console.log('[term-plan] Successfully saved subjects and topics to backend');
      toast({ 
        title: 'Plan Saved', 
        description: 'Your study plan has been saved successfully.' 
      });
      
      // Clear local storage after successful save
      localStorage.removeItem('lana_study_plan');
      localStorage.removeItem('lana_study_plan_backup');
      
      // Complete onboarding
      await completeOnboardingAndRedirect();
    } catch (err: any) {
      console.error('[term-plan] Error saving plan:', err.message);
      console.error('[term-plan] Save error details:', err);
      
      // Try to save locally as fallback
      try {
        localStorage.setItem('lana_study_plan_pending', JSON.stringify({
          subjects,
          timestamp: Date.now(),
          email: user?.email
        }));
        console.log('[term-plan] Data saved locally as pending sync');
        
        toast({ 
          title: 'Saved Locally', 
          description: 'Study plan saved locally. Will sync when connection is restored.' 
        });
        
        // Still complete onboarding even if backend save failed
        await completeOnboardingAndRedirect();
      } catch (localSaveErr: any) {
        console.error('[term-plan] Failed to save locally:', localSaveErr.message);
        toast({
          title: "Save Failed",
          description: "Failed to save your study plan. Please try again later.",
          variant: "destructive",
        });
        
        // Use our error handler to reload the page instead of continuing
        handleErrorWithReload(err, "Failed to save study plan. Reloading page to try again...");
      }
    } finally {
      setSaving(false);
    }
  };
  
  // Backwards-compatible alias for existing button handlers
  const handleComplete = completeOnboardingAndRedirect;
  
  // Skip to homepage functionality
  const handleSkipToHomepage = () => {
    try {
      // Redirect to homepage when skipping
      console.log('[term-plan] skipping to homepage');
      router.push('/homepage');
    } catch (err: any) {
      console.error('[term-plan] skip error:', err.message);
      console.error('[term-plan] skip error details:', err);
      // Use our error handler to reload the page instead of redirecting
      handleErrorWithReload(err, "Failed to skip to homepage. Reloading page to try again...");
    }
  };

  const addSubject = () => {
    if (!subjectInput.trim()) return;
    
    const newSubject: Subject = {
      id: Date.now().toString(),
      name: subjectInput.trim(),
      topics: [],
      dateAdded: new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      }),
      isExpanded: true
    };
    
    const updatedSubjects = [...subjects, newSubject];
    setSubjects(updatedSubjects);
    setSubjectInput("");
  };

  const addTopic = (subjectId: string) => {
    const topicInput = topicInputs[subjectId];
    if (!topicInput?.trim()) return;

    const newTopic: Topic = {
      id: Date.now().toString(),
      name: topicInput.trim(),
      dateAdded: new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      })
    };

    const updatedSubjects = subjects.map(subject => 
      subject.id === subjectId 
        ? { ...subject, topics: [...subject.topics, newTopic] }
        : subject
    );
    
    setSubjects(updatedSubjects);
    setTopicInputs({ ...topicInputs, [subjectId]: "" });
  };

  const toggleSubject = (subjectId: string) => {
    const updatedSubjects = subjects.map(subject =>
      subject.id === subjectId
        ? { ...subject, isExpanded: !subject.isExpanded }
        : subject
    );
    
    setSubjects(updatedSubjects);
  };

  const deleteSubject = (subjectId: string) => {
    const updatedSubjects = subjects.filter(subject => subject.id !== subjectId);
    setSubjects(updatedSubjects);
  };

  const deleteTopic = (subjectId: string, topicId: string) => {
    const updatedSubjects = subjects.map(subject =>
      subject.id === subjectId
        ? { ...subject, topics: subject.topics.filter(topic => topic.id !== topicId) }
        : subject
    );
    
    setSubjects(updatedSubjects);
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center relative overflow-hidden">
        <AnimatedBackground />
        <div className="relative z-10 text-center space-y-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full mx-auto"
          />
          <p className="text-white/80">Loading your term planner...</p>
        </div>
      </div>
    );
  }

  // Show error and redirect if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center relative overflow-hidden">
        <AnimatedBackground />
        <div className="relative z-10 text-center space-y-4 max-w-md p-6">
          <X className="w-12 h-12 mx-auto text-red-500" />
          <h2 className="text-2xl font-semibold">Access Denied</h2>
          <p className="text-white/70">
            You must be authenticated to access this page.
          </p>
          <p className="text-white/50 text-sm">
            Redirecting to login page...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <AnimatedBackground />
      {/* header with logo */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <Logo className="w-10 h-10 md:w-12 md:h-12" />
          <h1 className="text-xl font-semibold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Term Planner</h1>
        </div>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => router.push("/homepage")}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm border border-white/20"
        >
          <X className="w-5 h-5" />
        </motion.button>
      </header>

      {/* body */}
      <main className="max-w-4xl mx-auto px-6 py-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="text-center mb-8">
            <motion.h2 
              className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-3"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {isChildUser ? "Welcome! Let's set up your learning plan" : "Build Your Study Plan"}
            </motion.h2>
            <motion.p 
              className="text-white/70 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {isChildUser 
                ? "Create your personalized study plan to get started with your learning journey" 
                : "Organize your subjects and topics for the term"}
            </motion.p>
          </div>

          {/* Add Subject Input */}
          <motion.div 
            className="flex gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <input
              value={subjectInput}
              onChange={(e) => setSubjectInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addSubject()}
              placeholder="Enter subject name (e.g., Mathematics, Physics)"
              className="flex-1 px-5 py-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/20 
                       focus:outline-none focus:ring-2 focus:ring-blue-500/30 
                       placeholder:text-white/40 transition-all shadow-inner"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={addSubject}
              className="px-6 py-4 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium 
                       flex items-center gap-2 hover:shadow-lg hover:shadow-blue-500/25 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Subject
            </motion.button>
          </motion.div>

          {/* Subjects List */}
          <AnimatePresence>
            <div className="space-y-4">
              {subjects.map((subject) => (
                <motion.div
                  key={subject.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm bg-white/5 shadow-lg shadow-white/5"
                >
                  {/* Subject Header */}
                  <div className="p-5 bg-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => toggleSubject(subject.id)}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors backdrop-blur-sm border border-white/10"
                      >
                        {subject.isExpanded ? (
                          <ChevronDown className="w-5 h-5" />
                        ) : (
                          <ChevronUp className="w-5 h-5" />
                        )}
                      </motion.button>
                      <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-white/10">
                        <BookOpen className="w-5 h-5 text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{subject.name}</h3>
                        <div className="flex items-center gap-3 mt-1">
                          <div className="flex items-center gap-1 text-xs text-white/50">
                            <Calendar className="w-3 h-3" />
                            <span>{subject.dateAdded}</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-white/50">
                            <Sparkles className="w-3 h-3" />
                            <span>{subject.topics.length} topics</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => deleteSubject(subject.id)}
                      className="p-2 hover:bg-red-500/10 rounded-full transition-colors backdrop-blur-sm border border-white/10"
                    >
                      <Trash2 className="w-4 h-4 text-white/50 hover:text-red-400" />
                    </motion.button>
                  </div>

                  {/* Topics Section */}
                  <AnimatePresence>
                    {subject.isExpanded && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: "auto" }}
                        exit={{ height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-5 space-y-4 bg-white/5">
                          {/* Add Topic Input */}
                          <div className="flex gap-3">
                            <input
                              value={topicInputs[subject.id] || ""}
                              onChange={(e) => setTopicInputs({
                                ...topicInputs,
                                [subject.id]: e.target.value
                              })}
                              onKeyDown={(e) => e.key === "Enter" && addTopic(subject.id)}
                              placeholder="Add a topic (e.g., Limits & Continuity)"
                              className="flex-1 px-4 py-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 
                                       focus:outline-none focus:ring-2 focus:ring-blue-500/30 
                                       placeholder:text-white/40 text-sm transition-all shadow-inner"
                            />
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => addTopic(subject.id)}
                              className="px-4 py-3 rounded-xl bg-gradient-to-r from-blue-500/30 to-purple-500/30 text-white 
                                       flex items-center gap-2 hover:bg-gradient-to-r hover:from-blue-500/40 hover:to-purple-500/40 transition-all text-sm backdrop-blur-sm border border-white/10"
                            >
                              <Plus className="w-3 h-3" />
                              Add
                            </motion.button>
                          </div>

                          {/* Topics List */}
                          <div className="space-y-3">
                            {subject.topics.map((topic, index) => (
                              <motion.div
                                key={topic.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ delay: 0.05 * index }}
                                className="flex items-center justify-between p-4 rounded-xl 
                                         bg-white/5 border border-white/10 group cursor-pointer hover:bg-white/10 transition-all backdrop-blur-sm shadow-sm"
                                onClick={() => router.push(`/homepage?topic=${encodeURIComponent(topic.name)}`)}
                              >
                                <div className="flex items-center gap-3 flex-1">
                                  <div className="p-1.5 rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20">
                                    <div className="w-2 h-2 rounded-full bg-blue-400" />
                                  </div>
                                  <span className="text-sm">{topic.name}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-1 text-xs text-white/50">
                                    <Clock className="w-3 h-3" />
                                    <span>{topic.dateAdded}</span>
                                  </div>
                                  <motion.button
                                    whileHover={{ scale: 1.2 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteTopic(subject.id, topic.id);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 p-1.5 
                                             hover:bg-red-500/10 rounded-full transition-all backdrop-blur-sm border border-white/10"
                                  >
                                    <X className="w-3 h-3" />
                                  </motion.button>
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      router.push(`/homepage?topic=${encodeURIComponent(topic.name)}`);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 p-1.5 
                                             hover:bg-blue-500/10 rounded-full transition-all backdrop-blur-sm border border-white/10"
                                  >
                                    <ArrowRight className="w-3 h-3" />
                                  </motion.button>
                                </div>
                              </motion.div>
                            ))}
                          </div>

                          {subject.topics.length === 0 && (
                            <p className="text-center text-white/30 text-sm py-4">
                              No topics added yet
                            </p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>

          {subjects.length === 0 && (
            <motion.div 
              className="text-center py-16 text-white/30 border-2 border-dashed border-white/10 rounded-2xl p-8 backdrop-blur-sm bg-white/2"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="mx-auto mb-4"
              >
                <BookOpen className="w-16 h-16 mx-auto opacity-30" />
              </motion.div>
              <h3 className="text-xl font-medium text-white/60 mb-2">No subjects added yet</h3>
              <p className="text-white/50 max-w-md mx-auto">Start by adding your first subject using the form above to begin organizing your study plan.</p>
            </motion.div>
          )}
        </motion.div>
      </main>

      {/* footer actions (only during onboarding) */}
      {isOnboarding && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent border-t border-white/10 p-4 backdrop-blur-xl"
        >
          <div className="max-w-4xl mx-auto flex items-center justify-end gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSkipToHomepage}
              disabled={saving}
              className="px-5 py-3 rounded-xl border border-white/10 hover:bg-white/10 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 backdrop-blur-sm"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Skipping...
                </>
              ) : (
                "Skip for now"
              )}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={saveAndCompleteOnboarding}
              disabled={saving}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium hover:shadow-lg hover:shadow-green-500/25 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" /> Save Plan & Continue
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default function TermPlanPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-8 h-8 border-2 border-white/10 border-t-white/30 rounded-full animate-spin mx-auto" />
            <p className="text-white/30 text-sm">Loading…</p>
          </div>
        </div>
      }
    >
      <TermPlanPageContent />
    </Suspense>
  );
}