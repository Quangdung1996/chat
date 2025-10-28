using System;

namespace SourceAPI.Core.Data.RocketChatData
{
    /// <summary>
    /// Log of chat messages from Rocket.Chat
    /// T-35: Message logging
    /// Database First: chat.ChatMessageLog
    /// </summary>
    public partial class ChatMessageLog
    {
        public ChatMessageLog()
        {
            OnCreated();
        }

        /// <summary>
        /// Primary key
        /// </summary>
        public virtual long Id { get; set; }

        /// <summary>
        /// Rocket.Chat message ID
        /// </summary>
        public virtual string RocketMessageId { get; set; }

        /// <summary>
        /// Rocket.Chat room ID
        /// </summary>
        public virtual string RocketRoomId { get; set; }

        /// <summary>
        /// Rocket.Chat user ID (sender)
        /// </summary>
        public virtual string RocketUserId { get; set; }

        /// <summary>
        /// Internal user ID (if mapped)
        /// </summary>
        public virtual int? UserId { get; set; }

        /// <summary>
        /// Internal room mapping ID (if mapped)
        /// </summary>
        public virtual int? RoomMappingId { get; set; }

        /// <summary>
        /// Message text
        /// </summary>
        public virtual string MessageText { get; set; }

        /// <summary>
        /// Message type (text, file, etc.)
        /// </summary>
        public virtual string MessageType { get; set; }

        /// <summary>
        /// Is message deleted
        /// </summary>
        public virtual bool IsDeleted { get; set; }

        /// <summary>
        /// Was message auto-deleted by policy
        /// </summary>
        public virtual bool IsAutoDeleted { get; set; }

        /// <summary>
        /// Deletion reason
        /// </summary>
        public virtual string DeletionReason { get; set; }

        /// <summary>
        /// When was message deleted
        /// </summary>
        public virtual DateTime? DeletedAt { get; set; }

        /// <summary>
        /// Who deleted the message
        /// </summary>
        public virtual string DeletedBy { get; set; }

        /// <summary>
        /// Message created timestamp
        /// </summary>
        public virtual DateTime CreatedAt { get; set; }

        /// <summary>
        /// Message updated timestamp
        /// </summary>
        public virtual DateTime? UpdatedAt { get; set; }

        /// <summary>
        /// Additional metadata (JSON)
        /// </summary>
        public virtual string Metadata { get; set; }

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

