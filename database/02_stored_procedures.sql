
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

-- SP: Insert/Update user mapping (UPSERT)
CREATE OR REPLACE FUNCTION dbo."sp_UpsertUserRocketMapping"(
    p_json TEXT
)
RETURNS TEXT AS $$
DECLARE
    v_user_id INTEGER;
    v_rocket_user_id VARCHAR(50);
    v_rocket_username VARCHAR(255);
    v_email VARCHAR(255);
    v_full_name VARCHAR(255);
    v_metadata TEXT;
    v_result TEXT;
BEGIN
    -- Parse input JSON
    v_user_id := (p_json::json->>'UserId')::INTEGER;
    v_rocket_user_id := p_json::json->>'RocketUserId';
    v_rocket_username := p_json::json->>'RocketUsername';
    v_email := p_json::json->>'Email';
    v_full_name := p_json::json->>'FullName';
    v_metadata := p_json::json->>'Metadata';
    
    -- Insert or Update
    INSERT INTO dbo."Rocket_UserMapping" (
        "UserId",
        "RocketUserId", 
        "RocketUsername",
        "Email",
        "FullName",
        "IsActive",
        "IsDeleted",
        "CreatedAt",
        "LastSyncAt",
        "Metadata"
    )
    VALUES (
        v_user_id,
        v_rocket_user_id,
        v_rocket_username,
        v_email,
        v_full_name,
        true,
        false,
        NOW(),
        NOW(),
        v_metadata
    )
    ON CONFLICT ("UserId", "RocketUserId") 
    DO UPDATE SET
        "RocketUsername" = EXCLUDED."RocketUsername",
        "Email" = EXCLUDED."Email",
        "FullName" = EXCLUDED."FullName",
        "LastSyncAt" = NOW(),
        "Metadata" = EXCLUDED."Metadata",
        "IsActive" = true
    RETURNING json_build_object(
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
    )::TEXT INTO v_result;
    
    RETURN COALESCE(v_result, 'null');
END;
$$ LANGUAGE plpgsql;
