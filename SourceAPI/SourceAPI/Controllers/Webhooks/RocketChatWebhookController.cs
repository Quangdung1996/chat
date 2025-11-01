using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System;
using System.Threading.Tasks;

namespace SourceAPI.Controllers.Webhooks
{
    [ApiController]
    [Route("api/webhooks/rocketchat")]
    public class RocketChatWebhookController : ControllerBase
    {
        private readonly ILogger<RocketChatWebhookController> _logger;

        public RocketChatWebhookController(ILogger<RocketChatWebhookController> logger)
        {
            _logger = logger;
        }

        [HttpPost]
        [ProducesResponseType(200)]
        [ProducesResponseType(401)]
        public async Task<IActionResult> ReceiveWebhook([FromBody] RocketChatWebhookPayload payload)
        {
            try
            {
                // T-33: Validate webhook token/HMAC
                // TODO: Implement token validation
                // var webhookToken = Request.Headers["X-Webhook-Token"].FirstOrDefault();
                // if (!ValidateWebhookToken(webhookToken))
                // {
                //     _logger.LogWarning("Invalid webhook token");
                //     return Unauthorized(new { message = "Invalid webhook token" });
                // }

                // Log webhook received (with correlationId for tracking)
                var correlationId = Guid.NewGuid().ToString();
                _logger.LogInformation($"Webhook received: {payload.Event} | CorrelationId: {correlationId}");

                // T-31: Return 200 quickly (within 200ms)
                // Enqueue background job for processing
                // TODO: Use Hangfire or BackgroundService
                // BackgroundJob.Enqueue(() => ProcessWebhookAsync(payload, correlationId));

                // For now, process inline (should move to background)
                await ProcessWebhookInlineAsync(payload, correlationId);

                return Ok(new { success = true, correlationId });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error receiving webhook");
                return Ok(new { success = false, message = "Webhook received but processing failed" });
            }
        }

        private async Task ProcessWebhookInlineAsync(RocketChatWebhookPayload payload, string correlationId)
        {
            try
            {
                // T-34: Event dispatcher
                switch (payload.Event?.ToLower())
                {
                    case "message":
                    case "message_sent":
                        await HandleMessageEventAsync(payload, correlationId);
                        break;

                    case "user_joined":
                    case "join":
                        await HandleUserJoinedEventAsync(payload, correlationId);
                        break;

                    case "user_left":
                    case "leave":
                        await HandleUserLeftEventAsync(payload, correlationId);
                        break;

                    case "room_created":
                        await HandleRoomCreatedEventAsync(payload, correlationId);
                        break;

                    case "room_deleted":
                        await HandleRoomDeletedEventAsync(payload, correlationId);
                        break;

                    default:
                        _logger.LogWarning($"Unhandled webhook event: {payload.Event} | CorrelationId: {correlationId}");
                        break;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error processing webhook | CorrelationId: {correlationId}");
                // T-34: Retry logic for transient errors can be added here
            }
        }

        private async Task HandleMessageEventAsync(RocketChatWebhookPayload payload, string correlationId)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(payload.MessageId) || string.IsNullOrWhiteSpace(payload.RoomId))
                {
                    _logger.LogWarning($"Invalid message payload | CorrelationId: {correlationId}");
                    return;
                }

                // TODO: Không còn bảng ChatMessageLog - messages lưu trực tiếp trong Rocket.Chat
                // Nếu cần audit/moderation: implement custom logging hoặc query từ Rocket.Chat API
                // Example: var messages = await _roomService.GetRoomMessagesAsync(payload.RoomId);

                _logger.LogInformation($"Message received: {payload.MessageId} in room {payload.RoomId} | CorrelationId: {correlationId}");

                // T-36: Check moderation rules
                // TODO: Implement policy for auto-delete based on keywords
                // if (ContainsBannedWords(payload.Text))
                // {
                //     await _roomService.DeleteMessageAsync(payload.MessageId, payload.RoomId);
                // }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error handling message event | CorrelationId: {correlationId}");
            }
        }

        private async Task HandleUserJoinedEventAsync(RocketChatWebhookPayload payload, string correlationId)
        {
            try
            {
                _logger.LogInformation($"User joined: {payload.UserId} to room {payload.RoomId} | CorrelationId: {correlationId}");

                // TODO: Update RoomMemberMapping
                // Get room mapping
                // var roomMapping = RocketChatRepository.GetRoomByRocketRoomId(payload.RoomId);
                // if (roomMapping != null)
                // {
                //     // Add member to mapping
                //     RocketChatRepository.AddRoomMember(...);
                // }

                await Task.CompletedTask;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error handling user joined event | CorrelationId: {correlationId}");
            }
        }

        private async Task HandleUserLeftEventAsync(RocketChatWebhookPayload payload, string correlationId)
        {
            try
            {
                _logger.LogInformation($"User left: {payload.UserId} from room {payload.RoomId} | CorrelationId: {correlationId}");

                // TODO: Update RoomMemberMapping with LeftAt timestamp
                // RocketChatRepository.RemoveRoomMember(...);

                await Task.CompletedTask;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error handling user left event | CorrelationId: {correlationId}");
            }
        }

        private async Task HandleRoomCreatedEventAsync(RocketChatWebhookPayload payload, string correlationId)
        {
            try
            {
                _logger.LogInformation($"Room created: {payload.RoomId} | CorrelationId: {correlationId}");

                // TODO: Sync room to database if created from Rocket.Chat UI
                // RocketChatRepository.InsertRoom(...);

                await Task.CompletedTask;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error handling room created event | CorrelationId: {correlationId}");
            }
        }

        private async Task HandleRoomDeletedEventAsync(RocketChatWebhookPayload payload, string correlationId)
        {
            try
            {
                _logger.LogInformation($"Room deleted: {payload.RoomId} | CorrelationId: {correlationId}");

                // TODO: Mark room as deleted in database
                // Update RoomMapping.IsDeleted = true

                await Task.CompletedTask;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error handling room deleted event | CorrelationId: {correlationId}");
            }
        }

        private async Task DeleteMessageAsync(string messageId, string reason, string correlationId)
        {
            try
            {


                _logger.LogInformation($"Message deleted: {messageId} | Reason: {reason} | CorrelationId: {correlationId}");
                await Task.CompletedTask;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting message {messageId} | CorrelationId: {correlationId}");
            }
        }
    }

    #region Webhook Payload Models

    public class RocketChatWebhookPayload
    {
        public string? Event { get; set; }
        public string? MessageId { get; set; }
        public string? RoomId { get; set; }
        public string? UserId { get; set; }
        public string? Username { get; set; }
        public string? Text { get; set; }
        public string? RoomName { get; set; }
        public DateTime? Timestamp { get; set; }
    }

    #endregion
}

