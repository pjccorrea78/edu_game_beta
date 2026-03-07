import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { useGame } from "@/contexts/GameContext";
import BlockyAvatar from "@/components/BlockyAvatar";
import { ArrowRight, Sparkles } from "lucide-react";

type Props = {
  onComplete: () => void;
};

const AVATAR_PRESETS = [
  { skinColor: "#FDBCB4", hairColor: "#4A2C2A", shirtColor: "#4169E1", pantsColor: "#4682B4", equippedItems: [] },
  { skinColor: "#E8A87C", hairColor: "#1C1C1C", shirtColor: "#E74C3C", pantsColor: "#2C3E50", equippedItems: [] },
  { skinColor: "#C68642", hairColor: "#F4D03F", shirtColor: "#27AE60", pantsColor: "#1B5E20", equippedItems: [] },
  { skinColor: "#8D5524", hairColor: "#C0392B", shirtColor: "#8E44AD", pantsColor: "#4A148C", equippedItems: [] },
  { skinColor: "#F5DEB3", hairColor: "#E91E63", shirtColor: "#E67E22", pantsColor: "#795548", equippedItems: [] },
  { skinColor: "#A0785A", hairColor: "#2980B9", shirtColor: "#16A085", pantsColor: "#006064", equippedItems: [] },
];

export default function Welcome({ onComplete }: Props) {
  const { sessionId, refreshPlayer } = useGame();
  const [step, setStep] = useState(0);
  const [nickname, setNickname] = useState("");
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const updateNickname = trpc.player.updateNickname.useMutation();
  const saveAvatar = trpc.avatar.save.useMutation();

  const handleComplete = async () => {
    if (!nickname.trim()) return;
    setIsLoading(true);
    try {
      await updateNickname.mutateAsync({ sessionId, nickname: nickname.trim() });
      await saveAvatar.mutateAsync({ sessionId, avatarConfig: AVATAR_PRESETS[selectedPreset] });
      refreshPlayer();
      onComplete();
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden"
      style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f64f59 100%)" }}
    >
      {/* Floating particles */}
      {Array.from({ length: 12 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full opacity-20"
          style={{
            width: 20 + Math.random() * 40,
            height: 20 + Math.random() * 40,
            background: ["#FF6B6B", "#4ECDC4", "#F7DC6F", "#A8E6CF", "#FF8E53"][i % 5],
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, 15, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 3 + Math.random() * 3,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}

      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div
            key="intro"
            className="text-center z-10 max-w-sm w-full"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            {/* Logo */}
            <motion.div
              className="text-8xl mb-4"
              animate={{ rotate: [0, -5, 5, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              🎓
            </motion.div>
            <h1 className="text-5xl font-black text-white mb-2" style={{ textShadow: "0 4px 12px rgba(0,0,0,0.3)" }}>
              EduGame
            </h1>
            <p className="text-white/80 text-lg mb-2">Aprenda jogando!</p>
            <p className="text-white/60 text-sm mb-8">
              Explore o mapa, entre nos prédios e responda quizzes para ganhar pontos e personalizar seu avatar!
            </p>

            {/* Features */}
            <div className="grid grid-cols-3 gap-3 mb-8">
              {[
                { emoji: "🏫", label: "5 Disciplinas" },
                { emoji: "🏆", label: "Pontos & Prêmios" },
                { emoji: "🎮", label: "Avatar Próprio" },
              ].map((f, i) => (
                <motion.div
                  key={i}
                  className="bg-white/20 backdrop-blur rounded-2xl p-3 text-center"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                >
                  <div className="text-2xl mb-1">{f.emoji}</div>
                  <p className="text-white text-xs font-bold">{f.label}</p>
                </motion.div>
              ))}
            </div>

            <motion.button
              className="w-full py-4 rounded-3xl font-black text-xl text-purple-700 bg-white shadow-2xl flex items-center justify-center gap-3"
              whileHover={{ scale: 1.03, boxShadow: "0 20px 40px rgba(0,0,0,0.3)" }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setStep(1)}
            >
              <Sparkles className="w-6 h-6" />
              Começar Aventura!
              <ArrowRight className="w-6 h-6" />
            </motion.button>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div
            key="name"
            className="z-10 max-w-sm w-full"
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
          >
            <div className="bg-white rounded-3xl shadow-2xl p-6">
              <div className="text-center mb-6">
                <div className="text-4xl mb-2">👋</div>
                <h2 className="text-2xl font-black text-gray-800">Qual é o seu nome?</h2>
                <p className="text-gray-500 text-sm mt-1">Como você quer ser chamado no jogo?</p>
              </div>

              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Digite seu apelido..."
                maxLength={20}
                className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-purple-400 outline-none text-lg font-bold text-center text-gray-800 mb-4 transition-colors"
                onKeyDown={(e) => e.key === "Enter" && nickname.trim() && setStep(2)}
                autoFocus
              />

              <div className="flex gap-3">
                <motion.button
                  className="flex-1 py-3 rounded-2xl font-bold bg-gray-100 text-gray-600"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setStep(0)}
                >
                  Voltar
                </motion.button>
                <motion.button
                  className={`flex-2 flex-1 py-3 rounded-2xl font-bold text-white flex items-center justify-center gap-2 ${
                    nickname.trim() ? "bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg" : "bg-gray-300"
                  }`}
                  whileHover={nickname.trim() ? { scale: 1.02 } : {}}
                  whileTap={nickname.trim() ? { scale: 0.98 } : {}}
                  onClick={() => nickname.trim() && setStep(2)}
                  disabled={!nickname.trim()}
                >
                  Próximo <ArrowRight className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="avatar"
            className="z-10 max-w-sm w-full"
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
          >
            <div className="bg-white rounded-3xl shadow-2xl p-6">
              <div className="text-center mb-4">
                <div className="text-4xl mb-2">🎨</div>
                <h2 className="text-2xl font-black text-gray-800">Escolha seu Avatar</h2>
                <p className="text-gray-500 text-sm mt-1">Você pode personalizar depois na loja!</p>
              </div>

              {/* Avatar preview */}
              <div className="flex justify-center mb-4">
                <div
                  className="w-32 h-40 rounded-2xl flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #667eea22, #764ba222)" }}
                >
                  <BlockyAvatar config={AVATAR_PRESETS[selectedPreset]} size={90} animate={true} />
                </div>
              </div>

              {/* Preset grid */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                {AVATAR_PRESETS.map((preset, i) => (
                  <motion.button
                    key={i}
                    className={`rounded-2xl p-2 flex items-center justify-center border-2 transition-all ${
                      selectedPreset === i ? "border-purple-400 bg-purple-50" : "border-gray-100 bg-gray-50"
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedPreset(i)}
                  >
                    <BlockyAvatar config={preset} size={52} />
                  </motion.button>
                ))}
              </div>

              <div className="flex gap-3">
                <motion.button
                  className="flex-1 py-3 rounded-2xl font-bold bg-gray-100 text-gray-600"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setStep(1)}
                >
                  Voltar
                </motion.button>
                <motion.button
                  className="flex-1 py-3 rounded-2xl font-bold text-white bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleComplete}
                  disabled={isLoading}
                >
                  {isLoading ? "..." : <>Jogar! <ArrowRight className="w-4 h-4" /></>}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
