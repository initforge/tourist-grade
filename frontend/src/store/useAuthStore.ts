import { create } from 'zustand';
import { mockUsers, type User } from '../data/users';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (role: User['role']) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null, // Default to Guest
  isAuthenticated: false,
  
  // A mock login that just picks the specific role from mockUsers
  login: (role) => {
    const foundUser = mockUsers.find(u => u.role === role);
    if (foundUser) {
      set({ user: foundUser, isAuthenticated: true });
    }
  },
  
  logout: () => {
    set({ user: null, isAuthenticated: false });
  }
}));
