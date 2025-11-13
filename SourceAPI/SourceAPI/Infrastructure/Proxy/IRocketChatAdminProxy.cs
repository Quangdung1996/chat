using Refit;
using SourceAPI.Models.RocketChat.DTOs;
using System.Threading.Tasks;

namespace SourceAPI.Infrastructure.Proxy;

public interface IRocketChatAdminProxy
{
    // =====================================================
    // Users Management (Admin)
    // =====================================================

    [Post("/api/v1/users.create")]
    Task<CreateUserResponse> CreateUserAsync([Body] CreateUserRequest request);

    [Get("/api/v1/users.info")]
    Task<UserInfoResponse> GetUserInfoAsync([Query] string username);

    [Get("/api/v1/users.info")]
    Task<UserInfoResponse> GetUserInfoByIdAsync([Query("userId")] string userId);

    [Get("/api/v1/users.list")]
    Task<UsersListResponse> GetUsersListAsync([Query] int count = 100, [Query] int offset = 0);

    [Post("/api/v1/users.setActiveStatus")]
    Task<ApiResponse> SetUserActiveStatusAsync([Body] SetUserActiveStatusRequest request);
}

