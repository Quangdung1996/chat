-- =====================================================
-- Drop RocketChat Integration Tables
-- Schema: dbo
-- Database: PostgreSQL
-- =====================================================
-- CẢNH BÁO: Script này sẽ XÓA TOÀN BỘ DỮ LIỆU!
-- Chỉ chạy khi cần reset hoàn toàn database
-- =====================================================

-- Drop tables theo thứ tự ngược (tables con trước, tables cha sau)
-- Điều này tự động drop các foreign key constraints

DROP TABLE IF EXISTS dbo."ChatMessageLog" CASCADE;
DROP TABLE IF EXISTS dbo."RoomMemberMapping" CASCADE;
DROP TABLE IF EXISTS dbo."RoomMapping" CASCADE;
DROP TABLE IF EXISTS dbo."UserRocketChatMapping" CASCADE;

-- Drop stored procedures
DROP FUNCTION IF EXISTS dbo."sp_GetUserRocketMapping_ByUserId"(TEXT) CASCADE;
DROP FUNCTION IF EXISTS dbo."sp_GetUserRocketMapping_ByRocketUserId"(TEXT) CASCADE;
DROP FUNCTION IF EXISTS dbo."sp_UpsertUserRocketMapping"(TEXT) CASCADE;
DROP FUNCTION IF EXISTS dbo."sp_GetUsersForRocketChatSync"(TEXT) CASCADE;

DROP FUNCTION IF EXISTS dbo."sp_GetRoomMapping_ByGroupCode"(TEXT) CASCADE;
DROP FUNCTION IF EXISTS dbo."sp_GetRoomMapping_ByRocketRoomId"(TEXT) CASCADE;
DROP FUNCTION IF EXISTS dbo."sp_InsertRoomMapping"(TEXT) CASCADE;
DROP FUNCTION IF EXISTS dbo."sp_ListRoomMappings"(TEXT) CASCADE;

DROP FUNCTION IF EXISTS dbo."sp_AddRoomMember"(TEXT) CASCADE;
DROP FUNCTION IF EXISTS dbo."sp_RemoveRoomMember"(TEXT) CASCADE;
DROP FUNCTION IF EXISTS dbo."sp_GetRoomMembers"(TEXT) CASCADE;
DROP FUNCTION IF EXISTS dbo."sp_UpdateRoomMemberRole"(TEXT) CASCADE;

DROP FUNCTION IF EXISTS dbo."sp_InsertChatMessageLog"(TEXT) CASCADE;
DROP FUNCTION IF EXISTS dbo."sp_GetRoomMessages"(TEXT) CASCADE;
DROP FUNCTION IF EXISTS dbo."sp_DeleteChatMessage"(TEXT) CASCADE;

-- Drop schema (nếu muốn - comment dòng này nếu schema còn dùng cho mục đích khác)
-- DROP SCHEMA IF EXISTS dbo CASCADE;

SELECT 'All RocketChat tables and stored procedures dropped successfully!' as message;

