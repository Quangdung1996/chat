using Microsoft.AspNet.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using SourceAPI.Models.RocketChat.DTOs;
using SourceAPI.Services.RocketChat;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SourceAPI.Controllers.Integrations
{
    /// <summary>
    /// Rocket.Chat Integration API Controller
    /// Protected by API Key authentication (X-API-Key header)
    /// </summary>
    [ApiController]
    [Route("api/integrations/rocket")]
    public class RocketChatIntegrationController : ControllerBase
    {
        private readonly IRocketChatUserService _userService;
        private readonly IRocketChatRoomService _roomService;
        private readonly IRocketChatAutoLoginService _autoLoginService;
        private readonly ILogger<RocketChatIntegrationController> _logger;

        public RocketChatIntegrationController(
            IRocketChatUserService userService,
            IRocketChatRoomService roomService,
            IRocketChatAutoLoginService autoLoginService,
            ILogger<RocketChatIntegrationController> logger)
        {
            _userService = userService;
            _roomService = roomService;
            _autoLoginService = autoLoginService;
            _logger = logger;
        }

        #region User Management

        /// <summary>
        /// T-41: Get user info by internal user ID
        /// DoD: Bảo vệ bằng API key; cache 5'; trả fullName/department/email
        /// </summary>
        [HttpGet("user/{userId}/info")]
        [ProducesResponseType(200)]
        [ProducesResponseType(404)]
        public async Task<IActionResult> GetUserInfo(int userId)
        {
            try
            {
                var mapping = await _userService.GetMappingAsync(userId);

                if (mapping == null)
                {
                    return NotFound(new { message = "User not found" });
                }

                return Ok(new
                {
                    userId = mapping.UserId,
                    rocketUserId = mapping.RocketUserId,
                    username = mapping.RocketUsername,
                    email = mapping.Email,
                    fullName = mapping.FullName,
                    isActive = mapping.IsActive,
                    lastSyncAt = mapping.LastSyncAt
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting user info {userId}");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        /// <summary>
        /// Get all users from Rocket.Chat (for directory/contacts)
        /// </summary>
        [HttpGet("users")]
        [ProducesResponseType(200)]
        public async Task<IActionResult> GetAllUsers([FromQuery] int count = 100, [FromQuery] int offset = 0)
        {
            try
            {
                var users = await _userService.GetRocketChatUsersAsync(count, offset);

                return Ok(new
                {
                    success = true,
                    users = users,
                    count = users.Count,
                    offset = offset
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting users from Rocket.Chat");
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        /// <summary>
        /// Get Rocket.Chat auto-login token for current user
        /// Allows seamless login to Rocket.Chat without password
        /// </summary>
        [HttpPost("get-login-token")]
        [ProducesResponseType(200)]
        [ProducesResponseType(404)]
        [ProducesResponseType(401)]
        public async Task<IActionResult> GetLoginToken([FromBody] GetLoginTokenRequest request)
        {
            try
            {
                var token = await _autoLoginService.GetLoginTokenAsync(request.UserId);

                return Ok(new
                {
                    success = true,
                    authToken = token.AuthToken,
                    userId = token.UserId,
                    expiresAt = token.ExpiresAt
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting login token for user {request.UserId}");

                if (ex.Message.Contains("not synced"))
                {
                    return NotFound(new { success = false, message = ex.Message });
                }

                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        /// <summary>
        /// Get Rocket.Chat auto-login URL for current user
        /// </summary>
        [HttpPost("get-login-url")]
        [ProducesResponseType(200)]
        [ProducesResponseType(404)]
        public async Task<IActionResult> GetLoginUrl([FromBody] GetLoginUrlRequest request)
        {
            try
            {
                var url = await _autoLoginService.GetAutoLoginUrlAsync(
                    request.UserId,
                    request.RedirectPath ?? "/home"
                );

                return Ok(new
                {
                    success = true,
                    loginUrl = url
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting login URL for user {request.UserId}");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        #endregion

        #region Direct Messages

        /// <summary>
        /// Create direct message room between current user and target user
        /// Returns existing DM if already exists (idempotent)
        /// POST /api/integrations/rocket/dm/create?currentUserId=1&targetUsername=john.doe
        /// </summary>
        [HttpPost("dm/create")]
        [ProducesResponseType(200)]
        [ProducesResponseType(400)]
        public async Task<IActionResult> CreateDirectMessage(
            [FromQuery] int currentUserId,
            [FromQuery] string targetUsername)
        {
            try
            {
                if (currentUserId <= 0)
                {
                    return BadRequest(new { message = "CurrentUserId is required" });
                }

                if (string.IsNullOrWhiteSpace(targetUsername))
                {
                    return BadRequest(new { message = "TargetUsername is required" });
                }

                var roomId = await _roomService.CreateDirectMessageAsync(currentUserId, targetUsername);

                return Ok(new
                {
                    success = true,
                    roomId = roomId,
                    targetUsername = targetUsername
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error creating DM: {ex.Message}");
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        /// <summary>
        /// Get all rooms for a specific user (subscriptions)
        /// Returns all rooms user is participating in (DMs, groups, channels)
        /// GET /api/integrations/rocket/user/{userId}/rooms
        /// </summary>
        [HttpGet("user/{userId}/rooms")]
        [ProducesResponseType(200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(404)]
        public async Task<IActionResult> GetUserRooms(int userId)
        {
            try
            {
                if (userId <= 0)
                {
                    return BadRequest(new { message = "UserId is required" });
                }

                var rooms = await _roomService.GetUserRoomsAsync(userId);

                return Ok(new
                {
                    success = true,
                    userId,
                    count = rooms.Count,
                    rooms
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting rooms for user {userId}");
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        #endregion

        #region Room Management (T-19b, T-26, T-30)

        /// <summary>
        /// T-19b: Create group/channel in Rocket.Chat
        /// DoD: Endpoint bảo vệ; validate input; trả {roomId, groupCode}; idempotent theo groupCode
        /// </summary>
        [HttpPost("create-group")]
        [ProducesResponseType(typeof(CreateGroupResponse), 200)]
        [ProducesResponseType(400)]
        public async Task<IActionResult> CreateGroup([FromBody] CreateGroupRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.GroupCode))
                {
                    return BadRequest(new { message = "GroupCode is required" });
                }


                // Create new group
                var result = request.IsPrivate
                    ? await _roomService.CreateGroupAsync(request)
                    : await _roomService.CreateChannelAsync(request);

                if (!result.Success)
                {
                    return BadRequest(new { message = result.Message });
                }

                _logger.LogInformation($"Group {request.GroupCode} created with RoomId {result.RoomId}");
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error creating group {request.GroupCode}");
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        /// <summary>
        /// T-30: List/search groups with filters
        /// DoD: GET endpoint với pagination; filter theo dept/project/owner
        /// </summary>
        [HttpGet("groups")]
        [ProducesResponseType(200)]
        public IActionResult ListGroups(
            [FromQuery] int? departmentId = null,
            [FromQuery] int? projectId = null,
            [FromQuery] string? roomType = null,
            [FromQuery] int pageSize = 50,
            [FromQuery] int pageNumber = 1)
        {
            try
            {
                //var rooms = RocketChatRepository.ListRooms(new ListRoomsParam
                //{
                //    DepartmentId = departmentId,
                //    ProjectId = projectId,
                //    RoomType = roomType,
                //    PageSize = pageSize,
                //    PageNumber = pageNumber
                //});

                return Ok(new
                {
                    success = true,
                    pageNumber,
                    pageSize,
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error listing groups");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        /// <summary>
        /// T-26: Rename room
        /// </summary>
        [HttpPut("room/{roomId}/rename")]
        [ProducesResponseType(200)]
        [ProducesResponseType(400)]
        public async Task<IActionResult> RenameRoom(string roomId, [FromBody] RenameRoomRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.NewName))
                {
                    return BadRequest(new { message = "NewName is required" });
                }

                var result = await _roomService.RenameRoomAsync(roomId, request.NewName, request.RoomType ?? "group");

                return Ok(new { success = result });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error renaming room {roomId}");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        /// <summary>
        /// T-26: Archive room
        /// </summary>
        [HttpPost("room/{roomId}/archive")]
        [ProducesResponseType(200)]
        public async Task<IActionResult> ArchiveRoom(string roomId, [FromQuery] string roomType = "group")
        {
            try
            {
                var result = await _roomService.ArchiveRoomAsync(roomId, roomType);
                return Ok(new { success = result });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error archiving room {roomId}");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        /// <summary>
        /// T-26: Delete room (with confirmation)
        /// </summary>
        [HttpDelete("room/{roomId}")]
        [ProducesResponseType(200)]
        [ProducesResponseType(400)]
        public async Task<IActionResult> DeleteRoom(string roomId, [FromQuery] string roomType = "group", [FromQuery] bool confirm = false)
        {
            try
            {
                if (!confirm)
                {
                    return BadRequest(new { message = "Please confirm deletion by passing confirm=true" });
                }

                var result = await _roomService.DeleteRoomAsync(roomId, roomType);
                return Ok(new { success = result });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting room {roomId}");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        /// <summary>
        /// T-25: Set announcement mode (read-only for non-moderators)
        /// </summary>
        [HttpPost("room/{roomId}/announcement-mode")]
        [ProducesResponseType(200)]
        public async Task<IActionResult> SetAnnouncementMode(
            string roomId,
            [FromBody] SetAnnouncementModeRequest request)
        {
            try
            {
                var result = await _roomService.SetAnnouncementModeAsync(
                    roomId,
                    request.AnnouncementOnly,
                    request.RoomType ?? "group");

                return Ok(new { success = result });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error setting announcement mode for room {roomId}");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        /// <summary>
        /// T-25: Set room topic
        /// </summary>
        [HttpPut("room/{roomId}/topic")]
        [ProducesResponseType(200)]
        public async Task<IActionResult> SetTopic(string roomId, [FromBody] SetTopicRequest request)
        {
            try
            {
                var result = await _roomService.SetTopicAsync(roomId, request.Topic, request.RoomType ?? "group");
                return Ok(new { success = result });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error setting topic for room {roomId}");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        #endregion

        #region Member Management (T-20, T-21, T-22, T-23, T-24, T-27)

        /// <summary>
        /// T-20: Add single member to room
        /// DoD: Invite thành công; kiểm tra đã là member thì bỏ qua; ghi RoomMemberMapping
        /// </summary>
        [HttpPost("room/{roomId}/add-member")]
        [ProducesResponseType(200)]
        [ProducesResponseType(400)]
        public async Task<IActionResult> AddMember(
            string roomId,
            [FromBody] AddMemberRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.RocketUserId))
                {
                    return BadRequest(new { message = "RocketUserId is required" });
                }

                var result = await _roomService.AddMemberAsync(
                    roomId,
                    request.RocketUserId,
                    request.RoomType ?? "group");

                // TODO: Save to RoomMemberMapping via Repository

                return Ok(new { success = result });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error adding member to room {roomId}");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        /// <summary>
        /// T-23: Add multiple members with rate limiting
        /// DoD: Thêm theo danh sách; delay chống rate limit; báo cáo success/fail từng user
        /// </summary>
        [HttpPost("room/{roomId}/add-members")]
        [ProducesResponseType(200)]
        [ProducesResponseType(400)]
        public async Task<IActionResult> AddMembers(string roomId, [FromBody] AddMembersRequest request)
        {
            try
            {
                if (request.RocketUserIds == null || request.RocketUserIds.Count == 0)
                {
                    return BadRequest(new { message = "No user IDs provided" });
                }

                var results = await _roomService.AddMembersBulkAsync(
                    roomId,
                    request.RocketUserIds,
                    request.RoomType ?? "group"
                );

                var successCount = results.Count(r => r.Value);
                var failCount = results.Count(r => !r.Value);

                return Ok(new
                {
                    success = true,
                    totalProcessed = results.Count,
                    successCount,
                    failCount,
                    details = results
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error adding members to room {roomId}");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        /// <summary>
        /// T-21: Remove member from room
        /// DoD: Kick thành công; kiểm tra quyền; cập nhật DB; audit log
        /// </summary>
        [HttpDelete("room/{roomId}/member/{rocketUserId}")]
        [ProducesResponseType(200)]
        [ProducesResponseType(400)]
        public async Task<IActionResult> RemoveMember(
            string roomId,
            string rocketUserId,
            [FromQuery] string roomType = "group")
        {
            try
            {
                var result = await _roomService.RemoveMemberAsync(roomId, rocketUserId, roomType);

                // TODO: Update RoomMemberMapping via Repository

                return Ok(new { success = result });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error removing member from room {roomId}");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        /// <summary>
        /// T-22: Add moderator role
        /// DoD: Add moderator; cập nhật DB
        /// </summary>
        [HttpPost("room/{roomId}/moderator/{rocketUserId}")]
        [ProducesResponseType(200)]
        public async Task<IActionResult> AddModerator(
            string roomId,
            string rocketUserId,
            [FromQuery] string roomType = "group")
        {
            try
            {
                var result = await _roomService.AddModeratorAsync(roomId, rocketUserId, roomType);

                // TODO: Update role in RoomMemberMapping

                return Ok(new { success = result });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error adding moderator to room {roomId}");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        /// <summary>
        /// T-22: Remove moderator role
        /// </summary>
        [HttpDelete("room/{roomId}/moderator/{rocketUserId}")]
        [ProducesResponseType(200)]
        public async Task<IActionResult> RemoveModerator(
            string roomId,
            string rocketUserId,
            [FromQuery] string roomType = "group")
        {
            try
            {
                var result = await _roomService.RemoveModeratorAsync(roomId, rocketUserId, roomType);
                return Ok(new { success = result });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error removing moderator from room {roomId}");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        /// <summary>
        /// T-22: Add owner role (validate ≥1 owner còn lại)
        /// </summary>
        [HttpPost("room/{roomId}/owner/{rocketUserId}")]
        [ProducesResponseType(200)]
        public async Task<IActionResult> AddOwner(
            string roomId,
            string rocketUserId,
            [FromQuery] string roomType = "group")
        {
            try
            {
                var result = await _roomService.AddOwnerAsync(roomId, rocketUserId, roomType);
                return Ok(new { success = result });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error adding owner to room {roomId}");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        /// <summary>
        /// T-24: Get room members (reconcile with Rocket.Chat)
        /// DoD: So sánh API vs DB; báo cáo chênh lệch
        /// </summary>
        [HttpGet("room/{roomMappingId}/members")]
        [ProducesResponseType(200)]
        public IActionResult GetRoomMembers(int roomMappingId, [FromQuery] bool includeInactive = false)
        {
            // TODO: Không còn bảng RoomMemberMapping - lấy trực tiếp từ Rocket.Chat API
            // Use: await _roomService.GetMembersAsync(rocketRoomId) instead
            // var members = await _roomService.GetMembersAsync(rocketRoomId);

            return Ok(new
            {
                success = false,
                message = "TODO: Get members directly from Rocket.Chat API - no longer using database",
                hint = "Use RocketChatRoomService.GetMembersAsync(roomId)"
            });
        }

        #endregion

        #region Messaging (T-36b)

        /// <summary>
        /// T-36b: Send message to room
        /// DoD: Gửi chủ động vào room bởi bot; hỗ trợ roomId/groupCode; trả về messageId
        /// </summary>
        [HttpPost("send")]
        [ProducesResponseType(200)]
        [ProducesResponseType(400)]
        public async Task<IActionResult> SendMessage([FromBody] SendMessageRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.RoomId) || string.IsNullOrWhiteSpace(request.Text))
                {
                    return BadRequest(new { message = "RoomId and Text are required" });
                }
                string sUserId = User.Identity.GetUserId();

                var messageId = await _roomService.SendMessageAsync(sUserId, request.RoomId, request.Text, request.Alias);

                if (string.IsNullOrWhiteSpace(messageId))
                {
                    return BadRequest(new { message = "Failed to send message" });
                }

                return Ok(new { success = true, messageId });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending message");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        /// <summary>
        /// Get room messages (real-time from Rocket.Chat)
        /// </summary>
        [HttpGet("room/{rocketRoomId}/messages")]
        [ProducesResponseType(200)]
        public async Task<IActionResult> GetRoomMessages(
            string rocketRoomId,
            [FromQuery] string roomType = "group",
            [FromQuery] int count = 50,
            [FromQuery] int offset = 0)
        {
            try
            {
                var messages = await _roomService.GetRoomMessagesAsync(rocketRoomId, roomType, count, offset);

                return Ok(new
                {
                    success = true,
                    rocketRoomId,
                    roomType,
                    count = messages.Count,
                    offset,
                    messages
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting messages for room {rocketRoomId}");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        #endregion
    }

    #region Request Models

    public class SyncUserRequest
    {
        public int UserId { get; set; }
        public string Username { get; set; } = string.Empty;  // From OAuth2 - REQUIRED
        public string FullName { get; set; } = string.Empty;
        public string? Email { get; set; }  // Optional - will generate fake email if null
    }

    public class AddMemberRequest
    {
        public string RocketUserId { get; set; } = string.Empty;
        public string? RoomType { get; set; } = "group";
    }

    public class AddMembersRequest
    {
        public List<string> RocketUserIds { get; set; } = new();
        public string? RoomType { get; set; } = "group";
    }

    public class SendMessageRequest
    {
        public string RoomId { get; set; } = string.Empty;
        public string Text { get; set; } = string.Empty;
        public string? Alias { get; set; }
    }

    public class RenameRoomRequest
    {
        public string NewName { get; set; } = string.Empty;
        public string? RoomType { get; set; } = "group";
    }

    public class SetAnnouncementModeRequest
    {
        public bool AnnouncementOnly { get; set; }
        public string? RoomType { get; set; } = "group";
    }

    public class SetTopicRequest
    {
        public string Topic { get; set; } = string.Empty;
        public string? RoomType { get; set; } = "group";
    }

    public class GetLoginTokenRequest
    {
        public int UserId { get; set; }
    }

    public class GetLoginUrlRequest
    {
        public int UserId { get; set; }
        public string? RedirectPath { get; set; }
    }

    #endregion
}
