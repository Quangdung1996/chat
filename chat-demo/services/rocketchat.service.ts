/**
 * RocketChat Service
 * Service tương tác với Rocket.Chat API backend
 * Updated to match backend controller endpoints
 */

import { apiClient } from '@/lib/api-client';
import { API_CONFIG } from '@/config/api.config';
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
  RoomFilter,
  PaginationParams,
  PaginatedResponse,
} from '@/types/rocketchat';

class RocketChatService {
  private readonly endpoints = API_CONFIG.endpoints.rocketChat;

  // ===== AUTHENTICATION =====
  
  /**
   * Lấy Rocket.Chat login token từ backend
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
      const transformedRooms: UserSubscription[] = response.rooms.map((room: any) => ({
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
      }));

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
   * Lấy danh sách members của room
   * GET /api/integrations/rocket/room/{roomMappingId}/members?includeInactive=false
   */
  async getRoomMembers(roomMappingId: number, includeInactive: boolean = false): Promise<{ success: boolean; roomMappingId: number; members: RoomMember[] }> {
    const endpoint = this.endpoints.getRoomMembers.replace('{roomMappingId}', roomMappingId.toString());
    return apiClient.get(`${endpoint}?includeInactive=${includeInactive}`);
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
  ): Promise<{ success: boolean; messages: any[] }> {
    const endpoint = this.endpoints.getMessages.replace('{rocketRoomId}', rocketRoomId);
    const response = await apiClient.get<{ 
      success: boolean; 
      messages: any[];
      rocketRoomId?: string;
      roomType?: string;
      count?: number;
      offset?: number;
    }>(endpoint, {
      params: {
        roomType,  // Backend param: roomType (giá trị: 'd', 'p', 'c')
        count,
        offset,
      },
    });

    // Helper to parse Rocket.Chat timestamp format
    const parseTimestamp = (ts: any): string => {
      if (!ts) return new Date().toISOString();
      if (typeof ts === 'string') return ts;
      if (ts.$date) return new Date(ts.$date).toISOString();
      if (typeof ts === 'number') return new Date(ts).toISOString();
      return new Date().toISOString();
    };

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
          // ✅ Include user object with name for display
          user: {
            id: msg.u?._id || msg.u?.id,
            username: msg.u?.username || msg.username,
            name: msg.u?.name || msg.u?.username || username,
          },
          // ✨ Backend đã trả về isCurrentUser rồi, dùng luôn (fallback to compare nếu không có)
          isCurrentUser: msg.isCurrentUser,
        };
      });

      return {
        success: response.success,
        messages: transformedMessages,
      };
    }

    return {
      success: response.success || false,
      messages: [],
    };
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
