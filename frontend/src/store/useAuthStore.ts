import { create } from 'zustand';
import { mockUsers, type User } from '../data/users';

const STORAGE_KEY = '__travela_auth';

function loadFromStorage(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (role: User['role']) => void;
  logout: () => void;
}

const persisted = typeof localStorage !== 'undefined' ? loadFromStorage() : null;

export const useAuthStore = create<AuthState>((set) => ({
  user: persisted,
  isAuthenticated: persisted !== null,

  login: (role) => {
    const foundUser = mockUsers.find(u => u.role === role);
    if (foundUser) {
      set({ user: foundUser, isAuthenticated: true });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(foundUser));
    }
  },

  logout: () => {
    set({ user: null, isAuthenticated: false });
    localStorage.removeItem(STORAGE_KEY);
  }
}));

// Test helper
if (typeof window !== 'undefined') {
  (window as any).__authLogin = (role: User['role']) => {
    const foundUser = mockUsers.find(u => u.role === role);
    if (foundUser) {
      useAuthStore.setState({ user: foundUser, isAuthenticated: true });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(foundUser));
    }
  };
  (window as any).__authLogout = () => {
    useAuthStore.setState({ user: null, isAuthenticated: false });
    localStorage.removeItem(STORAGE_KEY);
  };
  (window as any).__authUser = () => useAuthStore.getState().user;
}
