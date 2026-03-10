CREATE TABLE `avatar_shares` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int NOT NULL,
	`shareCode` varchar(8) NOT NULL,
	`imageUrl` varchar(1024) NOT NULL,
	`avatarConfig` json NOT NULL,
	`viewCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp,
	CONSTRAINT `avatar_shares_id` PRIMARY KEY(`id`),
	CONSTRAINT `avatar_shares_shareCode_unique` UNIQUE(`shareCode`)
);
--> statement-breakpoint
ALTER TABLE `players` ADD `avatarImageUrl` varchar(1024);--> statement-breakpoint
ALTER TABLE `players` ADD `avatarShareCode` varchar(8);--> statement-breakpoint
ALTER TABLE `players` ADD `parentEmail` varchar(320);--> statement-breakpoint
ALTER TABLE `players` ADD CONSTRAINT `players_avatarShareCode_unique` UNIQUE(`avatarShareCode`);