import type { User } from '@entities/user/data/users';
import { apiRequest } from './client';

interface UserResponse {
  success: boolean;
  user: User;
}

interface UsersResponse {
  success: boolean;
  users: User[];
}

export function listUsers(token: string) {
  return apiRequest<UsersResponse>('/users', { token });
}

export function createUser(token: string, payload: {
  name: string;
  email: string;
  phone: string;
  role: User['role'];
  active: boolean;
  password?: string;
}) {
  return apiRequest<UserResponse>('/users', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  });
}

export function updateUser(token: string, id: string, payload: Partial<{
  name: string;
  email: string;
  phone: string;
  role: User['role'];
  active: boolean;
  password: string;
}>) {
  return apiRequest<UserResponse>(`/users/${id}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(payload),
  });
}

export function toggleUserStatus(token: string, id: string) {
  return apiRequest<UserResponse>(`/users/${id}/status`, {
    method: 'PATCH',
    token,
  });
}

export function updateProfile(token: string, payload: {
  name: string;
  phone: string;
  avatar?: string;
}) {
  return apiRequest<UserResponse>('/users/me', {
    method: 'PATCH',
    token,
    body: JSON.stringify(payload),
  });
}

export function changePassword(token: string, payload: {
  currentPassword: string;
  newPassword: string;
}) {
  return apiRequest<{ success: boolean }>('/users/me/password', {
    method: 'PATCH',
    token,
    body: JSON.stringify(payload),
  });
}
