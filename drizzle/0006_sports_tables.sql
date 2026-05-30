-- Sports tables migration
-- Run: npx drizzle-kit push  OR  add to your migration pipeline

CREATE TABLE IF NOT EXISTS `sport_events` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `title` varchar(500) NOT NULL,
  `sport` varchar(100) NOT NULL,
  `league` varchar(255),
  `league_id` varchar(50),
  `home_team` varchar(255),
  `away_team` varchar(255),
  `home_score` varchar(20),
  `away_score` varchar(20),
  `thumbnail_url` varchar(1000),
  `start_time` timestamp,
  `status` enum('live','upcoming','finished') NOT NULL DEFAULT 'upcoming',
  `embed_url` text,
  `youtube_video_id` varchar(50),
  `str_video` varchar(1000),
  `str_thumb` varchar(1000),
  `external_id` varchar(100),
  `venue` varchar(500),
  `country` varchar(100),
  `createdAt` timestamp NOT NULL DEFAULT NOW(),
  `updatedAt` timestamp NOT NULL DEFAULT NOW() ON UPDATE NOW()
);

CREATE TABLE IF NOT EXISTS `sport_streams` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `event_id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `url` varchar(1000) NOT NULL,
  `quality` varchar(50),
  `is_working` int DEFAULT 1,
  `createdAt` timestamp NOT NULL DEFAULT NOW()
);
