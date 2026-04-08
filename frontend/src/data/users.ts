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

export const mockUsers: User[] = [
  {
    id: 'U001',
    name: 'Quản Trị Viên (Admin)',
    email: 'admin@travela.vn',
    phone: '0901234567',
    role: 'admin',
    avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=admin',
    active: true,
  },
  {
    id: 'U002',
    name: 'Quản Lý Kinh Doanh',
    email: 'manager@travela.vn',
    phone: '0901234568',
    role: 'manager',
    avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=manager',
    active: true,
  },
  {
    id: 'U003',
    name: 'Điều Phối Viên',
    email: 'coordinator@travela.vn',
    phone: '0901234569',
    role: 'coordinator',
    avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=coordinator',
    active: true,
  },
  {
    id: 'U004',
    name: 'Nhân Viên Kinh Doanh',
    email: 'sales@travela.vn',
    phone: '0901234570',
    role: 'sales',
    avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=sales',
    active: true,
  },
  {
    id: 'U005',
    name: 'Khách Hàng VIP',
    email: 'customer@gmail.com',
    phone: '0988888888',
    role: 'customer',
    avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=customer',
    active: true,
  },
];
