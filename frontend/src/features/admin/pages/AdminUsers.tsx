import { useMemo, useState } from 'react';
import { Modal, message } from 'antd';
import type { Booking } from '@entities/booking/data/bookings';
import { createLocalAvatar } from '@entities/user/data/users';
import type { Role, User } from '@entities/user/data/users';
import { ApiError } from '@shared/lib/api/client';
import { createUser, toggleUserStatus, updateUser } from '@shared/lib/api/users';
import { useAuthStore } from '@shared/store/useAuthStore';
import { useAppDataStore } from '@shared/store/useAppDataStore';

type AdminUserTab = 'staff' | 'customer';

type UserFormState = {
  name: string;
  email: string;
  phone: string;
  role: Role;
  active: boolean;
  password: string;
};

const STAFF_ROLES: Role[] = ['admin', 'manager', 'coordinator', 'sales'];

const ROLE_LABEL: Record<Role, string> = {
  admin: 'Admin',
  manager: 'Quản lý',
  coordinator: 'Điều phối',
  sales: 'Kinh doanh',
  customer: 'Khách hàng',
};

function formatMoney(value: number) {
  return `${value.toLocaleString('vi-VN')}đ`;
}

function createEmptyForm(): UserFormState {
  return {
    name: '',
    email: '',
    phone: '',
    role: 'sales',
    active: true,
    password: '123456',
  };
}

function toFormState(user: User): UserFormState {
  return {
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    active: user.active,
    password: '',
  };
}

function getCustomerStats(bookings: Booking[], userId: string) {
  const rows = bookings.filter((booking) => booking.userId === userId);
  const completedCount = rows.filter((booking) => booking.status === 'completed').length;
  const cancelledCount = rows.filter((booking) => booking.status === 'cancelled' || booking.status === 'pending_cancel').length;
  const totalSpent = rows
    .filter((booking) => booking.status !== 'cancelled' && booking.status !== 'pending_cancel')
    .reduce((sum, booking) => sum + booking.paidAmount, 0);

  return { rows, completedCount, cancelledCount, totalSpent };
}

export default function AdminUsers() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const users = useAppDataStore((state) => state.users);
  const bookings = useAppDataStore((state) => state.bookings);
  const upsertUser = useAppDataStore((state) => state.upsertUser);

  const [activeTab, setActiveTab] = useState<AdminUserTab>('staff');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormState>(createEmptyForm());
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<User | null>(null);
  const [confirmToggleUser, setConfirmToggleUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredUsers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return users.filter((user) => {
      const matchesTab = activeTab === 'customer'
        ? user.role === 'customer'
        : STAFF_ROLES.includes(user.role);
      const matchesSearch = !normalizedSearch
        || user.name.toLowerCase().includes(normalizedSearch)
        || user.email.toLowerCase().includes(normalizedSearch)
        || user.id.toLowerCase().includes(normalizedSearch);

      return matchesTab && matchesSearch;
    });
  }, [activeTab, searchTerm, users]);

  const openEditor = (user?: User) => {
    setEditingUser(user ?? null);
    setFormData(user ? toFormState(user) : createEmptyForm());
    setIsEditorOpen(true);
  };

  const handleSaveUser = async () => {
    if (!accessToken) return;
    setIsSubmitting(true);

    try {
      if (editingUser) {
        const response = await updateUser(accessToken, editingUser.id, {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          role: formData.role,
          active: formData.active,
          ...(formData.password ? { password: formData.password } : {}),
        });
        upsertUser({
          ...response.user,
          avatar: response.user.avatar || editingUser.avatar || createLocalAvatar(response.user.name),
        });
        message.success('Đã cập nhật tài khoản.');
      } else {
        const response = await createUser(accessToken, {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          role: formData.role,
          active: formData.active,
          password: formData.password || undefined,
        });
        upsertUser({
          ...response.user,
          avatar: response.user.avatar || createLocalAvatar(response.user.name),
        });
        message.success('Đã tạo tài khoản.');
      }

      setIsEditorOpen(false);
      setEditingUser(null);
    } catch (error) {
      message.error(error instanceof ApiError ? error.message : 'Lưu tài khoản thất bại');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!accessToken || !confirmToggleUser) return;
    setIsSubmitting(true);

    try {
      const response = await toggleUserStatus(accessToken, confirmToggleUser.id);
      upsertUser({
        ...response.user,
        avatar: response.user.avatar || confirmToggleUser.avatar,
      });
      message.success(response.user.active ? 'Đã mở khóa tài khoản.' : 'Đã khóa tài khoản.');
      setConfirmToggleUser(null);
    } catch (error) {
      message.error(error instanceof ApiError ? error.message : 'Cập nhật trạng thái thất bại');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStatus = (user: User) => (
    <div className="flex items-center space-x-2">
      <span className={`w-2 h-2 rounded-full ${user.active ? 'bg-tertiary' : 'bg-red-500'}`} />
      <span className={`text-[10px] uppercase tracking-widest font-bold ${user.active ? 'text-tertiary' : 'text-red-500'}`}>
        {user.active ? 'Hoạt động' : 'Đã khóa'}
      </span>
    </div>
  );

  return (
    <div className="w-full bg-[var(--color-background)] min-h-screen relative">
      <main className="pt-8 px-6 md:px-16 max-w-7xl mx-auto space-y-8 pb-32">
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-[0.2em] text-secondary font-semibold">Phân quyền & truy cập</p>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-primary tracking-tighter">Quản lý người dùng</h1>
          </div>
          {activeTab === 'staff' && (
            <button
              onClick={() => openEditor()}
              className="bg-tertiary text-white px-8 py-4 flex items-center justify-center space-x-3 hover:opacity-90 transition-opacity active:scale-95 group"
            >
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
            ] as const).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-5 py-3 text-xs uppercase tracking-widest font-bold border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-secondary text-secondary'
                    : 'border-transparent text-primary/50 hover:text-primary'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative group max-w-2xl">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-sm">search</span>
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full bg-transparent border-0 border-b border-outline-variant py-4 pl-12 focus:ring-0 focus:border-secondary transition-colors font-body text-sm placeholder:opacity-50 outline-none"
              placeholder="Tìm kiếm theo tên, email hoặc mã người dùng..."
              type="text"
            />
          </div>
        </section>

        <section className="bg-white shadow-sm border border-[#D0C5AF]/30 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low text-primary border-b border-outline-variant/40">
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold">
                    {activeTab === 'customer' ? 'Khách hàng' : 'Thành viên'}
                  </th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold">
                    {activeTab === 'customer' ? 'Liên hệ' : 'Vai trò'}
                  </th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold hidden lg:table-cell">
                    {activeTab === 'customer' ? 'Lịch sử đơn đặt' : 'Liên hệ'}
                  </th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold">
                    {activeTab === 'customer' ? 'Tổng số tiền đã chi' : 'Trạng thái'}
                  </th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold">
                    {activeTab === 'customer' ? 'Trạng thái' : ''}
                  </th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {filteredUsers.map((user) => {
                  const stats = getCustomerStats(bookings, user.id);
                  return (
                    <tr key={user.id} className="hover:bg-surface-container-low transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 overflow-hidden rounded-full border border-outline-variant/30 shrink-0 bg-gray-100">
                            <img src={user.avatar || createLocalAvatar(user.name)} alt={user.name} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-primary">{user.name}</p>
                            <p className="text-[10px] font-mono text-outline">{user.id}</p>
                          </div>
                        </div>
                      </td>
                      {activeTab === 'staff' ? (
                        <>
                          <td className="px-6 py-4">
                            <span className="px-3 py-1 bg-secondary/10 text-secondary text-[10px] font-bold uppercase tracking-wider border border-secondary/20">
                              {ROLE_LABEL[user.role]}
                            </span>
                          </td>
                          <td className="px-6 py-4 hidden lg:table-cell">
                            <p className="text-xs text-primary/80">{user.email}</p>
                            <p className="text-[10px] text-primary/50">{user.phone}</p>
                          </td>
                          <td className="px-6 py-4">{renderStatus(user)}</td>
                          <td className="px-6 py-4" />
                        </>
                      ) : (
                        <>
                          <td className="px-6 py-4">
                            <p className="text-xs text-primary/80">{user.email}</p>
                            <p className="text-[10px] text-primary/50">{user.phone}</p>
                          </td>
                          <td className="px-6 py-4 hidden lg:table-cell">
                            <button
                              onClick={() => setSelectedCustomer(user)}
                              className="text-left text-xs text-primary hover:text-secondary transition-colors"
                            >
                              <span className="font-bold">{stats.completedCount}</span> đơn thành công /{' '}
                              <span className="font-bold">{stats.cancelledCount}</span> đơn hủy
                              <span className="block text-[10px] uppercase tracking-widest text-secondary mt-1">Xem lịch sử</span>
                            </button>
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-primary">{formatMoney(stats.totalSpent)}</td>
                          <td className="px-6 py-4">{renderStatus(user)}</td>
                        </>
                      )}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          {activeTab === 'staff' ? (
                            <button
                              onClick={() => openEditor(user)}
                              className="text-primary/40 hover:text-secondary transition-colors"
                              aria-label={`Chỉnh sửa ${user.name}`}
                              title="Chỉnh sửa"
                            >
                              <span className="material-symbols-outlined text-[18px]">edit</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => setSelectedCustomer(user)}
                              className="text-primary/40 hover:text-secondary transition-colors"
                              aria-label={`Xem chi tiết ${user.name}`}
                              title="Xem chi tiết"
                            >
                              <span className="material-symbols-outlined text-[18px]">visibility</span>
                            </button>
                          )}
                          <button
                            onClick={() => setConfirmToggleUser(user)}
                            className={`${user.active ? 'text-primary/40 hover:text-red-600' : 'text-primary/40 hover:text-tertiary'} transition-colors`}
                            aria-label={`${user.active ? 'Khóa tài khoản' : 'Mở khóa'} ${user.name}`}
                            title={user.active ? 'Khóa tài khoản' : 'Mở khóa'}
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              {user.active ? 'block' : 'lock_open'}
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-sm text-primary/50">
                      Không có dữ liệu phù hợp.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <Modal
        open={isEditorOpen}
        onCancel={() => setIsEditorOpen(false)}
        onOk={() => void handleSaveUser()}
        okText={editingUser ? 'Lưu thay đổi' : 'Tạo tài khoản'}
        cancelText="Hủy bỏ"
        confirmLoading={isSubmitting}
        title={editingUser ? 'Chỉnh sửa tài khoản' : 'Thêm tài khoản mới'}
      >
        <div className="space-y-4 pt-2">
          <input
            value={formData.name}
            onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value }))}
            placeholder="Họ và tên"
            className="w-full border border-[#D0C5AF]/40 px-4 py-3 text-sm outline-none"
          />
          <input
            value={formData.email}
            onChange={(event) => setFormData((current) => ({ ...current, email: event.target.value }))}
            placeholder="Email"
            className="w-full border border-[#D0C5AF]/40 px-4 py-3 text-sm outline-none"
          />
          <input
            value={formData.phone}
            onChange={(event) => setFormData((current) => ({ ...current, phone: event.target.value }))}
            placeholder="Số điện thoại"
            className="w-full border border-[#D0C5AF]/40 px-4 py-3 text-sm outline-none"
          />
          <select
            value={formData.role}
            onChange={(event) => setFormData((current) => ({ ...current, role: event.target.value as Role }))}
            className="w-full border border-[#D0C5AF]/40 px-4 py-3 text-sm outline-none"
          >
            {STAFF_ROLES.map((role) => (
              <option key={role} value={role}>{ROLE_LABEL[role]}</option>
            ))}
          </select>
          <input
            value={formData.password}
            onChange={(event) => setFormData((current) => ({ ...current, password: event.target.value }))}
            placeholder={editingUser ? 'Mật khẩu mới (không bắt buộc)' : 'Mật khẩu'}
            className="w-full border border-[#D0C5AF]/40 px-4 py-3 text-sm outline-none"
          />
          <label className="flex items-center gap-3 text-sm text-primary">
            <input
              type="checkbox"
              checked={formData.active}
              onChange={(event) => setFormData((current) => ({ ...current, active: event.target.checked }))}
            />
            Hoạt động
          </label>
        </div>
      </Modal>

      <Modal
        open={Boolean(selectedCustomer)}
        onCancel={() => setSelectedCustomer(null)}
        footer={null}
        title="Chi tiết khách hàng"
      >
        {selectedCustomer && (
          <div className="space-y-4">
            <div>
              <p className="font-semibold text-primary">{selectedCustomer.name}</p>
              <p className="text-sm text-primary/60">{selectedCustomer.email} • {selectedCustomer.phone}</p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              {(() => {
                const stats = getCustomerStats(bookings, selectedCustomer.id);
                return (
                  <>
                    <div className="border border-[#D0C5AF]/30 p-3">
                      <p className="text-[10px] uppercase tracking-widest text-primary/50">Số đơn thành công</p>
                      <p className="mt-2 text-lg font-semibold">{stats.completedCount}</p>
                    </div>
                    <div className="border border-[#D0C5AF]/30 p-3">
                      <p className="text-[10px] uppercase tracking-widest text-primary/50">Số đơn hủy</p>
                      <p className="mt-2 text-lg font-semibold">{stats.cancelledCount}</p>
                    </div>
                    <div className="border border-[#D0C5AF]/30 p-3">
                      <p className="text-[10px] uppercase tracking-widest text-primary/50">Tổng số tiền đã chi</p>
                      <p className="mt-2 text-lg font-semibold">{formatMoney(stats.totalSpent)}</p>
                    </div>
                  </>
                );
              })()}
            </div>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {getCustomerStats(bookings, selectedCustomer.id).rows.map((booking) => (
                <div key={booking.id} className="border border-[#D0C5AF]/30 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-sm text-primary">{booking.bookingCode}</p>
                      <p className="text-xs text-primary/60">{booking.tourName}</p>
                    </div>
                    <span className="text-xs uppercase tracking-widest text-secondary">{booking.status}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-primary/60">
                    <span>{booking.tourDate}</span>
                    <span>{formatMoney(booking.paidAmount)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={Boolean(confirmToggleUser)}
        onCancel={() => setConfirmToggleUser(null)}
        onOk={() => void handleToggleStatus()}
        okText={confirmToggleUser?.active ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
        cancelText="Hủy"
        confirmLoading={isSubmitting}
        title={confirmToggleUser?.active ? 'Xác nhận khóa tài khoản' : 'Xác nhận mở khóa tài khoản'}
      >
        <p>
          {confirmToggleUser?.active ? 'Khóa' : 'Mở khóa'} tài khoản <strong>{confirmToggleUser?.name}</strong>?
        </p>
      </Modal>
    </div>
  );
}
