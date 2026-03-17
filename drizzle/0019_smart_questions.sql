-- Migration: Smart question generation and tracking
-- Date: 2026-03-16

-- Add timesServed counter to questions
ALTER TABLE `questions` ADD COLUMN `timesServed` int NOT NULL DEFAULT 0;

-- Track which questions each player has seen
CREATE TABLE IF NOT EXISTS `player_question_history` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `playerId` int NOT NULL,
  `questionId` int NOT NULL,
  `wasCorrect` boolean NOT NULL DEFAULT false,
  `servedAt` timestamp NOT NULL DEFAULT (now())
);

-- Indexes for fast lookups
CREATE INDEX `idx_pqh_player` ON `player_question_history` (`playerId`);
CREATE INDEX `idx_pqh_question` ON `player_question_history` (`questionId`);
CREATE INDEX `idx_pqh_player_question` ON `player_question_history` (`playerId`, `questionId`);
CREATE INDEX `idx_questions_times_served` ON `questions` (`discipline`, `timesServed`);
