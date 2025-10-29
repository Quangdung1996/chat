-- =====================================================
-- Rocket.Chat Integration - Stored Procedures
-- Schema: dbo
-- Database: PostgreSQL
-- Pattern: JSON input/output (Ezy Framework style)
-- =====================================================

-- =====================================================
-- UserRocketChatMapping Stored Procedures
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
    FROM dbo."UserRocketChatMapping"
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
    FROM dbo."UserRocketChatMapping"
    WHERE "RocketUserId" = v_rocket_user_id 
        AND "IsDeleted" = false
    LIMIT 1;
    
    RETURN COALESCE(v_result, 'null');
END;
$$ LANGUAGE plpgsql;

-- SP: Insert or Update user mapping
CREATE OR REPLACE FUNCTION dbo."sp_UpsertUserRocketMapping"(
    p_json TEXT
)
RETURNS TEXT AS $$
DECLARE
    v_user_id INTEGER;
    v_rocket_user_id VARCHAR(50);
    v_rocket_username VARCHAR(100);
    v_email VARCHAR(255);
    v_full_name VARCHAR(200);
    v_metadata TEXT;
    v_created_by VARCHAR(100);
    v_result_id INTEGER;
BEGIN
    -- Parse input JSON
    v_user_id := (p_json::json->>'UserId')::INTEGER;
    v_rocket_user_id := p_json::json->>'RocketUserId';
    v_rocket_username := p_json::json->>'RocketUsername';
    v_email := NULLIF(TRIM(p_json::json->>'Email'), '');
    v_full_name := NULLIF(TRIM(p_json::json->>'FullName'), '');
    v_metadata := NULLIF(TRIM(p_json::json->>'Metadata'), '');
    v_created_by := COALESCE(NULLIF(TRIM(p_json::json->>'CreatedBy'), ''), 'system');
    
    -- Validate required fields
    IF v_user_id IS NULL OR v_rocket_user_id IS NULL OR v_rocket_username IS NULL THEN
        RAISE EXCEPTION 'UserId, RocketUserId, and RocketUsername are required';
    END IF;
    
    -- Upsert (ON CONFLICT on unique index)
    INSERT INTO dbo."UserRocketChatMapping" (
        "UserId", "RocketUserId", "RocketUsername", 
        "Email", "FullName", "IsActive", 
        "CreatedAt", "LastSyncAt", "Metadata",
        "Log_CreatedBy", "Log_CreatedDate"
    )
    VALUES (
        v_user_id, v_rocket_user_id, v_rocket_username,
        v_email, v_full_name, true,
        NOW(), NOW(), v_metadata,
        v_created_by, NOW()
    )
    ON CONFLICT ("UserId", "RocketUserId") 
    DO UPDATE SET
        "RocketUsername" = EXCLUDED."RocketUsername",
        "Email" = COALESCE(EXCLUDED."Email", dbo."UserRocketChatMapping"."Email"),
        "FullName" = COALESCE(EXCLUDED."FullName", dbo."UserRocketChatMapping"."FullName"),
        "LastSyncAt" = NOW(),
        "Metadata" = COALESCE(EXCLUDED."Metadata", dbo."UserRocketChatMapping"."Metadata"),
        "IsActive" = true,
        "IsDeleted" = false,
        "Log_UpdatedBy" = v_created_by,
        "Log_UpdatedDate" = NOW()
    RETURNING "Id" INTO v_result_id;
    
    RETURN json_build_object(
        'Id', v_result_id,
        'Success', true
    )::TEXT;
END;
$$ LANGUAGE plpgsql;

-- SP: Insert user mapping (for sync - no conflict handling)
CREATE OR REPLACE FUNCTION dbo."sp_InsertUserMapping"(
    p_json TEXT
)
RETURNS TEXT AS $$
DECLARE
    v_user_id INTEGER;
    v_rocket_user_id VARCHAR(50);
    v_rocket_username VARCHAR(100);
    v_email VARCHAR(255);
    v_full_name VARCHAR(200);
    v_metadata TEXT;
    v_created_by VARCHAR(100);
    v_result_id INTEGER;
BEGIN
    -- Parse input JSON
    v_user_id := (p_json::json->>'UserId')::INTEGER;
    v_rocket_user_id := p_json::json->>'RocketUserId';
    v_rocket_username := p_json::json->>'RocketUsername';
    v_email := NULLIF(TRIM(p_json::json->>'Email'), '');
    v_full_name := NULLIF(TRIM(p_json::json->>'FullName'), '');
    v_metadata := NULLIF(TRIM(p_json::json->>'Metadata'), '');
    v_created_by := COALESCE(NULLIF(TRIM(p_json::json->>'CreatedBy'), ''), 'system');
    
    -- Validate required fields
    IF v_user_id IS NULL OR v_rocket_user_id IS NULL OR v_rocket_username IS NULL THEN
        RAISE EXCEPTION 'UserId, RocketUserId, and RocketUsername are required';
    END IF;
    
    -- Insert only (no ON CONFLICT - caller should check first)
    INSERT INTO dbo."UserRocketChatMapping" (
        "UserId", "RocketUserId", "RocketUsername", 
        "Email", "FullName", "IsActive", 
        "CreatedAt", "LastSyncAt", "Metadata",
        "Log_CreatedBy", "Log_CreatedDate"
    )
    VALUES (
        v_user_id, v_rocket_user_id, v_rocket_username,
        v_email, v_full_name, true,
        NOW(), NOW(), v_metadata,
        v_created_by, NOW()
    )
    RETURNING "Id" INTO v_result_id;
    
    RETURN json_build_object(
        'Id', v_result_id,
        'Success', true
    )::TEXT;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- RoomMapping Stored Procedures
-- =====================================================

-- SP: Get room by GroupCode
CREATE OR REPLACE FUNCTION dbo."sp_GetRoomMapping_ByGroupCode"(
    p_json TEXT
)
RETURNS TEXT AS $$
DECLARE
    v_group_code VARCHAR(100);
    v_result TEXT;
BEGIN
    v_group_code := p_json::json->>'GroupCode';
    
    SELECT json_build_object(
        'Id', "Id",
        'GroupCode', "GroupCode",
        'RocketRoomId', "RocketRoomId",
        'RoomName', "RoomName",
        'RoomType', "RoomType",
        'DepartmentId', "DepartmentId",
        'ProjectId', "ProjectId",
        'Description', "Description",
        'IsReadOnly', "IsReadOnly",
        'IsAnnouncement', "IsAnnouncement",
        'IsArchived', "IsArchived",
        'CreatedAt', "CreatedAt",
        'CreatedBy', "CreatedBy"
    )::TEXT INTO v_result
    FROM dbo."RoomMapping"
    WHERE "GroupCode" = v_group_code 
        AND "IsDeleted" = false
    LIMIT 1;
    
    RETURN COALESCE(v_result, 'null');
END;
$$ LANGUAGE plpgsql;

-- SP: Get room by RocketRoomId
CREATE OR REPLACE FUNCTION dbo."sp_GetRoomMapping_ByRocketRoomId"(
    p_json TEXT
)
RETURNS TEXT AS $$
DECLARE
    v_rocket_room_id VARCHAR(50);
    v_result TEXT;
BEGIN
    v_rocket_room_id := p_json::json->>'RocketRoomId';
    
    SELECT json_build_object(
        'Id', "Id",
        'GroupCode', "GroupCode",
        'RocketRoomId', "RocketRoomId",
        'RoomName', "RoomName",
        'RoomType', "RoomType",
        'DepartmentId', "DepartmentId",
        'ProjectId', "ProjectId",
        'IsArchived', "IsArchived"
    )::TEXT INTO v_result
    FROM dbo."RoomMapping"
    WHERE "RocketRoomId" = v_rocket_room_id 
        AND "IsDeleted" = false
    LIMIT 1;
    
    RETURN COALESCE(v_result, 'null');
END;
$$ LANGUAGE plpgsql;

-- SP: Insert room mapping
CREATE OR REPLACE FUNCTION dbo."sp_InsertRoomMapping"(
    p_json TEXT
)
RETURNS TEXT AS $$
DECLARE
    v_group_code VARCHAR(100);
    v_rocket_room_id VARCHAR(50);
    v_room_name VARCHAR(200);
    v_room_type VARCHAR(20);
    v_department_id INTEGER;
    v_project_id INTEGER;
    v_description VARCHAR(500);
    v_is_readonly BOOLEAN;
    v_is_announcement BOOLEAN;
    v_created_by INTEGER;
    v_custom_fields TEXT;
    v_result_id INTEGER;
BEGIN
    -- Parse input JSON
    v_group_code := p_json::json->>'GroupCode';
    v_rocket_room_id := p_json::json->>'RocketRoomId';
    v_room_name := p_json::json->>'RoomName';
    v_room_type := COALESCE(p_json::json->>'RoomType', 'group');
    v_department_id := (p_json::json->>'DepartmentId')::INTEGER;
    v_project_id := (p_json::json->>'ProjectId')::INTEGER;
    v_description := p_json::json->>'Description';
    v_is_readonly := COALESCE((p_json::json->>'IsReadOnly')::BOOLEAN, false);
    v_is_announcement := COALESCE((p_json::json->>'IsAnnouncement')::BOOLEAN, false);
    v_created_by := (p_json::json->>'CreatedBy')::INTEGER;
    v_custom_fields := p_json::json->>'CustomFields';
    
    -- Insert
    INSERT INTO dbo."RoomMapping" (
        "GroupCode", "RocketRoomId", "RoomName", "RoomType",
        "DepartmentId", "ProjectId", "Description",
        "IsReadOnly", "IsAnnouncement",
        "CreatedAt", "CreatedBy", "CustomFields",
        "Log_CreatedBy", "Log_CreatedDate"
    )
    VALUES (
        v_group_code, v_rocket_room_id, v_room_name, v_room_type,
        v_department_id, v_project_id, v_description,
        v_is_readonly, v_is_announcement,
        NOW(), v_created_by, v_custom_fields,
        v_created_by::VARCHAR, NOW()
    )
    RETURNING "Id" INTO v_result_id;
    
    RETURN json_build_object(
        'Id', v_result_id,
        'Success', true
    )::TEXT;
END;
$$ LANGUAGE plpgsql;

-- SP: List rooms with filters
CREATE OR REPLACE FUNCTION dbo."sp_ListRoomMappings"(
    p_json TEXT
)
RETURNS TEXT AS $$
DECLARE
    v_department_id INTEGER;
    v_project_id INTEGER;
    v_room_type VARCHAR(20);
    v_page_size INTEGER;
    v_page_number INTEGER;
    v_offset INTEGER;
    v_result TEXT;
BEGIN
    -- Parse input
    v_department_id := (p_json::json->>'DepartmentId')::INTEGER;
    v_project_id := (p_json::json->>'ProjectId')::INTEGER;
    v_room_type := p_json::json->>'RoomType';
    v_page_size := COALESCE((p_json::json->>'PageSize')::INTEGER, 50);
    v_page_number := COALESCE((p_json::json->>'PageNumber')::INTEGER, 1);
    v_offset := (v_page_number - 1) * v_page_size;
    
    -- Build result
    SELECT json_agg(
        json_build_object(
            'Id', "Id",
            'GroupCode', "GroupCode",
            'RocketRoomId', "RocketRoomId",
            'RoomName', "RoomName",
            'RoomType', "RoomType",
            'DepartmentId', "DepartmentId",
            'ProjectId', "ProjectId",
            'Description', "Description",
            'IsReadOnly', "IsReadOnly",
            'IsArchived', "IsArchived",
            'CreatedAt', "CreatedAt"
        )
    )::TEXT INTO v_result
    FROM (
        SELECT *
        FROM dbo."RoomMapping"
        WHERE "IsDeleted" = false
            AND (v_department_id IS NULL OR "DepartmentId" = v_department_id)
            AND (v_project_id IS NULL OR "ProjectId" = v_project_id)
            AND (v_room_type IS NULL OR "RoomType" = v_room_type)
        ORDER BY "CreatedAt" DESC
        LIMIT v_page_size OFFSET v_offset
    ) sub;
    
    RETURN COALESCE(v_result, '[]');
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- RoomMemberMapping Stored Procedures
-- =====================================================

-- SP: Add room member
CREATE OR REPLACE FUNCTION dbo."sp_AddRoomMember"(
    p_json TEXT
)
RETURNS TEXT AS $$
DECLARE
    v_room_mapping_id INTEGER;
    v_user_mapping_id INTEGER;
    v_user_id INTEGER;
    v_rocket_user_id VARCHAR(50);
    v_role VARCHAR(20);
    v_created_by VARCHAR(100);
    v_result_id INTEGER;
BEGIN
    -- Parse input
    v_room_mapping_id := (p_json::json->>'RoomMappingId')::INTEGER;
    v_user_mapping_id := (p_json::json->>'UserMappingId')::INTEGER;
    v_user_id := (p_json::json->>'UserId')::INTEGER;
    v_rocket_user_id := p_json::json->>'RocketUserId';
    v_role := COALESCE(p_json::json->>'Role', 'member');
    v_created_by := p_json::json->>'CreatedBy';
    
    -- Insert or reactivate
    INSERT INTO dbo."RoomMemberMapping" (
        "RoomMappingId", "UserMappingId", "UserId", "RocketUserId",
        "Role", "IsActive", "JoinedAt",
        "Log_CreatedBy", "Log_CreatedDate"
    )
    VALUES (
        v_room_mapping_id, v_user_mapping_id, v_user_id, v_rocket_user_id,
        v_role, true, NOW(),
        v_created_by, NOW()
    )
    ON CONFLICT ("RoomMappingId", "UserId")
    DO UPDATE SET
        "IsActive" = true,
        "IsDeleted" = false,
        "Role" = EXCLUDED."Role",
        "LeftAt" = NULL,
        "Log_UpdatedBy" = v_created_by,
        "Log_UpdatedDate" = NOW()
    RETURNING "Id" INTO v_result_id;
    
    RETURN json_build_object(
        'Id', v_result_id,
        'Success', true
    )::TEXT;
END;
$$ LANGUAGE plpgsql;

-- SP: Remove room member
CREATE OR REPLACE FUNCTION dbo."sp_RemoveRoomMember"(
    p_json TEXT
)
RETURNS TEXT AS $$
DECLARE
    v_room_mapping_id INTEGER;
    v_user_id INTEGER;
    v_updated_by VARCHAR(100);
BEGIN
    v_room_mapping_id := (p_json::json->>'RoomMappingId')::INTEGER;
    v_user_id := (p_json::json->>'UserId')::INTEGER;
    v_updated_by := p_json::json->>'UpdatedBy';
    
    UPDATE dbo."RoomMemberMapping"
    SET "IsActive" = false,
        "LeftAt" = NOW(),
        "Log_UpdatedBy" = v_updated_by,
        "Log_UpdatedDate" = NOW()
    WHERE "RoomMappingId" = v_room_mapping_id
        AND "UserId" = v_user_id;
    
    RETURN json_build_object('Success', true)::TEXT;
END;
$$ LANGUAGE plpgsql;

-- SP: Get room members
CREATE OR REPLACE FUNCTION dbo."sp_GetRoomMembers"(
    p_json TEXT
)
RETURNS TEXT AS $$
DECLARE
    v_room_mapping_id INTEGER;
    v_include_inactive BOOLEAN;
    v_result TEXT;
BEGIN
    v_room_mapping_id := (p_json::json->>'RoomMappingId')::INTEGER;
    v_include_inactive := COALESCE((p_json::json->>'IncludeInactive')::BOOLEAN, false);
    
    SELECT json_agg(
        json_build_object(
            'Id', m."Id",
            'UserId', m."UserId",
            'RocketUserId', m."RocketUserId",
            'Role', m."Role",
            'IsActive', m."IsActive",
            'JoinedAt', m."JoinedAt",
            'LeftAt', m."LeftAt",
            'Username', u."RocketUsername",
            'FullName', u."FullName"
        )
    )::TEXT INTO v_result
    FROM dbo."RoomMemberMapping" m
    LEFT JOIN dbo."UserRocketChatMapping" u ON m."UserMappingId" = u."Id"
    WHERE m."RoomMappingId" = v_room_mapping_id
        AND m."IsDeleted" = false
        AND (v_include_inactive OR m."IsActive" = true)
    ORDER BY m."JoinedAt" DESC;
    
    RETURN COALESCE(v_result, '[]');
END;
$$ LANGUAGE plpgsql;

-- SP: Update member role
CREATE OR REPLACE FUNCTION dbo."sp_UpdateRoomMemberRole"(
    p_json TEXT
)
RETURNS TEXT AS $$
DECLARE
    v_room_mapping_id INTEGER;
    v_user_id INTEGER;
    v_role VARCHAR(20);
    v_updated_by VARCHAR(100);
BEGIN
    v_room_mapping_id := (p_json::json->>'RoomMappingId')::INTEGER;
    v_user_id := (p_json::json->>'UserId')::INTEGER;
    v_role := p_json::json->>'Role';
    v_updated_by := p_json::json->>'UpdatedBy';
    
    UPDATE dbo."RoomMemberMapping"
    SET "Role" = v_role,
        "Log_UpdatedBy" = v_updated_by,
        "Log_UpdatedDate" = NOW()
    WHERE "RoomMappingId" = v_room_mapping_id
        AND "UserId" = v_user_id
        AND "IsActive" = true;
    
    RETURN json_build_object('Success', true)::TEXT;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ChatMessageLog Stored Procedures
-- =====================================================

-- SP: Insert message log
CREATE OR REPLACE FUNCTION dbo."sp_InsertChatMessageLog"(
    p_json TEXT
)
RETURNS TEXT AS $$
DECLARE
    v_rocket_message_id VARCHAR(50);
    v_rocket_room_id VARCHAR(50);
    v_rocket_user_id VARCHAR(50);
    v_user_id INTEGER;
    v_room_mapping_id INTEGER;
    v_message_text TEXT;
    v_message_type VARCHAR(50);
    v_metadata TEXT;
    v_result_id BIGINT;
BEGIN
    -- Parse input
    v_rocket_message_id := p_json::json->>'RocketMessageId';
    v_rocket_room_id := p_json::json->>'RocketRoomId';
    v_rocket_user_id := p_json::json->>'RocketUserId';
    v_user_id := (p_json::json->>'UserId')::INTEGER;
    v_room_mapping_id := (p_json::json->>'RoomMappingId')::INTEGER;
    v_message_text := p_json::json->>'MessageText';
    v_message_type := COALESCE(p_json::json->>'MessageType', 'text');
    v_metadata := p_json::json->>'Metadata';
    
    -- Insert (ignore duplicates)
    INSERT INTO dbo."ChatMessageLog" (
        "RocketMessageId", "RocketRoomId", "RocketUserId",
        "UserId", "RoomMappingId", "MessageText", "MessageType",
        "CreatedAt", "Metadata", "Log_CreatedDate"
    )
    VALUES (
        v_rocket_message_id, v_rocket_room_id, v_rocket_user_id,
        v_user_id, v_room_mapping_id, v_message_text, v_message_type,
        NOW(), v_metadata, NOW()
    )
    ON CONFLICT ("RocketMessageId") DO NOTHING
    RETURNING "Id" INTO v_result_id;
    
    RETURN json_build_object(
        'Id', COALESCE(v_result_id, 0),
        'Success', true
    )::TEXT;
END;
$$ LANGUAGE plpgsql;

-- SP: Get room messages with pagination
CREATE OR REPLACE FUNCTION dbo."sp_GetRoomMessages"(
    p_json TEXT
)
RETURNS TEXT AS $$
DECLARE
    v_rocket_room_id VARCHAR(50);
    v_page_size INTEGER;
    v_page_number INTEGER;
    v_offset INTEGER;
    v_result TEXT;
BEGIN
    v_rocket_room_id := p_json::json->>'RocketRoomId';
    v_page_size := COALESCE((p_json::json->>'PageSize')::INTEGER, 100);
    v_page_number := COALESCE((p_json::json->>'PageNumber')::INTEGER, 1);
    v_offset := (v_page_number - 1) * v_page_size;
    
    SELECT json_agg(
        json_build_object(
            'Id', "Id",
            'RocketMessageId', "RocketMessageId",
            'RocketUserId', "RocketUserId",
            'UserId', "UserId",
            'MessageText', "MessageText",
            'MessageType', "MessageType",
            'IsDeleted', "IsDeleted",
            'CreatedAt', "CreatedAt"
        )
    )::TEXT INTO v_result
    FROM (
        SELECT *
        FROM dbo."ChatMessageLog"
        WHERE "RocketRoomId" = v_rocket_room_id
            AND "IsDeleted" = false
        ORDER BY "CreatedAt" DESC
        LIMIT v_page_size OFFSET v_offset
    ) sub;
    
    RETURN COALESCE(v_result, '[]');
END;
$$ LANGUAGE plpgsql;

-- SP: Mark message as deleted
CREATE OR REPLACE FUNCTION dbo."sp_DeleteChatMessage"(
    p_json TEXT
)
RETURNS TEXT AS $$
DECLARE
    v_rocket_message_id VARCHAR(50);
    v_is_auto_deleted BOOLEAN;
    v_deletion_reason VARCHAR(500);
    v_deleted_by VARCHAR(100);
BEGIN
    v_rocket_message_id := p_json::json->>'RocketMessageId';
    v_is_auto_deleted := COALESCE((p_json::json->>'IsAutoDeleted')::BOOLEAN, false);
    v_deletion_reason := p_json::json->>'DeletionReason';
    v_deleted_by := p_json::json->>'DeletedBy';
    
    UPDATE dbo."ChatMessageLog"
    SET "IsDeleted" = true,
        "IsAutoDeleted" = v_is_auto_deleted,
        "DeletionReason" = v_deletion_reason,
        "DeletedAt" = NOW(),
        "DeletedBy" = v_deleted_by,
        "Log_UpdatedDate" = NOW()
    WHERE "RocketMessageId" = v_rocket_message_id;
    
    RETURN json_build_object('Success', true)::TEXT;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Summary
-- =====================================================

SELECT 'Stored Procedures created successfully!' as message;

