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

export const mockUsers: User[] = [
  {
    id: 'U001',
    name: 'Quản Trị Viên (Admin)',
    email: 'admin@travela.vn',
    phone: '0901234567',
    role: 'admin',
    avatar: createLocalAvatar('admin'),
    active: true,
  },
  {
    id: 'U002',
    name: 'Quản L? Kinh Doanh',
    email: 'manager@travela.vn',
    phone: '0901234568',
    role: 'manager',
    avatar: createLocalAvatar('manager'),
    active: true,
  },
  {
    id: 'U003',
    name: 'Điều Phối Viên',
    email: 'coordinator@travela.vn',
    phone: '0901234569',
    role: 'coordinator',
    avatar: createLocalAvatar('coordinator'),
    active: true,
  },
  {
    id: 'U004',
    name: 'Nhân Viên Kinh Doanh',
    email: 'sales@travela.vn',
    phone: '0901234570',
    role: 'sales',
    avatar: createLocalAvatar('sales'),
    active: true,
  },
  {
    id: 'U005',
    name: 'Khách Hàng VIP',
    email: 'customer@gmail.com',
    phone: '0988888888',
    role: 'customer',
    avatar: createLocalAvatar('customer'),
    active: true,
  },
];
