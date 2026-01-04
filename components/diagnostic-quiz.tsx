// components/diagnostic-quiz.tsx
// Diagnostic quiz component for onboarding assessment

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/db";
import { useEnhancedAuth } from "@/hooks/useEnhancedAuth";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { eventTracker } from "@/lib/event-tracker";

// Define the question types for the diagnostic quiz
type DiagnosticQuestion = {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  category: "logical" | "math" | "verbal" | "spatial";
  difficulty: "easy" | "medium" | "hard";
};

// Sample diagnostic questions - in a real app, these would come from an API
const sampleQuestions: DiagnosticQuestion[] = [
  {
    id: "1",
    question: "Which number comes next in the sequence: 2, 4, 8, 16, ...?",
    options: ["20", "24", "32", "64"],
    correctAnswer: "32",
    category: "logical",
    difficulty: "easy"
  },
  {
    id: "2",
    question: "If all Bloops are Razzies and some Razzies are Loppies, then:",
    options: [
      "Some Bloops are definitely Loppies",
      "Some Loppies are definitely Bloops",
      "Some Bloops may be Loppies",
      "No conclusion can be drawn"
    ],
    correctAnswer: "Some Bloops may be Loppies",
    category: "logical",
    difficulty: "medium"
  },
  {
    id: "3",
    question: "What is 25% of 80?",
    options: ["15", "20", "25", "30"],
    correctAnswer: "20",
    category: "math",
    difficulty: "easy"
  },
  {
    id: "4",
    question: "Which word does not belong: apple, banana, carrot, orange?",
    options: ["apple", "banana", "carrot", "orange"],
    correctAnswer: "carrot",
    category: "verbal",
    difficulty: "easy"
  },
  {
    id: "5",
    question: "If a train travels 60 mph for 2 hours and 30 minutes, how far does it go?",
    options: ["120 miles", "135 miles", "150 miles", "180 miles"],
    correctAnswer: "150 miles",
    category: "math",
    difficulty: "medium"
  }
];

export default function DiagnosticQuiz({ onComplete }: { onComplete: () => void }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState(60); // 60 seconds per question
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useEnhancedAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  // Track when quiz starts
  useEffect(() => {
    if (user) {
      eventTracker.trackEvent('diagnostic_quiz_started', {
        total_questions: sampleQuestions.length,
        timestamp: new Date().toISOString()
      });
    }
  }, [user]);

  // Initialize timer for each question
  useEffect(() => {
    if (quizCompleted || currentQuestionIndex >= sampleQuestions.length) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          const currentQuestion = sampleQuestions[currentQuestionIndex];
          
          // Track time up event
          eventTracker.trackEvent('diagnostic_quiz_time_up', {
            question_id: currentQuestion.id,
            question_text: currentQuestion.question,
            category: currentQuestion.category,
            difficulty: currentQuestion.difficulty
          });
          
          // Time's up - move to next question or finish
          handleNext();
          return 60; // Reset timer for next question
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentQuestionIndex, quizCompleted]);

  const handleAnswerSelect = (option: string) => {
    const question = sampleQuestions[currentQuestionIndex];
    setAnswers(prev => ({
      ...prev,
      [question.id]: option
    }));
    
    // Track the answer selection event
    eventTracker.trackEvent('diagnostic_quiz_answer_selected', {
      question_id: question.id,
      question_text: question.question,
      selected_option: option,
      category: question.category,
      difficulty: question.difficulty
    });
  };

  const handleNext = () => {
    const currentQuestion = sampleQuestions[currentQuestionIndex];
    
    if (currentQuestionIndex < sampleQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setTimeRemaining(60); // Reset timer for next question
      
      // Track navigation event
      eventTracker.trackEvent('diagnostic_quiz_navigated_next', {
        from_question: currentQuestion.id,
        to_question: sampleQuestions[currentQuestionIndex + 1].id,
        question_number: currentQuestionIndex + 1
      });
    } else {
      // Track final navigation before completion
      eventTracker.trackEvent('diagnostic_quiz_navigated_next', {
        from_question: currentQuestion.id,
        to_question: 'completion',
        question_number: currentQuestionIndex + 1
      });
      
      finishQuiz();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      const currentQuestion = sampleQuestions[currentQuestionIndex];
      
      setCurrentQuestionIndex(prev => prev - 1);
      // Restore timer for previous question
      setTimeRemaining(60);
      
      // Track navigation event
      eventTracker.trackEvent('diagnostic_quiz_navigated_previous', {
        from_question: currentQuestion.id,
        to_question: sampleQuestions[currentQuestionIndex - 1].id,
        question_number: currentQuestionIndex + 1
      });
    }
  };

  const finishQuiz = async () => {
    setLoading(true);
    try {
      // Calculate score
      let correctAnswers = 0;
      const results = sampleQuestions.map(question => {
        const userAnswer = answers[question.id];
        const isCorrect = userAnswer === question.correctAnswer;
        if (isCorrect) correctAnswers++;
        return {
          questionId: question.id,
          userAnswer,
          correctAnswer: question.correctAnswer,
          isCorrect,
          category: question.category,
          difficulty: question.difficulty
        };
      });

      const score = Math.round((correctAnswers / sampleQuestions.length) * 100);

      // Store results in database
      if (user) {
        // Save to user learning profile
        const { error } = await supabase
          .from('user_learning_profiles')
          .upsert({
            user_id: user.id,
            learning_profile: {
              diagnostic_quiz: {
                score,
                total_questions: sampleQuestions.length,
                correct_answers: correctAnswers,
                results,
                timestamp: new Date().toISOString()
              }
            }
          }, {
            onConflict: 'user_id',
          });

        if (error) {
          console.error('Error saving diagnostic quiz results:', error);
          toast({
            title: "Error",
            description: "Failed to save quiz results. Please try again.",
            variant: "destructive",
          });
        } else {
          // Log the event using event tracker
          await eventTracker.trackEvent('diagnostic_quiz_complete', {
            score,
            total_questions: sampleQuestions.length,
            correct_answers: correctAnswers
          });
        }
      }

      setQuizCompleted(true);
      
      // Track completion event before navigating
      eventTracker.trackEvent('diagnostic_quiz_proceed_clicked', {
        score,
        total_questions: sampleQuestions.length,
        correct_answers: correctAnswers
      });
      
      setTimeout(() => {
        onComplete();
      }, 1500);
    } catch (error) {
      console.error('Error completing diagnostic quiz:', error);
      toast({
        title: "Error",
        description: "An error occurred while completing the quiz. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };



  if (quizCompleted) {
    return (
      <div className="w-full max-w-md mx-auto text-center space-y-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-4"
        >
          <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold">Quiz Complete!</h2>
          <p className="text-white/70">
            Thank you for completing the diagnostic quiz. We'll use this information to personalize your learning experience.
          </p>
        </motion.div>
      </div>
    );
  }

  const currentQuestion = sampleQuestions[currentQuestionIndex];
  const selectedAnswer = answers[currentQuestion.id];

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white/[0.02] border border-white/10 rounded-xl p-6">
        {/* Progress indicator */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-white/60 mb-2">
            <span>Question {currentQuestionIndex + 1} of {sampleQuestions.length}</span>
            <span>{timeRemaining}s</span>
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
              initial={{ width: 0 }}
              animate={{ 
                width: `${((currentQuestionIndex + 1) / sampleQuestions.length) * 100}%` 
              }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-4">{currentQuestion.question}</h3>
          
          {/* Options */}
          <div className="space-y-3">
            {currentQuestion.options.map((option, idx) => (
              <motion.button
                key={idx}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleAnswerSelect(option)}
                className={`w-full text-left p-4 rounded-lg border transition-all ${
                  selectedAnswer === option
                    ? "border-white bg-white/10"
                    : "border-white/20 hover:border-white/40"
                }`}
              >
                <div className="flex items-center">
                  <div className={`w-6 h-6 rounded-full border mr-3 flex items-center justify-center ${
                    selectedAnswer === option 
                      ? "border-white bg-white" 
                      : "border-white/40"
                  }`}>
                    {selectedAnswer === option && (
                      <div className="w-3 h-3 rounded-full bg-black" />
                    )}
                  </div>
                  <span>{option}</span>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className="border-white/20 text-white hover:bg-white/10"
          >
            Previous
          </Button>
          
          <Button
            onClick={handleNext}
            disabled={!selectedAnswer}
            className="bg-white text-black hover:bg-white/90"
          >
            {currentQuestionIndex === sampleQuestions.length - 1 ? "Finish Quiz" : "Next"}
          </Button>
        </div>
      </div>
    </div>
  );
}