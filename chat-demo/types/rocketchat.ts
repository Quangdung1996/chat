/**
 * RocketChat Types & Interfaces
 * Định nghĩa các types cho tích hợp Rocket.Chat
 */

// ===== USER TYPES =====
export interface RocketChatUser {
  userId: number;
  rocketUserId: string;
  username: string;
  email: string;
  fullName: string;
  department?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface SyncUserRequest {
  userId: number;
  email: string;
  fullName: string;
  department?: string;
}

export interface SyncUserResponse {
  userId: number;
  rocketUserId: string;
  username: string;
  success: boolean;
  message?: string;
}

// ===== ROOM/GROUP TYPES =====
export interface RoomMetadata {
  departmentId?: number;
  projectId?: number;
  description?: string;
  customFields?: Record<string, any>;
}

export interface CreateGroupRequest {
  groupCode: string;
  name: string;
  departmentId?: number;
  projectId?: number;
  isPrivate: boolean;
  readOnly?: boolean;
  metadata?: RoomMetadata;
}

export interface CreateGroupResponse {
  roomId: string;
  groupCode: string;
  name: string;
  success: boolean;
  message?: string;
}

export interface Room {
  roomId: string;
  groupCode: string;
  name: string;
  isPrivate: boolean;
  readOnly: boolean;
  departmentId?: number;
  projectId?: number;
  memberCount: number;
  createdAt: string;
  archived?: boolean;
}

// ===== MEMBER TYPES =====
export interface RoomMember {
  userId: number;
  rocketUserId: string;
  username: string;
  fullName: string;
  role: 'owner' | 'moderator' | 'member';
  joinedAt: string;
}

export interface AddMembersRequest {
  roomId: string;
  userIds: number[];
}

export interface AddMembersResponse {
  success: boolean;
  added: number;
  failed: Array<{
    userId: number;
    reason: string;
  }>;
}

export interface UpdateMemberRoleRequest {
  roomId: string;
  userId: number;
  role: 'owner' | 'moderator' | 'member';
}

// ===== MESSAGE TYPES =====
export interface SendMessageRequest {
  roomId?: string;
  groupCode?: string;
  text: string;
  attachments?: any[];
}

export interface SendMessageResponse {
  messageId: string;
  roomId: string;
  timestamp: string;
  success: boolean;
}

export interface ChatMessage {
  messageId: string;
  roomId: string;
  userId: number;
  username: string;
  text: string;
  timestamp: string;
  edited?: boolean;
  deleted?: boolean;
}

// ===== WEBHOOK TYPES =====
export interface WebhookEvent {
  eventType: 'message' | 'join' | 'leave' | 'room_created' | 'room_deleted';
  roomId: string;
  userId?: string;
  timestamp: string;
  data: any;
}

// ===== ROOM MANAGEMENT =====
export interface RenameRoomRequest {
  roomId: string;
  newName: string;
}

export interface ArchiveRoomRequest {
  roomId: string;
  archive: boolean; // true = archive, false = unarchive
}

export interface DeleteRoomRequest {
  roomId: string;
  confirmation: string; // Phải gõ tên room để confirm
}

// ===== FILTER & PAGINATION =====
export interface RoomFilter {
  departmentId?: number;
  projectId?: number;
  ownerId?: number;
  search?: string;
  isArchived?: boolean;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ===== USER INFO =====
export interface UserInfo {
  userId: number;
  fullName: string;
  email: string;
  department?: string;
  position?: string;
  avatar?: string;
}

// ===== API RESPONSE =====
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

