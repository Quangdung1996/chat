using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SourceAPI.Data.Entities
{
    /// <summary>
    /// Room member mapping with roles
    /// T-20, T-21, T-22: Member management
    /// </summary>
    [Table("RoomMemberMapping")]
    public class RoomMemberMapping
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        /// <summary>
        /// Room mapping ID
        /// </summary>
        [Required]
        public int RoomMappingId { get; set; }

        /// <summary>
        /// User mapping ID
        /// </summary>
        [Required]
        public int UserMappingId { get; set; }

        /// <summary>
        /// Internal user ID (for quick reference)
        /// </summary>
        [Required]
        public int UserId { get; set; }

        /// <summary>
        /// Rocket.Chat user ID (for quick reference)
        /// </summary>
        [Required]
        [MaxLength(50)]
        public string RocketUserId { get; set; } = string.Empty;

        /// <summary>
        /// Member role: 'owner', 'moderator', 'member'
        /// </summary>
        [Required]
        [MaxLength(20)]
        public string Role { get; set; } = "member";

        /// <summary>
        /// Is currently a member
        /// </summary>
        public bool IsActive { get; set; } = true;

        /// <summary>
        /// Joined date
        /// </summary>
        public DateTime JoinedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Left date (if applicable)
        /// </summary>
        public DateTime? LeftAt { get; set; }

        /// <summary>
        /// Last activity/update
        /// </summary>
        public DateTime? LastActivityAt { get; set; }

        // Navigation properties
        [ForeignKey("RoomMappingId")]
        public virtual RoomMapping? Room { get; set; }

        [ForeignKey("UserMappingId")]
        public virtual UserRocketChatMapping? User { get; set; }
    }
}

