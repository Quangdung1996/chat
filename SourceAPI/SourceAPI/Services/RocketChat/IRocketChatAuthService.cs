using SourceAPI.Infrastructure.Proxy;
using SourceAPI.Models.RocketChat.DTOs;
using System.Threading.Tasks;

namespace SourceAPI.Services.RocketChat
{
    public interface IRocketChatAuthService
    {
        Task<AuthTokenDto> LoginAsync(string username, string password);

        Task<bool> LogoutAsync(string authToken, string userId);

        Task<AuthTokenDto> GetTokenAsync();

        Task<bool> ValidateTokenAsync(string authToken, string userId);

        Task<AuthTokenDto> GetAdminTokenAsync();

        Task<AuthTokenDto> GetBotTokenAsync();

        Task<AuthTokenDto> RefreshAdminTokenAsync();

        void ClearCache();
    }
}

