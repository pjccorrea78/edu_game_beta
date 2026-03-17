-- Migration: Add schools, school_classes, and class_students tables
-- EduGame Beta - Teacher CRUD

CREATE TABLE IF NOT EXISTS `schools` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `ownerId` int NOT NULL,
  `name` varchar(256) NOT NULL,
  `city` varchar(128),
  `state` varchar(64),
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `school_classes` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `schoolId` int NOT NULL,
  `ownerId` int NOT NULL,
  `name` varchar(128) NOT NULL,
  `grade` enum('1','2','3','4','5','6','7','8','9'),
  `year` int,
  `inviteCode` varchar(8) NOT NULL UNIQUE,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `class_students` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `classId` int NOT NULL,
  `playerId` int NOT NULL,
  `enrolledAt` timestamp NOT NULL DEFAULT (now()),
  UNIQUE KEY `uq_class_player` (`classId`, `playerId`)
);

-- Indexes for performance
CREATE INDEX `idx_schools_owner` ON `schools` (`ownerId`);
CREATE INDEX `idx_school_classes_school` ON `school_classes` (`schoolId`);
CREATE INDEX `idx_school_classes_owner` ON `school_classes` (`ownerId`);
CREATE INDEX `idx_class_students_class` ON `class_students` (`classId`);
CREATE INDEX `idx_class_students_player` ON `class_students` (`playerId`);
