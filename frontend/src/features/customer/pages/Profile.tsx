import React, { useEffect, useState } from 'react';
import { message } from 'antd';
import { ApiError } from '@shared/lib/api/client';
import { changePassword, updateProfile } from '@shared/lib/api/users';
import { useAuthStore } from '@shared/store/useAuthStore';

export default function Profile() {
  const { user, accessToken, initialize } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'info' | 'security'>('info');
  const [profileForm, setProfileForm] = useState({ name: '', phone: '', avatar: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  useEffect(() => {
    setProfileForm({
      name: user?.name ?? '',
      phone: user?.phone ?? '',
      avatar: user?.avatar ?? '',
    });
  }, [user]);

  const handleSaveProfile = async () => {
    if (!accessToken) return;
    setIsSavingProfile(true);

    try {
      await updateProfile(accessToken, profileForm);
      await initialize();
      message.success('Đã cập nhật hồ sơ.');
    } catch (error) {
      message.error(error instanceof ApiError ? error.message : 'Cập nhật hồ sơ thất bại');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!accessToken) return;

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      message.error('Xác nhận mật khẩu mới không khớp');
      return;
    }

    setIsSavingPassword(true);

    try {
      await changePassword(accessToken, {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      message.success('Đã cập nhật mật khẩu.');
    } catch (error) {
      message.error(error instanceof ApiError ? error.message : 'Cập nhật mật khẩu thất bại');
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[var(--color-background)] pt-16 pb-24">
      <div className="max-w-4xl mx-auto px-6">
        <h1 className="font-serif text-3xl text-[var(--color-primary)] mb-8">Hồ Sơ Cá Nhân</h1>

        <div className="bg-white border border-[#D0C5AF]/30 shadow-sm flex flex-col md:flex-row">
          <div className="md:w-1/3 border-r border-[#D0C5AF]/30 bg-[var(--color-surface)] p-8">
            <div className="flex flex-col items-center mb-8">
              <div className="w-24 h-24 rounded-full bg-white border-2 border-[var(--color-secondary)] overflow-hidden mb-4 shadow-sm">
                <img src={profileForm.avatar || user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200'} alt="Avatar" className="w-full h-full object-cover" />
              </div>
              <h2 className="font-serif text-lg font-medium text-[var(--color-primary)]">{user?.name}</h2>
              <span className="text-[10px] uppercase tracking-widest text-[var(--color-primary)]/50 mt-1">{user?.role} account</span>
            </div>

            <nav className="flex flex-col gap-2">
              <button
                onClick={() => setActiveTab('info')}
                className={`text-left px-4 py-3 text-sm transition-colors flex items-center gap-3 ${activeTab === 'info' ? 'bg-[var(--color-background)] font-medium text-[var(--color-primary)] border-l-2 border-[var(--color-secondary)]' : 'text-[var(--color-primary)]/60 hover:bg-black/5'}`}
              >
                <span className="material-symbols-outlined text-[18px]">person</span>
                Thông tin chung
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`text-left px-4 py-3 text-sm transition-colors flex items-center gap-3 ${activeTab === 'security' ? 'bg-[var(--color-background)] font-medium text-[var(--color-primary)] border-l-2 border-[var(--color-secondary)]' : 'text-[var(--color-primary)]/60 hover:bg-black/5'}`}
              >
                <span className="material-symbols-outlined text-[18px]">lock</span>
                Bảo mật
              </button>
            </nav>
          </div>

          <div className="flex-1 p-8 md:p-12">
            {activeTab === 'info' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <h3 className="font-serif text-xl border-b border-[#D0C5AF]/30 pb-4 mb-6 text-[var(--color-primary)]">Thông tin tài khoản</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest text-[var(--color-primary)]/60">Họ và tên</label>
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={(event) => setProfileForm((current) => ({ ...current, name: event.target.value }))}
                      className="w-full border-b border-[#D0C5AF]/50 bg-transparent py-2 px-0 focus:ring-0 focus:border-[var(--color-secondary)] text-sm outline-none transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest text-[var(--color-primary)]/60">Số điện thoại</label>
                    <input
                      type="tel"
                      value={profileForm.phone}
                      onChange={(event) => setProfileForm((current) => ({ ...current, phone: event.target.value }))}
                      className="w-full border-b border-[#D0C5AF]/50 bg-transparent py-2 px-0 focus:ring-0 focus:border-[var(--color-secondary)] text-sm outline-none transition-colors"
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] uppercase tracking-widest text-[var(--color-primary)]/60">Email</label>
                    <input
                      type="email"
                      value={user?.email ?? ''}
                      readOnly
                      disabled
                      className="w-full border-b border-[#D0C5AF]/30 bg-transparent py-2 px-0 text-sm outline-none text-[var(--color-primary)]/50 cursor-not-allowed"
                    />
                    <p className="text-xs text-[var(--color-primary)]/40 mt-1 italic">Email không thể thay đổi sau khi đăng ký.</p>
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] uppercase tracking-widest text-[var(--color-primary)]/60">Ảnh đại diện</label>
                    <input
                      type="text"
                      value={profileForm.avatar}
                      onChange={(event) => setProfileForm((current) => ({ ...current, avatar: event.target.value }))}
                      placeholder="https://..."
                      className="w-full border-b border-[#D0C5AF]/50 bg-transparent py-2 px-0 focus:ring-0 focus:border-[var(--color-secondary)] text-sm outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="pt-6">
                  <button
                    onClick={handleSaveProfile}
                    disabled={isSavingProfile}
                    className="bg-[var(--color-primary)] text-white px-8 py-3 text-xs uppercase tracking-widest hover:bg-[var(--color-secondary)] transition-colors disabled:opacity-60"
                  >
                    {isSavingProfile ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <h3 className="font-serif text-xl border-b border-[#D0C5AF]/30 pb-4 mb-6 text-[var(--color-primary)]">Đổi Mật Khẩu</h3>

                <div className="space-y-6">
                  <div className="space-y-1 max-w-sm">
                    <label className="text-[10px] uppercase tracking-widest text-[var(--color-primary)]/60">Mật khẩu hiện tại</label>
                    <input
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(event) => setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))}
                      placeholder="••••••••"
                      className="w-full border-b border-[#D0C5AF]/50 bg-transparent py-2 px-0 focus:ring-0 focus:border-[var(--color-secondary)] text-sm outline-none transition-colors tracking-widest"
                    />
                  </div>
                  <div className="space-y-1 max-w-sm">
                    <label className="text-[10px] uppercase tracking-widest text-[var(--color-primary)]/60">Mật khẩu mới</label>
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(event) => setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))}
                      placeholder="••••••••"
                      className="w-full border-b border-[#D0C5AF]/50 bg-transparent py-2 px-0 focus:ring-0 focus:border-[var(--color-secondary)] text-sm outline-none transition-colors tracking-widest"
                    />
                  </div>
                  <div className="space-y-1 max-w-sm">
                    <label className="text-[10px] uppercase tracking-widest text-[var(--color-primary)]/60">Xác nhận mật khẩu mới</label>
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(event) => setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))}
                      placeholder="••••••••"
                      className="w-full border-b border-[#D0C5AF]/50 bg-transparent py-2 px-0 focus:ring-0 focus:border-[var(--color-secondary)] text-sm outline-none transition-colors tracking-widest"
                    />
                  </div>
                </div>

                <div className="pt-6">
                  <button
                    onClick={handleChangePassword}
                    disabled={isSavingPassword}
                    className="bg-[var(--color-primary)] text-white px-8 py-3 text-xs uppercase tracking-widest hover:border-[var(--color-secondary)] hover:bg-[var(--color-secondary)] transition-colors disabled:opacity-60"
                  >
                    {isSavingPassword ? 'Đang cập nhật...' : 'Cập Nhật Mật Khẩu'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
