using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Refit;
using SourceAPI.Helpers.RocketChat;
using SourceAPI.Infrastructure.Proxy;
using SourceAPI.Models.RocketChat;
using SourceAPI.Models.RocketChat.DTOs;
using SourceAPI.Services.RocketChat.Interfaces;
using System;
using System.Collections.Generic;
using System.IO;
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
                // Note: Members should contain usernames, not userIds (RocketChat API requirement)
                var createRequest = new CreateRoomRequest
                {
                    Name = roomName,
                    Members = request.Members,
                    ReadOnly = request.IsReadOnly
                };

                // Use Refit - DelegatingHandler auto adds auth headers
                // Always create private group (no public channels)
                var rocketResponse = await _userProxy.CreatePrivateGroupAsync(createRequest);

                if (rocketResponse == null || !rocketResponse.Success)
                {
                    _logger.LogError($"Failed to create group: {rocketResponse?.Error}");
                    return new CreateGroupResponse
                    {
                        Success = false,
                        Message = rocketResponse?.Error ?? "Unknown error"
                    };
                }

                var room = rocketResponse.Group;

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

        public async Task<bool> RemoveOwnerAsync(string roomId, string rocketUserId, string roomType = "group")
        {
            return await InvokeMemberActionAsync(roomId, rocketUserId, "removeOwner", roomType);
        }

        public async Task<bool> TransferOwnerAsync(string roomId, string newOwnerId, string roomType = "group")
        {
            try
            {
                _logger.LogInformation($"Transferring owner for room {roomId} to {newOwnerId} (type: {roomType})");

                // Validate: target user must be a member of the group
                var membersResponse = await GetRoomMembersAsync(roomId, roomType);
                if (!membersResponse.Success)
                {
                    _logger.LogWarning($"Failed to get members for room {roomId} to validate transfer");
                    throw new InvalidOperationException("Không thể lấy danh sách thành viên để xác thực chuyển quyền");
                }

                var isMember = membersResponse.Members.Any(m => m.Id == newOwnerId);
                if (!isMember)
                {
                    _logger.LogWarning($"User {newOwnerId} is not a member of room {roomId}. Cannot transfer ownership.");
                    throw new InvalidOperationException("Người dùng mục tiêu phải là thành viên của nhóm trước khi chuyển quyền chủ sở hữu");
                }

                // Get current owners from members list
                var currentOwners = membersResponse.Members
                    .Where(m => m.Roles != null && m.Roles.Contains("owner", StringComparer.OrdinalIgnoreCase))
                    .Select(m => m.Id)
                    .Where(id => !string.IsNullOrEmpty(id))
                    .ToList();

                // Step 1: Add owner role to new owner
                var addOwnerResult = await AddOwnerAsync(roomId, newOwnerId, roomType);
                if (!addOwnerResult)
                {
                    _logger.LogError($"Failed to add owner role to {newOwnerId} in room {roomId}");
                    throw new InvalidOperationException("Không thể thêm quyền chủ sở hữu cho người dùng mới");
                }

                // Step 2: Remove owner role from current owners (if different from new owner)
                foreach (var currentOwnerId in currentOwners)
                {
                    if (currentOwnerId != newOwnerId)
                    {
                        var removeOwnerResult = await RemoveOwnerAsync(roomId, currentOwnerId, roomType);
                        if (!removeOwnerResult)
                        {
                            _logger.LogWarning($"Failed to remove owner role from {currentOwnerId} in room {roomId}. New owner was added but old owner role may still exist.");
                            // Don't throw here - new owner is already added, just log warning
                        }
                    }
                }

                _logger.LogInformation($"✅ Successfully transferred owner for room {roomId} to {newOwnerId}");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error transferring owner for room {roomId}: {ex.Message}");
                throw;
            }
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
                    response = await _userProxy.RenameGroupAsync(request);
                else
                    response = await _userProxy.RenameChannelAsync(request);

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
                    response = await _userProxy.SetGroupReadOnlyAsync(request);
                else
                    response = await _userProxy.SetChannelReadOnlyAsync(request);

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

        public async Task<string?> SendMessageAsync(string roomId, string text, string? alias = null, string? tmid = null)
        {
            try
            {
                var request = new PostMessageRequest
                {
                    RoomId = roomId,
                    Text = text,
                    Tmid = tmid  // For thread replies
                };

                if (!string.IsNullOrWhiteSpace(tmid))
                {
                    _logger.LogInformation($"🧵 Sending thread reply to Rocket.Chat: roomId={roomId}, tmid={tmid}");
                }

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

        public async Task<UploadFileResponse> UploadFileAsync(
            string roomId,
            Stream fileStream,
            string fileName,
            string contentType,
            string? description = null,
            string? message = null)
        {
            try
            {
                _logger.LogInformation($"📤 Uploading file: {fileName} ({contentType}) to room {roomId}");

                // ✨ Create StreamPart with content type for Refit multipart upload
                var streamPart = new StreamPart(fileStream, fileName, contentType);

                // Use Refit - DelegatingHandler auto adds auth headers
                var response = await _userProxy.UploadFileAsync(
                    roomId,
                    streamPart,
                    description,
                    message);

                _logger.LogInformation($"✅ File uploaded successfully: {response?.Message?.Id}");
                return response;
            }
            catch (ApiException apiEx)
            {
                _logger.LogError(apiEx, $"❌ API Error uploading file to room {roomId}: {apiEx.StatusCode} - {apiEx.Content}");
                return new UploadFileResponse { Success = false };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"❌ Error uploading file to room {roomId}: {ex.Message}");
                return new UploadFileResponse { Success = false };
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
                    else if (action.IsAddOwner())
                        response = await _userProxy.AddGroupOwnerAsync(new ModeratorRequest { RoomId = roomId, UserId = userId });
                    else if (action.IsRemoveOwner())
                        response = await _userProxy.RemoveGroupOwnerAsync(new ModeratorRequest { RoomId = roomId, UserId = userId });
                    else if (action.IsRemoveModerator())
                        response = await _userProxy.RemoveGroupModeratorAsync(new ModeratorRequest { RoomId = roomId, UserId = userId });
                    else
                        return false;

                }
                else
                {
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
                        response = await _userProxy.ArchiveGroupAsync(request);
                        break;

                    case "groups.delete":
                        response = await _userProxy.DeleteGroupAsync(request);
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

        public async Task<RoomMessagesResponse> GetRoomMessagesAsync(string roomId, string roomType = "group", int count = 50, int offset = 0)
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
                    return new RoomMessagesResponse
                    {
                        Success = false,
                        Messages = new List<RoomMessage>(),
                        Count = 0,
                        Offset = offset,
                        Total = 0
                    };
                }

                _logger.LogInformation($"Retrieved {response.Messages.Count}/{response.Total} messages from room {roomId} (offset: {offset})");

                // ✅ Filter out thread replies (messages with tmid) - they belong to threads only
                var mainMessages = response.Messages.Where(m => string.IsNullOrEmpty(m.Tmid)).ToList();
                _logger.LogInformation($"Filtered to {mainMessages.Count} main messages (removed {response.Messages.Count - mainMessages.Count} thread replies)");

                // Sort by timestamp descending (newest first) for infinite scroll
                // First page gets newest messages, subsequent pages get older messages
                response.Messages = mainMessages.OrderBy(m => m.Ts).ToList();
                response.Count = response.Messages.Count;
                // Note: Total from API includes thread replies, but we only return main messages
                return response;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting messages from room {roomId}: {ex.Message}");
                return new RoomMessagesResponse
                {
                    Success = false,
                    Messages = new List<RoomMessage>(),
                    Count = 0,
                    Offset = offset,
                    Total = 0
                };
            }
        }

        public async Task<RoomMessagesResponse> GetThreadMessagesAsync(string tmid, int count = 50, int offset = 0)
        {
            try
            {
                _logger.LogInformation($"Getting thread messages for tmid {tmid} (count: {count}, offset: {offset})");

                var response = await _userProxy.GetThreadMessagesAsync(tmid, count, offset);

                if (response == null || !response.Success)
                {
                    _logger.LogWarning($"Failed to get thread messages for tmid {tmid}");
                    return new RoomMessagesResponse
                    {
                        Success = false,
                        Messages = new List<RoomMessage>(),
                        Count = 0,
                        Offset = offset,
                        Total = 0
                    };
                }

                _logger.LogInformation($"Retrieved {response.Messages.Count}/{response.Total} thread messages for tmid {tmid}");
                // Sort by timestamp ascending (oldest first) for threads
                response.Messages = response.Messages.OrderBy(m => m.Ts).ToList();
                return response;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting thread messages for tmid {tmid}: {ex.Message}");
                return new RoomMessagesResponse
                {
                    Success = false,
                    Messages = new List<RoomMessage>(),
                    Count = 0,
                    Offset = offset,
                    Total = 0
                };
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

                // For groups, get roles information and merge with members data
                if (roomType.IsGroup())
                {
                    try
                    {
                        var rolesResponse = await _userProxy.GetGroupRolesAsync(roomId);
                        if (rolesResponse?.Success == true && rolesResponse.Roles?.Count > 0)
                        {
                            // Create a dictionary for quick lookup: userId -> roles
                            var userRoles = rolesResponse.Roles
                                .GroupBy(r => r.User.Id)
                                .ToDictionary(
                                    g => g.Key,
                                    g => g.SelectMany(r => r.Roles).Distinct().ToList()
                                );

                            // Merge roles into members data
                            foreach (var member in response.Members)
                            {
                                if (userRoles.ContainsKey(member.Id))
                                {
                                    member.Roles = userRoles[member.Id];
                                }
                            }

                            _logger.LogInformation($"Merged roles for {userRoles.Count} members in room {roomId}");
                        }
                        else
                        {
                            _logger.LogWarning($"No roles found for room {roomId} or roles API failed");
                        }
                    }
                    catch (Exception roleEx)
                    {
                        _logger.LogWarning(roleEx, $"Failed to get roles for room {roomId}, continuing without roles: {roleEx.Message}");
                        // Continue without roles - don't fail the entire request
                    }
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

        public async Task<bool> PinMessageAsync(string messageId)
        {
            try
            {
                var request = new PinMessageRequest
                {
                    MessageId = messageId
                };

                var response = await _userProxy.PinMessageAsync(request);
                return response?.Success ?? false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error pinning message {messageId}: {ex.Message}");
                return false;
            }
        }

        public async Task<bool> UnpinMessageAsync(string messageId)
        {
            try
            {
                var request = new UnpinMessageRequest
                {
                    MessageId = messageId
                };

                var response = await _userProxy.UnpinMessageAsync(request);
                return response?.Success ?? false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error unpinning message {messageId}: {ex.Message}");
                return false;
            }
        }

        #endregion Private Helper Methods
    }
}