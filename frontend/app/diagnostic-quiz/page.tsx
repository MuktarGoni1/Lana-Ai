"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// Define the question types for the diagnostic quiz
interface DiagnosticQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  category: "logical" | "math" | "verbal" | "spatial";
  difficulty: "easy" | "medium" | "hard";
}

export default function DiagnosticQuizPage() {
  const router = useRouter();
  const [step, setStep] = useState<'age' | 'quiz' | 'results'>('age');
  const [childAge, setChildAge] = useState<number | undefined>(undefined);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [questions, setQuestions] = useState<DiagnosticQuestion[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(60); // 60 seconds per question
  const [quizCompleted, setQuizCompleted] = useState(false);
  
  // Timer effect for each question
  useEffect(() => {
    if (step === 'quiz' && questions.length > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            // Auto-select the first option if no answer selected and move to next question
            const currentQuestion = questions[currentQuestionIndex];
            if (!answers[currentQuestion?.id]) {
              handleAnswerSelect(currentQuestion?.options[0]);
            }
            handleNext(); // Automatically move to next question when time runs out
            return 60;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [step, currentQuestionIndex, questions.length, answers, questions]);
  
  // Function to generate age-appropriate questions
  const generateQuestionsForAge = (age: number): DiagnosticQuestion[] => {
    // Define age ranges
    const isYounger = age < 10; // Elementary age
    const isMiddle = age >= 10 && age < 14; // Middle school age
    const isOlder = age >= 14; // High school age

    if (isYounger) {
      // Younger children get simpler questions
      return [
        {
          id: "1",
          question: "What number comes next in the pattern: 2, 4, 6, 8, ...?",
          options: ["9", "10", "11", "12"],
          correctAnswer: "10",
          category: "logical",
          difficulty: "easy"
        },
        {
          id: "2",
          question: "If you have 5 apples and eat 2, how many do you have left?",
          options: ["2", "3", "4", "5"],
          correctAnswer: "3",
          category: "math",
          difficulty: "easy"
        },
        {
          id: "3",
          question: "Which animal is different: cat, dog, fish, bird?",
          options: ["cat", "dog", "fish", "bird"],
          correctAnswer: "fish",
          category: "verbal",
          difficulty: "easy"
        },
        {
          id: "4",
          question: "Which shape has 3 sides?",
          options: ["Square", "Circle", "Triangle", "Rectangle"],
          correctAnswer: "Triangle",
          category: "spatial",
          difficulty: "easy"
        },
        {
          id: "5",
          question: "If today is Monday, what day is tomorrow?",
          options: ["Sunday", "Tuesday", "Wednesday", "Monday"],
          correctAnswer: "Tuesday",
          category: "logical",
          difficulty: "easy"
        }
      ];
    } else if (isMiddle) {
      // Middle age group gets moderate questions
      return [
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
          question: "What is 25% of 80?",
          options: ["15", "20", "25", "30"],
          correctAnswer: "20",
          category: "math",
          difficulty: "easy"
        },
        {
          id: "3",
          question: "Which word does not belong: apple, banana, carrot, orange?",
          options: ["apple", "banana", "carrot", "orange"],
          correctAnswer: "carrot",
          category: "verbal",
          difficulty: "easy"
        },
        {
          id: "4",
          question: "If a train travels 60 mph for 2 hours and 30 minutes, how far does it go?",
          options: ["120 miles", "135 miles", "150 miles", "180 miles"],
          correctAnswer: "150 miles",
          category: "math",
          difficulty: "medium"
        },
        {
          id: "5",
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
        }
      ];
    } else {
      // Older students get more complex questions
      return [
        {
          id: "1",
          question: "Which expression is equivalent to (x + 3)(x - 3)?",
          options: ["x² - 9", "x² + 9", "x² - 6x + 9", "x² + 6x - 9"],
          correctAnswer: "x² - 9",
          category: "math",
          difficulty: "medium"
        },
        {
          id: "2",
          question: "If the first term of a geometric sequence is 2 and the common ratio is 3, what is the 4th term?",
          options: ["18", "27", "54", "81"],
          correctAnswer: "54",
          category: "logical",
          difficulty: "medium"
        },
        {
          id: "3",
          question: "Which of the following is the best example of deductive reasoning?",
          options: [
            "Every swan I've seen is white, so all swans are white",
            "All men are mortal. Socrates is a man. Therefore, Socrates is mortal",
            "The sun has risen every day, so it will rise tomorrow",
            "Most birds can fly, so this bird can fly"
          ],
          correctAnswer: "All men are mortal. Socrates is a man. Therefore, Socrates is mortal",
          category: "logical",
          difficulty: "hard"
        },
        {
          id: "4",
          question: "What is the next number in the sequence: 1, 1, 2, 3, 5, 8, 13, ...?",
          options: ["20", "21", "22", "23"],
          correctAnswer: "21",
          category: "logical",
          difficulty: "medium"
        },
        {
          id: "5",
          question: "If a cube has a side length of 4 units, what is its surface area?",
          options: ["64 square units", "96 square units", "128 square units", "144 square units"],
          correctAnswer: "96 square units",
          category: "spatial",
          difficulty: "medium"
        }
      ];
    }
  };
  
  const handleAgeSubmit = () => {
    if (childAge !== undefined && childAge > 0 && childAge < 100) {
      const quizQuestions = generateQuestionsForAge(childAge);
      setQuestions(quizQuestions);
      setCurrentQuestionIndex(0);
      setStep('quiz');
      setTimeRemaining(60); // Initialize timer for first question
    }
  };
  
  const handleAnswerSelect = (option: string) => {
    const question = questions[currentQuestionIndex];
    setAnswers(prev => ({
      ...prev,
      [question.id]: option
    }));
  };
  
  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setTimeRemaining(60); // Reset timer for next question
    } else {
      // Finish quiz
      setQuizCompleted(true);
      setStep('results');
    }
  };
  
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setTimeRemaining(60); // Reset timer for previous question
    }
  };
  
  const finishQuiz = () => {
    // Calculate score
    let correctAnswers = 0;
    questions.forEach(question => {
      if (answers[question.id] === question.correctAnswer) {
        correctAnswers++;
      }
    });
    
    const score = Math.round((correctAnswers / questions.length) * 100);
    
    // Navigate to register page
    router.push('/register');
  };
  
  const currentQuestion = questions.length > 0 ? questions[currentQuestionIndex] : null;
  const selectedAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;
  
  // Calculate results
  let correctAnswers = 0;
  let incorrectAnswers = 0;
  
  if (questions.length > 0) {
    questions.forEach(question => {
      if (answers[question.id] === question.correctAnswer) {
        correctAnswers++;
      } else {
        incorrectAnswers++;
      }
    });
  }
  
  const score = questions.length > 0 ? Math.round((correctAnswers / questions.length) * 100) : 0;
  
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Diagnostic Quiz</h1>
          <p className="text-white/60">
            Assess your child's current performance level
          </p>
        </div>
        
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 md:p-8">
          {step === 'age' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold mb-4">Enter Child's Age</h2>
              <p className="text-white/70 mb-6">We'll customize the quiz based on the age to ensure appropriate difficulty</p>
              
              <div className="flex flex-col items-center">
                <input
                  type="number"
                  min="1"
                  max="18"
                  value={childAge || ''}
                  onChange={(e) => setChildAge(parseInt(e.target.value) || undefined)}
                  className="w-full max-w-xs px-4 py-3 bg-white/[0.05] border border-white/20 rounded-lg text-white text-center text-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Age"
                  autoFocus
                />
                <button
                  onClick={handleAgeSubmit}
                  disabled={childAge === undefined || childAge <= 0 || childAge >= 100}
                  className="mt-6 px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Begin Quiz
                </button>
              </div>
            </div>
          )}
          
          {step === 'quiz' && (
            <div className="space-y-6">
              {/* Check if questions exist */}
              {questions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-white/70 mb-4">Generating questions based on age...</p>
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <>
                  {/* Progress indicator */}
                  <div className="mb-6">
                    <div className="flex justify-between text-sm text-white/60 mb-2">
                      <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
                      <span>{timeRemaining}s</span>
                    </div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                        style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Question */}
                  <div className="mb-6">
                    <h3 className="text-xl font-medium mb-4">{currentQuestion?.question}</h3>
                    
                    {/* Options */}
                    <div className="space-y-3">
                      {currentQuestion?.options.map((option, idx) => (
                        <button
                          key={idx}
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
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Navigation */}
                  <div className="flex justify-between">
                    <button
                      onClick={handlePrevious}
                      disabled={currentQuestionIndex === 0}
                      className="px-6 py-2 border border-white/20 text-white rounded-lg hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    
                    <button
                      onClick={handleNext}
                      disabled={!selectedAnswer}
                      className="px-6 py-2 bg-white text-black font-medium rounded-lg hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {currentQuestion && currentQuestionIndex === questions.length - 1 ? "See Results" : "Next"}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
          
          {step === 'results' && (
            <div className="space-y-6 text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              
              <h2 className="text-2xl font-bold">Quiz Complete!</h2>
              <p className="text-white/70 mb-6">
                Here's how your child performed on the diagnostic quiz
              </p>
              
              <div className="bg-white/[0.05] rounded-xl p-6 mb-6">
                <div className="text-4xl font-bold text-white mb-2">{score}%</div>
                <div className="text-white/70">Overall Score</div>
                
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">{correctAnswers}</div>
                    <div className="text-white/70 text-sm">Correct</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-400">{incorrectAnswers}</div>
                    <div className="text-white/70 text-sm">Incorrect</div>
                  </div>
                </div>
              </div>
              
              <button
                onClick={finishQuiz}
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300"
              >
                Continue to Registration
              </button>
            </div>
          )}
        </div>
        
        <div className="mt-6 text-center text-sm text-white/50">
          Results will help us recommend the best learning path for your child
        </div>
      </div>
    </div>
  );
}