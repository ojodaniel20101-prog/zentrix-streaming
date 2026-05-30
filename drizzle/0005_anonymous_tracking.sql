-- Migration: Support anonymous (unauthenticated) activity tracking
-- user_id is now nullable so views/watches from non-signed-in users are recorded
-- New columns: session_id, content_id, content_title, content_type
-- New enum value: 'view' for anonymous page/content views

ALTER TABLE `user_activities`
  MODIFY COLUMN `user_id` int NULL,
  MODIFY COLUMN `type` enum('signin','signout','watch','search','download','feedback','view') NOT NULL,
  ADD COLUMN `session_id` varchar(128) NULL AFTER `user_id`,
  ADD COLUMN `content_id` varchar(255) NULL AFTER `user_email`,
  ADD COLUMN `content_title` varchar(500) NULL AFTER `content_id`,
  ADD COLUMN `content_type` varchar(50) NULL AFTER `content_title`;

-- Index for fast anonymous session lookups
CREATE INDEX `idx_user_activities_session` ON `user_activities` (`session_id`);

-- Index for content-level analytics
CREATE INDEX `idx_user_activities_content` ON `user_activities` (`content_id`, `type`);
