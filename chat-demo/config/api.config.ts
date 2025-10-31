/**
 * API Configuration
 * Cấu hình kết nối với backend API
 */

export const API_CONFIG = {
  // URL của backend API
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:12391',

  // URL của Rocket.Chat server (để kết nối WebSocket trực tiếp)
  rocketChatURL: process.env.NEXT_PUBLIC_ROCKETCHAT_URL || 'http://localhost:3000',

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
      userInfo: '/api/v1/Account/userinfo',
    },
    // Rocket.Chat Integration endpoints
    rocketChat: {
      // Authentication
      getLoginToken: '/api/integrations/rocket/get-login-token',
      
      // User Management
      getUsers: '/api/integrations/rocket/users',
      getUserInfo: '/api/integrations/rocket/user/{userId}/info',
      getUserRooms: '/api/integrations/rocket/user/{userId}/rooms',

      // Room Management
      createGroup: '/api/integrations/rocket/create-group',
      createDirectMessage: '/api/integrations/rocket/dm/create',
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
