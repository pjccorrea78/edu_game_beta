CREATE TABLE `challenge_duel_results` (
	`id` int AUTO_INCREMENT NOT NULL,
	`duelId` int NOT NULL,
	`playerId` int NOT NULL,
	`score` int NOT NULL DEFAULT 0,
	`correctAnswers` int NOT NULL DEFAULT 0,
	`totalQuestions` int NOT NULL DEFAULT 10,
	`nickname` varchar(64),
	`completedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `challenge_duel_results_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `challenge_duels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(8) NOT NULL,
	`challengerId` int NOT NULL,
	`challengedId` int,
	`quizType` enum('discipline','material') NOT NULL DEFAULT 'discipline',
	`discipline` enum('matematica','portugues','geografia','historia','ciencias'),
	`materialId` int,
	`status` enum('waiting','in_progress','completed') NOT NULL DEFAULT 'waiting',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp,
	CONSTRAINT `challenge_duels_id` PRIMARY KEY(`id`),
	CONSTRAINT `challenge_duels_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `daily_challenge_attempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int NOT NULL,
	`challengeId` int NOT NULL,
	`isCorrect` boolean NOT NULL,
	`pointsEarned` int NOT NULL DEFAULT 0,
	`streakDay` int NOT NULL DEFAULT 1,
	`attemptedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `daily_challenge_attempts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `daily_challenges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` varchar(10) NOT NULL,
	`discipline` enum('matematica','portugues','geografia','historia','ciencias') NOT NULL,
	`questionText` text NOT NULL,
	`optionA` text NOT NULL,
	`optionB` text NOT NULL,
	`optionC` text NOT NULL,
	`optionD` text NOT NULL,
	`correctOption` enum('A','B','C','D') NOT NULL,
	`explanation` text,
	`bonusMultiplier` float NOT NULL DEFAULT 2,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `daily_challenges_id` PRIMARY KEY(`id`),
	CONSTRAINT `daily_challenges_date_unique` UNIQUE(`date`)
);
