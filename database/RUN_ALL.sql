-- =====================================================
-- RocketChat Integration - Full Setup Script
-- Chạy tất cả scripts theo đúng thứ tự
-- =====================================================
-- Cách sử dụng:
-- psql -U your_username -d your_database -f database/RUN_ALL.sql
-- 
-- Hoặc trong psql:
-- \i database/RUN_ALL.sql
-- =====================================================

\echo ''
\echo '========================================='
\echo 'RocketChat Integration - Database Setup'
\echo '========================================='
\echo ''

\echo '>>> Step 1: Dropping existing tables and procedures...'
\i 00_drop_tables.sql

\echo '>>> Step 2: Creating schema and tables...'
\i 01_create_schema_and_tables.sql

\echo '>>> Step 3: Creating stored procedures...'
\i 02_stored_procedures.sql

\echo '>>> Step 4: Creating sync users procedure...'
\i 03_sync_users_procedure.sql

\echo ''
\echo '========================================='
\echo '✅ Setup Complete!'
\echo '========================================='
\echo ''
\echo 'Tables created:'
\echo '  ✓ dbo.UserRocketChatMapping'
\echo '  ✓ dbo.RoomMapping'
\echo '  ✓ dbo.RoomMemberMapping'
\echo '  ✓ dbo.ChatMessageLog'
\echo ''
\echo 'Stored procedures created:'
\echo '  ✓ User mapping (4 SPs)'
\echo '  ✓ Room mapping (4 SPs)'
\echo '  ✓ Room members (4 SPs)'
\echo '  ✓ Messages (3 SPs)'
\echo '  ✓ Sync procedures (2 SPs)'
\echo ''
\echo 'Verify installation:'
\echo '  SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '\''dbo'\'' AND table_name LIKE '\''%Rocket%'\'';'
\echo '  -- Should return: 4'
\echo ''

