using System;

namespace SourceAPI.Core.Data.Stores
{
    /// <summary>
    /// Rocket.Chat stored procedure names enumeration
    /// </summary>
    public enum ERocketChatStoredProcedureNames
    {
        // UserRocketChatMapping procedures
        sp_GetUserRocketMapping_ByUserId,
        sp_GetUserRocketMapping_ByRocketUserId,
        sp_UpsertUserRocketMapping,

        // RoomMapping procedures
        sp_GetRoomMapping_ByGroupCode,
        sp_GetRoomMapping_ByRocketRoomId,
        sp_InsertRoomMapping,
        sp_ListRoomMappings,

        // RoomMemberMapping procedures
        sp_AddRoomMember,
        sp_RemoveRoomMember,
        sp_GetRoomMembers,
        sp_UpdateRoomMemberRole,

        // ChatMessageLog procedures
        sp_InsertChatMessageLog,
        sp_GetRoomMessages,
        sp_DeleteChatMessage
    }
}

