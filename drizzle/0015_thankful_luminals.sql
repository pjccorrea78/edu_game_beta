ALTER TABLE `players` MODIFY COLUMN `nickname` varchar(64) NOT NULL;--> statement-breakpoint
ALTER TABLE `players` ADD CONSTRAINT `players_nickname_unique` UNIQUE(`nickname`);