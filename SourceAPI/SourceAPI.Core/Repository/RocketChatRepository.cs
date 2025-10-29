using Ezy.APIService.Core.Repository;
using Ezy.Module.Library.Utilities;
using SourceAPI.Core.Data.Stores;
using System;

namespace SourceAPI.Core.Repository
{
    /// <summary>
    /// Repository for Rocket.Chat integration - follows Ezy Framework pattern
    /// Uses JSON stored procedures for database operations
    /// </summary>
    public class RocketChatRepository : EzyEFStoreRepository
    {
        // =====================================================
        // UserRocketChatMapping Operations
        // =====================================================

        /// <summary>
        /// Get user mapping by internal UserId
        /// </summary>
        public static UserRocketMappingResult GetUserMappingByUserId(int userId)
        {
            var param = new { UserId = userId };
            return Exec_JsonStoredProceduce<UserRocketMappingResult>(
                param,
                ERocketChatStoredProcedureNames.sp_GetUserRocketMapping_ByUserId);
        }

        /// <summary>
        /// Get user mapping by Rocket.Chat UserId
        /// </summary>
        public static UserRocketMappingResult GetUserMappingByRocketUserId(string rocketUserId)
        {
            var param = new { RocketUserId = rocketUserId };
            return Exec_JsonStoredProceduce<UserRocketMappingResult>(
                param,
                ERocketChatStoredProcedureNames.sp_GetUserRocketMapping_ByRocketUserId);
        }

        /// <summary>
        /// Insert or update user mapping
        /// </summary>
        public static UpsertResult UpsertUserMapping(UpsertUserMappingParam param)
        {
            return Exec_JsonStoredProceduce<UpsertResult>(
                param,
                ERocketChatStoredProcedureNames.sp_UpsertUserRocketMapping);
        }

        /// <summary>
        /// Get list of users that need to be synced to Rocket.Chat
        /// Returns users that are active but don't have a mapping yet
        /// </summary>
        public static UserToSyncResult[] GetUsersForRocketChatSync()
        {
            var param = new { }; // Empty param
            return Exec_JsonStoredProceduce_GetArray<UserToSyncResult>(
                param,
                ERocketChatStoredProcedureNames.sp_GetUsersForRocketChatSync);
        }

        // =====================================================
        // RoomMapping Operations
        // =====================================================

        /// <summary>
        /// Get room mapping by GroupCode
        /// </summary>
        public static RoomMappingResult GetRoomByGroupCode(string groupCode)
        {
            var param = new { GroupCode = groupCode };
            return Exec_JsonStoredProceduce<RoomMappingResult>(
                param,
                ERocketChatStoredProcedureNames.sp_GetRoomMapping_ByGroupCode);
        }

        /// <summary>
        /// Get room mapping by Rocket.Chat RoomId
        /// </summary>
        public static RoomMappingResult GetRoomByRocketRoomId(string rocketRoomId)
        {
            var param = new { RocketRoomId = rocketRoomId };
            return Exec_JsonStoredProceduce<RoomMappingResult>(
                param,
                ERocketChatStoredProcedureNames.sp_GetRoomMapping_ByRocketRoomId);
        }

        /// <summary>
        /// Insert new room mapping
        /// </summary>
        public static UpsertResult InsertRoom(InsertRoomMappingParam param)
        {
            return Exec_JsonStoredProceduce<UpsertResult>(
                param,
                ERocketChatStoredProcedureNames.sp_InsertRoomMapping);
        }

        /// <summary>
        /// List rooms with filters and pagination
        /// </summary>
        public static RoomMappingResult[] ListRooms(ListRoomsParam param)
        {
            return Exec_JsonStoredProceduce_GetArray<RoomMappingResult>(
                param,
                ERocketChatStoredProcedureNames.sp_ListRoomMappings);
        }

        // =====================================================
        // RoomMemberMapping Operations
        // =====================================================

        /// <summary>
        /// Add member to room
        /// </summary>
        public static UpsertResult AddRoomMember(AddRoomMemberParam param)
        {
            return Exec_JsonStoredProceduce<UpsertResult>(
                param,
                ERocketChatStoredProcedureNames.sp_AddRoomMember);
        }

        /// <summary>
        /// Remove member from room
        /// </summary>
        public static SimpleResult RemoveRoomMember(RemoveRoomMemberParam param)
        {
            return Exec_JsonStoredProceduce<SimpleResult>(
                param,
                ERocketChatStoredProcedureNames.sp_RemoveRoomMember);
        }

        /// <summary>
        /// Get room members
        /// </summary>
        public static RoomMemberResult[] GetRoomMembers(GetRoomMembersParam param)
        {
            return Exec_JsonStoredProceduce_GetArray<RoomMemberResult>(
                param,
                ERocketChatStoredProcedureNames.sp_GetRoomMembers);
        }

        /// <summary>
        /// Update member role (owner, moderator, member)
        /// </summary>
        public static SimpleResult UpdateMemberRole(UpdateMemberRoleParam param)
        {
            return Exec_JsonStoredProceduce<SimpleResult>(
                param,
                ERocketChatStoredProcedureNames.sp_UpdateRoomMemberRole);
        }

        // =====================================================
        // ChatMessageLog Operations
        // =====================================================

        /// <summary>
        /// Insert chat message log
        /// </summary>
        public static UpsertResult InsertMessageLog(InsertMessageLogParam param)
        {
            return Exec_JsonStoredProceduce<UpsertResult>(
                param,
                ERocketChatStoredProcedureNames.sp_InsertChatMessageLog);
        }

        /// <summary>
        /// Get room messages with pagination
        /// </summary>
        public static ChatMessageResult[] GetRoomMessages(GetRoomMessagesParam param)
        {
            return Exec_JsonStoredProceduce_GetArray<ChatMessageResult>(
                param,
                ERocketChatStoredProcedureNames.sp_GetRoomMessages);
        }

        /// <summary>
        /// Mark message as deleted
        /// </summary>
        public static SimpleResult DeleteMessage(DeleteMessageParam param)
        {
            return Exec_JsonStoredProceduce<SimpleResult>(
                param,
                ERocketChatStoredProcedureNames.sp_DeleteChatMessage);
        }

        // =====================================================
        // Helper methods (similar to StoreRepository_Json.cs)
        // =====================================================

        private static TResult Exec_JsonStoredProceduce<TResult>(
            object param,
            ERocketChatStoredProcedureNames procedureName) where TResult : class
        {
            return Exec_JsonStoredProceduce<TResult>(string.Empty, param, procedureName);
        }

        private static TResult Exec_JsonStoredProceduce<TResult>(
            string connectionString,
            object param,
            ERocketChatStoredProcedureNames procedureName) where TResult : class
        {
            TResult resultData = null;
            string paramJson = JsonHelper.SerializeObject(param);
            string storedProcedureName = $"chat.\"{Enum.GetName(typeof(ERocketChatStoredProcedureNames), procedureName)}\"";

            string jsonOutput = Exec_JsonStored_RAW_AnySP(
                connectionString,
                storedProcedureName,
                paramJson);

            if (!string.IsNullOrEmpty(jsonOutput) && jsonOutput != "null")
            {
                resultData = JsonHelper.DeserializeObject<TResult>(jsonOutput);
            }
            return resultData;
        }

        private static TResult[] Exec_JsonStoredProceduce_GetArray<TResult>(
            object param,
            ERocketChatStoredProcedureNames procedureName) where TResult : class
        {
            TResult[] results = null;
            string paramJson = JsonHelper.SerializeObject(param);
            string storedProcedureName = $"{Enum.GetName(typeof(ERocketChatStoredProcedureNames), procedureName)}";

            string jsonOutput = Exec_JsonStored_RAW_AnySP(
                string.Empty,
                storedProcedureName,
                paramJson);

            if (!string.IsNullOrEmpty(jsonOutput) && jsonOutput != "null" && jsonOutput != "[]")
            {
                results = JsonHelper.DeserializeObject<TResult[]>(jsonOutput);
            }
            return results ?? new TResult[0];
        }
    }

    // =====================================================
    // Parameter Classes
    // =====================================================

    #region User Mapping Params

    public class UpsertUserMappingParam
    {
        public int UserId { get; set; }
        public string RocketUserId { get; set; } = string.Empty;
        public string RocketUsername { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string? FullName { get; set; }
        public string? Metadata { get; set; }
        public string? CreatedBy { get; set; }
    }

    #endregion

    #region Room Mapping Params

    public class InsertRoomMappingParam
    {
        public string GroupCode { get; set; }
        public string RocketRoomId { get; set; }
        public string RoomName { get; set; }
        public string RoomType { get; set; } = "group";
        public int? DepartmentId { get; set; }
        public int? ProjectId { get; set; }
        public string Description { get; set; }
        public bool IsReadOnly { get; set; }
        public bool IsAnnouncement { get; set; }
        public int? CreatedBy { get; set; }
        public string CustomFields { get; set; }
    }

    public class ListRoomsParam
    {
        public int? DepartmentId { get; set; }
        public int? ProjectId { get; set; }
        public string RoomType { get; set; }
        public int PageSize { get; set; } = 50;
        public int PageNumber { get; set; } = 1;
    }

    #endregion

    #region Room Member Params

    public class AddRoomMemberParam
    {
        public int RoomMappingId { get; set; }
        public int UserMappingId { get; set; }
        public int UserId { get; set; }
        public string RocketUserId { get; set; }
        public string Role { get; set; } = "member";
        public string CreatedBy { get; set; }
    }

    public class RemoveRoomMemberParam
    {
        public int RoomMappingId { get; set; }
        public int UserId { get; set; }
        public string UpdatedBy { get; set; }
    }

    public class GetRoomMembersParam
    {
        public int RoomMappingId { get; set; }
        public bool IncludeInactive { get; set; } = false;
    }

    public class UpdateMemberRoleParam
    {
        public int RoomMappingId { get; set; }
        public int UserId { get; set; }
        public string Role { get; set; }
        public string UpdatedBy { get; set; }
    }

    #endregion

    #region Message Log Params

    public class InsertMessageLogParam
    {
        public string RocketMessageId { get; set; }
        public string RocketRoomId { get; set; }
        public string RocketUserId { get; set; }
        public int? UserId { get; set; }
        public int? RoomMappingId { get; set; }
        public string MessageText { get; set; }
        public string MessageType { get; set; } = "text";
        public string Metadata { get; set; }
    }

    public class GetRoomMessagesParam
    {
        public string RocketRoomId { get; set; }
        public int PageSize { get; set; } = 100;
        public int PageNumber { get; set; } = 1;
    }

    public class DeleteMessageParam
    {
        public string RocketMessageId { get; set; }
        public bool IsAutoDeleted { get; set; }
        public string DeletionReason { get; set; }
        public string DeletedBy { get; set; }
    }

    #endregion

    // =====================================================
    // Result Classes
    // =====================================================

    #region User Mapping Results

    public class UserRocketMappingResult
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string RocketUserId { get; set; }
        public string RocketUsername { get; set; }
        public string Email { get; set; }
        public string FullName { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? LastSyncAt { get; set; }
        public string Metadata { get; set; }
    }

    public class UserToSyncResult
    {
        public int UserId { get; set; }
        public string Email { get; set; }
        public string FullName { get; set; }
        public string Username { get; set; }
    }

    #endregion

    #region Room Mapping Results

    public class RoomMappingResult
    {
        public int Id { get; set; }
        public string GroupCode { get; set; }
        public string RocketRoomId { get; set; }
        public string RoomName { get; set; }
        public string RoomType { get; set; }
        public int? DepartmentId { get; set; }
        public int? ProjectId { get; set; }
        public string Description { get; set; }
        public bool IsReadOnly { get; set; }
        public bool IsAnnouncement { get; set; }
        public bool IsArchived { get; set; }
        public DateTime CreatedAt { get; set; }
        public int? CreatedBy { get; set; }
    }

    #endregion

    #region Room Member Results

    public class RoomMemberResult
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string RocketUserId { get; set; }
        public string Role { get; set; }
        public bool IsActive { get; set; }
        public DateTime JoinedAt { get; set; }
        public DateTime? LeftAt { get; set; }
        public string Username { get; set; }
        public string FullName { get; set; }
    }

    #endregion

    #region Message Log Results

    public class ChatMessageResult
    {
        public long Id { get; set; }
        public string RocketMessageId { get; set; }
        public string RocketUserId { get; set; }
        public int? UserId { get; set; }
        public string MessageText { get; set; }
        public string MessageType { get; set; }
        public bool IsDeleted { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    #endregion

    #region Common Results

    public class UpsertResult
    {
        public int Id { get; set; }
        public bool Success { get; set; }
    }

    public class SimpleResult
    {
        public bool Success { get; set; }
    }

    #endregion
}

