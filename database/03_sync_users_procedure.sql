-- =====================================================
-- Stored Procedure: Get Active Users for Rocket.Chat Sync
-- Schema: dbo (hoặc public tùy database)
-- Purpose: Lấy danh sách users chưa sync vào Rocket.Chat
-- =====================================================

-- TODO: CUSTOMIZE procedure này theo cấu trúc DB của bạn
-- Ví dụ này giả định bạn có:
-- - Bảng Users: Id, FullName, Email (optional), IsActive, IsDeleted
-- - Bảng UserLogin: UserId, Username (from OAuth2 provider - REQUIRED)
-- Username lấy từ UserLogin, Email có thể null (sẽ generate fake email nếu null)

-- OPTION 1: PostgreSQL Function (với Username từ UserLogin)
CREATE OR REPLACE FUNCTION dbo."sp_GetUsersForRocketChatSync"(
    p_json TEXT
)
RETURNS TEXT AS $$
DECLARE
    v_result TEXT;
BEGIN
    -- Lấy tất cả users active mà chưa có trong UserRocketChatMapping
    -- JOIN với UserLogin table để lấy Username
    SELECT json_agg(
        json_build_object(
            'UserId', u."Id",
            'Email', COALESCE(u."Email", ''),  -- Email có thể null
            'FullName', u."FullName",
            'Username', ul."Username"  -- Username từ UserLogin (REQUIRED)
        )
    )::TEXT INTO v_result
    FROM "Users" u
    INNER JOIN "UserLogin" ul ON ul."UserId" = u."Id"
    WHERE u."IsActive" = true
        AND u."IsDeleted" = false
        AND ul."Username" IS NOT NULL  -- Chỉ lấy users có username
        AND NOT EXISTS (
            SELECT 1 
            FROM dbo."UserRocketChatMapping" m
            WHERE m."UserId" = u."Id"
                AND m."IsDeleted" = false
        );
    
    RETURN COALESCE(v_result, '[]');
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ALTERNATIVE: Nếu bạn muốn lấy ALL users để re-sync
-- =====================================================

CREATE OR REPLACE FUNCTION dbo."sp_GetAllActiveUsers"(
    p_json TEXT
)
RETURNS TEXT AS $$
DECLARE
    v_result TEXT;
BEGIN
    SELECT json_agg(
        json_build_object(
            'UserId', u."Id",
            'Email', COALESCE(u."Email", ''),
            'FullName', u."FullName",
            'Username', ul."Username"  -- Username từ UserLogin
        )
    )::TEXT INTO v_result
    FROM "Users" u
    INNER JOIN "UserLogin" ul ON ul."UserId" = u."Id"
    WHERE u."IsActive" = true
        AND u."IsDeleted" = false
        AND ul."Username" IS NOT NULL;
    
    RETURN COALESCE(v_result, '[]');
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TEST Query (chạy thử)
-- =====================================================

-- Test 1: Lấy users chưa sync
-- SELECT dbo."sp_GetUsersForRocketChatSync"('{}');

-- Test 2: Lấy tất cả users active
-- SELECT dbo."sp_GetAllActiveUsers"('{}');

-- =====================================================
-- Notes:
-- 1. Sử dụng table "UserLogin" để lấy Username (từ OAuth2)
-- 2. Email có thể NULL - code sẽ tự generate fake email: username@noemail.local
-- 3. Username từ UserLogin là BẮT BUỘC
-- 4. Có thể thêm filters: department, role, created date, etc.
-- 5. Kiểm tra column names trong UserLogin table:
--    - UserId (FK to Users.Id)
--    - Username (from OAuth2 provider)
-- =====================================================

