-- Tabela para rastrear adição manual de alunos
CREATE TABLE IF NOT EXISTS `manual_student_enrollments` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `classId` int NOT NULL,
  `playerId` int NOT NULL,
  `addedBy` int NOT NULL,
  `enrollmentMethod` enum('invite_code', 'manual_search') DEFAULT 'manual_search',
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  UNIQUE KEY `uq_class_player` (`classId`, `playerId`),
  KEY `idx_manual_enrollments_class` (`classId`),
  KEY `idx_manual_enrollments_player` (`playerId`)
);
