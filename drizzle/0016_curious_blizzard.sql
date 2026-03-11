CREATE TABLE `story_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int NOT NULL,
	`disciplineSequence` json NOT NULL,
	`currentDisciplineIndex` int NOT NULL DEFAULT 0,
	`currentDifficulty` enum('easy','medium','hard') NOT NULL DEFAULT 'easy',
	`questionsAnswered` int NOT NULL DEFAULT 0,
	`completedDisciplines` json NOT NULL DEFAULT json_array(),
	`totalScore` int NOT NULL DEFAULT 0,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `story_progress_id` PRIMARY KEY(`id`)
);
