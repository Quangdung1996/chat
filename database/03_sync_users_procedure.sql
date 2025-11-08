
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
            'FullName', TRIM(CONCAT(u."LastName", ' ', u."FirstName")),  -- Concat FirstName + LastName
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
            'FullName', TRIM(CONCAT(u."LastName", ' ', u."FirstName")),  -- Concat FirstName + LastName
            'Username', u."Username"  -- Username từ UserLogin
        )
    )::TEXT INTO v_result
    FROM dbo."UserLogin" u
    WHERE u."Username" IS NOT NULL;
    
    RETURN COALESCE(v_result, '[]');
END;
$$ LANGUAGE plpgsql;


