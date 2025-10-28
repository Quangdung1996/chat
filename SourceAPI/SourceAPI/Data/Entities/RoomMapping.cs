using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SourceAPI.Data.Entities
{
    /// <summary>
    /// Mapping for Rocket.Chat rooms/groups
    /// T-17, T-18: Group and Channel mapping
    /// </summary>
    [Table("RoomMapping")]
    public class RoomMapping
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        /// <summary>
        /// Unique business code for the group (e.g., DEPT-PROJ-001)
        /// </summary>
        [Required]
        [MaxLength(100)]
        public string GroupCode { get; set; } = string.Empty;

        /// <summary>
        /// Rocket.Chat room ID
        /// </summary>
        [Required]
        [MaxLength(50)]
        public string RocketRoomId { get; set; } = string.Empty;

        /// <summary>
        /// Room name in Rocket.Chat
        /// </summary>
        [Required]
        [MaxLength(200)]
        public string RoomName { get; set; } = string.Empty;

        /// <summary>
        /// Room type: 'group' (private) or 'channel' (public)
        /// </summary>
        [Required]
        [MaxLength(20)]
        public string RoomType { get; set; } = "group";

        /// <summary>
        /// Department ID (optional)
        /// </summary>
        public int? DepartmentId { get; set; }

        /// <summary>
        /// Project ID (optional)
        /// </summary>
        public int? ProjectId { get; set; }

        /// <summary>
        /// Room description
        /// </summary>
        [MaxLength(500)]
        public string? Description { get; set; }

        /// <summary>
        /// Is read-only room
        /// </summary>
        public bool IsReadOnly { get; set; } = false;

        /// <summary>
        /// Is archived
        /// </summary>
        public bool IsArchived { get; set; } = false;

        /// <summary>
        /// Is deleted
        /// </summary>
        public bool IsDeleted { get; set; } = false;

        /// <summary>
        /// Created date
        /// </summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Created by user ID
        /// </summary>
        public int? CreatedBy { get; set; }

        /// <summary>
        /// Last updated date
        /// </summary>
        public DateTime? UpdatedAt { get; set; }

        /// <summary>
        /// Custom fields (JSON)
        /// </summary>
        [MaxLength(2000)]
        public string? CustomFields { get; set; }
    }
}

