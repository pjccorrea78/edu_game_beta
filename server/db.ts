import { and, eq, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  players,
  questions,
  quizSessions,
  equipmentItems,
  playerEquipment,
  notifications,
  studyMaterials,
  customQuizQuestions,
  customQuizSessions,
  classCodes,
  playerAchievements,
  type AvatarConfig,
  type Discipline,
  type InsertPlayer,
  type InsertQuestion,
  type InsertStudyMaterial,
  type InsertCustomQuizQuestion,
  type InsertCustomQuizSession,
  type InsertClassCode,
  dailyChallenges,
  dailyChallengeAttempts,
  challengeDuels,
  challengeDuelResults,
  type InsertDailyChallenge,
  type InsertDailyChallengeAttempt,
  type InsertChallengeDuel,
  type InsertChallengeDuelResult,
  storyMissions,
  playerMissions,
  storyProgress,
  pushSubscriptions,
  parentReports,
  avatarShares,
  lessonCache,
  type InsertPlayerMission,
  type InsertPushSubscription,
  type InsertParentReport,
  type InsertAvatarShare,
  type LessonCache,
  type InsertLessonCache,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  textFields.forEach((field) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  });
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Players ──────────────────────────────────────────────────────────────────
export async function getOrCreatePlayer(sessionId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db
    .select()
    .from(players)
    .where(eq(players.sessionId, sessionId))
    .limit(1);
  if (existing.length > 0) return existing[0];
  
  // Gerar nickname único automaticamente
  const uniqueId = Math.random().toString(36).substring(2, 9).toUpperCase();
  const uniqueNickname = `Jogador_${uniqueId}`;
  
  await db.insert(players).values({ sessionId, nickname: uniqueNickname, totalPoints: 0 });
  const created = await db
    .select()
    .from(players)
    .where(eq(players.sessionId, sessionId))
    .limit(1);
  return created[0];
}

export async function updatePlayerPoints(playerId: number, pointsDelta: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(players)
    .set({ totalPoints: sql`GREATEST(0, ${players.totalPoints} + ${pointsDelta})` })
    .where(eq(players.id, playerId));
  const updated = await db.select().from(players).where(eq(players.id, playerId)).limit(1);
  return updated[0];
}

export async function updatePlayerAvatar(playerId: number, avatarConfig: AvatarConfig) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(players).set({ avatarConfig }).where(eq(players.id, playerId));
}

export async function updatePlayerNickname(playerId: number, nickname: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(players).set({ nickname }).where(eq(players.id, playerId));
}

export async function updatePlayerGuardianEmail(playerId: number, email: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(players).set({ guardianEmail: email }).where(eq(players.id, playerId));
}

export async function updatePlayerProfile(
  playerId: number,
  data: { age?: number; grade?: "1"|"2"|"3"|"4"|"5"|"6"|"7"|"8"|"9"; gender?: "masculino"|"feminino" }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(players).set(data).where(eq(players.id, playerId));
}

export async function updatePlayerSchoolName(playerId: number, schoolName: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(players).set({ schoolName }).where(eq(players.id, playerId));
}

// ─── Questions ────────────────────────────────────────────────────────────────
export async function getQuestionsByDiscipline(
  discipline: Discipline,
  limit = 10,
  difficulty?: "easy" | "medium" | "hard"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const conditions = difficulty
    ? and(eq(questions.discipline, discipline), eq(questions.difficulty, difficulty))
    : eq(questions.discipline, discipline);
  const all = await db.select().from(questions).where(conditions);
  // Shuffle and take limit
  const shuffled = all.sort(() => Math.random() - 0.5).slice(0, limit);
  return shuffled;
}

export async function countQuestionsByDiscipline(discipline: Discipline) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(questions)
    .where(eq(questions.discipline, discipline));
  return result[0]?.count ?? 0;
}

export async function insertQuestion(q: InsertQuestion) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(questions).values(q);
}

// ─── Quiz Sessions ────────────────────────────────────────────────────────────
export async function createQuizSession(playerId: number, discipline: Discipline) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(quizSessions).values({ playerId, discipline, score: 0 });
  const created = await db
    .select()
    .from(quizSessions)
    .where(and(eq(quizSessions.playerId, playerId), eq(quizSessions.completed, false)))
    .orderBy(desc(quizSessions.createdAt))
    .limit(1);
  return created[0];
}

export async function updateQuizSession(
  sessionId: number,
  data: {
    score?: number;
    correctAnswers?: number;
    wrongAnswers?: number;
    completed?: boolean;
    pointsEarned?: number;
    completedAt?: Date;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(quizSessions).set(data).where(eq(quizSessions.id, sessionId));
}

export async function getPlayerQuizHistory(playerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(quizSessions)
    .where(and(eq(quizSessions.playerId, playerId), eq(quizSessions.completed, true)))
    .orderBy(desc(quizSessions.createdAt))
    .limit(20);
}

export async function getBestScoreByDiscipline(playerId: number, discipline: Discipline) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(quizSessions)
    .where(
      and(
        eq(quizSessions.playerId, playerId),
        eq(quizSessions.discipline, discipline),
        eq(quizSessions.completed, true)
      )
    )
    .orderBy(desc(quizSessions.score))
    .limit(1);
  return result[0] ?? null;
}

// ─── Equipment ────────────────────────────────────────────────────────────────
export async function getAllEquipmentItems() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(equipmentItems).orderBy(equipmentItems.pointsCost);
}

export async function getPlayerOwnedItems(playerId: number) {
  const db = await getDb();
  if (!db) return [];
  const owned = await db
    .select({ itemId: playerEquipment.itemId })
    .from(playerEquipment)
    .where(eq(playerEquipment.playerId, playerId));
  return owned.map((o) => o.itemId);
}

export async function purchaseItem(playerId: number, itemId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Check already owned
  const existing = await db
    .select()
    .from(playerEquipment)
    .where(and(eq(playerEquipment.playerId, playerId), eq(playerEquipment.itemId, itemId)))
    .limit(1);
  if (existing.length > 0) throw new Error("Item já adquirido");
  await db.insert(playerEquipment).values({ playerId, itemId });
}

// ─── Notifications ────────────────────────────────────────────────────────────
export async function createNotification(
  playerId: number,
  type: "discipline_complete" | "points_milestone" | "all_equipment",
  message: string,
  email?: string
) {
  const db = await getDb();
  if (!db) return;
  await db.insert(notifications).values({ playerId, type, message, sentToEmail: email });
}

export async function markNotificationSent(notificationId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ sent: true }).where(eq(notifications.id, notificationId));
}

export async function getUnsentNotifications() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notifications).where(eq(notifications.sent, false)).limit(50);
}

// ─── Study Materials ──────────────────────────────────────────────────────────
export async function createStudyMaterial(data: InsertStudyMaterial) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(studyMaterials).values(data);
  const created = await db
    .select()
    .from(studyMaterials)
    .where(and(eq(studyMaterials.playerId, data.playerId!), eq(studyMaterials.title, data.title)))
    .orderBy(desc(studyMaterials.createdAt))
    .limit(1);
  return created[0];
}

export async function updateStudyMaterialStatus(
  materialId: number,
  status: "pending" | "analyzing" | "ready" | "error",
  questionsGenerated?: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData: Record<string, unknown> = { status };
  if (status === "ready" || status === "error") updateData.analyzedAt = new Date();
  if (questionsGenerated !== undefined) updateData.questionsGenerated = questionsGenerated;
  await db.update(studyMaterials).set(updateData).where(eq(studyMaterials.id, materialId));
}

export async function getStudyMaterialsByPlayer(playerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(studyMaterials)
    .where(eq(studyMaterials.playerId, playerId))
    .orderBy(desc(studyMaterials.createdAt))
    .limit(20);
}

export async function getStudyMaterialById(materialId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(studyMaterials)
    .where(eq(studyMaterials.id, materialId))
    .limit(1);
  return result[0] ?? null;
}

export async function insertCustomQuizQuestions(questions: InsertCustomQuizQuestion[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(customQuizQuestions).values(questions);
}

export async function getCustomQuizQuestions(materialId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(customQuizQuestions)
    .where(eq(customQuizQuestions.materialId, materialId))
    .orderBy(customQuizQuestions.id);
}

export async function deleteCustomQuizQuestions(materialId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(customQuizQuestions).where(eq(customQuizQuestions.materialId, materialId));
}

// ─── Custom Quiz Sessions (ranking) ────────────────────────────────────────────
export async function createCustomQuizSession(data: InsertCustomQuizSession) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(customQuizSessions).values(data);
}

export async function getRankingByMaterial(materialId: number, limit = 10) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(customQuizSessions)
    .where(eq(customQuizSessions.materialId, materialId))
    .orderBy(desc(customQuizSessions.score), desc(customQuizSessions.correctAnswers))
    .limit(limit);
}

export async function getPlayerBestByMaterial(playerId: number, materialId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(customQuizSessions)
    .where(and(eq(customQuizSessions.playerId, playerId), eq(customQuizSessions.materialId, materialId)))
    .orderBy(desc(customQuizSessions.score))
    .limit(1);
  return result[0] ?? null;
}

// ─── Class Codes ───────────────────────────────────────────────────────────────────────
export async function createClassCode(data: InsertClassCode) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(classCodes).values(data);
  const result = await db.select().from(classCodes).where(eq(classCodes.code, data.code)).limit(1);
  return result[0];
}

export async function getClassCodeByCode(code: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(classCodes).where(eq(classCodes.code, code.toUpperCase())).limit(1);
  return result[0] ?? null;
}

export async function incrementClassCodeUsage(codeId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(classCodes).set({ usageCount: sql`${classCodes.usageCount} + 1` }).where(eq(classCodes.id, codeId));
}

export async function getClassCodesByOwner(ownerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(classCodes).where(eq(classCodes.ownerId, ownerId)).orderBy(desc(classCodes.createdAt)).limit(20);
}

// ─── Player Achievements ───────────────────────────────────────────────────────
export async function getPlayerAchievements(playerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(playerAchievements).where(eq(playerAchievements.playerId, playerId));
}

export async function unlockAchievement(playerId: number, achievementKey: string) {
  const db = await getDb();
  if (!db) return;
  // Check if already unlocked
  const existing = await db.select().from(playerAchievements)
    .where(and(eq(playerAchievements.playerId, playerId), eq(playerAchievements.achievementKey, achievementKey)))
    .limit(1);
  if (existing.length > 0) return false; // Already unlocked
  await db.insert(playerAchievements).values({ playerId, achievementKey });
  return true; // Newly unlocked
}

// ─── Teacher Panel ────────────────────────────────────────────────────────────
export async function getTurmaProgress(materialId: number) {
  const db = await getDb();
  if (!db) return [];
  // Get all sessions for this material, joined with player nicknames
  const sessions = await db.select({
    id: customQuizSessions.id,
    playerId: customQuizSessions.playerId,
    nickname: customQuizSessions.nickname,
    score: customQuizSessions.score,
    correctAnswers: customQuizSessions.correctAnswers,
    totalQuestions: customQuizSessions.totalQuestions,
    pointsEarned: customQuizSessions.pointsEarned,
    createdAt: customQuizSessions.createdAt,
  }).from(customQuizSessions)
    .where(eq(customQuizSessions.materialId, materialId))
    .orderBy(desc(customQuizSessions.score))
    .limit(100);
  return sessions;
}

export async function getTurmaStats(materialId: number) {
  const db = await getDb();
  if (!db) return null;
  const sessions = await getTurmaProgress(materialId);
  if (sessions.length === 0) return { totalStudents: 0, avgScore: 0, avgAccuracy: 0, topScore: 0 };
  const totalStudents = new Set(sessions.map(s => s.playerId)).size;
  const avgScore = Math.round(sessions.reduce((a, s) => a + s.score, 0) / sessions.length);
  const avgAccuracy = Math.round(sessions.reduce((a, s) => a + (s.correctAnswers / s.totalQuestions * 100), 0) / sessions.length);
  const topScore = Math.max(...sessions.map(s => s.score));
  return { totalStudents, avgScore, avgAccuracy, topScore };
}

// ─── Daily Challenges ────────────────────────────────────────────────────────
export async function getDailyChallengeByDate(date: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(dailyChallenges).where(eq(dailyChallenges.date, date)).limit(1);
  return result[0] ?? null;
}
export async function createDailyChallenge(data: InsertDailyChallenge) {
  const db = await getDb();
  if (!db) return null;
  await db.insert(dailyChallenges).values(data);
  return getDailyChallengeByDate(data.date as string);
}
export async function getPlayerDailyAttempt(playerId: number, challengeId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(dailyChallengeAttempts)
    .where(and(eq(dailyChallengeAttempts.playerId, playerId), eq(dailyChallengeAttempts.challengeId, challengeId)))
    .limit(1);
  return result[0] ?? null;
}
export async function createDailyChallengeAttempt(data: InsertDailyChallengeAttempt) {
  const db = await getDb();
  if (!db) return;
  await db.insert(dailyChallengeAttempts).values(data);
}
export async function getPlayerDailyStreak(playerId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const attempts = await db.select({ streakDay: dailyChallengeAttempts.streakDay })
    .from(dailyChallengeAttempts)
    .where(eq(dailyChallengeAttempts.playerId, playerId))
    .orderBy(desc(dailyChallengeAttempts.attemptedAt))
    .limit(1);
  return attempts[0]?.streakDay ?? 0;
}

// ─── Global Leaderboard ───────────────────────────────────────────────────────
export async function getGlobalLeaderboard(limit = 10) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: players.id,
    nickname: players.nickname,
    totalPoints: players.totalPoints,
    avatarConfig: players.avatarConfig,
  }).from(players)
    .orderBy(desc(players.totalPoints))
    .limit(limit);
}
export async function getPlayerRank(playerId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const player = await db.select({ totalPoints: players.totalPoints }).from(players).where(eq(players.id, playerId)).limit(1);
  if (!player[0]) return 0;
  const above = await db.select({ count: sql<number>`count(*)` }).from(players)
    .where(sql`${players.totalPoints} > ${player[0].totalPoints}`);
  return (above[0]?.count ?? 0) + 1;
}

// ─── Challenge Duels ───────────────────────────────────────────────────────────
export async function createChallengeDuel(data: InsertChallengeDuel) {
  const db = await getDb();
  if (!db) return null;
  await db.insert(challengeDuels).values(data);
  const result = await db.select().from(challengeDuels).where(eq(challengeDuels.code, data.code as string)).limit(1);
  return result[0] ?? null;
}
export async function getChallengeDuelByCode(code: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(challengeDuels).where(eq(challengeDuels.code, code)).limit(1);
  return result[0] ?? null;
}
export async function updateChallengeDuelStatus(id: number, status: 'waiting' | 'in_progress' | 'completed', challengedId?: number) {
  const db = await getDb();
  if (!db) return;
  const updateData: Record<string, unknown> = { status };
  if (challengedId !== undefined) updateData.challengedId = challengedId;
  await db.update(challengeDuels).set(updateData).where(eq(challengeDuels.id, id));
}
export async function createChallengeDuelResult(data: InsertChallengeDuelResult) {
  const db = await getDb();
  if (!db) return;
  await db.insert(challengeDuelResults).values(data);
}
export async function getChallengeDuelResults(duelId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(challengeDuelResults).where(eq(challengeDuelResults.duelId, duelId));
}
export async function getPlayerDuels(playerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(challengeDuels)
    .where(sql`${challengeDuels.challengerId} = ${playerId} OR ${challengeDuels.challengedId} = ${playerId}`)
    .orderBy(desc(challengeDuels.createdAt))
    .limit(20);
}

// ─── Story Missions ────────────────────────────────────────────────────────────────────────────
export async function getAllStoryMissions() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(storyMissions).orderBy(storyMissions.order);
}
export async function getPlayerMissions(playerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(playerMissions).where(eq(playerMissions.playerId, playerId));
}
export async function completeMission(data: InsertPlayerMission) {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select().from(playerMissions)
    .where(and(eq(playerMissions.playerId, data.playerId), eq(playerMissions.missionId, data.missionId)))
    .limit(1);
  if (existing.length > 0) return; // already completed
  await db.insert(playerMissions).values(data);
}

// ─── Push Subscriptions ──────────────────────────────────────────────────────────────────────────
export async function savePushSubscription(data: InsertPushSubscription) {
  const db = await getDb();
  if (!db) return;
  // Remove existing subscription for this player to avoid duplicates
  await db.delete(pushSubscriptions).where(eq(pushSubscriptions.playerId, data.playerId));
  await db.insert(pushSubscriptions).values(data);
}
export async function getAllPushSubscriptions() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pushSubscriptions);
}
export async function deletePushSubscription(playerId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(pushSubscriptions).where(eq(pushSubscriptions.playerId, playerId));
}
export async function getPlayerPushSubscription(playerId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.playerId, playerId)).limit(1);
  return result[0] ?? null;
}

// ─── Parent Reports ───────────────────────────────────────────────────────────────────────────────
export async function saveParentReport(data: InsertParentReport) {
  const db = await getDb();
  if (!db) return;
  await db.insert(parentReports).values(data);
}
export async function getPlayerWeeklyStats(playerId: number, weekStart: string) {
  const db = await getDb();
  if (!db) return null;
  // Get quiz sessions from this week
  const weekStartDate = new Date(weekStart);
  const weekEndDate = new Date(weekStartDate);
  weekEndDate.setDate(weekEndDate.getDate() + 7);
  const sessions = await db.select().from(quizSessions)
    .where(and(
      eq(quizSessions.playerId, playerId),
      eq(quizSessions.completed, true),
      sql`${quizSessions.completedAt} >= ${weekStartDate} AND ${quizSessions.completedAt} < ${weekEndDate}`
    ));
  const totalCorrect = sessions.reduce((s, q) => s + q.correctAnswers, 0);
  const totalAnswers = sessions.reduce((s, q) => s + q.totalQuestions, 0);
  const disciplines = Array.from(new Set(sessions.map(s => s.discipline)));
  const achievements = await db.select().from(playerAchievements)
    .where(and(
      eq(playerAchievements.playerId, playerId),
      sql`${playerAchievements.unlockedAt} >= ${weekStartDate}`
    ));
  return {
    quizzesCompleted: sessions.length,
    correctAnswers: totalCorrect,
    totalAnswers,
    disciplinesStudied: disciplines,
    achievementsUnlocked: achievements.length,
  };
}
export async function getLastParentReport(playerId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(parentReports)
    .where(eq(parentReports.playerId, playerId))
    .orderBy(desc(parentReports.sentAt))
    .limit(1);
  return result[0] ?? null;
}

// ─── Avatar Image & Sharing ───────────────────────────────────────────────────────────────────────
export async function saveAvatarImage(playerId: number, imageUrl: string, config: AvatarConfig) {
  const db = await getDb();
  if (!db) return;
  await db.update(players).set({ avatarImageUrl: imageUrl }).where(eq(players.id, playerId));
}

export async function createAvatarShare(playerId: number, imageUrl: string, config: AvatarConfig) {
  const db = await getDb();
  if (!db) return null;
  const shareCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  const result = await db.insert(avatarShares).values({
    playerId,
    shareCode,
    imageUrl,
    avatarConfig: config,
  });
  // Update player with share code
  await db.update(players).set({ avatarShareCode: shareCode }).where(eq(players.id, playerId));
  return shareCode;
}

export async function getAvatarShare(shareCode: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(avatarShares).where(eq(avatarShares.shareCode, shareCode)).limit(1);
  if (result[0]) {
    // Increment view count
    await db.update(avatarShares).set({ viewCount: result[0].viewCount + 1 }).where(eq(avatarShares.shareCode, shareCode));
  }
  return result[0] ?? null;
}

export async function updateParentEmail(playerId: number, email: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(players).set({ parentEmail: email }).where(eq(players.id, playerId));
}

// ─── Story Progress (Dynamic Missions) ────────────────────────────────────────────────────────────
export async function getOrCreateStoryProgress(playerId: number) {
  const db = await getDb();
  if (!db) return null;
  
  // Check if player already has story progress
  const existing = await db.select().from(storyProgress).where(eq(storyProgress.playerId, playerId)).limit(1);
  if (existing.length > 0) return existing[0];
  
  // Create new story progress with random discipline sequence
  const disciplines: Discipline[] = [
    "matematica",
    "portugues",
    "geografia",
    "historia",
    "ciencias",
    "educacao_fisica",
    "arte",
    "ensino_religioso",
  ];
  
  // Shuffle disciplines array
  const shuffled = [...disciplines].sort(() => Math.random() - 0.5);
  
  const result = await db.insert(storyProgress).values({
    playerId,
    disciplineSequence: shuffled,
    currentDisciplineIndex: 0,
    currentDifficulty: "easy",
    questionsAnswered: 0,
    completedDisciplines: [],
    totalScore: 0,
  });
  
  const newProgress = await db.select().from(storyProgress).where(eq(storyProgress.playerId, playerId)).limit(1);
  return newProgress[0] ?? null;
}

export async function getStoryProgress(playerId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(storyProgress).where(eq(storyProgress.playerId, playerId)).limit(1);
  return result[0] ?? null;
}

export async function updateStoryProgress(playerId: number, updates: {
  currentDisciplineIndex?: number;
  currentDifficulty?: "easy" | "medium" | "hard";
  questionsAnswered?: number;
  completedDisciplines?: string[];
  totalScore?: number;
}) {
  const db = await getDb();
  if (!db) return;
  await db.update(storyProgress).set(updates).where(eq(storyProgress.playerId, playerId));
}

export async function completeStoryProgress(playerId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(storyProgress).set({ completedAt: new Date() }).where(eq(storyProgress.playerId, playerId));
}


// ─── Lesson Cache ────────────────────────────────────────────────────────────────
export async function getCachedLesson(discipline: Discipline, grade: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(lessonCache)
    .where(and(eq(lessonCache.discipline, discipline), eq(lessonCache.grade, grade)))
    .limit(1);
  return result[0] ?? null;
}

export async function saveLessonCache(discipline: Discipline, grade: number, lessonData: any) {
  const db = await getDb();
  if (!db) return;
  
  // Check if cache already exists
  const existing = await getCachedLesson(discipline, grade);
  if (existing) {
    // Update existing cache
    await db.update(lessonCache).set({ lessonData }).where(
      and(eq(lessonCache.discipline, discipline), eq(lessonCache.grade, grade))
    );
  } else {
    // Insert new cache
    await db.insert(lessonCache).values({
      discipline,
      grade,
      lessonData,
    });
  }
}

export async function getAllLessonCaches() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(lessonCache);
}
