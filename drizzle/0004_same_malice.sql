CREATE TABLE `class_codes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(8) NOT NULL,
	`ownerId` int NOT NULL,
	`materialId` int NOT NULL,
	`title` varchar(256) NOT NULL,
	`usageCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp,
	CONSTRAINT `class_codes_id` PRIMARY KEY(`id`),
	CONSTRAINT `class_codes_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `custom_quiz_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int NOT NULL,
	`materialId` int NOT NULL,
	`score` int NOT NULL DEFAULT 0,
	`correctAnswers` int NOT NULL DEFAULT 0,
	`wrongAnswers` int NOT NULL DEFAULT 0,
	`totalQuestions` int NOT NULL DEFAULT 10,
	`pointsEarned` int NOT NULL DEFAULT 0,
	`nickname` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `custom_quiz_sessions_id` PRIMARY KEY(`id`)
);
