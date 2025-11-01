using SourceAPI.Core.Data.RocketChatData;
using SourceAPI.Infrastructure.Proxy;
using SourceAPI.Models.RocketChat.DTOs;
using System.Threading.Tasks;

namespace SourceAPI.Services.RocketChat
{
    public interface IRocketChatUserService
    {
        Task<CreateUserResponse> CreateUserAsync(string username, string fullName, string? email = null, string? password = null);

        Task<SyncUserResponse> SyncUserAsync(int userId, string username, string fullName, string? email = null);

        Task<bool> UserExistsAsync(string username);

        Task<RocketUserMapping?> GetMappingAsync(int userId);

        Task<RocketUserMapping?> GetMappingByRocketUserIdAsync(string rocketUserId);

        Task<System.Collections.Generic.List<RocketChatUser>> GetRocketChatUsersAsync(int count = 100, int offset = 0);

        Task<bool> SetUserActiveStatusAsync(int userId, bool isActive);
    }
}

