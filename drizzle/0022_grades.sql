CREATE TABLE IF NOT EXISTS `grades` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `schoolId` int NOT NULL,
  `ownerId` int NOT NULL,
  `gradeLevel` enum('1','2','3','4','5','6','7','8','9') NOT NULL,
  `year` int,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE (now()),
  KEY `idx_grades_school` (`schoolId`),
  KEY `idx_grades_owner` (`ownerId`),
  UNIQUE KEY `uq_grade_school_level_year` (`schoolId`, `gradeLevel`, `year`)
);
