/**
 * API Configuration
 * Cấu hình kết nối với backend API
 */

export const API_CONFIG = {
  // URL của backend API
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  
  // Timeout cho API requests (ms)
  timeout: 30000,
  
  // API Key cho Rocket.Chat endpoints
  apiKey: process.env.NEXT_PUBLIC_ROCKET_API_KEY || 'your-api-key-here',
  
  // Endpoints
  endpoints: {
    auth: {
      login: '/api/auth/login',
      logout: '/api/auth/logout',
      register: '/api/auth/register',
      token: '/oauth2/token',
      userInfo: '/api/user/me',
    },
    // Rocket.Chat Integration endpoints
    rocketChat: {
      // User Management
      syncUser: '/api/integrations/rocket/sync-user',
      getUserInfo: '/api/integrations/rocket/user/{userId}/info',
      
      // Room Management
      createGroup: '/api/integrations/rocket/create-group',
      listGroups: '/api/integrations/rocket/groups',
      renameRoom: '/api/integrations/rocket/room/{roomId}/rename',
      archiveRoom: '/api/integrations/rocket/room/{roomId}/archive',
      deleteRoom: '/api/integrations/rocket/room/{roomId}',
      setAnnouncementMode: '/api/integrations/rocket/room/{roomId}/announcement-mode',
      setTopic: '/api/integrations/rocket/room/{roomId}/topic',
      
      // Member Management
      addMember: '/api/integrations/rocket/room/{roomId}/add-member',
      addMembers: '/api/integrations/rocket/room/{roomId}/add-members',
      removeMember: '/api/integrations/rocket/room/{roomId}/member/{rocketUserId}',
      addModerator: '/api/integrations/rocket/room/{roomId}/moderator/{rocketUserId}',
      removeModerator: '/api/integrations/rocket/room/{roomId}/moderator/{rocketUserId}',
      addOwner: '/api/integrations/rocket/room/{roomId}/owner/{rocketUserId}',
      getRoomMembers: '/api/integrations/rocket/room/{roomMappingId}/members',
      
      // Messaging
      sendMessage: '/api/integrations/rocket/send',
      getMessages: '/api/integrations/rocket/room/{rocketRoomId}/messages',
      
      // Webhooks
      webhook: '/api/webhooks/rocketchat',
    }
  }
};

export default API_CONFIG;
