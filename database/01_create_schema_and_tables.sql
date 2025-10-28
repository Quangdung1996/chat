-- =====================================================
-- Rocket.Chat Integration - Database Schema
-- Schema: chat
-- Database: PostgreSQL
-- =====================================================

-- Create schema if not exists
CREATE SCHEMA IF NOT EXISTS chat;

-- =====================================================
-- Table: chat.UserRocketChatMapping
-- Purpose: Map internal users to Rocket.Chat users
-- =====================================================
CREATE TABLE IF NOT EXISTS chat."UserRocketChatMapping" (
    "Id" SERIAL PRIMARY KEY,
    "UserId" INTEGER NOT NULL,
    "RocketUserId" VARCHAR(50) NOT NULL,
    "RocketUsername" VARCHAR(100) NOT NULL,
    "Email" VARCHAR(255),
    "FullName" VARCHAR(200),
    "IsActive" BOOLEAN NOT NULL DEFAULT true,
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "LastSyncAt" TIMESTAMP,
    "Metadata" TEXT,
    "IsDeleted" BOOLEAN NOT NULL DEFAULT false,
    "Log_CreatedDate" TIMESTAMP DEFAULT NOW(),
    "Log_CreatedBy" VARCHAR(100),
    "Log_UpdatedDate" TIMESTAMP,
    "Log_UpdatedBy" VARCHAR(100)
);

-- Unique index: One UserId can map to one RocketUserId
CREATE UNIQUE INDEX IF NOT EXISTS "IX_UserRocketMapping_UserId_RocketUserId" 
    ON chat."UserRocketChatMapping"("UserId", "RocketUserId");

-- Index for quick lookup by RocketUserId
CREATE INDEX IF NOT EXISTS "IX_UserRocketMapping_RocketUserId" 
    ON chat."UserRocketChatMapping"("RocketUserId");

-- Index for active users
CREATE INDEX IF NOT EXISTS "IX_UserRocketMapping_IsActive" 
    ON chat."UserRocketChatMapping"("IsActive") WHERE "IsActive" = true;

COMMENT ON TABLE chat."UserRocketChatMapping" IS 'Maps internal system users to Rocket.Chat users';
COMMENT ON COLUMN chat."UserRocketChatMapping"."UserId" IS 'Internal system user ID';
COMMENT ON COLUMN chat."UserRocketChatMapping"."RocketUserId" IS 'Rocket.Chat user ID (_id)';
COMMENT ON COLUMN chat."UserRocketChatMapping"."RocketUsername" IS 'Rocket.Chat username';

-- =====================================================
-- Table: chat.RoomMapping
-- Purpose: Map business groups/projects to Rocket.Chat rooms
-- =====================================================
CREATE TABLE IF NOT EXISTS chat."RoomMapping" (
    "Id" SERIAL PRIMARY KEY,
    "GroupCode" VARCHAR(100) NOT NULL UNIQUE,
    "RocketRoomId" VARCHAR(50) NOT NULL,
    "RoomName" VARCHAR(200) NOT NULL,
    "RoomType" VARCHAR(20) NOT NULL DEFAULT 'group',
    "DepartmentId" INTEGER,
    "ProjectId" INTEGER,
    "Description" VARCHAR(500),
    "IsReadOnly" BOOLEAN NOT NULL DEFAULT false,
    "IsAnnouncement" BOOLEAN NOT NULL DEFAULT false,
    "IsArchived" BOOLEAN NOT NULL DEFAULT false,
    "IsDeleted" BOOLEAN NOT NULL DEFAULT false,
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "CreatedBy" INTEGER,
    "UpdatedAt" TIMESTAMP,
    "UpdatedBy" INTEGER,
    "CustomFields" TEXT,
    "Log_CreatedDate" TIMESTAMP DEFAULT NOW(),
    "Log_CreatedBy" VARCHAR(100),
    "Log_UpdatedDate" TIMESTAMP,
    "Log_UpdatedBy" VARCHAR(100)
);

-- Unique constraint on GroupCode
CREATE UNIQUE INDEX IF NOT EXISTS "IX_RoomMapping_GroupCode" 
    ON chat."RoomMapping"("GroupCode");

-- Index for RocketRoomId lookup
CREATE INDEX IF NOT EXISTS "IX_RoomMapping_RocketRoomId" 
    ON chat."RoomMapping"("RocketRoomId");

-- Index for department/project filtering
CREATE INDEX IF NOT EXISTS "IX_RoomMapping_DepartmentId" 
    ON chat."RoomMapping"("DepartmentId") WHERE "DepartmentId" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "IX_RoomMapping_ProjectId" 
    ON chat."RoomMapping"("ProjectId") WHERE "ProjectId" IS NOT NULL;

-- Index for active rooms
CREATE INDEX IF NOT EXISTS "IX_RoomMapping_Active" 
    ON chat."RoomMapping"("IsDeleted", "IsArchived") 
    WHERE "IsDeleted" = false AND "IsArchived" = false;

COMMENT ON TABLE chat."RoomMapping" IS 'Maps business groups/projects to Rocket.Chat rooms';
COMMENT ON COLUMN chat."RoomMapping"."GroupCode" IS 'Unique business code (e.g., DEPT-PROJ-001)';
COMMENT ON COLUMN chat."RoomMapping"."RocketRoomId" IS 'Rocket.Chat room ID (_id)';
COMMENT ON COLUMN chat."RoomMapping"."RoomType" IS 'Room type: group (private), channel (public), or dm (direct)';

-- =====================================================
-- Table: chat.RoomMemberMapping
-- Purpose: Track room members and their roles
-- =====================================================
CREATE TABLE IF NOT EXISTS chat."RoomMemberMapping" (
    "Id" SERIAL PRIMARY KEY,
    "RoomMappingId" INTEGER NOT NULL,
    "UserMappingId" INTEGER NOT NULL,
    "UserId" INTEGER NOT NULL,
    "RocketUserId" VARCHAR(50) NOT NULL,
    "Role" VARCHAR(20) NOT NULL DEFAULT 'member',
    "IsActive" BOOLEAN NOT NULL DEFAULT true,
    "JoinedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "LeftAt" TIMESTAMP,
    "LastActivityAt" TIMESTAMP,
    "IsDeleted" BOOLEAN NOT NULL DEFAULT false,
    "Log_CreatedDate" TIMESTAMP DEFAULT NOW(),
    "Log_CreatedBy" VARCHAR(100),
    "Log_UpdatedDate" TIMESTAMP,
    "Log_UpdatedBy" VARCHAR(100),
    
    CONSTRAINT "FK_RoomMemberMapping_RoomMapping" 
        FOREIGN KEY ("RoomMappingId") 
        REFERENCES chat."RoomMapping"("Id") 
        ON DELETE CASCADE,
    
    CONSTRAINT "FK_RoomMemberMapping_UserMapping" 
        FOREIGN KEY ("UserMappingId") 
        REFERENCES chat."UserRocketChatMapping"("Id") 
        ON DELETE CASCADE
);

-- Unique constraint: One user per room
CREATE UNIQUE INDEX IF NOT EXISTS "IX_RoomMemberMapping_RoomUser" 
    ON chat."RoomMemberMapping"("RoomMappingId", "UserId");

-- Index for room member lookup
CREATE INDEX IF NOT EXISTS "IX_RoomMemberMapping_RoomId" 
    ON chat."RoomMemberMapping"("RoomMappingId");

-- Index for user's rooms lookup
CREATE INDEX IF NOT EXISTS "IX_RoomMemberMapping_UserId" 
    ON chat."RoomMemberMapping"("UserId");

-- Index for active members
CREATE INDEX IF NOT EXISTS "IX_RoomMemberMapping_Active" 
    ON chat."RoomMemberMapping"("IsActive", "IsDeleted") 
    WHERE "IsActive" = true AND "IsDeleted" = false;

-- Index for role-based queries
CREATE INDEX IF NOT EXISTS "IX_RoomMemberMapping_Role" 
    ON chat."RoomMemberMapping"("RoomMappingId", "Role") 
    WHERE "IsActive" = true;

COMMENT ON TABLE chat."RoomMemberMapping" IS 'Tracks room members and their roles';
COMMENT ON COLUMN chat."RoomMemberMapping"."Role" IS 'Member role: owner, moderator, member';

-- =====================================================
-- Table: chat.ChatMessageLog
-- Purpose: Log all chat messages for audit and moderation
-- =====================================================
CREATE TABLE IF NOT EXISTS chat."ChatMessageLog" (
    "Id" BIGSERIAL PRIMARY KEY,
    "RocketMessageId" VARCHAR(50) NOT NULL UNIQUE,
    "RocketRoomId" VARCHAR(50) NOT NULL,
    "RocketUserId" VARCHAR(50) NOT NULL,
    "UserId" INTEGER,
    "RoomMappingId" INTEGER,
    "MessageText" TEXT,
    "MessageType" VARCHAR(50) NOT NULL DEFAULT 'text',
    "IsDeleted" BOOLEAN NOT NULL DEFAULT false,
    "IsAutoDeleted" BOOLEAN NOT NULL DEFAULT false,
    "DeletionReason" VARCHAR(500),
    "DeletedAt" TIMESTAMP,
    "DeletedBy" VARCHAR(100),
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "UpdatedAt" TIMESTAMP,
    "Metadata" TEXT,
    "Log_CreatedDate" TIMESTAMP DEFAULT NOW(),
    "Log_CreatedBy" VARCHAR(100),
    "Log_UpdatedDate" TIMESTAMP,
    "Log_UpdatedBy" VARCHAR(100),
    
    CONSTRAINT "FK_ChatMessageLog_RoomMapping" 
        FOREIGN KEY ("RoomMappingId") 
        REFERENCES chat."RoomMapping"("Id") 
        ON DELETE SET NULL
);

-- Unique index on RocketMessageId
CREATE UNIQUE INDEX IF NOT EXISTS "IX_ChatMessageLog_RocketMessageId" 
    ON chat."ChatMessageLog"("RocketMessageId");

-- Index for room messages (most common query)
CREATE INDEX IF NOT EXISTS "IX_ChatMessageLog_Room_CreatedAt" 
    ON chat."ChatMessageLog"("RocketRoomId", "CreatedAt" DESC);

-- Index for user messages
CREATE INDEX IF NOT EXISTS "IX_ChatMessageLog_UserId" 
    ON chat."ChatMessageLog"("UserId") WHERE "UserId" IS NOT NULL;

-- Index for moderation queries
CREATE INDEX IF NOT EXISTS "IX_ChatMessageLog_Moderation" 
    ON chat."ChatMessageLog"("IsDeleted", "IsAutoDeleted", "DeletedAt") 
    WHERE "IsDeleted" = true;

-- Index for room mapping
CREATE INDEX IF NOT EXISTS "IX_ChatMessageLog_RoomMappingId" 
    ON chat."ChatMessageLog"("RoomMappingId") WHERE "RoomMappingId" IS NOT NULL;

COMMENT ON TABLE chat."ChatMessageLog" IS 'Logs all chat messages for audit trail and moderation';
COMMENT ON COLUMN chat."ChatMessageLog"."RocketMessageId" IS 'Rocket.Chat message ID (_id)';
COMMENT ON COLUMN chat."ChatMessageLog"."MessageType" IS 'Message type: text, file, system, etc.';

-- =====================================================
-- Insert initial test data (optional)
-- =====================================================

-- Test admin user mapping (example)
-- INSERT INTO chat."UserRocketChatMapping" 
--     ("UserId", "RocketUserId", "RocketUsername", "Email", "FullName")
-- VALUES 
--     (1, 'admin-rocket-id', 'admin', 'admin@example.com', 'System Admin')
-- ON CONFLICT DO NOTHING;

-- =====================================================
-- Grant permissions (adjust as needed)
-- =====================================================

-- GRANT USAGE ON SCHEMA chat TO your_app_user;
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA chat TO your_app_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA chat TO your_app_user;

-- =====================================================
-- Summary
-- =====================================================

SELECT 
    'Schema "chat" created with 4 tables:' as message
UNION ALL
SELECT '  1. UserRocketChatMapping - User mapping'
UNION ALL
SELECT '  2. RoomMapping - Room/Group mapping'
UNION ALL
SELECT '  3. RoomMemberMapping - Room members'
UNION ALL
SELECT '  4. ChatMessageLog - Message logs';

