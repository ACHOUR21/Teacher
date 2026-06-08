-- Add performance indexes
CREATE INDEX IF NOT EXISTS "Course_tenantId_isPublished_idx" ON "Course"("tenantId", "isPublished");
CREATE INDEX IF NOT EXISTS "Course_tenantId_category_idx" ON "Course"("tenantId", "category");
CREATE INDEX IF NOT EXISTS "Course_teacherId_idx" ON "Course"("teacherId");
CREATE INDEX IF NOT EXISTS "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");
CREATE INDEX IF NOT EXISTS "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "Lesson_sectionId_idx" ON "Lesson"("sectionId");
CREATE INDEX IF NOT EXISTS "Submission_assignmentId_studentId_idx" ON "Submission"("assignmentId", "studentId");
CREATE INDEX IF NOT EXISTS "Submission_studentId_createdAt_idx" ON "Submission"("studentId", "createdAt");
CREATE INDEX IF NOT EXISTS "AIConversation_userId_tenantId_idx" ON "AIConversation"("userId", "tenantId");
CREATE INDEX IF NOT EXISTS "AuditLog_tenantId_action_idx" ON "AuditLog"("tenantId", "action");
CREATE INDEX IF NOT EXISTS "AuditLog_tenantId_createdAt_idx" ON "AuditLog"("tenantId", "createdAt");
