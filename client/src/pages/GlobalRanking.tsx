import React from "react";
import { motion } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { useGame } from "@/contexts/GameContext";
import BlockyAvatar from "@/components/BlockyAvatar";

const MEDAL_COLORS = ["#FFD700", "#C0C0C0", "#CD7F32"];
const MEDAL_EMOJIS = ["🥇", "🥈", "🥉"];
const RANK_BG = [
  "linear-gradient(135deg, #FFD700, #FFA500)",
  "linear-gradient(135deg, #C0C0C0, #A0A0A0)",
  "linear-gradient(135deg, #CD7F32, #8B4513)",
];

export default function GlobalRanking({ onBack }: { onBack: () => void }) {
  const { sessionId } = useGame();
  const { data, isLoading } = trpc.globalLeaderboard.getTop10.useQuery(
    { sessionId },
    { refetchInterval: 15000 }
  );

  const top3 = data?.top10.slice(0, 3) ?? [];
  const rest = data?.top10.slice(3) ?? [];

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "linear-gradient(160deg, #0f0c29, #302b63, #24243e)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 pt-6">
        <motion.button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white text-xl"
          whileTap={{ scale: 0.9 }}
        >
          ←
        </motion.button>
        <div className="text-center">
          <h1
            className="text-white font-bold text-xl"
            style={{ fontFamily: "'Fredoka One', cursive" }}
          >
            🏆 Mural da Fama
          </h1>
          <p className="text-white/50 text-xs">Top 10 jogadores</p>
        </div>
        <div className="w-10" />
      </div>

      {/* My rank banner */}
      {data && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 mb-4 rounded-2xl px-4 py-3 flex items-center justify-between"
          style={{ background: "rgba(124,58,237,0.3)", border: "1px solid rgba(124,58,237,0.5)" }}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎮</span>
            <div>
              <p className="text-white font-bold text-sm">{data.myNickname}</p>
              <p className="text-white/60 text-xs">{data.myPoints} pontos</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-yellow-400 font-bold text-lg">#{data.myRank}</p>
            <p className="text-white/50 text-xs">sua posição</p>
          </div>
        </motion.div>
      )}

      <div className="flex-1 overflow-y-auto px-4 pb-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full mb-4"
            />
            <p className="text-white/60 text-sm">Carregando ranking...</p>
          </div>
        ) : (
          <>
            {/* Podium */}
            {top3.length >= 3 && (
              <div className="mb-6">
                <h2
                  className="text-center text-white/70 text-sm font-bold mb-4 uppercase tracking-wider"
                  style={{ fontFamily: "'Fredoka One', cursive" }}
                >
                  ✨ Pódio dos Campeões ✨
                </h2>
                <div className="flex items-end justify-center gap-3">
                  {/* 2nd place */}
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-col items-center"
                  >
                    <div className="text-2xl mb-1">{MEDAL_EMOJIS[1]}</div>
                    <div className="w-14 h-14 rounded-2xl overflow-hidden mb-2 shadow-lg" style={{ border: `2px solid ${MEDAL_COLORS[1]}` }}>
                      <BlockyAvatar
                        config={top3[1]?.avatarConfig as Parameters<typeof BlockyAvatar>[0]["config"] ?? undefined}
                        size={56}
                      />
                    </div>
                    <p className="text-white text-xs font-bold text-center max-w-16 truncate">{top3[1]?.nickname}</p>
                    <p className="text-silver-400 text-xs" style={{ color: MEDAL_COLORS[1] }}>{top3[1]?.totalPoints}pts</p>
                    <div
                      className="w-20 rounded-t-xl mt-2 flex items-center justify-center"
                      style={{ height: "60px", background: RANK_BG[1] }}
                    >
                      <span className="text-white font-bold text-2xl">2</span>
                    </div>
                  </motion.div>

                  {/* 1st place */}
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex flex-col items-center"
                  >
                    <motion.div
                      animate={{ y: [-3, 3, -3] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="text-3xl mb-1"
                    >
                      {MEDAL_EMOJIS[0]}
                    </motion.div>
                    <div className="w-16 h-16 rounded-2xl overflow-hidden mb-2 shadow-2xl" style={{ border: `3px solid ${MEDAL_COLORS[0]}` }}>
                      <BlockyAvatar
                        config={top3[0]?.avatarConfig as Parameters<typeof BlockyAvatar>[0]["config"] ?? undefined}
                        size={64}
                      />
                    </div>
                    <p className="text-white text-sm font-bold text-center max-w-20 truncate">{top3[0]?.nickname}</p>
                    <p className="text-yellow-400 text-sm font-bold">{top3[0]?.totalPoints}pts</p>
                    <div
                      className="w-20 rounded-t-xl mt-2 flex items-center justify-center"
                      style={{ height: "80px", background: RANK_BG[0] }}
                    >
                      <span className="text-white font-bold text-3xl">1</span>
                    </div>
                  </motion.div>

                  {/* 3rd place */}
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex flex-col items-center"
                  >
                    <div className="text-2xl mb-1">{MEDAL_EMOJIS[2]}</div>
                    <div className="w-14 h-14 rounded-2xl overflow-hidden mb-2 shadow-lg" style={{ border: `2px solid ${MEDAL_COLORS[2]}` }}>
                      <BlockyAvatar
                        config={top3[2]?.avatarConfig as Parameters<typeof BlockyAvatar>[0]["config"] ?? undefined}
                        size={56}
                      />
                    </div>
                    <p className="text-white text-xs font-bold text-center max-w-16 truncate">{top3[2]?.nickname}</p>
                    <p className="text-xs" style={{ color: MEDAL_COLORS[2] }}>{top3[2]?.totalPoints}pts</p>
                    <div
                      className="w-20 rounded-t-xl mt-2 flex items-center justify-center"
                      style={{ height: "45px", background: RANK_BG[2] }}
                    >
                      <span className="text-white font-bold text-xl">3</span>
                    </div>
                  </motion.div>
                </div>
              </div>
            )}

            {/* Rest of the list */}
            {rest.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-white/50 text-xs font-bold uppercase tracking-wider mb-3">
                  Classificação Geral
                </h2>
                {rest.map((player, i) => {
                  const rank = i + 4;
                  const isMe = data?.myNickname === player.nickname && data?.myPoints === player.totalPoints;
                  return (
                    <motion.div
                      key={player.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-3 rounded-2xl px-4 py-3"
                      style={{
                        background: isMe ? "rgba(124,58,237,0.3)" : "rgba(255,255,255,0.06)",
                        border: isMe ? "1px solid rgba(124,58,237,0.6)" : "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      <span className="text-white/50 font-bold w-6 text-center text-sm">#{rank}</span>
                      <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0">
                        <BlockyAvatar
                          config={player.avatarConfig as Parameters<typeof BlockyAvatar>[0]["config"] ?? undefined}
                          size={40}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-semibold truncate">{player.nickname}</p>
                      </div>
                      <p className="text-yellow-400 font-bold text-sm">{player.totalPoints} pts</p>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {data?.top10.length === 0 && (
              <div className="text-center py-16">
                <p className="text-5xl mb-3">🏆</p>
                <p className="text-white/60 text-sm">Nenhum jogador ainda.</p>
                <p className="text-white/40 text-xs mt-1">Seja o primeiro a aparecer aqui!</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
