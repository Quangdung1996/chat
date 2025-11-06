using SourceAPI.Models.RocketChat.DTOs;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;

namespace SourceAPI.Services.RocketChat.Interfaces
{
    public interface IRocketChatRoomService
    {
        Task<CreateGroupResponse> CreateGroupAsync(CreateGroupRequest request);
        Task<CreateGroupResponse> CreateChannelAsync(CreateGroupRequest request);
        Task<string> CreateDirectMessageAsync(int currentUserId, string targetUsername);

        Task<bool> AddMemberAsync(string roomId, string rocketUserId, string roomType = "group");

        Task<bool> RemoveMemberAsync(string roomId, string rocketUserId, string roomType = "group");

        Task<bool> AddModeratorAsync(string roomId, string rocketUserId, string roomType = "group");


        Task<bool> RemoveModeratorAsync(string roomId, string rocketUserId, string roomType = "group");

        Task<bool> AddOwnerAsync(string roomId, string rocketUserId, string roomType = "group");

        Task<Dictionary<string, bool>> AddMembersBulkAsync(string roomId, List<string> rocketUserIds, string roomType = "group");
        Task<bool> RenameRoomAsync(string roomId, string newName, string roomType = "group");

        Task<bool> ArchiveRoomAsync(string roomId, string roomType = "group");

        Task<bool> DeleteRoomAsync(string roomId, string roomType = "group");
        Task<bool> SetAnnouncementModeAsync(string roomId, bool announcementOnly, string roomType = "group");


        Task<bool> SetTopicAsync(string roomId, string topic, string roomType = "group");

        Task<bool> SetAnnouncementAsync(string roomId, string announcement, string roomType = "group");

        Task<string?> SendMessageAsync(string roomId, string text, string? alias = null);

        Task<RoomMessagesResponse> GetRoomMessagesAsync(string roomId, string roomType = "group", int count = 50, int offset = 0);

        Task<RoomMessagesResponse> GetThreadMessagesAsync(string tmid, int count = 50, int offset = 0);

        Task<List<SubscriptionData>> GetUserRoomsByTokenAsync();


        Task<RoomMembersResponse> GetRoomMembersAsync(string roomId, string roomType = "group");


        Task<RoomInfoResponse> GetRoomInfoAsync(string roomId, string roomType = "group");

        Task<bool> LeaveRoomAsync(string roomId, string roomType = "group");

        Task<UploadFileResponse> UploadFileAsync(string roomId, Stream fileStream, string fileName, string contentType, string? description = null, string? message = null);
    }
}

