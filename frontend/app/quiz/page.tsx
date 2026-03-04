"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Check, X, ArrowLeft, RotateCcw, Sparkles, BookOpen, Trophy, Clock } from "lucide-react";
import { Suspense } from "react";

/* ---------------- types ---------------- */
type Question = {
  q: string; 
  options: string[];
  answer: string;
  explanation?: string;
};

/* ---------------- helpers ---------------- */
const percentage = (num: number, total: number) =>
  total === 0 ? 0 : Math.round((num / total) * 100);

// Safely parse and validate quiz data from URL param
function parseQuizParam(raw: string | null): Question[] {
  if (!raw) return [];
  try {
    const decoded = decodeURIComponent(raw);
    const data = JSON.parse(decoded);
    if (!Array.isArray(data)) return [];

    // Validate structure and enforce sane limits
    const MAX_QUESTIONS = 50;
    const MAX_Q_LEN = 500;
    const MAX_OPT_LEN = 200;
    const MIN_OPTIONS = 2;
    const MAX_OPTIONS = 10;

    const cleaned: Question[] = [];
    for (const item of data.slice(0, MAX_QUESTIONS)) {
      if (!item || typeof item !== "object") continue;
      // Handle 'q' property - be more flexible
      const q = typeof item.q === "string" ? item.q.trim().slice(0, MAX_Q_LEN) : 
                typeof item.question === "string" ? item.question.trim().slice(0, MAX_Q_LEN) : null;
      const options = Array.isArray(item.options)
        ? item.options
            .filter((o: unknown) => typeof o === "string")
            .map((o: string) => o.trim().slice(0, MAX_OPT_LEN))
        : Array.isArray(item.choices) // Handle 'choices' as well
        ? item.choices
            .filter((o: unknown) => typeof o === "string")
            .map((o: string) => o.trim().slice(0, MAX_OPT_LEN))
        : null;
      // Handle both 'answer' properties for consistency
      const answer = typeof item.answer === "string" ? item.answer.trim().slice(0, MAX_OPT_LEN) : 
                     typeof item.correct === "string" ? item.correct.trim().slice(0, MAX_OPT_LEN) : null;
      const explanation = typeof item.explanation === "string" ? item.explanation.trim().slice(0, MAX_Q_LEN) : 
                          typeof item.reason === "string" ? item.reason.trim().slice(0, MAX_Q_LEN) : undefined;

      // Be more lenient with validation
      if (!q || !options || options.length < MIN_OPTIONS || options.length > MAX_OPTIONS || !answer) continue;
      if (!options.includes(answer)) {
        // If answer is not in options, try to find a close match
        const matchingOption = options.find((opt: string) => 
          opt.toLowerCase().trim() === answer.toLowerCase().trim());
        if (!matchingOption) continue;
        // Use the matching option instead
      }

      cleaned.push({ q, options, answer, explanation });
    }

    return cleaned;
  } catch (error) {
    console.error("Error parsing quiz data:", error);
    return [];
  }
}

/* ---------------- main component ---------------- */
function QuizContent() {
  const search = useSearchParams();
  const router = useRouter();
  const startTimeRef = useRef<number>(Date.now());
  const [timeElapsed, setTimeElapsed] = useState(0);
  
  // Component definitions moved to top to avoid hoisting issues
  const AnimatedBackground = () => (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[128px] animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-[128px] animate-pulse delay-700" />
      <div className="absolute top-1/4 right-1/3 w-64 h-64 bg-pink-500/3 rounded-full blur-[96px] animate-pulse delay-1000" />
    </div>
  );

  /* ---------- load quiz ---------- */
  const [quiz, setQuiz] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const id = search.get("id");
    const lessonId = search.get("lessonId");
    const raw = search.get("data");
    async function load() {
      if (lessonId) {
        // Load quiz by lesson ID
        try {
          const res = await fetch(`/api/lessons/${lessonId}/quiz`, { cache: "no-store" });
          if (res.ok) {
            const data = await res.json();
            console.log("Quiz data received from API:", data); // Debug log
            // Transform data to match frontend expectations with better error handling
            const transformedQuiz = Array.isArray(data) ? data.map((item: any) => ({
              q: item.q || item.question || "",  // Handle both 'q' and 'question' properties
              options: Array.isArray(item.options) ? item.options : [],
              answer: item.answer || ""
            })).filter(item => item.q && item.options.length > 0) : [];
            console.log("Transformed quiz data:", transformedQuiz); // Debug log
            setQuiz(transformedQuiz);
          } else {
            console.warn("Failed to fetch quiz by lesson ID:", res.status);
            setQuiz([]);
          }
        } catch (error) {
          console.error("Error fetching quiz by lesson ID:", error);
          setQuiz([]);
        } finally {
          setLoading(false);
        }
      } else if (id) {
        try {
          const res = await fetch(`/api/quiz/${id}`, { cache: "no-store" });
          if (res.ok) {
            const data = await res.json();
            setQuiz(Array.isArray(data) ? data : []);
          } else {
            console.warn("Failed to fetch quiz by ID:", res.status);
            setQuiz([]);
          }
        } catch (error) {
          console.error("Error fetching quiz by ID:", error);
          setQuiz([]);
        } finally {
          setLoading(false);
        }
      } else {
        const parsed = parseQuizParam(raw);
        setQuiz(parsed);
        setLoading(false);
      }
    }
    load();
  }, [search]);

  /* ---------- state ---------- */
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  
  // Timer effect
  useEffect(() => {
    if (!submitted) {
      const timer = setInterval(() => {
        setTimeElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [submitted]);

  const score = useMemo(
    () => quiz.reduce((acc, q, i) => (answers[i] === q.answer ? acc + 1 : acc), 0),
    [answers, quiz]
  );

  /* ---------- empty guard ---------- */
  if (loading)
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-4 font-sans antialiased relative overflow-hidden">
        <AnimatedBackground />
        <div className="relative z-10 text-center space-y-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-gray-700 border-t-gray-400 rounded-full mx-auto"
          />
          <p className="text-white/60">Preparing your quiz...</p>
        </div>
      </div>
    );

if (!quiz.length)
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center relative overflow-hidden px-4 font-sans antialiased">
      <AnimatedBackground />
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 text-center space-y-6 max-w-md w-full"
      >
        <div className="p-6 bg-white/[0.02] backdrop-blur-xl rounded-3xl border border-white/[0.1]">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">No Quiz Available</h2>
          <p className="text-white/60 mb-6">This lesson doesn't include quiz questions or there was an issue loading them.</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-gray-600 to-gray-800 text-white font-bold hover:from-gray-700 hover:to-gray-900 transition-all duration-300 shadow-xl shadow-gray-500/25 hover:shadow-gray-600/35 hover:-translate-y-1 flex items-center gap-2 mx-auto min-h-12"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Lesson
          </button>
        </div>
      </motion.div>
    </div>
  );

  /* ---------- handlers ---------- */
  const choose = (opt: string) => {
    if (submitted) return;
    setSelectedOption(opt);
    setAnswers((a) => ({ ...a, [idx]: opt }));
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  /* ---------- components ---------- */
  const ProgressBar = () => (
    <div className="w-full h-2 bg-gray-800/30 rounded-full overflow-hidden border border-gray-700">
      <motion.div
        className="h-full bg-gradient-to-r from-green-500 to-blue-500"
        initial={{ width: 0 }}
        animate={{ width: `${percentage(idx + 1, quiz.length)}%` }}
        transition={{ type: "spring", stiffness: 120 }}
      />
    </div>
  );

  const ScoreCircle = ({ value, total }: { value: number; total: number }) => {
    const pct = percentage(value, total);
    const stroke = 2 * Math.PI * 50; // r=50
    const offset = stroke - (stroke * pct) / 100;
    
    const getColor = (percent: number) => {
      if (percent >= 90) return { from: "#10b981", to: "#34d399" }; // green
      if (percent >= 70) return { from: "#f59e0b", to: "#fbbf24" }; // yellow
      return { from: "#ef4444", to: "#f87171" }; // red
    };
    
    const colors = getColor(pct);
    
    return (
      <div className="relative w-48 h-48 mx-auto">
        <svg className="w-full h-full -rotate-90">
          <circle
            cx="50%"
            cy="50%"
            r="50"
            stroke="rgba(55,65,81,.2)" // gray-700/20
            strokeWidth="12"
            fill="transparent"
          />
          <motion.circle
            cx="50%"
            cy="50%"
            r="50"
            stroke={`url(#scoreGrad${pct})`}
            strokeWidth="12"
            fill="transparent"
            strokeDasharray={stroke}
            initial={{ strokeDashoffset: stroke }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
          <defs>
            <linearGradient id={`scoreGrad${pct}`}>
              <stop offset="0%" stopColor={colors.from} />
              <stop offset="100%" stopColor={colors.to} />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-4xl font-bold text-white">{pct}%</div>
          <div className="text-sm text-gray-400 mt-1">Accuracy</div>
        </div>
      </div>
    );
  };

  /* ---------- finished screen ---------- */
  if (submitted)
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-4 font-sans antialiased relative overflow-hidden">
        <AnimatedBackground />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-4xl text-center space-y-8 relative z-10"
        >
          <motion.div
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            className="flex items-center justify-center gap-4 mb-4"
          >
            <Trophy className="w-8 h-8 text-gray-400" />
            <h1 className="text-3xl font-bold text-white">
              Quiz Complete! 🎉
            </h1>
            <Trophy className="w-8 h-8 text-gray-400 transform scale-x-[-1]" />
          </motion.div>
        
          <ScoreCircle value={score} total={quiz.length} />
        
          <div className="flex flex-wrap justify-center gap-4 text-sm text-white/70 mb-6">
            <div className="flex items-center gap-2 bg-white/[0.02] px-4 py-2 rounded-xl border border-white/[0.1]">
              <Clock className="w-4 h-4 text-gray-400" />
              Time: {formatTime(timeElapsed)}
            </div>
            <div className="flex items-center gap-2 bg-white/[0.02] px-4 py-2 rounded-xl border border-white/[0.1]">
              <BookOpen className="w-4 h-4 text-gray-400" />
              {quiz.length} Questions
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-2xl font-bold mb-2 text-white">
              {score === quiz.length
                ? "🌟 Perfect Score!"
                : score >= Math.ceil(quiz.length * 0.8)
                ? "🎉 Excellent Work!"
                : score >= Math.ceil(quiz.length * 0.6)
                ? "👍 Good Job!"
                : "📚 Keep Practicing!"}
            </h2>
            <p className="text-white/60">
              You answered {score} out of {quiz.length} questions correctly.
            </p>
          </motion.div>

          {/* detailed review */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="space-y-6 text-left max-h-[50vh] overflow-y-auto p-2"
          >
            {quiz.map((q, i) => {
              const user = answers[i];
              const correct = q.answer;
              const wrong = user !== correct;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * i }}
                  className={cn(
                    "p-5 rounded-2xl border backdrop-blur-sm",
                    wrong 
                      ? "border-red-500/20 bg-red-900/10 shadow-lg shadow-red-500/5" 
                      : "border-green-500/20 bg-green-900/10 shadow-lg shadow-green-500/5"
                  )}
                >
                  <div className="flex items-start justify-between mb-3">
                    <p className={cn("font-medium flex-1 pr-4 text-white", wrong && "text-red-300")}>
                      <span className="text-gray-400 mr-2">{i + 1}.</span>
                      {q.q}
                    </p>
                    <div className="flex-shrink-0">
                      {wrong ? (
                        <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                          <X className="w-5 h-5 text-red-400" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                          <Check className="w-5 h-5 text-green-400" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* options */}
                  <div className="space-y-2">
                    {q.options.map((opt, optIdx) => (
                      <motion.div
                        key={optIdx}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 * optIdx }}
                        className={cn(
                          "px-4 py-3 rounded-xl border text-sm flex items-center justify-between transition-all text-gray-200",
                          opt === correct
                            ? "border-green-500/40 bg-green-900/20 shadow-inner"
                            : opt === user
                            ? "border-red-500/40 bg-red-900/20 shadow-inner"
                            : "border-gray-700 bg-gray-800/20 hover:border-gray-500"
                        )}
                      >
                        <span>{opt}</span>
                        <div className="flex items-center gap-2">
                          {opt === correct && (
                            <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                              <Check className="w-4 h-4 text-green-400" />
                            </div>
                          )}
                          {opt === user && opt !== correct && (
                            <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center">
                              <X className="w-4 h-4 text-red-400" />
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* explanation (only if wrong and we have it) */}
                  <AnimatePresence>
                    {wrong && q.explanation && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 p-3 bg-blue-900/20 rounded-xl border border-blue-500/20"
                      >
                        <div className="flex items-start gap-2">
                          <Sparkles className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm text-blue-200 font-medium mb-1">Explanation:</p>
                            <p className="text-gray-300 text-sm">{q.explanation}</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex flex-wrap items-center justify-center gap-3"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setAnswers({});
                setIdx(0);
                setSubmitted(false);
                startTimeRef.current = Date.now();
                setTimeElapsed(0);
              }}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-gray-600/20 to-gray-800/20 border-2 border-gray-600/30 text-white font-bold hover:from-gray-700/30 hover:to-gray-900/30 transition-all duration-300 shadow-xl shadow-gray-500/15 hover:shadow-gray-600/25 hover:-translate-y-1 flex items-center gap-2 min-h-12"
            >
              <RotateCcw className="w-4 h-4" /> Try Again
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push("/homepage")}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-gray-600 to-gray-800 text-white font-bold hover:from-gray-700 hover:to-gray-900 transition-all duration-300 shadow-xl shadow-gray-500/25 hover:shadow-gray-600/35 hover:-translate-y-1 flex items-center gap-2 min-h-12"
            >
              <Sparkles className="w-4 h-4" /> More Questions
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.back()}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-gray-600/20 to-gray-800/20 border-2 border-gray-600/30 text-white font-bold hover:from-gray-700/30 hover:to-gray-900/30 transition-all duration-300 shadow-xl shadow-gray-500/15 hover:shadow-gray-600/25 hover:-translate-y-1 flex items-center gap-2 min-h-12"
            >
              <BookOpen className="w-4 h-4" /> Back to Lesson
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    );

  /* ---------- question screen ---------- */
  const current = quiz[idx];
  const isFirst = idx === 0;
  const isLast = idx === quiz.length - 1;

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden font-sans antialiased">
      <AnimatedBackground />
      <div className="max-w-3xl mx-auto px-4 py-8 relative z-10">
        {/* top bar with enhanced styling */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm bg-white/[0.02] hover:bg-white/[0.04] px-4 py-2 rounded-xl border border-white/[0.1] backdrop-blur-sm transition-all text-white"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Lesson
          </motion.button>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm bg-white/[0.02] px-3 py-1.5 rounded-lg border border-white/[0.1] text-white/70">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="font-mono">{formatTime(timeElapsed)}</span>
            </div>
            <span className="text-sm text-white/60 bg-white/[0.02] px-3 py-1.5 rounded-lg border border-white/[0.1]">
              {idx + 1} / {quiz.length}
            </span>
          </div>
        </motion.div>

        <ProgressBar />

        {/* question card with enhanced styling */}
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-8 mb-8 p-6 bg-white/[0.02] backdrop-blur-xl rounded-3xl border border-white/[0.1] shadow-xl shadow-white/[0.05]"
        >
          <div className="flex items-start gap-3 mb-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-gray-600 to-gray-800 flex items-center justify-center">
              <span className="text-white text-sm font-bold">{idx + 1}</span>
            </div>
            <motion.h2 
              className="text-xl font-bold flex-1 text-white"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {current.q}
            </motion.h2>
          </div>
        </motion.div>

        {/* options with enhanced styling */}
        <div className="space-y-3 mb-8">
          {current.options.map((opt, optIdx) => {
            const chosen = answers[idx] === opt;
            return (
              <motion.button
                key={optIdx}
                onClick={() => choose(opt)}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * (optIdx + 1) }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "w-full text-left px-5 py-4 rounded-2xl border transition-all duration-300 flex items-center gap-3 text-white",
                  chosen
                    ? "border-gray-500 bg-gradient-to-r from-gray-600/20 to-gray-800/20 shadow-lg shadow-gray-500/20"
                    : "border-white/[0.1] hover:border-white/[0.2] hover:bg-white/[0.03] backdrop-blur-sm"
                )}
              >
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all",
                  chosen 
                    ? "bg-gray-500 text-white" 
                    : "bg-white/[0.05] border border-white/[0.1] text-white/70"
                )}>
                  {String.fromCharCode(65 + optIdx)}
                </div>
                <span className="text-left flex-1 text-white">{opt}</span>
                {chosen && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-5 h-5 rounded-full bg-gray-500 flex items-center justify-center"
                  >
                    <Check className="w-3 h-3 text-white" />
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* enhanced navigation buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex items-center justify-between"
        >
          <div>
            {!isFirst && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIdx((i) => i - 1)}
                className="px-5 py-3 rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.1] backdrop-blur-sm flex items-center gap-2 transition-all text-white min-h-12"
              >
                <ArrowLeft className="w-4 h-4" /> Previous
              </motion.button>
            )}
          </div>

          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push("/homepage")}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-gray-600/20 to-gray-800/20 border-2 border-gray-600/30 text-white font-bold hover:from-gray-700/30 hover:to-gray-900/30 transition-all duration-300 shadow-xl shadow-gray-500/15 hover:shadow-gray-600/25 hover:-translate-y-1 flex items-center gap-2 min-h-12"
            >
              <Sparkles className="w-4 h-4" /> More Questions
            </motion.button>
            <div>
              {isLast ? (
                <motion.button
                  whileHover={{ scale: answers[idx] ? 1.05 : 1 }}
                  whileTap={{ scale: answers[idx] ? 0.95 : 1 }}
                  onClick={() => setSubmitted(true)}
                  disabled={!answers[idx]}
                  className={cn(
                    "px-6 py-3 rounded-2xl text-base font-bold flex items-center gap-2 transition-all min-h-12",
                    answers[idx]
                      ? "bg-gradient-to-r from-gray-600 to-gray-800 text-white hover:from-gray-700 hover:to-gray-900 shadow-xl shadow-gray-500/25 hover:shadow-gray-600/35 hover:-translate-y-1"
                      : "bg-white/[0.02] text-white/50 cursor-not-allowed border border-white/[0.1]"
                  )}
                >
                  <Trophy className="w-4 h-4" /> Submit Quiz
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: answers[idx] ? 1.05 : 1 }}
                  whileTap={{ scale: answers[idx] ? 0.95 : 1 }}
                  onClick={() => setIdx((i) => i + 1)}
                  disabled={!answers[idx]}
                  className={cn(
                    "px-6 py-3 rounded-2xl text-base font-bold flex items-center gap-2 transition-all min-h-12",
                    answers[idx]
                      ? "bg-gradient-to-r from-gray-600 to-gray-800 text-white hover:from-gray-700 hover:to-gray-900 shadow-xl shadow-gray-500/25 hover:shadow-gray-600/35 hover:-translate-y-1"
                      : "bg-white/[0.02] text-white/50 cursor-not-allowed border border-white/[0.1]"
                  )}
                >
                  Next <ArrowLeft className="w-4 h-4 transform rotate-180" />
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function QuizPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white flex items-center justify-center relative overflow-hidden font-sans antialiased">
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[128px] animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-[128px] animate-pulse delay-700" />
        </div>
        <div className="relative z-10 text-center space-y-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-gray-700 border-t-gray-400 rounded-full mx-auto"
          />
          <p className="text-white/60">Loading your quiz...</p>
        </div>
      </div>
    }>
      <QuizContent />
    </Suspense>
  );
}