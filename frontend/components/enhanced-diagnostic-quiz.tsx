// components/enhanced-diagnostic-quiz.tsx
// Enhanced diagnostic quiz for comprehensive user assessment

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/db";
import { useEnhancedAuth } from "@/hooks/useEnhancedAuth";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { eventTracker } from "@/lib/event-tracker";

// Types for our enhanced diagnostic system
type LearningStyle = 'visual' | 'auditory' | 'kinesthetic' | 'reading/writing';
type SubjectArea = 'mathematics' | 'science' | 'language_arts' | 'social_studies' | 'other';
type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

interface UserPreferences {
  learning_style: LearningStyle;
  preferred_subjects: SubjectArea[];
  study_habits: string[];
  challenges: string[];
  goals: string[];
  time_availability: 'limited' | 'moderate' | 'extensive';
}

interface DiagnosticQuestion {
  id: string;
  section: 'academic' | 'behavioral' | 'preferences' | 'demographics';
  question: string;
  type: 'multiple_choice' | 'single_choice' | 'scale' | 'text_input';
  options?: string[];
  scale_range?: [number, number]; // For rating scales (e.g., [1, 5])
  category?: string;
  subcategory?: string;
  weight: number; // Importance factor for scoring
}

interface QuestionResponse {
  questionId: string;
  response: string | number | string[];
  timestamp: string;
}

interface AssessmentResults {
  academic_skills: {
    mathematics: number;
    science: number;
    language_arts: number;
    logical_reasoning: number;
  };
  learning_preferences: UserPreferences;
  behavioral_insights: {
    attention_span: number;
    persistence_level: number;
    confidence_rating: number;
  };
  overall_score: number;
  strengths: string[];
  areas_for_improvement: string[];
  recommendations: string[];
}

export default function EnhancedDiagnosticQuiz({ onComplete, childAge, childGrade }: { 
  onComplete: () => void; 
  childAge?: number;
  childGrade?: string;
}) {
  const [currentSection, setCurrentSection] = useState<'intro' | 'assessment' | 'results'>('intro');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, QuestionResponse>>({});
  const [timeRemaining, setTimeRemaining] = useState(90); // 90 seconds per question
  const [loading, setLoading] = useState(false);
  const [assessmentResults, setAssessmentResults] = useState<AssessmentResults | null>(null);
  
  const { user } = useEnhancedAuth();
  const router = useRouter();
  const { toast } = useToast();

  // Comprehensive question bank
  const questionBank: DiagnosticQuestion[] = [
    // Demographics Section
    {
      id: "demo_1",
      section: "demographics",
      question: "What grade are you currently in?",
      type: "single_choice",
      options: ["Kindergarten", "1st Grade", "2nd Grade", "3rd Grade", "4th Grade", "5th Grade", "6th Grade", "7th Grade", "8th Grade", "9th Grade", "10th Grade", "11th Grade", "12th Grade"],
      weight: 1
    },
    {
      id: "demo_2",
      section: "demographics",
      question: "How much time can you dedicate to studying each day?",
      type: "single_choice",
      options: ["Less than 30 minutes", "30 minutes to 1 hour", "1-2 hours", "2-3 hours", "More than 3 hours"],
      weight: 1
    },

    // Academic Skills Section
    {
      id: "math_1",
      section: "academic",
      question: "Solve: If 3x + 7 = 22, what is the value of x?",
      type: "single_choice",
      options: ["3", "5", "7", "15"],
      category: "mathematics",
      weight: 2
    },
    {
      id: "math_2",
      section: "academic",
      question: "What is 25% of 80?",
      type: "single_choice",
      options: ["15", "20", "25", "30"],
      category: "mathematics",
      weight: 1
    },
    {
      id: "sci_1",
      section: "academic",
      question: "Which planet is known as the Red Planet?",
      type: "single_choice",
      options: ["Earth", "Venus", "Mars", "Jupiter"],
      category: "science",
      weight: 1
    },
    {
      id: "lang_1",
      section: "academic",
      question: "Choose the sentence with correct grammar:",
      type: "single_choice",
      options: [
        "She don't like apples",
        "She doesn't likes apples", 
        "She doesn't like apples",
        "She don't likes apples"
      ],
      category: "language_arts",
      weight: 1
    },

    // Learning Preferences Section
    {
      id: "pref_1",
      section: "preferences",
      question: "When learning something new, which method helps you most?",
      type: "single_choice",
      options: [
        "Watching videos or demonstrations",
        "Listening to explanations",
        "Hands-on practice and activities",
        "Reading and taking notes"
      ],
      weight: 2
    },
    {
      id: "pref_2",
      section: "preferences",
      question: "Which subjects do you enjoy most? (Select all that apply)",
      type: "multiple_choice",
      options: ["Mathematics", "Science", "English/Language Arts", "History/Social Studies", "Art/Music", "Physical Education"],
      weight: 1
    },
    {
      id: "pref_3",
      section: "preferences",
      question: "How would you rate your confidence in mathematics?",
      type: "scale",
      scale_range: [1, 5],
      options: ["Very Low", "Low", "Neutral", "High", "Very High"],
      weight: 1
    },

    // Behavioral Assessment Section
    {
      id: "behav_1",
      section: "behavioral",
      question: "When faced with a difficult problem, how do you typically respond?",
      type: "single_choice",
      options: [
        "Give up quickly",
        "Try for a few minutes then ask for help",
        "Keep trying for a reasonable amount of time",
        "Persist until I figure it out"
      ],
      weight: 2
    },
    {
      id: "behav_2",
      section: "behavioral",
      question: "How long can you typically focus on one task without getting distracted?",
      type: "single_choice",
      options: ["Less than 10 minutes", "10-20 minutes", "20-30 minutes", "30-45 minutes", "More than 45 minutes"],
      weight: 1
    }
  ];

  const [questions] = useState<DiagnosticQuestion[]>(() => {
    // Filter questions based on age if provided
    if (childAge !== undefined) {
      const ageGroup = childAge < 10 ? 'elementary' : childAge < 14 ? 'middle' : 'high';
      // For now, return all questions but could filter based on age group
      return questionBank;
    }
    return questionBank;
  });

  // Group questions by section for navigation
  const sections = [...new Set(questions.map(q => q.section))];
  const currentSectionQuestions = questions.filter(q => q.section === sections[sections.indexOf(questions[currentQuestionIndex]?.section) || 0]);

  // Track quiz start
  useEffect(() => {
    if (user && currentSection === 'assessment') {
      eventTracker.trackEvent('enhanced_diagnostic_quiz_started', {
        total_questions: questions.length,
        sections: sections,
        timestamp: new Date().toISOString(),
        child_age: childAge,
        child_grade: childGrade
      });
    }
  }, [user, currentSection, questions.length, sections, childAge, childGrade]);

  // Timer effect
  useEffect(() => {
    if (currentSection !== 'assessment' || currentQuestionIndex >= questions.length) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          const currentQuestion = questions[currentQuestionIndex];
          
          eventTracker.trackEvent('enhanced_diagnostic_time_up', {
            question_id: currentQuestion.id,
            section: currentQuestion.section,
            question_text: currentQuestion.question
          });
          
          handleNext();
          return 90;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentQuestionIndex, currentSection, questions]);

  const handleResponse = (response: string | number | string[]) => {
    const question = questions[currentQuestionIndex];
    const responseObj: QuestionResponse = {
      questionId: question.id,
      response,
      timestamp: new Date().toISOString()
    };

    setResponses(prev => ({
      ...prev,
      [question.id]: responseObj
    }));

    eventTracker.trackEvent('enhanced_diagnostic_response', {
      question_id: question.id,
      section: question.section,
      response_type: question.type,
      response: response,
      category: question.category,
      weight: question.weight
    });
  };

  const calculateResults = (): AssessmentResults => {
    // Process responses to generate insights
    const mathResponses = Object.values(responses).filter(r => 
      r.questionId.startsWith('math_')
    ).length;
    
    const correctMath = Object.values(responses).filter(r => 
      (r.questionId === 'math_1' && r.response === '5') ||
      (r.questionId === 'math_2' && r.response === '20')
    ).length;

    const scienceCorrect = responses['sci_1']?.response === 'Mars' ? 1 : 0;
    const languageCorrect = responses['lang_1']?.response === 'She doesn\'t like apples' ? 1 : 0;

    // Calculate scores (0-100 scale)
    const mathematicsScore = mathResponses > 0 ? Math.round((correctMath / mathResponses) * 100) : 50;
    const scienceScore = scienceCorrect * 100;
    const languageArtsScore = languageCorrect * 100;
    const logicalReasoningScore = 75; // Default score, would be calculated from logic questions

    // Analyze learning preferences
    const learningStyleResponse = responses['pref_1']?.response as string;
    let learningStyle: LearningStyle = 'visual';
    
    if (learningStyleResponse) {
      if (learningStyleResponse.includes('Watching')) learningStyle = 'visual';
      else if (learningStyleResponse.includes('Listening')) learningStyle = 'auditory';
      else if (learningStyleResponse.includes('Hands-on')) learningStyle = 'kinesthetic';
      else if (learningStyleResponse.includes('Reading')) learningStyle = 'reading/writing';
    }

    const preferredSubjects = (responses['pref_2']?.response as string[] || []).map(subject => {
      const mapping: Record<string, SubjectArea> = {
        'Mathematics': 'mathematics',
        'Science': 'science',
        'English/Language Arts': 'language_arts',
        'History/Social Studies': 'social_studies'
      };
      return mapping[subject] || 'other';
    }) as SubjectArea[];

    const confidenceRating = Number(responses['pref_3']?.response) || 3;

    // Behavioral insights
    const persistenceResponse = responses['behav_1']?.response as string;
    let persistenceLevel = 2; // Default medium
    
    if (persistenceResponse) {
      if (persistenceResponse.includes('Give up')) persistenceLevel = 1;
      else if (persistenceResponse.includes('few minutes')) persistenceLevel = 2;
      else if (persistenceResponse.includes('reasonable')) persistenceLevel = 3;
      else if (persistenceResponse.includes('figure it out')) persistenceLevel = 4;
    }

    const attentionSpanResponse = responses['behav_2']?.response as string;
    let attentionSpan = 2; // Default medium
    
    if (attentionSpanResponse) {
      if (attentionSpanResponse.includes('Less than 10')) attentionSpan = 1;
      else if (attentionSpanResponse.includes('10-20')) attentionSpan = 2;
      else if (attentionSpanResponse.includes('20-30')) attentionSpan = 3;
      else if (attentionSpanResponse.includes('30-45')) attentionSpan = 4;
      else if (attentionSpanResponse.includes('More than 45')) attentionSpan = 5;
    }

    // Overall score calculation
    const overallScore = Math.round(
      (mathematicsScore + scienceScore + languageArtsScore + logicalReasoningScore) / 4
    );

    // Generate insights
    const strengths: string[] = [];
    const areasForImprovement: string[] = [];
    const recommendations: string[] = [];

    if (mathematicsScore >= 70) strengths.push('Strong mathematical reasoning');
    else areasForImprovement.push('Mathematical concepts');

    if (scienceScore >= 70) strengths.push('Scientific understanding');
    else areasForImprovement.push('Science fundamentals');

    if (languageArtsScore >= 70) strengths.push('Language comprehension');
    else areasForImprovement.push('Reading and grammar skills');

    // Recommendations based on learning style
    if (learningStyle === 'visual') {
      recommendations.push('Incorporate more diagrams, charts, and visual aids');
    } else if (learningStyle === 'auditory') {
      recommendations.push('Include audio explanations and discussions');
    } else if (learningStyle === 'kinesthetic') {
      recommendations.push('Add hands-on activities and interactive exercises');
    } else {
      recommendations.push('Provide detailed written materials and note-taking opportunities');
    }

    return {
      academic_skills: {
        mathematics: mathematicsScore,
        science: scienceScore,
        language_arts: languageArtsScore,
        logical_reasoning: logicalReasoningScore
      },
      learning_preferences: {
        learning_style: learningStyle,
        preferred_subjects: preferredSubjects,
        study_habits: [], // Would be populated from additional questions
        challenges: [], // Would be populated from additional questions
        goals: [], // Would be populated from additional questions
        time_availability: 'moderate' // Would be calculated from demographic questions
      },
      behavioral_insights: {
        attention_span: attentionSpan,
        persistence_level: persistenceLevel,
        confidence_rating: confidenceRating
      },
      overall_score: overallScore,
      strengths,
      areas_for_improvement: areasForImprovement,
      recommendations
    };
  };

  const handleNext = () => {
    const currentQuestion = questions[currentQuestionIndex];
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setTimeRemaining(90);
      
      eventTracker.trackEvent('enhanced_diagnostic_navigated_next', {
        from_question: currentQuestion.id,
        to_question: questions[currentQuestionIndex + 1].id,
        section_progress: `${currentQuestionIndex + 1}/${questions.length}`
      });
    } else {
      // Complete assessment and show results
      const results = calculateResults();
      setAssessmentResults(results);
      setCurrentSection('results');
      
      eventTracker.trackEvent('enhanced_diagnostic_completed', {
        total_questions: questions.length,
        responses_count: Object.keys(responses).length,
        overall_score: results.overall_score,
        strengths_count: results.strengths.length,
        areas_needing_attention: results.areas_for_improvement.length
      });
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      const currentQuestion = questions[currentQuestionIndex];
      setCurrentQuestionIndex(prev => prev - 1);
      setTimeRemaining(90);
      
      eventTracker.trackEvent('enhanced_diagnostic_navigated_previous', {
        from_question: currentQuestion.id,
        to_question: questions[currentQuestionIndex - 1].id
      });
    }
  };

  const saveResults = async () => {
    if (!user || !assessmentResults) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_learning_profiles')
        .upsert({
          user_id: user.id,
          learning_profile: {
            enhanced_diagnostic: {
              ...assessmentResults,
              responses: Object.values(responses).map(r => ({
                questionId: r.questionId,
                response: typeof r.response === 'object' ? JSON.stringify(r.response) : r.response,
                timestamp: r.timestamp
              })),
              timestamp: new Date().toISOString(),
              child_age: childAge,
              child_grade: childGrade,
              version: '2.0'
            }
          } as any // Type assertion to bypass strict typing for complex nested objects
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error saving enhanced diagnostic results:', error);
        toast({
          title: "Error",
          description: "Failed to save your assessment results. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success!",
          description: "Your personalized learning profile has been created.",
        });
        
        eventTracker.trackEvent('enhanced_diagnostic_results_saved', {
          user_id: user.id,
          overall_score: assessmentResults.overall_score
        });

        setTimeout(() => {
          onComplete();
        }, 2000);
      }
    } catch (error) {
      console.error('Error saving results:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Render different sections
  if (currentSection === 'intro') {
    return (
      <div className="w-full max-w-2xl mx-auto text-center space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div className="space-y-4">
            <h1 className="text-3xl font-bold text-white">Learning Assessment</h1>
            <p className="text-gray-300 text-lg">
              Welcome! This assessment will help us understand your learning style and create a personalized experience just for you.
            </p>
            <div className="bg-gray-800/50 rounded-lg p-6 text-left space-y-3">
              <h3 className="font-semibold text-white">What we'll cover:</h3>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Academic skills assessment
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  Learning preferences and style
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Study habits and behaviors
                </li>
              </ul>
            </div>
            <p className="text-gray-400 italic">
              Takes approximately 10-15 minutes to complete
            </p>
          </div>
          <Button
            onClick={() => setCurrentSection('assessment')}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 text-lg"
          >
            Begin Assessment
          </Button>
        </motion.div>
      </div>
    );
  }

  if (currentSection === 'results' && assessmentResults) {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6"
        >
          <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white">Assessment Complete!</h1>
          <p className="text-gray-300 text-lg">
            Great job! Here's what we learned about your learning profile.
          </p>
        </motion.div>

        {/* Results Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Overall Score */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gray-800/50 rounded-xl p-6 border border-gray-700"
          >
            <h3 className="text-xl font-semibold text-white mb-4">Overall Performance</h3>
            <div className="text-center">
              <div className="relative w-32 h-32 mx-auto mb-4">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="#374151"
                    strokeWidth="8"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="url(#scoreGradient)"
                    strokeWidth="8"
                    strokeDasharray={`${283 * (assessmentResults.overall_score / 100)} 283`}
                    strokeLinecap="round"
                    transform="rotate(-90 50 50)"
                  />
                  <defs>
                    <linearGradient id="scoreGradient">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {assessmentResults.overall_score}%
                  </span>
                </div>
              </div>
              <p className="text-gray-300">
                Your overall academic readiness score
              </p>
            </div>
          </motion.div>

          {/* Strengths and Areas for Improvement */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div className="bg-green-900/20 border border-green-800 rounded-xl p-4">
              <h4 className="font-semibold text-green-400 mb-2 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Strengths
              </h4>
              <ul className="space-y-1">
                {assessmentResults.strengths.map((strength, idx) => (
                  <li key={idx} className="text-green-300 text-sm">• {strength}</li>
                ))}
              </ul>
            </div>

            <div className="bg-yellow-900/20 border border-yellow-800 rounded-xl p-4">
              <h4 className="font-semibold text-yellow-400 mb-2 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Areas for Growth
              </h4>
              <ul className="space-y-1">
                {assessmentResults.areas_for_improvement.map((area, idx) => (
                  <li key={idx} className="text-yellow-300 text-sm">• {area}</li>
                ))}
              </ul>
            </div>
          </motion.div>
        </div>

        {/* Recommendations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800/50 rounded-xl p-6 border border-gray-700"
        >
          <h3 className="text-xl font-semibold text-white mb-4">Personalized Recommendations</h3>
          <ul className="space-y-3">
            {assessmentResults.recommendations.map((rec, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-gray-300">{rec}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Button
            onClick={saveResults}
            disabled={loading}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3"
          >
            {loading ? 'Saving...' : 'Save My Profile'}
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/homepage')}
            className="border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            Skip for Now
          </Button>
        </motion.div>
      </div>
    );
  }

  // Assessment questions
  const currentQuestion = questions[currentQuestionIndex];
  const currentResponse = responses[currentQuestion.id];

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
        {/* Progress indicator */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
            <span>{timeRemaining}s remaining</span>
          </div>
          <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
              initial={{ width: 0 }}
              animate={{ 
                width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` 
              }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Section: {currentQuestion.section.charAt(0).toUpperCase() + currentQuestion.section.slice(1)}
          </div>
        </div>

        {/* Question */}
        <div className="mb-8">
          <h3 className="text-xl font-medium text-white mb-6">{currentQuestion.question}</h3>
          
          {/* Different input types */}
          <div className="space-y-4">
            {currentQuestion.type === 'single_choice' && currentQuestion.options && (
              <div className="space-y-3">
                {currentQuestion.options.map((option, idx) => (
                  <motion.button
                    key={idx}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleResponse(option)}
                    className={`w-full text-left p-4 rounded-lg border transition-all ${
                      currentResponse?.response === option
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-gray-600 hover:border-gray-500"
                    }`}
                  >
                    <div className="flex items-center">
                      <div className={`w-5 h-5 rounded-full border mr-3 flex items-center justify-center ${
                        currentResponse?.response === option 
                          ? "border-blue-500 bg-blue-500" 
                          : "border-gray-500"
                      }`}>
                        {currentResponse?.response === option && (
                          <div className="w-2 h-2 rounded-full bg-white" />
                        )}
                      </div>
                      <span className="text-gray-200">{option}</span>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}

            {currentQuestion.type === 'multiple_choice' && currentQuestion.options && (
              <div className="space-y-3">
                {currentQuestion.options.map((option, idx) => (
                  <motion.button
                    key={idx}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      const currentSelections = Array.isArray(currentResponse?.response) 
                        ? [...currentResponse.response] 
                        : [];
                      
                      if (currentSelections.includes(option)) {
                        handleResponse(currentSelections.filter(item => item !== option));
                      } else {
                        handleResponse([...currentSelections, option]);
                      }
                    }}
                    className={`w-full text-left p-4 rounded-lg border transition-all ${
                      Array.isArray(currentResponse?.response) && currentResponse?.response.includes(option)
                        ? "border-purple-500 bg-purple-500/10"
                        : "border-gray-600 hover:border-gray-500"
                    }`}
                  >
                    <div className="flex items-center">
                      <div className={`w-5 h-5 rounded border mr-3 flex items-center justify-center ${
                        Array.isArray(currentResponse?.response) && currentResponse?.response.includes(option)
                          ? "border-purple-500 bg-purple-500"
                          : "border-gray-500"
                      }`}>
                        {Array.isArray(currentResponse?.response) && currentResponse?.response.includes(option) && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <span className="text-gray-200">{option}</span>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}

            {currentQuestion.type === 'scale' && currentQuestion.scale_range && (
              <div className="space-y-4">
                <div className="flex justify-between text-sm text-gray-400">
                  <span>{currentQuestion.options?.[0] || currentQuestion.scale_range[0]}</span>
                  <span>{currentQuestion.options?.[currentQuestion.options.length - 1] || currentQuestion.scale_range[1]}</span>
                </div>
                <div className="flex gap-2">
                  {Array.from(
                    { length: currentQuestion.scale_range[1] - currentQuestion.scale_range[0] + 1 }, 
                    (_, i) => currentQuestion.scale_range![0] + i
                  ).map((value) => (
                    <motion.button
                      key={value}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleResponse(value)}
                      className={`flex-1 py-3 rounded-lg border transition-all ${
                        currentResponse?.response === value
                          ? "border-blue-500 bg-blue-500/20 text-blue-400"
                          : "border-gray-600 hover:border-gray-500 text-gray-400"
                      }`}
                    >
                      {value}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            Previous
          </Button>
          
          <Button
            onClick={handleNext}
            disabled={!currentResponse}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
          >
            {currentQuestionIndex === questions.length - 1 ? "See Results" : "Next"}
          </Button>
        </div>
      </div>
    </div>
  );
}