-- =====================================================
-- Drop RocketChat Integration Tables and Procedures
-- Schema: dbo
-- Database: PostgreSQL
-- =====================================================
-- ⚠️ CẢNH BÁO: Script này sẽ XÓA TOÀN BỘ DỮ LIỆU!
-- Chỉ chạy khi cần reset hoàn toàn database
-- =====================================================

\echo '>>> Dropping stored procedures...'

-- Drop User Mapping procedures
DROP FUNCTION IF EXISTS dbo."sp_GetUserRocketMapping_ByUserId"(TEXT) CASCADE;
DROP FUNCTION IF EXISTS dbo."sp_GetUserRocketMapping_ByRocketUserId"(TEXT) CASCADE;
DROP FUNCTION IF EXISTS dbo."sp_UpsertUserRocketMapping"(TEXT) CASCADE;
DROP FUNCTION IF EXISTS dbo."sp_GetUsersForRocketChatSync"(TEXT) CASCADE;
DROP FUNCTION IF EXISTS dbo."sp_GetAllActiveUsers"(TEXT) CASCADE;

-- Drop Room Mapping procedures
DROP FUNCTION IF EXISTS dbo."sp_GetRoomMapping_ByGroupCode"(TEXT) CASCADE;
DROP FUNCTION IF EXISTS dbo."sp_GetRoomMapping_ByRocketRoomId"(TEXT) CASCADE;
DROP FUNCTION IF EXISTS dbo."sp_InsertRoomMapping"(TEXT) CASCADE;
DROP FUNCTION IF EXISTS dbo."sp_ListRoomMappings"(TEXT) CASCADE;

-- Drop Room Member procedures
DROP FUNCTION IF EXISTS dbo."sp_AddRoomMember"(TEXT) CASCADE;
DROP FUNCTION IF EXISTS dbo."sp_RemoveRoomMember"(TEXT) CASCADE;
DROP FUNCTION IF EXISTS dbo."sp_GetRoomMembers"(TEXT) CASCADE;
DROP FUNCTION IF EXISTS dbo."sp_UpdateRoomMemberRole"(TEXT) CASCADE;

-- Drop Message Log procedures
DROP FUNCTION IF EXISTS dbo."sp_InsertChatMessageLog"(TEXT) CASCADE;
DROP FUNCTION IF EXISTS dbo."sp_GetRoomMessages"(TEXT) CASCADE;
DROP FUNCTION IF EXISTS dbo."sp_DeleteChatMessage"(TEXT) CASCADE;

\echo '>>> Dropping tables...'

-- Drop tables theo thứ tự ngược (child tables trước, parent tables sau)
-- CASCADE sẽ tự động drop foreign key constraints
DROP TABLE IF EXISTS dbo."ChatMessageLog" CASCADE;
DROP TABLE IF EXISTS dbo."RoomMemberMapping" CASCADE;
DROP TABLE IF EXISTS dbo."RoomMapping" CASCADE;
DROP TABLE IF EXISTS dbo."UserRocketChatMapping" CASCADE;

\echo '>>> Drop completed successfully!'
\echo ''
