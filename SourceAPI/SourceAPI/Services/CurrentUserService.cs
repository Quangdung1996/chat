using Microsoft.AspNet.Identity;
using Microsoft.AspNetCore.Http;

namespace SourceAPI.Services;

public interface ICurrentUserService
{
    int UserId { get; }
}

public sealed class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _http;

    public CurrentUserService(IHttpContextAccessor http) => _http = http;

    public int UserId
    {
        get
        {
            var user = _http.HttpContext?.User;
            if (user?.Identity?.IsAuthenticated != true) return 0;


            return int.TryParse(user.Identity.GetUserId(), out int userId) ? userId : 0;
        }
    }

}