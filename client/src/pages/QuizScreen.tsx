import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { useGame } from "@/contexts/GameContext";
import BlockyAvatar from "@/components/BlockyAvatar";
import { ArrowLeft, Zap, CheckCircle, XCircle, Trophy, Star, RefreshCw, BookOpen } from "lucide-react";

type Discipline = "matematica" | "portugues" | "geografia" | "historia" | "ciencias";

type Question = {
  id: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: string;
  explanation?: string | null;
  discipline?: string;
  difficulty?: string;
};

type Props = {
  discipline: Discipline | null;
  customMaterialId?: number;
  customTitle?: string;
  onBack: () => void;
  onFinish: (result?: QuizResult) => void;
};

type QuizResult = {
  discipline: Discipline;
  score: number;
  correctAnswers: number;
  wrongAnswers: number;
  pointsEarned: number;
  newTotal: number;
};

const DISCIPLINE_INFO: Record<Discipline, { name: string; emoji: string; color: string; bg: string }> = {
  matematica: { name: "Matemática", emoji: "🔢", color: "#FF6B6B", bg: "from-red-400 to-orange-400" },
  portugues: { name: "Português", emoji: "📖", color: "#4ECDC4", bg: "from-teal-400 to-cyan-400" },
  geografia: { name: "Geografia", emoji: "🌍", color: "#45B7D1", bg: "from-blue-400 to-indigo-400" },
  historia: { name: "História", emoji: "🏛️", color: "#F7DC6F", bg: "from-yellow-400 to-amber-400" },
  ciencias: { name: "Ciências", emoji: "🔬", color: "#A8E6CF", bg: "from-green-400 to-emerald-400" },
};

const OPTIONS = ["A", "B", "C", "D"] as const;
const OPTION_LABELS: Record<string, string> = { A: "optionA", B: "optionB", C: "optionC", D: "optionD" };

function ConfettiPiece({ x, color }: { x: number; color: string }) {
  return (
    <motion.div
      className="absolute w-3 h-3 rounded-sm"
      style={{ left: `${x}%`, top: 0, background: color }}
      initial={{ y: -20, rotate: 0, opacity: 1 }}
      animate={{ y: "100vh", rotate: 720, opacity: 0 }}
      transition={{ duration: 2 + Math.random() * 1.5, ease: "easeIn", delay: Math.random() * 0.5 }}
    />
  );
}

function Confetti() {
  const pieces = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: ["#FF6B6B", "#4ECDC4", "#45B7D1", "#F7DC6F", "#A8E6CF", "#FF8E53", "#A29BFE"][
      Math.floor(Math.random() * 7)
    ],
  }));
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map((p) => (
        <ConfettiPiece key={p.id} x={p.x} color={p.color} />
      ))}
    </div>
  );
}

export default function QuizScreen({ discipline, customMaterialId, customTitle, onBack, onFinish }: Props) {
  const { sessionId, player, refreshPlayer } = useGame();
  const isCustomQuiz = !!customMaterialId;
  const info = discipline ? DISCIPLINE_INFO[discipline] : {
    name: customTitle ?? "Quiz Personalizado",
    emoji: "📚",
    color: "#7C3AED",
    bg: "from-violet-500 to-indigo-500",
  };

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [quizSessionId, setQuizSessionId] = useState<number | null>(null);
  const [phase, setPhase] = useState<"loading" | "quiz" | "result">("loading");
  const [pointsDelta, setPointsDelta] = useState<number | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [finalResult, setFinalResult] = useState<QuizResult | null>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [timerActive, setTimerActive] = useState(false);

  const getQuestionsQuery = trpc.quiz.getQuestions.useQuery(
    { sessionId, discipline: discipline! },
    { enabled: false }
  );
  const getCustomQuestionsQuery = trpc.studyMaterial.getQuestions.useQuery(
    { sessionId, materialId: customMaterialId! },
    { enabled: false }
  );
  const startSession = trpc.quiz.startSession.useMutation();
  const submitAnswer = trpc.quiz.submitAnswer.useMutation();
  const finishSession = trpc.quiz.finishSession.useMutation();

  // Load questions and start session
  useEffect(() => {
    async function init() {
      try {
        if (isCustomQuiz && customMaterialId) {
          // Load custom quiz questions from study material
          const result = await getCustomQuestionsQuery.refetch();
          if (result.data?.questions && result.data.questions.length > 0) {
            const qs = result.data.questions.map((q) => ({
              id: q.id,
              questionText: q.questionText,
              optionA: q.optionA,
              optionB: q.optionB,
              optionC: q.optionC,
              optionD: q.optionD,
              correctOption: q.correctOption,
              explanation: q.explanation,
            }));
            setQuestions(qs.slice(0, 10));
            setPhase("quiz");
            setTimerActive(true);
          }
        } else if (discipline) {
          const result = await getQuestionsQuery.refetch();
          if (result.data?.questions && result.data.questions.length > 0) {
            setQuestions(result.data.questions.slice(0, 10));
            const session = await startSession.mutateAsync({ sessionId, discipline });
            setQuizSessionId(session.sessionId);
            setPhase("quiz");
            setTimerActive(true);
          }
        }
      } catch (e) {
        console.error("Failed to load quiz", e);
      }
    }
    init();
  }, []);

  // Timer
  useEffect(() => {
    if (!timerActive || answered || phase !== "quiz") return;
    if (timeLeft <= 0) {
      handleAnswer(null); // Time's up = wrong
      return;
    }
    const t = setTimeout(() => setTimeLeft((p) => p - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, timerActive, answered, phase]);

  const handleAnswer = useCallback(
    async (option: string | null) => {
      if (answered || phase !== "quiz") return;
      setTimerActive(false);
      setSelectedOption(option);
      setAnswered(true);

      const currentQ = questions[currentIndex];
      const isCorrect = option === currentQ.correctOption;
      const delta = isCorrect ? 10 : -5;
      const newScore = score + delta;
      const newCorrect = correctCount + (isCorrect ? 1 : 0);
      const newWrong = wrongCount + (isCorrect ? 0 : 1);

      setScore(newScore);
      if (isCorrect) setCorrectCount(newCorrect);
      else setWrongCount(newWrong);
      setPointsDelta(delta);

      // Only track session for discipline quizzes (not custom)
      if (quizSessionId && !isCustomQuiz) {
        await submitAnswer.mutateAsync({
          sessionId,
          quizSessionId,
          isCorrect,
          currentCorrect: newCorrect,
          currentWrong: newWrong,
          currentScore: newScore,
        });
      }

      // Auto advance after 2s
      setTimeout(() => {
        if (currentIndex + 1 >= questions.length) {
          handleFinish(newScore, newCorrect, newWrong);
        } else {
          setCurrentIndex((p) => p + 1);
          setSelectedOption(null);
          setAnswered(false);
          setPointsDelta(null);
          setTimeLeft(30);
          setTimerActive(true);
        }
      }, 2000);
    },
    [answered, phase, questions, currentIndex, score, correctCount, wrongCount, quizSessionId]
  );

  const handleFinish = async (finalScore: number, correct: number, wrong: number) => {
    setTimerActive(false);
    // For custom quizzes, just show result without saving to DB session
    if (isCustomQuiz) {
      const quizResult: QuizResult = {
        discipline: "matematica" as Discipline, // placeholder
        score: finalScore,
        correctAnswers: correct,
        wrongAnswers: wrong,
        pointsEarned: Math.max(0, finalScore),
        newTotal: (player?.totalPoints ?? 0) + Math.max(0, finalScore),
      };
      setFinalResult(quizResult);
      setPhase("result");
      if (correct >= 8) setShowConfetti(true);
      refreshPlayer();
      return;
    }
    if (!quizSessionId) return;
    try {
      const result = await finishSession.mutateAsync({
        sessionId,
        quizSessionId,
        discipline: discipline!,
        finalScore,
        correctAnswers: correct,
        wrongAnswers: wrong,
      });
      const quizResult: QuizResult = {
        discipline: discipline!,
        score: finalScore,
        correctAnswers: correct,
        wrongAnswers: wrong,
        pointsEarned: result.pointsEarned,
        newTotal: result.newTotal,
      };
      setFinalResult(quizResult);
      setPhase("result");
      if (correct >= 8) setShowConfetti(true);
      refreshPlayer();
    } catch (e) {
      console.error("Failed to finish quiz", e);
    }
  };

  const currentQ = questions[currentIndex];
  const progress = questions.length > 0 ? ((currentIndex + (answered ? 1 : 0)) / questions.length) * 100 : 0;
  const timerPercent = (timeLeft / 30) * 100;

  if (phase === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${info.color}33, #fff)` }}>
        <motion.div
          className="text-center"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <div className="text-6xl mb-4">{isCustomQuiz ? "📚" : info.emoji}</div>
          <p className="text-xl font-bold text-gray-700">Carregando {isCustomQuiz ? "Quiz Personalizado" : info.name}...</p>
          <div className="mt-4 flex justify-center gap-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-3 h-3 rounded-full"
                style={{ background: info.color }}
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  if (phase === "result" && finalResult) {
    const percentage = Math.round((finalResult.correctAnswers / 10) * 100);
    const grade = percentage >= 80 ? "Excelente!" : percentage >= 60 ? "Muito bom!" : percentage >= 40 ? "Continue praticando!" : "Não desista!";
    const gradeEmoji = percentage >= 80 ? "🏆" : percentage >= 60 ? "⭐" : percentage >= 40 ? "💪" : "📚";

    return (
      <>
        {showConfetti && <Confetti />}
        <div
          className="min-h-screen flex flex-col items-center justify-center p-4"
          style={{ background: `linear-gradient(135deg, ${info.color}22, #f8f9ff)` }}
        >
          <motion.div
            className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            {/* Header */}
            <div className={`bg-gradient-to-r ${info.bg} p-6 text-center text-white`}>
              <motion.div
                className="text-6xl mb-2"
                animate={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                {gradeEmoji}
              </motion.div>
              <h2 className="text-2xl font-black">{grade}</h2>
              <p className="text-white/80 text-sm mt-1">{info.name} concluído!</p>
            </div>

            {/* Stats */}
            <div className="p-6">
              {/* Score circle */}
              <div className="flex justify-center mb-6">
                <div className="relative w-32 h-32">
                  <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="#f0f0f0" strokeWidth="10" />
                    <motion.circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke={info.color}
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 50}`}
                      initial={{ strokeDashoffset: 2 * Math.PI * 50 }}
                      animate={{ strokeDashoffset: 2 * Math.PI * 50 * (1 - percentage / 100) }}
                      transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-black text-gray-800">{percentage}%</span>
                    <span className="text-xs text-gray-500">acertos</span>
                  </div>
                </div>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { label: "Acertos", value: finalResult.correctAnswers, icon: <CheckCircle className="w-5 h-5" />, color: "#4ECDC4" },
                  { label: "Erros", value: finalResult.wrongAnswers, icon: <XCircle className="w-5 h-5" />, color: "#FF6B6B" },
                  { label: "Pontos", value: `+${finalResult.pointsEarned}`, icon: <Zap className="w-5 h-5" />, color: "#F7DC6F" },
                ].map((stat, i) => (
                  <motion.div
                    key={i}
                    className="text-center p-3 rounded-2xl"
                    style={{ background: `${stat.color}20` }}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.8 + i * 0.1 }}
                  >
                    <div style={{ color: stat.color }} className="flex justify-center mb-1">{stat.icon}</div>
                    <p className="text-xl font-black text-gray-800">{stat.value}</p>
                    <p className="text-xs text-gray-500">{stat.label}</p>
                  </motion.div>
                ))}
              </div>

              {/* Total points */}
              <motion.div
                className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-4 text-center mb-6 border border-yellow-200"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.1 }}
              >
                <p className="text-sm text-gray-600">Total de pontos acumulados</p>
                <p className="text-3xl font-black text-orange-500">{finalResult.newTotal} pts</p>
              </motion.div>

              {/* Buttons */}
              <div className="flex gap-3">
                <motion.button
                  className="flex-1 py-3 rounded-2xl font-bold text-white flex items-center justify-center gap-2"
                  style={{ background: `linear-gradient(135deg, ${info.color}, ${info.color}cc)` }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onFinish(finalResult)}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar ao Mapa
                </motion.button>
                <motion.button
                  className="flex-1 py-3 rounded-2xl font-bold bg-gray-100 text-gray-700 flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setPhase("loading");
                    setCurrentIndex(0);
                    setScore(0);
                    setCorrectCount(0);
                    setWrongCount(0);
                    setSelectedOption(null);
                    setAnswered(false);
                    setShowConfetti(false);
                    setFinalResult(null);
                    // Reload
                    window.location.reload();
                  }}
                >
                  <RefreshCw className="w-4 h-4" />
                  Jogar Novamente
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </>
    );
  }

  if (!currentQ) return null;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: `linear-gradient(180deg, ${info.color}33 0%, #f8f9ff 40%)` }}
    >
      {/* Header */}
      <div className="p-4 flex items-center gap-3">
        <motion.button
          className="w-10 h-10 rounded-xl bg-white shadow flex items-center justify-center"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onBack}
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </motion.button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xl">{info.emoji}</span>
            <span className="font-black text-gray-800">{info.name}</span>
          </div>
          {/* Progress bar */}
          <div className="mt-1 h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${info.color}, ${info.color}aa)` }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
        <div className="flex items-center gap-1 bg-white rounded-xl px-3 py-1.5 shadow">
          <Zap className="w-4 h-4 text-yellow-500" />
          <span className="font-black text-gray-800">{score}</span>
        </div>
      </div>

      {/* Question counter */}
      <div className="px-4 mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-500">
          Pergunta {currentIndex + 1} de {questions.length}
        </span>
        {/* Timer */}
        <div className="flex items-center gap-2">
          <div className="relative w-8 h-8">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <circle cx="18" cy="18" r="15" fill="none" stroke="#f0f0f0" strokeWidth="3" />
              <motion.circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                stroke={timeLeft <= 10 ? "#FF6B6B" : info.color}
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 15}`}
                animate={{ strokeDashoffset: 2 * Math.PI * 15 * (1 - timerPercent / 100) }}
                transition={{ duration: 0.3 }}
              />
            </svg>
            <span
              className="absolute inset-0 flex items-center justify-center text-xs font-black"
              style={{ color: timeLeft <= 10 ? "#FF6B6B" : info.color }}
            >
              {timeLeft}
            </span>
          </div>
        </div>
      </div>

      {/* Question card */}
      <div className="flex-1 px-4 pb-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ x: 60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -60, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {/* Question */}
            <div className="bg-white rounded-3xl shadow-lg p-5 mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3"
                style={{ background: `${info.color}22` }}
              >
                {info.emoji}
              </div>
              <p className="text-lg font-bold text-gray-800 leading-relaxed">{currentQ.questionText}</p>
            </div>

            {/* Options */}
            <div className="grid grid-cols-1 gap-3">
              {OPTIONS.map((opt) => {
                const optKey = OPTION_LABELS[opt] as keyof Question;
                const optText = currentQ[optKey] as string;
                const isSelected = selectedOption === opt;
                const isCorrect = opt === currentQ.correctOption;
                const showResult = answered;

                let bgColor = "bg-white";
                let borderColor = "border-gray-200";
                let textColor = "text-gray-800";
                let icon = null;

                if (showResult) {
                  if (isCorrect) {
                    bgColor = "bg-green-50";
                    borderColor = "border-green-400";
                    textColor = "text-green-800";
                    icon = <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />;
                  } else if (isSelected && !isCorrect) {
                    bgColor = "bg-red-50";
                    borderColor = "border-red-400";
                    textColor = "text-red-800";
                    icon = <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />;
                  }
                } else if (isSelected) {
                  bgColor = "bg-blue-50";
                  borderColor = "border-blue-400";
                }

                return (
                  <motion.button
                    key={opt}
                    className={`w-full ${bgColor} border-2 ${borderColor} rounded-2xl p-4 flex items-center gap-3 text-left transition-all`}
                    whileHover={!answered ? { scale: 1.02, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" } : {}}
                    whileTap={!answered ? { scale: 0.98 } : {}}
                    onClick={() => !answered && handleAnswer(opt)}
                    disabled={answered}
                  >
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0"
                      style={{
                        background: showResult && isCorrect ? "#4ECDC4" : showResult && isSelected ? "#FF6B6B" : info.color,
                        color: "white",
                      }}
                    >
                      {opt}
                    </div>
                    <span className={`flex-1 font-semibold ${textColor}`}>{optText}</span>
                    {icon}
                  </motion.button>
                );
              })}
            </div>

            {/* Feedback */}
            <AnimatePresence>
              {answered && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 20, opacity: 0 }}
                  className={`mt-4 p-4 rounded-2xl ${selectedOption === currentQ.correctOption ? "bg-green-50 border-2 border-green-300" : "bg-red-50 border-2 border-red-300"}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {selectedOption === currentQ.correctOption ? (
                      <>
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="font-black text-green-700">Correto! +10 pontos 🎉</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5 text-red-500" />
                        <span className="font-black text-red-700">
                          {selectedOption ? "Errado! -5 pontos 😅" : "Tempo esgotado! -5 pontos ⏰"}
                        </span>
                      </>
                    )}
                  </div>
                  {currentQ.explanation && (
                    <p className="text-sm text-gray-600 mt-1">{currentQ.explanation}</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Points delta animation */}
      <AnimatePresence>
        {pointsDelta !== null && (
          <motion.div
            className="fixed top-1/3 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
            initial={{ y: 0, opacity: 1, scale: 1 }}
            animate={{ y: -80, opacity: 0, scale: 1.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
          >
            <span
              className="text-4xl font-black"
              style={{
                color: pointsDelta > 0 ? "#27AE60" : "#E74C3C",
                textShadow: "0 2px 8px rgba(0,0,0,0.3)",
              }}
            >
              {pointsDelta > 0 ? `+${pointsDelta}` : pointsDelta}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
