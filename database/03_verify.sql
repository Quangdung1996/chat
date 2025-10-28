-- =====================================================
-- Verification Script
-- Check if schema, tables, and stored procedures are created correctly
-- =====================================================

\echo '========================================='
\echo 'Rocket.Chat Integration - Verification'
\echo '========================================='
\echo ''

-- Check schema exists
\echo '1. Checking schema...'
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.schemata 
            WHERE schema_name = 'chat'
        ) THEN '✓ Schema "chat" exists'
        ELSE '✗ Schema "chat" NOT FOUND'
    END as status;

\echo ''
\echo '2. Checking tables...'
SELECT 
    table_name as "Table Name",
    CASE 
        WHEN table_name IN (
            'UserRocketChatMapping',
            'RoomMapping',
            'RoomMemberMapping',
            'ChatMessageLog'
        ) THEN '✓'
        ELSE '?'
    END as "Status"
FROM information_schema.tables 
WHERE table_schema = 'chat'
ORDER BY table_name;

\echo ''
\echo '3. Table count (should be 4):'
SELECT COUNT(*) as "Total Tables"
FROM information_schema.tables 
WHERE table_schema = 'chat';

\echo ''
\echo '4. Checking stored procedures...'
SELECT 
    routine_name as "Stored Procedure",
    '✓' as "Status"
FROM information_schema.routines
WHERE routine_schema = 'chat'
  AND routine_type = 'FUNCTION'
ORDER BY routine_name;

\echo ''
\echo '5. Stored procedure count (should be 15):'
SELECT COUNT(*) as "Total Procedures"
FROM information_schema.routines
WHERE routine_schema = 'chat'
  AND routine_type = 'FUNCTION';

\echo ''
\echo '6. Checking indexes...'
SELECT 
    schemaname as "Schema",
    tablename as "Table",
    indexname as "Index",
    '✓' as "Status"
FROM pg_indexes
WHERE schemaname = 'chat'
ORDER BY tablename, indexname;

\echo ''
\echo '7. Checking foreign keys...'
SELECT
    tc.table_name as "Table", 
    kcu.column_name as "Column",
    ccu.table_name AS "Foreign Table",
    ccu.column_name AS "Foreign Column",
    '✓' as "Status"
FROM information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'chat'
ORDER BY tc.table_name;

\echo ''
\echo '8. Testing stored procedures...'

-- Test user mapping procedures
\echo '  - Testing sp_UpsertUserRocketMapping...'
SELECT chat."sp_UpsertUserRocketMapping"(
  '{"UserId": 99999, "RocketUserId": "test-verify-123", "RocketUsername": "verify_test", 
    "Email": "verify@test.com", "FullName": "Verify Test User", "CreatedBy": "verify_script"}'
) as "Result";

\echo '  - Testing sp_GetUserRocketMapping_ByUserId...'
SELECT chat."sp_GetUserRocketMapping_ByUserId"('{"UserId": 99999}') as "Result";

\echo '  - Cleaning up test data...'
DELETE FROM chat."UserRocketChatMapping" WHERE "UserId" = 99999;

\echo ''
\echo '9. Summary:'
SELECT 
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'chat') as "Tables",
    (SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'chat' AND routine_type = 'FUNCTION') as "Procedures",
    (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'chat') as "Indexes";

\echo ''
\echo '========================================='
\echo 'Verification Complete!'
\echo '========================================='
\echo ''
\echo 'Expected results:'
\echo '  - Tables: 4'
\echo '  - Stored Procedures: 15'
\echo '  - Indexes: 14+'
\echo ''
\echo 'If all checks passed, you can proceed to configure the backend.'
\echo ''

