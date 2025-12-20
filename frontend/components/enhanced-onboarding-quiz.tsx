"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { 
  Loader2, 
  Brain, 
  BookOpen, 
  Trophy, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  BarChart3,
  Target,
  Zap
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DIAGNOSTIC_QUESTIONS, QuizQuestion, LearningProfile, generateLearningProfile } from "@/lib/quiz/diagnostic-quiz";
import { useRouter } from "next/navigation";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";

interface QuizResponse {
  questionId: string;
  selectedOptionId: string;
  value: any;
  timeTaken: number; // Time taken to answer in seconds
}

interface QuizAnalytics {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeTaken: number;
  categoryScores: {
    logical: number;
    math: number;
    verbal: number;
    spatial: number;
  };
  strengths: string[];
  weaknesses: string[];
  percentileRanking: number;
}

export default function EnhancedOnboardingQuiz() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useUnifiedAuth();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<QuizResponse[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [learningProfile, setLearningProfile] = useState<LearningProfile | null>(null);
  const [quizAnalytics, setQuizAnalytics] = useState<QuizAnalytics | null>(null);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  
  const currentQuestion = DIAGNOSTIC_QUESTIONS[currentQuestionIndex];
  const progress = ((currentQuestionIndex) / DIAGNOSTIC_QUESTIONS.length) * 100;
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);
  
  // Reset question start time when question changes
  useEffect(() => {
    setQuestionStartTime(Date.now());
  }, [currentQuestionIndex]);

  const handleSelectOption = (optionId: string) => {
    const option = currentQuestion.options.find(opt => opt.id === optionId);
    if (!option) return;
    
    const timeTaken = Math.floor((Date.now() - questionStartTime) / 1000);
    
    const newResponse: QuizResponse = {
      questionId: currentQuestion.id,
      selectedOptionId: optionId,
      value: option.value,
      timeTaken
    };
    
    // Update or add response
    setResponses(prev => {
      const existingIndex = prev.findIndex(r => r.questionId === currentQuestion.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = newResponse;
        return updated;
      }
      return [...prev, newResponse];
    });
  };
  
  const goToNextQuestion = () => {
    if (currentQuestionIndex < DIAGNOSTIC_QUESTIONS.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };
  
  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };
  
  const getCurrentSelectedOption = () => {
    const response = responses.find(r => r.questionId === currentQuestion.id);
    return response?.selectedOptionId || "";
  };
  
  const isCurrentQuestionAnswered = () => {
    return responses.some(r => r.questionId === currentQuestion.id);
  };
  
  const calculateQuizAnalytics = (): QuizAnalytics => {
    let correctAnswers = 0;
    let totalTime = 0;
    const categoryScores = {
      logical: 0,
      math: 0,
      verbal: 0,
      spatial: 0
    };
    const categoryCounts = {
      logical: 0,
      math: 0,
      verbal: 0,
      spatial: 0
    };
    
    // Map question IDs to categories for cognitive questions
    const questionCategories: Record<string, keyof typeof categoryScores> = {
      'cog1': 'logical',
      'cog2': 'math',
      'cog3': 'verbal',
      'cog4': 'logical',
      'cog5': 'spatial'
    };
    
    // Calculate scores
    responses.forEach(response => {
      const question = DIAGNOSTIC_QUESTIONS.find(q => q.id === response.questionId);
      if (question && question.type === 'competency') {
        const category = questionCategories[question.id] || 'logical';
        categoryCounts[category]++;
        totalTime += response.timeTaken;
        
        if (response.value === 1) { // Correct answer
          correctAnswers++;
          categoryScores[category]++;
        }
      }
    });
    
    // Calculate percentages for each category
    const categoryPercentages = {
      logical: categoryCounts.logical > 0 ? Math.round((categoryScores.logical / categoryCounts.logical) * 100) : 0,
      math: categoryCounts.math > 0 ? Math.round((categoryScores.math / categoryCounts.math) * 100) : 0,
      verbal: categoryCounts.verbal > 0 ? Math.round((categoryScores.verbal / categoryCounts.verbal) * 100) : 0,
      spatial: categoryCounts.spatial > 0 ? Math.round((categoryScores.spatial / categoryCounts.spatial) * 100) : 0
    };
    
    // Identify strengths and weaknesses
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    
    Object.entries(categoryPercentages).forEach(([category, percentage]) => {
      if (percentage >= 70) {
        strengths.push(category.charAt(0).toUpperCase() + category.slice(1));
      } else if (percentage <= 40) {
        weaknesses.push(category.charAt(0).toUpperCase() + category.slice(1));
      }
    });
    
    // Calculate overall score and percentile ranking
    const totalQuestions = Object.values(categoryCounts).reduce((sum, count) => sum + count, 0);
    const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
    
    // Simple percentile calculation (in a real app, this would be based on a larger dataset)
    let percentileRanking = 50;
    if (score >= 90) percentileRanking = 95;
    else if (score >= 80) percentileRanking = 85;
    else if (score >= 70) percentileRanking = 70;
    else if (score >= 60) percentileRanking = 50;
    else if (score >= 50) percentileRanking = 30;
    else percentileRanking = 15;
    
    return {
      score,
      totalQuestions,
      correctAnswers,
      timeTaken: totalTime,
      categoryScores: categoryPercentages,
      strengths: strengths.length > 0 ? strengths : ["Balanced skills"],
      weaknesses: weaknesses.length > 0 ? weaknesses : ["None identified"],
      percentileRanking
    };
  };
  
  const submitQuiz = async () => {
    setIsSubmitting(true);
    try {
      // Separate competency and learning style responses
      const competencyScores: number[] = [];
      const learningStyleResponses: string[] = [];
      
      responses.forEach(response => {
        const question = DIAGNOSTIC_QUESTIONS.find(q => q.id === response.questionId);
        if (question) {
          if (question.type === 'competency') {
            competencyScores.push(response.value);
          } else if (question.type === 'learning-style') {
            learningStyleResponses.push(response.value);
          }
        }
      });
      
      // Generate learning profile
      const profile = generateLearningProfile(competencyScores, learningStyleResponses);
      setLearningProfile(profile);
      
      // Calculate detailed analytics
      const analytics = calculateQuizAnalytics();
      setQuizAnalytics(analytics);
      
      // Save to localStorage for now (will be saved to backend later)
      localStorage.setItem('lana_learning_profile', JSON.stringify(profile));
      localStorage.setItem('lana_quiz_analytics', JSON.stringify(analytics));
      
      // Save to backend
      try {
        const response = await fetch('/api/learning-profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            profile,
            analytics
          }),
        });
        
        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.message || 'Failed to save learning profile');
        }
        
        toast({
          title: "Profile Created",
          description: "Your personalized learning profile has been created successfully!"
        });
      } catch (err) {
        console.error('Failed to save learning profile to backend:', err);
        toast({
          title: "Saved Locally",
          description: "Your profile was saved locally and will sync when you're online."
        });
      }
      
    } catch (error: any) {
      console.error('Error submitting quiz:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit quiz. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
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
  
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md p-6">
          <div className="w-12 h-12 mx-auto text-red-500">
            <AlertCircle className="w-12 h-12" />
          </div>
          <h2 className="text-2xl font-semibold">Access Denied</h2>
          <p className="text-white/70">
            You must be authenticated to access this assessment.
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
  
  if (learningProfile && quizAnalytics) {
    return (
      <div className="min-h-screen bg-black text-white p-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl" />
                <div className="relative w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center">
                  <Trophy className="w-8 h-8 text-green-400" />
                </div>
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-2">Assessment Complete!</h1>
            <p className="text-white/70 max-w-2xl mx-auto">
              Great job! Based on your cognitive assessment, we've created a personalized learning profile 
              that will help tailor your educational experience.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Overall Score Card */}
            <Card className="bg-white/5 border-white/10 lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-400" />
                  Overall Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-5xl font-bold text-blue-400 mb-2">
                    {quizAnalytics.score}%
                  </div>
                  <div className="text-white/60 text-sm mb-4">
                    Percentile: Top {quizAnalytics.percentileRanking}%
                  </div>
                  <div className="flex justify-center gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-semibold">{quizAnalytics.correctAnswers}</div>
                      <div className="text-white/60">Correct</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold">{Math.floor(quizAnalytics.timeTaken / 60)}m {quizAnalytics.timeTaken % 60}s</div>
                      <div className="text-white/60">Time</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Strengths Card */}
            <Card className="bg-white/5 border-white/10 lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-green-400" />
                  Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {quizAnalytics.strengths.map((strength, index) => (
                    <span 
                      key={index} 
                      className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm"
                    >
                      {strength}
                    </span>
                  ))}
                </div>
                <p className="text-white/70 text-sm mt-4">
                  These are areas where you performed exceptionally well. 
                  We'll leverage these strengths in your learning journey.
                </p>
              </CardContent>
            </Card>
            
            {/* Learning Style Card */}
            <Card className="bg-white/5 border-white/10 lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-purple-400" />
                  Learning Style
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-2xl font-bold capitalize mb-2">
                    {learningProfile.learningStyle.replace('-', ' ')}
                  </div>
                  <div className="text-white/60 text-sm mb-4">
                    Preferred Learning Approach
                  </div>
                  <p className="text-white/70 text-sm">
                    We'll customize content delivery to match your preferred learning style.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Detailed Category Scores */}
          <Card className="bg-white/5 border-white/10 mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-400" />
                Skill Category Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(quizAnalytics.categoryScores).map(([category, percentage]) => (
                  <div key={category} className="text-center">
                    <div className="text-lg font-semibold capitalize mb-1">
                      {category}
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2 mb-2">
                      <div 
                        className="h-2 rounded-full bg-blue-500" 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <div className="text-2xl font-bold">
                      {percentage}%
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Weaknesses and Recommendations */}
          <Card className="bg-white/5 border-white/10 mb-8">
            <CardHeader>
              <CardTitle>Areas for Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                {quizAnalytics.weaknesses.map((weakness, index) => (
                  <span 
                    key={index} 
                    className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm"
                  >
                    {weakness}
                  </span>
                ))}
              </div>
              <p className="text-white/70">
                Don't worry! These are areas where you can improve with targeted practice. 
                Our adaptive learning system will provide extra support in these areas.
              </p>
            </CardContent>
          </Card>
          
          {/* Continue Button */}
          <div className="text-center">
            <Button
              onClick={() => router.push('/term-plan?onboarding=1')}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-lg"
            >
              Continue to Study Plan Setup
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardHeader className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl" />
                  <div className="relative w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center">
                    <Brain className="w-5 h-5 text-blue-400" />
                  </div>
                </div>
                <div>
                  <CardTitle className="text-xl">Learning Assessment</CardTitle>
                  <p className="text-sm text-white/50">Question {currentQuestionIndex + 1} of {DIAGNOSTIC_QUESTIONS.length}</p>
                </div>
              </div>
              <span className="text-sm text-white/50 capitalize">{currentQuestion.type.replace('-', ' ')}</span>
            </div>
            
            <Progress value={progress} className="w-full" />
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-lg font-medium">{currentQuestion.question}</h2>
            </div>
            
            <RadioGroup
              value={getCurrentSelectedOption()}
              onValueChange={handleSelectOption}
              className="space-y-3"
            >
              {currentQuestion.options.map((option) => (
                <div key={option.id} className="flex items-center space-x-3">
                  <RadioGroupItem
                    value={option.id}
                    id={option.id}
                    className="border-white/20 data-[state=checked]:border-blue-400 data-[state=checked]:text-blue-400"
                  />
                  <Label
                    htmlFor={option.id}
                    className="flex-1 p-3 rounded-lg border border-white/10 hover:border-white/30 cursor-pointer transition-colors data-[state=checked]:border-blue-400 data-[state=checked]:bg-blue-400/10"
                  >
                    {option.text}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            
            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={goToPreviousQuestion}
                disabled={currentQuestionIndex === 0}
                className="border-white/20 text-white hover:bg-white/10"
              >
                Previous
              </Button>
              
              {currentQuestionIndex < DIAGNOSTIC_QUESTIONS.length - 1 ? (
                <Button
                  onClick={goToNextQuestion}
                  disabled={!isCurrentQuestionAnswered()}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  Next
                </Button>
              ) : (
                <Button
                  onClick={submitQuiz}
                  disabled={!isCurrentQuestionAnswered() || isSubmitting}
                  className="bg-green-500 hover:bg-green-600"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Complete Assessment"
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}