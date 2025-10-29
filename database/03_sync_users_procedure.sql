-- =====================================================
-- Stored Procedure: Get Active Users for Rocket.Chat Sync
-- Schema: dbo (hoặc public tùy database)
-- Purpose: Lấy danh sách users chưa sync vào Rocket.Chat
-- =====================================================

-- TODO: CUSTOMIZE procedure này theo cấu trúc DB của bạn
-- Ví dụ này giả định bạn có bảng Users với cấu trúc:
-- - Id (INT)
-- - Email (VARCHAR)
-- - FullName (VARCHAR)
-- - IsActive (BOOLEAN)

-- OPTION 1: PostgreSQL Function
CREATE OR REPLACE FUNCTION dbo."sp_GetUsersForRocketChatSync"(
    p_json TEXT
)
RETURNS TEXT AS $$
DECLARE
    v_result TEXT;
BEGIN
    -- Lấy tất cả users active mà chưa có trong UserRocketChatMapping
    SELECT json_agg(
        json_build_object(
            'UserId', u."Id",
            'Email', u."Email",
            'FullName', u."FullName",
            'Username', u."Username"
        )
    )::TEXT INTO v_result
    FROM "Users" u  -- TODO: Thay "Users" bằng tên bảng user của bạn
    WHERE u."IsActive" = true
        AND u."IsDeleted" = false
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
            'Email', u."Email",
            'FullName', u."FullName",
            'Username', u."Username"
        )
    )::TEXT INTO v_result
    FROM "Users" u  -- TODO: Thay bằng tên bảng của bạn
    WHERE u."IsActive" = true
        AND u."IsDeleted" = false;
    
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
-- 1. Thay "Users" bằng tên bảng user thực tế của bạn
-- 2. Thay các column names cho đúng với schema của bạn
-- 3. Có thể thêm filters: department, role, created date, etc.
-- =====================================================

