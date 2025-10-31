/**
 * RocketChat Types & Interfaces
 * Định nghĩa các types cho tích hợp Rocket.Chat
 * Updated to match backend responses
 */

// ===== USER TYPES =====
export interface RocketChatUser {
  userId: number;
  rocketUserId: string;
  username: string;
  email: string;
  fullName: string;
  isActive: boolean;
  createdAt: string;
  lastSyncAt?: string;
}

export interface SyncUserRequest {
  userId: number;
  email: string;
  fullName: string;
}

export interface SyncUserResponse {
  userId: number;
  rocketUserId: string;
  username: string;
  isNewUser: boolean;
  message: string;
}

export interface UserInfo {
  userId: number;
  rocketUserId: string;
  username: string;
  email: string;
  fullName: string;
  isActive: boolean;
  lastSyncAt?: string;
}

// ===== ROOM/GROUP TYPES =====
export interface CreateGroupRequest {
  groupCode: string;
  name?: string;
  isPrivate: boolean;
  departmentId?: number;
  projectId?: number;
  description?: string;
  isReadOnly?: boolean;
  members?: string[]; // Array of Rocket.Chat user IDs
  createdBy?: number;
}

export interface CreateGroupResponse {
  roomId: string;
  groupCode: string;
  name: string;
  success: boolean;
  message: string;
}

export interface Room {
  id: number;
  groupCode: string;
  rocketRoomId: string;
  roomName: string;
  roomType: string;
  departmentId?: number;
  projectId?: number;
  description?: string;
  isReadOnly: boolean;
  isAnnouncement?: boolean;
  isArchived: boolean;
  createdAt: string;
  createdBy?: number;
}

export interface RoomFilter {
  departmentId?: number;
  projectId?: number;
  roomType?: string;
}

// User's Room Subscription (from Rocket.Chat real-time)
export interface UserSubscription {
  id: string;
  roomId: string;
  name: string;
  fullName: string;
  roomName?: string; // Room's display name
  type: string; // "d" = DM, "p" = private group, "c" = public channel
  user: {
    id: string;
    username: string;
    name: string;
  };
  unreadCount: number;
  alert: boolean;
  open: boolean;
  isReadOnly?: boolean; // Whether the room is read-only
  isArchived?: boolean; // Whether the room is archived
}

export interface GetUserRoomsResponse {
  success: boolean;
  userId: number;
  count: number;
  rooms: UserSubscription[];
}

// ===== MEMBER TYPES =====
export interface RoomMember {
  _id: string;          // Rocket.Chat user ID (from API response)
  username: string;     // Username
  name: string;         // Display name / full name
  status?: string;      // "online", "away", "busy", "offline"
  roles?: string[];     // ["owner", "moderator"] - member role in the room
}

export interface AddMembersRequest {
  roomId: string;
  rocketUserIds: string[];
  roomType?: string;
}

export interface AddMembersResponse {
  success: boolean;
  totalProcessed: number;
  successCount: number;
  failCount: number;
  details: Record<string, boolean>;
}

export interface UpdateMemberRoleRequest {
  roomId: string;
  rocketUserId: string;
  role: 'owner' | 'moderator' | 'member';
  roomType?: string;
}

// ===== MESSAGE TYPES =====
export interface SendMessageRequest {
  roomId: string;
  text: string;
  alias?: string;
}

export interface SendMessageResponse {
  success: boolean;
  messageId: string;
}

export interface ChatMessage {
  messageId: string;
  roomId?: string;
  username?: string;
  text: string;
  timestamp?: string;
  createdAt?: string;
  updatedAt?: string;
  deleted?: boolean;
  edited?: boolean;
  isCurrentUser?: boolean;
  user?: {
    id: string;
    username: string;
    name?: string;
  };
}

// Backend message format (from DB)
export interface StoredMessage {
  id: number;
  rocketMessageId: string;
  rocketUserId: string;
  userId?: number;
  messageText: string;
  messageType: string;
  isDeleted: boolean;
  createdAt: string;
}

// ===== ROOM MANAGEMENT =====
export interface RenameRoomRequest {
  newName: string;
  roomType?: string;
}

export interface ArchiveRoomRequest {
  roomId: string;
  roomType?: string;
}

export interface DeleteRoomRequest {
  roomId: string;
  roomType?: string;
  confirm: boolean;
}

export interface SetAnnouncementModeRequest {
  announcementOnly: boolean;
  roomType?: string;
}

export interface SetTopicRequest {
  topic: string;
  roomType?: string;
}

export interface RoomInfo {
  _id: string;
  name: string;
  fname: string;
  type: string;
  readOnly: boolean;
  usersCount: number;
  messageCount: number;
  u?: {
    _id: string;      // Owner's Rocket.Chat user ID
    username: string; // Owner's username
    name: string;     // Owner's display name
  };
}

export interface GetRoomInfoResponse {
  success: boolean;
  roomId: string;
  room: RoomInfo;
}

// ===== PAGINATION =====
export interface PaginationParams {
  pageSize?: number;
  pageNumber?: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  pageNumber: number;
  pageSize: number;
  data: T[];
}

// ===== WEBHOOK TYPES =====
export interface WebhookEvent {
  event: string;
  messageId?: string;
  roomId?: string;
  userId?: string;
  username?: string;
  text?: string;
  roomName?: string;
  timestamp?: string;
}
