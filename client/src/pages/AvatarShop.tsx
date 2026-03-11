import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { useGame } from "@/contexts/GameContext";
import BlockyAvatar from "@/components/BlockyAvatar";
import AvatarAI from "./AvatarAI";
import { ArrowLeft, Zap, ShoppingBag, Palette, Lock, Check, Star, Bot } from "lucide-react";
import { toast } from "sonner";

const HAIR_STYLES_MALE = [
  { value: "short", label: "Curto", emoji: "💇" },
  { value: "topete", label: "Topete", emoji: "🧑" },
  { value: "moicano", label: "Moicano", emoji: "😎" },
];

const HAIR_STYLES_FEMALE = [
  { value: "long", label: "Comprido", emoji: "👩" },
  { value: "tranca", label: "Trança", emoji: "💁" },
  { value: "coque", label: "Coque", emoji: "🙆" },
];

type Props = {
  onBack: () => void;
};

type Tab = "avatar" | "shop" | "ai";

const SKIN_COLORS = [
  { label: "Pêssego", value: "#FDBCB4" },
  { label: "Mel", value: "#E8A87C" },
  { label: "Caramelo", value: "#C68642" },
  { label: "Chocolate", value: "#8D5524" },
  { label: "Marfim", value: "#F5DEB3" },
  { label: "Oliva", value: "#A0785A" },
];

const HAIR_COLORS = [
  { label: "Castanho", value: "#4A2C2A" },
  { label: "Preto", value: "#1C1C1C" },
  { label: "Loiro", value: "#F4D03F" },
  { label: "Ruivo", value: "#C0392B" },
  { label: "Roxo", value: "#8E44AD" },
  { label: "Azul", value: "#2980B9" },
  { label: "Rosa", value: "#E91E63" },
  { label: "Verde", value: "#27AE60" },
];

const SHIRT_COLORS = [
  { label: "Azul", value: "#4169E1" },
  { label: "Vermelho", value: "#E74C3C" },
  { label: "Verde", value: "#27AE60" },
  { label: "Roxo", value: "#8E44AD" },
  { label: "Laranja", value: "#E67E22" },
  { label: "Rosa", value: "#E91E63" },
  { label: "Ciano", value: "#16A085" },
  { label: "Branco", value: "#ECF0F1" },
];

const PANTS_COLORS = [
  { label: "Jeans", value: "#4682B4" },
  { label: "Preto", value: "#2C3E50" },
  { label: "Cinza", value: "#7F8C8D" },
  { label: "Marrom", value: "#795548" },
  { label: "Verde", value: "#1B5E20" },
  { label: "Roxo", value: "#4A148C" },
];

const RARITY_COLORS: Record<string, string> = {
  common: "#9E9E9E",
  rare: "#2196F3",
  epic: "#9C27B0",
  legendary: "#FF9800",
};

const RARITY_LABELS: Record<string, string> = {
  common: "Comum",
  rare: "Raro",
  epic: "Épico",
  legendary: "Lendário",
};

const HAT_MAP: Record<number, string> = { 1: "cowboy", 2: "crown", 3: "wizard", 4: "helmet" };
const ACCESSORY_MAP: Record<number, string> = { 9: "glasses", 10: "backpack", 11: "cape", 12: "wings" };

export default function AvatarShop({ onBack }: Props) {
  const { sessionId, player, refreshPlayer } = useGame();
  const [tab, setTab] = useState<Tab>("avatar");
  const [avatarConfig, setAvatarConfig] = useState<{
    skinColor: string;
    hairColor: string;
    shirtColor: string;
    pantsColor: string;
    equippedItems: number[];
    gender?: "masculino" | "feminino";
    hairStyle?: string;
  }>({
    skinColor: "#FDBCB4",
    hairColor: "#4A2C2A",
    shirtColor: "#4169E1",
    pantsColor: "#4682B4",
    equippedItems: [],
    gender: ((player as unknown as { gender?: string })?.gender as "masculino" | "feminino") ?? "masculino",
    hairStyle: "short",
  });
  const [isSaving, setIsSaving] = useState(false);

  const shopQuery = trpc.shop.listItems.useQuery({ sessionId });
  const saveAvatar = trpc.avatar.save.useMutation();
  const getAvatar = trpc.avatar.get.useQuery({ sessionId });
  const purchase = trpc.shop.purchase.useMutation();

  useEffect(() => {
    if (getAvatar.data?.avatarConfig) {
      setAvatarConfig(getAvatar.data.avatarConfig as typeof avatarConfig);
    }
  }, [getAvatar.data]);

  const handleSaveAvatar = async () => {
    setIsSaving(true);
    try {
      await saveAvatar.mutateAsync({ sessionId, avatarConfig });
      toast.success("Avatar salvo com sucesso! 🎨");
      refreshPlayer();
    } catch {
      toast.error("Erro ao salvar avatar");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePurchase = async (itemId: number, itemName: string, cost: number) => {
    if ((player?.totalPoints ?? 0) < cost) {
      toast.error(`Você precisa de ${cost} pontos para comprar este item!`);
      return;
    }
    try {
      await purchase.mutateAsync({ sessionId, itemId });
      toast.success(`${itemName} adquirido! 🎉`);
      shopQuery.refetch();
      refreshPlayer();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro ao comprar item";
      toast.error(msg);
    }
  };

  const toggleEquipItem = (itemId: number) => {
    setAvatarConfig((prev) => {
      const equipped = prev.equippedItems.includes(itemId)
        ? prev.equippedItems.filter((id) => id !== itemId)
        : [...prev.equippedItems, itemId];
      return { ...prev, equippedItems: equipped };
    });
  };

  const equippedHat = avatarConfig.equippedItems.find((id) => HAT_MAP[id]) ?? null;
  const equippedAccessory = avatarConfig.equippedItems.find((id) => ACCESSORY_MAP[id]) ?? null;
  const hatStyle = equippedHat ? HAT_MAP[equippedHat] : null;
  const accessoryStyle = equippedAccessory ? ACCESSORY_MAP[equippedAccessory] : null;

  const ownedIds = shopQuery.data?.ownedIds ?? [];
  const items = shopQuery.data?.items ?? [];
  const playerPoints = shopQuery.data?.playerPoints ?? player?.totalPoints ?? 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 flex flex-col">
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
          <h1 className="font-black text-gray-800 text-lg">Avatar & Loja</h1>
          <p className="text-xs text-gray-500">Personalize seu personagem</p>
        </div>
        <div className="flex items-center gap-1 bg-yellow-50 border border-yellow-200 rounded-xl px-3 py-1.5">
          <Zap className="w-4 h-4 text-yellow-500" />
          <span className="font-black text-gray-800">{playerPoints}</span>
          <span className="text-xs text-gray-500">pts</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-4 pt-4">
        {[
          { id: "avatar" as Tab, label: "Avatar", icon: <Palette className="w-4 h-4" /> },
          { id: "shop" as Tab, label: "Loja", icon: <ShoppingBag className="w-4 h-4" /> },
          { id: "ai" as Tab, label: "Avatar IA", icon: <Bot className="w-4 h-4" /> },
        ].map((t) => (
          <motion.button
            key={t.id}
            className={`flex-1 py-2.5 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
              tab === t.id ? "bg-purple-500 text-white shadow-lg" : "bg-white text-gray-600 shadow"
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setTab(t.id)}
          >
            {t.icon}
            {t.label}
          </motion.button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6 pt-4">
        <AnimatePresence mode="wait">
          {tab === "avatar" && (
            <motion.div
              key="avatar"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
            >
              {/* Avatar preview */}
              <div className="bg-white rounded-3xl shadow-lg p-6 mb-4 flex flex-col items-center">
                <div
                  className="w-40 h-48 rounded-2xl flex items-center justify-center mb-3"
                  style={{ background: "linear-gradient(135deg, #667eea22, #764ba222)" }}
                >
                  <BlockyAvatar
                    config={avatarConfig}
                    size={110}
                    animate={true}
                    hat={hatStyle}
                    accessory={accessoryStyle}
                  />
                </div>
                <p className="font-bold text-gray-700">{player?.nickname ?? "Jogador"}</p>
                <motion.button
                  className="mt-3 px-6 py-2.5 rounded-2xl font-bold text-white shadow-lg"
                  style={{ background: "linear-gradient(135deg, #667eea, #764ba2)" }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSaveAvatar}
                  disabled={isSaving}
                >
                  {isSaving ? "Salvando..." : "💾 Salvar Avatar"}
                </motion.button>
              </div>

              {/* Color pickers */}
              {[
                { label: "Cor da Pele", key: "skinColor" as const, colors: SKIN_COLORS, emoji: "🧑" },
                { label: "Cor do Cabelo", key: "hairColor" as const, colors: HAIR_COLORS, emoji: "💇" },
                { label: "Cor da Camisa", key: "shirtColor" as const, colors: SHIRT_COLORS, emoji: "👕" },
                { label: "Cor da Calça", key: "pantsColor" as const, colors: PANTS_COLORS, emoji: "👖" },
              ].map((section) => (
                <div key={section.key} className="bg-white rounded-2xl shadow p-4 mb-3">
                  <p className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <span>{section.emoji}</span> {section.label}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {section.colors.map((c) => (
                      <motion.button
                        key={c.value}
                        className="w-9 h-9 rounded-xl shadow-sm border-2 transition-all"
                        style={{
                          background: c.value,
                          borderColor: avatarConfig[section.key] === c.value ? "#667eea" : "transparent",
                          boxShadow: avatarConfig[section.key] === c.value ? "0 0 0 3px #667eea44" : undefined,
                        }}
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setAvatarConfig((prev) => ({ ...prev, [section.key]: c.value }))}
                        title={c.label}
                      >
                        {avatarConfig[section.key] === c.value && (
                          <Check className="w-4 h-4 text-white mx-auto" style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.5))" }} />
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>
              ))}

              {/* Gênero */}
              <div className="bg-white rounded-2xl shadow p-4 mb-3">
                <p className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <span>👤</span> Gênero do Avatar
                </p>
                <div className="flex gap-3">
                  {(["masculino", "feminino"] as const).map((g) => (
                    <motion.button
                      key={g}
                      className={`flex-1 py-3 rounded-2xl font-bold text-sm flex flex-col items-center gap-2 border-2 transition-all ${
                        avatarConfig.gender === g
                          ? "bg-purple-100 border-purple-400 text-purple-700"
                          : "bg-gray-50 border-gray-200 text-gray-600"
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        const defaultHair = g === "masculino" ? "curto" : "comprido";
                        setAvatarConfig((prev) => ({ ...prev, gender: g, hairStyle: defaultHair }));
                      }}
                    >
                      <span className="text-2xl">{g === "masculino" ? "👦" : "👧"}</span>
                      {g === "masculino" ? "Menino" : "Menina"}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Estilo de Cabelo */}
              <div className="bg-white rounded-2xl shadow p-4 mb-3">
                <p className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <span>💇</span> Estilo de Cabelo
                </p>
                <div className="flex flex-wrap gap-2">
                  {(avatarConfig.gender === "feminino"
                    ? [
                        { value: "comprido", label: "Comprido", emoji: "👩" },
                        { value: "tranca", label: "Trança", emoji: "💁" },
                        { value: "coque", label: "Coque", emoji: "🙆" },
                        { value: "franja", label: "Franja", emoji: "💆" },
                      ]
                    : [
                        { value: "curto", label: "Curto", emoji: "👦" },
                        { value: "topete", label: "Topete", emoji: "🧑" },
                        { value: "moicano", label: "Moicano", emoji: "😎" },
                        { value: "calvo", label: "Careca", emoji: "👴" },
                      ]
                  ).map((style) => (
                    <motion.button
                      key={style.value}
                      className={`px-3 py-2 rounded-xl text-sm font-semibold border-2 flex items-center gap-1.5 ${
                        avatarConfig.hairStyle === style.value
                          ? "bg-purple-100 border-purple-400 text-purple-700"
                          : "bg-gray-50 border-gray-200 text-gray-600"
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setAvatarConfig((prev) => ({ ...prev, hairStyle: style.value }))}
                    >
                      <span>{style.emoji}</span>
                      {style.label}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Equipped items */}
              {ownedIds.length > 0 && (
                <div className="bg-white rounded-2xl shadow p-4 mb-3">
                  <p className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500" /> Itens Equipados
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {items
                      .filter((item) => ownedIds.includes(item.id))
                      .map((item) => (
                        <motion.button
                          key={item.id}
                          className={`px-3 py-2 rounded-xl text-sm font-semibold border-2 flex items-center gap-1.5 ${
                            avatarConfig.equippedItems.includes(item.id)
                              ? "bg-purple-100 border-purple-400 text-purple-700"
                              : "bg-gray-50 border-gray-200 text-gray-600"
                          }`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => toggleEquipItem(item.id)}
                        >
                          <span>{item.iconEmoji}</span>
                          <span>{item.name}</span>
                          {avatarConfig.equippedItems.includes(item.id) && (
                            <Check className="w-3 h-3 text-purple-500" />
                          )}
                        </motion.button>
                      ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {tab === "shop" && (
            <motion.div
              key="shop"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 20, opacity: 0 }}
            >
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-4 mb-4 text-white text-center">
                <p className="text-sm opacity-80">Seus pontos</p>
                <p className="text-3xl font-black">{playerPoints} pts</p>
                <p className="text-xs opacity-70 mt-1">Ganhe mais pontos respondendo quizzes!</p>
              </div>

              {/* Items by category */}
              {(["hat", "shirt", "pants", "accessory"] as const).map((category) => {
                const categoryItems = items.filter((item) => item.category === category);
                if (categoryItems.length === 0) return null;
                const categoryNames: Record<string, string> = {
                  hat: "🎩 Chapéus",
                  shirt: "👕 Camisas",
                  pants: "👖 Calças",
                  accessory: "🎒 Acessórios",
                };
                return (
                  <div key={category} className="mb-4">
                    <h3 className="font-black text-gray-700 mb-2 px-1">{categoryNames[category]}</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {categoryItems.map((item) => {
                        const owned = ownedIds.includes(item.id);
                        const canAfford = playerPoints >= item.pointsCost;
                        return (
                          <motion.div
                            key={item.id}
                            className={`bg-white rounded-2xl shadow p-3 border-2 ${
                              owned ? "border-green-300" : "border-transparent"
                            }`}
                            whileHover={{ scale: 1.02 }}
                          >
                            {/* Item preview */}
                            <div
                              className="w-full h-20 rounded-xl flex items-center justify-center text-4xl mb-2"
                              style={{ background: `${item.colorValue ?? "#eee"}22` }}
                            >
                              {item.iconEmoji ?? "🎁"}
                            </div>

                            {/* Rarity badge */}
                            <div className="flex items-center justify-between mb-1">
                              <span
                                className="text-xs font-bold px-2 py-0.5 rounded-full"
                                style={{
                                  background: `${RARITY_COLORS[item.rarity]}22`,
                                  color: RARITY_COLORS[item.rarity],
                                }}
                              >
                                {RARITY_LABELS[item.rarity]}
                              </span>
                              {owned && (
                                <span className="text-xs font-bold text-green-600 flex items-center gap-1">
                                  <Check className="w-3 h-3" /> Adquirido
                                </span>
                              )}
                            </div>

                            <p className="font-bold text-gray-800 text-sm mb-0.5">{item.name}</p>
                            <p className="text-xs text-gray-500 mb-2 line-clamp-2">{item.description}</p>

                            {/* Buy button */}
                            {owned ? (
                              <div className="w-full py-2 rounded-xl bg-green-50 text-green-600 font-bold text-sm text-center">
                                ✓ Na sua coleção
                              </div>
                            ) : (
                              <motion.button
                                className={`w-full py-2 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 ${
                                  canAfford
                                    ? "bg-gradient-to-r from-yellow-400 to-orange-400 text-white shadow"
                                    : "bg-gray-100 text-gray-400"
                                }`}
                                whileHover={canAfford ? { scale: 1.03 } : {}}
                                whileTap={canAfford ? { scale: 0.97 } : {}}
                                onClick={() => canAfford && handlePurchase(item.id, item.name, item.pointsCost)}
                                disabled={!canAfford}
                              >
                                {canAfford ? (
                                  <>
                                    <Zap className="w-3.5 h-3.5" />
                                    {item.pointsCost} pts
                                  </>
                                ) : (
                                  <>
                                    <Lock className="w-3.5 h-3.5" />
                                    {item.pointsCost} pts
                                  </>
                                )}
                              </motion.button>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}

          {tab === "ai" && (
            <motion.div
              key="ai"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 20, opacity: 0 }}
            >
              <AvatarAI onBack={() => setTab("avatar")} embedded />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
