/**
 * RocketChat Service
 * Service tương tác với Rocket.Chat API backend
 */

import { apiClient } from '@/lib/api-client';
import { API_CONFIG } from '@/config/api.config';
import type {
  SyncUserRequest,
  SyncUserResponse,
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
  RoomFilter,
  PaginationParams,
  PaginatedResponse,
  ApiResponse,
} from '@/types/rocketchat';

class RocketChatService {
  private readonly endpoints = API_CONFIG.endpoints.rocketChat;

  // ===== USER MANAGEMENT =====
  
  /**
   * Đồng bộ user vào Rocket.Chat
   */
  async syncUser(request: SyncUserRequest): Promise<ApiResponse<SyncUserResponse>> {
    return apiClient.post(this.endpoints.syncUser, request);
  }

  /**
   * Lấy thông tin user
   */
  async getUserInfo(userId: number): Promise<ApiResponse<UserInfo>> {
    return apiClient.get(`/api/rocketchat/user/${userId}/info`);
  }

  // ===== ROOM MANAGEMENT =====
  
  /**
   * Tạo group/channel
   */
  async createGroup(request: CreateGroupRequest): Promise<ApiResponse<CreateGroupResponse>> {
    return apiClient.post(this.endpoints.createGroup, request);
  }

  /**
   * Lấy danh sách rooms với filter và pagination
   */
  async getRooms(
    filter?: RoomFilter,
    pagination?: PaginationParams
  ): Promise<ApiResponse<PaginatedResponse<Room>>> {
    return apiClient.get('/api/integrations/rocket/rooms', {
      params: {
        ...filter,
        ...pagination,
      },
    });
  }

  /**
   * Lấy chi tiết room
   */
  async getRoomDetail(roomId: string): Promise<ApiResponse<Room>> {
    return apiClient.get(`/api/integrations/rocket/rooms/${roomId}`);
  }

  /**
   * Đổi tên room
   */
  async renameRoom(request: RenameRoomRequest): Promise<ApiResponse> {
    return apiClient.post('/api/integrations/rocket/rename-room', request);
  }

  /**
   * Archive/Unarchive room
   */
  async archiveRoom(request: ArchiveRoomRequest): Promise<ApiResponse> {
    return apiClient.post('/api/integrations/rocket/archive-room', request);
  }

  /**
   * Xóa room
   */
  async deleteRoom(request: DeleteRoomRequest): Promise<ApiResponse> {
    return apiClient.post('/api/integrations/rocket/delete-room', request);
  }

  // ===== MEMBER MANAGEMENT =====
  
  /**
   * Thêm members vào room
   */
  async addMembers(request: AddMembersRequest): Promise<ApiResponse<AddMembersResponse>> {
    const endpoint = this.endpoints.addMembers.replace('{roomId}', request.roomId);
    return apiClient.post(endpoint, { userIds: request.userIds });
  }

  /**
   * Xóa member khỏi room
   */
  async removeMember(roomId: string, userId: number): Promise<ApiResponse> {
    return apiClient.post(`/api/integrations/rocket/${roomId}/remove-member`, { userId });
  }

  /**
   * Cập nhật role của member
   */
  async updateMemberRole(request: UpdateMemberRoleRequest): Promise<ApiResponse> {
    return apiClient.post(
      `/api/integrations/rocket/${request.roomId}/update-role`,
      { userId: request.userId, role: request.role }
    );
  }

  /**
   * Lấy danh sách members của room
   */
  async getRoomMembers(roomId: string): Promise<ApiResponse<RoomMember[]>> {
    return apiClient.get(`/api/integrations/rocket/${roomId}/members`);
  }

  /**
   * Đối soát members (so sánh DB vs Rocket.Chat)
   */
  async reconcileMembers(roomId: string): Promise<ApiResponse> {
    return apiClient.post(`/api/integrations/rocket/${roomId}/reconcile-members`);
  }

  // ===== MESSAGING =====
  
  /**
   * Gửi tin nhắn vào room
   */
  async sendMessage(request: SendMessageRequest): Promise<ApiResponse<SendMessageResponse>> {
    return apiClient.post(this.endpoints.sendMessage, request);
  }

  /**
   * Lấy lịch sử tin nhắn
   */
  async getMessages(
    roomId: string,
    pagination?: PaginationParams
  ): Promise<ApiResponse<PaginatedResponse<ChatMessage>>> {
    return apiClient.get(`/api/integrations/rocket/${roomId}/messages`, {
      params: pagination,
    });
  }

  /**
   * Xóa tin nhắn
   */
  async deleteMessage(messageId: string): Promise<ApiResponse> {
    return apiClient.delete(`/api/integrations/rocket/messages/${messageId}`);
  }

  // ===== ANNOUNCEMENTS =====
  
  /**
   * Bật/tắt announcement mode
   */
  async setAnnouncementMode(roomId: string, enabled: boolean): Promise<ApiResponse> {
    return apiClient.post(`/api/integrations/rocket/${roomId}/announcement`, { enabled });
  }

  /**
   * Set topic/announcement cho room
   */
  async setRoomTopic(roomId: string, topic: string): Promise<ApiResponse> {
    return apiClient.post(`/api/integrations/rocket/${roomId}/topic`, { topic });
  }

  /**
   * Pin message
   */
  async pinMessage(messageId: string): Promise<ApiResponse> {
    return apiClient.post(`/api/integrations/rocket/messages/${messageId}/pin`);
  }

  // ===== TRANSFER OWNERSHIP =====
  
  /**
   * Chuyển quyền owner
   */
  async transferOwnership(roomId: string, newOwnerId: number): Promise<ApiResponse> {
    return apiClient.post(`/api/integrations/rocket/${roomId}/transfer-owner`, {
      newOwnerId,
    });
  }

  // ===== HEALTH CHECK =====
  
  /**
   * Kiểm tra kết nối API
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${API_CONFIG.baseURL}/api/health`);
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const rocketChatService = new RocketChatService();
export default rocketChatService;

