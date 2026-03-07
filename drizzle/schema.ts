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
