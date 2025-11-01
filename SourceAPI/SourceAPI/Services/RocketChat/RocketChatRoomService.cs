using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SourceAPI.Helpers.RocketChat;
using SourceAPI.Infrastructure.Proxy;
using SourceAPI.Models.RocketChat;
using SourceAPI.Models.RocketChat.DTOs;
using SourceAPI.Services.RocketChat.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SourceAPI.Services.RocketChat
{
    public class RocketChatRoomService : IRocketChatRoomService
    {
        private readonly IRocketChatAdminProxy _adminProxy;
        private readonly RocketChatConfig _config;
        private readonly ILogger<RocketChatRoomService> _logger;
        private readonly IRocketChatUserProxy _userProxy;

        public RocketChatRoomService(
            IRocketChatAdminProxy adminProxy,
            IOptions<RocketChatConfig> config,
            ILogger<RocketChatRoomService> logger,
            IRocketChatUserProxy userProxy)
        {
            _adminProxy = adminProxy;
            _config = config.Value;
            _logger = logger;
            _userProxy = userProxy;
        }

        public async Task<CreateGroupResponse> CreateGroupAsync(CreateGroupRequest request)
        {
            return await CreateRoomInternalAsync(request, "group");
        }

        public async Task<CreateGroupResponse> CreateChannelAsync(CreateGroupRequest request)
        {
            return await CreateRoomInternalAsync(request, "channel");
        }

        public async Task<string> CreateDirectMessageAsync(int currentUserId, string targetUsername)
        {
            try
            {
                _logger.LogInformation($"User {currentUserId} creating DM with: {targetUsername}");

                // Create DM request
                var request = new CreateDMRequest
                {
                    Username = targetUsername
                };

                var response = await _userProxy.CreateDirectMessageAsync(request);

                if (response == null || !response.Success)
                {
                    _logger.LogError($"Failed to create DM: {response?.Error}");
                    throw new Exception($"Failed to create DM: {response?.Error}");
                }

                var roomId = response.Room?.Rid ?? response.Room?.Id ?? string.Empty;

                if (string.IsNullOrEmpty(roomId))
                {
                    throw new Exception("DM room ID is empty");
                }

                _logger.LogInformation($"DM created/retrieved successfully. RoomId: {roomId}");
                return roomId;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error creating DM: {ex.Message}");
                throw;
            }
        }

        private async Task<CreateGroupResponse> CreateRoomInternalAsync(
            CreateGroupRequest request,
            string roomType)
        {
            try
            {
                // Auto-generate GroupCode if not provided
                if (string.IsNullOrWhiteSpace(request.GroupCode))
                {
                    // Generate unique group code from timestamp
                    request.GroupCode = $"ROOM-{DateTime.UtcNow:yyyyMMdd-HHmmss}";
                }

                // T-15: Generate room name based on convention
                string roomName;
                if (!string.IsNullOrWhiteSpace(request.Name))
                {
                    roomName = SlugHelper.ToSlug(request.Name);
                }
                else
                {
                    // Generate from department and project
                    var deptName = request.DepartmentId?.ToString() ?? "dept";
                    var projName = request.ProjectId?.ToString() ?? "proj";
                    roomName = SlugHelper.GenerateRoomName(deptName, projName, request.GroupCode);
                }

                // Validate room name
                if (!SlugHelper.IsValidRoomName(roomName))
                {
                    return new CreateGroupResponse
                    {
                        Success = false,
                        Message = $"Invalid room name: {roomName}"
                    };
                }

                // Prepare Refit request
                var createRequest = new CreateRoomRequest
                {
                    Name = roomName,
                    Members = request.Members,
                    ReadOnly = request.IsReadOnly
                };

                // Use Refit - DelegatingHandler auto adds auth headers
                CreateRoomResponse rocketResponse;
                if (roomType.IsGroup())
                {
                    // Use Refit - DelegatingHandler auto adds auth headers
                    rocketResponse = await _userProxy.CreatePrivateGroupAsync(createRequest);
                }
                else
                {
                    rocketResponse = await _adminProxy.CreatePublicChannelAsync(createRequest);
                }

                if (rocketResponse == null || !rocketResponse.Success)
                {
                    _logger.LogError($"Failed to create {roomType}: {rocketResponse?.Error}");
                    return new CreateGroupResponse
                    {
                        Success = false,
                        Message = rocketResponse?.Error ?? "Unknown error"
                    };
                }

                var room = roomType.IsGroup() ? rocketResponse.Group : rocketResponse.Channel;

                // ✅ Set topic if provided
                if (!string.IsNullOrWhiteSpace(request.Topic))
                {
                    await SetTopicAsync(room.Id, request.Topic, roomType);
                }

                // ✅ Set announcement if provided
                if (!string.IsNullOrWhiteSpace(request.Announcement))
                {
                    await SetAnnouncementAsync(room.Id, request.Announcement, roomType);
                }

                _logger.LogInformation($"Successfully created {roomType} {roomName} with ID {room.Id}");

                return new CreateGroupResponse
                {
                    RoomId = room.Id,
                    GroupCode = request.GroupCode,
                    Name = roomName,
                    Success = true,
                    Message = $"{roomType} created successfully"
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Exception creating {roomType}: {ex.Message}");

                return new CreateGroupResponse
                {
                    Success = false,
                    Message = ex.Message
                };
            }
        }

        public async Task<bool> AddMemberAsync(string roomId, string rocketUserId, string roomType = "group")
        {
            return await InvokeMemberActionAsync(roomId, rocketUserId, "invite", roomType);
        }

        public async Task<bool> RemoveMemberAsync(string roomId, string rocketUserId, string roomType = "group")
        {
            return await InvokeMemberActionAsync(roomId, rocketUserId, "kick", roomType);
        }

        public async Task<bool> AddModeratorAsync(string roomId, string rocketUserId, string roomType = "group")
        {
            return await InvokeMemberActionAsync(roomId, rocketUserId, "addModerator", roomType);
        }

        public async Task<bool> RemoveModeratorAsync(string roomId, string rocketUserId, string roomType = "group")
        {
            return await InvokeMemberActionAsync(roomId, rocketUserId, "removeModerator", roomType);
        }

        public async Task<bool> AddOwnerAsync(string roomId, string rocketUserId, string roomType = "group")
        {
            return await InvokeMemberActionAsync(roomId, rocketUserId, "addOwner", roomType);
        }

        public async Task<Dictionary<string, bool>> AddMembersBulkAsync(
            string roomId,
            List<string> rocketUserIds,
            string roomType = "group")
        {
            var results = new Dictionary<string, bool>();

            foreach (var userId in rocketUserIds)
            {
                try
                {
                    var success = await AddMemberAsync(roomId, userId, roomType);
                    results[userId] = success;

                    // Rate limiting delay (T-23)
                    await Task.Delay(_config.RateLimitDelayMs);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"Error adding user {userId} to room {roomId}: {ex.Message}");
                    results[userId] = false;
                }
            }

            return results;
        }

        public async Task<bool> RenameRoomAsync(string roomId, string newName, string roomType = "group")
        {
            try
            {
                var newSlug = SlugHelper.ToSlug(newName);
                var request = new RenameRoomRequest
                {
                    RoomId = roomId,
                    Name = newSlug
                };

                // Use Refit - DelegatingHandler auto adds auth headers
                ApiResponse response;
                if (roomType.IsGroup())
                    response = await _adminProxy.RenameGroupAsync(request);
                else
                    response = await _adminProxy.RenameChannelAsync(request);

                return response?.Success ?? false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error renaming room {roomId}: {ex.Message}");
                return false;
            }
        }

        public async Task<bool> ArchiveRoomAsync(string roomId, string roomType = "group")
        {
            var endpoint = roomType.IsGroup() ? "groups.archive" : "channels.archive";
            return await InvokeRoomActionAsync(roomId, endpoint);
        }

        public async Task<bool> DeleteRoomAsync(string roomId, string roomType = "group")
        {
            var endpoint = roomType.IsGroup() ? "groups.delete" : "channels.delete";
            return await InvokeRoomActionAsync(roomId, endpoint);
        }

        public async Task<bool> SetAnnouncementModeAsync(string roomId, bool announcementOnly, string roomType = "group")
        {
            try
            {
                var request = new SetReadOnlyRequest
                {
                    RoomId = roomId,
                    ReadOnly = announcementOnly
                };

                // Use Refit - DelegatingHandler auto adds auth headers
                ApiResponse response;
                if (roomType.IsGroup())
                    response = await _adminProxy.SetGroupReadOnlyAsync(request);
                else
                    response = await _adminProxy.SetChannelReadOnlyAsync(request);

                return response?.Success ?? false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error setting announcement mode for room {roomId}: {ex.Message}");
                return false;
            }
        }

        public async Task<bool> SetTopicAsync(string roomId, string topic, string roomType = "group")
        {
            try
            {
                var request = new SetTopicRequest
                {
                    RoomId = roomId,
                    Topic = topic
                };

                // Use Refit - DelegatingHandler auto adds auth headers
                ApiResponse response;
                if (roomType.IsGroup())
                    response = await _userProxy.SetGroupTopicAsync(request);
                else
                    response = await _userProxy.SetChannelTopicAsync(request);

                return response?.Success ?? false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error setting topic for room {roomId}: {ex.Message}");
                return false;
            }
        }

        public async Task<bool> SetAnnouncementAsync(string roomId, string announcement, string roomType = "group")
        {
            try
            {
                var request = new SetAnnouncementRequest
                {
                    RoomId = roomId,
                    Announcement = announcement
                };

                // Use Refit - DelegatingHandler auto adds auth headers
                ApiResponse response;
                if (roomType.IsGroup())
                    response = await _userProxy.SetGroupAnnouncementAsync(request);
                else
                    response = await _userProxy.SetChannelAnnouncementAsync(request);

                return response?.Success ?? false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error setting announcement for room {roomId}: {ex.Message}");
                return false;
            }
        }

        public async Task<string?> SendMessageAsync(string roomId, string text, string? alias = null)
        {
            try
            {
                var request = new PostMessageRequest
                {
                    RoomId = roomId,
                    Text = text
                };

                // Use Refit - DelegatingHandler auto adds auth headers
                var response = await _userProxy.PostMessageAsync(request);

                if (!response.Success)
                    return null;

                return response.Message?.Id;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error sending message to room {roomId}: {ex.Message}");
                return null;
            }
        }

        #region Private Helper Methods

        private async Task<bool> InvokeMemberActionAsync(
            string roomId,
            string userId,
            string action,
            string roomType)
        {
            try
            {
                var request = new InviteMemberRequest
                {
                    RoomId = roomId,
                    UserId = userId
                };

                // Use Refit - DelegatingHandler auto adds auth headers
                ApiResponse response;
                if (roomType.IsGroup())
                {
                    if (action.IsInvite())
                        response = await _userProxy.InviteToGroupAsync(request);
                    else if (action.IsKick())
                        response = await _userProxy.RemoveFromGroupAsync(new RemoveMemberRequest { RoomId = roomId, UserId = userId });
                    else if (action.IsAddModerator())
                        response = await _userProxy.AddGroupModeratorAsync(new ModeratorRequest { RoomId = roomId, UserId = userId });
                    else
                        return false;
                }
                else
                {
                    if (action.IsInvite())
                        response = await _adminProxy.InviteToChannelAsync(request);
                    else if (action.IsKick())
                        response = await _adminProxy.RemoveFromChannelAsync(new RemoveMemberRequest { RoomId = roomId, UserId = userId });
                    else if (action.IsAddModerator())
                        response = await _adminProxy.AddChannelModeratorAsync(new ModeratorRequest { RoomId = roomId, UserId = userId });
                    else
                        return false;
                }

                return response?.Success ?? false;
            }
            catch (Refit.ApiException apiEx)
            {
                // Refit throws ApiException when API returns error (403, 400, etc.)
                _logger.LogWarning(apiEx, $"Rocket.Chat API error invoking {action} on room {roomId} for user {userId}: {apiEx.StatusCode} - {apiEx.Message}");

                // Re-throw with more context for controller to handle
                throw new InvalidOperationException($"Không có quyền thực hiện thao tác này hoặc thao tác không hợp lệ", apiEx);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error invoking {action} on room {roomId} for user {userId}: {ex.Message}");
                throw;
            }
        }

        private async Task<bool> InvokeRoomActionAsync(string roomId, string endpoint)
        {
            try
            {
                var request = new RoomActionRequest { RoomId = roomId };

                // Use Refit - DelegatingHandler auto adds auth headers
                ApiResponse response;

                switch (endpoint)
                {
                    case "groups.archive":
                        response = await _adminProxy.ArchiveGroupAsync(request);
                        break;

                    case "channels.archive":
                        response = await _adminProxy.ArchiveChannelAsync(request);
                        break;

                    case "groups.delete":
                        response = await _adminProxy.DeleteGroupAsync(request);
                        break;

                    case "channels.delete":
                        response = await _adminProxy.DeleteChannelAsync(request);
                        break;

                    default:
                        _logger.LogWarning("Unknown endpoint: {Endpoint}", endpoint);
                        return false;
                }

                return response?.Success ?? false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error invoking {endpoint} on room {roomId}: {ex.Message}");
                return false;
            }
        }

        public async Task<List<RoomMessage>> GetRoomMessagesAsync(string roomId, string roomType = "group", int count = 50, int offset = 0)
        {
            try
            {
                RoomMessagesResponse response;

                // Call appropriate API based on room type
                if (roomType.IsGroup())
                {
                    response = await _userProxy.GetGroupMessagesAsync(roomId, count, offset);
                }
                else if (roomType.IsChannel())
                {
                    response = await _userProxy.GetChannelMessagesAsync(roomId, count, offset);
                }
                else if (roomType.IsDirect())
                {
                    response = await _userProxy.GetDirectMessagesAsync(roomId, count, offset);
                }
                else
                {
                    _logger.LogWarning($"Unknown room type: {roomType}, defaulting to group");
                    response = await _userProxy.GetGroupMessagesAsync(roomId, count, offset);
                }

                if (response == null || !response.Success)
                {
                    _logger.LogWarning($"Failed to get messages from room {roomId}");
                    return new List<RoomMessage>();
                }

                _logger.LogInformation($"Retrieved {response.Messages.Count} messages from room {roomId}");
                return response.Messages.OrderBy(x => x.Ts).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting messages from room {roomId}: {ex.Message}");
                return new List<RoomMessage>();
            }
        }

        public async Task<List<SubscriptionData>> GetUserRoomsByTokenAsync()
        {
            try
            {
                var response = await _userProxy.GetUserSubscriptionsAsync();

                if (response == null || !response.Success)
                {
                    return new List<SubscriptionData>();
                }

                return response.Update;
            }
            catch (Exception ex)
            {
                return new List<SubscriptionData>();
            }
        }

        public async Task<bool> LeaveRoomAsync(string roomId, string roomType = "group")
        {
            try
            {
                _logger.LogInformation($"User leaving room {roomId} (type: {roomType})");

                var request = new LeaveRoomRequest { RoomId = roomId };
                ApiResponse response;

                // Call appropriate endpoint based on room type
                if (roomType.IsGroup())
                {
                    response = await _userProxy.LeaveGroupAsync(request);
                }
                else if (roomType.IsChannel())
                {
                    response = await _userProxy.LeaveChannelAsync(request);
                }
                else
                {
                    _logger.LogWarning($"Unknown room type '{roomType}', defaulting to group");
                    response = await _userProxy.LeaveGroupAsync(request);
                }

                if (response.Success)
                {
                    _logger.LogInformation($"✅ User left room {roomId} successfully");
                    return true;
                }
                else
                {
                    _logger.LogWarning($"⚠️ Failed to leave room {roomId}: {response.Error}");
                    return false;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"❌ Error leaving room {roomId}");
                return false;
            }
        }

        public async Task<RoomMembersResponse> GetRoomMembersAsync(string roomId, string roomType = "group")
        {
            try
            {
                _logger.LogInformation($"Getting members for room {roomId} (type: {roomType})");

                RoomMembersResponse response;

                // Call appropriate endpoint based on room type
                if (roomType.IsGroup())
                {
                    response = await _userProxy.GetGroupMembersAsync(roomId);
                }
                else if (roomType.IsChannel())
                {
                    response = await _userProxy.GetChannelMembersAsync(roomId);
                }
                else if (roomType.IsDirect())
                {
                    response = await _userProxy.GetDirectMessageMembersAsync(roomId);
                }
                else
                {
                    _logger.LogWarning($"Unknown room type '{roomType}', defaulting to group");
                    response = await _userProxy.GetGroupMembersAsync(roomId);
                }

                if (response == null || !response.Success)
                {
                    _logger.LogWarning($"Failed to get members for room {roomId}");
                    return new RoomMembersResponse { Success = false, Members = new List<RoomMemberData>() };
                }

                _logger.LogInformation($"Retrieved {response.Members.Count} members for room {roomId}");
                return response;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting members for room {roomId}: {ex.Message}");
                return new RoomMembersResponse { Success = false, Members = new List<RoomMemberData>() };
            }
        }

        public async Task<RoomInfoResponse> GetRoomInfoAsync(string roomId, string roomType = "group")
        {
            try
            {
                _logger.LogInformation($"Getting info for room {roomId} (type: {roomType})");

                RoomInfoResponse response;

                // Call appropriate endpoint based on room type
                if (roomType.IsGroup())
                {
                    response = await _userProxy.GetGroupInfoAsync(roomId);
                }
                else if (roomType.IsChannel())
                {
                    response = await _userProxy.GetChannelInfoAsync(roomId);
                }
                else
                {
                    _logger.LogWarning($"Unknown room type '{roomType}' for info request, defaulting to group");
                    response = await _userProxy.GetGroupInfoAsync(roomId);
                }

                if (response == null || !response.Success)
                {
                    _logger.LogWarning($"Failed to get info for room {roomId}");
                    return new RoomInfoResponse { Success = false };
                }

                _logger.LogInformation($"Retrieved info for room {roomId}, readOnly: {response.Room?.ReadOnly ?? response.Group?.ReadOnly ?? false}");
                return response;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting info for room {roomId}: {ex.Message}");
                return new RoomInfoResponse { Success = false };
            }
        }

        #endregion Private Helper Methods
    }
}