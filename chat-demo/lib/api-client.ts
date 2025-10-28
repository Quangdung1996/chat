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
        // Add Bearer token for authentication
        const token = useAuthStore.getState().token;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add X-API-Key for Rocket.Chat endpoints
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
        const originalRequest = error.config;

        // Nếu 401 và chưa retry
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            // Thử refresh token
            const { refreshToken } = useAuthStore.getState();
            if (refreshToken) {
              // TODO: Implement refresh token logic
              // const response = await authService.refreshToken(refreshToken);
              // useAuthStore.getState().setAuth(response.access_token, refreshToken, user);
              // originalRequest.headers.Authorization = `Bearer ${response.access_token}`;
              // return this.axiosInstance(originalRequest);
            }
          } catch (refreshError) {
            // Refresh thất bại -> logout
            useAuthStore.getState().clearAuth();
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
            return Promise.reject(refreshError);
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
