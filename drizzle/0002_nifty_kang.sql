CREATE TABLE `custom_quiz_questions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`materialId` int NOT NULL,
	`playerId` int NOT NULL,
	`questionText` text NOT NULL,
	`optionA` text NOT NULL,
	`optionB` text NOT NULL,
	`optionC` text NOT NULL,
	`optionD` text NOT NULL,
	`correctOption` enum('A','B','C','D') NOT NULL,
	`explanation` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `custom_quiz_questions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `study_materials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int NOT NULL,
	`title` varchar(256) NOT NULL,
	`contentText` text,
	`fileUrl` varchar(1024),
	`fileType` enum('text','pdf','image') NOT NULL DEFAULT 'text',
	`status` enum('pending','analyzing','ready','error') NOT NULL DEFAULT 'pending',
	`discipline` varchar(64),
	`questionsGenerated` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`analyzedAt` timestamp,
	CONSTRAINT `study_materials_id` PRIMARY KEY(`id`)
);
