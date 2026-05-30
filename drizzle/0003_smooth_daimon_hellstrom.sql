CREATE TABLE `feedback_replies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`feedback_id` int NOT NULL,
	`user_id` int NOT NULL,
	`is_admin_reply` int NOT NULL DEFAULT 0,
	`message` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `feedback_replies_id` PRIMARY KEY(`id`)
);
