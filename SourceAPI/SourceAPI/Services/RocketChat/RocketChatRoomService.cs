using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SourceAPI.Core.Repository;
using SourceAPI.Helpers.RocketChat;
using SourceAPI.Infrastructure.Proxy;
using SourceAPI.Models.RocketChat;
using SourceAPI.Models.RocketChat.DTOs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SourceAPI.Services.RocketChat
{
    /// <summary>
    /// T-17, T-18: RocketChat Room Service Implementation
    /// </summary>
    public class RocketChatRoomService : IRocketChatRoomService
    {
        private readonly IRocketChatAdminProxy _adminApi;
        private readonly IRocketChatUserProxyFactory _userProxyFactory;
        private readonly IRocketChatUserTokenService _userTokenService;
        private readonly RocketChatConfig _config;
        private readonly ILogger<RocketChatRoomService> _logger;
        private readonly IRocketChatUserService _userService;
        private readonly ICurrentUserService _currentUserService;
        public RocketChatRoomService(
            IRocketChatAdminProxy adminApi,
            IRocketChatUserProxyFactory userProxyFactory,
            IRocketChatUserTokenService userTokenService,
            IOptions<RocketChatConfig> config,
            ILogger<RocketChatRoomService> logger,
            IRocketChatUserService service,
            ICurrentUserService currentUserService)
        {
            _adminApi = adminApi;
            _userProxyFactory = userProxyFactory;
            _userTokenService = userTokenService;
            _config = config.Value;
            _logger = logger;
            _userService = service;
            _currentUserService = currentUserService;
        }

        /// <summary>
        /// T-17: Create private group
        /// DoD: Tạo group private; lưu RoomId/Name vào DB; tuỳ chọn readOnly hoạt động
        /// </summary>
        public async Task<CreateGroupResponse> CreateGroupAsync(CreateGroupRequest request)
        {
            return await CreateRoomInternalAsync(request, "groups.create", "group");
        }

        /// <summary>
        /// T-18: Create public channel
        /// DoD: Tạo channel public; lưu mapping; có thể join được
        /// </summary>
        public async Task<CreateGroupResponse> CreateChannelAsync(CreateGroupRequest request)
        {
            return await CreateRoomInternalAsync(request, "channels.create", "channel");
        }

        /// <summary>
        /// Create direct message room (1-on-1 chat) as a specific user
        /// Returns existing DM if already exists (idempotent)
        /// </summary>
        public async Task<string> CreateDirectMessageAsync(int currentUserId, string targetUsername)
        {
            try
            {
                _logger.LogInformation($"User {currentUserId} creating DM with: {targetUsername}");

                // Get user mapping to get username
                var userMapping = RocketChatRepository.GetUserMappingByUserId(currentUserId);

                if (userMapping == null || string.IsNullOrEmpty(userMapping.RocketUsername))
                {
                    throw new Exception($"User {currentUserId} not synced to Rocket.Chat");
                }

                // Get or create token for current user (login with deterministic password)
                var userToken = await _userTokenService.GetOrCreateUserTokenAsync(currentUserId, userMapping.RocketUsername);

                if (userToken == null || string.IsNullOrEmpty(userToken.AuthToken))
                {
                    throw new Exception($"Cannot get auth token for user {currentUserId}");
                }

                // Create user-specific proxy using factory
                var userApi = _userProxyFactory.CreateUserProxy(userToken.AuthToken, userToken.UserId);

                // Create DM request
                var request = new CreateDMRequest
                {
                    Username = targetUsername
                };

                var response = await userApi.CreateDirectMessageAsync(request);

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

        /// <summary>
        /// Internal method to create room (group or channel)
        /// T-15: Apply naming convention and metadata
        /// </summary>
        private async Task<CreateGroupResponse> CreateRoomInternalAsync(
            CreateGroupRequest request,
            string apiEndpoint,
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

                // T-16: Prepare description with metadata
                var description = request.Description;
                if (request.DepartmentId.HasValue || request.ProjectId.HasValue)
                {
                    var metadata = $"Dept: {request.DepartmentId}, Project: {request.ProjectId}";
                    description = string.IsNullOrWhiteSpace(description)
                        ? metadata
                        : $"{description} ({metadata})";
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
                if (roomType == "group")
                {
                    rocketResponse = await _adminApi.CreatePrivateGroupAsync(createRequest);
                }
                else
                {
                    rocketResponse = await _adminApi.CreatePublicChannelAsync(createRequest);
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

                var room = roomType == "group" ? rocketResponse.Group : rocketResponse.Channel;

                // Set description if provided
                if (!string.IsNullOrWhiteSpace(description))
                {
                    await SetTopicAsync(room.Id, description, roomType);
                }

                // TODO: Save to database
                // var roomMapping = new RoomMapping
                // {
                //     GroupCode = request.GroupCode,
                //     RocketRoomId = rocketResponse.Group.Id,
                //     RoomName = roomName,
                //     RoomType = roomType,
                //     DepartmentId = request.DepartmentId,
                //     ProjectId = request.ProjectId,
                //     Description = description,
                //     IsReadOnly = request.IsReadOnly,
                //     CreatedAt = DateTime.UtcNow
                // };
                // await _dbContext.Set<RoomMapping>().AddAsync(roomMapping);
                // await _dbContext.SaveChangesAsync();

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

        /// <summary>
        /// T-20: Add member to room
        /// </summary>
        public async Task<bool> AddMemberAsync(string roomId, string rocketUserId, string roomType = "group")
        {
            return await InvokeMemberActionAsync(roomId, rocketUserId, "invite", roomType);
        }

        /// <summary>
        /// T-21: Remove member from room
        /// </summary>
        public async Task<bool> RemoveMemberAsync(string roomId, string rocketUserId, string roomType = "group")
        {
            return await InvokeMemberActionAsync(roomId, rocketUserId, "kick", roomType);
        }

        /// <summary>
        /// T-22: Add moderator
        /// </summary>
        public async Task<bool> AddModeratorAsync(string roomId, string rocketUserId, string roomType = "group")
        {
            return await InvokeMemberActionAsync(roomId, rocketUserId, "addModerator", roomType);
        }

        /// <summary>
        /// T-22: Remove moderator
        /// </summary>
        public async Task<bool> RemoveModeratorAsync(string roomId, string rocketUserId, string roomType = "group")
        {
            return await InvokeMemberActionAsync(roomId, rocketUserId, "removeModerator", roomType);
        }

        /// <summary>
        /// T-22: Add owner
        /// </summary>
        public async Task<bool> AddOwnerAsync(string roomId, string rocketUserId, string roomType = "group")
        {
            return await InvokeMemberActionAsync(roomId, rocketUserId, "addOwner", roomType);
        }

        /// <summary>
        /// T-23: Add members in bulk with rate limiting
        /// DoD: Thêm theo danh sách; delay chống rate limit; báo cáo success/fail từng user
        /// </summary>
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

        /// <summary>
        /// T-26: Rename room
        /// </summary>
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
                if (roomType == "group")
                    response = await _adminApi.RenameGroupAsync(request);
                else
                    response = await _adminApi.RenameChannelAsync(request);

                return response?.Success ?? false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error renaming room {roomId}: {ex.Message}");
                return false;
            }
        }

        /// <summary>
        /// T-26: Archive room
        /// </summary>
        public async Task<bool> ArchiveRoomAsync(string roomId, string roomType = "group")
        {
            var endpoint = roomType == "group" ? "groups.archive" : "channels.archive";
            return await InvokeRoomActionAsync(roomId, endpoint);
        }

        /// <summary>
        /// T-26: Delete room
        /// </summary>
        public async Task<bool> DeleteRoomAsync(string roomId, string roomType = "group")
        {
            var endpoint = roomType == "group" ? "groups.delete" : "channels.delete";
            return await InvokeRoomActionAsync(roomId, endpoint);
        }

        /// <summary>
        /// T-25: Set announcement mode
        /// </summary>
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
                if (roomType == "group")
                    response = await _adminApi.SetGroupReadOnlyAsync(request);
                else
                    response = await _adminApi.SetChannelReadOnlyAsync(request);

                return response?.Success ?? false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error setting announcement mode for room {roomId}: {ex.Message}");
                return false;
            }
        }

        /// <summary>
        /// T-25: Set room topic/description
        /// </summary>
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
                if (roomType == "group")
                    response = await _adminApi.SetGroupTopicAsync(request);
                else
                    response = await _adminApi.SetChannelTopicAsync(request);

                return response?.Success ?? false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error setting topic for room {roomId}: {ex.Message}");
                return false;
            }
        }

        /// <summary>
        /// T-36b: Send message to room
        /// </summary>
        public async Task<string?> SendMessageAsync(string userId, string roomId, string text, string? alias = null)
        {
            try
            {
                var request = new PostMessageRequest
                {
                    RoomId = roomId,
                    Text = text
                };
                // Get user mapping to retrieve username
                var mapping = await _userService.GetMappingAsync(int.Parse(userId));
                if (mapping == null)
                {
                    _logger.LogWarning($"User {userId} is not synced to Rocket.Chat");
                    return default;
                }

                // Get user token and create user-specific proxy
                var userToken = await _userTokenService.GetOrCreateUserTokenAsync(int.Parse(userId), mapping.RocketUsername);
                var userApi = _userProxyFactory.CreateUserProxy(userToken.AuthToken, userToken.UserId);
                // Use Refit - DelegatingHandler auto adds auth headers
                var response = await userApi.PostMessageAsync(request);

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
                if (roomType == "group")
                {
                    if (action == "invite")
                        response = await _adminApi.InviteToGroupAsync(request);
                    else if (action == "kick")
                        response = await _adminApi.RemoveFromGroupAsync(new RemoveMemberRequest { RoomId = roomId, UserId = userId });
                    else if (action == "addModerator")
                        response = await _adminApi.AddGroupModeratorAsync(new ModeratorRequest { RoomId = roomId, UserId = userId });
                    else
                        return false;
                }
                else
                {
                    if (action == "invite")
                        response = await _adminApi.InviteToChannelAsync(request);
                    else if (action == "kick")
                        response = await _adminApi.RemoveFromChannelAsync(new RemoveMemberRequest { RoomId = roomId, UserId = userId });
                    else if (action == "addModerator")
                        response = await _adminApi.AddChannelModeratorAsync(new ModeratorRequest { RoomId = roomId, UserId = userId });
                    else
                        return false;
                }

                return response?.Success ?? false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error invoking {action} on room {roomId} for user {userId}: {ex.Message}");
                return false;
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
                        response = await _adminApi.ArchiveGroupAsync(request);
                        break;
                    case "channels.archive":
                        response = await _adminApi.ArchiveChannelAsync(request);
                        break;
                    case "groups.delete":
                        response = await _adminApi.DeleteGroupAsync(request);
                        break;
                    case "channels.delete":
                        response = await _adminApi.DeleteChannelAsync(request);
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

        /// <summary>
        /// Get messages from room (real-time from Rocket.Chat API)
        /// </summary>
        public async Task<List<RoomMessage>> GetRoomMessagesAsync(string roomId, string roomType = "group", int count = 50, int offset = 0)
        {
            try
            {
                roomType = "d";
                var userId = _currentUserService.UserId;
                // Get user mapping to retrieve username
                var mapping = await _userService.GetMappingAsync(userId);
                if (mapping == null)
                {
                    _logger.LogWarning($"User {userId} is not synced to Rocket.Chat");
                    return default;
                }

                // Get user token and create user-specific proxy
                var userToken = await _userTokenService.GetOrCreateUserTokenAsync(userId, mapping.RocketUsername);
                var userApi = _userProxyFactory.CreateUserProxy(userToken.AuthToken, userToken.UserId);


                _logger.LogInformation($"Getting messages from room {roomId} (type: {roomType})");

                RoomMessagesResponse response;

                // Call appropriate API based on room type
                if (roomType == "group")
                {
                    response = await userApi.GetGroupMessagesAsync(roomId, count, offset);
                }
                else if (roomType == "channel")
                {
                    response = await userApi.GetChannelMessagesAsync(roomId, count, offset);
                }
                else if (roomType == "dm" || roomType == "d")
                {
                    response = await userApi.GetDirectMessagesAsync(roomId, count, offset);
                }
                else
                {
                    _logger.LogWarning($"Unknown room type: {roomType}, defaulting to group");
                    response = await userApi.GetGroupMessagesAsync(roomId, count, offset);
                }

                if (response == null || !response.Success)
                {
                    _logger.LogWarning($"Failed to get messages from room {roomId}");
                    return new List<RoomMessage>();
                }

                _logger.LogInformation($"Retrieved {response.Messages.Count} messages from room {roomId}");
                return response.Messages.OrderBy(x => x.Ts).Select(x =>
                {
                    if (x.U.Username == mapping.RocketUsername)
                    {
                        x.IsCurrentUser = true;
                    }
                    return x;
                }).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting messages from room {roomId}: {ex.Message}");
                return new List<RoomMessage>();
            }
        }

        /// <summary>
        /// Get all rooms user is subscribed to (real-time from Rocket.Chat)
        /// </summary>
        public async Task<List<SubscriptionData>> GetUserRoomsAsync(int userId)
        {
            try
            {
                _logger.LogInformation($"Getting rooms for user {userId}");

                // Get user mapping to retrieve username
                var mapping = await _userService.GetMappingAsync(userId);
                if (mapping == null)
                {
                    _logger.LogWarning($"User {userId} is not synced to Rocket.Chat");
                    return new List<SubscriptionData>();
                }

                // Get user token and create user-specific proxy
                var userToken = await _userTokenService.GetOrCreateUserTokenAsync(userId, mapping.RocketUsername);
                var userApi = _userProxyFactory.CreateUserProxy(userToken.AuthToken, userToken.UserId);

                // Get user's subscriptions (rooms they're in)
                var response = await userApi.GetUserSubscriptionsAsync();

                if (response == null || !response.Success)
                {
                    _logger.LogWarning($"Failed to get rooms for user {userId}");
                    return new List<SubscriptionData>();
                }

                _logger.LogInformation($"Retrieved {response.Update.Count} rooms for user {userId} ({mapping.RocketUsername})");
                return response.Update;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting rooms for user {userId}: {ex.Message}");
                return new List<SubscriptionData>();
            }
        }

        /// <summary>
        /// Get all rooms user is subscribed to using Rocket.Chat token from header
        /// Direct authentication with Rocket.Chat without internal userId mapping
        /// </summary>
        public async Task<List<SubscriptionData>> GetUserRoomsByTokenAsync(string authToken, string rocketUserId)
        {
            try
            {
                _logger.LogInformation($"Getting rooms for Rocket.Chat user {rocketUserId} using token");

                // Create user-specific proxy with provided token
                var userApi = _userProxyFactory.CreateUserProxy(authToken, rocketUserId);

                // Get user's subscriptions (rooms they're in)
                var response = await userApi.GetUserSubscriptionsAsync();

                if (response == null || !response.Success)
                {
                    _logger.LogWarning($"Failed to get rooms for Rocket.Chat user {rocketUserId}");
                    return new List<SubscriptionData>();
                }

                _logger.LogInformation($"Retrieved {response.Update.Count} rooms for Rocket.Chat user {rocketUserId}");
                return response.Update;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting rooms for Rocket.Chat user {rocketUserId}: {ex.Message}");
                return new List<SubscriptionData>();
            }
        }

        #endregion
    }
}

