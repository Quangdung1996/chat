/**
 * API Client - Axios version
 * Thư viện gọi API đến backend với authentication
 * Updated to include X-API-Key header for Rocket.Chat endpoints
 */

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { API_CONFIG } from '@/config/api.config';
import { useAuthStore } from '@/store/authStore';

class ApiClient {
  private axiosInstance: AxiosInstance;

  constructor(baseURL: string) {
    this.axiosInstance = axios.create({
      baseURL,
      timeout: API_CONFIG.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor - Thêm token và API key vào request
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const authState = useAuthStore.getState();
        
        // Add Bearer token for authentication
        if (authState.token) {
          config.headers.Authorization = `Bearer ${authState.token}`;
        }

        // Add Rocket.Chat tokens to header for all requests
        if (authState.rocketChatToken && authState.rocketChatUserId) {
          config.headers['X-RocketChat-Token'] = authState.rocketChatToken;
          config.headers['X-RocketChat-UserId'] = authState.rocketChatUserId;
        }

        // Add X-API-Key for Rocket.Chat endpoints (legacy support)
        if (config.url?.includes('/integrations/rocket') || config.url?.includes('/webhooks/rocketchat')) {
          config.headers['X-API-Key'] = API_CONFIG.apiKey;
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - Xử lý lỗi 401 (unauthorized)
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        // Nếu 401 (Unauthorized) -> logout và redirect về login
        if (error.response?.status === 401) {
          console.warn('401 Unauthorized - Redirecting to login');
          useAuthStore.getState().clearAuth();
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.get<T>(endpoint, config);
    return response.data;
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.post<T>(endpoint, data, config);
    return response.data;
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.put<T>(endpoint, data, config);
    return response.data;
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.delete<T>(endpoint, config);
    return response.data;
  }

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.patch<T>(endpoint, data, config);
    return response.data;
  }

  /**
   * Get axios instance (để customize nếu cần)
   */
  getAxiosInstance(): AxiosInstance {
    return this.axiosInstance;
  }
}

// Export instance
export const apiClient = new ApiClient(API_CONFIG.baseURL);
export default apiClient;
