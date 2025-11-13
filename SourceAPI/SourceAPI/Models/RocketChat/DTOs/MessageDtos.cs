using Newtonsoft.Json;
using System.Collections.Generic;

namespace SourceAPI.Models.RocketChat.DTOs;

public class PostMessageRequest
{
    [JsonProperty("roomId")]
    public string RoomId { get; set; } = string.Empty;

    [JsonProperty("text")]
    public string Text { get; set; } = string.Empty;
    
    [JsonProperty("tmid")]
    public string? Tmid { get; set; } // Thread message ID - for replying in threads
}

public class PostMessageResponse : ApiResponse
{
    [JsonProperty("message")]
    public MessageData Message { get; set; } = new();
}

public class DeleteMessageRequest
{
    public string RoomId { get; set; } = string.Empty;
    public string MsgId { get; set; } = string.Empty;
}

public class PinMessageRequest
{
    [JsonProperty("messageId")]
    public string MessageId { get; set; } = string.Empty;
}

public class UnpinMessageRequest
{
    [JsonProperty("messageId")]
    public string MessageId { get; set; } = string.Empty;
}

public class MessageResponse : ApiResponse
{
    public MessageData Message { get; set; } = new();
}

public class MessageData
{
    [JsonProperty("_id")]
    public string Id { get; set; } = string.Empty;
    
    [JsonProperty("rid")]
    public string Rid { get; set; } = string.Empty;
    
    [JsonProperty("msg")]
    public string Msg { get; set; } = string.Empty;
    
    [JsonProperty("u")]
    public RoomMessageUser? U { get; set; }
    
    [JsonProperty("ts")]
    public System.DateTime? Ts { get; set; }
    
    [JsonProperty("_updatedAt")]
    public System.DateTime? UpdatedAt { get; set; }
}

public class RoomMessagesResponse : ApiResponse
{
    [JsonProperty("messages")]
    public List<RoomMessage> Messages { get; set; } = new();
    
    [JsonProperty("count")]
    public int Count { get; set; }
    
    [JsonProperty("offset")]
    public int Offset { get; set; }
    
    [JsonProperty("total")]
    public int Total { get; set; }
}

public class RoomMessage
{
    [JsonProperty("_id")]
    public string Id { get; set; } = string.Empty;
    
    [JsonProperty("rid")]
    public string Rid { get; set; } = string.Empty; // Room ID
    
    [JsonProperty("msg")]
    public string Msg { get; set; } = string.Empty; // Message text
    
    [JsonProperty("ts")]
    public System.DateTime Ts { get; set; } // Timestamp
    
    [JsonProperty("u")]
    public RoomMessageUser U { get; set; } = new(); // User info
    
    [JsonProperty("t")]
    public string? T { get; set; } // Message type: null=normal, "au"=added user, "ru"=removed user, "uj"=joined, "ul"=left
    
    [JsonProperty("isCurrentUser")]
    public bool IsCurrentUser { get; set; } = false;
    
    // File attachment fields
    [JsonProperty("file")]
    public UploadedFile? File { get; set; }
    
    [JsonProperty("attachments")]
    public List<FileAttachmentDetail>? Attachments { get; set; }
    
    // Thread support
    [JsonProperty("tmid")]
    public string? Tmid { get; set; } // Thread message ID (if this is a reply in a thread)
    
    [JsonProperty("tcount")]
    public int? Tcount { get; set; } // Thread reply count (if this is a thread parent)
    
    [JsonProperty("tlm")]
    public System.DateTime? Tlm { get; set; } // Thread last message timestamp
    
    [JsonProperty("replies")]
    public List<string>? Replies { get; set; } // Array of user IDs who replied in thread
}

public class RoomMessageUser
{
    [JsonProperty("_id")]
    public string Id { get; set; } = string.Empty;
    
    [JsonProperty("username")]
    public string Username { get; set; } = string.Empty;
    
    [JsonProperty("name")]
    public string Name { get; set; } = string.Empty;
}

// File Upload Response
public class UploadFileResponse : ApiResponse
{
    [JsonProperty("message")]
    public UploadedFileData? Message { get; set; }
}

public class UploadedFileData
{
    [JsonProperty("_id")]
    public string Id { get; set; } = string.Empty;
    
    [JsonProperty("rid")]
    public string Rid { get; set; } = string.Empty;
    
    [JsonProperty("msg")]
    public string? Msg { get; set; }
    
    [JsonProperty("ts")]
    public System.DateTime? Ts { get; set; }
    
    [JsonProperty("file")]
    public UploadedFile? File { get; set; }
    
    [JsonProperty("files")]
    public List<UploadedFile>? Files { get; set; }
    
    [JsonProperty("attachments")]
    public List<FileAttachmentDetail>? Attachments { get; set; }
    
    [JsonProperty("u")]
    public RoomMessageUser? U { get; set; }
    
    [JsonProperty("_updatedAt")]
    public System.DateTime? UpdatedAt { get; set; }
    
    [JsonProperty("urls")]
    public List<string>? Urls { get; set; }
}

// File info in upload response
public class UploadedFile
{
    [JsonProperty("_id")]
    public string Id { get; set; } = string.Empty;
    
    [JsonProperty("name")]
    public string Name { get; set; } = string.Empty;
    
    [JsonProperty("type")]
    public string Type { get; set; } = string.Empty;
    
    [JsonProperty("size")]
    public long Size { get; set; }
    
    [JsonProperty("format")]
    public string? Format { get; set; }
    
    [JsonProperty("url")]
    public string? Url { get; set; }
}

// Attachment detail in upload response
public class FileAttachmentDetail
{
    [JsonProperty("title")]
    public string? Title { get; set; }
    
    [JsonProperty("title_link")]
    public string? TitleLink { get; set; }
    
    [JsonProperty("title_link_download")]
    public bool TitleLinkDownload { get; set; }
    
    [JsonProperty("image_dimensions")]
    public ImageDimensions? ImageDimensions { get; set; }
    
    [JsonProperty("image_preview")]
    public string? ImagePreview { get; set; }
    
    [JsonProperty("image_url")]
    public string? ImageUrl { get; set; }
    
    [JsonProperty("image_type")]
    public string? ImageType { get; set; }
    
    [JsonProperty("image_size")]
    public long? ImageSize { get; set; }
    
    [JsonProperty("type")]
    public string? Type { get; set; }
}

public class ImageDimensions
{
    [JsonProperty("width")]
    public int Width { get; set; }
    
    [JsonProperty("height")]
    public int Height { get; set; }
}

// Legacy FileAttachment for backward compatibility
public class FileAttachment
{
    [JsonProperty("_id")]
    public string Id { get; set; } = string.Empty;
    
    [JsonProperty("name")]
    public string Name { get; set; } = string.Empty;
    
    [JsonProperty("type")]
    public string Type { get; set; } = string.Empty;
    
    [JsonProperty("size")]
    public long Size { get; set; }
    
    [JsonProperty("url")]
    public string? Url { get; set; }
    
    [JsonProperty("title")]
    public string? Title { get; set; }
    
    [JsonProperty("description")]
    public string? Description { get; set; }
}

