using System;

namespace SourceAPI.Core.Data.Stores
{
    /// <summary>
    /// Rocket.Chat stored procedure names enumeration
    /// Simplified: Only user mapping queries
    /// All room/member/message data fetched directly from Rocket.Chat API
    /// </summary>
    public enum ERocketChatStoredProcedureNames
    {
        // Rocket_UserMapping procedures (read-only)
        sp_GetUserRocketMapping_ByUserId,
        sp_GetUserRocketMapping_ByRocketUserId,
        sp_GetUsersForRocketChatSync,
        sp_GetAllActiveUsers
    }
}

