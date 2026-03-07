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
} from "lucide-react";

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

export default function SchoolBuilding({ onBack, onEnterRoom, onAddMaterial }: Props) {
  const { player, sessionId } = useGame();
  const [editingName, setEditingName] = useState(false);
  const [schoolNameInput, setSchoolNameInput] = useState("");

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
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-black text-gray-700 text-base">Salas de Estudo</h3>
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
              <Classroom3D
                key={material.id}
                material={material}
                index={i}
                onClick={() => onEnterRoom(material.id, material.title)}
              />
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
  );
}
