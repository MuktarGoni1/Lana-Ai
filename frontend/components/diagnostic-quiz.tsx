"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Loader2, Brain, BookOpen, Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DIAGNOSTIC_QUESTIONS, QuizQuestion, LearningProfile, generateLearningProfile } from "@/lib/quiz/diagnostic-quiz";
import { useRouter } from "next/navigation";

interface QuizResponse {
  questionId: string;
  selectedOptionId: string;
  value: any;
}

export default function DiagnosticQuiz() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<QuizResponse[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [learningProfile, setLearningProfile] = useState<LearningProfile | null>(null);
  
  const currentQuestion = DIAGNOSTIC_QUESTIONS[currentQuestionIndex];
  const progress = ((currentQuestionIndex) / DIAGNOSTIC_QUESTIONS.length) * 100;
  
  const handleSelectOption = (optionId: string) => {
    const option = currentQuestion.options.find(opt => opt.id === optionId);
    if (!option) return;
    
    const newResponse: QuizResponse = {
      questionId: currentQuestion.id,
      selectedOptionId: optionId,
      value: option.value
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
      
      // Save to localStorage for now (will be saved to backend later)
      localStorage.setItem('lana_learning_profile', JSON.stringify(profile));
      
      // Save to backend
      try {
        const response = await fetch('/api/learning-profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            profile
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
      
      // Redirect to homepage after a delay
      setTimeout(() => {
        router.push('/homepage');
      }, 3000);
      
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
  
  if (learningProfile) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl" />
                  <div className="relative w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center">
                    <Trophy className="w-8 h-8 text-green-400" />
                  </div>
                </div>
              </div>
              <CardTitle className="text-2xl font-semibold">Profile Complete!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center space-y-2">
                <p className="text-white/70">
                  Your personalized learning profile has been created
                </p>
                <p className="text-sm text-white/50">
                  Redirecting to your dashboard...
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <h3 className="font-medium text-white/80 mb-2">Knowledge Level</h3>
                  <p className="text-lg capitalize">{learningProfile.knowledgeLevel}</p>
                </div>
                
                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <h3 className="font-medium text-white/80 mb-2">Learning Style</h3>
                  <p className="text-lg capitalize">{learningProfile.learningStyle.replace('-', ' ')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
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
                    "Complete Profile"
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