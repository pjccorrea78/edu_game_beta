import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { useGame } from "@/contexts/GameContext";
import { toast } from "sonner";
import QuizScreen from "@/pages/QuizScreen";

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

type Discipline = "matematica" | "portugues" | "geografia" | "historia" | "ciencias" | "educacao_fisica" | "arte" | "ensino_religioso";
type DuelView = "menu" | "create" | "join" | "my_duels" | "playing" | "result";

export default function DuelChallenge({ onBack }: { onBack: () => void }) {
  const { sessionId } = useGame();
  const [view, setView] = useState<DuelView>("menu");
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>("matematica");
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [activeDuelId, setActiveDuelId] = useState<number | null>(null);
  const [activeDuelDiscipline, setActiveDuelDiscipline] = useState<string | null>(null);
  const [viewingResultDuelId, setViewingResultDuelId] = useState<number | null>(null);

  const createMutation = trpc.duel.create.useMutation({
    onSuccess: (data) => { setCreatedCode(data.code); },
    onError: (err) => toast.error(err.message),
  });

  const joinMutation = trpc.duel.join.useMutation({
    onSuccess: (data) => {
      const duel = data.duel;
      setActiveDuelId(duel.id);
      setActiveDuelDiscipline(duel.discipline ?? "matematica");
      toast.success("Desafio encontrado! Começando quiz...");
      setView("playing");
    },
    onError: (err) => toast.error(err.message),
  });

  const submitResultMutation = trpc.duel.submitResult.useMutation({
    onSuccess: () => { toast.success("Resultado enviado!"); },
    onError: (err) => toast.error(err.message),
  });

  const { data: myDuelsData, refetch: refetchDuels } = trpc.duel.myDuels.useQuery(
    { sessionId },
    { enabled: view === "my_duels" }
  );

  const { data: duelResultData } = trpc.duel.getResult.useQuery(
    { sessionId, duelId: viewingResultDuelId! },
    { enabled: view === "result" && !!viewingResultDuelId }
  );

  const handleCreate = () => {
    createMutation.mutate({ sessionId, quizType: "discipline", discipline: selectedDiscipline as Discipline });
  };

  const handleJoin = () => {
    if (!joinCode.trim()) return;
    joinMutation.mutate({ sessionId, code: joinCode.trim().toUpperCase() });
  };

  const handleStartCreatedDuel = () => {
    if (createMutation.data?.duel) {
      setActiveDuelId(createMutation.data.duel.id);
      setActiveDuelDiscipline(selectedDiscipline);
      setView("playing");
    }
  };

  const handleQuizFinish = (result?: { score: number; correctAnswers: number; wrongAnswers: number }) => {
    if (!result || !activeDuelId) { setView("menu"); return; }
    submitResultMutation.mutate({
      sessionId, duelId: activeDuelId, score: result.score,
      correctAnswers: result.correctAnswers, totalQuestions: result.correctAnswers + result.wrongAnswers,
    });
    setViewingResultDuelId(activeDuelId);
    setView("result");
  };

  const copyCode = (code: string) => { navigator.clipboard.writeText(code); toast.success("Código copiado!"); };

  const statusLabel: Record<string, string> = { waiting: "⏳ Aguardando", in_progress: "⚔️ Em andamento", completed: "✅ Concluído" };
  const statusColor: Record<string, string> = { waiting: "#F59E0B", in_progress: "#3B82F6", completed: "#10B981" };

  // ── PLAYING QUIZ ──
  if (view === "playing" && activeDuelDiscipline) {
    return (
      <QuizScreen
        discipline={activeDuelDiscipline as Discipline}
        onFinish={handleQuizFinish}
        onBack={() => { setView("menu"); setActiveDuelId(null); }}
      />
    );
  }

  // ── RESULT COMPARISON ──
  if (view === "result" && viewingResultDuelId) {
    const results = duelResultData?.results ?? [];
    const duel = duelResultData?.duel;
    const myId = duelResultData?.myPlayerId;
    const myResult = results.find((r: any) => r.playerId === myId);
    const opponentResult = results.find((r: any) => r.playerId !== myId);
    const discipline = duel?.discipline ?? "";

    return (
      <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(160deg, #1e0533, #2d1b69, #0f172a)" }}>
        <div className="flex items-center justify-between p-4 pt-6">
          <motion.button onClick={() => { setView("menu"); setViewingResultDuelId(null); }} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white text-xl" whileTap={{ scale: 0.9 }}>←</motion.button>
          <div className="text-center">
            <h1 className="text-white font-bold text-xl" style={{ fontFamily: "'Fredoka One', cursive" }}>⚔️ Resultado do Duelo</h1>
            <p className="text-white/50 text-xs">{disciplineNames[discipline] ?? discipline}</p>
          </div>
          <div className="w-10" />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-4 pb-8">
          {results.length < 2 ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
              <div className="text-6xl mb-4">⏳</div>
              <h2 className="text-white font-bold text-xl mb-2" style={{ fontFamily: "'Fredoka One', cursive" }}>Aguardando oponente...</h2>
              <p className="text-white/60 text-sm mb-4">Seu resultado foi salvo! Quando o oponente completar, o resultado aparecerá aqui.</p>
              {myResult && (
                <div className="rounded-2xl p-4 mb-6" style={{ background: "rgba(124,58,237,0.3)", border: "1px solid rgba(124,58,237,0.5)" }}>
                  <p className="text-white/80 text-sm">Sua pontuação</p>
                  <p className="text-yellow-400 font-bold text-3xl">{(myResult as any).score} pts</p>
                  <p className="text-white/50 text-xs">{(myResult as any).correctAnswers}/{(myResult as any).totalQuestions} acertos</p>
                </div>
              )}
              <motion.button onClick={() => { setView("menu"); setViewingResultDuelId(null); }} className="px-6 py-3 rounded-2xl font-bold text-white" style={{ background: "linear-gradient(135deg, #7C3AED, #4F46E5)" }} whileTap={{ scale: 0.95 }}>Voltar ao Menu</motion.button>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm">
              {(() => {
                const myScore = (myResult as any)?.score ?? 0;
                const oppScore = (opponentResult as any)?.score ?? 0;
                const won = myScore > oppScore;
                const tied = myScore === oppScore;
                return (
                  <div className="text-center mb-6">
                    <motion.div className="text-6xl mb-2" animate={won ? { rotate: [0, -10, 10, 0], scale: [1, 1.2, 1] } : {}} transition={{ duration: 0.6 }}>
                      {won ? "🏆" : tied ? "🤝" : "😢"}
                    </motion.div>
                    <h2 className="font-bold text-2xl mb-1" style={{ color: won ? "#FFD700" : tied ? "#A78BFA" : "#EF4444", fontFamily: "'Fredoka One', cursive" }}>
                      {won ? "Você Venceu!" : tied ? "Empate!" : "Você Perdeu!"}
                    </h2>
                  </div>
                );
              })()}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {[myResult, opponentResult].map((r, idx) => {
                  const isMe = idx === 0;
                  const res = r as any;
                  if (!res) return null;
                  return (
                    <motion.div key={idx} initial={{ opacity: 0, x: isMe ? -20 : 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.2 }}
                      className="rounded-2xl p-4 text-center"
                      style={{ background: isMe ? "rgba(124,58,237,0.3)" : "rgba(255,255,255,0.08)", border: `2px solid ${isMe ? "#7C3AED" : "rgba(255,255,255,0.15)"}` }}>
                      <div className="text-2xl mb-2">{isMe ? "🎮" : "⚔️"}</div>
                      <p className="text-white font-bold text-sm truncate mb-2">{res.nickname ?? (isMe ? "Você" : "Oponente")}</p>
                      <p className="text-yellow-400 font-bold text-2xl">{res.score}</p>
                      <p className="text-white/50 text-xs">pontos</p>
                      <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${res.totalQuestions > 0 ? (res.correctAnswers / res.totalQuestions) * 100 : 0}%`, background: isMe ? "#7C3AED" : "#3B82F6" }} />
                      </div>
                      <p className="text-white/40 text-xs mt-1">{res.correctAnswers}/{res.totalQuestions} acertos</p>
                    </motion.div>
                  );
                })}
              </div>
              <motion.button onClick={() => { setView("menu"); setViewingResultDuelId(null); }} className="w-full py-3 rounded-2xl font-bold text-white" style={{ background: "linear-gradient(135deg, #7C3AED, #4F46E5)" }} whileTap={{ scale: 0.95 }}>Voltar ao Menu</motion.button>
            </motion.div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(160deg, #1e0533, #2d1b69, #0f172a)" }}>
      <div className="flex items-center justify-between p-4 pt-6">
        <motion.button onClick={view === "menu" ? onBack : () => { setView("menu"); setCreatedCode(null); setActiveDuelId(null); }} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white text-xl" whileTap={{ scale: 0.9 }}>←</motion.button>
        <div className="text-center">
          <h1 className="text-white font-bold text-xl" style={{ fontFamily: "'Fredoka One', cursive" }}>⚔️ Duelo de Sabedoria</h1>
          <p className="text-white/50 text-xs">Desafie seus amigos!</p>
        </div>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-8">
        <AnimatePresence mode="wait">
          {view === "menu" && (
            <motion.div key="menu" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="pt-4 space-y-4">
              <div className="rounded-3xl p-6 text-center mb-2" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <p className="text-4xl mb-2">⚔️</p>
                <p className="text-white text-sm leading-relaxed" style={{ fontFamily: "'Nunito', sans-serif" }}>Crie um desafio e compartilhe o código com um amigo. Quem acertar mais perguntas vence!</p>
              </div>
              {[
                { icon: "🎯", label: "Criar Desafio", sub: "Gere um código e desafie alguém", action: () => setView("create"), color: "#7C3AED" },
                { icon: "🔑", label: "Entrar com Código", sub: "Use o código de um amigo", action: () => setView("join"), color: "#2563EB" },
                { icon: "📋", label: "Meus Duelos", sub: "Ver histórico e resultados", action: () => { setView("my_duels"); refetchDuels(); }, color: "#059669" },
              ].map((item) => (
                <motion.button key={item.label} onClick={item.action} className="w-full rounded-2xl p-4 flex items-center gap-4 text-left" style={{ background: `${item.color}20`, border: `1px solid ${item.color}40` }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <span className="text-3xl">{item.icon}</span>
                  <div><p className="text-white font-bold">{item.label}</p><p className="text-white/50 text-xs">{item.sub}</p></div>
                  <span className="ml-auto text-white/40">›</span>
                </motion.button>
              ))}
            </motion.div>
          )}

          {view === "create" && (
            <motion.div key="create" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="pt-4">
              {!createdCode ? (
                <>
                  <h2 className="text-white font-bold text-lg mb-4" style={{ fontFamily: "'Fredoka One', cursive" }}>Escolha a Disciplina</h2>
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {Object.entries(disciplineNames).map(([key, name]) => (
                      <motion.button key={key} onClick={() => setSelectedDiscipline(key)} className="rounded-2xl p-4 text-center"
                        style={{ background: selectedDiscipline === key ? "rgba(124,58,237,0.4)" : "rgba(255,255,255,0.06)", border: selectedDiscipline === key ? "2px solid #7C3AED" : "1px solid rgba(255,255,255,0.1)" }} whileTap={{ scale: 0.95 }}>
                        <div className="text-2xl mb-1">{disciplineEmojis[key]}</div>
                        <p className="text-white text-xs font-semibold">{name}</p>
                      </motion.button>
                    ))}
                  </div>
                  <motion.button onClick={handleCreate} disabled={createMutation.isPending} className="w-full rounded-2xl py-4 font-bold text-white text-lg" style={{ background: "linear-gradient(135deg, #7C3AED, #4F46E5)" }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    {createMutation.isPending ? "Criando..." : "🎯 Criar Desafio"}
                  </motion.button>
                </>
              ) : (
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center pt-8">
                  <div className="text-6xl mb-4">🎉</div>
                  <h2 className="text-white font-bold text-xl mb-2" style={{ fontFamily: "'Fredoka One', cursive" }}>Desafio Criado!</h2>
                  <p className="text-white/60 text-sm mb-6">Compartilhe este código com seu amigo:</p>
                  <div className="rounded-3xl p-6 mb-4" style={{ background: "rgba(124,58,237,0.2)", border: "2px solid #7C3AED" }}>
                    <p className="text-yellow-400 font-mono font-bold text-4xl tracking-widest">{createdCode}</p>
                  </div>
                  <motion.button onClick={() => copyCode(createdCode)} className="w-full rounded-2xl py-3 font-bold text-white mb-3" style={{ background: "linear-gradient(135deg, #7C3AED, #4F46E5)" }} whileTap={{ scale: 0.95 }}>📋 Copiar Código</motion.button>
                  <motion.button onClick={handleStartCreatedDuel} className="w-full rounded-2xl py-3 font-bold text-white mb-3" style={{ background: "linear-gradient(135deg, #059669, #047857)" }} whileTap={{ scale: 0.95 }}>🎮 Jogar Meu Quiz Agora</motion.button>
                  <p className="text-white/40 text-xs">O código expira em 24 horas</p>
                </motion.div>
              )}
            </motion.div>
          )}

          {view === "join" && (
            <motion.div key="join" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="pt-4">
              <h2 className="text-white font-bold text-lg mb-4" style={{ fontFamily: "'Fredoka One', cursive" }}>Digite o Código do Desafio</h2>
              <div className="rounded-2xl p-4 mb-4" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <input type="text" value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} placeholder="Ex: ABC123" maxLength={8} className="w-full bg-transparent text-white text-center font-mono text-3xl font-bold tracking-widest outline-none placeholder:text-white/20" />
              </div>
              <motion.button onClick={handleJoin} disabled={!joinCode.trim() || joinMutation.isPending} className="w-full rounded-2xl py-4 font-bold text-white text-lg disabled:opacity-50" style={{ background: "linear-gradient(135deg, #2563EB, #1D4ED8)" }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                {joinMutation.isPending ? "Entrando..." : "🔑 Entrar e Jogar"}
              </motion.button>
            </motion.div>
          )}

          {view === "my_duels" && (
            <motion.div key="my_duels" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="pt-4">
              <h2 className="text-white font-bold text-lg mb-4" style={{ fontFamily: "'Fredoka One', cursive" }}>Meus Duelos</h2>
              {!myDuelsData ? (
                <div className="text-center py-10">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-10 h-10 border-4 border-purple-400 border-t-transparent rounded-full mx-auto" />
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
                    <motion.div key={duel.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{disciplineEmojis[duel.discipline ?? ""] ?? "⚔️"}</span>
                          <span className="text-white font-semibold text-sm">{disciplineNames[duel.discipline ?? ""] ?? "Duelo"}</span>
                        </div>
                        <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: `${statusColor[duel.status]}20`, color: statusColor[duel.status] }}>{statusLabel[duel.status]}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-white/40 text-xs">Código:</span>
                          <span className="text-yellow-400 font-mono font-bold text-sm">{duel.code}</span>
                        </div>
                        <button onClick={() => copyCode(duel.code)} className="text-white/40 text-xs hover:text-white/70">📋 Copiar</button>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-white/30 text-xs">{duel.challengerId === myDuelsData.myPlayerId ? "👑 Você criou" : "🎯 Você entrou"}</p>
                        {duel.status === "completed" && (
                          <motion.button onClick={() => { setViewingResultDuelId(duel.id); setView("result"); }} className="text-xs font-bold px-3 py-1 rounded-full text-white" style={{ background: "#7C3AED" }} whileTap={{ scale: 0.95 }}>📊 Ver Resultado</motion.button>
                        )}
                        {duel.status === "in_progress" && (
                          <motion.button onClick={() => { setActiveDuelId(duel.id); setActiveDuelDiscipline(duel.discipline ?? "matematica"); setView("playing"); }} className="text-xs font-bold px-3 py-1 rounded-full text-white" style={{ background: "#059669" }} whileTap={{ scale: 0.95 }}>🎮 Jogar</motion.button>
                        )}
                      </div>
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
