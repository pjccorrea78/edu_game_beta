import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { useGame } from "@/contexts/GameContext";
import { ArrowLeft, Trophy, Lock, Star, Zap } from "lucide-react";
import { toast } from "sonner";

interface AchievementsProps {
  onBack: () => void;
}

type Achievement = {
  key: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  unlocked: boolean;
  unlockedAt: Date | null;
};

const CATEGORY_INFO: Record<string, { label: string; color: string; bg: string }> = {
  quiz: { label: "Quiz", color: "text-blue-600", bg: "bg-blue-50" },
  points: { label: "Pontos", color: "text-yellow-600", bg: "bg-yellow-50" },
  shop: { label: "Loja", color: "text-purple-600", bg: "bg-purple-50" },
  explore: { label: "Explorar", color: "text-green-600", bg: "bg-green-50" },
};

function AchievementCard({ achievement }: { achievement: Achievement }) {
  const catInfo = CATEGORY_INFO[achievement.category] ?? CATEGORY_INFO.quiz;

  return (
    <motion.div
      className={`relative rounded-2xl p-4 flex items-center gap-3 transition-all ${
        achievement.unlocked
          ? "bg-white shadow-md border-2 border-yellow-200"
          : "bg-gray-50 border-2 border-gray-100 opacity-60"
      }`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: achievement.unlocked ? 1 : 0.6, y: 0 }}
      whileHover={achievement.unlocked ? { scale: 1.02 } : {}}
    >
      {/* Icon */}
      <div
        className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 ${
          achievement.unlocked ? catInfo.bg : "bg-gray-100"
        }`}
      >
        {achievement.unlocked ? achievement.icon : <Lock className="w-6 h-6 text-gray-400" />}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className={`font-black text-sm ${achievement.unlocked ? "text-gray-800" : "text-gray-400"}`}>
            {achievement.title}
          </p>
          {achievement.unlocked && (
            <span className="text-yellow-400 text-xs">✨</span>
          )}
        </div>
        <p className="text-xs text-gray-500 leading-tight">{achievement.description}</p>
        {achievement.unlocked && achievement.unlockedAt && (
          <p className="text-xs text-gray-400 mt-1">
            Desbloqueado em {new Date(achievement.unlockedAt).toLocaleDateString("pt-BR")}
          </p>
        )}
      </div>

      {/* Category badge */}
      <div className={`px-2 py-1 rounded-lg text-xs font-bold flex-shrink-0 ${catInfo.bg} ${catInfo.color}`}>
        {catInfo.label}
      </div>

      {/* Glow effect for unlocked */}
      {achievement.unlocked && (
        <div className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{ boxShadow: "0 0 0 2px #FCD34D40" }}
        />
      )}
    </motion.div>
  );
}

export default function Achievements({ onBack }: AchievementsProps) {
  const { sessionId } = useGame();
  const prevUnlockedRef = useRef<Set<string>>(new Set());

  const { data, isLoading } = trpc.achievements.myAchievements.useQuery(
    { sessionId },
    { refetchInterval: 10000 } // Poll every 10s to catch new unlocks
  );

  const achievements = data?.achievements ?? [];
  const totalUnlocked = data?.totalUnlocked ?? 0;
  const totalAchievements = achievements.length;

  // Detect newly unlocked achievements and show toast
  useEffect(() => {
    if (!data) return;
    const currentUnlocked = new Set(achievements.filter(a => a.unlocked).map(a => a.key));

    if (prevUnlockedRef.current.size > 0) {
      currentUnlocked.forEach(key => {
        if (!prevUnlockedRef.current.has(key)) {
          const achievement = achievements.find(a => a.key === key);
          if (achievement) {
            toast.success(`🏆 Conquista desbloqueada: ${achievement.title}!`, {
              description: achievement.description,
              duration: 5000,
            });
          }
        }
      });
    }

    prevUnlockedRef.current = currentUnlocked;
  }, [data]);

  // Group by category
  const byCategory = achievements.reduce<Record<string, Achievement[]>>((acc, a) => {
    if (!acc[a.category]) acc[a.category] = [];
    acc[a.category].push(a);
    return acc;
  }, {});

  const progressPct = totalAchievements > 0 ? Math.round((totalUnlocked / totalAchievements) * 100) : 0;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "linear-gradient(180deg, #F59E0B22 0%, #f8f9ff 30%)" }}
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
            <Trophy className="w-5 h-5 text-yellow-500" />
            <span className="font-black text-gray-800 text-lg">Conquistas</span>
          </div>
          <p className="text-xs text-gray-500">{totalUnlocked} de {totalAchievements} desbloqueadas</p>
        </div>
        <div className="flex items-center gap-1 bg-yellow-50 rounded-xl px-3 py-1.5 border border-yellow-200">
          <Star className="w-4 h-4 text-yellow-500" />
          <span className="font-black text-yellow-700">{totalUnlocked}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-4 mb-4">
        <motion.div
          className="bg-white rounded-2xl p-4 shadow-sm"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm font-bold text-gray-700">Progresso Geral</p>
            <p className="text-sm font-black text-yellow-600">{progressPct}%</p>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, #F59E0B, #EF4444)" }}
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <p className="text-xs text-gray-400">{totalUnlocked} conquistadas</p>
            <p className="text-xs text-gray-400">{totalAchievements - totalUnlocked} restantes</p>
          </div>
        </motion.div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <motion.div
            className="w-12 h-12 border-4 border-yellow-200 border-t-yellow-500 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </div>
      )}

      {/* Achievements by category */}
      {!isLoading && (
        <div className="flex-1 px-4 pb-6 space-y-6">
          {Object.entries(byCategory).map(([category, items]) => {
            const catInfo = CATEGORY_INFO[category] ?? CATEGORY_INFO.quiz;
            const unlockedInCat = items.filter(a => a.unlocked).length;
            return (
              <div key={category}>
                <div className="flex items-center justify-between mb-3">
                  <p className={`font-black text-sm flex items-center gap-2 ${catInfo.color}`}>
                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center ${catInfo.bg}`}>
                      <Zap className="w-3.5 h-3.5" />
                    </span>
                    {catInfo.label}
                  </p>
                  <span className="text-xs text-gray-400 font-medium">
                    {unlockedInCat}/{items.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {items.map(achievement => (
                    <AchievementCard key={achievement.key} achievement={achievement} />
                  ))}
                </div>
              </div>
            );
          })}

          {/* All unlocked celebration */}
          {totalUnlocked === totalAchievements && totalAchievements > 0 && (
            <motion.div
              className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-2xl p-6 text-center text-white"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <div className="text-4xl mb-2">🏆</div>
              <p className="font-black text-lg">Parabéns!</p>
              <p className="text-sm opacity-90">Você desbloqueou todas as conquistas!</p>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
