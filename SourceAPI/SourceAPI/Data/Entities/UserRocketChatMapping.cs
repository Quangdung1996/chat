using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SourceAPI.Data.Entities
{
    /// <summary>
    /// Mapping between internal users and Rocket.Chat users
    /// T-06, T-07: Migration and EF Model
    /// </summary>
    [Table("UserRocketChatMapping")]
    public class UserRocketChatMapping
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        /// <summary>
        /// Internal system user ID
        /// </summary>
        [Required]
        public int UserId { get; set; }

        /// <summary>
        /// Rocket.Chat user ID
        /// </summary>
        [Required]
        [MaxLength(50)]
        public string RocketUserId { get; set; } = string.Empty;

        /// <summary>
        /// Rocket.Chat username
        /// </summary>
        [Required]
        [MaxLength(100)]
        public string RocketUsername { get; set; } = string.Empty;

        /// <summary>
        /// When the mapping was created
        /// </summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Last sync date
        /// </summary>
        public DateTime? LastSyncAt { get; set; }

        /// <summary>
        /// Is this user active in Rocket.Chat
        /// </summary>
        public bool IsActive { get; set; } = true;

        /// <summary>
        /// Additional metadata (JSON)
        /// </summary>
        [MaxLength(1000)]
        public string? Metadata { get; set; }
    }
}

