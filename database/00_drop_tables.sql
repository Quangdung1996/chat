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
DROP FUNCTION IF EXISTS dbo."sp_GetUsersForRocketChatSync"(TEXT) CASCADE;
DROP FUNCTION IF EXISTS dbo."sp_GetAllActiveUsers"(TEXT) CASCADE;

\echo '>>> Dropping tables...'

-- Drop UserRocketChatMapping table
DROP TABLE IF EXISTS dbo."UserRocketChatMapping" CASCADE;

\echo '>>> Drop completed successfully!'
\echo '>>> Chỉ còn bảng UserRocketChatMapping đã được xóa'
\echo ''
