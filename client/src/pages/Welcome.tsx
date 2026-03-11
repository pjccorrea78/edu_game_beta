import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { useGame } from "@/contexts/GameContext";
import BlockyAvatar from "@/components/BlockyAvatar";
import { ArrowRight, Sparkles } from "lucide-react";

type Props = {
  onComplete: () => void;
};

// BNCC: Ensino Fundamental - 1º ao 9º ano
const BNCC_GRADES = [
  { value: "1", label: "1º Ano", ages: "6-7 anos" },
  { value: "2", label: "2º Ano", ages: "7-8 anos" },
  { value: "3", label: "3º Ano", ages: "8-9 anos" },
  { value: "4", label: "4º Ano", ages: "9-10 anos" },
  { value: "5", label: "5º Ano", ages: "10-11 anos" },
  { value: "6", label: "6º Ano", ages: "11-12 anos" },
  { value: "7", label: "7º Ano", ages: "12-13 anos" },
  { value: "8", label: "8º Ano", ages: "13-14 anos" },
  { value: "9", label: "9º Ano", ages: "14-15 anos" },
];

// Calcular série pela idade (BNCC Ensino Fundamental)
function gradeFromAge(age: number): "1"|"2"|"3"|"4"|"5"|"6"|"7"|"8"|"9" {
  if (age <= 6) return "1";
  if (age === 7) return "2";
  if (age === 8) return "3";
  if (age === 9) return "4";
  if (age === 10) return "5";
  if (age === 11) return "6";
  if (age === 12) return "7";
  if (age === 13) return "8";
  return "9"; // 14+
}

const BOY_PRESETS = [
  { skinColor: "#FDBCB4", hairColor: "#4A2C2A", shirtColor: "#4169E1", pantsColor: "#4682B4", equippedItems: [], gender: "masculino" as const, hairStyle: "short" },
  { skinColor: "#E8A87C", hairColor: "#1C1C1C", shirtColor: "#E74C3C", pantsColor: "#2C3E50", equippedItems: [], gender: "masculino" as const, hairStyle: "topete" },
  { skinColor: "#C68642", hairColor: "#F4D03F", shirtColor: "#27AE60", pantsColor: "#1B5E20", equippedItems: [], gender: "masculino" as const, hairStyle: "short" },
  { skinColor: "#8D5524", hairColor: "#C0392B", shirtColor: "#8E44AD", pantsColor: "#4A148C", equippedItems: [], gender: "masculino" as const, hairStyle: "topete" },
];

const GIRL_PRESETS = [
  { skinColor: "#FDBCB4", hairColor: "#C0392B", shirtColor: "#E91E63", pantsColor: "#880E4F", equippedItems: [], gender: "feminino" as const, hairStyle: "long" },
  { skinColor: "#E8A87C", hairColor: "#4A2C2A", shirtColor: "#9C27B0", pantsColor: "#4A148C", equippedItems: [], gender: "feminino" as const, hairStyle: "tranca" },
  { skinColor: "#C68642", hairColor: "#F39C12", shirtColor: "#FF5722", pantsColor: "#BF360C", equippedItems: [], gender: "feminino" as const, hairStyle: "long" },
  { skinColor: "#F5DEB3", hairColor: "#E91E63", shirtColor: "#00BCD4", pantsColor: "#006064", equippedItems: [], gender: "feminino" as const, hairStyle: "coque" },
];

export default function Welcome({ onComplete }: Props) {
  const { sessionId, refreshPlayer } = useGame();
  const [step, setStep] = useState(0);
  const [gender, setGender] = useState<"masculino" | "feminino" | null>(null);
  const [nickname, setNickname] = useState("");
  const [age, setAge] = useState<number | "">("");
  const [grade, setGrade] = useState<string>("");
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const updateNickname = trpc.player.updateNickname.useMutation();
  const updateProfile = trpc.player.updateProfile.useMutation();
  const saveAvatar = trpc.avatar.save.useMutation();

  const presets = gender === "feminino" ? GIRL_PRESETS : BOY_PRESETS;

  const handleComplete = async () => {
    if (!nickname.trim() || !age || !gender) return;
    setIsLoading(true);
    try {
      // Calcular série se não informada
      const finalGrade = grade || gradeFromAge(Number(age));
      const avatarConfig = { ...presets[selectedPreset] };

      await updateNickname.mutateAsync({ sessionId, nickname: nickname.trim() });
      await updateProfile.mutateAsync({
        sessionId,
        age: Number(age),
        grade: finalGrade as "1"|"2"|"3"|"4"|"5"|"6"|"7"|"8"|"9",
        gender,
      });
      await saveAvatar.mutateAsync({ sessionId, avatarConfig });
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
            width: 20 + (i * 7) % 40,
            height: 20 + (i * 7) % 40,
            background: ["#FF6B6B", "#4ECDC4", "#F7DC6F", "#A8E6CF", "#FF8E53"][i % 5],
            left: `${(i * 17) % 100}%`,
            top: `${(i * 13) % 100}%`,
          }}
          animate={{ y: [0, -30, 0], x: [0, 15, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 3 + (i % 3), repeat: Infinity, delay: i * 0.2 }}
        />
      ))}

      <AnimatePresence mode="wait">
        {/* STEP 0 — Intro */}
        {step === 0 && (
          <motion.div
            key="intro"
            className="text-center z-10 max-w-sm w-full"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
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
              Explore a cidade, entre nas escolas e responda quizzes para ganhar pontos e personalizar seu avatar!
            </p>
            <div className="grid grid-cols-3 gap-3 mb-8">
              {[
                { emoji: "🏫", label: "8 Disciplinas" },
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

        {/* STEP 1 — Gênero */}
        {step === 1 && (
          <motion.div
            key="gender"
            className="z-10 max-w-sm w-full"
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
          >
            <div className="bg-white rounded-3xl shadow-2xl p-6">
              <div className="text-center mb-6">
                <div className="text-4xl mb-2">🧒</div>
                <h2 className="text-2xl font-black text-gray-800">Você é...</h2>
                <p className="text-gray-500 text-sm mt-1">Escolha para personalizar seu avatar!</p>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                {[
                  { value: "masculino" as const, label: "Menino", emoji: "👦", color: "#4169E1", bg: "#EBF3FF" },
                  { value: "feminino" as const, label: "Menina", emoji: "👧", color: "#E91E63", bg: "#FFF0F6" },
                ].map((opt) => (
                  <motion.button
                    key={opt.value}
                    className="rounded-3xl p-6 flex flex-col items-center gap-3 border-3 transition-all"
                    style={{
                      background: gender === opt.value ? opt.bg : "#F9F9F9",
                      border: `3px solid ${gender === opt.value ? opt.color : "#E5E7EB"}`,
                    }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => { setGender(opt.value); setSelectedPreset(0); }}
                  >
                    <span className="text-5xl">{opt.emoji}</span>
                    <span className="font-black text-lg" style={{ color: opt.color }}>{opt.label}</span>
                    {gender === opt.value && (
                      <motion.div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-black"
                        style={{ background: opt.color }}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                      >
                        ✓
                      </motion.div>
                    )}
                  </motion.button>
                ))}
              </div>
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
                  className={`flex-1 py-3 rounded-2xl font-bold text-white flex items-center justify-center gap-2 ${
                    gender ? "bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg" : "bg-gray-300"
                  }`}
                  whileHover={gender ? { scale: 1.02 } : {}}
                  whileTap={gender ? { scale: 0.98 } : {}}
                  onClick={() => gender && setStep(2)}
                  disabled={!gender}
                >
                  Próximo <ArrowRight className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 2 — Nome */}
        {step === 2 && (
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
                onKeyDown={(e) => e.key === "Enter" && nickname.trim() && setStep(3)}
                autoFocus
              />
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
                  className={`flex-1 py-3 rounded-2xl font-bold text-white flex items-center justify-center gap-2 ${
                    nickname.trim() ? "bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg" : "bg-gray-300"
                  }`}
                  whileHover={nickname.trim() ? { scale: 1.02 } : {}}
                  whileTap={nickname.trim() ? { scale: 0.98 } : {}}
                  onClick={() => nickname.trim() && setStep(3)}
                  disabled={!nickname.trim()}
                >
                  Próximo <ArrowRight className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 3 — Idade e Série */}
        {step === 3 && (
          <motion.div
            key="age-grade"
            className="z-10 max-w-sm w-full"
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
          >
            <div className="bg-white rounded-3xl shadow-2xl p-6">
              <div className="text-center mb-5">
                <div className="text-4xl mb-2">📚</div>
                <h2 className="text-2xl font-black text-gray-800">Sobre você</h2>
                <p className="text-gray-500 text-sm mt-1">Para personalizar suas questões!</p>
              </div>

              {/* Idade */}
              <div className="mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Quantos anos você tem? <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => {
                    const v = parseInt(e.target.value);
                    setAge(isNaN(v) ? "" : Math.min(18, Math.max(5, v)));
                    // Limpar série ao mudar idade
                    setGrade("");
                  }}
                  placeholder="Ex: 10"
                  min={5}
                  max={18}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-purple-400 outline-none text-lg font-bold text-center text-gray-800 transition-colors"
                />
                {age && (
                  <p className="text-xs text-gray-400 mt-1 text-center">
                    Série sugerida: {BNCC_GRADES.find(g => g.value === gradeFromAge(Number(age)))?.label}
                  </p>
                )}
              </div>

              {/* Série */}
              <div className="mb-5">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Qual série você está cursando? <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                  {BNCC_GRADES.map((g) => (
                    <motion.button
                      key={g.value}
                      className={`rounded-xl py-2 px-1 text-center text-xs font-bold border-2 transition-all ${
                        grade === g.value
                          ? "border-purple-500 bg-purple-50 text-purple-700"
                          : "border-gray-200 bg-gray-50 text-gray-600"
                      }`}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setGrade(grade === g.value ? "" : g.value)}
                    >
                      <div className="font-black">{g.label}</div>
                      <div className="text-gray-400 text-[10px]">{g.ages}</div>
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <motion.button
                  className="flex-1 py-3 rounded-2xl font-bold bg-gray-100 text-gray-600"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setStep(2)}
                >
                  Voltar
                </motion.button>
                <motion.button
                  className={`flex-1 py-3 rounded-2xl font-bold text-white flex items-center justify-center gap-2 ${
                    age ? "bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg" : "bg-gray-300"
                  }`}
                  whileHover={age ? { scale: 1.02 } : {}}
                  whileTap={age ? { scale: 0.98 } : {}}
                  onClick={() => age && setStep(4)}
                  disabled={!age}
                >
                  Próximo <ArrowRight className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 4 — Avatar */}
        {step === 4 && (
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
                <p className="text-gray-500 text-sm mt-1">
                  {gender === "feminino" ? "Avatares de menina" : "Avatares de menino"} — personalize depois!
                </p>
              </div>

              {/* Avatar preview */}
              <div className="flex justify-center mb-4">
                <div
                  className="w-32 h-40 rounded-2xl flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #667eea22, #764ba222)" }}
                >
                  <BlockyAvatar config={presets[selectedPreset]} size={90} animate={true} />
                </div>
              </div>

              {/* Preset grid */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                {presets.map((preset, i) => (
                  <motion.button
                    key={i}
                    className={`rounded-2xl p-2 flex items-center justify-center border-2 transition-all ${
                      selectedPreset === i ? "border-purple-400 bg-purple-50" : "border-gray-100 bg-gray-50"
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedPreset(i)}
                  >
                    <BlockyAvatar config={preset} size={48} />
                  </motion.button>
                ))}
              </div>

              <div className="flex gap-3">
                <motion.button
                  className="flex-1 py-3 rounded-2xl font-bold bg-gray-100 text-gray-600"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setStep(3)}
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
