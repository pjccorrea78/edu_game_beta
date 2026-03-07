CREATE TABLE `equipment_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`description` text,
	`category` enum('hat','shirt','pants','accessory','skin') NOT NULL,
	`pointsCost` int NOT NULL,
	`rarity` enum('common','rare','epic','legendary') NOT NULL DEFAULT 'common',
	`colorValue` varchar(32),
	`iconEmoji` varchar(8),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `equipment_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int NOT NULL,
	`type` enum('discipline_complete','points_milestone','all_equipment') NOT NULL,
	`message` text NOT NULL,
	`sentToEmail` varchar(320),
	`sent` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `player_equipment` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int NOT NULL,
	`itemId` int NOT NULL,
	`purchasedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `player_equipment_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `players` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(128) NOT NULL,
	`nickname` varchar(64) NOT NULL DEFAULT 'Jogador',
	`totalPoints` int NOT NULL DEFAULT 0,
	`guardianEmail` varchar(320),
	`avatarConfig` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `players_id` PRIMARY KEY(`id`),
	CONSTRAINT `players_sessionId_unique` UNIQUE(`sessionId`)
);
--> statement-breakpoint
CREATE TABLE `questions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`discipline` enum('matematica','portugues','geografia','historia','ciencias') NOT NULL,
	`difficulty` enum('easy','medium','hard') NOT NULL DEFAULT 'medium',
	`questionText` text NOT NULL,
	`optionA` text NOT NULL,
	`optionB` text NOT NULL,
	`optionC` text NOT NULL,
	`optionD` text NOT NULL,
	`correctOption` enum('A','B','C','D') NOT NULL,
	`explanation` text,
	`isAiGenerated` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `questions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quiz_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int NOT NULL,
	`discipline` enum('matematica','portugues','geografia','historia','ciencias') NOT NULL,
	`score` int NOT NULL DEFAULT 0,
	`correctAnswers` int NOT NULL DEFAULT 0,
	`wrongAnswers` int NOT NULL DEFAULT 0,
	`totalQuestions` int NOT NULL DEFAULT 10,
	`completed` boolean NOT NULL DEFAULT false,
	`pointsEarned` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `quiz_sessions_id` PRIMARY KEY(`id`)
);
