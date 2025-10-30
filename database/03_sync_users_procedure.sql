-- =====================================================
-- Stored Procedure: Get Active Users for Rocket.Chat Sync
-- Schema: dbo (hoặc public tùy database)
-- Purpose: Lấy danh sách users chưa sync vào Rocket.Chat
-- =====================================================

-- TODO: CUSTOMIZE procedure này theo cấu trúc DB của bạn
-- Sử dụng table dbo.UserLogin có các fields:
-- - Id (UserId)
-- - Username (from OAuth2 provider - REQUIRED)
-- - EmailAddress (optional - có thể null)
-- - FirstName, LastName (concat để tạo FullName)

-- OPTION 1: PostgreSQL Function (với Username từ UserLogin)
CREATE OR REPLACE FUNCTION dbo."sp_GetUsersForRocketChatSync"(
    p_json TEXT
)
RETURNS TEXT AS $$
DECLARE
    v_result TEXT;
BEGIN
    -- Lấy tất cả users active mà chưa có trong Rocket_UserMapping
    -- Query trực tiếp từ dbo.UserLogin (đã có đủ Username, Email, FirstName, LastName)
    SELECT json_agg(
        json_build_object(
            'UserId', u."Id",
            'Email', COALESCE(u."EmailAddress", ''),  -- Email có thể null
            'FullName', TRIM(CONCAT(u."FirstName", ' ', u."LastName")),  -- Concat FirstName + LastName
            'Username', u."Username"  -- Username từ UserLogin (REQUIRED)
        )
    )::TEXT INTO v_result
    FROM dbo."UserLogin" u
    WHERE u."Username" IS NOT NULL  -- Chỉ lấy users có username
        AND NOT EXISTS (
            SELECT 1 
            FROM dbo."Rocket_UserMapping" m
            WHERE m."UserId" = u."Id"
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
            'Email', COALESCE(u."EmailAddress", ''),
            'FullName', TRIM(CONCAT(u."FirstName", ' ', u."LastName")),  -- Concat FirstName + LastName
            'Username', u."Username"  -- Username từ UserLogin
        )
    )::TEXT INTO v_result
    FROM dbo."UserLogin" u
    WHERE u."Username" IS NOT NULL;
    
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
-- 1. Query trực tiếp từ table dbo.UserLogin (đã có đủ tất cả fields)
-- 2. EmailAddress có thể NULL - code sẽ tự generate fake email: username@noemail.local
-- 3. Username từ UserLogin là BẮT BUỘC
-- 4. FullName = CONCAT(FirstName, ' ', LastName)
-- 5. Có thể thêm filters: department, role, created date, etc.
-- 6. Column names trong dbo.UserLogin table:
--    - Id (UserId)
--    - Username (from OAuth2 provider)
--    - EmailAddress (optional)
--    - FirstName, LastName (concat để tạo FullName)
-- =====================================================

