using Refit;
using SourceAPI.Models.RocketChat.DTOs;
using System.Threading.Tasks;

namespace SourceAPI.Infrastructure.Proxy;

public interface IRocketChatPublicProxy
{
    [Post("/api/v1/login")]
    Task<RocketChatLoginResponse> LoginAsync([Body] LoginRequest request);

    [Post("/api/v1/logout")]
    Task<ApiResponse> LogoutAsync();
}

