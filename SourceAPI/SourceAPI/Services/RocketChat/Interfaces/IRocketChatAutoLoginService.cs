using SourceAPI.Infrastructure.Proxy;
using SourceAPI.Models.RocketChat.DTOs;
using System.Threading.Tasks;

namespace SourceAPI.Services.RocketChat.Interfaces
{
    public interface IRocketChatAutoLoginService
    {
        Task<AuthTokenDto> GetLoginTokenAsync(int userId);

        Task<string> GetAutoLoginUrlAsync(int userId, string redirectPath = "/home");
    }
}

