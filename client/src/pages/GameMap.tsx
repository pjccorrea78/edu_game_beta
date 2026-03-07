import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "@/contexts/GameContext";
import BlockyAvatar from "@/components/BlockyAvatar";
import { Star, Trophy, ShoppingBag, BarChart2, Settings, Zap, BookOpen, GraduationCap, Swords, Globe, Flame, BookMarked, Bell } from "lucide-react";

type Discipline = "matematica" | "portugues" | "geografia" | "historia" | "ciencias";

type Building = {
  id: Discipline;
  name: string;
  emoji: string;
  color: string;
  roofColor: string;
  windowColor: string;
  doorColor: string;
  position: { x: number; y: number };
  description: string;
  subject: string;
};

const BUILDINGS: Building[] = [
  {
    id: "matematica",
    name: "Matemática",
    emoji: "🔢",
    color: "#FF6B6B",
    roofColor: "#C0392B",
    windowColor: "#FFE0B2",
    doorColor: "#8B4513",
    position: { x: 15, y: 20 },
    description: "Números, operações e geometria",
    subject: "Matemática",
  },
  {
    id: "portugues",
    name: "Português",
    emoji: "📖",
    color: "#4ECDC4",
    roofColor: "#16A085",
    windowColor: "#B2EBF2",
    doorColor: "#006064",
    position: { x: 62, y: 12 },
    description: "Gramática, leitura e escrita",
    subject: "Português",
  },
  {
    id: "geografia",
    name: "Geografia",
    emoji: "🌍",
    color: "#45B7D1",
    roofColor: "#1565C0",
    windowColor: "#BBDEFB",
    doorColor: "#0D47A1",
    position: { x: 75, y: 45 },
    description: "Mapas, países e natureza",
    subject: "Geografia",
  },
  {
    id: "historia",
    name: "História",
    emoji: "🏛️",
    color: "#F7DC6F",
    roofColor: "#F39C12",
    windowColor: "#FFF9C4",
    doorColor: "#795548",
    position: { x: 55, y: 65 },
    description: "Civilizações e eventos históricos",
    subject: "História",
  },
  {
    id: "ciencias",
    name: "Ciências",
    emoji: "🔬",
    color: "#A8E6CF",
    roofColor: "#27AE60",
    windowColor: "#C8E6C9",
    doorColor: "#1B5E20",
    position: { x: 10, y: 58 },
    description: "Natureza, corpo humano e espaço",
    subject: "Ciências",
  },
];

type Props = {
  onEnterBuilding: (discipline: Discipline) => void;
  onOpenShop: () => void;
  onOpenProgress: () => void;
  onOpenAvatar: () => void;
  onOpenStudy: () => void;
  onOpenSchool: () => void;
  onOpenTeacher: () => void;
  onOpenAchievements: () => void;
  onOpenDaily: () => void;
  onOpenRanking: () => void;
  onOpenDuel: () => void;
  onOpenStory: () => void;
  onOpenNotifications: () => void;
};

function Building3D({
  building,
  onClick,
  isHovered,
  onHover,
  completedDisciplines,
}: {
  building: Building;
  onClick: () => void;
  isHovered: boolean;
  onHover: (id: string | null) => void;
  completedDisciplines: string[];
}) {
  const isCompleted = completedDisciplines.includes(building.id);
  const { x, y } = building.position;

  return (
    <motion.div
      className="absolute cursor-pointer select-none"
      style={{ left: `${x}%`, top: `${y}%` }}
      whileHover={{ scale: 1.08, zIndex: 50 }}
      whileTap={{ scale: 0.95 }}
      animate={isHovered ? { y: -8 } : { y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      onClick={onClick}
      onMouseEnter={() => onHover(building.id)}
      onMouseLeave={() => onHover(null)}
    >
      {/* Building SVG */}
      <div className="relative" style={{ width: 110, height: 130 }}>
        <svg viewBox="0 0 110 130" width="110" height="130">
          {/* Shadow */}
          <ellipse cx="55" cy="126" rx="42" ry="7" fill="rgba(0,0,0,0.2)" />

          {/* Building body */}
          <rect x="10" y="50" width="90" height="72" rx="4" fill={building.color} />
          {/* Side shading */}
          <rect x="10" y="50" width="18" height="72" rx="4" fill="rgba(0,0,0,0.12)" />
          {/* Top shading */}
          <rect x="10" y="50" width="90" height="12" rx="4" fill="rgba(255,255,255,0.15)" />

          {/* Roof */}
          <polygon points="5,52 55,8 105,52" fill={building.roofColor} />
          {/* Roof shading */}
          <polygon points="5,52 55,8 30,52" fill="rgba(0,0,0,0.15)" />
          {/* Roof ridge */}
          <line x1="55" y1="8" x2="55" y2="52" stroke="rgba(0,0,0,0.1)" strokeWidth="2" />

          {/* Chimney */}
          <rect x="68" y="18" width="10" height="22" rx="2" fill={building.roofColor} />
          <rect x="65" y="15" width="16" height="6" rx="2" fill={building.roofColor} />

          {/* Windows */}
          <rect x="18" y="62" width="22" height="18" rx="3" fill={building.windowColor} />
          <rect x="70" y="62" width="22" height="18" rx="3" fill={building.windowColor} />
          {/* Window frames */}
          <line x1="29" y1="62" x2="29" y2="80" stroke="rgba(0,0,0,0.2)" strokeWidth="1.5" />
          <line x1="18" y1="71" x2="40" y2="71" stroke="rgba(0,0,0,0.2)" strokeWidth="1.5" />
          <line x1="81" y1="62" x2="81" y2="80" stroke="rgba(0,0,0,0.2)" strokeWidth="1.5" />
          <line x1="70" y1="71" x2="92" y2="71" stroke="rgba(0,0,0,0.2)" strokeWidth="1.5" />
          {/* Window shine */}
          <rect x="20" y="64" width="7" height="5" rx="1" fill="rgba(255,255,255,0.5)" />
          <rect x="72" y="64" width="7" height="5" rx="1" fill="rgba(255,255,255,0.5)" />

          {/* Second row windows */}
          <rect x="18" y="88" width="22" height="16" rx="3" fill={building.windowColor} />
          <rect x="70" y="88" width="22" height="16" rx="3" fill={building.windowColor} />

          {/* Door */}
          <rect x="40" y="96" width="30" height="26" rx="4" fill={building.doorColor} />
          <rect x="42" y="98" width="26" height="22" rx="3" fill={`${building.doorColor}cc`} />
          {/* Door knob */}
          <circle cx="67" cy="111" r="2.5" fill="#FFD700" />
          {/* Door arch */}
          <path d={`M 40 100 Q 55 90 70 100`} fill={building.doorColor} />

          {/* Steps */}
          <rect x="35" y="120" width="40" height="5" rx="2" fill="rgba(0,0,0,0.15)" />
          <rect x="38" y="118" width="34" height="4" rx="2" fill="rgba(255,255,255,0.2)" />

          {/* Completed badge */}
          {isCompleted && (
            <>
              <circle cx="90" cy="20" r="12" fill="#FFD700" />
              <text x="90" y="25" textAnchor="middle" fontSize="14" fill="#fff">
                ✓
              </text>
            </>
          )}
        </svg>

        {/* Floating emoji */}
        <motion.div
          className="absolute -top-3 left-1/2 -translate-x-1/2 text-2xl"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          {building.emoji}
        </motion.div>
      </div>

      {/* Label */}
      <div className="text-center mt-1">
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full shadow-md"
          style={{
            background: building.color,
            color: "white",
            textShadow: "0 1px 2px rgba(0,0,0,0.4)",
          }}
        >
          {building.name}
        </span>
      </div>

      {/* Hover tooltip */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="absolute -top-16 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-xl px-3 py-2 text-center z-50 min-w-max"
            style={{ border: `2px solid ${building.color}` }}
          >
            <p className="text-xs font-bold text-gray-800">{building.name}</p>
            <p className="text-xs text-gray-500">{building.description}</p>
            <p className="text-xs font-semibold mt-1" style={{ color: building.color }}>
              Clique para jogar! 🎮
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function GameMap({ onEnterBuilding, onOpenShop, onOpenProgress, onOpenAvatar, onOpenStudy, onOpenSchool, onOpenTeacher, onOpenAchievements, onOpenDaily, onOpenRanking, onOpenDuel, onOpenStory, onOpenNotifications }: Props) {
  const { player } = useGame();
  const [hoveredBuilding, setHoveredBuilding] = useState<string | null>(null);
  const [completedDisciplines] = useState<string[]>([]);
  const [clouds, setClouds] = useState([
    { id: 1, x: 10, y: 8, size: 1.2, speed: 0.015 },
    { id: 2, x: 55, y: 5, size: 0.9, speed: 0.02 },
    { id: 3, x: 80, y: 12, size: 1.1, speed: 0.012 },
  ]);

  // Animate clouds
  useEffect(() => {
    const interval = setInterval(() => {
      setClouds((prev) =>
        prev.map((c) => ({
          ...c,
          x: c.x > 110 ? -20 : c.x + c.speed,
        }))
      );
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const avatarConfig = player?.avatarConfig ?? {
    skinColor: "#FDBCB4",
    hairColor: "#4A2C2A",
    shirtColor: "#4169E1",
    pantsColor: "#4682B4",
    equippedItems: [],
  };

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ minHeight: "100vh" }}>
      {/* Sky gradient background */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(180deg, #87CEEB 0%, #B0E2FF 35%, #90EE90 65%, #228B22 100%)",
        }}
      />

      {/* Sun */}
      <motion.div
        className="absolute"
        style={{ top: "3%", right: "8%" }}
        animate={{ rotate: 360 }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      >
        <div className="relative">
          <div
            className="w-16 h-16 rounded-full"
            style={{ background: "radial-gradient(circle, #FFE44D, #FFA500)" }}
          />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
            <div
              key={angle}
              className="absolute w-2 h-5 rounded-full"
              style={{
                background: "#FFD700",
                top: "50%",
                left: "50%",
                transformOrigin: "50% 200%",
                transform: `rotate(${angle}deg) translateX(-50%) translateY(-200%)`,
              }}
            />
          ))}
        </div>
      </motion.div>

      {/* Animated clouds */}
      {clouds.map((cloud) => (
        <div
          key={cloud.id}
          className="absolute pointer-events-none"
          style={{
            left: `${cloud.x}%`,
            top: `${cloud.y}%`,
            transform: `scale(${cloud.size})`,
          }}
        >
          <svg viewBox="0 0 120 60" width="120" height="60" opacity="0.85">
            <ellipse cx="60" cy="45" rx="55" ry="20" fill="white" />
            <ellipse cx="40" cy="35" rx="30" ry="22" fill="white" />
            <ellipse cx="75" cy="32" rx="28" ry="24" fill="white" />
            <ellipse cx="55" cy="28" rx="22" ry="20" fill="white" />
          </svg>
        </div>
      ))}

      {/* Ground / Grass */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{
          height: "38%",
          background: "linear-gradient(180deg, #5DBB63 0%, #3A9E40 40%, #2D7A32 100%)",
          borderRadius: "60% 60% 0 0 / 20% 20% 0 0",
        }}
      />

      {/* Path/Road */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <path
          d="M 50 85 Q 35 70 20 55 Q 25 35 40 28"
          stroke="#D4A96A"
          strokeWidth="4"
          fill="none"
          strokeDasharray="6,3"
          opacity="0.7"
        />
        <path
          d="M 50 85 Q 65 72 72 60 Q 78 48 80 38"
          stroke="#D4A96A"
          strokeWidth="4"
          fill="none"
          strokeDasharray="6,3"
          opacity="0.7"
        />
        <path
          d="M 50 85 Q 55 75 62 68"
          stroke="#D4A96A"
          strokeWidth="4"
          fill="none"
          strokeDasharray="6,3"
          opacity="0.7"
        />
        <path
          d="M 50 85 Q 30 78 18 68"
          stroke="#D4A96A"
          strokeWidth="4"
          fill="none"
          strokeDasharray="6,3"
          opacity="0.7"
        />
        <path
          d="M 50 85 Q 52 75 68 60"
          stroke="#D4A96A"
          strokeWidth="4"
          fill="none"
          strokeDasharray="6,3"
          opacity="0.7"
        />
      </svg>

      {/* Trees decoration */}
      {[
        { x: 5, y: 30 }, { x: 88, y: 28 }, { x: 3, y: 75 }, { x: 90, y: 72 },
        { x: 45, y: 78 }, { x: 30, y: 82 }, { x: 70, y: 80 },
      ].map((pos, i) => (
        <div
          key={i}
          className="absolute pointer-events-none"
          style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
        >
          <svg viewBox="0 0 40 50" width="40" height="50">
            <rect x="16" y="35" width="8" height="15" rx="2" fill="#5D4037" />
            <polygon points="20,2 4,38 36,38" fill="#2E7D32" />
            <polygon points="20,10 6,42 34,42" fill="#388E3C" />
            <polygon points="20,18 8,44 32,44" fill="#43A047" />
          </svg>
        </div>
      ))}

      {/* Buildings */}
      {BUILDINGS.map((building) => (
        <Building3D
          key={building.id}
          building={building}
          onClick={() => onEnterBuilding(building.id)}
          isHovered={hoveredBuilding === building.id}
          onHover={setHoveredBuilding}
          completedDisciplines={completedDisciplines}
        />
      ))}

      {/* Custom School Building */}
      <motion.div
        className="absolute cursor-pointer select-none z-20"
        style={{ left: "38%", top: "18%" }}
        whileHover={{ scale: 1.08, zIndex: 50 }}
        whileTap={{ scale: 0.95 }}
        animate={hoveredBuilding === "school" ? { y: -8 } : { y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        onClick={onOpenSchool}
        onMouseEnter={() => setHoveredBuilding("school")}
        onMouseLeave={() => setHoveredBuilding(null)}
      >
        <div className="relative" style={{ width: 120, height: 145 }}>
          <svg viewBox="0 0 120 145" width="120" height="145">
            {/* Shadow */}
            <ellipse cx="60" cy="140" rx="48" ry="8" fill="rgba(0,0,0,0.2)" />
            {/* Building body - violet/purple */}
            <rect x="8" y="55" width="104" height="80" rx="4" fill="#7C3AED" />
            {/* Side shading */}
            <rect x="8" y="55" width="20" height="80" rx="4" fill="rgba(0,0,0,0.15)" />
            {/* Top shading */}
            <rect x="8" y="55" width="104" height="14" rx="4" fill="rgba(255,255,255,0.12)" />
            {/* Roof - special star shape */}
            <polygon points="4,57 60,6 116,57" fill="#4F46E5" />
            <polygon points="4,57 60,6 32,57" fill="rgba(0,0,0,0.18)" />
            {/* Star on roof */}
            <text x="60" y="32" textAnchor="middle" fontSize="16" fill="#FFD700">⭐</text>
            {/* Flag pole */}
            <line x1="60" y1="6" x2="60" y2="57" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
            {/* Windows - glowing yellow */}
            <rect x="16" y="68" width="24" height="20" rx="3" fill="#FFF176" />
            <rect x="80" y="68" width="24" height="20" rx="3" fill="#FFF176" />
            <line x1="28" y1="68" x2="28" y2="88" stroke="rgba(0,0,0,0.2)" strokeWidth="1.5" />
            <line x1="16" y1="78" x2="40" y2="78" stroke="rgba(0,0,0,0.2)" strokeWidth="1.5" />
            <line x1="92" y1="68" x2="92" y2="88" stroke="rgba(0,0,0,0.2)" strokeWidth="1.5" />
            <line x1="80" y1="78" x2="104" y2="78" stroke="rgba(0,0,0,0.2)" strokeWidth="1.5" />
            {/* Window shine */}
            <rect x="18" y="70" width="8" height="6" rx="1" fill="rgba(255,255,255,0.6)" />
            <rect x="82" y="70" width="8" height="6" rx="1" fill="rgba(255,255,255,0.6)" />
            {/* Second row windows */}
            <rect x="16" y="96" width="24" height="18" rx="3" fill="#FFF176" />
            <rect x="80" y="96" width="24" height="18" rx="3" fill="#FFF176" />
            {/* Door - special arch */}
            <rect x="44" y="104" width="32" height="31" rx="4" fill="#312E81" />
            <path d="M 44 108 Q 60 96 76 108" fill="#312E81" />
            <rect x="46" y="106" width="28" height="27" rx="3" fill="#3730A3" />
            {/* Door knob */}
            <circle cx="72" cy="121" r="2.5" fill="#FFD700" />
            {/* Steps */}
            <rect x="38" y="133" width="44" height="5" rx="2" fill="rgba(0,0,0,0.15)" />
            <rect x="41" y="131" width="38" height="4" rx="2" fill="rgba(255,255,255,0.15)" />
            {/* Sign board */}
            <rect x="20" y="57" width="80" height="12" rx="3" fill="#FFD700" />
            <text x="60" y="67" textAnchor="middle" fontSize="7" fill="#312E81" fontWeight="bold">
              {player?.schoolName ? player.schoolName.slice(0, 18) : "Meu Prédio"}
            </text>
          </svg>
          {/* Floating emoji */}
          <motion.div
            className="absolute -top-3 left-1/2 -translate-x-1/2 text-2xl"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          >
            🏫
          </motion.div>
        </div>
        {/* Label */}
        <div className="text-center mt-1">
          <span className="text-xs font-bold px-2 py-0.5 rounded-full shadow-md" style={{ background: "#7C3AED", color: "white", textShadow: "0 1px 2px rgba(0,0,0,0.4)" }}>
            {player?.schoolName ? player.schoolName.slice(0, 14) : "Meu Prédio"}
          </span>
        </div>
        {/* Hover tooltip */}
        <AnimatePresence>
          {hoveredBuilding === "school" && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              className="absolute -top-16 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-xl px-3 py-2 text-center z-50 min-w-max"
              style={{ border: "2px solid #7C3AED" }}
            >
              <p className="text-xs font-bold text-gray-800">🏫 {player?.schoolName ?? "Meu Prédio"}</p>
              <p className="text-xs text-gray-500">Seus materiais de estudo</p>
              <p className="text-xs font-semibold mt-1" style={{ color: "#7C3AED" }}>Clique para entrar! 📚</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Player Avatar on map */}
      <motion.div
        className="absolute cursor-pointer z-30"
        style={{ left: "44%", top: "72%" }}
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        onClick={onOpenAvatar}
        title="Clique para personalizar seu avatar"
      >
        <BlockyAvatar config={avatarConfig} size={56} />
        <div className="text-center mt-0.5">
          <span className="text-xs font-bold bg-white/80 backdrop-blur px-2 py-0.5 rounded-full shadow text-gray-700">
            {player?.nickname ?? "Jogador"}
          </span>
        </div>
      </motion.div>

      {/* HUD - Top bar */}
      <div className="absolute top-0 left-0 right-0 p-3 flex items-center justify-between z-40">
        {/* Logo */}
        <motion.div
          className="flex items-center gap-2"
          initial={{ x: -30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg text-xl"
            style={{ background: "linear-gradient(135deg, #FF6B6B, #FF8E53)" }}
          >
            🎓
          </div>
          <div>
            <h1 className="text-white font-black text-lg leading-none" style={{ textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}>
              EduGame
            </h1>
            <p className="text-white/80 text-xs">Aprenda jogando!</p>
          </div>
        </motion.div>

        {/* Points */}
        <motion.div
          className="flex items-center gap-2 bg-white/90 backdrop-blur rounded-2xl px-4 py-2 shadow-lg"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          whileHover={{ scale: 1.05 }}
        >
          <Zap className="w-5 h-5 text-yellow-500" />
          <span className="font-black text-lg text-gray-800">{player?.totalPoints ?? 0}</span>
          <span className="text-xs text-gray-500 font-medium">pts</span>
        </motion.div>

        {/* Nickname */}
        <motion.div
          className="bg-white/90 backdrop-blur rounded-2xl px-3 py-2 shadow-lg"
          initial={{ x: 30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
        >
          <p className="text-xs text-gray-500">Olá,</p>
          <p className="text-sm font-bold text-gray-800">{player?.nickname ?? "Jogador"}</p>
        </motion.div>
      </div>

      {/* Bottom navigation */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40">
        <motion.div
          className="flex items-center gap-3 bg-white/95 backdrop-blur rounded-3xl px-4 py-3 shadow-2xl"
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {[
            { icon: <BarChart2 className="w-5 h-5" />, label: "Progresso", color: "#4ECDC4", onClick: onOpenProgress },
            { icon: <ShoppingBag className="w-5 h-5" />, label: "Loja", color: "#FF6B6B", onClick: onOpenShop },
            { icon: <Flame className="w-5 h-5" />, label: "Diário", color: "#F97316", onClick: onOpenDaily },
            { icon: <Globe className="w-5 h-5" />, label: "Ranking", color: "#FFD700", onClick: onOpenRanking },
            { icon: <Swords className="w-5 h-5" />, label: "Duelo", color: "#EF4444", onClick: onOpenDuel },
            { icon: <Trophy className="w-5 h-5" />, label: "Conquistas", color: "#F59E0B", onClick: onOpenAchievements },
            { icon: <BookOpen className="w-5 h-5" />, label: "Material", color: "#7C3AED", onClick: onOpenStudy },
            { icon: <GraduationCap className="w-5 h-5" />, label: "Professor", color: "#3B82F6", onClick: onOpenTeacher },
            { icon: <Settings className="w-5 h-5" />, label: "Avatar", color: "#A8E6CF", onClick: onOpenAvatar },
            { icon: <BookMarked className="w-5 h-5" />, label: "História", color: "#8B5CF6", onClick: onOpenStory },
            { icon: <Bell className="w-5 h-5" />, label: "Alertas", color: "#10B981", onClick: onOpenNotifications },
          ].map((btn, i) => (
            <motion.button
              key={i}
              className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl transition-all"
              style={{ color: btn.color }}
              whileHover={{ scale: 1.1, backgroundColor: `${btn.color}20` }}
              whileTap={{ scale: 0.9 }}
              onClick={btn.onClick}
            >
              {btn.icon}
              <span className="text-xs font-semibold text-gray-600">{btn.label}</span>
            </motion.button>
          ))}
        </motion.div>
      </div>

      {/* Instruction hint */}
      <motion.div
        className="absolute top-20 left-1/2 -translate-x-1/2 z-30"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5 }}
      >
        <div className="bg-white/85 backdrop-blur rounded-2xl px-4 py-2 shadow-lg text-center">
          <p className="text-sm font-bold text-gray-700">🏫 Clique em um prédio para começar o quiz!</p>
        </div>
      </motion.div>
    </div>
  );
}
