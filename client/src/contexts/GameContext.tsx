import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { nanoid } from "nanoid";

export type AvatarConfig = {
  skinColor: string;
  hairColor: string;
  shirtColor: string;
  pantsColor: string;
  equippedItems: number[];
};

export type Player = {
  id: number;
  sessionId: string;
  nickname: string;
  schoolName?: string | null;
  totalPoints: number;
  guardianEmail?: string | null;
  avatarConfig?: AvatarConfig | null;
};

type GameContextType = {
  sessionId: string;
  player: Player | null;
  isLoading: boolean;
  refreshPlayer: () => void;
  updatePoints: (delta: number) => void;
};

const GameContext = createContext<GameContextType | null>(null);

function getOrCreateSessionId(): string {
  const key = "edugame_session_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = nanoid(32);
    localStorage.setItem(key, id);
  }
  return id;
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [sessionId] = useState(() => getOrCreateSessionId());
  const [player, setPlayer] = useState<Player | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const getOrCreate = trpc.player.getOrCreate.useMutation();

  const loadPlayer = useCallback(async () => {
    try {
      setIsLoading(true);
      const p = await getOrCreate.mutateAsync({ sessionId });
      setPlayer(p as Player);
    } catch (e) {
      console.error("Failed to load player", e);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    loadPlayer();
  }, []);

  const refreshPlayer = useCallback(() => {
    loadPlayer();
  }, [loadPlayer]);

  const updatePoints = useCallback((delta: number) => {
    setPlayer((prev) => {
      if (!prev) return prev;
      return { ...prev, totalPoints: Math.max(0, prev.totalPoints + delta) };
    });
  }, []);

  return (
    <GameContext.Provider value={{ sessionId, player, isLoading, refreshPlayer, updatePoints }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}
