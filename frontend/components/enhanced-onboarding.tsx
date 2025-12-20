"use client";

import React from "react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEnhancedAuth } from "@/hooks/useEnhancedAuth";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, ChevronDown, ChevronUp, Plus, Trash2, Loader2, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Logo from '@/components/logo';

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

export default function EnhancedOnboarding() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading, completeOnboarding } = useEnhancedAuth();
  const returnTo = searchParams.get("returnTo");
  
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
  const [isSaving, setIsSaving] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  // Save subjects to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('lana_study_plan', JSON.stringify(subjects));
    }
  }, [subjects]);

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
    
    setSubjects([...subjects, newSubject]);
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

    setSubjects(subjects.map(subject => 
      subject.id === subjectId 
        ? { ...subject, topics: [...subject.topics, newTopic] }
        : subject
    ));
    
    setTopicInputs({ ...topicInputs, [subjectId]: "" });
  };

  const toggleSubject = (subjectId: string) => {
    setSubjects(subjects.map(subject =>
      subject.id === subjectId
        ? { ...subject, isExpanded: !subject.isExpanded }
        : subject
    ));
  };

  const deleteSubject = (subjectId: string) => {
    setSubjects(subjects.filter(subject => subject.id !== subjectId));
  };

  const deleteTopic = (subjectId: string, topicId: string) => {
    setSubjects(subjects.map(subject =>
      subject.id === subjectId
        ? { ...subject, topics: subject.topics.filter(topic => topic.id !== topicId) }
        : subject
    ));
  };

  const saveStudyPlan = async () => {
    setIsSaving(true);
    try {
      // Try to save to backend first
      try {
        if (!user?.email) {
          throw new Error('No authenticated user found');
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
        
        console.log('[EnhancedOnboarding] Successfully saved subjects and topics to backend');
        toast({ 
          title: 'Plan Saved', 
          description: 'Your study plan has been saved successfully.' 
        });
      } catch (err: any) {
        // If backend save fails, save locally
        console.error('[EnhancedOnboarding] Backend save failed, saving locally:', err.message);
        localStorage.setItem('lana_study_plan', JSON.stringify(subjects));
        toast({ 
          title: 'Plan Saved Locally', 
          description: 'Your study plan has been saved locally and will be synced when connection is restored.' 
        });
      }
      
    } catch (err: any) {
      console.error('[EnhancedOnboarding] Error saving plan:', err.message);
      toast({ 
        title: 'Save Error', 
        description: 'Failed to save your study plan.',
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const completeOnboardingFlow = async () => {
    setIsSaving(true);
    try {
      // Save study plan first
      await saveStudyPlan();
      
      // Complete onboarding
      const result = await completeOnboarding();
      
      if (result.success) {
        toast({ 
          title: 'Onboarding Complete', 
          description: 'Your plan has been saved. Redirecting to dashboard...' 
        });
        
        // Redirect to homepage with onboarding completion flag
        router.replace('/homepage?onboardingComplete=1');
      } else {
        toast({ 
          title: 'Onboarding Error', 
          description: result.error || 'Failed to complete onboarding.',
          variant: "destructive"
        });
      }
    } catch (err: any) {
      console.error('[EnhancedOnboarding] Error completing onboarding:', err.message);
      toast({ 
        title: 'Onboarding Error', 
        description: 'Failed to complete onboarding.',
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
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

  // Show error if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md p-6">
          <div className="w-12 h-12 mx-auto text-red-500">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold">Access Denied</h2>
          <p className="text-white/70">
            You must be authenticated to access this page.
          </p>
          <button
            onClick={() => router.push("/login")}
            className="px-4 py-2 bg-white text-black rounded-lg font-medium hover:bg-white/90 transition-all"
          >
            Go to Login
          </button>
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
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
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
              Welcome! Let's set up your learning plan
            </h2>
            <p className="text-white/70">
              Create your personalized study plan to get started with your learning journey
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
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
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

      {/* footer actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/90 border-t border-white/10 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-end gap-3">
          <button
            onClick={completeOnboardingFlow}
            disabled={isSaving}
            className="px-4 py-2 rounded-lg bg-white text-black hover:bg-white/90 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save plan and continue"
            )}
            <ArrowRight className="ml-2 h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}