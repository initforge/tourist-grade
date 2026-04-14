import { useMemo, useState } from 'react';
import { mockBookings } from '@entities/booking/data/bookings';
import { createLocalAvatar, mockUsers } from '@entities/user/data/users';
import type { Role, User } from '@entities/user/data/users';

type AdminUserTab = 'staff' | 'customer';

const STAFF_ROLES: Role[] = ['admin', 'manager', 'coordinator', 'sales'];

const ROLE_LABEL: Record<Role, string> = {
  admin: 'Admin',
  manager: 'Quản lý',
  coordinator: 'Điều phối',
  sales: 'Kinh doanh',
  customer: 'Khách hàng',
};

function formatMoney(value: number) {
  return `${value?.toLocaleString('vi-VN')}đ`;
}

function getCustomerStats(userId: string) {
  const bookings = mockBookings?.filter(booking => booking.userId === userId);
  const completedCount = bookings?.filter(booking => booking.status === 'completed')?.length;
  const cancelledCount = bookings?.filter(booking => booking.status === 'cancelled' || booking.status === 'pending_cancel')?.length;
  const totalSpent = bookings
    ?.filter(booking => booking?.status !== 'cancelled' && booking?.status !== 'pending_cancel')
    ?.reduce((sum, booking) => sum + booking?.paidAmount, 0);

  return { bookings, completedCount, cancelledCount, totalSpent };
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [activeTab, setActiveTab] = useState<AdminUserTab>('staff');
  const [searchTerm, setSearchTerm] = useState('');

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<Partial<User>>({});
  const [selectedCustomer, setSelectedCustomer] = useState<User | null>(null);
  const [confirmToggleUser, setConfirmToggleUser] = useState<User | null>(null);

  const filteredUsers = useMemo(() => {
    const normalizedSearch = searchTerm?.trim()?.toLowerCase();
    return users?.filter(user => {
      const matchesTab = activeTab === 'customer'
        ? user.role === 'customer'
        : user?.role !== 'customer';
      const matchesSearch = !normalizedSearch ||
        user?.name?.toLowerCase()?.includes(normalizedSearch) ||
        user?.email?.toLowerCase()?.includes(normalizedSearch) ||
        user?.id?.toLowerCase()?.includes(normalizedSearch);

      return matchesTab && matchesSearch;
    });
  }, [activeTab, searchTerm, users]);

  const openDrawer = (user: User | null = null) => {
    if (user) {
      setEditingUser(user);
      setFormData(user);
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        role: 'sales',
        active: true,
        avatar: createLocalAvatar('new')
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
      setUsers(users?.map(u => u.id === editingUser?.id ? { ...u, ...formData } as User : u));
    } else {
      const newUser: User = {
        id: `U${String(users?.length + 1)?.padStart(3, '0')}`,
        name: formData?.name ?? '',
        email: formData?.email ?? '',
        phone: formData?.phone ?? '',
        role: (formData?.role ?? 'sales') as Role,
        active: formData?.active !== false,
        avatar: formData?.avatar ?? createLocalAvatar(formData?.email ?? 'new')
      };
      setUsers([...users, newUser]);
    }
    closeDrawer();
  };

  const handleConfirmToggle = () => {
    if (!confirmToggleUser) return;
    setUsers(users?.map(u => u.id === confirmToggleUser?.id ? { ...u, active: !u?.active } : u));
    setConfirmToggleUser(null);
  };

  const renderStatus = (user: User) => (
    <div className="flex items-center space-x-2">
      <span className={`w-2 h-2 rounded-full ${user?.active ? 'bg-tertiary' : 'bg-red-500'}`}></span>
      <span className={`text-[10px] uppercase tracking-widest font-bold ${user?.active ? 'text-tertiary' : 'text-red-500'}`}>
        {user?.active ? 'Hoạt động' : 'Đã khóa'}
      </span>
    </div>
  );

  return (
    <div className="w-full bg-[var(--color-background)] min-h-screen relative">
      <main className="pt-8 px-6 md:px-16 max-w-7xl mx-auto space-y-8 pb-32">
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-[0.2em] text-secondary font-semibold">Phân Quyền & Truy Cập</p>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-primary tracking-tighter">Quản trị Người dùng</h1>
          </div>
          {activeTab === 'staff' && (
            <button onClick={() => openDrawer()} className="bg-tertiary text-white px-8 py-4 flex items-center justify-center space-x-3 hover:opacity-90 transition-opacity active:scale-95 group">
              <span className="material-symbols-outlined text-sm">person_add</span>
              <span className="text-xs uppercase tracking-widest font-bold">Thêm tài khoản</span>
            </button>
          )}
        </section>

        <section className="flex flex-col gap-6">
          <div className="flex flex-wrap gap-3 border-b border-outline-variant/40">
            {([
              { key: 'staff', label: 'Nhân viên' },
              { key: 'customer', label: 'Khách hàng' },
            ] as const)?.map(tab => (
              <button
                key={tab?.key}
                onClick={() => setActiveTab(tab?.key)}
                className={`px-5 py-3 text-xs uppercase tracking-widest font-bold border-b-2 transition-colors ${
                  activeTab === tab?.key
                    ? 'border-secondary text-secondary'
                    : 'border-transparent text-primary/50 hover:text-primary'
                }`}
              >
                {tab?.label}
              </button>
            ))}
          </div>

          <div className="relative group max-w-2xl">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-sm">search</span>
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e?.target?.value)}
              className="w-full bg-transparent border-0 border-b border-outline-variant py-4 pl-12 focus:ring-0 focus:border-secondary transition-colors font-body text-sm placeholder:opacity-50 outline-none"
              placeholder="Tìm kiếm theo tên, email hoặc mã người dùng..."
              type="text"
            />
          </div>
        </section>

        <section className="bg-white shadow-sm border border-[#D0C5AF]/30 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              {activeTab === 'staff' ? (
                <>
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
                    {filteredUsers?.map(user => (
                      <tr key={user?.id} className="hover:bg-surface-container-low transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 overflow-hidden rounded-full border border-outline-variant/30 shrink-0 bg-gray-100">
                              <img src={user?.avatar} alt={user?.name} className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-primary">{user?.name}</p>
                              <p className="text-[10px] font-mono text-outline">{user?.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-secondary/10 text-secondary text-[10px] font-bold uppercase tracking-wider border border-secondary/20">
                            {ROLE_LABEL[user?.role]}
                          </span>
                        </td>
                        <td className="px-6 py-4 hidden lg:table-cell">
                          <p className="text-xs text-primary/80">{user?.email}</p>
                          <p className="text-[10px] text-primary/50">{user?.phone}</p>
                        </td>
                        <td className="px-6 py-4">{renderStatus(user)}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <button onClick={() => openDrawer(user)} className="text-primary/40 hover:text-secondary transition-colors" aria-label={`Chỉnh sửa ${user?.name}`} title="Chỉnh sửa">
                              <span className="material-symbols-outlined text-[18px]">edit</span>
                            </button>
                            <button onClick={() => setConfirmToggleUser(user)} className={`${user?.active ? 'text-primary/40 hover:text-red-600' : 'text-primary/40 hover:text-tertiary'} transition-colors`} aria-label={`${user?.active ? 'Khóa tài khoản' : 'Mở khóa'} ${user?.name}`} title={user?.active ? 'Khóa tài khoản' : 'Mở khóa'}>
                              <span className="material-symbols-outlined text-[18px]">
                                {user?.active ? 'block' : 'lock_open'}
                              </span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </>
              ) : (
                <>
                  <thead>
                    <tr className="bg-surface-container-low text-primary border-b border-outline-variant/40">
                      <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold">Khách hàng</th>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold">Liên hệ</th>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold">Lịch sử đơn đặt</th>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold">Tổng số tiền đã chi</th>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold">Trạng thái</th>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20">
                    {filteredUsers?.map(user => {
                      const stats = getCustomerStats(user?.id);
                      return (
                        <tr key={user?.id} className="hover:bg-surface-container-low transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-4">
                              <div className="w-10 h-10 overflow-hidden rounded-full border border-outline-variant/30 shrink-0 bg-gray-100">
                                <img src={user?.avatar} alt={user?.name} className="w-full h-full object-cover" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-primary">{user?.name}</p>
                                <p className="text-[10px] font-mono text-outline">{user?.id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-xs text-primary/80">{user?.email}</p>
                            <p className="text-[10px] text-primary/50">{user?.phone}</p>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => setSelectedCustomer(user)}
                              className="text-left text-xs text-primary hover:text-secondary transition-colors"
                            >
                              <span className="font-bold">{stats?.completedCount}</span> đơn thành công / <span className="font-bold">{stats?.cancelledCount}</span> đơn hủy
                              <span className="block text-[10px] uppercase tracking-widest text-secondary mt-1">Xem lịch sử</span>
                            </button>
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-primary">{formatMoney(stats?.totalSpent)}</td>
                          <td className="px-6 py-4">{renderStatus(user)}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-3">
                              <button onClick={() => setSelectedCustomer(user)} className="text-primary/40 hover:text-secondary transition-colors" aria-label={`Xem chi tiết ${user?.name}`} title="Xem chi tiết">
                                <span className="material-symbols-outlined text-[18px]">visibility</span>
                              </button>
                              <button onClick={() => setConfirmToggleUser(user)} className={`${user?.active ? 'text-primary/40 hover:text-red-600' : 'text-primary/40 hover:text-tertiary'} transition-colors`} aria-label={`${user?.active ? 'Khóa tài khoản' : 'Mở khóa'} ${user?.name}`} title={user?.active ? 'Khóa tài khoản' : 'Mở khóa'}>
                                <span className="material-symbols-outlined text-[18px]">
                                  {user?.active ? 'block' : 'lock_open'}
                                </span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </>
              )}

              {filteredUsers.length === 0 && (
                <tbody>
                  <tr>
                    <td colSpan={activeTab === 'staff' ? 5 : 6} className="px-6 py-12 text-center text-primary/50 text-sm">
                      Không tìm thấy người dùng nào phù hợp?.
                    </td>
                  </tr>
                </tbody>
              )}
            </table>
          </div>
        </section>
      </main>

      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm transition-opacity" onClick={closeDrawer}></div>
          <div className="absolute inset-y-0 right-0 max-w-md w-full flex">
            <div role="dialog" aria-modal="true" aria-labelledby="admin-user-drawer-title" className="w-full h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
              <div className="px-6 py-6 border-b border-outline-variant/30 flex items-center justify-between bg-surface-container-low">
                <h2 id="admin-user-drawer-title" className="font-serif text-2xl text-primary">
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
                      value={formData?.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e?.target?.value })}
                      className="w-full border border-outline-variant/50 p-3 text-sm focus:border-secondary outline-none"
                      placeholder="VD: Nguyễn Văn A"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-primary/60 font-medium mb-2 block">Email đăng nhập</label>
                    <input
                      type="email"
                      value={formData?.email || ''}
                      onChange={(e) => setFormData({ ...formData, email: e?.target?.value })}
                      className="w-full border border-outline-variant/50 p-3 text-sm focus:border-secondary outline-none"
                      placeholder="VD: nv.a@travela.vn"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-primary/60 font-medium mb-2 block">Số điện thoại</label>
                    <input
                      type="text"
                      value={formData?.phone || ''}
                      onChange={(e) => setFormData({ ...formData, phone: e?.target?.value })}
                      className="w-full border border-outline-variant/50 p-3 text-sm focus:border-secondary outline-none"
                      placeholder="VD: 0901234567"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-primary/60 font-medium mb-2 block">Phân quyền (Role)</label>
                    <select
                      value={formData?.role || 'sales'}
                      onChange={(e) => setFormData({ ...formData, role: e?.target?.value as Role })}
                      className="w-full border border-outline-variant/50 p-3 text-sm focus:border-secondary outline-none appearance-none bg-white"
                    >
                      {STAFF_ROLES?.map(role => (
                        <option key={role} value={role}>{ROLE_LABEL[role]}</option>
                      ))}
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
                      <p className="text-[10px] text-primary/40 mt-1 italic">Hệ thống sẽ gửi mật khẩu này qua email để người dùng tự đổi?.</p>
                    </div>
                  )}
                  <div className="pt-4 border-t border-outline-variant/30 flex items-center justify-between">
                    <label className="text-sm text-primary font-medium">Trạng thái tài khoản</label>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={formData?.active !== false} onChange={(e) => setFormData({ ...formData, active: e?.target?.checked })} />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-tertiary"></div>
                      <span className="ml-3 text-xs font-medium text-primary">{formData?.active !== false ? 'Hoạt động' : 'Vô hiệu hóa'}</span>
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

      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-primary/30 backdrop-blur-sm" onClick={() => setSelectedCustomer(null)} />
          <div role="dialog" aria-modal="true" aria-labelledby="customer-history-title" className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white shadow-2xl">
            <div className="p-6 border-b border-outline-variant/30 flex items-start justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-secondary font-bold">Khách hàng</p>
                <h2 id="customer-history-title" className="font-serif text-2xl text-primary">Chi tiết khách hàng</h2>
                <p className="text-sm text-primary/60 mt-1">{selectedCustomer?.name} ? {selectedCustomer?.email}</p>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="text-primary/40 hover:text-primary transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {(() => {
                const stats = getCustomerStats(selectedCustomer?.id);
                return (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-surface p-4">
                        <p className="text-[10px] uppercase tracking-widest text-primary/50">Số đơn thành công</p>
                        <p className="font-serif text-2xl text-primary mt-1">{stats?.completedCount}</p>
                      </div>
                      <div className="bg-surface p-4">
                        <p className="text-[10px] uppercase tracking-widest text-primary/50">Số đơn hủy</p>
                        <p className="font-serif text-2xl text-primary mt-1">{stats?.cancelledCount}</p>
                      </div>
                      <div className="bg-surface p-4">
                        <p className="text-[10px] uppercase tracking-widest text-primary/50">Tổng số tiền đã chi</p>
                        <p className="font-serif text-xl text-primary mt-1">{formatMoney(stats?.totalSpent)}</p>
                      </div>
                    </div>

                    <div className="overflow-x-auto border border-outline-variant/30">
                      <table className="w-full text-left">
                        <thead className="bg-surface">
                          <tr>
                            <th className="px-4 py-3 text-[10px] uppercase tracking-widest">Mã đơn</th>
                            <th className="px-4 py-3 text-[10px] uppercase tracking-widest">Tour</th>
                            <th className="px-4 py-3 text-[10px] uppercase tracking-widest">Trạng thái</th>
                            <th className="px-4 py-3 text-[10px] uppercase tracking-widest text-right">Đã chi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/20">
                          {stats?.bookings?.map(booking => (
                            <tr key={booking?.id}>
                              <td className="px-4 py-3 text-xs font-mono text-primary">{booking?.bookingCode}</td>
                              <td className="px-4 py-3 text-xs text-primary/80">{booking?.tourName}</td>
                              <td className="px-4 py-3 text-xs text-primary/70">{booking?.status}</td>
                              <td className="px-4 py-3 text-xs text-primary text-right">{formatMoney(booking?.paidAmount)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {confirmToggleUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-primary/30 backdrop-blur-sm" onClick={() => setConfirmToggleUser(null)} />
          <div role="dialog" aria-modal="true" aria-labelledby="confirm-lock-user-title" className="relative w-full max-w-md bg-white shadow-2xl p-6 space-y-5">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-secondary font-bold">Xác nhận</p>
              <h2 id="confirm-lock-user-title" className="font-serif text-2xl text-primary">
                {confirmToggleUser?.active ? 'Xác nhận khóa tài khoản' : 'Xác nhận mở khóa tài khoản'}
              </h2>
              <p className="text-sm text-primary/70 mt-3">
                {confirmToggleUser?.active ? 'Bạn có chắc muốn khóa tài khoản' : 'Bạn có chắc muốn mở khóa tài khoản'} <strong>{confirmToggleUser?.name}</strong>?
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmToggleUser(null)} className="flex-1 py-3 border border-outline-variant/60 text-primary text-xs uppercase tracking-widest hover:bg-surface transition-colors">
                Hủy bỏ
              </button>
              <button onClick={handleConfirmToggle} className={`flex-1 py-3 text-white text-xs uppercase tracking-widest transition-colors ${confirmToggleUser?.active ? 'bg-red-600 hover:bg-red-700' : 'bg-tertiary hover:opacity-90'}`}>
                {confirmToggleUser?.active ? 'Khóa tài khoản' : 'Mở khóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

