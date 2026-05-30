CREATE TABLE `user_activities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`type` enum('signin','signout','watch','search','download','feedback') NOT NULL,
	`user_name` varchar(255),
	`user_email` varchar(320),
	`ip_address` varchar(45),
	`user_agent` text,
	`metadata` text,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_activities_id` PRIMARY KEY(`id`)
);
