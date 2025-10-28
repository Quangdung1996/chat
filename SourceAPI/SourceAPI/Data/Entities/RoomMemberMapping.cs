using System;

namespace SourceAPI.Data.Entities
{
    /// <summary>
    /// Room member mapping
    /// T-20, T-21, T-22: Member management
    /// Database First: chat.RoomMemberMapping
    /// </summary>
    public partial class RoomMemberMapping
    {
        public RoomMemberMapping()
        {
            OnCreated();
        }

        /// <summary>
        /// Primary key
        /// </summary>
        public virtual int Id { get; set; }

        /// <summary>
        /// Reference to RoomMapping
        /// </summary>
        public virtual int RoomMappingId { get; set; }

        /// <summary>
        /// Reference to UserRocketChatMapping
        /// </summary>
        public virtual int UserMappingId { get; set; }

        /// <summary>
        /// Internal user ID
        /// </summary>
        public virtual int UserId { get; set; }

        /// <summary>
        /// Rocket.Chat user ID
        /// </summary>
        public virtual string RocketUserId { get; set; }

        /// <summary>
        /// Member role: owner, moderator, member
        /// </summary>
        public virtual string Role { get; set; }

        /// <summary>
        /// Is member active in this room
        /// </summary>
        public virtual bool IsActive { get; set; }

        /// <summary>
        /// When member joined
        /// </summary>
        public virtual DateTime JoinedAt { get; set; }

        /// <summary>
        /// When member left (if applicable)
        /// </summary>
        public virtual DateTime? LeftAt { get; set; }

        /// <summary>
        /// Last activity timestamp
        /// </summary>
        public virtual DateTime? LastActivityAt { get; set; }

        /// <summary>
        /// Is deleted (soft delete)
        /// </summary>
        public virtual bool IsDeleted { get; set; }

        /// <summary>
        /// Log: Created date
        /// </summary>
        public virtual DateTime? Log_CreatedDate { get; set; }

        /// <summary>
        /// Log: Created by
        /// </summary>
        public virtual string Log_CreatedBy { get; set; }

        /// <summary>
        /// Log: Updated date
        /// </summary>
        public virtual DateTime? Log_UpdatedDate { get; set; }

        /// <summary>
        /// Log: Updated by
        /// </summary>
        public virtual string Log_UpdatedBy { get; set; }

        #region Extensibility Method Definitions

        partial void OnCreated();

        #endregion
    }
}
