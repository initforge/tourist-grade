import React, { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';

export default function Profile() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('info');

  return (
    <div className="w-full min-h-screen bg-[var(--color-background)] pt-16 pb-24">
      <div className="max-w-4xl mx-auto px-6">
        <h1 className="font-serif text-3xl text-[var(--color-primary)] mb-8">Hồ Sơ Cá Nhân</h1>
        
        <div className="bg-white border border-[#D0C5AF]/30 shadow-sm flex flex-col md:flex-row">
          {/* Sidebar */}
          <div className="md:w-1/3 border-r border-[#D0C5AF]/30 bg-[var(--color-surface)] p-8">
            <div className="flex flex-col items-center mb-8">
              <div className="w-24 h-24 rounded-full bg-white border-2 border-[var(--color-secondary)] overflow-hidden mb-4 shadow-sm">
                <img src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200'} alt="Avatar" className="w-full h-full object-cover" />
              </div>
              <h2 className="font-serif text-lg font-medium text-[var(--color-primary)]">{user?.name}</h2>
              <span className="text-[10px] uppercase tracking-widest text-[var(--color-primary)]/50 mt-1">{user?.role} Account</span>
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

          {/* Content */}
          <div className="flex-1 p-8 md:p-12">
            {activeTab === 'info' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <h3 className="font-serif text-xl border-b border-[#D0C5AF]/30 pb-4 mb-6 text-[var(--color-primary)]">Thông tin cung</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest text-[var(--color-primary)]/60">Họ và tên</label>
                    <input 
                      type="text" 
                      defaultValue={user?.name}
                      className="w-full border-b border-[#D0C5AF]/50 bg-transparent py-2 px-0 focus:ring-0 focus:border-[var(--color-secondary)] text-sm outline-none transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest text-[var(--color-primary)]/60">Số điện thoại</label>
                    <input 
                      type="tel" 
                      defaultValue="0988 123 456"
                      className="w-full border-b border-[#D0C5AF]/50 bg-transparent py-2 px-0 focus:ring-0 focus:border-[var(--color-secondary)] text-sm outline-none transition-colors"
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] uppercase tracking-widest text-[var(--color-primary)]/60">Email</label>
                    <input 
                      type="email" 
                      defaultValue="customer.luxury@travela.vn"
                      disabled
                      className="w-full border-b border-[#D0C5AF]/30 bg-transparent py-2 px-0 text-sm outline-none text-[var(--color-primary)]/50 cursor-not-allowed"
                    />
                    <p className="text-xs text-[var(--color-primary)]/40 mt-1 italic">Email không thể thay đổi sau khi đăng ký.</p>
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] uppercase tracking-widest text-[var(--color-primary)]/60">Địa chỉ</label>
                    <input 
                      type="text" 
                      defaultValue="Landmark 81, Vinhomes Central Park, Q.Bình Thạnh, TP.HCM"
                      className="w-full border-b border-[#D0C5AF]/50 bg-transparent py-2 px-0 focus:ring-0 focus:border-[var(--color-secondary)] text-sm outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="pt-6">
                  <button className="bg-[var(--color-primary)] text-white px-8 py-3 text-xs uppercase tracking-widest hover:bg-[var(--color-secondary)] transition-colors">
                    Lưu Thay Đổi
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
                      placeholder="••••••••"
                      className="w-full border-b border-[#D0C5AF]/50 bg-transparent py-2 px-0 focus:ring-0 focus:border-[var(--color-secondary)] text-sm outline-none transition-colors tracking-widest"
                    />
                  </div>
                  <div className="space-y-1 max-w-sm">
                    <label className="text-[10px] uppercase tracking-widest text-[var(--color-primary)]/60">Mật khẩu mới</label>
                    <input 
                      type="password" 
                      placeholder="••••••••"
                      className="w-full border-b border-[#D0C5AF]/50 bg-transparent py-2 px-0 focus:ring-0 focus:border-[var(--color-secondary)] text-sm outline-none transition-colors tracking-widest"
                    />
                  </div>
                  <div className="space-y-1 max-w-sm">
                    <label className="text-[10px] uppercase tracking-widest text-[var(--color-primary)]/60">Xác nhận mật khẩu mới</label>
                    <input 
                      type="password" 
                      placeholder="••••••••"
                      className="w-full border-b border-[#D0C5AF]/50 bg-transparent py-2 px-0 focus:ring-0 focus:border-[var(--color-secondary)] text-sm outline-none transition-colors tracking-widest"
                    />
                  </div>
                </div>

                <div className="pt-6">
                  <button className="bg-[var(--color-primary)] text-white px-8 py-3 text-xs uppercase tracking-widest hover:border-[var(--color-secondary)] hover:bg-[var(--color-secondary)] transition-colors">
                    Cập Nhật Mật Khẩu
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
