import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { useGame } from "@/contexts/GameContext";
import { toast } from "sonner";

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
const disciplineEmojis: Record<string, string> = {
  matematica: "🔢",
  portugues: "📖",
  geografia: "🌍",
  historia: "🏛️",
  ciencias: "🔬",
  educacao_fisica: "⚽",
  arte: "🎨",
  ensino_religioso: "✨",
};

type DuelView = "menu" | "create" | "join" | "my_duels";

export default function DuelChallenge({ onBack }: { onBack: () => void }) {
  const { sessionId } = useGame();
  const [view, setView] = useState<DuelView>("menu");
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>("matematica");
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [joinedDuelId, setJoinedDuelId] = useState<number | null>(null);

  const createMutation = trpc.duel.create.useMutation({
    onSuccess: (data) => {
      setCreatedCode(data.code);
    },
    onError: (err) => toast.error(err.message),
  });

  const joinMutation = trpc.duel.join.useMutation({
    onSuccess: (data) => {
      setJoinedDuelId(data.duel.id);
      toast.success("Desafio encontrado! Prepare-se!");
    },
    onError: (err) => toast.error(err.message),
  });

  const { data: myDuelsData } = trpc.duel.myDuels.useQuery(
    { sessionId },
    { enabled: view === "my_duels" }
  );

  const handleCreate = () => {
    createMutation.mutate({
      sessionId,
      quizType: "discipline",
      discipline: selectedDiscipline as "matematica" | "portugues" | "geografia" | "historia" | "ciencias" | "educacao_fisica" | "arte" | "ensino_religioso",
    });
  };

  const handleJoin = () => {
    if (!joinCode.trim()) return;
    joinMutation.mutate({ sessionId, code: joinCode.trim().toUpperCase() });
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Código copiado!");
  };

  const statusLabel: Record<string, string> = {
    waiting: "⏳ Aguardando",
    in_progress: "⚔️ Em andamento",
    completed: "✅ Concluído",
  };
  const statusColor: Record<string, string> = {
    waiting: "#F59E0B",
    in_progress: "#3B82F6",
    completed: "#10B981",
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "linear-gradient(160deg, #1e0533, #2d1b69, #0f172a)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 pt-6">
        <motion.button
          onClick={view === "menu" ? onBack : () => { setView("menu"); setCreatedCode(null); setJoinedDuelId(null); }}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white text-xl"
          whileTap={{ scale: 0.9 }}
        >
          ←
        </motion.button>
        <div className="text-center">
          <h1 className="text-white font-bold text-xl" style={{ fontFamily: "'Fredoka One', cursive" }}>
            ⚔️ Duelo de Sabedoria
          </h1>
          <p className="text-white/50 text-xs">Desafie seus amigos!</p>
        </div>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-8">
        <AnimatePresence mode="wait">
          {/* MENU */}
          {view === "menu" && (
            <motion.div
              key="menu"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="pt-4 space-y-4"
            >
              <div
                className="rounded-3xl p-6 text-center mb-2"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                <p className="text-4xl mb-2">⚔️</p>
                <p className="text-white text-sm leading-relaxed" style={{ fontFamily: "'Nunito', sans-serif" }}>
                  Crie um desafio e compartilhe o código com um amigo. Quem acertar mais perguntas vence!
                </p>
              </div>

              {[
                { icon: "🎯", label: "Criar Desafio", sub: "Gere um código e desafie alguém", action: () => setView("create"), color: "#7C3AED" },
                { icon: "🔑", label: "Entrar com Código", sub: "Use o código de um amigo", action: () => setView("join"), color: "#2563EB" },
                { icon: "📋", label: "Meus Duelos", sub: "Ver histórico e resultados", action: () => setView("my_duels"), color: "#059669" },
              ].map((item) => (
                <motion.button
                  key={item.label}
                  onClick={item.action}
                  className="w-full rounded-2xl p-4 flex items-center gap-4 text-left"
                  style={{ background: `${item.color}20`, border: `1px solid ${item.color}40` }}
                  whileHover={{ scale: 1.02, background: `${item.color}30` }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="text-3xl">{item.icon}</span>
                  <div>
                    <p className="text-white font-bold">{item.label}</p>
                    <p className="text-white/50 text-xs">{item.sub}</p>
                  </div>
                  <span className="ml-auto text-white/40">›</span>
                </motion.button>
              ))}
            </motion.div>
          )}

          {/* CREATE */}
          {view === "create" && (
            <motion.div
              key="create"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="pt-4"
            >
              {!createdCode ? (
                <>
                  <h2 className="text-white font-bold text-lg mb-4" style={{ fontFamily: "'Fredoka One', cursive" }}>
                    Escolha a Disciplina
                  </h2>
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {Object.entries(disciplineNames).map(([key, name]) => (
                      <motion.button
                        key={key}
                        onClick={() => setSelectedDiscipline(key)}
                        className="rounded-2xl p-4 text-center"
                        style={{
                          background: selectedDiscipline === key ? "rgba(124,58,237,0.4)" : "rgba(255,255,255,0.06)",
                          border: selectedDiscipline === key ? "2px solid #7C3AED" : "1px solid rgba(255,255,255,0.1)",
                        }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <div className="text-2xl mb-1">{disciplineEmojis[key]}</div>
                        <p className="text-white text-xs font-semibold">{name}</p>
                      </motion.button>
                    ))}
                  </div>
                  <motion.button
                    onClick={handleCreate}
                    disabled={createMutation.isPending}
                    className="w-full rounded-2xl py-4 font-bold text-white text-lg"
                    style={{ background: "linear-gradient(135deg, #7C3AED, #4F46E5)" }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {createMutation.isPending ? "Criando..." : "🎯 Criar Desafio"}
                  </motion.button>
                </>
              ) : (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center pt-8"
                >
                  <div className="text-6xl mb-4">🎉</div>
                  <h2 className="text-white font-bold text-xl mb-2" style={{ fontFamily: "'Fredoka One', cursive" }}>
                    Desafio Criado!
                  </h2>
                  <p className="text-white/60 text-sm mb-6">Compartilhe este código com seu amigo:</p>
                  <div
                    className="rounded-3xl p-6 mb-4"
                    style={{ background: "rgba(124,58,237,0.2)", border: "2px solid #7C3AED" }}
                  >
                    <p className="text-yellow-400 font-mono font-bold text-4xl tracking-widest">{createdCode}</p>
                  </div>
                  <motion.button
                    onClick={() => copyCode(createdCode)}
                    className="w-full rounded-2xl py-3 font-bold text-white mb-3"
                    style={{ background: "linear-gradient(135deg, #7C3AED, #4F46E5)" }}
                    whileTap={{ scale: 0.95 }}
                  >
                    📋 Copiar Código
                  </motion.button>
                  <p className="text-white/40 text-xs">O código expira em 24 horas</p>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* JOIN */}
          {view === "join" && (
            <motion.div
              key="join"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="pt-4"
            >
              {!joinedDuelId ? (
                <>
                  <h2 className="text-white font-bold text-lg mb-4" style={{ fontFamily: "'Fredoka One', cursive" }}>
                    Digite o Código do Desafio
                  </h2>
                  <div
                    className="rounded-2xl p-4 mb-4"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                  >
                    <input
                      type="text"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      placeholder="Ex: ABC123"
                      maxLength={8}
                      className="w-full bg-transparent text-white text-center font-mono text-3xl font-bold tracking-widest outline-none placeholder:text-white/20"
                    />
                  </div>
                  <motion.button
                    onClick={handleJoin}
                    disabled={!joinCode.trim() || joinMutation.isPending}
                    className="w-full rounded-2xl py-4 font-bold text-white text-lg disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg, #2563EB, #1D4ED8)" }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {joinMutation.isPending ? "Entrando..." : "🔑 Entrar no Desafio"}
                  </motion.button>
                </>
              ) : (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center pt-8"
                >
                  <div className="text-6xl mb-4">⚔️</div>
                  <h2 className="text-white font-bold text-xl mb-2" style={{ fontFamily: "'Fredoka One', cursive" }}>
                    Desafio Aceito!
                  </h2>
                  <p className="text-white/60 text-sm mb-6">
                    Você entrou no duelo. Agora faça o quiz e envie seu resultado!
                  </p>
                  <motion.button
                    onClick={onBack}
                    className="w-full rounded-2xl py-3 font-bold text-white"
                    style={{ background: "linear-gradient(135deg, #059669, #047857)" }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Ir para o Mapa e Jogar
                  </motion.button>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* MY DUELS */}
          {view === "my_duels" && (
            <motion.div
              key="my_duels"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="pt-4"
            >
              <h2 className="text-white font-bold text-lg mb-4" style={{ fontFamily: "'Fredoka One', cursive" }}>
                Meus Duelos
              </h2>
              {!myDuelsData ? (
                <div className="text-center py-10">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-10 h-10 border-4 border-purple-400 border-t-transparent rounded-full mx-auto"
                  />
                </div>
              ) : myDuelsData.duels.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-4xl mb-3">⚔️</p>
                  <p className="text-white/60 text-sm">Nenhum duelo ainda.</p>
                  <p className="text-white/40 text-xs mt-1">Crie ou entre em um desafio!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myDuelsData.duels.map((duel) => (
                    <motion.div
                      key={duel.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="rounded-2xl p-4"
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{disciplineEmojis[duel.discipline ?? ""] ?? "⚔️"}</span>
                          <span className="text-white font-semibold text-sm">
                            {disciplineNames[duel.discipline ?? ""] ?? "Duelo"}
                          </span>
                        </div>
                        <span
                          className="text-xs font-bold px-2 py-1 rounded-full"
                          style={{ background: `${statusColor[duel.status]}20`, color: statusColor[duel.status] }}
                        >
                          {statusLabel[duel.status]}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-white/40 text-xs">Código:</span>
                          <span className="text-yellow-400 font-mono font-bold text-sm">{duel.code}</span>
                        </div>
                        <button
                          onClick={() => copyCode(duel.code)}
                          className="text-white/40 text-xs hover:text-white/70"
                        >
                          📋 Copiar
                        </button>
                      </div>
                      <p className="text-white/30 text-xs mt-1">
                        {duel.challengerId === myDuelsData.myPlayerId ? "👑 Você criou" : "🎯 Você entrou"}
                      </p>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
