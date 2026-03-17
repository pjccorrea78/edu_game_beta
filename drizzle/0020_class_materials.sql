CREATE TABLE `class_materials` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `classId` int NOT NULL,
  `title` varchar(256) NOT NULL,
  `description` text,
  `fileUrl` varchar(1024) NOT NULL,
  `fileType` enum('pdf','doc','docx','xlsx','txt','image') NOT NULL DEFAULT 'pdf',
  `uploadedBy` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  KEY `idx_class_materials_class` (`classId`),
  KEY `idx_class_materials_uploader` (`uploadedBy`)
);
