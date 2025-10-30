-- =====================================================
-- Rocket.Chat Integration - Database Schema (Simplified)
-- Schema: dbo
-- Database: PostgreSQL
-- =====================================================
-- Chỉ cần 1 bảng UserRocketChatMapping
-- Tất cả dữ liệu room/message lấy trực tiếp từ Rocket.Chat API
-- =====================================================

-- Create schema if not exists
CREATE SCHEMA IF NOT EXISTS dbo;

-- =====================================================
-- Table: dbo.Rocket_UserMapping
-- Purpose: Map internal users to Rocket.Chat users
-- =====================================================
CREATE TABLE IF NOT EXISTS dbo."Rocket_UserMapping" (
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
    "Log_UpdatedBy" VARCHAR(100),
    
    -- Unique constraint for ON CONFLICT
    CONSTRAINT "UQ_Rocket_UserMapping_UserId_RocketUserId" 
        UNIQUE ("UserId", "RocketUserId")
);

-- Additional unique index (optional, for performance)
CREATE UNIQUE INDEX IF NOT EXISTS "IX_Rocket_UserMapping_UserId_RocketUserId" 
    ON dbo."Rocket_UserMapping"("UserId", "RocketUserId")
    WHERE "IsDeleted" = false;

-- Index for quick lookup by RocketUserId
CREATE INDEX IF NOT EXISTS "IX_Rocket_UserMapping_RocketUserId" 
    ON dbo."Rocket_UserMapping"("RocketUserId");

-- Index for active users
CREATE INDEX IF NOT EXISTS "IX_Rocket_UserMapping_IsActive" 
    ON dbo."Rocket_UserMapping"("IsActive") WHERE "IsActive" = true;

COMMENT ON TABLE dbo."Rocket_UserMapping" IS 'Maps internal system users to Rocket.Chat users';
COMMENT ON COLUMN dbo."Rocket_UserMapping"."UserId" IS 'Internal system user ID';
COMMENT ON COLUMN dbo."Rocket_UserMapping"."RocketUserId" IS 'Rocket.Chat user ID (_id)';
COMMENT ON COLUMN dbo."Rocket_UserMapping"."RocketUsername" IS 'Rocket.Chat username';

-- =====================================================
-- Insert initial test data (optional)
-- =====================================================

-- Test admin user mapping (example)
-- INSERT INTO dbo."Rocket_UserMapping" 
--     ("UserId", "RocketUserId", "RocketUsername", "Email", "FullName")
-- VALUES 
--     (1, 'admin-rocket-id', 'admin', 'admin@example.com', 'System Admin')
-- ON CONFLICT DO NOTHING;

-- =====================================================
-- Grant permissions (adjust as needed)
-- =====================================================

-- GRANT USAGE ON SCHEMA dbo TO your_app_user;
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA dbo TO your_app_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA dbo TO your_app_user;

-- =====================================================
-- Summary
-- =====================================================

\echo '======================================================'
\echo 'Schema "dbo" created successfully!'
\echo '======================================================'
\echo ''
\echo 'Tables created:'
\echo '  ✓ Rocket_UserMapping - User mapping'
\echo ''
\echo 'Data strategy:'
\echo '  • Rooms: Query từ Rocket.Chat API (rooms.list, groups.list)'
\echo '  • Members: Query từ Rocket.Chat API (groups.members)'
\echo '  • Messages: Query từ Rocket.Chat API (chat.getMessage)'
\echo ''
\echo 'Simple & Clean! 🎯'
\echo '======================================================'

