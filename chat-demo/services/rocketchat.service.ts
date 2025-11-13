/**
 * RocketChat Service
 * Service tương tác với Rocket.Chat API backend
 * Updated to match backend controller endpoints
 */

import axios from 'axios';
import { apiClient } from '@/lib/api-client';
import { API_CONFIG } from '@/config/api.config';
import { parseTimestamp } from '@/utils/dateUtils';
import type {
  CreateGroupRequest,
  CreateGroupResponse,
  AddMembersRequest,
  AddMembersResponse,
  UpdateMemberRoleRequest,
  SendMessageRequest,
  SendMessageResponse,
  RenameRoomRequest,
  ArchiveRoomRequest,
  DeleteRoomRequest,
  Room,
  RoomMember,
  ChatMessage,
  UserInfo,
  UserSubscription,
  GetUserRoomsResponse,
  GetRoomInfoResponse,
  RoomFilter,
  PaginationParams,
  PaginatedResponse,
} from '@/types/rocketchat';

class RocketChatService {
  private readonly endpoints = API_CONFIG.endpoints.rocketChat;

  // ===== AUTHENTICATION =====
  
  /**
   * Lấy Rocket.Chat login token từ backend (requires OAuth token)
   * POST /api/integrations/rocket/get-login-token
   */
  async getLoginToken(userId: number): Promise<{
    success: boolean;
    authToken: string;
    userId: string;
    expiresAt: string;
  }> {
    return apiClient.post(this.endpoints.getLoginToken, { userId });
  }

  /**
   * Lấy Rocket.Chat login token cho userId cụ thể (Anonymous - for testing)
   * POST /api/integrations/rocket/get-login-token/{userId}
   * No authentication required - uses axios directly without auth interceptor
   */
  async getLoginTokenByUserId(userId: number): Promise<{
    success: boolean;
    authToken: string;
    userId: string;
    rocketUserId: string;
    expiresAt: string;
  }> {
    const endpoint = `${API_CONFIG.baseURL}/api/integrations/rocket/get-login-token/${userId}`;
    const response = await axios.post(endpoint);
    return response.data;
  }

  // ===== USER MANAGEMENT =====
  
  /**
   * Lấy thông tin user
   * GET /api/integrations/rocket/user/{userId}/info
   */
  async getUserInfo(userId: number): Promise<UserInfo> {
    const endpoint = this.endpoints.getUserInfo.replace('{userId}', userId.toString());
    return apiClient.get(endpoint);
  }

  /**
   * Lấy danh sách users từ Rocket.Chat
   * GET /api/integrations/rocket/users?count=100&offset=0
   */
  async getUsers(count: number = 100, offset: number = 0): Promise<{ success: boolean; users: any[] }> {
    return apiClient.get(this.endpoints.getUsers, {
      params: { count, offset }
    });
  }

  /**
   * Lấy tất cả rooms của user (real-time từ Rocket.Chat)
   * Bao gồm: DMs, Groups, Channels
   * GET /api/integrations/rocket/rooms
   * Uses Rocket.Chat token from header (automatically added by apiClient)
   */
  async getUserRooms(userId: number): Promise<GetUserRoomsResponse> {
    const endpoint = this.endpoints.getUserRooms;
    const response = await apiClient.get<{
      success: boolean;
      rocketUserId: string;
      count: number;
      rooms: any[];
    }>(endpoint);

    // Transform backend response to match frontend interface
    if (response.success && response.rooms) {
      const transformedRooms: UserSubscription[] = response.rooms.map((room: any) => {
        // Parse lastMessageTime from backend (_updatedAt or ls)
        let lastMessageTime = new Date();
        if (room._updatedAt) {
          lastMessageTime = new Date(room._updatedAt);
        } else if (room.ls) {
          lastMessageTime = new Date(room.ls);
        }

        // ✨ Extract thread notifications from subscription data
        // Rocket.Chat returns 'tunread' as array of thread IDs (strings): ["threadId1", "threadId2", ...]
        // Backend may map it to 'threadUnread' field
        const threadNotifications: Array<{ threadId: string; count: number }> = [];
        
        // 🐛 DEBUG: Log room data to see what fields are available
        if (room.tunread || room.threadUnread) {
          console.log('🧵 [Service] Found tunread in room data:', {
            roomId: room.rid,
            roomName: room.name || room.fname,
            tunread: room.tunread,
            threadUnread: room.threadUnread,
            allKeys: Object.keys(room),
          });
        }
        
        // Try both field names (tunread from Rocket.Chat, threadUnread from backend mapping)
        const tunreadData = room.tunread || room.threadUnread;
        if (tunreadData && Array.isArray(tunreadData)) {
          tunreadData.forEach((item: any) => {
            // Handle both formats:
            // 1. Array of strings: ["threadId1", "threadId2"] (from Rocket.Chat)
            // 2. Array of objects: [{ threadId, unread }] (if backend transforms it)
            if (typeof item === 'string') {
              // Direct thread ID string
              threadNotifications.push({
                threadId: item,
                count: 1, // Default to 1, actual count may need to be queried separately
              });
            } else if (item && typeof item === 'object') {
              // Object format: { _id, unread } or { threadId, unread }
              const threadId = item._id || item.threadId;
              const count = item.unread || 1;
              if (threadId) {
                threadNotifications.push({
                  threadId,
                  count,
                });
              }
            }
          });
        }

        return {
          id: room._id,                    // subscription ID
          roomId: room.rid,                // actual room ID (for API calls)
          name: room.name,
          fullName: room.fname || room.name, // fallback to name if fname is empty
          type: room.t,                    // 'd', 'p', 'c'
          user: {
            id: room.u._id,
            username: room.u.username,
            name: room.u.name,
          },
          unreadCount: room.unread || 0,
          alert: room.alert || false,
          open: room.open || false,
          lastMessageTime, // Use parsed timestamp from backend
          // ✨ Thread notifications from subscription
          threadNotifications, // Array of { threadId, count }
        };
      });

      return {
        success: response.success,
        userId: userId,  // Keep using the input userId for compatibility
        count: response.count,
        rooms: transformedRooms,
      };
    }

    return {
      success: response.success || false,
      userId: userId,
      count: 0,
      rooms: [],
    };
  }

  // ===== ROOM MANAGEMENT =====
  
  /**
   * Tạo group/channel
   * POST /api/integrations/rocket/create-group
   */
  async createGroup(request: CreateGroupRequest): Promise<CreateGroupResponse> {
    return apiClient.post(this.endpoints.createGroup, request);
  }

  /**
   * Tạo direct message room (1-on-1 chat)
   * POST /api/integrations/rocket/dm/create?currentUserId=1&targetUsername=john.doe
   */
  async createDirectMessage(currentUserId: number, targetUsername: string): Promise<{ success: boolean; roomId: string; targetUsername: string }> {
    return apiClient.post(this.endpoints.createDirectMessage, null, {
      params: { currentUserId, targetUsername }
    });
  }

  /**
   * Lấy danh sách rooms với filter và pagination
   * GET /api/integrations/rocket/groups?departmentId=1&pageSize=50&pageNumber=1
   */
  async getRooms(
    filter?: RoomFilter,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<Room>> {
    return apiClient.get(this.endpoints.listGroups, {
      params: {
        departmentId: filter?.departmentId,
        projectId: filter?.projectId,
        roomType: filter?.roomType,
        pageSize: pagination?.pageSize || 50,
        pageNumber: pagination?.pageNumber || 1,
      },
    });
  }

  /**
   * Đổi tên room
   * PUT /api/integrations/rocket/room/{roomId}/rename
   */
  async renameRoom(roomId: string, newName: string, roomType: string = 'group'): Promise<{ success: boolean }> {
    const endpoint = this.endpoints.renameRoom.replace('{roomId}', roomId);
    return apiClient.put(endpoint, { newName, roomType });
  }

  /**
   * Archive room
   * POST /api/integrations/rocket/room/{roomId}/archive?roomType=group
   */
  async archiveRoom(roomId: string, roomType: string = 'group'): Promise<{ success: boolean }> {
    const endpoint = this.endpoints.archiveRoom.replace('{roomId}', roomId);
    return apiClient.post(`${endpoint}?roomType=${roomType}`);
  }

  /**
   * Delete room (cần confirm)
   * DELETE /api/integrations/rocket/room/{roomId}?roomType=group&confirm=true
   */
  async deleteRoom(roomId: string, roomType: string = 'group'): Promise<{ success: boolean }> {
    const endpoint = this.endpoints.deleteRoom.replace('{roomId}', roomId);
    return apiClient.delete(`${endpoint}?roomType=${roomType}&confirm=true`);
  }

  /**
   * Set announcement mode (read-only for non-moderators)
   * POST /api/integrations/rocket/room/{roomId}/announcement-mode
   */
  async setAnnouncementMode(roomId: string, announcementOnly: boolean, roomType: string = 'group'): Promise<{ success: boolean }> {
    const endpoint = this.endpoints.setAnnouncementMode.replace('{roomId}', roomId);
    return apiClient.post(endpoint, { announcementOnly, roomType });
  }

  /**
   * Set topic cho room
   * PUT /api/integrations/rocket/room/{roomId}/topic
   */
  async setRoomTopic(roomId: string, topic: string, roomType: string = 'group'): Promise<{ success: boolean }> {
    const endpoint = this.endpoints.setTopic.replace('{roomId}', roomId);
    return apiClient.put(endpoint, { topic, roomType });
  }

  /**
   * Set announcement cho room
   * PUT /api/integrations/rocket/room/{roomId}/announcement
   */
  async setRoomAnnouncement(roomId: string, announcement: string, roomType: string = 'group'): Promise<{ success: boolean }> {
    const endpoint = this.endpoints.setAnnouncement.replace('{roomId}', roomId);
    return apiClient.put(endpoint, { announcement, roomType });
  }

  /**
   * Pin message
   * POST /api/integrations/rocket/message/{messageId}/pin
   */
  async pinMessage(messageId: string): Promise<{ success: boolean }> {
    const endpoint = this.endpoints.pinMessage.replace('{messageId}', messageId);
    return apiClient.post(endpoint);
  }

  /**
   * Unpin message
   * POST /api/integrations/rocket/message/{messageId}/unpin
   */
  async unpinMessage(messageId: string): Promise<{ success: boolean }> {
    const endpoint = this.endpoints.unpinMessage.replace('{messageId}', messageId);
    return apiClient.post(endpoint);
  }

  // ===== MEMBER MANAGEMENT =====
  
  /**
   * Thêm 1 member vào room
   * POST /api/integrations/rocket/room/{roomId}/add-member
   */
  async addMember(roomId: string, rocketUserId: string, roomType: string = 'group'): Promise<{ success: boolean }> {
    const endpoint = this.endpoints.addMember.replace('{roomId}', roomId);
    return apiClient.post(endpoint, { rocketUserId, roomType });
  }

  /**
   * Thêm nhiều members vào room (bulk)
   * POST /api/integrations/rocket/room/{roomId}/add-members
   */
  async addMembers(roomId: string, rocketUserIds: string[], roomType: string = 'group'): Promise<AddMembersResponse> {
    const endpoint = this.endpoints.addMembers.replace('{roomId}', roomId);
    return apiClient.post(endpoint, { rocketUserIds, roomType });
  }

  /**
   * Xóa member khỏi room
   * DELETE /api/integrations/rocket/room/{roomId}/member/{rocketUserId}?roomType=group
   */
  async removeMember(roomId: string, rocketUserId: string, roomType: string = 'group'): Promise<{ success: boolean }> {
    const endpoint = this.endpoints.removeMember
      .replace('{roomId}', roomId)
      .replace('{rocketUserId}', rocketUserId);
    return apiClient.delete(`${endpoint}?roomType=${roomType}`);
  }

  /**
   * Thêm moderator role
   * POST /api/integrations/rocket/room/{roomId}/moderator/{rocketUserId}?roomType=group
   */
  async addModerator(roomId: string, rocketUserId: string, roomType: string = 'group'): Promise<{ success: boolean }> {
    const endpoint = this.endpoints.addModerator
      .replace('{roomId}', roomId)
      .replace('{rocketUserId}', rocketUserId);
    return apiClient.post(`${endpoint}?roomType=${roomType}`);
  }

  /**
   * Xóa moderator role
   * DELETE /api/integrations/rocket/room/{roomId}/moderator/{rocketUserId}?roomType=group
   */
  async removeModerator(roomId: string, rocketUserId: string, roomType: string = 'group'): Promise<{ success: boolean }> {
    const endpoint = this.endpoints.removeModerator
      .replace('{roomId}', roomId)
      .replace('{rocketUserId}', rocketUserId);
    return apiClient.delete(`${endpoint}?roomType=${roomType}`);
  }

  /**
   * Thêm owner role
   * POST /api/integrations/rocket/room/{roomId}/owner/{rocketUserId}?roomType=group
   */
  async addOwner(roomId: string, rocketUserId: string, roomType: string = 'group'): Promise<{ success: boolean }> {
    const endpoint = this.endpoints.addOwner
      .replace('{roomId}', roomId)
      .replace('{rocketUserId}', rocketUserId);
    return apiClient.post(`${endpoint}?roomType=${roomType}`);
  }

  /**
   * Xóa owner role
   * DELETE /api/integrations/rocket/room/{roomId}/owner/{rocketUserId}?roomType=group
   */
  async removeOwner(roomId: string, rocketUserId: string, roomType: string = 'group'): Promise<{ success: boolean }> {
    const endpoint = this.endpoints.removeOwner
      .replace('{roomId}', roomId)
      .replace('{rocketUserId}', rocketUserId);
    return apiClient.delete(`${endpoint}?roomType=${roomType}`);
  }

  /**
   * Lấy danh sách members của room từ Rocket.Chat
   * GET /api/integrations/rocket/rooms/{roomId}/members?roomType=group
   * User must be a member of the room to access this
   */
  async getRoomMembers(roomId: string, roomType: 'group' | 'channel' | 'direct' = 'group'): Promise<{ 
    success: boolean; 
    roomId: string; 
    count: number;
    total: number;
    members: RoomMember[] 
  }> {
    const endpoint = this.endpoints.getRoomMembers.replace('{roomId}', roomId);
    return apiClient.get(`${endpoint}?roomType=${roomType}`);
  }

  /**
   * Lấy thông tin chi tiết của room
   * GET /api/integrations/rocket/room/{roomId}/info?roomType={type}
   */
  async getRoomInfo(roomId: string, roomType: 'group' | 'channel' | 'direct' = 'group'): Promise<GetRoomInfoResponse> {
    const endpoint = `/api/integrations/rocket/room/${roomId}/info`;
    return apiClient.get(`${endpoint}?roomType=${roomType}`);
  }

  /**
   * Quản lý member (invite/kick/addModerator) - uses existing removeMember API
   * POST /api/integrations/rocket/room/{roomId}/member/{rocketUserId}/manage
   */
  async manageMember(roomId: string, userId: string, action: 'invite' | 'kick' | 'addModerator', roomType: string = 'group'): Promise<{ success: boolean }> {
    if (action === 'kick') {
      return this.removeMember(roomId, userId, roomType);
    } else if (action === 'addModerator') {
      return this.addModerator(roomId, userId, roomType);
    } else {
      return this.addMember(roomId, userId, roomType);
    }
  }

  /**
   * Rời khỏi room
   * POST /api/integrations/rocket/room/{roomId}/leave?roomType=group
   */
  async leaveRoom(roomId: string, roomType: string = 'group'): Promise<{ success: boolean }> {
    const endpoint = `/api/integrations/rocket/room/${roomId}/leave`;
    return apiClient.post(`${endpoint}?roomType=${roomType}`);
  }

  // ===== MESSAGING =====
  
  /**
   * Gửi tin nhắn vào room
   * POST /api/integrations/rocket/send
   */
  async sendMessage(request: SendMessageRequest): Promise<SendMessageResponse> {
    return apiClient.post(this.endpoints.sendMessage, request);
  }

  /**
   * Lấy lịch sử tin nhắn (real-time từ Rocket.Chat)
   * GET /api/integrations/rocket/room/{rocketRoomId}/messages?roomType={type}&count=50&offset=0
   */
  async getMessages(
    rocketRoomId: string,
    roomType: string = 'p', // 'd' for DM, 'p' for group, 'c' for channel
    count: number = 50,
    offset: number = 0,
    currentUsername?: string
  ): Promise<{ success: boolean; messages: any[]; count: number; offset: number; total: number }> {
    const endpoint = this.endpoints.getMessages.replace('{rocketRoomId}', rocketRoomId);
    const response = await apiClient.get<{ 
      success: boolean; 
      messages: any[];
      rocketRoomId?: string;
      roomType?: string;
      count: number;
      offset: number;
      total: number;
    }>(endpoint, {
      params: {
        roomType,  // Backend param: roomType (giá trị: 'd', 'p', 'c')
        count,
        offset,
      },
    });

    // Transform backend response to match frontend expected format
    if (response.success && response.messages) {
      const transformedMessages = response.messages.map((msg: any) => {
        const username = msg.u?.username || msg.username || 'Unknown';
        return {
          messageId: msg._id || msg.id,
          roomId: msg.rid,
          username,
          text: msg.msg || msg.text || '',
          timestamp: parseTimestamp(msg.ts || msg.timestamp),
          deleted: msg.deleted || false,
          edited: msg.editedAt ? true : false,
          type: msg.t || null, // ✨ Message type: null=normal, "au"=added user, "ru"=removed, etc.
          // ✅ Include user object with name for display
          user: {
            id: msg.u?._id || msg.u?.id,
            username: msg.u?.username || msg.username,
            name: msg.u?.name || msg.u?.username || username,
          },
          // ✨ Backend đã trả về isCurrentUser rồi, dùng luôn (fallback to compare nếu không có)
          isCurrentUser: msg.isCurrentUser,
          // ✨ File attachment info
          file: msg.file ? {
            _id: msg.file._id,
            name: msg.file.name,
            type: msg.file.type,
            size: msg.file.size,
            url: msg.file.url,
          } : undefined,
          attachments: msg.attachments,
          // ✨ Thread info
          tmid: msg.tmid,
          tcount: msg.tcount,
          tlm: msg.tlm,
          replies: msg.replies,
        };
      });

      return {
        success: response.success,
        messages: transformedMessages,
        count: response.count,
        offset: response.offset,
        total: response.total,
      };
    }

    return {
      success: response.success || false,
      messages: [],
      count: 0,
      offset: 0,
      total: 0,
    };
  }

  /**
   * Upload file vào room
   * POST /api/integrations/rocket/room/{roomId}/upload
   * Requires FormData with file, description (optional), message (optional)
   */
  async uploadFile(
    roomId: string,
    file: File,
    description?: string,
    message?: string
  ): Promise<{
    success: boolean;
    messageId: string;
    file: {
      name: string;
      type: string;
      size: number;
      url: string;
    };
  }> {
    const formData = new FormData();
    formData.append('file', file);
    if (description) formData.append('description', description);
    if (message) formData.append('message', message);

    const endpoint = `/api/integrations/rocket/room/${roomId}/upload`;
    return apiClient.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  // ===== THREADS =====

  /**
   * Lấy thread messages (replies in a thread)
   * GET /api/integrations/rocket/thread/{tmid}/messages
   */
  async getThreadMessages(request: import('@/types/rocketchat').GetThreadMessagesRequest): Promise<import('@/types/rocketchat').GetThreadMessagesResponse> {
    const { tmid, roomId, count = 50, offset = 0 } = request;
    
    try {
      // Use the same getMessages endpoint but with thread filtering
      // Rocket.Chat API: GET /api/v1/chat.getThreadMessages?tmid={tmid}
      const endpoint = `/api/integrations/rocket/thread/${tmid}/messages`;
      const response = await apiClient.get<{ 
        success: boolean; 
        messages: any[];
        count: number;
        offset: number;
        total: number;
      }>(endpoint, {
        params: {
          roomId,
          count,
          offset,
        },
      });

      // Transform messages
      if (response.success && response.messages) {
        const transformedMessages = response.messages.map((msg: any) => {
          const username = msg.u?.username || msg.username || 'Unknown';
          return {
            messageId: msg._id || msg.id,
            roomId: msg.rid,
            username,
            text: msg.msg || msg.text || '',
            timestamp: parseTimestamp(msg.ts || msg.timestamp),
            deleted: msg.deleted || false,
            edited: msg.editedAt ? true : false,
            type: msg.t || null,
            user: {
              id: msg.u?._id || msg.u?.id,
              username: msg.u?.username || msg.username,
              name: msg.u?.name || msg.u?.username || username,
            },
            isCurrentUser: msg.isCurrentUser,
            file: msg.file ? {
              _id: msg.file._id,
              name: msg.file.name,
              type: msg.file.type,
              size: msg.file.size,
              url: msg.file.url,
            } : undefined,
            attachments: msg.attachments,
            // Thread info
            tmid: msg.tmid,
            tcount: msg.tcount,
            tlm: msg.tlm,
            replies: msg.replies,
          };
        });

        return {
          success: response.success,
          messages: transformedMessages,
          count: response.count,
          offset: response.offset,
          total: response.total,
        };
      }

      return {
        success: false,
        messages: [],
        count: 0,
        offset: 0,
        total: 0,
      };
    } catch (error) {
      console.error('Error fetching thread messages:', error);
      return {
        success: false,
        messages: [],
        count: 0,
        offset: 0,
        total: 0,
      };
    }
  }

  // ===== HEALTH CHECK =====
  
  /**
   * Kiểm tra kết nối API
   * GET /api/integrations/rocket/health (nếu có)
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Thử gọi list groups để check connection
      await this.getRooms({}, { pageSize: 1, pageNumber: 1 });
      return true;
    } catch {
      return false;
    }
  }
}

export const rocketChatService = new RocketChatService();
export default rocketChatService;
