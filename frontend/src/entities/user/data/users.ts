export type Role = 'admin' | 'manager' | 'coordinator' | 'sales' | 'customer';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  avatar: string;
  active: boolean;
}

export function createLocalAvatar(label: string) {
  const initials = label?.slice(0, 2)?.toUpperCase() || 'TV';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" fill="#f5efe6"/><circle cx="48" cy="38" r="18" fill="#2d5a45"/><path d="M18 88c5-18 17-28 30-28s25 10 30 28" fill="#2d5a45"/><text x="48" y="91" text-anchor="middle" font-size="12" font-family="serif" fill="#c59d3f">${initials}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
