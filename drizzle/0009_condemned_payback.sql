ALTER TABLE `quiz_sessions` MODIFY COLUMN `discipline` enum('matematica','portugues','geografia','historia','ciencias','educacao_fisica','arte','ensino_religioso') NOT NULL;--> statement-breakpoint
ALTER TABLE `players` ADD `gender` enum('masculino','feminino') DEFAULT 'masculino';--> statement-breakpoint
ALTER TABLE `players` ADD `grade` enum('1','2','3','4','5');--> statement-breakpoint
ALTER TABLE `quiz_sessions` ADD `grade` enum('1','2','3','4','5');