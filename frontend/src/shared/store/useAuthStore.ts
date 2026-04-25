import { create } from 'zustand';
import type { User } from '@entities/user/data/users';
import { apiRequest, ApiError } from '@shared/lib/api/client';

const STORAGE_KEY = '__travela_auth_tokens';

interface StoredTokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthResponse {
  success: boolean;
  user: User;
  accessToken: string;
  refreshToken: string;
}

function loadTokens(): StoredTokens | null {
  try {
    const raw = localStorage?.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) as StoredTokens : null;
  } catch {
    return null;
  }
}

function persistTokens(tokens: StoredTokens | null) {
  if (tokens) {
    localStorage?.setItem(STORAGE_KEY, JSON.stringify(tokens));
    return;
  }

  localStorage?.removeItem(STORAGE_KEY);
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: { name: string; phone: string; email: string; password: string }) => Promise<User>;
  logout: () => Promise<void>;
}

const persisted = typeof localStorage !== 'undefined' ? loadTokens() : null;

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: persisted?.accessToken ?? null,
  refreshToken: persisted?.refreshToken ?? null,
  isAuthenticated: false,
  isBootstrapping: true,

  initialize: async () => {
    const { accessToken, refreshToken } = get();

    if (!accessToken && !refreshToken) {
      set({ user: null, isAuthenticated: false, isBootstrapping: false });
      return;
    }

    set({ isBootstrapping: true });

    try {
      const response = await apiRequest<{ success: boolean; user: User }>('/auth/me', {
        token: accessToken ?? undefined,
      });

      set({
        user: response.user,
        isAuthenticated: true,
        isBootstrapping: false,
      });
      return;
    } catch (error) {
      if (!(error instanceof ApiError) || !refreshToken) {
        persistTokens(null);
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isBootstrapping: false,
        });
        return;
      }
    }

    try {
      const refreshed = await apiRequest<AuthResponse>('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });

      persistTokens({
        accessToken: refreshed.accessToken,
        refreshToken: refreshed.refreshToken,
      });

      set({
        user: refreshed.user,
        accessToken: refreshed.accessToken,
        refreshToken: refreshed.refreshToken,
        isAuthenticated: true,
        isBootstrapping: false,
      });
    } catch {
      persistTokens(null);
      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isBootstrapping: false,
      });
    }
  },

  login: async (email, password) => {
    const response = await apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    persistTokens({
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
    });

    set({
      user: response.user,
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      isAuthenticated: true,
      isBootstrapping: false,
    });

    return response.user;
  },

  register: async (payload) => {
    const response = await apiRequest<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    persistTokens({
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
    });

    set({
      user: response.user,
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      isAuthenticated: true,
      isBootstrapping: false,
    });

    return response.user;
  },

  logout: async () => {
    const { refreshToken } = get();

    if (refreshToken) {
      try {
        await apiRequest('/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken }),
        });
      } catch {
        // Local session is still cleared when network logout fails.
      }
    }

    persistTokens(null);
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isBootstrapping: false,
    });
  },
}));
