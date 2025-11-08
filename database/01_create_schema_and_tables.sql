
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
