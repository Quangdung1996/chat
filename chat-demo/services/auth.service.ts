/**
 * Auth Service
 * Xử lý authentication với OAuth2
 */

import axios from 'axios';
import { API_CONFIG } from '@/config/api.config';

interface LoginRequest {
  username: string;
  password: string;
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  scope?: string;
  // User info (nếu backend trả về)
  userId?: number;
  username?: string;
  fullName?: string;
  email?: string;
  roles?: string[];
}

interface RefreshTokenRequest {
  refresh_token: string;
}

class AuthService {
  private readonly tokenEndpoint = '/oauth2/token';

  /**
   * Login với username/password - OAuth2 Password Grant
   */
  async login(username: string, password: string): Promise<TokenResponse> {
    try {
      // OAuth2 Password Grant: application/x-www-form-urlencoded
      const params = new URLSearchParams();
      params.append('grant_type', 'password');
      params.append('username', username);
      params.append('password', password);

      const response = await axios.post<TokenResponse>(
        `${API_CONFIG.baseURL}${this.tokenEndpoint}`,
        params,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.error_description ||
          error.response?.data?.message ||
          'Đăng nhập thất bại'
        );
      }
      throw error;
    }
  }

  /**
   * Refresh token - OAuth2 Refresh Token Grant
   */
  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    try {
      const params = new URLSearchParams();
      params.append('grant_type', 'refresh_token');
      params.append('refresh_token', refreshToken);

      const response = await axios.post<TokenResponse>(
        `${API_CONFIG.baseURL}${this.tokenEndpoint}`,
        params,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error('Refresh token thất bại');
      }
      throw error;
    }
  }

  /**
   * Logout (nếu backend có endpoint logout)
   */
  async logout(token: string): Promise<void> {
    try {
      await axios.post(
        `${API_CONFIG.baseURL}/oauth2/revoke`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (error) {
      // Ignore errors, clear local storage anyway
      console.error('Logout error:', error);
    }
  }

  /**
   * Get user info từ token (nếu backend support)
   */
  async getUserInfo(token: string): Promise<any> {
    try {
      const response = await axios.get(`${API_CONFIG.baseURL}/api/user/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Get user info error:', error);
      return null;
    }
  }
}

export const authService = new AuthService();
export default authService;

