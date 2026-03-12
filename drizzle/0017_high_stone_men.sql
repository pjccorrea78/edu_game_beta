CREATE TABLE `lesson_cache` (
	`id` int AUTO_INCREMENT NOT NULL,
	`discipline` enum('matematica','portugues','geografia','historia','ciencias','educacao_fisica','arte','ensino_religioso') NOT NULL,
	`grade` int NOT NULL,
	`lessonData` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `lesson_cache_id` PRIMARY KEY(`id`)
);
