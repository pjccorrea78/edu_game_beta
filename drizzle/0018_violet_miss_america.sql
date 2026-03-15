CREATE TABLE `class_students` (
	`id` int AUTO_INCREMENT NOT NULL,
	`classId` int NOT NULL,
	`playerId` int NOT NULL,
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `class_students_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `classes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`grade` enum('1','2','3','4','5','6','7','8','9') NOT NULL,
	`schoolId` int NOT NULL,
	`teacherId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `classes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `schools` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(256) NOT NULL,
	`location` varchar(256),
	`teacherId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `schools_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `study_materials_v2` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(256) NOT NULL,
	`fileType` enum('pdf','doc','xlsx','txt') NOT NULL,
	`fileUrl` varchar(1024) NOT NULL,
	`classId` int NOT NULL,
	`creatorId` int NOT NULL,
	`discipline` enum('matematica','portugues','geografia','historia','ciencias','educacao_fisica','arte','ensino_religioso'),
	`description` text,
	`uploadedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `study_materials_v2_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('student','teacher','admin') NOT NULL DEFAULT 'student';