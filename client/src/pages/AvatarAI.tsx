import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { useGame } from "@/contexts/GameContext";
import BlockyAvatar from "@/components/BlockyAvatar";
import { Sparkles, ArrowLeft, Wand2, RefreshCw, Check, Lightbulb, History } from "lucide-react";
import { toast } from "sonner";

type Props = { onBack: () => void };

type GeneratedAvatar = {
  skinColor: string;
  hairColor: string;
  shirtColor: string;
  pantsColor: string;
  eyeColor: string;
  hatId: number | null;
  accessoryId: number | null;
  avatarName: string;
  aiDescription: string;
};

const HAT_LABELS: Record<number, string> = {
  1: "🤠 Chapéu Cowboy",
  2: "👑 Coroa",
  3: "🧢 Boné",
  4: "🧙 Chapéu Mago",
  5: "⛑️ Capacete",
};

const ACCESSORY_LABELS: Record<number, string> = {
  1: "🕶️ Óculos",
  2: "🦸 Capa",
  3: "🎒 Mochila",
};

const SUGGESTIONS = [
  "Um herói azul com coroa dourada e capa mágica",
  "Uma princesa rosa com óculos e mochila colorida",
  "Um cientista branco com capacete e jaleco azul",
  "Um ninja preto misterioso com boné vermelho",
  "Um explorador verde da floresta com chapéu cowboy",
  "Um mago roxo com chapéu pontudo e varinha",
  "Um super-herói vermelho e amarelo com capa",
  "Uma artista colorida com todas as cores do arco-íris",
];

export default function AvatarAI({ onBack }: Props) {
  const { sessionId, player, refreshPlayer } = useGame();
  const [description, setDescription] = useState("");
  const [generated, setGenerated] = useState<GeneratedAvatar | null>(null);
  const [history, setHistory] = useState<GeneratedAvatar[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; color: string }[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const generateMutation = trpc.avatarAI.generateFromDescription.useMutation();
  const applyMutation = trpc.avatarAI.applyGenerated.useMutation();

  const spawnParticles = () => {
    const colors = ["#FF6B6B", "#4ECDC4", "#FFE66D", "#A8E6CF", "#C3A6FF", "#FF9FF3"];
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
    setParticles(newParticles);
    setTimeout(() => setParticles([]), 2000);
  };

  const handleGenerate = async () => {
    if (!description.trim() || description.trim().length < 3) {
      toast.error("Descreva seu avatar com pelo menos 3 caracteres!");
      return;
    }
    setIsGenerating(true);
    try {
      const result = await generateMutation.mutateAsync({ sessionId, description });
      if (result.success && result.avatarConfig) {
        setGenerated(result.avatarConfig);
        setHistory(prev => [result.avatarConfig, ...prev].slice(0, 3));
        spawnParticles();
        toast.success(`Avatar "${result.avatarConfig.avatarName}" gerado pela IA! ✨`);
      }
    } catch (err) {
      toast.error("Erro ao gerar avatar. Tente novamente!");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApply = async () => {
    if (!generated) return;
    try {
      await applyMutation.mutateAsync({
        sessionId,
        skinColor: generated.skinColor,
        hairColor: generated.hairColor,
        shirtColor: generated.shirtColor,
        pantsColor: generated.pantsColor,
      });
      await refreshPlayer();
      spawnParticles();
      toast.success("Avatar aplicado com sucesso! 🎉");
      setTimeout(() => onBack(), 1200);
    } catch {
      toast.error("Erro ao aplicar avatar.");
    }
  };

  const currentConfig = player?.avatarConfig as {
    skinColor?: string; hairColor?: string; shirtColor?: string; pantsColor?: string;
  } | null;

  const previewConfig = generated
    ? { skinColor: generated.skinColor, hairColor: generated.hairColor, shirtColor: generated.shirtColor, pantsColor: generated.pantsColor }
    : {
        skinColor: currentConfig?.skinColor ?? "#FDBCB4",
        hairColor: currentConfig?.hairColor ?? "#4A2C2A",
        shirtColor: currentConfig?.shirtColor ?? "#4169E1",
        pantsColor: currentConfig?.pantsColor ?? "#4682B4",
      };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-600 via-purple-500 to-pink-500 relative overflow-hidden">
      {/* Animated background circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full opacity-10 bg-white"
            style={{
              width: 60 + i * 40,
              height: 60 + i * 40,
              left: `${10 + i * 12}%`,
              top: `${5 + (i % 3) * 30}%`,
            }}
            animate={{ scale: [1, 1.3, 1], rotate: [0, 180, 360] }}
            transition={{ duration: 8 + i * 2, repeat: Infinity, ease: "linear" }}
          />
        ))}
      </div>

      {/* Magic particles */}
      <AnimatePresence>
        {particles.map(p => (
          <motion.div
            key={p.id}
            className="absolute w-3 h-3 rounded-full pointer-events-none z-50"
            style={{ left: `${p.x}%`, top: `${p.y}%`, backgroundColor: p.color }}
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: [0, 1.5, 0], opacity: [1, 1, 0], y: -80 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
          />
        ))}
      </AnimatePresence>

      <div className="relative z-10 max-w-lg mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          <div>
            <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Fredoka One', cursive" }}>
              Avatar com IA ✨
            </h1>
            <p className="text-white/80 text-sm">Descreva e a IA cria seu avatar!</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowHistory(!showHistory)}
            className="ml-auto w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white"
          >
            <History className="w-5 h-5" />
          </motion.button>
        </div>

        {/* History panel */}
        <AnimatePresence>
          {showHistory && history.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 bg-white/10 backdrop-blur rounded-2xl p-4"
            >
              <p className="text-white font-semibold mb-3 text-sm">Últimas gerações:</p>
              <div className="flex gap-3 overflow-x-auto pb-1">
                {history.map((h, i) => (
                  <motion.button
                    key={i}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { setGenerated(h); setShowHistory(false); }}
                    className="flex-shrink-0 bg-white/20 rounded-xl p-2 flex flex-col items-center gap-1"
                  >
                    <BlockyAvatar
                      config={{ skinColor: h.skinColor, hairColor: h.hairColor, shirtColor: h.shirtColor, pantsColor: h.pantsColor }}
                      size={60}
                    />
                    <span className="text-white text-xs font-medium">{h.avatarName}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Avatar preview */}
          <div className="bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-8 flex flex-col items-center relative">
            <AnimatePresence mode="wait">
              {isGenerating ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex flex-col items-center gap-4"
                >
                  <div className="relative">
                    <motion.div
                      className="w-32 h-32 rounded-full border-4 border-purple-300"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    />
                    <motion.div
                      className="absolute inset-2 rounded-full border-4 border-pink-300"
                      animate={{ rotate: -360 }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Wand2 className="w-10 h-10 text-purple-500" />
                    </div>
                  </div>
                  <motion.p
                    className="text-purple-600 font-bold text-lg"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    style={{ fontFamily: "'Fredoka One', cursive" }}
                  >
                    Criando seu avatar...
                  </motion.p>
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 rounded-full bg-purple-400"
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
                      />
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="avatar"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center gap-3"
                >
                  <BlockyAvatar config={previewConfig} size={140} animate={!!generated} />
                  {generated && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center"
                    >
                      <p className="font-bold text-purple-700 text-lg" style={{ fontFamily: "'Fredoka One', cursive" }}>
                        {generated.avatarName}
                      </p>
                      <p className="text-gray-500 text-sm mt-1 max-w-xs">{generated.aiDescription}</p>
                      <div className="flex flex-wrap gap-2 justify-center mt-2">
                        {generated.hatId && (
                          <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full font-medium">
                            {HAT_LABELS[generated.hatId]}
                          </span>
                        )}
                        {generated.accessoryId && (
                          <span className="bg-pink-100 text-pink-700 text-xs px-2 py-1 rounded-full font-medium">
                            {ACCESSORY_LABELS[generated.accessoryId]}
                          </span>
                        )}
                      </div>
                      {/* Color palette preview */}
                      <div className="flex gap-2 justify-center mt-3">
                        {[generated.skinColor, generated.hairColor, generated.shirtColor, generated.pantsColor].map((color, i) => (
                          <div
                            key={i}
                            className="w-7 h-7 rounded-full border-2 border-white shadow-md"
                            style={{ backgroundColor: color }}
                            title={["Pele", "Cabelo", "Roupa", "Calça"][i]}
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                  {!generated && (
                    <p className="text-gray-400 text-sm text-center">
                      Seu avatar atual — descreva como quer que fique!
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Input area */}
          <div className="p-5">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Descreva seu avatar:
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Ex: Um herói azul com coroa dourada e capa mágica..."
              className="w-full border-2 border-purple-200 rounded-2xl p-3 text-gray-700 resize-none focus:outline-none focus:border-purple-400 transition-colors"
              rows={3}
              maxLength={500}
              disabled={isGenerating}
            />
            <div className="flex justify-between items-center mt-1 mb-4">
              <span className="text-xs text-gray-400">{description.length}/500</span>
              {description.length > 0 && (
                <button
                  onClick={() => setDescription("")}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  Limpar
                </button>
              )}
            </div>

            {/* Suggestions */}
            <div className="mb-4">
              <div className="flex items-center gap-1 mb-2">
                <Lightbulb className="w-4 h-4 text-yellow-500" />
                <span className="text-xs font-semibold text-gray-500">Sugestões de descrição:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.slice(0, 4).map((s, i) => (
                  <motion.button
                    key={i}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setDescription(s)}
                    className="text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 px-3 py-1.5 rounded-full border border-purple-200 transition-colors text-left"
                  >
                    {s}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGenerate}
                disabled={isGenerating || description.trim().length < 3}
                className="flex-1 py-3 rounded-2xl font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: isGenerating ? "#9CA3AF" : "linear-gradient(135deg, #7C3AED, #EC4899)",
                  fontFamily: "'Fredoka One', cursive",
                }}
              >
                {isGenerating ? (
                  <>
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                      <Sparkles className="w-5 h-5" />
                    </motion.div>
                    Gerando...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5" />
                    Gerar com IA
                  </>
                )}
              </motion.button>

              {generated && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { setGenerated(null); setDescription(""); }}
                  className="w-12 h-12 rounded-2xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
                >
                  <RefreshCw className="w-5 h-5" />
                </motion.button>
              )}
            </div>

            {/* Apply button */}
            <AnimatePresence>
              {generated && (
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleApply}
                  disabled={applyMutation.isPending}
                  className="w-full mt-3 py-3 rounded-2xl font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{
                    background: "linear-gradient(135deg, #10B981, #059669)",
                    fontFamily: "'Fredoka One', cursive",
                  }}
                >
                  {applyMutation.isPending ? (
                    <>
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                        <RefreshCw className="w-5 h-5" />
                      </motion.div>
                      Aplicando...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      Aplicar este avatar!
                    </>
                  )}
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Tips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-4 bg-white/10 backdrop-blur rounded-2xl p-4"
        >
          <p className="text-white/90 text-sm font-semibold mb-2">💡 Dicas para melhores resultados:</p>
          <ul className="text-white/75 text-xs space-y-1">
            <li>• Mencione cores específicas: "azul royal", "verde esmeralda"</li>
            <li>• Descreva o personagem: "herói", "princesa", "cientista", "ninja"</li>
            <li>• Adicione elementos: "com capa", "usando óculos", "com mochila"</li>
            <li>• Use elementos da natureza: "fogo", "água", "floresta", "sol"</li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
