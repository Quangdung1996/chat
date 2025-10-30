-- =====================================================
-- Rocket.Chat Integration - Stored Procedures (Simplified)
-- Schema: dbo
-- Database: PostgreSQL
-- Pattern: JSON input/output (Ezy Framework style)
-- =====================================================
-- Chỉ còn User Mapping procedures
-- Room/Message data lấy trực tiếp từ Rocket.Chat API
-- =====================================================

-- =====================================================
-- Rocket_UserMapping Stored Procedures
-- =====================================================

-- SP: Get user mapping by UserId
CREATE OR REPLACE FUNCTION dbo."sp_GetUserRocketMapping_ByUserId"(
    p_json TEXT
)
RETURNS TEXT AS $$
DECLARE
    v_user_id INTEGER;
    v_result TEXT;
BEGIN
    -- Parse input JSON
    v_user_id := (p_json::json->>'UserId')::INTEGER;
    
    -- Get mapping
    SELECT json_build_object(
        'Id', "Id",
        'UserId', "UserId",
        'RocketUserId', "RocketUserId",
        'RocketUsername', "RocketUsername",
        'Email', "Email",
        'FullName', "FullName",
        'IsActive', "IsActive",
        'CreatedAt', "CreatedAt",
        'LastSyncAt', "LastSyncAt",
        'Metadata', "Metadata"
    )::TEXT INTO v_result
    FROM dbo."Rocket_UserMapping"
    WHERE "UserId" = v_user_id 
        AND "IsDeleted" = false
        AND "IsActive" = true
    LIMIT 1;
    
    RETURN COALESCE(v_result, 'null');
END;
$$ LANGUAGE plpgsql;

-- SP: Get user mapping by RocketUserId
CREATE OR REPLACE FUNCTION dbo."sp_GetUserRocketMapping_ByRocketUserId"(
    p_json TEXT
)
RETURNS TEXT AS $$
DECLARE
    v_rocket_user_id VARCHAR(50);
    v_result TEXT;
BEGIN
    v_rocket_user_id := p_json::json->>'RocketUserId';
    
    SELECT json_build_object(
        'Id', "Id",
        'UserId', "UserId",
        'RocketUserId', "RocketUserId",
        'RocketUsername', "RocketUsername",
        'Email', "Email",
        'FullName', "FullName",
        'IsActive', "IsActive",
        'CreatedAt', "CreatedAt",
        'LastSyncAt', "LastSyncAt"
    )::TEXT INTO v_result
    FROM dbo."Rocket_UserMapping"
    WHERE "RocketUserId" = v_rocket_user_id 
        AND "IsDeleted" = false
    LIMIT 1;
    
    RETURN COALESCE(v_result, 'null');
END;
$$ LANGUAGE plpgsql;

-- SP: Get all active users for sync
CREATE OR REPLACE FUNCTION dbo."sp_GetAllActiveUsers"(
    p_json TEXT
)
RETURNS TEXT AS $$
DECLARE
    v_result TEXT;
BEGIN
    SELECT json_agg(
        json_build_object(
            'Id', "Id",
            'UserId', "UserId",
            'RocketUserId', "RocketUserId",
            'RocketUsername', "RocketUsername",
            'Email', "Email",
            'FullName', "FullName",
            'LastSyncAt', "LastSyncAt"
        )
    )::TEXT INTO v_result
    FROM dbo."Rocket_UserMapping"
    WHERE "IsDeleted" = false
        AND "IsActive" = true
    ORDER BY "UserId";
    
    RETURN COALESCE(v_result, '[]');
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Summary
-- =====================================================

\echo '======================================================'
\echo 'Stored Procedures created successfully!'
\echo '======================================================'
\echo ''
\echo 'Available procedures:'
\echo '  • sp_GetUserRocketMapping_ByUserId'
\echo '  • sp_GetUserRocketMapping_ByRocketUserId'
\echo '  • sp_GetAllActiveUsers'
\echo ''
\echo 'Rooms, Members, Messages: Query từ Rocket.Chat API'
\echo '======================================================'

