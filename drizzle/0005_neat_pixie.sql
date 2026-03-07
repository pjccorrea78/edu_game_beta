CREATE TABLE `player_achievements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int NOT NULL,
	`achievementKey` varchar(64) NOT NULL,
	`unlockedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `player_achievements_id` PRIMARY KEY(`id`)
);
