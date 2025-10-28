using System;

namespace SourceAPI.Core.Data.RocketChatData
{
    /// <summary>
    /// Mapping between internal users and Rocket.Chat users
    /// T-06, T-07: User mapping entity
    /// Database First: chat.UserRocketChatMapping
    /// </summary>
    public partial class UserRocketChatMapping
    {
        public UserRocketChatMapping()
        {
            OnCreated();
        }

        /// <summary>
        /// Primary key
        /// </summary>
        public virtual int Id { get; set; }

        /// <summary>
        /// Internal system user ID
        /// </summary>
        public virtual int UserId { get; set; }

        /// <summary>
        /// Rocket.Chat user ID (_id)
        /// </summary>
        public virtual string RocketUserId { get; set; }

        /// <summary>
        /// Rocket.Chat username
        /// </summary>
        public virtual string RocketUsername { get; set; }

        /// <summary>
        /// User email
        /// </summary>
        public virtual string Email { get; set; }

        /// <summary>
        /// Full name
        /// </summary>
        public virtual string FullName { get; set; }

        /// <summary>
        /// Is the mapping active
        /// </summary>
        public virtual bool IsActive { get; set; }

        /// <summary>
        /// When this mapping was created
        /// </summary>
        public virtual DateTime CreatedAt { get; set; }

        /// <summary>
        /// Last time synced with Rocket.Chat
        /// </summary>
        public virtual DateTime? LastSyncAt { get; set; }

        /// <summary>
        /// Additional metadata (JSON)
        /// </summary>
        public virtual string Metadata { get; set; }

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

