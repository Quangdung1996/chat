using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using SourceAPI.Helpers.RocketChat;
using SourceAPI.Models.RocketChat;
using SourceAPI.Models.RocketChat.DTOs;
using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

namespace SourceAPI.Services.RocketChat
{
    /// <summary>
    /// T-17, T-18: RocketChat Room Service Implementation
    /// </summary>
    public class RocketChatRoomService : IRocketChatRoomService
    {
        private readonly IRocketChatProxy _rocketChatApi;
        private readonly RocketChatConfig _config;
        private readonly ILogger<RocketChatRoomService> _logger;

        public RocketChatRoomService(
            IRocketChatProxy rocketChatApi,
            IOptions<RocketChatConfig> config,
            ILogger<RocketChatRoomService> logger)
        {
            _rocketChatApi = rocketChatApi;
            _config = config.Value;
            _logger = logger;
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
                    rocketResponse = await _rocketChatApi.CreatePrivateGroupAsync(createRequest);
                }
                else
                {
                    rocketResponse = await _rocketChatApi.CreatePublicChannelAsync(createRequest);
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
                var endpoint = roomType == "group" ? "groups.rename" : "channels.rename";

                var token = await _authService.GetAdminTokenAsync();

                var request = new HttpRequestMessage(HttpMethod.Post, $"/api/v1/{endpoint}");
                request.Headers.Add("X-Auth-Token", token.AuthToken);
                request.Headers.Add("X-User-Id", token.UserId);
                request.Content = new StringContent(
                    JsonConvert.SerializeObject(new { roomId, name = newSlug }),
                    Encoding.UTF8,
                    "application/json"
                );

                var response = await _httpClient.SendAsync(request);
                return response.IsSuccessStatusCode;
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
            var endpoint = roomType == "group" ? "groups.setReadOnly" : "channels.setReadOnly";
            
            try
            {
                var token = await _authService.GetAdminTokenAsync();

                var request = new HttpRequestMessage(HttpMethod.Post, $"/api/v1/{endpoint}");
                request.Headers.Add("X-Auth-Token", token.AuthToken);
                request.Headers.Add("X-User-Id", token.UserId);
                request.Content = new StringContent(
                    JsonConvert.SerializeObject(new { roomId, readOnly = announcementOnly }),
                    Encoding.UTF8,
                    "application/json"
                );

                var response = await _httpClient.SendAsync(request);
                return response.IsSuccessStatusCode;
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
            var endpoint = roomType == "group" ? "groups.setTopic" : "channels.setTopic";
            
            try
            {
                var token = await _authService.GetAdminTokenAsync();

                var request = new HttpRequestMessage(HttpMethod.Post, $"/api/v1/{endpoint}");
                request.Headers.Add("X-Auth-Token", token.AuthToken);
                request.Headers.Add("X-User-Id", token.UserId);
                request.Content = new StringContent(
                    JsonConvert.SerializeObject(new { roomId, topic }),
                    Encoding.UTF8,
                    "application/json"
                );

                var response = await _httpClient.SendAsync(request);
                return response.IsSuccessStatusCode;
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
        public async Task<string?> SendMessageAsync(string roomId, string text, string? alias = null)
        {
            try
            {
                var token = await _authService.GetBotTokenAsync();

                var messageData = new
                {
                    roomId,
                    text,
                    alias
                };

                var request = new HttpRequestMessage(HttpMethod.Post, "/api/v1/chat.postMessage");
                request.Headers.Add("X-Auth-Token", token.AuthToken);
                request.Headers.Add("X-User-Id", token.UserId);
                request.Content = new StringContent(
                    JsonConvert.SerializeObject(messageData),
                    Encoding.UTF8,
                    "application/json"
                );

                var response = await _httpClient.SendAsync(request);
                
                if (!response.IsSuccessStatusCode)
                    return null;

                var responseContent = await response.Content.ReadAsStringAsync();
                var result = JsonConvert.DeserializeObject<dynamic>(responseContent);
                
                return result?.message?._id;
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
                var prefix = roomType == "group" ? "groups" : "channels";
                var endpoint = $"{prefix}.{action}";

                var token = await _authService.GetAdminTokenAsync();

                var request = new HttpRequestMessage(HttpMethod.Post, $"/api/v1/{endpoint}");
                request.Headers.Add("X-Auth-Token", token.AuthToken);
                request.Headers.Add("X-User-Id", token.UserId);
                request.Content = new StringContent(
                    JsonConvert.SerializeObject(new { roomId, userId }),
                    Encoding.UTF8,
                    "application/json"
                );

                var response = await _httpClient.SendAsync(request);
                return response.IsSuccessStatusCode;
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
                var token = await _authService.GetAdminTokenAsync();

                var request = new HttpRequestMessage(HttpMethod.Post, $"/api/v1/{endpoint}");
                request.Headers.Add("X-Auth-Token", token.AuthToken);
                request.Headers.Add("X-User-Id", token.UserId);
                request.Content = new StringContent(
                    JsonConvert.SerializeObject(new { roomId }),
                    Encoding.UTF8,
                    "application/json"
                );

                var response = await _httpClient.SendAsync(request);
                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error invoking {endpoint} on room {roomId}: {ex.Message}");
                return false;
            }
        }

        #endregion
    }
}

