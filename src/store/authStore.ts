/**
 * Authentication Store
 * Global state management for authentication using Zustand
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  AuthState,
  LoginRequest,
  RegisterRequest,
  ChangePasswordRequest,
  User,
  AuthTokens,
} from '@/types/auth';
import * as authApi from '@/lib/api/auth';

interface AuthActions {
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (data: ChangePasswordRequest) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  clearError: () => void;
  initializeAuth: () => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      login: async (data: LoginRequest) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.login(data);

          // Store tokens and user
          localStorage.setItem('ayni_tokens', JSON.stringify(response.tokens));
          localStorage.setItem('ayni_user', JSON.stringify(response.user));

          set({
            user: response.user,
            tokens: response.tokens,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const message = authApi.extractErrorMessage(error);
          set({
            isLoading: false,
            error: { message },
          });
          throw error;
        }
      },

      register: async (data: RegisterRequest) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.register(data);

          // Store tokens and user
          localStorage.setItem('ayni_tokens', JSON.stringify(response.tokens));
          localStorage.setItem('ayni_user', JSON.stringify(response.user));

          set({
            user: response.user,
            tokens: response.tokens,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const message = authApi.extractErrorMessage(error);
          set({
            isLoading: false,
            error: { message },
          });
          throw error;
        }
      },

      logout: async () => {
        const { tokens } = get();
        set({ isLoading: true, error: null });

        try {
          if (tokens?.refresh) {
            await authApi.logout(tokens.refresh);
          }
        } catch (error) {
          // Continue with logout even if API call fails
          console.error('Logout error:', error);
        } finally {
          // Clear local storage and state
          localStorage.removeItem('ayni_tokens');
          localStorage.removeItem('ayni_user');

          set({
            user: null,
            tokens: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },

      changePassword: async (data: ChangePasswordRequest) => {
        set({ isLoading: true, error: null });
        try {
          await authApi.changePassword(data);
          set({ isLoading: false, error: null });
        } catch (error) {
          const message = authApi.extractErrorMessage(error);
          set({
            isLoading: false,
            error: { message },
          });
          throw error;
        }
      },

      updateProfile: async (data: Partial<User>) => {
        set({ isLoading: true, error: null });
        try {
          const updatedUser = await authApi.updateProfile(data);

          // Update stored user
          localStorage.setItem('ayni_user', JSON.stringify(updatedUser));

          set({
            user: updatedUser,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const message = authApi.extractErrorMessage(error);
          set({
            isLoading: false,
            error: { message },
          });
          throw error;
        }
      },

      clearError: () => {
        set({ error: null });
      },

      initializeAuth: () => {
        try {
          const tokensStr = localStorage.getItem('ayni_tokens');
          const userStr = localStorage.getItem('ayni_user');

          if (tokensStr && userStr) {
            const tokens = JSON.parse(tokensStr) as AuthTokens;
            const user = JSON.parse(userStr) as User;

            set({
              user,
              tokens,
              isAuthenticated: true,
            });
          }
        } catch (error) {
          console.error('Failed to initialize auth:', error);
          localStorage.removeItem('ayni_tokens');
          localStorage.removeItem('ayni_user');
        }
      },
    }),
    {
      name: 'ayni-auth-storage',
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
