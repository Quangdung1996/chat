using Microsoft.EntityFrameworkCore;
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SourceAPI.Data.Entities
{
    /// <summary>
    /// Log of chat messages from Rocket.Chat
    /// T-35: Message logging
    /// </summary>
    [Table("ChatMessageLog")]
    [Index(nameof(RocketRoomId), nameof(CreatedAt))]
    [Index(nameof(RocketMessageId), IsUnique = true)]
    public class ChatMessageLog
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public long Id { get; set; }

        /// <summary>
        /// Rocket.Chat message ID
        /// </summary>
        [Required]
        [MaxLength(50)]
        public string RocketMessageId { get; set; } = string.Empty;

        /// <summary>
        /// Rocket.Chat room ID
        /// </summary>
        [Required]
        [MaxLength(50)]
        public string RocketRoomId { get; set; } = string.Empty;

        /// <summary>
        /// Rocket.Chat user ID (sender)
        /// </summary>
        [Required]
        [MaxLength(50)]
        public string RocketUserId { get; set; } = string.Empty;

        /// <summary>
        /// Internal user ID (if mapped)
        /// </summary>
        public int? UserId { get; set; }

        /// <summary>
        /// Internal room mapping ID (if mapped)
        /// </summary>
        public int? RoomMappingId { get; set; }

        /// <summary>
        /// Message text
        /// </summary>
        public string MessageText { get; set; } = string.Empty;

        /// <summary>
        /// Message type (text, file, etc.)
        /// </summary>
        [MaxLength(50)]
        public string MessageType { get; set; } = "text";

        /// <summary>
        /// Is message deleted
        /// </summary>
        public bool IsDeleted { get; set; } = false;

        /// <summary>
        /// Was message auto-deleted by policy
        /// </summary>
        public bool IsAutoDeleted { get; set; } = false;

        /// <summary>
        /// Deletion reason
        /// </summary>
        [MaxLength(500)]
        public string? DeletionReason { get; set; }

        /// <summary>
        /// When message was created in Rocket.Chat
        /// </summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// When message was logged in our DB
        /// </summary>
        public DateTime LoggedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Attachments/metadata (JSON)
        /// </summary>
        public string? Metadata { get; set; }
    }
}

