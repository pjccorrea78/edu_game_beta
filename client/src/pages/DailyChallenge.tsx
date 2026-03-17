import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { useGame } from "@/contexts/GameContext";

const disciplineColors: Record<string, string> = {
  matematica: "#FF6B6B",
  portugues: "#4ECDC4",
  geografia: "#45B7D1",
  historia: "#F7DC6F",
  ciencias: "#A8E6CF",
  educacao_fisica: "#FF8C42",
  arte: "#FF1493",
  ensino_religioso: "#87CEEB",
};

const disciplineNames: Record<string, string> = {
  matematica: "Matemática",
  portugues: "Português",
  geografia: "Geografia",
  historia: "História",
  ciencias: "Ciências",
  educacao_fisica: "Educação Física",
  arte: "Arte",
  ensino_religioso: "Ensino Religioso",
};

function getTimeUntilMidnight() {
  const now = new Date();
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);
  const diff = midnight.getTime() - now.getTime();
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function DailyChallenge({ onBack }: { onBack: () => void }) {
  const { sessionId } = useGame();
  const [countdown, setCountdown] = useState(getTimeUntilMidnight());
  const [selected, setSelected] = useState<"A" | "B" | "C" | "D" | null>(null);
  const [result, setResult] = useState<{
    isCorrect: boolean;
    pointsEarned: number;
    correctOption: string;
    explanation: string | null;
    newStreak: number;
  } | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const { data, isLoading } = trpc.daily.getToday.useQuery({ sessionId });
  const submitMutation = trpc.daily.submit.useMutation({
    onSuccess: (res) => {
      setResult(res);
      if (res.isCorrect) setShowConfetti(true);
    },
  });

  useEffect(() => {
    const timer = setInterval(() => setCountdown(getTimeUntilMidnight()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleAnswer = (option: "A" | "B" | "C" | "D") => {
    if (result || data?.alreadyAttempted) return;
    setSelected(option);
    submitMutation.mutate({
      sessionId,
      challengeId: data!.challenge!.id,
      selectedOption: option,
    });
  };

  const challenge = data?.challenge;
  const color = challenge ? (disciplineColors[challenge.discipline] ?? "#7C3AED") : "#7C3AED";

  const options: Array<{ key: "A" | "B" | "C" | "D"; text: string }> = challenge
    ? [
        { key: "A", text: challenge.optionA },
        { key: "B", text: challenge.optionB },
        { key: "C", text: challenge.optionC },
        { key: "D", text: challenge.optionD },
      ]
    : [];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)" }}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 pt-6">
        <motion.button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white text-xl"
          whileTap={{ scale: 0.9 }}
        >
          ←
        </motion.button>
        <div className="text-center">
          <h1 className="text-white font-bold text-xl" style={{ fontFamily: "'Fredoka One', cursive" }}>
            ⚡ Desafio do Dia
          </h1>
          <p className="text-white/60 text-xs">Pontos em dobro!</p>
        </div>
        <div className="text-right">
          <div className="text-white/60 text-xs">Próximo em</div>
          <div className="text-yellow-400 font-mono text-sm font-bold">{countdown}</div>
        </div>
      </div>

      {/* Streak banner */}
      {data && data.streak > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 mb-2 rounded-2xl px-4 py-2 flex items-center justify-center gap-2"
          style={{ background: "linear-gradient(90deg, #f97316, #ef4444)" }}
        >
          <span className="text-2xl">🔥</span>
          <span className="text-white font-bold text-sm">
            {data.streak} dia{data.streak !== 1 ? "s" : ""} consecutivo{data.streak !== 1 ? "s" : ""}! Bônus de streak ativo!
          </span>
        </motion.div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-8">
        {isLoading ? (
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full mx-auto mb-4"
            />
            <p className="text-white/70">Gerando desafio do dia com IA...</p>
          </div>
        ) : !challenge ? (
          <div className="text-center text-white/60">
            <p className="text-4xl mb-3">😕</p>
            <p>Não foi possível carregar o desafio de hoje.</p>
          </div>
        ) : (
          <div className="w-full max-w-md">
            {/* Discipline badge */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center justify-center gap-2 mb-4"
            >
              <div
                className="px-4 py-1.5 rounded-full text-sm font-bold"
                style={{ background: color, color: "#fff" }}
              >
                {disciplineNames[challenge.discipline] ?? challenge.discipline}
              </div>
              <div className="px-3 py-1.5 rounded-full text-xs font-bold bg-yellow-400 text-yellow-900">
                ×{challenge.bonusMultiplier} pontos
              </div>
            </motion.div>

            {/* Question card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl p-6 mb-5 shadow-2xl"
              style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.15)" }}
            >
              <p className="text-white text-lg font-semibold text-center leading-relaxed" style={{ fontFamily: "'Nunito', sans-serif" }}>
                {challenge.questionText}
              </p>
            </motion.div>

            {/* Already attempted */}
            {data.alreadyAttempted && !result && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-2xl p-4 text-center mb-4"
                style={{ background: "rgba(255,255,255,0.08)" }}
              >
                <p className="text-white/70 text-sm">✅ Você já respondeu o desafio de hoje!</p>
                <p className="text-yellow-400 text-xs mt-1">Volte amanhã para um novo desafio.</p>
              </motion.div>
            )}

            {/* Options */}
            <div className="grid grid-cols-1 gap-3">
              {options.map(({ key, text }) => {
                const isSelected = selected === key;
                const isCorrect = result?.correctOption === key;
                const isWrong = result && isSelected && !result.isCorrect;

                let bg = "rgba(255,255,255,0.08)";
                let border = "1px solid rgba(255,255,255,0.15)";
                let textColor = "white";

                if (result) {
                  if (isCorrect) { bg = "rgba(34,197,94,0.3)"; border = "2px solid #22c55e"; }
                  else if (isWrong) { bg = "rgba(239,68,68,0.3)"; border = "2px solid #ef4444"; }
                } else if (isSelected) {
                  bg = `${color}40`;
                  border = `2px solid ${color}`;
                }

                return (
                  <motion.button
                    key={key}
                    onClick={() => handleAnswer(key)}
                    disabled={!!result || !!data.alreadyAttempted || submitMutation.isPending}
                    className="w-full rounded-2xl p-4 text-left flex items-center gap-3 transition-all"
                    style={{ background: bg, border, color: textColor }}
                    whileHover={!result && !data.alreadyAttempted ? { scale: 1.02 } : {}}
                    whileTap={!result && !data.alreadyAttempted ? { scale: 0.98 } : {}}
                  >
                    <span
                      className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                      style={{ background: isCorrect ? "#22c55e" : isWrong ? "#ef4444" : color }}
                    >
                      {key}
                    </span>
                    <span className="text-sm font-medium" style={{ fontFamily: "'Nunito', sans-serif" }}>{text}</span>
                    {isCorrect && <span className="ml-auto text-green-400 text-lg">✓</span>}
                    {isWrong && <span className="ml-auto text-red-400 text-lg">✗</span>}
                  </motion.button>
                );
              })}
            </div>

            {/* Result feedback */}
            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="mt-5 rounded-3xl p-5 text-center"
                  style={{
                    background: result.isCorrect
                      ? "linear-gradient(135deg, rgba(34,197,94,0.3), rgba(16,185,129,0.2))"
                      : "linear-gradient(135deg, rgba(239,68,68,0.3), rgba(220,38,38,0.2))",
                    border: `2px solid ${result.isCorrect ? "#22c55e" : "#ef4444"}`,
                  }}
                >
                  <div className="text-4xl mb-2">{result.isCorrect ? "🎉" : "😢"}</div>
                  <p className="text-white font-bold text-lg mb-1">
                    {result.isCorrect ? "Correto!" : "Incorreto!"}
                  </p>
                  {result.isCorrect && (
                    <p className="text-yellow-400 font-bold text-xl mb-2">
                      +{result.pointsEarned} pontos ⚡
                    </p>
                  )}
                  {result.isCorrect && result.newStreak > 1 && (
                    <p className="text-orange-400 text-sm mb-2">
                      🔥 Streak de {result.newStreak} dias!
                    </p>
                  )}
                  {result.explanation && (
                    <p className="text-white/70 text-sm mt-2 leading-relaxed">
                      💡 {result.explanation}
                    </p>
                  )}
                  <motion.button
                    onClick={onBack}
                    className="mt-4 px-6 py-2.5 rounded-2xl font-bold text-white text-sm"
                    style={{ background: result.isCorrect ? "#22c55e" : "#7C3AED" }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Voltar ao Mapa
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Confetti */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {Array.from({ length: 30 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-3 h-3 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: "-10px",
                background: ["#FF6B6B","#4ECDC4","#F7DC6F","#A8E6CF","#7C3AED"][i % 5],
              }}
              animate={{ y: "110vh", rotate: Math.random() * 720, x: (Math.random() - 0.5) * 200 }}
              transition={{ duration: 2 + Math.random() * 2, delay: Math.random() * 0.5 }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
