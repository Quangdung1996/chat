using Ezy.APIService.Core.Repository;
using Ezy.Module.Library.Utilities;
using SourceAPI.Core.Data.Stores;
using System;

namespace SourceAPI.Core.Repository
{
    /// <summary>
    /// Repository for Rocket.Chat integration - Simplified version
    /// Only handles user mapping queries - all other data from Rocket.Chat API
    /// </summary>
    public class RocketChatRepository : EzyEFStoreRepository
    {
        // =====================================================
        // Rocket_UserMapping Operations (Read-only)
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

        /// <summary>
        /// Get all active mapped users
        /// </summary>
        public static UserRocketMappingResult[] GetAllActiveUsers()
        {
            var param = new { }; // Empty param
            return Exec_JsonStoredProceduce_GetArray<UserRocketMappingResult>(
                param,
                ERocketChatStoredProcedureNames.sp_GetAllActiveUsers);
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
            string storedProcedureName = $"{Enum.GetName(typeof(ERocketChatStoredProcedureNames), procedureName)}";

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
    // Result Classes
    // =====================================================

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
}

