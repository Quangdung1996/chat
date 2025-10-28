using System;

namespace SourceAPI.Data.Entities
{
    /// <summary>
    /// Mapping for Rocket.Chat rooms/groups
    /// T-17, T-18: Group and Channel mapping
    /// Database First: chat.RoomMapping
    /// </summary>
    public partial class RoomMapping
    {
        public RoomMapping()
        {
            OnCreated();
        }

        /// <summary>
        /// Primary key
        /// </summary>
        public virtual int Id { get; set; }

        /// <summary>
        /// Unique business code for the group (e.g., DEPT-PROJ-001)
        /// </summary>
        public virtual string GroupCode { get; set; }

        /// <summary>
        /// Rocket.Chat room ID
        /// </summary>
        public virtual string RocketRoomId { get; set; }

        /// <summary>
        /// Room name in Rocket.Chat
        /// </summary>
        public virtual string RoomName { get; set; }

        /// <summary>
        /// Room type: 'group' (private) or 'channel' (public)
        /// </summary>
        public virtual string RoomType { get; set; }

        /// <summary>
        /// Department ID (optional)
        /// </summary>
        public virtual int? DepartmentId { get; set; }

        /// <summary>
        /// Project ID (optional)
        /// </summary>
        public virtual int? ProjectId { get; set; }

        /// <summary>
        /// Room description
        /// </summary>
        public virtual string Description { get; set; }

        /// <summary>
        /// Is read-only room
        /// </summary>
        public virtual bool IsReadOnly { get; set; }

        /// <summary>
        /// Is announcement room
        /// </summary>
        public virtual bool IsAnnouncement { get; set; }

        /// <summary>
        /// Is archived
        /// </summary>
        public virtual bool IsArchived { get; set; }

        /// <summary>
        /// Is deleted
        /// </summary>
        public virtual bool IsDeleted { get; set; }

        /// <summary>
        /// Created date
        /// </summary>
        public virtual DateTime CreatedAt { get; set; }

        /// <summary>
        /// Created by user ID
        /// </summary>
        public virtual int? CreatedBy { get; set; }

        /// <summary>
        /// Last updated date
        /// </summary>
        public virtual DateTime? UpdatedAt { get; set; }

        /// <summary>
        /// Updated by user ID
        /// </summary>
        public virtual int? UpdatedBy { get; set; }

        /// <summary>
        /// Custom fields (JSON)
        /// </summary>
        public virtual string CustomFields { get; set; }

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
