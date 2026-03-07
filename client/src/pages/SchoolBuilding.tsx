import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { useGame } from "@/contexts/GameContext";
import {
  ArrowLeft,
  BookOpen,
  Plus,
  Zap,
  CheckCircle,
  Clock,
  AlertCircle,
  Pencil,
  ChevronRight,
  School,
  Trophy,
  Share2,
  Users,
  Copy,
  LogIn,
} from "lucide-react";
import { toast } from "sonner";

type Props = {
  onBack: () => void;
  onEnterRoom: (materialId: number, title: string) => void;
  onAddMaterial: () => void;
};

const DISCIPLINE_COLORS: Record<string, { bg: string; color: string; emoji: string }> = {
  matematica:   { bg: "from-red-400 to-orange-400",    color: "#FF6B6B", emoji: "🔢" },
  portugues:    { bg: "from-teal-400 to-cyan-400",     color: "#4ECDC4", emoji: "📖" },
  geografia:    { bg: "from-blue-400 to-indigo-400",   color: "#45B7D1", emoji: "🌍" },
  historia:     { bg: "from-yellow-400 to-amber-400",  color: "#F7DC6F", emoji: "🏛️" },
  ciencias:     { bg: "from-green-400 to-emerald-400", color: "#A8E6CF", emoji: "🔬" },
  default:      { bg: "from-violet-400 to-purple-500", color: "#7C3AED", emoji: "📚" },
};

function getDisciplineInfo(discipline?: string | null) {
  if (!discipline) return DISCIPLINE_COLORS.default;
  return DISCIPLINE_COLORS[discipline] ?? DISCIPLINE_COLORS.default;
}

function StatusBadge({ status }: { status: string }) {
  if (status === "ready") {
    return (
      <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
        <CheckCircle className="w-3 h-3" /> Pronto
      </span>
    );
  }
  if (status === "analyzing") {
    return (
      <span className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
          <Clock className="w-3 h-3" />
        </motion.div>
        Analisando...
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
        <AlertCircle className="w-3 h-3" /> Erro
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
      <Clock className="w-3 h-3" /> Pendente
    </span>
  );
}

function Classroom3D({
  material,
  index,
  onClick,
}: {
  material: { id: number; title: string; discipline?: string | null; status: string; questionsGenerated: number };
  index: number;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const info = getDisciplineInfo(material.discipline);
  const isReady = material.status === "ready";

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="relative cursor-pointer"
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onClick={isReady ? onClick : undefined}
      style={{ opacity: isReady ? 1 : 0.75 }}
    >
      <motion.div
        animate={{ y: hovered && isReady ? -6 : 0, scale: hovered && isReady ? 1.02 : 1 }}
        transition={{ type: "spring", stiffness: 300 }}
        className="bg-white rounded-2xl shadow-lg overflow-hidden border-2"
        style={{ borderColor: isReady ? info.color : "#e5e7eb" }}
      >
        {/* Door/Room visual */}
        <div className={`bg-gradient-to-br ${info.bg} p-4 relative overflow-hidden`}>
          {/* Isometric room illustration */}
          <div className="flex items-center justify-between">
            <div className="text-4xl">{info.emoji}</div>
            <div className="text-right">
              <div className="text-white/90 text-xs font-semibold uppercase tracking-wide">
                {material.discipline ?? "Geral"}
              </div>
              {isReady && (
                <div className="text-white text-sm font-black mt-0.5">
                  {material.questionsGenerated} questões
                </div>
              )}
            </div>
          </div>

          {/* Door frame decoration */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-12 bg-white/20 rounded-t-xl border-t-2 border-x-2 border-white/40" />

          {/* Animated glow when hovered */}
          {hovered && isReady && (
            <motion.div
              className="absolute inset-0 bg-white/10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            />
          )}
        </div>

        {/* Info section */}
        <div className="p-3">
          <h3 className="font-black text-gray-800 text-sm leading-tight line-clamp-2 mb-2">
            {material.title}
          </h3>
          <div className="flex items-center justify-between">
            <StatusBadge status={material.status} />
            {isReady && (
              <motion.div
                animate={{ x: hovered ? 3 : 0 }}
                className="flex items-center gap-1 text-xs font-bold"
                style={{ color: info.color }}
              >
                Entrar <ChevronRight className="w-3 h-3" />
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Locked overlay */}
      {!isReady && material.status === "analyzing" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="bg-amber-500 text-white text-xs font-black px-2 py-1 rounded-full shadow"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            IA analisando...
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

function RankingModal({ materialId, materialTitle, onClose }: { materialId: number; materialTitle: string; onClose: () => void }) {
  const rankingQuery = trpc.ranking.getByMaterial.useQuery({ materialId });
  const entries = rankingQuery.data?.entries ?? [];
  const medals = ["🥇", "🥈", "🥉"];
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white rounded-t-3xl w-full max-w-md p-5 pb-8"
        initial={{ y: 300 }} animate={{ y: 0 }} exit={{ y: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-black text-gray-800 text-lg flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" /> Ranking — {materialTitle}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
        </div>
        {rankingQuery.isLoading ? (
          <div className="flex justify-center py-8"><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}><Trophy className="w-8 h-8 text-yellow-400" /></motion.div></div>
        ) : entries.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-5xl mb-3">🏆</div>
            <p className="text-gray-500 font-semibold">Nenhum resultado ainda.</p>
            <p className="text-gray-400 text-sm">Seja o primeiro a completar este quiz!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map((entry, i) => (
              <motion.div
                key={entry.id}
                className={`flex items-center gap-3 p-3 rounded-2xl ${
                  i === 0 ? "bg-yellow-50 border-2 border-yellow-200" :
                  i === 1 ? "bg-gray-50 border-2 border-gray-200" :
                  i === 2 ? "bg-orange-50 border-2 border-orange-200" :
                  "bg-white border border-gray-100"
                }`}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: i * 0.07 }}
              >
                <span className="text-2xl w-8 text-center">{medals[i] ?? `#${i + 1}`}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-gray-800 text-sm truncate">{entry.nickname ?? "Jogador"}</p>
                  <p className="text-xs text-gray-400">{entry.correctAnswers}/{entry.totalQuestions} acertos</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-lg" style={{ color: i === 0 ? "#F59E0B" : i === 1 ? "#6B7280" : i === 2 ? "#EA580C" : "#7C3AED" }}>
                    {entry.score}
                  </p>
                  <p className="text-xs text-gray-400">pts</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function ClassCodeModal({ onClose, sessionId }: { onClose: () => void; sessionId: string }) {
  const [mode, setMode] = useState<"menu" | "generate" | "join">("menu");
  const [selectedMaterialId, setSelectedMaterialId] = useState<number | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const materialsQuery = trpc.studyMaterial.list.useQuery({ sessionId });
  const generateMutation = trpc.classCode.generate.useMutation();
  const joinMutation = trpc.classCode.join.useMutation();
  const utils = trpc.useUtils();
  const readyMaterials = (materialsQuery.data?.materials ?? []).filter((m) => m.status === "ready");

  const handleGenerate = async () => {
    if (!selectedMaterialId) return;
    try {
      const result = await generateMutation.mutateAsync({ sessionId, materialId: selectedMaterialId });
      setGeneratedCode(result.code);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao gerar código");
    }
  };

  const handleJoin = async () => {
    if (joinCode.trim().length < 4) { toast.error("Digite um código válido"); return; }
    try {
      const result = await joinMutation.mutateAsync({ sessionId, code: joinCode.trim() });
      toast.success(`Sala "${result.title}" adicionada ao seu prédio! 🎉`);
      utils.studyMaterial.list.invalidate();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Código inválido ou expirado");
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white rounded-t-3xl w-full max-w-md p-5 pb-8"
        initial={{ y: 300 }} animate={{ y: 0 }} exit={{ y: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-black text-gray-800 text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-violet-500" /> Código de Turma
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
        </div>

        {mode === "menu" && (
          <div className="space-y-3">
            <motion.button
              className="w-full p-4 rounded-2xl bg-violet-50 border-2 border-violet-200 text-left flex items-center gap-3"
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => setMode("generate")}
            >
              <Share2 className="w-8 h-8 text-violet-500" />
              <div>
                <p className="font-black text-gray-800">Compartilhar Material</p>
                <p className="text-xs text-gray-500">Gere um código para sua turma estudar o mesmo material</p>
              </div>
            </motion.button>
            <motion.button
              className="w-full p-4 rounded-2xl bg-blue-50 border-2 border-blue-200 text-left flex items-center gap-3"
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => setMode("join")}
            >
              <LogIn className="w-8 h-8 text-blue-500" />
              <div>
                <p className="font-black text-gray-800">Entrar em Turma</p>
                <p className="text-xs text-gray-500">Digite o código do professor para acessar o material</p>
              </div>
            </motion.button>
          </div>
        )}

        {mode === "generate" && (
          <div>
            <button onClick={() => { setMode("menu"); setGeneratedCode(null); setSelectedMaterialId(null); }} className="text-violet-600 font-bold text-sm mb-4 flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> Voltar</button>
            {generatedCode ? (
              <div className="text-center">
                <div className="text-5xl mb-3">🎉</div>
                <p className="font-bold text-gray-600 mb-2">Código gerado!</p>
                <div className="bg-violet-50 border-2 border-violet-300 rounded-2xl p-4 mb-4">
                  <p className="font-black text-4xl text-violet-700 tracking-widest">{generatedCode}</p>
                </div>
                <motion.button
                  className="flex items-center gap-2 mx-auto bg-violet-600 text-white px-4 py-2 rounded-xl font-bold text-sm"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { navigator.clipboard.writeText(generatedCode); toast.success("Código copiado!"); }}
                >
                  <Copy className="w-4 h-4" /> Copiar Código
                </motion.button>
                <p className="text-xs text-gray-400 mt-3">Compartilhe este código com sua turma</p>
              </div>
            ) : (
              <div>
                <p className="font-bold text-gray-700 mb-3">Selecione o material para compartilhar:</p>
                {readyMaterials.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-4">Nenhum material pronto para compartilhar</p>
                ) : (
                  <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                    {readyMaterials.map((m) => (
                      <motion.button
                        key={m.id}
                        className={`w-full p-3 rounded-xl text-left border-2 transition-all ${
                          selectedMaterialId === m.id ? "border-violet-400 bg-violet-50" : "border-gray-200 bg-white"
                        }`}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedMaterialId(m.id)}
                      >
                        <p className="font-bold text-gray-800 text-sm">{m.title}</p>
                        <p className="text-xs text-gray-400">{m.questionsGenerated} questões</p>
                      </motion.button>
                    ))}
                  </div>
                )}
                <motion.button
                  className={`w-full py-3 rounded-2xl font-black text-white ${ selectedMaterialId ? "bg-violet-600" : "bg-gray-300 cursor-not-allowed" }`}
                  whileTap={selectedMaterialId ? { scale: 0.97 } : {}}
                  onClick={handleGenerate}
                  disabled={!selectedMaterialId || generateMutation.isPending}
                >
                  {generateMutation.isPending ? "Gerando..." : "Gerar Código"}
                </motion.button>
              </div>
            )}
          </div>
        )}

        {mode === "join" && (
          <div>
            <button onClick={() => setMode("menu")} className="text-violet-600 font-bold text-sm mb-4 flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> Voltar</button>
            <p className="font-bold text-gray-700 mb-3">Digite o código da turma:</p>
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Ex: AB3C7X"
              maxLength={8}
              className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-violet-400 outline-none text-center text-2xl font-black tracking-widest text-violet-700 mb-4"
            />
            <motion.button
              className={`w-full py-3 rounded-2xl font-black text-white ${ joinCode.trim().length >= 4 ? "bg-blue-600" : "bg-gray-300 cursor-not-allowed" }`}
              whileTap={joinCode.trim().length >= 4 ? { scale: 0.97 } : {}}
              onClick={handleJoin}
              disabled={joinCode.trim().length < 4 || joinMutation.isPending}
            >
              {joinMutation.isPending ? "Entrando..." : "Entrar na Turma"}
            </motion.button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

export default function SchoolBuilding({ onBack, onEnterRoom, onAddMaterial }: Props) {
  const { player, sessionId } = useGame();
  const [editingName, setEditingName] = useState(false);
  const [schoolNameInput, setSchoolNameInput] = useState("");
  const [rankingMaterial, setRankingMaterial] = useState<{ id: number; title: string } | null>(null);
  const [showClassCode, setShowClassCode] = useState(false);

  const materialsQuery = trpc.studyMaterial.list.useQuery({ sessionId });
  const updateSchoolName = trpc.player.updateSchoolName.useMutation({
    onSuccess: () => {
      setEditingName(false);
      // Refresh is handled by parent via GameContext
    },
  });

  const schoolName = player?.schoolName ?? null;
  const materials = materialsQuery.data?.materials ?? [];

  const handleSaveSchoolName = () => {
    if (!schoolNameInput.trim()) return;
    updateSchoolName.mutate({ sessionId, schoolName: schoolNameInput.trim() });
  };

  return (
    <>
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "linear-gradient(180deg, #7C3AED22 0%, #f8f9ff 30%)" }}
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
            <School className="w-5 h-5 text-violet-600" />
            <span className="font-black text-gray-800 text-lg">Meu Prédio</span>
          </div>
          <p className="text-xs text-gray-500">Salas criadas com seus materiais</p>
        </div>
        <div className="flex items-center gap-1 bg-white rounded-xl px-3 py-1.5 shadow">
          <Zap className="w-4 h-4 text-yellow-500" />
          <span className="font-black text-gray-800">{player?.totalPoints ?? 0}</span>
        </div>
      </div>

      {/* Building facade */}
      <div className="px-4 mb-4">
        <motion.div
          className="relative rounded-3xl overflow-hidden shadow-xl"
          style={{ background: "linear-gradient(135deg, #7C3AED, #4F46E5)" }}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          {/* Building top decoration */}
          <div className="p-5 text-center relative">
            {/* Windows decoration */}
            <div className="absolute top-3 left-4 flex gap-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-5 h-6 bg-yellow-300/80 rounded-sm border border-yellow-400/50"
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
                />
              ))}
            </div>
            <div className="absolute top-3 right-4 flex gap-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-5 h-6 bg-yellow-300/80 rounded-sm border border-yellow-400/50"
                  animate={{ opacity: [1, 0.7, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                />
              ))}
            </div>

            {/* School name */}
            <div className="mt-2">
              {!editingName && !schoolName && (
                <motion.button
                  className="flex items-center gap-2 mx-auto bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl font-bold text-sm"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    setSchoolNameInput("");
                    setEditingName(true);
                  }}
                >
                  <Pencil className="w-4 h-4" />
                  Dar nome ao seu prédio
                </motion.button>
              )}

              {!editingName && schoolName && (
                <div className="flex items-center justify-center gap-2">
                  <h2 className="text-white font-black text-xl drop-shadow">{schoolName}</h2>
                  <motion.button
                    className="text-white/70 hover:text-white"
                    whileHover={{ scale: 1.1 }}
                    onClick={() => {
                      setSchoolNameInput(schoolName);
                      setEditingName(true);
                    }}
                  >
                    <Pencil className="w-4 h-4" />
                  </motion.button>
                </div>
              )}

              {editingName && (
                <motion.div
                  className="flex items-center gap-2 justify-center"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <input
                    autoFocus
                    value={schoolNameInput}
                    onChange={(e) => setSchoolNameInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSaveSchoolName()}
                    placeholder="Ex: Escola Municipal João Silva"
                    maxLength={64}
                    className="bg-white/20 text-white placeholder-white/50 border border-white/40 rounded-xl px-3 py-2 text-sm font-bold w-52 focus:outline-none focus:bg-white/30"
                  />
                  <motion.button
                    className="bg-white text-violet-700 px-3 py-2 rounded-xl text-sm font-black"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSaveSchoolName}
                    disabled={updateSchoolName.isPending}
                  >
                    {updateSchoolName.isPending ? "..." : "Salvar"}
                  </motion.button>
                  <motion.button
                    className="text-white/70 hover:text-white text-sm"
                    onClick={() => setEditingName(false)}
                  >
                    ✕
                  </motion.button>
                </motion.div>
              )}
            </div>

            {/* Stats row */}
            <div className="flex justify-center gap-4 mt-3">
              <div className="text-center">
                <p className="text-white font-black text-lg">{materials.length}</p>
                <p className="text-white/70 text-xs">Salas</p>
              </div>
              <div className="w-px bg-white/30" />
              <div className="text-center">
                <p className="text-white font-black text-lg">
                  {materials.filter((m) => m.status === "ready").length}
                </p>
                <p className="text-white/70 text-xs">Prontas</p>
              </div>
              <div className="w-px bg-white/30" />
              <div className="text-center">
                <p className="text-white font-black text-lg">
                  {materials.reduce((acc, m) => acc + (m.questionsGenerated ?? 0), 0)}
                </p>
                <p className="text-white/70 text-xs">Questões</p>
              </div>
            </div>
          </div>

          {/* Ground */}
          <div className="h-3 bg-violet-900/40" />
        </motion.div>
      </div>

        {/* Rooms grid */}
      <div className="flex-1 px-4 pb-6">
        {/* Action buttons row */}
        <div className="flex items-center gap-2 mb-3">
          <h3 className="font-black text-gray-700 text-base flex-1">Salas de Estudo</h3>
          <motion.button
            className="flex items-center gap-1.5 bg-amber-500 text-white px-3 py-1.5 rounded-xl text-sm font-bold shadow"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowClassCode(true)}
          >
            <Users className="w-4 h-4" />
            Turma
          </motion.button>
          <motion.button
            className="flex items-center gap-1.5 bg-violet-600 text-white px-3 py-1.5 rounded-xl text-sm font-bold shadow"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onAddMaterial}
          >
            <Plus className="w-4 h-4" />
            Nova Sala
          </motion.button>
        </div>

        {materialsQuery.isLoading ? (
          <div className="flex justify-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <BookOpen className="w-8 h-8 text-violet-400" />
            </motion.div>
          </div>
        ) : materials.length === 0 ? (
          <motion.div
            className="text-center py-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="text-6xl mb-4">🏫</div>
            <h4 className="font-black text-gray-700 text-lg mb-2">Prédio vazio!</h4>
            <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">
              Adicione o material da sua escola para criar salas de estudo personalizadas
            </p>
            <motion.button
              className="flex items-center gap-2 mx-auto bg-violet-600 text-white px-6 py-3 rounded-2xl font-black shadow-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onAddMaterial}
            >
              <Plus className="w-5 h-5" />
              Criar primeira sala
            </motion.button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {materials.map((material, i) => (
              <div key={material.id} className="relative">
                <Classroom3D
                  material={material}
                  index={i}
                  onClick={() => onEnterRoom(material.id, material.title)}
                />
                {material.status === "ready" && (
                  <motion.button
                    className="absolute top-2 right-2 w-7 h-7 bg-yellow-400 rounded-full flex items-center justify-center shadow-md z-10"
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => { e.stopPropagation(); setRankingMaterial({ id: material.id, title: material.title }); }}
                    title="Ver Ranking"
                  >
                    <Trophy className="w-3.5 h-3.5 text-white" />
                  </motion.button>
                )}
              </div>
            ))}

            {/* Add new room card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: materials.length * 0.1 }}
              className="cursor-pointer"
              onClick={onAddMaterial}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="bg-white rounded-2xl shadow border-2 border-dashed border-violet-300 h-full min-h-[140px] flex flex-col items-center justify-center gap-2 text-violet-400 hover:border-violet-500 hover:text-violet-600 transition-colors">
                <Plus className="w-8 h-8" />
                <span className="text-xs font-bold">Nova Sala</span>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>

      {/* Modals */}
      <AnimatePresence>
        {rankingMaterial && (
          <RankingModal
            materialId={rankingMaterial.id}
            materialTitle={rankingMaterial.title}
            onClose={() => setRankingMaterial(null)}
          />
        )}
        {showClassCode && (
          <ClassCodeModal
            sessionId={sessionId}
            onClose={() => setShowClassCode(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
