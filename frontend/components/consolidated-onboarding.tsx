"use client";

import { ErrorBoundary } from 'react-error-boundary';

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, 
  BookOpen, 
  Brain, 
  Check, 
  CheckCircle, 
  ArrowLeft, 
  ArrowRight, 
  Plus, 
  Trash2, 
  Loader2,
  Clock,
  BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useEnhancedAuth } from "@/hooks/useEnhancedAuth";

// Types
interface ChildProfile {
  id: string;
  nickname: string;
  age: number | "";
  grade: string;
}

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

interface QuizAnswer {
  questionId: string;
  selectedOptionId: string;
  timeTaken: number;
}

interface OnboardingState {
  currentStep: number;
  userProfile: {
    children: ChildProfile[];
  };
  studyPlan: {
    subjects: Subject[];
  };
  quiz: {
    answers: Record<string, QuizAnswer>;
    currentQuestionIndex: number;
    completed: boolean;
  };
  timing: {
    startTime: number;
    stepTimes: Record<number, number>;
    lastInteractionTime: number;
  };
  ui: {
    isLoading: boolean;
    error: string | null;
  };
}

// Sample quiz questions for demonstration
const SAMPLE_QUESTIONS = [
  {
    id: "1",
    question: "How do you prefer to learn new concepts?",
    options: [
      { id: "a", text: "Through visual diagrams and charts" },
      { id: "b", text: "By listening to explanations" },
      { id: "c", text: "By doing hands-on activities" },
      { id: "d", text: "By reading and taking notes" }
    ],
    type: "learning-style"
  },
  {
    id: "2",
    question: "When solving math problems, what approach works best for you?",
    options: [
      { id: "a", text: "Drawing pictures or diagrams" },
      { id: "b", text: "Talking through the steps out loud" },
      { id: "c", text: "Using physical objects or manipulatives" },
      { id: "d", text: "Writing down each step systematically" }
    ],
    type: "problem-solving"
  }
];

const TOTAL_STEPS = 5;
const STEP_TITLES = [
  "Welcome",
  "Child Profiles",
  "Study Plan",
  "Learning Assessment",
  "Complete Setup"
];

// Time estimates for each step (in seconds)
const STEP_TIME_ESTIMATES = [30, 180, 300, 480, 30];

// Error fallback component
function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/5 border border-white/10 rounded-lg p-6 text-center">
        <div className="mx-auto w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
          <X className="w-6 h-6 text-red-500" />
        </div>
        <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
        <p className="text-white/70 mb-4">{error.message}</p>
        <Button 
          onClick={resetErrorBoundary}
          className="bg-blue-500 hover:bg-blue-600"
        >
          Try again
        </Button>
      </div>
    </div>
  );
}

export default function ConsolidatedOnboarding() {
  // Ensure responsive design and accessibility
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: authLoading, completeOnboarding } = useEnhancedAuth();
  
  // Initialize state
  const [state, setState] = useState<OnboardingState>(() => {
    // Load from localStorage if available
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('lana_consolidated_onboarding');
        if (saved) {
          const parsed = JSON.parse(saved);
          // Validate the parsed data structure
          if (parsed && typeof parsed === 'object') {
            return {
              ...parsed,
              timing: {
                ...parsed.timing,
                lastInteractionTime: Date.now()
              }
            };
          }
        }
      } catch (e) {
        console.warn('Failed to parse saved onboarding state:', e);
        // Clear corrupted data
        try {
          localStorage.removeItem('lana_consolidated_onboarding');
        } catch (removeError) {
          console.warn('Failed to remove corrupted onboarding state:', removeError);
        }
      }
    }
    
    // Default initial state
    return {
      currentStep: 1,
      userProfile: {
        children: [{ id: Date.now().toString(), nickname: "", age: "", grade: "" }]
      },
      studyPlan: {
        subjects: []
      },
      quiz: {
        answers: {},
        currentQuestionIndex: 0,
        completed: false
      },
      timing: {
        startTime: Date.now(),
        stepTimes: {},
        lastInteractionTime: Date.now()
      },
      ui: {
        isLoading: false,
        error: null
      }
    };
  });
  
  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('lana_consolidated_onboarding', JSON.stringify(state));
      } catch (error) {
        console.warn('Failed to save onboarding state to localStorage:', error);
        // Optionally show a warning to the user
        // toast({
        //   title: 'Warning',
        //   description: 'Failed to save your progress. Your data may be lost if you refresh the page.',
        //   variant: "destructive"
        // });
      }
    }
  }, [state]);
  
  // Update last interaction time periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setState(prev => ({
        ...prev,
        timing: {
          ...prev.timing,
          lastInteractionTime: Date.now()
        }
      }));
    }, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  // Track interactions within steps for more accurate time estimates
  const trackInteraction = useCallback(() => {
    setState(prev => ({
      ...prev,
      timing: {
        ...prev.timing,
        lastInteractionTime: Date.now()
      }
    }));
  }, []);
  
  // Calculate progress percentage
  const progressPercentage = Math.round((state.currentStep / TOTAL_STEPS) * 100);
  
  // Calculate time estimate
  const getTimeEstimate = useCallback(() => {
    const timeSpent = Date.now() - state.timing.startTime;
    const completedStepsTime = Object.values(state.timing.stepTimes).reduce((sum, time) => sum + time, 0);
    
    // If we have data for previous steps, use that to adjust estimates
    if (state.currentStep > 1 && completedStepsTime > 0) {
      const avgTimePerCompletedStep = completedStepsTime / (state.currentStep - 1);
      const remainingSteps = TOTAL_STEPS - state.currentStep;
      
      // Adjust future estimates based on user's actual pace
      const timePerRemainingStep = STEP_TIME_ESTIMATES.slice(state.currentStep - 1)
        .reduce((sum, time) => sum + time, 0) / (TOTAL_STEPS - state.currentStep + 1);
      
      const adjustedTimePerStep = Math.max(timePerRemainingStep, avgTimePerCompletedStep);
      const remainingTime = remainingSteps * adjustedTimePerStep;
      
      return Math.max(1, Math.round(remainingTime / 60)); // Convert to minutes, minimum 1 minute
    }
    
    // Use default estimates
    const remainingTime = STEP_TIME_ESTIMATES.slice(state.currentStep - 1)
      .reduce((sum, time) => sum + time, 0);
    
    return Math.max(1, Math.round(remainingTime / 60)); // Convert to minutes, minimum 1 minute
  }, [state.currentStep, state.timing]);
  
  // Get time estimate for current step
  const getCurrentStepTimeEstimate = useCallback(() => {
    const stepIndex = state.currentStep - 1;
    if (stepIndex >= 0 && stepIndex < STEP_TIME_ESTIMATES.length) {
      return Math.max(1, Math.round(STEP_TIME_ESTIMATES[stepIndex] / 60)); // Convert to minutes
    }
    return 1; // Default to 1 minute
  }, [state.currentStep]);
  
  // Get completed time
  const getCompletedTime = useCallback(() => {
    const completedStepsTime = Object.values(state.timing.stepTimes).reduce((sum, time) => sum + time, 0);
    return Math.max(1, Math.round(completedStepsTime / 60)); // Convert to minutes
  }, [state.timing]);
  
  // Navigation functions
  const goToStep = useCallback((step: number) => {
    // Record time spent on current step
    const timeSpent = Date.now() - state.timing.lastInteractionTime;
    setState(prev => ({
      ...prev,
      currentStep: step,
      timing: {
        ...prev.timing,
        stepTimes: {
          ...prev.timing.stepTimes,
          [prev.currentStep]: (prev.timing.stepTimes[prev.currentStep] || 0) + timeSpent
        },
        lastInteractionTime: Date.now()
      }
    }));
  }, [state.timing]);
  
  const nextStep = useCallback(() => {
    if (state.currentStep < TOTAL_STEPS) {
      goToStep(state.currentStep + 1);
    }
  }, [state.currentStep, goToStep]);
  
  const prevStep = useCallback(() => {
    if (state.currentStep > 1) {
      goToStep(state.currentStep - 1);
    }
  }, [state.currentStep, goToStep]);
  
  // Validate current step before proceeding
  const validateCurrentStep = useCallback(() => {
    // For step 2 (Child Profiles), ensure at least one child with valid data
    if (state.currentStep === 2) {
      const hasValidChild = state.userProfile.children.some(child => 
        child.nickname.trim() !== "" && 
        child.age !== "" && 
        child.grade !== ""
      );
      
      if (!hasValidChild) {
        toast({
          title: "Validation Error",
          description: "Please add at least one child with complete information.",
          variant: "destructive",
        });
        return false;
      }
    }
    
    // For step 3 (Study Plan), ensure at least one subject
    if (state.currentStep === 3) {
      if (state.studyPlan.subjects.length === 0) {
        toast({
          title: "Validation Error",
          description: "Please add at least one subject to your study plan.",
          variant: "destructive",
        });
        return false;
      }
    }
    
    return true;
  }, [state, toast]);
  
  // Enhanced navigation with validation
  const handleNextStep = useCallback(() => {
    if (validateCurrentStep() && state.currentStep < TOTAL_STEPS) {
      nextStep();
    }
  }, [validateCurrentStep, state.currentStep, nextStep]);
  
  // Child profile handlers
  const addChild = useCallback(() => {
    setState(prev => ({
      ...prev,
      userProfile: {
        ...prev.userProfile,
        children: [
          ...prev.userProfile.children,
          { id: Date.now().toString(), nickname: "", age: "", grade: "" }
        ]
      }
    }));
  }, []);
  
  // Validate child profile
  const validateChild = useCallback((child: ChildProfile) => {
    const errors: { nickname?: string; age?: string; grade?: string } = {};
    
    if (!child.nickname.trim()) {
      errors.nickname = "Nickname is required";
    } else if (child.nickname.trim().length < 2) {
      errors.nickname = "Nickname must be at least 2 characters";
    }
    
    if (child.age === "") {
      errors.age = "Age is required";
    } else if (typeof child.age === "number" && (child.age < 6 || child.age > 18)) {
      errors.age = "Age must be between 6 and 18";
    }
    
    if (!child.grade) {
      errors.grade = "Grade is required";
    }
    
    return errors;
  }, []);
  
  const removeChild = useCallback((index: number) => {
    if (state.userProfile.children.length <= 1) {
      toast({
        title: "Cannot remove",
        description: "You must have at least one child.",
        variant: "destructive",
      });
      return;
    }
    
    setState(prev => ({
      ...prev,
      userProfile: {
        ...prev.userProfile,
        children: prev.userProfile.children.filter((_, i) => i !== index)
      }
    }));
  }, [toast]);
  
  const updateChild = useCallback((index: number, field: keyof ChildProfile, value: any) => {
    setState(prev => {
      const updatedChildren = [...prev.userProfile.children];
      updatedChildren[index] = { ...updatedChildren[index], [field]: value };
      return {
        ...prev,
        userProfile: {
          ...prev.userProfile,
          children: updatedChildren
        }
      };
    });
  }, []);
  
  // Study plan handlers
  const addSubject = useCallback((name: string) => {
    if (!name.trim()) return;
    
    const newSubject: Subject = {
      id: Date.now().toString(),
      name: name.trim(),
      topics: [],
      dateAdded: new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      }),
      isExpanded: true
    };
    
    setState(prev => ({
      ...prev,
      studyPlan: {
        ...prev.studyPlan,
        subjects: [...prev.studyPlan.subjects, newSubject]
      }
    }));
  }, []);
  
  const removeSubject = useCallback((subjectId: string) => {
    setState(prev => ({
      ...prev,
      studyPlan: {
        ...prev.studyPlan,
        subjects: prev.studyPlan.subjects.filter(subject => subject.id !== subjectId)
      }
    }));
  }, []);
  
  const addTopic = useCallback((subjectId: string, topicName: string) => {
    if (!topicName.trim()) return;
    
    const newTopic: Topic = {
      id: Date.now().toString(),
      name: topicName.trim(),
      dateAdded: new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      })
    };
    
    setState(prev => ({
      ...prev,
      studyPlan: {
        ...prev.studyPlan,
        subjects: prev.studyPlan.subjects.map(subject => 
          subject.id === subjectId 
            ? { ...subject, topics: [...subject.topics, newTopic] }
            : subject
        )
      }
    }));
  }, []);
  
  const removeTopic = useCallback((subjectId: string, topicId: string) => {
    setState(prev => ({
      ...prev,
      studyPlan: {
        ...prev.studyPlan,
        subjects: prev.studyPlan.subjects.map(subject =>
          subject.id === subjectId
            ? { ...subject, topics: subject.topics.filter(topic => topic.id !== topicId) }
            : subject
        )
      }
    }));
  }, []);
  
  // Quiz handlers
  const answerQuestion = useCallback((questionId: string, optionId: string) => {
    const timeTaken = Date.now() - state.timing.lastInteractionTime;
    
    setState(prev => ({
      ...prev,
      quiz: {
        ...prev.quiz,
        answers: {
          ...prev.quiz.answers,
          [questionId]: {
            questionId,
            selectedOptionId: optionId,
            timeTaken
          }
        }
      },
      timing: {
        ...prev.timing,
        lastInteractionTime: Date.now()
      }
    }));
  }, [state.timing.lastInteractionTime]);
  
  const nextQuestion = useCallback(() => {
    setState(prev => ({
      ...prev,
      quiz: {
        ...prev.quiz,
        currentQuestionIndex: Math.min(
          prev.quiz.currentQuestionIndex + 1, 
          SAMPLE_QUESTIONS.length - 1
        )
      }
    }));
  }, []);
  
  const prevQuestion = useCallback(() => {
    setState(prev => ({
      ...prev,
      quiz: {
        ...prev.quiz,
        currentQuestionIndex: Math.max(prev.quiz.currentQuestionIndex - 1, 0)
      }
    }));
  }, []);
  
  // Complete onboarding
  const completeOnboardingProcess = useCallback(async () => {
    setState(prev => ({ ...prev, ui: { ...prev.ui, isLoading: true } }));
    
    try {
      // Save study plan to localStorage
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('lana_study_plan', JSON.stringify(state.studyPlan));
        } catch (error) {
          console.warn('Failed to save study plan to localStorage:', error);
          toast({ 
            title: 'Warning', 
            description: 'Failed to save your study plan locally. It will be saved when you complete onboarding.',
            variant: "default"
          });
        }
      }
      
      // Complete onboarding in auth service
      const result = await completeOnboarding();
      
      if (result.success) {
        toast({ 
          title: 'Setup Complete!', 
          description: 'Your personalized learning environment is ready.' 
        });
        
        // Clear onboarding state
        if (typeof window !== 'undefined') {
          localStorage.removeItem('lana_consolidated_onboarding');
        }
        
        // Redirect to homepage
        router.push('/homepage');
      } else {
        throw new Error(result.error || 'Failed to complete onboarding');
      }
    } catch (error) {
      console.error('Onboarding completion error:', error);
      toast({ 
        title: 'Setup Error', 
        description: error instanceof Error ? error.message : 'Failed to complete setup. Please try again.',
        variant: "destructive"
      });
      setState(prev => ({ ...prev, ui: { ...prev.ui, isLoading: false, error: 'Failed to complete setup' } }));
    }
  }, [state.studyPlan, completeOnboarding, router, toast]);
  
  // Skip onboarding
  const skipOnboarding = useCallback(async () => {
    try {
      // Mark onboarding as skipped
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('onboardingSkipped', 'true');
        } catch (error) {
          console.warn('Failed to mark onboarding as skipped:', error);
        }
      }
      
      // Complete onboarding process anyway to avoid blocking access
      await completeOnboarding();
      
      toast({ 
        title: 'Setup Skipped', 
        description: 'You can complete your setup later in settings.' 
      });
      
      // Clear onboarding state
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('lana_consolidated_onboarding');
        } catch (error) {
          console.warn('Failed to clear onboarding state:', error);
        }
      }
      
      // Redirect to homepage
      router.push('/homepage');
    } catch (error) {
      console.error('Skip onboarding error:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to skip setup. Redirecting to homepage.',
        variant: "destructive"
      });
      router.push('/homepage');
    }
  }, [completeOnboarding, router, toast]);
  
  // Render step content based on current step
  const renderStepContent = () => {
    switch (state.currentStep) {
      case 1: // Welcome
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center space-y-6"
          >
            <div className="mx-auto w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <User className="w-12 h-12 text-white" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-bold">Welcome to Lana AI!</h2>
              <p className="text-white/70 max-w-md mx-auto">
                Let's set up your personalized learning experience. This will take just a few minutes.
              </p>
            </div>
            <div className="bg-white/5 rounded-lg p-4 max-w-md mx-auto">
              <h3 className="font-medium mb-2">What to expect:</h3>
              <ul className="text-sm text-white/70 space-y-1 text-left">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  Add your children's profiles
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  Create a study plan
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  Quick learning assessment
                </li>
              </ul>
            </div>
          </motion.div>
        );
        
      case 2: // Child Profiles
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="space-y-2 text-center">
              <h2 className="text-2xl font-bold">Tell us about your children</h2>
              <p className="text-white/70">
                This helps Lana explain concepts at the right level
              </p>
            </div>
            
            <div className="space-y-4">
              {state.userProfile.children.map((child, index) => {
                // Validate child to show errors
                const errors = validateChild(child);
                          
                return (
                  <div key={child.id} className="p-4 rounded-lg bg-white/5 border border-white/10 space-y-4">
                    {state.userProfile.children.length > 1 && (
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium">Child {index + 1}</h3>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeChild(index)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                              
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-white/70">Nickname</label>
                        <div className="relative">
                          <input
                            type="text"
                            id={`nickname-${index}`}
                            value={child.nickname}
                            onChange={(e) => {
                              updateChild(index, 'nickname', e.target.value);
                              trackInteraction();
                            }}
                            placeholder="Child's nickname"
                            className={`w-full px-4 py-2 bg-white/5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder:text-white/30 ${errors.nickname ? 'border-red-500' : 'border-white/10'}`}
                            aria-describedby={errors.nickname ? `nickname-error-${index}` : undefined}
                            aria-invalid={!!errors.nickname}
                          />
                          {errors.nickname && (
                            <p id={`nickname-error-${index}`} className="text-red-400 text-xs" role="alert">
                              {errors.nickname}
                            </p>
                          )}
                          <User className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
                        </div>
                        )}
                      </div>
                                
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-white/70">Age</label>
                        <div className="relative">
                          <input
                            type="number"
                            id={`age-${index}`}
                            min="6"
                            max="18"
                            value={child.age}
                            onChange={(e) => {
                              updateChild(index, 'age', e.target.value === "" ? "" : Number(e.target.value));
                              trackInteraction();
                            }}
                            placeholder="Age"
                            className={`w-full px-4 py-2 bg-white/5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder:text-white/30 ${errors.age ? 'border-red-500' : 'border-white/10'}`}
                            aria-describedby={errors.age ? `age-error-${index}` : undefined}
                            aria-invalid={!!errors.age}
                          />
                        </div>
                        {errors.age && (
                          <p id={`age-error-${index}`} className="text-red-400 text-xs" role="alert">
                            {errors.age}
                          </p>
                        )}
                      </div>
                                
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-white/70">Grade</label>
                        <select
                          id={`grade-${index}`}
                          value={child.grade}
                          onChange={(e) => {
                            updateChild(index, 'grade', e.target.value);
                            trackInteraction();
                          }}
                          className={`w-full px-4 py-2 bg-white/5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white ${errors.grade ? 'border-red-500' : 'border-white/10'}`}
                          aria-describedby={errors.grade ? `grade-error-${index}` : undefined}
                          aria-invalid={!!errors.grade}
                        >
                          <option value="" disabled>Select grade</option>
                          <option value="6">Grade 6</option>
                          <option value="7">Grade 7</option>
                          <option value="8">Grade 8</option>
                          <option value="9">Grade 9</option>
                          <option value="10">Grade 10</option>
                          <option value="11">Grade 11</option>
                          <option value="12">Grade 12</option>
                          <option value="college">College</option>
                        </select>
                        {errors.grade && (
                          <p id={`grade-error-${index}`} className="text-red-400 text-xs" role="alert">
                            {errors.grade}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <Button
              type="button"
              onClick={addChild}
              variant="outline"
              className="w-full border-white/20 text-white hover:bg-white/10"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Another Child
            </Button>
          </motion.div>
        );
        
      case 3: // Study Plan
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="space-y-2 text-center">
              <h2 className="text-2xl font-bold">Create Your Study Plan</h2>
              <p className="text-white/70">
                Organize subjects and topics for the term
              </p>
            </div>
            
            <div className="space-y-4">
              {state.studyPlan.subjects.map((subject) => (
                <div key={subject.id} className="border border-white/10 rounded-lg overflow-hidden">
                  <div className="p-4 bg-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <BookOpen className="w-5 h-5 text-white/60" />
                      <div>
                        <h3 className="font-semibold">{subject.name}</h3>
                        <p className="text-sm text-white/50">
                          {subject.topics.length} topics
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSubject(subject.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="p-4 space-y-3 bg-black/20">
                    {subject.topics.map((topic) => (
                      <div key={topic.id} className="flex items-center justify-between p-2 rounded bg-white/5">
                        <span className="text-sm">{topic.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTopic(subject.id, topic.id)}
                          className="text-white/50 hover:text-white/80"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add a topic"
                        className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder:text-white/30 text-sm"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            const target = e.target as HTMLInputElement;
                            addTopic(subject.id, target.value);
                            target.value = "";
                            trackInteraction();
                          }
                        }}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-white/20 text-white hover:bg-white/10"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add a subject"
                className="flex-1 px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder:text-white/30"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const target = e.target as HTMLInputElement;
                    addSubject(target.value);
                    target.value = "";
                    trackInteraction();
                  }
                }}
              />
              <Button
                onClick={(e) => {
                  const input = (e.target as HTMLElement).previousElementSibling as HTMLInputElement;
                  if (input && input.value.trim()) {
                    addSubject(input.value.trim());
                    input.value = "";
                    trackInteraction();
                  }
                }}
                className="bg-blue-500 hover:bg-blue-600"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        );
        
      case 4: // Learning Assessment
        const currentQuestion = SAMPLE_QUESTIONS[state.quiz.currentQuestionIndex];
        const selectedAnswer = state.quiz.answers[currentQuestion.id]?.selectedOptionId;
        
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="space-y-2 text-center">
              <h2 className="text-2xl font-bold">Learning Assessment</h2>
              <p className="text-white/70">
                Help us understand how your children learn best
              </p>
            </div>
            
            <div className="bg-white/5 rounded-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <span className="text-sm text-white/50">
                  Question {state.quiz.currentQuestionIndex + 1} of {SAMPLE_QUESTIONS.length}
                </span>
                <span className="text-sm text-white/50">
                  {Math.round(((state.quiz.currentQuestionIndex + 1) / SAMPLE_QUESTIONS.length) * 100)}% complete
                </span>
              </div>
              
              <h3 className="text-lg font-medium mb-6">{currentQuestion.question}</h3>
              
              <div className="space-y-3">
                {currentQuestion.options.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => {
                      answerQuestion(currentQuestion.id, option.id);
                      trackInteraction();
                    }}
                    className={`w-full text-left p-4 rounded-lg border transition-all ${
                      selectedAnswer === option.id
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-white/10 hover:border-white/30 hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center">
                      <div className={`w-5 h-5 rounded-full border mr-3 flex items-center justify-center ${
                        selectedAnswer === option.id
                          ? "border-blue-500 bg-blue-500"
                          : "border-white/30"
                      }`}>
                        {selectedAnswer === option.id && (
                          <div className="w-2 h-2 rounded-full bg-white"></div>
                        )}
                      </div>
                      <span>{option.text}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        );
        
      case 5: // Complete Setup
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center space-y-6"
          >
            <div className="mx-auto w-24 h-24 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-bold">You're All Set!</h2>
              <p className="text-white/70 max-w-md mx-auto">
                Your personalized learning environment is ready to go.
              </p>
            </div>
            <div className="bg-white/5 rounded-lg p-4 max-w-md mx-auto">
              <h3 className="font-medium mb-3">What's next:</h3>
              <ul className="text-sm text-white/70 space-y-2 text-left">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Start exploring personalized lessons</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Track progress through your dashboard</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Adjust settings anytime in your profile</span>
                </li>
              </ul>
            </div>
          </motion.div>
        );
        
      default:
        return null;
    }
  };
  
  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }
  
  // Redirect if not authenticated
  if (!isAuthenticated) {
    router.push("/login");
    return null;
  }
  
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => {
        // Reset the state of your app so the user can try again
        setState(prev => ({
          ...prev,
          ui: {
            ...prev.ui,
            error: null
          }
        }));
      }}
    >
      <div className="min-h-screen bg-black text-white flex flex-col">
        {/* Header */}
        <header className="border-b border-white/10 px-4 sm:px-6 py-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <h1 className="text-lg sm:text-xl font-semibold">Setup Your Account</h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={skipOnboarding}
              className="text-white/50 hover:text-white text-sm"
            >
              Skip for now
            </Button>
          </div>
        </header>
      
      {/* Progress Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 flex-1">
        <div className="mb-6 sm:mb-8">
          {/* Progress bar with step indicators */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row justify-between text-sm text-white/50 mb-2 gap-1">
              <span>Step {state.currentStep} of {TOTAL_STEPS}</span>
              <span>{progressPercentage}% complete</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2 mb-6">
              <motion.div 
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            
            {/* Step indicators */}
            <div className="flex justify-between relative px-2 sm:px-4 mb-6">
              {STEP_TITLES.map((title, index) => {
                const stepNumber = index + 1;
                const isCompleted = stepNumber < state.currentStep;
                const isCurrent = stepNumber === state.currentStep;
                
                return (
                  <div key={stepNumber} className="flex flex-col items-center relative z-10 flex-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium mb-1 
                      ${isCompleted ? 'bg-green-500 text-white' : 
                        isCurrent ? 'bg-blue-500 text-white ring-4 ring-blue-500/30' : 
                        'bg-white/10 text-white/50'}`}>
                      {isCompleted ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        stepNumber
                      )}
                    </div>
                    <span className={`text-[0.6rem] sm:text-xs text-center max-w-[80px] truncate 
                      ${isCurrent ? 'text-white font-medium' : 'text-white/50'}`} 
                      title={title}>
                      {title}
                    </span>
                  </div>
                );
              })}
              
              {/* Connecting line */}
              <div className="absolute top-4 left-0 right-0 h-0.5 bg-white/10 -z-10"></div>
            </div>
          </div>
          
          {/* Time estimate */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 text-xs sm:text-sm bg-white/5 py-2 sm:py-3 px-3 sm:px-4 rounded-lg">
            <div className="flex items-center gap-1 sm:gap-2">
              <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-white/70" />
              <span className="text-white/70">Total:</span>
              <span className="font-medium">{getTimeEstimate() + getCompletedTime()} min</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-white/20"></div>
            <div className="flex items-center gap-1 sm:gap-2">
              <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 text-white/70" />
              <span className="text-white/70">Remaining:</span>
              <span className="font-medium">{getTimeEstimate()} min</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-white/20"></div>
            <div className="flex items-center gap-1 sm:gap-2">
              <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-white/70" />
              <span className="text-white/70">Current:</span>
              <span className="font-medium">{getCurrentStepTimeEstimate()} min</span>
            </div>
          </div>
        </div>
        
        {/* Step title */}
        <div className="mb-6 sm:mb-8 text-center">
          <h2 className="text-xl sm:text-2xl font-bold">{STEP_TITLES[state.currentStep - 1]}</h2>
        </div>
        
        {/* Step content */}
        <div className="mb-8 sm:mb-12">
          <AnimatePresence mode="wait">
            {renderStepContent()}
          </AnimatePresence>
        </div>
        
        {/* Navigation */}
        <div className="flex justify-between gap-2 sm:gap-0">
          <Button
            onClick={prevStep}
            disabled={state.currentStep === 1}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10 text-sm sm:text-base px-3 py-2 h-9 sm:h-10"
          >
            <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden xs:inline">Back</span>
          </Button>
          
          {state.currentStep < TOTAL_STEPS ? (
            <Button
              onClick={handleNextStep}
              disabled={state.ui.isLoading}
              className="bg-blue-500 hover:bg-blue-600 text-sm sm:text-base px-3 py-2 h-9 sm:h-10"
            >
              <span className="hidden xs:inline">Continue</span>
              <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
            </Button>
          ) : (
            <Button
              onClick={completeOnboardingProcess}
              disabled={state.ui.isLoading}
              className="bg-green-500 hover:bg-green-600 text-sm sm:text-base px-3 py-2 h-9 sm:h-10"
            >
              {state.ui.isLoading ? (
                <>
                  <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 animate-spin" />
                  <span className="hidden xs:inline">Completing...</span>
                </>
              ) : (
                <>
                  <span className="hidden xs:inline">Get Started</span>
                  <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
    </ErrorBoundary>
  );
}