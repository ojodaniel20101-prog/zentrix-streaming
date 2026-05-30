CREATE TABLE `channel_watchlist` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`channel_id` varchar(255) NOT NULL,
	`added_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `channel_watchlist_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `channels` (
	`id` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`alt_names` text,
	`country` varchar(2),
	`categories` text,
	`network` varchar(255),
	`website` varchar(255),
	`logo_url` varchar(500),
	`is_nsfw` int DEFAULT 0,
	`source` varchar(50) DEFAULT 'iptv-org',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `channels_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `streams` (
	`id` int AUTO_INCREMENT NOT NULL,
	`channel_id` varchar(255) NOT NULL,
	`title` varchar(255),
	`url` varchar(1000) NOT NULL,
	`quality` varchar(50),
	`referrer` varchar(500),
	`user_agent` text,
	`is_working` int DEFAULT 1,
	`last_checked` timestamp,
	`source` varchar(50) DEFAULT 'iptv-org',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `streams_id` PRIMARY KEY(`id`)
);
