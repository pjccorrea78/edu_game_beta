import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useGame } from "@/contexts/GameContext";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import QuizScreen from "@/pages/QuizScreen";

interface StoryProgress {
  id: number;
  playerId: number;
  disciplineSequence: string[];
  currentDisciplineIndex: number;
  currentDifficulty: "easy" | "medium" | "hard";
  questionsAnswered: number;
  completedDisciplines: string[];
  totalScore: number;
  startedAt: Date;
  completedAt: Date | null;
}

interface Question {
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: "A" | "B" | "C" | "D";
  explanation: string;
  imageUrl: string;
}

interface StoryModeProps {
  onBack: () => void;
}

const DISCIPLINE_NAMES: Record<string, { name: string; emoji: string; color: string }> = {
  matematica: { name: "Matemática", emoji: "🔢", color: "from-red-400 to-red-600" },
  portugues: { name: "Português", emoji: "📚", color: "from-blue-400 to-blue-600" },
  geografia: { name: "Geografia", emoji: "🌍", color: "from-green-400 to-green-600" },
  historia: { name: "História", emoji: "⏰", color: "from-yellow-400 to-yellow-600" },
  ciencias: { name: "Ciências", emoji: "🔬", color: "from-purple-400 to-purple-600" },
  educacao_fisica: { name: "Educação Física", emoji: "⚽", color: "from-orange-400 to-orange-600" },
  arte: { name: "Arte", emoji: "🎨", color: "from-pink-400 to-pink-600" },
  ensino_religioso: { name: "Ensino Religioso", emoji: "✨", color: "from-indigo-400 to-indigo-600" },
};

export default function StoryMode({ onBack }: StoryModeProps) {
  const { sessionId = "" } = useGame();
  const [progress, setProgress] = useState<StoryProgress | null>(null);
  const [currentMission, setCurrentMission] = useState<{ questions: Question[]; discipline: string } | null>(null);
  const [isQuizActive, setIsQuizActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch progress
  const { data: progressData, refetch: refetchProgress } = trpc.missions.getProgress.useQuery(
    { sessionId },
    { enabled: !!sessionId }
  );

  // Generate next mission
  const generateMissionMutation = trpc.missions.generateNextMission.useMutation({
    onSuccess: (data) => {
      if (data.completed) {
        toast.success("🎉 Parabéns! Você completou o Modo História!", { duration: 5000 });
        setCurrentMission(null);
      } else {
        setCurrentMission({
          questions: data.questions || [],
          discipline: data.discipline || "matematica",
        });
        setIsQuizActive(true);
      }
      setIsLoading(false);
    },
    onError: (error) => {
      toast.error("Erro ao gerar missão: " + error.message);
      setIsLoading(false);
    },
  });

  // Submit mission answers
  const submitAnswersMutation = trpc.missions.submitMissionAnswers.useMutation({
    onSuccess: (data) => {
      toast.success(`🎉 Disciplina completada! +${data.score} pontos!`, { duration: 3000 });
      setIsQuizActive(false);
      setCurrentMission(null);
      refetchProgress();
    },
    onError: (error) => {
      toast.error("Erro ao enviar respostas: " + error.message);
    },
  });

  useEffect(() => {
    if (progressData) {
      setProgress(progressData);
    }
  }, [progressData]);

  const handleStartMission = async () => {
    setIsLoading(true);
    generateMissionMutation.mutate({ sessionId });
  };

  const handleQuizComplete = (score: number, answers: Array<{ questionIndex: number; selectedOption: string }>) => {
    submitAnswersMutation.mutate({
      sessionId,
      answers,
      score,
    });
  };

  if (!progress) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-900 via-purple-900 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-3 animate-bounce">📖</div>
          <p className="text-white/60 font-fredoka">Carregando Modo História...</p>
        </div>
      </div>
    );
  }

  // If quiz is active, show quiz screen
  if (isQuizActive && currentMission) {
    return (
      <QuizScreen
        discipline={currentMission.discipline as any}
        onFinish={(result) => {
          if (result) {
            handleQuizComplete(result.score, []);
          }
        }}
        onBack={() => {
          setIsQuizActive(false);
          setCurrentMission(null);
        }}
      />
    );
  }

  const isComplete = progress.currentDisciplineIndex >= progress.disciplineSequence.length;
  const completedCount = progress.completedDisciplines.length;
  const totalDisciplines = progress.disciplineSequence.length;
  const progressPercent = (completedCount / totalDisciplines) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-900 via-purple-900 to-slate-900 text-white">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgY3g9IjIwIiBjeT0iMjAiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIvPjwvZz48L3N2Zz4=')] opacity-30" />
        <div className="relative px-4 pt-6 pb-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-4"
          >
            <span className="text-xl">←</span>
            <span className="font-fredoka">Voltar ao Mapa</span>
          </button>
          <div className="text-center">
            <div className="text-5xl mb-2">📖</div>
            <h1 className="text-3xl font-fredoka font-bold text-yellow-300 drop-shadow-lg">
              Modo História
            </h1>
            <p className="text-white/70 text-sm mt-1">
              {isComplete
                ? "Você completou todas as disciplinas!"
                : "Complete uma disciplina de cada vez para avançar na história"}
            </p>
          </div>

          {/* Overall Progress */}
          <div className="mt-4 bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="font-fredoka text-sm text-white/80">Progresso Geral</span>
              <span className="font-fredoka text-yellow-300 font-bold">
                {completedCount}/{totalDisciplines} disciplinas
              </span>
            </div>
            <div className="h-3 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 pb-8">
        {isComplete ? (
          // Completion screen
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-8 text-center"
          >
            <div className="text-6xl mb-4 animate-bounce">🏆</div>
            <h2 className="text-3xl font-fredoka font-bold text-yellow-300 mb-2">
              Parabéns, Herói!
            </h2>
            <p className="text-white/70 font-fredoka mb-4">
              Você completou o Modo História e desbloqueou o poder do conhecimento!
            </p>
            <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-sm mb-6">
              <div className="text-5xl mb-2">⭐</div>
              <p className="text-yellow-300 font-fredoka font-bold text-2xl">
                +{progress.totalScore} pontos ganhos!
              </p>
            </div>
            <button
              onClick={onBack}
              className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-fredoka font-bold rounded-xl hover:scale-105 transition-transform"
            >
              Voltar ao Mapa
            </button>
          </motion.div>
        ) : (
          // Mission screen
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8"
          >
            {/* Completed Disciplines */}
            {completedCount > 0 && (
              <div className="mb-8">
                <h3 className="font-fredoka text-lg font-bold text-white mb-3">
                  ✓ Disciplinas Completadas
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {progress.completedDisciplines.map((disc) => {
                    const info = DISCIPLINE_NAMES[disc] || { name: disc, emoji: "📚", color: "from-gray-400 to-gray-600" };
                    return (
                      <div
                        key={disc}
                        className={`bg-gradient-to-r ${info.color} rounded-xl p-3 text-center`}
                      >
                        <div className="text-2xl mb-1">{info.emoji}</div>
                        <div className="text-sm font-fredoka font-bold text-white">{info.name}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Current Mission */}
            <div className="mb-6">
              <h3 className="font-fredoka text-lg font-bold text-white mb-3">
                Próxima Missão
              </h3>
              {progress.currentDisciplineIndex < progress.disciplineSequence.length && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
                >
                  {(() => {
                    const nextDisc = progress.disciplineSequence[progress.currentDisciplineIndex];
                    const info = DISCIPLINE_NAMES[nextDisc] || { name: nextDisc, emoji: "📚", color: "from-gray-400 to-gray-600" };
                    return (
                      <div className="text-center">
                        <div className={`text-6xl mb-4 inline-block`}>{info.emoji}</div>
                        <h4 className="text-2xl font-fredoka font-bold text-white mb-2">
                          {info.name}
                        </h4>
                        <p className="text-white/60 font-fredoka mb-4">
                          Responda 12 perguntas para completar esta disciplina
                        </p>
                        <div className="text-sm text-white/50 mb-6">
                          Missão {progress.currentDisciplineIndex + 1} de {totalDisciplines}
                        </div>
                        <button
                          onClick={handleStartMission}
                          disabled={isLoading}
                          className={`px-8 py-3 bg-gradient-to-r ${info.color} text-white font-fredoka font-bold rounded-xl hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {isLoading ? "Gerando perguntas..." : "Iniciar Missão"}
                        </button>
                      </div>
                    );
                  })()}
                </motion.div>
              )}
            </div>

            {/* Remaining Disciplines */}
            {progress.currentDisciplineIndex + 1 < progress.disciplineSequence.length && (
              <div>
                <h3 className="font-fredoka text-lg font-bold text-white mb-3">
                  Disciplinas Restantes
                </h3>
                <div className="space-y-2">
                  {progress.disciplineSequence.slice(progress.currentDisciplineIndex + 1).map((disc, idx) => {
                    const info = DISCIPLINE_NAMES[disc] || { name: disc, emoji: "📚", color: "from-gray-400 to-gray-600" };
                    return (
                      <motion.div
                        key={disc}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="flex items-center gap-3 bg-white/5 rounded-xl p-3"
                      >
                        <div className="text-2xl">{info.emoji}</div>
                        <div>
                          <div className="font-fredoka font-bold text-white">{info.name}</div>
                          <div className="text-xs text-white/50">Missão {progress.currentDisciplineIndex + idx + 2}</div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
