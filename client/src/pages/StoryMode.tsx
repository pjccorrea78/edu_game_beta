import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useGame } from "@/contexts/GameContext";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface Mission {
  id: number;
  title: string;
  description: string;
  order: number;
  discipline: string | null;
  requiresPoints: number;
  requiresQuizzes: number;
  rewardPoints: number;
  rewardBadge: string | null;
  emoji: string;
  completed: boolean;
  progress: number;
}

interface StoryModeProps {
  onBack: () => void;
  onStartQuiz?: (discipline: string) => void;
}

// Derive chapters from order: 1-4 = cap1, 5-8 = cap2, etc.
function getChapter(order: number) { return Math.ceil(order / 4); }

const CHAPTER_NAMES: Record<number, string> = {
  1: "O Despertar do Herói",
  2: "Os Guardiões do Saber",
  3: "A Grande Jornada",
  4: "O Mestre Supremo",
};

const CHAPTER_COLORS: Record<number, { from: string; to: string; border: string }> = {
  1: { from: "from-green-400", to: "to-emerald-600", border: "border-green-400" },
  2: { from: "from-blue-400", to: "to-indigo-600", border: "border-blue-400" },
  3: { from: "from-purple-400", to: "to-violet-600", border: "border-purple-400" },
  4: { from: "from-yellow-400", to: "to-orange-500", border: "border-yellow-400" },
};

export default function StoryMode({ onBack, onStartQuiz }: StoryModeProps) {
  const { sessionId } = useGame();
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [activeChapter, setActiveChapter] = useState(1);

  const { data: missionsData, refetch } = trpc.missions.list.useQuery(
    { sessionId },
    { enabled: !!sessionId }
  );

  const checkAndUnlockMutation = trpc.missions.checkAndUnlock.useMutation({
    onSuccess: (data) => {
      if (data.newlyUnlocked.length > 0) {
        data.newlyUnlocked.forEach((m) => {
          toast.success(`🎉 Missão desbloqueada: ${m.title}! +${m.rewardPoints} pontos!`, {
            duration: 5000,
          });
        });
        refetch();
      }
    },
  });

  useEffect(() => {
    if (sessionId) {
      checkAndUnlockMutation.mutate({ sessionId });
    }
  }, [sessionId]);

  const missions: Mission[] = (missionsData || []).map((m: unknown) => {
    const raw = m as Record<string, unknown>;
    return {
      id: raw.id as number,
      title: raw.title as string,
      description: raw.description as string,
      order: raw.order as number,
      discipline: raw.discipline as string | null,
      requiresPoints: raw.requiresPoints as number,
      requiresQuizzes: raw.requiresQuizzes as number,
      rewardPoints: raw.rewardPoints as number,
      rewardBadge: (raw.rewardBadge as string | null) ?? null,
      emoji: (raw.emoji as string) || '🎯',
      completed: raw.completed as boolean,
      progress: raw.progress as number,
    };
  });
  const chapters = Array.from(new Set(missions.map((m) => getChapter(m.order)))).sort();

  const missionsByChapter = missions.reduce<Record<number, Mission[]>>((acc, m) => {
    const ch = getChapter(m.order);
    if (!acc[ch]) acc[ch] = [];
    acc[ch].push(m);
    return acc;
  }, {});

  const chapterProgress = (chapter: number) => {
    const chMissions = missionsByChapter[chapter] || [];
    if (chMissions.length === 0) return 0;
    return Math.round((chMissions.filter((m) => m.completed).length / chMissions.length) * 100);
  };

  const totalCompleted = missions.filter((m) => m.completed).length;
  const totalMissions = missions.length;

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
            <p className="text-white/70 text-sm mt-1">Complete missões e desbloqueie o poder do conhecimento!</p>
          </div>

          {/* Overall Progress */}
          <div className="mt-4 bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="font-fredoka text-sm text-white/80">Progresso Geral</span>
              <span className="font-fredoka text-yellow-300 font-bold">
                {totalCompleted}/{totalMissions} missões
              </span>
            </div>
            <div className="h-3 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${totalMissions > 0 ? (totalCompleted / totalMissions) * 100 : 0}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Chapter Tabs */}
      <div className="px-4 py-3">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {chapters.map((chapter) => {
            const colors = CHAPTER_COLORS[chapter] || CHAPTER_COLORS[1];
            const progress = chapterProgress(chapter);
            const isActive = activeChapter === chapter;
            return (
              <button
                key={chapter}
                onClick={() => setActiveChapter(chapter)}
                className={`flex-shrink-0 px-4 py-2 rounded-xl font-fredoka text-sm transition-all ${
                  isActive
                    ? `bg-gradient-to-r ${colors.from} ${colors.to} text-white shadow-lg scale-105`
                    : "bg-white/10 text-white/60 hover:bg-white/20"
                }`}
              >
                <div>Cap. {chapter}</div>
                <div className="text-xs opacity-80">{progress}%</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Missions List */}
      <div className="px-4 pb-8">
        <div className="mb-4">
          <h2 className="font-fredoka text-xl text-white font-bold">
            {CHAPTER_NAMES[activeChapter] || `Capítulo ${activeChapter}`}
          </h2>
          <div className="h-1 w-16 bg-yellow-400 rounded-full mt-1" />
        </div>

        {missions.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">⏳</div>
            <p className="text-white/60 font-fredoka">Carregando missões...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {(missionsByChapter[activeChapter] || [])
              .sort((a, b) => a.order - b.order)
              .map((mission, idx) => {
                const colors = CHAPTER_COLORS[activeChapter] || CHAPTER_COLORS[1];
                const progressPct = mission.requiresQuizzes > 0
                  ? Math.min(100, Math.round((mission.progress / mission.requiresQuizzes) * 100))
                  : (mission.requiresPoints > 0 ? 0 : 100);

                return (
                  <motion.div
                    key={mission.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => setSelectedMission(mission)}
                    className={`relative bg-white/10 backdrop-blur-sm rounded-2xl p-4 border cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] ${
                      mission.completed
                        ? `border-yellow-400/50 bg-yellow-400/10`
                        : `border-white/10 hover:border-white/30`
                    }`}
                  >
                    {/* Completed badge */}
                    {mission.completed && (
                      <div className="absolute top-3 right-3 bg-yellow-400 text-black text-xs font-fredoka font-bold px-2 py-0.5 rounded-full">
                        ✓ Completa
                      </div>
                    )}

                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${
                        mission.completed
                          ? "bg-yellow-400/20"
                          : "bg-white/10"
                      }`}>
                        {mission.emoji}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-fredoka font-bold text-white text-sm leading-tight">
                          {mission.title}
                        </h3>
                        <p className="text-white/60 text-xs mt-0.5 leading-snug">
                          {mission.description}
                        </p>

                        {/* Progress bar */}
                        {!mission.completed && mission.requiresQuizzes > 0 && (
                          <div className="mt-2">
                            <div className="flex justify-between text-xs text-white/50 mb-1">
                              <span>Progresso</span>
                              <span>{mission.progress}/{mission.requiresQuizzes} quizzes</span>
                            </div>
                            <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                              <div
                                className={`h-full bg-gradient-to-r ${colors.from} ${colors.to} rounded-full transition-all`}
                                style={{ width: `${progressPct}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Reward */}
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-yellow-300 font-fredoka">
                            🏆 +{mission.rewardPoints} pts
                          </span>
                          {mission.rewardBadge && (
                            <span className="text-xs text-purple-300 font-fredoka">
                              🎁 {mission.rewardBadge}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
          </div>
        )}
      </div>

      {/* Mission Detail Modal */}
      <AnimatePresence>
        {selectedMission && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end justify-center p-4"
            onClick={() => setSelectedMission(null)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-b from-indigo-800 to-purple-900 rounded-3xl p-6 w-full max-w-sm border border-white/20"
            >
              <div className="text-center mb-4">
                        <div className="text-5xl mb-2">{selectedMission.emoji}</div>          <h2 className="font-fredoka text-xl font-bold text-white">{selectedMission.title}</h2>
                <p className="text-white/70 text-sm mt-1">{selectedMission.description}</p>
              </div>

              <div className="bg-white/10 rounded-2xl p-4 mb-4 space-y-2">
                {selectedMission.requiresQuizzes > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Quizzes necessários</span>
                    <span className="text-white font-fredoka font-bold">
                      {selectedMission.progress}/{selectedMission.requiresQuizzes}
                    </span>
                  </div>
                )}
                {selectedMission.requiresPoints > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Pontos necessários</span>
                    <span className="text-white font-fredoka font-bold">
                      {selectedMission.requiresPoints}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Recompensa</span>
                  <span className="text-yellow-300 font-fredoka font-bold">
                    +{selectedMission.rewardPoints} pontos
                  </span>
                </div>
                {selectedMission.rewardBadge && (
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Badge especial</span>
                    <span className="text-purple-300 font-fredoka font-bold">
                      🎁 {selectedMission.rewardBadge}
                    </span>
                  </div>
                )}
              </div>

              {selectedMission.completed ? (
                <div className="bg-yellow-400/20 border border-yellow-400/50 rounded-2xl p-3 text-center">
                  <span className="text-yellow-300 font-fredoka font-bold">✓ Missão Concluída!</span>
                </div>
              ) : selectedMission.discipline && onStartQuiz ? (
                <button
                  onClick={() => {
                    onStartQuiz(selectedMission.discipline!);
                    setSelectedMission(null);
                  }}
                  className="w-full bg-gradient-to-r from-green-400 to-emerald-500 text-white font-fredoka font-bold py-3 rounded-2xl text-lg shadow-lg active:scale-95 transition-transform"
                >
                  🎮 Iniciar Quiz
                </button>
              ) : (
                <button
                  onClick={() => setSelectedMission(null)}
                  className="w-full bg-white/20 text-white font-fredoka font-bold py-3 rounded-2xl text-lg"
                >
                  Fechar
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
