/**
 * API Configuration
 * Cấu hình kết nối với backend API
 */

export const API_CONFIG = {
  // URL của backend API
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://8637f2ef4fa3.ngrok-free.app',
  
  // Timeout cho API requests (ms)
  timeout: 30000,
  
  // Endpoints
  endpoints: {
    auth: {
      login: '/api/auth/login',
      logout: '/api/auth/logout',
      register: '/api/auth/register',
    },
    user: {
      profile: '/api/user/profile',
      list: '/api/user/list',
    },
    chat: {
      rooms: '/api/chat/rooms',
      messages: '/api/chat/messages',
      send: '/api/chat/send',
    },
    // Rocket.Chat integration
    rocketChat: {
      syncUser: '/api/integrations/rocket/sync-user',
      createGroup: '/api/integrations/rocket/create-group',
      addMembers: '/api/integrations/rocket/{roomId}/add-members',
      sendMessage: '/api/integrations/rocket/send',
    }
  }
};

export default API_CONFIG;

