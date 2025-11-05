/**
 * Authentication API Client
 * Handles all authentication-related API calls
 */

import axios, { AxiosError } from 'axios';
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  ChangePasswordRequest,
  User,
  AuthTokens,
} from '@/types/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: `${API_URL}/auth`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const tokens = localStorage.getItem('ayni_tokens');
    if (tokens) {
      const { access } = JSON.parse(tokens) as AuthTokens;
      config.headers.Authorization = `Bearer ${access}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean };

    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const tokens = localStorage.getItem('ayni_tokens');
        if (tokens) {
          const { refresh } = JSON.parse(tokens) as AuthTokens;
          const { data } = await axios.post<AuthTokens>(
            `${API_URL}/auth/token/refresh/`,
            { refresh }
          );

          // Update stored tokens
          localStorage.setItem('ayni_tokens', JSON.stringify(data));

          // Update the failed request with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${data.access}`;
          }

          // Retry the original request
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh token is also invalid, clear auth state
        localStorage.removeItem('ayni_tokens');
        localStorage.removeItem('ayni_user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Register a new user
 */
export async function register(data: RegisterRequest): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>('/register/', data);
  return response.data;
}

/**
 * Login user
 */
export async function login(data: LoginRequest): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>('/login/', data);
  return response.data;
}

/**
 * Logout user
 */
export async function logout(refreshToken: string): Promise<void> {
  await apiClient.post('/logout/', { refresh: refreshToken });
}

/**
 * Get current user profile
 */
export async function getProfile(): Promise<User> {
  const response = await apiClient.get<User>('/profile/');
  return response.data;
}

/**
 * Update user profile
 */
export async function updateProfile(data: Partial<User>): Promise<User> {
  const response = await apiClient.patch<User>('/profile/', data);
  return response.data;
}

/**
 * Change password
 */
export async function changePassword(data: ChangePasswordRequest): Promise<void> {
  await apiClient.post('/change-password/', data);
}

/**
 * Refresh access token
 */
export async function refreshToken(refresh: string): Promise<AuthTokens> {
  const response = await axios.post<AuthTokens>(
    `${API_URL}/auth/token/refresh/`,
    { refresh }
  );
  return response.data;
}

/**
 * Extract error message from API error
 */
export function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as Record<string, unknown> | undefined;

    // Handle validation errors
    if (data && typeof data === 'object') {
      // Check for field-specific errors
      const firstError = Object.values(data)[0];
      if (Array.isArray(firstError)) {
        return firstError[0] as string;
      }
      if (typeof firstError === 'string') {
        return firstError;
      }

      // Check for detail field
      if ('detail' in data && typeof data.detail === 'string') {
        return data.detail;
      }

      // Check for message field
      if ('message' in data && typeof data.message === 'string') {
        return data.message;
      }
    }

    return error.response?.statusText || error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred';
}

export default apiClient;
