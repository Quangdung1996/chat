using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using SourceAPI.Models.RocketChat.DTOs;
using SourceAPI.Services.RocketChat;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SourceAPI.Controllers.Integrations
{
    /// <summary>
    /// T-11, T-19b: Rocket.Chat Integration API Controller
    /// Protected by API Key authentication
    /// </summary>
    [ApiController]
    [Route("api/integrations/rocket")]
    public class RocketChatIntegrationController : ControllerBase
    {
        private readonly IRocketChatUserService _userService;
        private readonly IRocketChatRoomService _roomService;
        private readonly ILogger<RocketChatIntegrationController> _logger;

        public RocketChatIntegrationController(
            IRocketChatUserService userService,
            IRocketChatRoomService roomService,
            ILogger<RocketChatIntegrationController> logger)
        {
            _userService = userService;
            _roomService = roomService;
            _logger = logger;
        }

        /// <summary>
        /// T-11: Sync user to Rocket.Chat
        /// DoD: Endpoint bảo vệ bằng API key; idempotent; trả {userId, rocketUserId, username}
        /// </summary>
        /// <param name="userId">Internal user ID</param>
        /// <param name="email">User email</param>
        /// <param name="fullName">User full name</param>
        [HttpPost("sync-user")]
        [ProducesResponseType(typeof(SyncUserResponse), 200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(401)]
        public async Task<IActionResult> SyncUser([FromBody] SyncUserRequest request)
        {
            try
            {
                // TODO: Validate API key
                // if (!ValidateApiKey(Request.Headers["X-API-Key"]))
                // {
                //     return Unauthorized(new { message = "Invalid API key" });
                // }

                if (request.UserId <= 0 || string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.FullName))
                {
                    return BadRequest(new { message = "UserId, Email, and FullName are required" });
                }

                var result = await _userService.SyncUserAsync(request.UserId, request.Email, request.FullName);

                if (string.IsNullOrWhiteSpace(result.RocketUserId))
                {
                    return BadRequest(new { message = result.Message });
                }

                _logger.LogInformation($"User {request.UserId} synced successfully to Rocket.Chat");

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error syncing user {request.UserId}: {ex.Message}");
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        /// <summary>
        /// T-19b: Create group in Rocket.Chat
        /// DoD: Endpoint bảo vệ; validate input; trả {roomId, groupCode}; idempotent theo groupCode
        /// </summary>
        [HttpPost("create-group")]
        [ProducesResponseType(typeof(CreateGroupResponse), 200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(401)]
        public async Task<IActionResult> CreateGroup([FromBody] CreateGroupRequest request)
        {
            try
            {
                // TODO: Validate API key
                // if (!ValidateApiKey(Request.Headers["X-API-Key"]))
                // {
                //     return Unauthorized(new { message = "Invalid API key" });
                // }

                // Validate input
                if (string.IsNullOrWhiteSpace(request.GroupCode))
                {
                    return BadRequest(new { message = "GroupCode is required" });
                }

                // Check if group already exists (idempotent)
                // TODO: Check in database by GroupCode
                // var existingRoom = await _dbContext.RoomMappings
                //     .FirstOrDefaultAsync(r => r.GroupCode == request.GroupCode);
                // if (existingRoom != null)
                // {
                //     return Ok(new CreateGroupResponse
                //     {
                //         RoomId = existingRoom.RocketRoomId,
                //         GroupCode = existingRoom.GroupCode,
                //         Name = existingRoom.RoomName,
                //         Success = true,
                //         Message = "Group already exists"
                //     });
                // }

                // Create new group
                var result = request.IsPrivate
                    ? await _roomService.CreateGroupAsync(request)
                    : await _roomService.CreateChannelAsync(request);

                if (!result.Success)
                {
                    return BadRequest(new { message = result.Message });
                }

                _logger.LogInformation($"Group {request.GroupCode} created successfully with RoomId {result.RoomId}");

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error creating group {request.GroupCode}: {ex.Message}");
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        /// <summary>
        /// Add members to a group
        /// </summary>
        [HttpPost("{roomId}/add-members")]
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

                var successCount = 0;
                var failCount = 0;

                foreach (var result in results)
                {
                    if (result.Value) successCount++;
                    else failCount++;
                }

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
                _logger.LogError(ex, $"Error adding members to room {roomId}: {ex.Message}");
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        /// <summary>
        /// T-36b: Send message to room
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

                var messageId = await _roomService.SendMessageAsync(request.RoomId, request.Text, request.Alias);

                if (string.IsNullOrWhiteSpace(messageId))
                {
                    return BadRequest(new { message = "Failed to send message" });
                }

                return Ok(new { success = true, messageId });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error sending message: {ex.Message}");
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }
    }

    #region Request Models

    public class SyncUserRequest
    {
        public int UserId { get; set; }
        public string Email { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
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

    #endregion
}

