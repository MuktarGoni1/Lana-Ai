"use client";

import React from "react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";
import { Plus, X, BookOpen, ChevronDown, ChevronUp, Trash2, Loader2, ArrowRight, MessageSquare, Video, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Logo from '@/components/logo';
import { supabase } from '@/lib/db';
import { useToast } from '@/hooks/use-toast';
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

interface ProfileRow {
  grade: string | null;
}

interface SearchRow {
  id: string;
  title: string;
  created_at: string | null;
}

/* ---------- main page ---------- */
import { Suspense } from "react";

function TermPlanPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useUnifiedAuth();
  const onboardingParam = searchParams.get("onboarding");
  const isOnboarding = onboardingParam === "1" || onboardingParam === "true";
  const returnTo = searchParams.get("returnTo");
  
  // Authentication state is now handled by useUnifiedAuth hook
  
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
  const [recentSearches, setRecentSearches] = useState<SearchRow[]>([]);
  const [recentSearchesError, setRecentSearchesError] = useState<string | null>(null);

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

  useEffect(() => {
    if (!isLoading && isAuthenticated && user?.id && typeof window !== "undefined") {
      const pending = localStorage.getItem("lana_onboarding_pending_sync");
      if (!pending) return;
      (async () => {
        try {
          const payload = JSON.parse(pending);
          const db = supabase as any;

          if (payload.childInfo) {
            const info = payload.childInfo;
            const ageValue = parseInt(info.age, 10);
            await db
              .from("profiles")
              .update({
                age: isNaN(ageValue) ? null : ageValue,
                grade: info.grade || null,
                full_name: info.nickname || null,
                role: info.role === "parent" ? "parent" : "child",
                diagnostic_completed: true,
              })
              .eq("id", user.id);

            await supabase.auth.updateUser({
              data: {
                child_info: {
                  nickname: info.nickname,
                  age: ageValue,
                  grade: info.grade,
                  interests: info.interests || "",
                },
                role: info.role === "parent" ? "parent" : "child",
                onboarding_step: 1,
              },
            });
          }

          if (payload.preference) {
            await supabase.auth.updateUser({
              data: {
                learning_preference: payload.preference.learning_preference,
                onboarding_step: 2,
              },
            });
          }

          if (payload.schedule) {
            await supabase.auth.updateUser({
              data: {
                revision_schedule: payload.schedule.revision_schedule || [],
                schedule_set: true,
                onboarding_step: 3,
              },
            });
          }

          localStorage.removeItem("lana_onboarding_pending_sync");
          localStorage.removeItem("lana_onboarding_child_info");
          localStorage.removeItem("lana_onboarding_preference");
          localStorage.removeItem("lana_onboarding_schedule");
        } catch (err) {
          console.error("[term-plan] onboarding sync failed:", err);
        }
      })();
    }
  }, [isAuthenticated, isLoading, user?.id]);

  const fetchRecentSearches = async () => {
    if (!user?.id) return;
    try {
      setRecentSearchesError(null);
      const db = supabase as any;
      const { data, error } = await db
        .from("searches")
        .select("id, title, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentSearches((data ?? []) as SearchRow[]);
    } catch (err: any) {
      console.error("[term-plan] failed to load recent searches:", err);
      setRecentSearchesError("Couldn't load recent topics.");
    }
  };

  useEffect(() => {
    if (!isLoading && isAuthenticated && user?.id) {
      fetchRecentSearches();
    }
  }, [isAuthenticated, isLoading, user?.id]);
  
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

  // No hard redirect; allow viewing/editing and prompt sign-in when saving
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      console.warn("[term-plan] unauthenticated; local-only mode");
    }
  }, [isAuthenticated, isLoading]);

  const persistStudyPlanToSupabase = async (userId: string) => {
    const db = supabase as any;

    // Load profile grade once and reuse for inserted plans.
    const { data: profileData, error: profileError } = await db
      .from('profiles')
      .select('grade')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) {
      throw profileError;
    }

    const profile = (profileData ?? { grade: null }) as ProfileRow;

    for (const subject of subjects) {
      const topicNames = subject.topics
        .map((topic) => topic.name.trim())
        .filter(Boolean);

      const rawSyllabus = topicNames.join('\n');

      const { data: plan, error: planError } = await db
        .from('term_plans')
        .insert({
          user_id: userId,
          subject: subject.name.trim(),
          grade: profile.grade,
          term: null,
          raw_syllabus: rawSyllabus,
        })
        .select('id')
        .single();

      if (planError || !plan) {
        throw planError ?? new Error('Failed to create term plan');
      }

      if (topicNames.length === 0) {
        continue;
      }

      const topicsToInsert = topicNames.map((title, index) => ({
        user_id: userId,
        term_plan_id: plan.id,
        subject_name: subject.name.trim(),
        title,
        week_number: index + 1,
        order_index: index,
        status: index === 0 ? 'available' : 'locked',
      }));

      const { error: topicError } = await db
        .from('topics')
        .insert(topicsToInsert);

      if (topicError) {
        throw topicError;
      }
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

      // Redirect to dashboard root after onboarding completion
      console.log('[term-plan] redirecting to dashboard after onboarding completion');
      router.push('/');
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

      const nonEmptySubjects = subjects.filter((subject) => subject.name.trim().length > 0);
      if (nonEmptySubjects.length === 0) {
        toast({
          title: 'Add at least one subject',
          description: 'Create one subject before saving your plan.',
          variant: 'destructive',
        });
        return;
      }

      if (!user?.id) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to save your study plan.",
          variant: "destructive",
        });
        router.push("/login");
        return;
      }

      await persistStudyPlanToSupabase(user.id);

      console.log('[term-plan] Successfully saved subjects/topics to Supabase');
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
          userId: user?.id
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
  
  // Skip to homepage functionality
  const handleSkipToHomepage = () => {
    try {
      // Redirect to dashboard when skipping
      console.log('[term-plan] skipping to dashboard');
      router.push('/');
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

  const createSubjectFromSearch = (title: string) => {
    const trimmed = title.trim();
    if (!trimmed) return;

    const newSubject: Subject = {
      id: Date.now().toString(),
      name: trimmed,
      topics: [],
      dateAdded: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
      isExpanded: true
    };

    setSubjects((prev) => [...prev, newSubject]);
  };

  const addTopicFromSearch = (title: string) => {
    const trimmed = title.trim();
    if (!trimmed) return;

    const topic: Topic = {
      id: Date.now().toString(),
      name: trimmed,
      dateAdded: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    };

    setSubjects((prev) => {
      if (prev.length === 0) {
        const newSubject: Subject = {
          id: Date.now().toString(),
          name: "General",
          topics: [topic],
          dateAdded: new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          }),
          isExpanded: true
        };
        return [newSubject];
      }

      const [first, ...rest] = prev;
      return [
        { ...first, topics: [...first.topics, topic], isExpanded: true },
        ...rest
      ];
    });
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
  if (!isAuthenticated && !isLoading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <header className="border-b border-white/10 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between sticky top-0 bg-black z-10">
          <div className="flex items-center gap-3">
            <Logo className="w-8 h-8 sm:w-10 sm:h-10" />
            <h1 className="text-lg sm:text-xl font-semibold">Term Planner</h1>
          </div>
          <button
            onClick={() => router.push("/")}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </header>
        <main className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
          <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-white/70">
            You can draft your plan here, but you’ll need to sign in to save it.
            <div className="mt-3">
              <button
                onClick={() => router.push("/login")}
                className="px-4 py-2 rounded-lg bg-white text-black text-sm font-medium"
              >
                Sign in to save
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* header with logo */}
      <header className="border-b border-white/10 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between sticky top-0 bg-black z-10">
        <div className="flex items-center gap-3">
          <Logo className="w-8 h-8 sm:w-10 sm:h-10" />
          <h1 className="text-lg sm:text-xl font-semibold">Term Planner</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/")}
            className="px-3 py-2 rounded-lg border border-white/10 text-xs text-white/70 hover:bg-white/10 transition-colors"
          >
            Back to dashboard
          </button>
          {isOnboarding && (
            <button
              onClick={handleSkipToHomepage}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors flex items-center justify-center"
              title="Skip for now"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      {/* body */}
      <main className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
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

          {/* Recent topics */}
          {recentSearchesError && (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/60">
              <span>{recentSearchesError}</span>
              <button
                onClick={fetchRecentSearches}
                className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-xs hover:bg-white/10"
              >
                <RefreshCw className="h-3 w-3" />
                Retry
              </button>
            </div>
          )}

          {recentSearches.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-widest text-white/40">
                Recent topics you've explored
              </p>
              <div className="space-y-2">
                {recentSearches.map((s) => (
                  <div
                    key={s.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-3"
                  >
                    <span className="text-sm text-white/80 truncate">{s.title}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => addTopicFromSearch(s.title)}
                        className="px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 text-xs"
                      >
                        Add as Topic
                      </button>
                      <button
                        onClick={() => createSubjectFromSearch(s.title)}
                        className="px-2.5 py-1 rounded-md border border-white/10 hover:bg-white/10 text-xs"
                      >
                        Create Subject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add Subject Input */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <input
              value={subjectInput}
              onChange={(e) => setSubjectInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addSubject()}
              placeholder="Enter subject name (e.g., Mathematics, Physics)"
              className="flex-1 px-4 py-3 rounded-lg bg-white/5 border border-white/10 
                       focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30
                       placeholder:text-white/40 transition-all text-sm sm:text-base min-h-[48px]"
            />
            <button
              onClick={addSubject}
              className="px-4 sm:px-6 py-3 bg-white text-black rounded-lg font-medium 
                       flex items-center justify-center gap-2 hover:bg-white/90 transition-all whitespace-nowrap shadow-sm hover:shadow-md active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Subject</span>
              <span className="sm:hidden">Add</span>
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
                        className="p-2 hover:bg-white/10 rounded-full transition-colors flex items-center justify-center active:scale-95"
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
                      className="p-2 hover:bg-white/10 rounded-full transition-colors flex items-center justify-center active:scale-95"
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
                          <div className="flex flex-col sm:flex-row gap-2">
                            <input
                              value={topicInputs[subject.id] || ""}
                              onChange={(e) => setTopicInputs({
                                ...topicInputs,
                                [subject.id]: e.target.value
                              })}
                              onKeyDown={(e) => e.key === "Enter" && addTopic(subject.id)}
                              placeholder="Add a topic (e.g., Limits & Continuity)"
                              className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 
                                       focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30
                                       placeholder:text-white/40 text-sm transition-all min-h-[44px]"
                            />
                            <button
                              onClick={() => addTopic(subject.id)}
                              className="px-3 py-2 bg-white/10 text-white rounded-lg 
                                       flex items-center justify-center gap-2 hover:bg-white/20 transition-all text-sm whitespace-nowrap shadow-sm hover:shadow-md active:scale-95"
                            >
                              <Plus className="w-3 h-3" />
                              <span className="hidden sm:inline">Add</span>
                              <span className="sm:hidden">+</span>
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
                                         bg-white/5 border border-white/10 group hover:bg-white/10 transition-all"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-2 h-2 rounded-full bg-white/40" />
                                  <span className="text-sm">{topic.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-white/40 hidden sm:inline">
                                    {topic.dateAdded}
                                  </span>
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      onClick={() => router.push(`/?q=${encodeURIComponent(topic.name)}`)}
                                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                      title="Chat about this topic"
                                    >
                                      <MessageSquare className="w-4 h-4 text-white/60 hover:text-white" />
                                    </button>
                                    <button
                                      onClick={() => router.push(`/video-explainer?topic=${encodeURIComponent(topic.name)}`)}
                                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                      title="Create video for this topic"
                                    >
                                      <Video className="w-4 h-4 text-white/60 hover:text-white" />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        deleteTopic(subject.id, topic.id);
                                      }}
                                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                    >
                                      <X className="w-3 h-3 text-white/50 hover:text-white" />
                                    </button>
                                  </div>
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
        <div className="fixed bottom-0 left-0 right-0 bg-black/90 border-t border-white/10 p-3 sm:p-4">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center gap-3 w-full">
            <button
              onClick={handleSkipToHomepage}
              disabled={saving}
              className="px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center w-full sm:w-auto justify-center shadow-sm hover:shadow-md active:scale-95"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />
                  Skipping...
                </>
              ) : (
                "Skip for now"
              )}
              <ArrowRight className="ml-2 h-4 w-4" />
            </button>
            <button
              onClick={saveAndCompleteOnboarding}
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-white text-black hover:bg-white/90 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center w-full sm:w-auto justify-center shadow-sm hover:shadow-md active:scale-95"
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
