CREATE TABLE `user_feedback` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`type` enum('bug','feature_request','opinion','general_feedback','other') NOT NULL,
	`subject` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`email` varchar(320),
	`status` enum('new','read','resolved','archived') NOT NULL DEFAULT 'new',
	`priority` enum('low','medium','high') NOT NULL DEFAULT 'medium',
	`admin_notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_feedback_id` PRIMARY KEY(`id`)
);
