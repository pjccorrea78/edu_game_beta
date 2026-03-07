CREATE TABLE `parent_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int NOT NULL,
	`parentEmail` varchar(320) NOT NULL,
	`weekStart` varchar(10) NOT NULL,
	`totalPoints` int NOT NULL DEFAULT 0,
	`quizzesCompleted` int NOT NULL DEFAULT 0,
	`correctAnswers` int NOT NULL DEFAULT 0,
	`totalAnswers` int NOT NULL DEFAULT 0,
	`disciplinesStudied` json,
	`achievementsUnlocked` int NOT NULL DEFAULT 0,
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `parent_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `player_missions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int NOT NULL,
	`missionId` int NOT NULL,
	`completedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `player_missions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `push_subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int NOT NULL,
	`endpoint` text NOT NULL,
	`p256dh` text NOT NULL,
	`auth` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `push_subscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `story_missions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`order` int NOT NULL,
	`title` varchar(128) NOT NULL,
	`description` text NOT NULL,
	`emoji` varchar(8) NOT NULL DEFAULT '🎯',
	`discipline` enum('matematica','portugues','geografia','historia','ciencias'),
	`requiresQuizzes` int NOT NULL DEFAULT 1,
	`requiresPoints` int NOT NULL DEFAULT 0,
	`rewardPoints` int NOT NULL DEFAULT 50,
	`rewardBadge` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `story_missions_id` PRIMARY KEY(`id`)
);
