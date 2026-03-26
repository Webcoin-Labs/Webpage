CREATE INDEX IF NOT EXISTS "FeedPost_visibility_postType_createdAt_idx"
ON "FeedPost" ("visibility", "postType", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "ProfileView_viewedUserId_source_createdAt_idx"
ON "ProfileView" ("viewedUserId", "source", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "Notification_createdAt_id_idx"
ON "Notification" ("createdAt" DESC, "id");

CREATE INDEX IF NOT EXISTS "NotificationRead_userId_notificationId_idx"
ON "NotificationRead" ("userId", "notificationId");

