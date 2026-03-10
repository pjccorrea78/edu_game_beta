import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
  json,
  float,
} from "drizzle-orm/mysql-core";

// ─── Users (auth) ────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Players (anonymous session-based) ───────────────────────────────────────
export const players = mysqlTable("players", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 128 }).notNull().unique(),
  nickname: varchar("nickname", { length: 64 }).default("Jogador").notNull(),
  schoolName: varchar("schoolName", { length: 128 }),
  totalPoints: int("totalPoints").default(0).notNull(),
  guardianEmail: varchar("guardianEmail", { length: 320 }),
  avatarConfig: json("avatarConfig").$type<AvatarConfig>(),
  avatarImageUrl: varchar("avatarImageUrl", { length: 1024 }),
  avatarShareCode: varchar("avatarShareCode", { length: 8 }).unique(),
  parentEmail: varchar("parentEmail", { length: 320 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Player = typeof players.$inferSelect;
export type InsertPlayer = typeof players.$inferInsert;

export type AvatarConfig = {
  skinColor: string;
  hairColor: string;
  shirtColor: string;
  pantsColor: string;
  equippedItems: number[];
  aiGeneratedName?: string;
};

// ─── Questions ────────────────────────────────────────────────────────────────
export const questions = mysqlTable("questions", {
  id: int("id").autoincrement().primaryKey(),
  discipline: mysqlEnum("discipline", [
    "matematica",
    "portugues",
    "geografia",
    "historia",
    "ciencias",
  ]).notNull(),
  difficulty: mysqlEnum("difficulty", ["easy", "medium", "hard"])
    .default("medium")
    .notNull(),
  questionText: text("questionText").notNull(),
  optionA: text("optionA").notNull(),
  optionB: text("optionB").notNull(),
  optionC: text("optionC").notNull(),
  optionD: text("optionD").notNull(),
  correctOption: mysqlEnum("correctOption", ["A", "B", "C", "D"]).notNull(),
  explanation: text("explanation"),
  isAiGenerated: boolean("isAiGenerated").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Question = typeof questions.$inferSelect;
export type InsertQuestion = typeof questions.$inferInsert;

export type Discipline =
  | "matematica"
  | "portugues"
  | "geografia"
  | "historia"
  | "ciencias";

// ─── Quiz Sessions ────────────────────────────────────────────────────────────
export const quizSessions = mysqlTable("quiz_sessions", {
  id: int("id").autoincrement().primaryKey(),
  playerId: int("playerId").notNull(),
  discipline: mysqlEnum("discipline", [
    "matematica",
    "portugues",
    "geografia",
    "historia",
    "ciencias",
  ]).notNull(),
  score: int("score").default(0).notNull(),
  correctAnswers: int("correctAnswers").default(0).notNull(),
  wrongAnswers: int("wrongAnswers").default(0).notNull(),
  totalQuestions: int("totalQuestions").default(10).notNull(),
  completed: boolean("completed").default(false).notNull(),
  pointsEarned: int("pointsEarned").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type QuizSession = typeof quizSessions.$inferSelect;
export type InsertQuizSession = typeof quizSessions.$inferInsert;

// ─── Equipment Items ──────────────────────────────────────────────────────────
export const equipmentItems = mysqlTable("equipment_items", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  description: text("description"),
  category: mysqlEnum("category", [
    "hat",
    "shirt",
    "pants",
    "accessory",
    "skin",
  ]).notNull(),
  pointsCost: int("pointsCost").notNull(),
  rarity: mysqlEnum("rarity", ["common", "rare", "epic", "legendary"])
    .default("common")
    .notNull(),
  colorValue: varchar("colorValue", { length: 32 }),
  iconEmoji: varchar("iconEmoji", { length: 8 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EquipmentItem = typeof equipmentItems.$inferSelect;
export type InsertEquipmentItem = typeof equipmentItems.$inferInsert;

// ─── Player Equipment ─────────────────────────────────────────────────────────
export const playerEquipment = mysqlTable("player_equipment", {
  id: int("id").autoincrement().primaryKey(),
  playerId: int("playerId").notNull(),
  itemId: int("itemId").notNull(),
  purchasedAt: timestamp("purchasedAt").defaultNow().notNull(),
});

export type PlayerEquipment = typeof playerEquipment.$inferSelect;

// ─── Notifications ────────────────────────────────────────────────────────────
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  playerId: int("playerId").notNull(),
  type: mysqlEnum("type", [
    "discipline_complete",
    "points_milestone",
    "all_equipment",
  ]).notNull(),
  message: text("message").notNull(),
  sentToEmail: varchar("sentToEmail", { length: 320 }),
  sent: boolean("sent").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;

// ─── Study Materials ──────────────────────────────────────────────────────────
export const studyMaterials = mysqlTable("study_materials", {
  id: int("id").autoincrement().primaryKey(),
  playerId: int("playerId").notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  contentText: text("contentText"),
  fileUrl: varchar("fileUrl", { length: 1024 }),
  fileType: mysqlEnum("fileType", ["text", "pdf", "image"]).default("text").notNull(),
  status: mysqlEnum("status", ["pending", "analyzing", "ready", "error"])
    .default("pending")
    .notNull(),
  discipline: varchar("discipline", { length: 64 }),
  questionsGenerated: int("questionsGenerated").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  analyzedAt: timestamp("analyzedAt"),
});

export type StudyMaterial = typeof studyMaterials.$inferSelect;
export type InsertStudyMaterial = typeof studyMaterials.$inferInsert;

// ─── Custom Quiz Questions (from study materials) ─────────────────────────────
export const customQuizQuestions = mysqlTable("custom_quiz_questions", {
  id: int("id").autoincrement().primaryKey(),
  materialId: int("materialId").notNull(),
  playerId: int("playerId").notNull(),
  questionText: text("questionText").notNull(),
  optionA: text("optionA").notNull(),
  optionB: text("optionB").notNull(),
  optionC: text("optionC").notNull(),
  optionD: text("optionD").notNull(),
  correctOption: mysqlEnum("correctOption", ["A", "B", "C", "D"]).notNull(),
  explanation: text("explanation"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CustomQuizQuestion = typeof customQuizQuestions.$inferSelect;
export type InsertCustomQuizQuestion = typeof customQuizQuestions.$inferInsert;

// ─── Custom Quiz Sessions (results for personal material quizzes) ─────────────
export const customQuizSessions = mysqlTable("custom_quiz_sessions", {
  id: int("id").autoincrement().primaryKey(),
  playerId: int("playerId").notNull(),
  materialId: int("materialId").notNull(),
  score: int("score").default(0).notNull(),
  correctAnswers: int("correctAnswers").default(0).notNull(),
  wrongAnswers: int("wrongAnswers").default(0).notNull(),
  totalQuestions: int("totalQuestions").default(10).notNull(),
  pointsEarned: int("pointsEarned").default(0).notNull(),
  nickname: varchar("nickname", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CustomQuizSession = typeof customQuizSessions.$inferSelect;
export type InsertCustomQuizSession = typeof customQuizSessions.$inferInsert;

// ─── Class Codes (teacher shares material with students) ──────────────────────
export const classCodes = mysqlTable("class_codes", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 8 }).notNull().unique(),
  ownerId: int("ownerId").notNull(),
  materialId: int("materialId").notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  usageCount: int("usageCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt"),
});

export type ClassCode = typeof classCodes.$inferSelect;
export type InsertClassCode = typeof classCodes.$inferInsert;

// ─── Player Achievements ────────────────────────────────────────────────────────────────
export const playerAchievements = mysqlTable("player_achievements", {
  id: int("id").autoincrement().primaryKey(),
  playerId: int("playerId").notNull(),
  achievementKey: varchar("achievementKey", { length: 64 }).notNull(),
  unlockedAt: timestamp("unlockedAt").defaultNow().notNull(),
});

export type PlayerAchievement = typeof playerAchievements.$inferSelect;
export type InsertPlayerAchievement = typeof playerAchievements.$inferInsert;

// ─── Avatar Shares ────────────────────────────────────────────────────────────
export const avatarShares = mysqlTable("avatar_shares", {
  id: int("id").autoincrement().primaryKey(),
  playerId: int("playerId").notNull(),
  shareCode: varchar("shareCode", { length: 8 }).notNull().unique(),
  imageUrl: varchar("imageUrl", { length: 1024 }).notNull(),
  avatarConfig: json("avatarConfig").$type<AvatarConfig>().notNull(),
  viewCount: int("viewCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt"),
});

export type AvatarShare = typeof avatarShares.$inferSelect;
export type InsertAvatarShare = typeof avatarShares.$inferInsert;

// ─── Daily Challenges ────────────────────────────────────────────────────────
export const dailyChallenges = mysqlTable("daily_challenges", {
  id: int("id").autoincrement().primaryKey(),
  date: varchar("date", { length: 10 }).notNull().unique(), // YYYY-MM-DD
  discipline: mysqlEnum("discipline", ["matematica", "portugues", "geografia", "historia", "ciencias"]).notNull(),
  questionText: text("questionText").notNull(),
  optionA: text("optionA").notNull(),
  optionB: text("optionB").notNull(),
  optionC: text("optionC").notNull(),
  optionD: text("optionD").notNull(),
  correctOption: mysqlEnum("correctOption", ["A", "B", "C", "D"]).notNull(),
  explanation: text("explanation"),
  bonusMultiplier: float("bonusMultiplier").default(2.0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DailyChallenge = typeof dailyChallenges.$inferSelect;
export type InsertDailyChallenge = typeof dailyChallenges.$inferInsert;

// ─── Daily Challenge Attempts ─────────────────────────────────────────────────
export const dailyChallengeAttempts = mysqlTable("daily_challenge_attempts", {
  id: int("id").autoincrement().primaryKey(),
  playerId: int("playerId").notNull(),
  challengeId: int("challengeId").notNull(),
  isCorrect: boolean("isCorrect").notNull(),
  pointsEarned: int("pointsEarned").default(0).notNull(),
  streakDay: int("streakDay").default(1).notNull(),
  attemptedAt: timestamp("attemptedAt").defaultNow().notNull(),
});

export type DailyChallengeAttempt = typeof dailyChallengeAttempts.$inferSelect;
export type InsertDailyChallengeAttempt = typeof dailyChallengeAttempts.$inferInsert;

// ─── Challenge Duels (multiplayer async) ─────────────────────────────────────
export const challengeDuels = mysqlTable("challenge_duels", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 8 }).notNull().unique(),
  challengerId: int("challengerId").notNull(),
  challengedId: int("challengedId"),
  quizType: mysqlEnum("quizType", ["discipline", "material"]).default("discipline").notNull(),
  discipline: mysqlEnum("discipline", ["matematica", "portugues", "geografia", "historia", "ciencias"]),
  materialId: int("materialId"),
  status: mysqlEnum("status", ["waiting", "in_progress", "completed"]).default("waiting").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt"),
});

export type ChallengeDuel = typeof challengeDuels.$inferSelect;
export type InsertChallengeDuel = typeof challengeDuels.$inferInsert;

// ─── Challenge Duel Results ───────────────────────────────────────────────────
export const challengeDuelResults = mysqlTable("challenge_duel_results", {
  id: int("id").autoincrement().primaryKey(),
  duelId: int("duelId").notNull(),
  playerId: int("playerId").notNull(),
  score: int("score").default(0).notNull(),
  correctAnswers: int("correctAnswers").default(0).notNull(),
  totalQuestions: int("totalQuestions").default(10).notNull(),
  nickname: varchar("nickname", { length: 64 }),
  completedAt: timestamp("completedAt").defaultNow().notNull(),
});

export type ChallengeDuelResult = typeof challengeDuelResults.$inferSelect;
export type InsertChallengeDuelResult = typeof challengeDuelResults.$inferInsert;

// ─── Story Missions ─────────────────────────────────────────────────────────────────────────────
export const storyMissions = mysqlTable("story_missions", {
  id: int("id").autoincrement().primaryKey(),
  order: int("order").notNull(),
  title: varchar("title", { length: 128 }).notNull(),
  description: text("description").notNull(),
  emoji: varchar("emoji", { length: 8 }).default("🎯").notNull(),
  discipline: mysqlEnum("discipline", ["matematica", "portugues", "geografia", "historia", "ciencias"]),
  requiresQuizzes: int("requiresQuizzes").default(1).notNull(),
  requiresPoints: int("requiresPoints").default(0).notNull(),
  rewardPoints: int("rewardPoints").default(50).notNull(),
  rewardBadge: varchar("rewardBadge", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type StoryMission = typeof storyMissions.$inferSelect;
export type InsertStoryMission = typeof storyMissions.$inferInsert;

// ─── Player Missions ────────────────────────────────────────────────────────────────────────────
export const playerMissions = mysqlTable("player_missions", {
  id: int("id").autoincrement().primaryKey(),
  playerId: int("playerId").notNull(),
  missionId: int("missionId").notNull(),
  completedAt: timestamp("completedAt").defaultNow().notNull(),
});

export type PlayerMission = typeof playerMissions.$inferSelect;
export type InsertPlayerMission = typeof playerMissions.$inferInsert;

// ─── Push Subscriptions ──────────────────────────────────────────────────────────────────────────
export const pushSubscriptions = mysqlTable("push_subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  playerId: int("playerId").notNull(),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type InsertPushSubscription = typeof pushSubscriptions.$inferInsert;

// ─── Parent Reports ────────────────────────────────────────────────────────────────────────────────
export const parentReports = mysqlTable("parent_reports", {
  id: int("id").autoincrement().primaryKey(),
  playerId: int("playerId").notNull(),
  parentEmail: varchar("parentEmail", { length: 320 }).notNull(),
  weekStart: varchar("weekStart", { length: 10 }).notNull(), // YYYY-MM-DD
  totalPoints: int("totalPoints").default(0).notNull(),
  quizzesCompleted: int("quizzesCompleted").default(0).notNull(),
  correctAnswers: int("correctAnswers").default(0).notNull(),
  totalAnswers: int("totalAnswers").default(0).notNull(),
  disciplinesStudied: json("disciplinesStudied").$type<string[]>(),
  achievementsUnlocked: int("achievementsUnlocked").default(0).notNull(),
  sentAt: timestamp("sentAt").defaultNow().notNull(),
});

export type ParentReport = typeof parentReports.$inferSelect;
export type InsertParentReport = typeof parentReports.$inferInsert;
