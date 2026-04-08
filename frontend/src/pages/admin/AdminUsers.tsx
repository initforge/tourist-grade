import React, { useState } from 'react';
import { mockUsers } from '../../data/users';
import type { User, Role } from '../../data/users';

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  
  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<Partial<User>>({});

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter ? user.role === roleFilter : true;
    return matchesSearch && matchesRole;
  });

  const handleToggleActive = (id: string) => {
    setUsers(users.map(u => u.id === id ? { ...u, active: !u.active } : u));
  };

  const openDrawer = (user: User | null = null) => {
    if (user) {
      setEditingUser(user);
      setFormData(user);
    } else {
      setEditingUser(null);
      setFormData({
        name: '', email: '', phone: '', role: 'customer', active: true, avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=new'
      });
    }
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setEditingUser(null);
    setFormData({});
  };

  const handleSaveUser = () => {
    if (editingUser) {
      setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...formData } as User : u));
    } else {
      const newUser: User = {
        ...(formData as User),
        id: `U00${users.length + 1}`,
        avatar: `https://api.dicebear.com/7.x/notionists/svg?seed=${formData.email}`
      };
      setUsers([...users, newUser]);
    }
    closeDrawer();
  };

  return (
    <div className="w-full bg-[var(--color-background)] min-h-screen relative">
      <main className="pt-8 px-6 md:px-16 max-w-7xl mx-auto space-y-12 pb-32">
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-[0.2em] text-secondary font-semibold">Phân Quyền & Truy Cập</p>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-primary tracking-tighter">Quản trị Người dùng</h1>
          </div>
          <button onClick={() => openDrawer()} className="bg-tertiary text-white px-8 py-4 flex items-center justify-center space-x-3 hover:opacity-90 transition-opacity active:scale-95 group">
            <span className="material-symbols-outlined text-sm">person_add</span>
            <span className="text-xs uppercase tracking-widest font-bold">Thêm tài khoản</span>
          </button>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-8 relative group">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-sm">search</span>
            <input 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent border-0 border-b border-outline-variant py-4 pl-12 focus:ring-0 focus:border-secondary transition-colors font-body text-sm placeholder:opacity-50 outline-none" 
              placeholder="Tìm kiếm theo tên, email hoặc mã người dùng..." 
              type="text"
            />
          </div>
          <div className="md:col-span-4 relative">
            <select 
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full bg-transparent border-0 border-b border-outline-variant py-4 pr-10 focus:ring-0 focus:border-secondary transition-colors font-body text-xs uppercase tracking-widest appearance-none cursor-pointer outline-none"
            >
              <option value="">Tất cả vai trò</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="coordinator">Coordinator</option>
              <option value="sales">Sales</option>
              <option value="customer">Customer</option>
            </select>
            <span className="material-symbols-outlined absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-sm">expand_more</span>
          </div>
        </section>

        <section className="bg-white shadow-sm border border-[#D0C5AF]/30 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low text-primary border-b border-outline-variant/40">
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold">Thành viên</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold">Vai trò</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold hidden lg:table-cell">Liên hệ</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold">Trạng thái</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-surface-container-low transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 overflow-hidden rounded-full border border-outline-variant/30 shrink-0 bg-gray-100">
                           <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-primary">{user.name}</p>
                          <p className="text-[10px] font-mono text-outline">{user.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-secondary/10 text-secondary text-[10px] font-bold uppercase tracking-wider border border-secondary/20">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <p className="text-xs text-primary/80">{user.email}</p>
                      <p className="text-[10px] text-primary/50">{user.phone}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <span className={`w-2 h-2 rounded-full ${user.active ? 'bg-tertiary' : 'bg-red-500'}`}></span>
                        <span className={`text-[10px] uppercase tracking-widest font-bold ${user.active ? 'text-tertiary' : 'text-red-500'}`}>
                          {user.active ? 'Hoạt động' : 'Đã khóa'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button onClick={() => openDrawer(user)} className="text-primary/40 hover:text-secondary transition-colors" title="Chỉnh sửa">
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button onClick={() => handleToggleActive(user.id)} className={`${user.active ? 'text-primary/40 hover:text-red-600' : 'text-primary/40 hover:text-tertiary'} transition-colors`} title={user.active ? "Khóa tài khoản" : "Mở khóa"}>
                           <span className="material-symbols-outlined text-[18px]">
                             {user.active ? 'block' : 'lock_open'}
                           </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-primary/50 text-sm">
                      Không tìm thấy người dùng nào phù hợp.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* Slide-over Drawer for Add/Edit User */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm transition-opacity" onClick={closeDrawer}></div>
          <div className="absolute inset-y-0 right-0 max-w-md w-full flex">
            <div className="w-full h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
              <div className="px-6 py-6 border-b border-outline-variant/30 flex items-center justify-between bg-surface-container-low">
                <h2 className="font-serif text-2xl text-primary">
                  {editingUser ? 'Cập Nhật Người Dùng' : 'Thêm Tài Khoản Mới'}
                </h2>
                <button onClick={closeDrawer} className="text-primary/50 hover:text-primary transition-colors">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-primary/60 font-medium mb-2 block">Họ và tên</label>
                    <input 
                      type="text" 
                      value={formData.name || ''}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full border border-outline-variant/50 p-3 text-sm focus:border-secondary outline-none"
                      placeholder="VD: Nguyễn Văn A"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-primary/60 font-medium mb-2 block">Email đăng nhập</label>
                    <input 
                      type="email" 
                      value={formData.email || ''}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full border border-outline-variant/50 p-3 text-sm focus:border-secondary outline-none"
                      placeholder="VD: nv.a@travela.vn"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-primary/60 font-medium mb-2 block">Số điện thoại</label>
                    <input 
                      type="text" 
                      value={formData.phone || ''}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full border border-outline-variant/50 p-3 text-sm focus:border-secondary outline-none"
                      placeholder="VD: 0901234567"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-primary/60 font-medium mb-2 block">Phân quyền (Role)</label>
                    <select 
                      value={formData.role || 'customer'}
                      onChange={(e) => setFormData({...formData, role: e.target.value as Role})}
                      className="w-full border border-outline-variant/50 p-3 text-sm focus:border-secondary outline-none appearance-none bg-white"
                    >
                      <option value="admin">Quản trị hệ thống (Admin)</option>
                      <option value="manager">Quản lý / Trưởng phòng (Manager)</option>
                      <option value="coordinator">Điều phối viên (Coordinator)</option>
                      <option value="sales">Nhân viên kinh doanh (Sales)</option>
                      <option value="customer">Khách hàng (Customer)</option>
                    </select>
                  </div>
                  {!editingUser && (
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-primary/60 font-medium mb-2 block">Mật khẩu khởi tạo</label>
                      <input 
                        type="text" 
                        defaultValue="123456aA@"
                        className="w-full border border-outline-variant/50 p-3 text-sm focus:border-secondary outline-none bg-gray-50"
                      />
                      <p className="text-[10px] text-primary/40 mt-1 italic">Hệ thống sẽ gửi mật khẩu này qua email để người dùng tự đổi.</p>
                    </div>
                  )}
                  <div className="pt-4 border-t border-outline-variant/30 flex items-center justify-between">
                    <label className="text-sm text-primary font-medium">Trạng thái tài khoản</label>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={formData.active !== false} onChange={(e) => setFormData({...formData, active: e.target.checked})} />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-tertiary"></div>
                      <span className="ml-3 text-xs font-medium text-primary">{formData.active !== false ? 'Hoạt động' : 'Vô hiệu hóa'}</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-outline-variant/30 bg-surface-container-low flex gap-4">
                <button onClick={closeDrawer} className="flex-1 px-4 py-3 border border-primary text-primary text-xs font-bold uppercase tracking-widest hover:bg-gray-50 transition-colors">
                  Hủy bỏ
                </button>
                <button onClick={handleSaveUser} className="flex-1 px-4 py-3 bg-primary text-white text-xs font-bold uppercase tracking-widest hover:bg-black transition-colors">
                  {editingUser ? 'Lưu thay đổi' : 'Tạo tài khoản'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
