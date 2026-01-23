"use client";

import React from "react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useComprehensiveAuth } from "@/contexts/ComprehensiveAuthContext";
import { Plus, X, BookOpen, ChevronDown, ChevronUp, Trash2, Loader2, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Logo from '@/components/logo';
import { supabase } from '@/lib/db';
import { useToast } from '@/hooks/use-toast';
import { dataSyncService } from '@/lib/services/dataSyncService';
import { handleErrorWithReload, resetErrorHandler } from '@/lib/error-handler';

// Ensure this page is not statically generated
export const dynamic = 'force-dynamic';
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
  const { user, isAuthenticated, isLoading, completeOnboarding } = useComprehensiveAuth();
  const onboardingParam = searchParams.get("onboarding");
  const isOnboarding = onboardingParam === "1" || onboardingParam === "true";
  const returnTo = searchParams.get("returnTo");
  
  // Authentication state is now handled by useEnhancedAuth hook
  
  // Check if this is a child user (no email) to adjust the flow
  const [isChildUser, setIsChildUser] = useState(false);

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

  // Save subjects to localStorage whenever they change
  useEffect(() => {
    // Reset error handler on successful page load
    resetErrorHandler();
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('lana_study_plan', JSON.stringify(subjects));
    }
  }, [subjects]);
  
  // Check if user is a child user
  useEffect(() => {
    if (user) {
      const isChild = user.email?.endsWith('@child.lana') || false;
      setIsChildUser(isChild);
    }
  }, [user]);
  
  // Check for pending sync data on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const pendingData = localStorage.getItem('lana_study_plan_pending');
      if (pendingData) {
        try {
          const pendingObj = JSON.parse(pendingData);
          // Attempt to sync pending data if online
          if (navigator.onLine && user?.email) {
            syncPendingData(pendingObj, user.email);
          }
        } catch (e) {
          console.error('Error parsing pending data:', e);
        }
      }
    }
  }, [user]);
  
  const syncPendingData = async (pendingObj: any, userEmail: string) => {
    try {
      const response = await fetch('/api/study-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userEmail,
          subjects: pendingObj.subjects
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Clear pending data on success
        localStorage.removeItem('lana_study_plan_pending');
        toast({
          title: 'Sync Complete',
          description: 'Your study plan has been synced successfully.',
        });
      }
    } catch (error) {
      console.error('Error syncing pending data:', error);
      toast({
        title: 'Sync Failed',
        description: 'Could not sync your study plan. Will retry when connection is restored.',
        variant: 'destructive',
      });
    }
  };

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
      
      // Use the comprehensive auth service to complete onboarding
      // This ensures proper state management and metadata updates
      // Use the comprehensive auth service to complete onboarding
      
      const result = await completeOnboarding();
      
      if (!result.success) {
        console.warn('[term-plan] failed to complete onboarding via service:', result.error);
        toast({
          title: "Notice",
          description: "Unable to save onboarding status, but continuing anyway.",
          variant: "default",
        });
      } else {
        console.log('[term-plan] successfully completed onboarding via service');
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
      
      // Save to backend API immediately (optimistic approach)
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
      
      // Save to localStorage as fallback
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

  const addSubject = async () => {
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
    
    // Optimistically update UI
    const updatedSubjects = [...subjects, newSubject];
    setSubjects(updatedSubjects);
    
    try {
      // Send to backend immediately
      const response = await fetch('/api/study-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user?.email,
          subjects: updatedSubjects
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to save subject to backend');
      }

      // Success - no need for additional action
      toast({ 
        title: 'Subject Added', 
        description: `"${subjectInput.trim()}" has been saved successfully.` 
      });
    } catch (error) {
      console.error('Error saving subject to backend:', error);
      
      toast({ 
        title: 'Saved Locally', 
        description: `"${subjectInput.trim()}" saved locally. Will sync when connection is restored.` 
      });
    }
    
    setSubjectInput("");
  };

  const addTopic = async (subjectId: string) => {
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
    
    // Optimistically update UI
    setSubjects(updatedSubjects);
    
    try {
      // Send to backend immediately
      const response = await fetch('/api/study-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user?.email,
          subjects: updatedSubjects
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to save topic to backend');
      }

      // Success - no need for additional action
      toast({ 
        title: 'Topic Added', 
        description: `"${topicInput.trim()}" has been saved successfully.` 
      });
    } catch (error) {
      console.error('Error saving topic to backend:', error);
      
      toast({ 
        title: 'Saved Locally', 
        description: `"${topicInput.trim()}" saved locally. Will sync when connection is restored.` 
      });
    }
    
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

  const deleteSubject = async (subjectId: string) => {
    const subjectToDelete = subjects.find(s => s.id === subjectId)?.name || '';
    const updatedSubjects = subjects.filter(subject => subject.id !== subjectId);
    
    // Optimistically update UI
    setSubjects(updatedSubjects);
    
    try {
      // Send to backend immediately
      const response = await fetch('/api/study-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user?.email,
          subjects: updatedSubjects
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to delete subject from backend');
      }

      // Success - no need for additional action
      toast({ 
        title: 'Subject Deleted', 
        description: `"${subjectToDelete}" has been deleted successfully.` 
      });
    } catch (error) {
      console.error('Error deleting subject from backend:', error);
      
      toast({ 
        title: 'Deletion Pending', 
        description: `"${subjectToDelete}" deletion will sync when connection is restored.` 
      });
    }
  };

  const deleteTopic = async (subjectId: string, topicId: string) => {
    const topicToDelete = subjects
      .find(s => s.id === subjectId)
      ?.topics.find(t => t.id === topicId)?.name || '';

    const updatedSubjects = subjects.map(subject =>
      subject.id === subjectId
        ? { ...subject, topics: subject.topics.filter(topic => topic.id !== topicId) }
        : subject
    );
    
    // Optimistically update UI
    setSubjects(updatedSubjects);
    
    try {
      // Send to backend immediately
      const response = await fetch('/api/study-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user?.email,
          subjects: updatedSubjects
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to delete topic from backend');
      }

      // Success - no need for additional action
      toast({ 
        title: 'Topic Deleted', 
        description: `"${topicToDelete}" has been deleted successfully.` 
      });
    } catch (error) {
      console.error('Error deleting topic from backend:', error);
      
      toast({ 
        title: 'Deletion Pending', 
        description: `"${topicToDelete}" deletion will sync when connection is restored.` 
      });
    }
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-white/10 border-t-white/30 rounded-full animate-spin mx-auto" />
          <p className="text-white/30 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // Show error and redirect if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md p-6">
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
    <div className="min-h-screen bg-black text-white">
      {/* header with logo */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo className="w-10 h-10 md:w-12 md:h-12" />
          <h1 className="text-xl font-semibold">Term Planner</h1>
        </div>
        <button
          onClick={() => router.push("/homepage")}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      {/* body */}
      <main className="max-w-4xl mx-auto p-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">
              {isChildUser ? "Welcome! Let's set up your learning plan" : "Build Your Study Plan"}
            </h2>
            <p className="text-white/70">
              {isChildUser 
                ? "Create your personalized study plan to get started with your learning journey" 
                : "Organize your subjects and topics for the term"}
            </p>
          </div>

          {/* Add Subject Input */}
          <div className="flex gap-2">
            <input
              value={subjectInput}
              onChange={(e) => setSubjectInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addSubject()}
              placeholder="Enter subject name (e.g., Mathematics, Physics)"
              className="flex-1 px-4 py-3 rounded-lg bg-white/5 border border-white/10 
                       focus:outline-none focus:ring-2 focus:ring-white/20 
                       placeholder:text-white/40 transition-all"
            />
            <button
              onClick={addSubject}
              className="px-6 py-3 bg-white text-black rounded-lg font-medium 
                       flex items-center gap-2 hover:bg-white/90 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Subject
            </button>
          </div>

          {/* Subjects List */}
          <AnimatePresence>
            <div className="space-y-4">
              {subjects.map((subject) => (
                <motion.div
                  key={subject.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="border border-white/10 rounded-lg overflow-hidden"
                >
                  {/* Subject Header */}
                  <div className="p-4 bg-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <button
                        onClick={() => toggleSubject(subject.id)}
                        className="p-1 hover:bg-white/10 rounded transition-colors"
                      >
                        {subject.isExpanded ? (
                          <ChevronDown className="w-5 h-5" />
                        ) : (
                          <ChevronUp className="w-5 h-5" />
                        )}
                      </button>
                      <BookOpen className="w-5 h-5 text-white/60" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{subject.name}</h3>
                        <p className="text-sm text-white/50">
                          Added on {subject.dateAdded} • {subject.topics.length} topics
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteSubject(subject.id)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-white/50 hover:text-white/80" />
                    </button>
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
                        <div className="p-4 space-y-3 bg-black/20">
                          {/* Add Topic Input */}
                          <div className="flex gap-2">
                            <input
                              value={topicInputs[subject.id] || ""}
                              onChange={(e) => setTopicInputs({
                                ...topicInputs,
                                [subject.id]: e.target.value
                              })}
                              onKeyDown={(e) => e.key === "Enter" && addTopic(subject.id)}
                              placeholder="Add a topic (e.g., Limits & Continuity)"
                              className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 
                                       focus:outline-none focus:ring-2 focus:ring-white/20 
                                       placeholder:text-white/40 text-sm transition-all"
                            />
                            <button
                              onClick={() => addTopic(subject.id)}
                              className="px-4 py-2 bg-white/10 text-white rounded-lg 
                                       flex items-center gap-2 hover:bg-white/20 transition-all text-sm"
                            >
                              <Plus className="w-3 h-3" />
                              Add
                            </button>
                          </div>

                          {/* Topics List */}
                          <div className="space-y-2">
                            {subject.topics.map((topic) => (
                              <motion.div
                                key={topic.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="flex items-center justify-between p-3 rounded-lg 
                                         bg-white/5 border border-white/10 group cursor-pointer hover:bg-white/10 transition-all"
                                onClick={() => router.push(`/homepage?topic=${encodeURIComponent(topic.name)}`)}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-2 h-2 rounded-full bg-white/40" />
                                  <span className="text-sm">{topic.name}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-xs text-white/40">
                                    {topic.dateAdded}
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteTopic(subject.id, topic.id);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 p-1 
                                             hover:bg-white/10 rounded transition-all"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
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
            <div className="text-center py-12 text-white/30">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No subjects added yet</p>
              <p className="text-sm mt-1">Start by adding your first subject above</p>
            </div>
          )}
        </motion.div>
      </main>

      {/* footer actions (only during onboarding) */}
      {isOnboarding && (
        <div className="fixed bottom-0 left-0 right-0 bg-black/90 border-t border-white/10 p-4">
          <div className="max-w-4xl mx-auto flex items-center justify-end gap-3">
            <button
              onClick={handleSkipToHomepage}
              disabled={saving}
              className="px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />
                  Skipping...
                </>
              ) : (
                "Skip to homepage"
              )}
              <ArrowRight className="ml-2 h-4 w-4" />
            </button>
            <button
              onClick={saveAndCompleteOnboarding}
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-white text-black hover:bg-white/90 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save plan and continue"
              )}
            </button>
          </div>
        </div>
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