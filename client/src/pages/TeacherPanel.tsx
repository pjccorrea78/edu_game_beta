import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft,
  GraduationCap,
  Users,
  Trophy,
  Target,
  TrendingUp,
  Search,
  Star,
  BookOpen,
  BarChart3,
  Medal,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";

interface TeacherPanelProps {
  onBack: () => void;
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <motion.div
      className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-xl font-black text-gray-800">{value}</p>
      </div>
    </motion.div>
  );
}

function StudentRow({ session, rank }: { session: { id: number; nickname: string | null; score: number; correctAnswers: number; totalQuestions: number; pointsEarned: number; createdAt: Date }; rank: number }) {
  const accuracy = Math.round((session.correctAnswers / session.totalQuestions) * 100);
  const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;

  return (
    <motion.div
      className="bg-white rounded-xl p-3 flex items-center gap-3 shadow-sm"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.05 }}
    >
      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-black text-sm text-gray-600">
        {medal ?? `#${rank}`}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-gray-800 text-sm truncate">{session.nickname ?? "Jogador"}</p>
        <p className="text-xs text-gray-400">{new Date(session.createdAt).toLocaleDateString("pt-BR")}</p>
      </div>
      <div className="flex items-center gap-2">
        <div className="text-right">
          <p className="font-black text-sm text-gray-800">{session.score} pts</p>
          <p className="text-xs text-gray-400">{session.correctAnswers}/{session.totalQuestions} acertos</p>
        </div>
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black ${
            accuracy >= 80 ? "bg-green-100 text-green-700" :
            accuracy >= 60 ? "bg-yellow-100 text-yellow-700" :
            "bg-red-100 text-red-700"
          }`}
        >
          {accuracy}%
        </div>
      </div>
    </motion.div>
  );
}

export default function TeacherPanel({ onBack }: TeacherPanelProps) {
  const [code, setCode] = useState("");
  const [searchCode, setSearchCode] = useState<string | null>(null);

  const { data, isLoading, error } = trpc.teacher.getTurmaProgress.useQuery(
    { code: searchCode! },
    { enabled: !!searchCode }
  );

  const handleSearch = () => {
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length >= 4) setSearchCode(trimmed);
  };

  const sessions = data?.sessions ?? [];
  const stats = data?.stats;

  // Group by player to get best score per student
  const byPlayer = new Map<number, typeof sessions[0]>();
  sessions.forEach(s => {
    const existing = byPlayer.get(s.playerId);
    if (!existing || s.score > existing.score) byPlayer.set(s.playerId, s);
  });
  const uniqueStudents = Array.from(byPlayer.values()).sort((a, b) => b.score - a.score);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "linear-gradient(180deg, #1e3a5f22 0%, #f8f9ff 30%)" }}
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
            <GraduationCap className="w-5 h-5 text-blue-600" />
            <span className="font-black text-gray-800 text-lg">Painel do Professor</span>
          </div>
          <p className="text-xs text-gray-500">Acompanhe o progresso da sua turma</p>
        </div>
      </div>

      {/* Search by code */}
      <div className="px-4 mb-4">
        <motion.div
          className="bg-white rounded-2xl p-4 shadow-sm"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-500" />
            Digite o código da turma
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              placeholder="Ex: ABC123"
              maxLength={8}
              className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold tracking-widest text-center focus:outline-none focus:border-blue-400 uppercase"
            />
            <motion.button
              className="bg-blue-500 text-white rounded-xl px-4 py-2.5 font-bold text-sm flex items-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSearch}
              disabled={isLoading}
            >
              <Search className="w-4 h-4" />
              Buscar
            </motion.button>
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">
            Use o código gerado na tela do Prédio da Escola
          </p>
        </motion.div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <motion.div
            className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="px-4">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
            <XCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-red-600 font-bold text-sm">Código não encontrado</p>
            <p className="text-red-400 text-xs mt-1">Verifique o código e tente novamente</p>
          </div>
        </div>
      )}

      {/* Results */}
      <AnimatePresence>
        {data && !isLoading && (
          <motion.div
            className="flex-1 px-4 pb-6 space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {/* Material title */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-4 text-white">
              <p className="text-xs opacity-80 mb-1">Material da Turma</p>
              <p className="font-black text-lg">{data.materialTitle}</p>
              <p className="text-xs opacity-80 mt-1">Código: {data.code}</p>
            </div>

            {/* Stats grid */}
            {stats && (
              <div className="grid grid-cols-2 gap-3">
                <StatCard
                  icon={<Users className="w-5 h-5 text-blue-600" />}
                  label="Alunos"
                  value={stats.totalStudents}
                  color="bg-blue-50"
                />
                <StatCard
                  icon={<Target className="w-5 h-5 text-green-600" />}
                  label="Média de Acerto"
                  value={`${stats.avgAccuracy}%`}
                  color="bg-green-50"
                />
                <StatCard
                  icon={<TrendingUp className="w-5 h-5 text-purple-600" />}
                  label="Pontuação Média"
                  value={stats.avgScore}
                  color="bg-purple-50"
                />
                <StatCard
                  icon={<Trophy className="w-5 h-5 text-yellow-600" />}
                  label="Maior Pontuação"
                  value={stats.topScore}
                  color="bg-yellow-50"
                />
              </div>
            )}

            {/* Accuracy distribution */}
            {uniqueStudents.length > 0 && (
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <p className="font-bold text-gray-700 text-sm mb-3 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-500" />
                  Distribuição de Desempenho
                </p>
                <div className="space-y-2">
                  {[
                    { label: "Excelente (≥80%)", min: 80, color: "bg-green-500" },
                    { label: "Bom (60-79%)", min: 60, max: 79, color: "bg-yellow-500" },
                    { label: "Precisa melhorar (<60%)", max: 59, color: "bg-red-400" },
                  ].map(band => {
                    const count = uniqueStudents.filter(s => {
                      const acc = Math.round((s.correctAnswers / s.totalQuestions) * 100);
                      if (band.min !== undefined && band.max !== undefined) return acc >= band.min && acc <= band.max;
                      if (band.min !== undefined) return acc >= band.min;
                      return acc <= (band.max ?? 100);
                    }).length;
                    const pct = uniqueStudents.length > 0 ? Math.round((count / uniqueStudents.length) * 100) : 0;
                    return (
                      <div key={band.label}>
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>{band.label}</span>
                          <span>{count} aluno{count !== 1 ? "s" : ""} ({pct}%)</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <motion.div
                            className={`h-full ${band.color} rounded-full`}
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Student ranking */}
            <div>
              <p className="font-bold text-gray-700 text-sm mb-3 flex items-center gap-2">
                <Medal className="w-4 h-4 text-yellow-500" />
                Ranking dos Alunos ({uniqueStudents.length})
              </p>
              {uniqueStudents.length === 0 ? (
                <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
                  <Clock className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm font-medium">Nenhum aluno completou o quiz ainda</p>
                  <p className="text-gray-400 text-xs mt-1">Compartilhe o código {data.code} com sua turma!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {uniqueStudents.map((s, i) => (
                    <StudentRow key={s.id} session={s} rank={i + 1} />
                  ))}
                </div>
              )}
            </div>

            {/* All attempts */}
            {sessions.length > uniqueStudents.length && (
              <div>
                <p className="font-bold text-gray-700 text-sm mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Todas as Tentativas ({sessions.length})
                </p>
                <div className="space-y-2">
                  {sessions.map((s, i) => (
                    <StudentRow key={`${s.id}-${i}`} session={s} rank={i + 1} />
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {!searchCode && !isLoading && (
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          <motion.div
            className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mb-4"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <GraduationCap className="w-10 h-10 text-blue-400" />
          </motion.div>
          <p className="font-black text-gray-700 text-lg mb-2">Bem-vindo, Professor!</p>
          <p className="text-gray-400 text-sm leading-relaxed">
            Digite o código da turma para ver o progresso dos seus alunos em tempo real.
          </p>
          <div className="mt-6 grid grid-cols-3 gap-3 w-full max-w-xs">
            {[
              { icon: <Users className="w-5 h-5 text-blue-500" />, label: "Alunos" },
              { icon: <Star className="w-5 h-5 text-yellow-500" />, label: "Notas" },
              { icon: <TrendingUp className="w-5 h-5 text-green-500" />, label: "Progresso" },
            ].map(item => (
              <div key={item.label} className="bg-white rounded-xl p-3 shadow-sm text-center">
                <div className="flex justify-center mb-1">{item.icon}</div>
                <p className="text-xs text-gray-500 font-medium">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
