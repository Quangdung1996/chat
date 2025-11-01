using SourceAPI.Core.Data.RocketChatData;
using SourceAPI.Models.RocketChat.DTOs;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SourceAPI.Services.RocketChat.Interfaces;

public interface IRocketChatUserService
{
    Task<CreateUserResponse> CreateUserAsync(string username, string fullName, string? email = null, string? password = null);

    Task<SyncUserResponse> SyncUser(int userId, string username, string fullName, string? email = null);

    Task<bool> UserExistsAsync(string username);

    RocketUserMapping GetUserMapping(int userId);

    RocketUserMapping GetMappingByRocketUserIdAsync(string rocketUserId);

    Task<List<RocketChatUser>> GetRocketChatUsersAsync(int count = 100, int offset = 0);

    Task<bool> SetUserActiveStatusAsync(int userId, bool isActive);
}