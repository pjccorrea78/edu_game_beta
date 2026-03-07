import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { useGame } from "@/contexts/GameContext";
import {
  ArrowLeft, Trophy, Star, Zap, BookOpen, CheckCircle,
  Clock, Bell, Mail, Target, TrendingUp, Award
} from "lucide-react";
import { toast } from "sonner";

type Props = {
  onBack: () => void;
  onStartQuiz: (discipline: "matematica" | "portugues" | "geografia" | "historia" | "ciencias") => void;
};

const DISCIPLINE_INFO = {
  matematica: { name: "Matemática", emoji: "🔢", color: "#FF6B6B", bg: "from-red-400 to-orange-400" },
  portugues: { name: "Português", emoji: "📖", color: "#4ECDC4", bg: "from-teal-400 to-cyan-400" },
  geografia: { name: "Geografia", emoji: "🌍", color: "#45B7D1", bg: "from-blue-400 to-indigo-400" },
  historia: { name: "História", emoji: "🏛️", color: "#F7DC6F", bg: "from-yellow-400 to-amber-400" },
  ciencias: { name: "Ciências", emoji: "🔬", color: "#A8E6CF", bg: "from-green-400 to-emerald-400" },
};

type Discipline = keyof typeof DISCIPLINE_INFO;

const MILESTONES = [
  { points: 100, label: "Iniciante", emoji: "🌱", color: "#A8E6CF" },
  { points: 300, label: "Estudioso", emoji: "📚", color: "#45B7D1" },
  { points: 500, label: "Dedicado", emoji: "⭐", color: "#F7DC6F" },
  { points: 1000, label: "Campeão", emoji: "🏆", color: "#FF6B6B" },
  { points: 2000, label: "Lendário", emoji: "👑", color: "#9B59B6" },
];

export default function ProgressPanel({ onBack, onStartQuiz }: Props) {
  const { sessionId, player } = useGame();
  const [guardianEmail, setGuardianEmail] = useState(player?.guardianEmail ?? "");
  const [isSavingEmail, setIsSavingEmail] = useState(false);
  const [activeTab, setActiveTab] = useState<"progress" | "history" | "notifications">("progress");

  const progressQuery = trpc.player.getProgress.useQuery({ sessionId });
  const updateEmail = trpc.player.updateGuardianEmail.useMutation();

  const progress = progressQuery.data;
  const totalPoints = player?.totalPoints ?? 0;

  // Find current milestone
  const currentMilestone = [...MILESTONES].reverse().find((m) => totalPoints >= m.points);
  const nextMilestone = MILESTONES.find((m) => totalPoints < m.points);
  const milestoneProgress = nextMilestone
    ? ((totalPoints - (currentMilestone?.points ?? 0)) / (nextMilestone.points - (currentMilestone?.points ?? 0))) * 100
    : 100;

  const handleSaveEmail = async () => {
    if (!guardianEmail || !guardianEmail.includes("@")) {
      toast.error("Por favor, insira um e-mail válido");
      return;
    }
    setIsSavingEmail(true);
    try {
      await updateEmail.mutateAsync({ sessionId, email: guardianEmail });
      toast.success("E-mail do responsável salvo! 📧");
    } catch {
      toast.error("Erro ao salvar e-mail");
    } finally {
      setIsSavingEmail(false);
    }
  };

  const completedCount = progress?.disciplineProgress.filter((d) => d.completed).length ?? 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-purple-50 flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center gap-3 bg-white shadow-sm">
        <motion.button
          className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onBack}
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </motion.button>
        <div className="flex-1">
          <h1 className="font-black text-gray-800 text-lg">Meu Progresso</h1>
          <p className="text-xs text-gray-500">Acompanhe sua evolução</p>
        </div>
        <div className="flex items-center gap-1 bg-yellow-50 border border-yellow-200 rounded-xl px-3 py-1.5">
          <Zap className="w-4 h-4 text-yellow-500" />
          <span className="font-black text-gray-800">{totalPoints}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-4 pt-4 pb-2">
        {[
          { id: "progress" as const, label: "Progresso", icon: <TrendingUp className="w-3.5 h-3.5" /> },
          { id: "history" as const, label: "Histórico", icon: <Clock className="w-3.5 h-3.5" /> },
          { id: "notifications" as const, label: "Avisos", icon: <Bell className="w-3.5 h-3.5" /> },
        ].map((t) => (
          <motion.button
            key={t.id}
            className={`flex-1 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition-all ${
              activeTab === t.id ? "bg-indigo-500 text-white shadow" : "bg-white text-gray-600"
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab(t.id)}
          >
            {t.icon}
            {t.label}
          </motion.button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        <AnimatePresence mode="wait">
          {activeTab === "progress" && (
            <motion.div
              key="progress"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {/* Points card */}
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-3xl p-5 mb-4 text-white shadow-xl">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-white/70 text-sm">Pontuação Total</p>
                    <p className="text-4xl font-black">{totalPoints}</p>
                    <p className="text-white/70 text-xs">pontos acumulados</p>
                  </div>
                  <div className="text-right">
                    <div className="text-4xl">{currentMilestone?.emoji ?? "🌱"}</div>
                    <p className="font-bold text-sm mt-1">{currentMilestone?.label ?? "Iniciante"}</p>
                  </div>
                </div>

                {/* Milestone progress */}
                {nextMilestone && (
                  <div>
                    <div className="flex justify-between text-xs text-white/70 mb-1">
                      <span>Próximo: {nextMilestone.label} {nextMilestone.emoji}</span>
                      <span>{nextMilestone.points - totalPoints} pts restantes</span>
                    </div>
                    <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-white rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${milestoneProgress}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { label: "Disciplinas", value: `${completedCount}/5`, icon: <BookOpen className="w-5 h-5" />, color: "#4ECDC4" },
                  { label: "Quizzes", value: progress?.quizHistory.length ?? 0, icon: <Target className="w-5 h-5" />, color: "#FF6B6B" },
                  { label: "Itens", value: progress?.ownedItemIds.length ?? 0, icon: <Award className="w-5 h-5" />, color: "#F7DC6F" },
                ].map((stat, i) => (
                  <motion.div
                    key={i}
                    className="bg-white rounded-2xl shadow p-3 text-center"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <div className="flex justify-center mb-1" style={{ color: stat.color }}>{stat.icon}</div>
                    <p className="text-xl font-black text-gray-800">{stat.value}</p>
                    <p className="text-xs text-gray-500">{stat.label}</p>
                  </motion.div>
                ))}
              </div>

              {/* Discipline progress */}
              <h3 className="font-black text-gray-700 mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-500" />
                Disciplinas
              </h3>
              <div className="space-y-3">
                {(progress?.disciplineProgress ?? []).map((dp, i) => {
                  const info = DISCIPLINE_INFO[dp.discipline as Discipline];
                  const pct = dp.bestCorrect > 0 ? Math.round((dp.bestCorrect / 10) * 100) : 0;
                  return (
                    <motion.div
                      key={dp.discipline}
                      className="bg-white rounded-2xl shadow p-4"
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: i * 0.08 }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{info.emoji}</span>
                          <div>
                            <p className="font-bold text-gray-800 text-sm">{info.name}</p>
                            <p className="text-xs text-gray-500">{dp.attempts} tentativa{dp.attempts !== 1 ? "s" : ""}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {dp.completed && (
                            <span className="text-xs bg-green-100 text-green-600 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> Completo
                            </span>
                          )}
                          <span className="font-black text-gray-800">{pct}%</span>
                        </div>
                      </div>
                      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full bg-gradient-to-r ${info.bg}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 1, ease: "easeOut", delay: 0.3 + i * 0.08 }}
                        />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-gray-400">Melhor: {dp.bestCorrect}/10 acertos</span>
                        <motion.button
                          className="text-xs font-bold px-2 py-0.5 rounded-lg"
                          style={{ color: info.color, background: `${info.color}15` }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => onStartQuiz(dp.discipline as Discipline)}
                        >
                          Jogar →
                        </motion.button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Milestones */}
              <h3 className="font-black text-gray-700 mt-5 mb-3 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-500" />
                Conquistas
              </h3>
              <div className="grid grid-cols-5 gap-2">
                {MILESTONES.map((m, i) => {
                  const achieved = totalPoints >= m.points;
                  return (
                    <motion.div
                      key={i}
                      className={`rounded-2xl p-2 text-center ${achieved ? "shadow-md" : "opacity-40"}`}
                      style={{ background: achieved ? `${m.color}33` : "#f0f0f0" }}
                      whileHover={achieved ? { scale: 1.05 } : {}}
                    >
                      <div className="text-2xl">{m.emoji}</div>
                      <p className="text-xs font-bold text-gray-700 mt-0.5">{m.label}</p>
                      <p className="text-xs text-gray-500">{m.points}pts</p>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {activeTab === "history" && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <h3 className="font-black text-gray-700 mb-3 flex items-center gap-2 mt-2">
                <Clock className="w-4 h-4 text-indigo-500" />
                Últimas Sessões
              </h3>
              {(progress?.quizHistory ?? []).length === 0 ? (
                <div className="bg-white rounded-2xl shadow p-8 text-center">
                  <div className="text-4xl mb-2">📚</div>
                  <p className="font-bold text-gray-600">Nenhuma sessão ainda</p>
                  <p className="text-sm text-gray-400 mt-1">Complete um quiz para ver seu histórico!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(progress?.quizHistory ?? []).map((session, i) => {
                    const info = DISCIPLINE_INFO[session.discipline as Discipline];
                    const pct = Math.round((session.correctAnswers / session.totalQuestions) * 100);
                    return (
                      <motion.div
                        key={session.id}
                        className="bg-white rounded-2xl shadow p-4"
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: i * 0.06 }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                              style={{ background: `${info.color}22` }}
                            >
                              {info.emoji}
                            </div>
                            <div>
                              <p className="font-bold text-gray-800 text-sm">{info.name}</p>
                              <p className="text-xs text-gray-400">
                                {session.completedAt
                                  ? new Date(session.completedAt).toLocaleDateString("pt-BR")
                                  : "—"}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-black text-gray-800">{session.correctAnswers}/{session.totalQuestions}</p>
                            <p className="text-xs" style={{ color: pct >= 60 ? "#27AE60" : "#E74C3C" }}>
                              {pct}% acertos
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${pct}%`,
                                background: pct >= 60 ? "#27AE60" : "#E74C3C",
                              }}
                            />
                          </div>
                          <span className="text-xs font-bold text-yellow-600">+{session.pointsEarned}pts</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "notifications" && (
            <motion.div
              key="notifications"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="bg-white rounded-3xl shadow-lg p-5 mt-2">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center">
                    <Bell className="w-6 h-6 text-indigo-500" />
                  </div>
                  <div>
                    <h3 className="font-black text-gray-800">Avisos para Responsáveis</h3>
                    <p className="text-xs text-gray-500">Receba notificações sobre o progresso</p>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-4">
                  Cadastre o e-mail do responsável para receber notificações automáticas quando:
                </p>

                <div className="space-y-2 mb-5">
                  {[
                    { emoji: "🏆", text: "Completar uma disciplina com 80%+ de acertos" },
                    { emoji: "⭐", text: "Atingir 1000 pontos acumulados" },
                    { emoji: "👑", text: "Desbloquear todos os equipamentos da loja" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-indigo-50 rounded-xl">
                      <span className="text-xl">{item.emoji}</span>
                      <p className="text-sm text-gray-700 font-medium">{item.text}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <label className="block">
                    <span className="text-sm font-bold text-gray-700 flex items-center gap-1.5 mb-1.5">
                      <Mail className="w-4 h-4 text-indigo-500" />
                      E-mail do Responsável
                    </span>
                    <input
                      type="email"
                      value={guardianEmail}
                      onChange={(e) => setGuardianEmail(e.target.value)}
                      placeholder="responsavel@email.com"
                      className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-indigo-400 outline-none text-sm font-medium transition-colors"
                    />
                  </label>
                  <motion.button
                    className="w-full py-3 rounded-2xl font-bold text-white shadow-lg flex items-center justify-center gap-2"
                    style={{ background: "linear-gradient(135deg, #667eea, #764ba2)" }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSaveEmail}
                    disabled={isSavingEmail}
                  >
                    <Bell className="w-4 h-4" />
                    {isSavingEmail ? "Salvando..." : "Ativar Notificações"}
                  </motion.button>
                </div>

                {player?.guardianEmail && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <p className="text-sm text-green-700">
                      Notificações ativas para <strong>{player.guardianEmail}</strong>
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
