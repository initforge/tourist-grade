import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate successful registration and auto-login
    login('customer');
    navigate('/booking/success?type=register');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="w-full max-w-md animate-in fade-in duration-500">
      <div className="text-center mb-8">
        <h1 className="font-serif text-3xl text-[var(--color-primary)] tracking-tight mb-2">Travela</h1>
        <p className="text-[10px] uppercase tracking-[0.2em] font-medium text-[var(--color-secondary)]">Thành viên tinh hoa</p>
      </div>

      <div className="bg-white p-10 border border-[#D0C5AF]/30 shadow-sm relative">
        <div className="absolute top-0 w-full h-1 bg-[var(--color-tertiary)] left-0"></div>
        <h2 className="font-serif text-2xl text-[var(--color-primary)] mb-8 text-center">Đăng Ký</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1 relative group">
            <label className="text-[10px] uppercase tracking-widest text-[var(--color-primary)]/60 transition-colors group-focus-within:text-[var(--color-secondary)]">Họ và tên</label>
            <input 
              name="name"
              type="text" 
              required
              placeholder="Nguyễn Văn A"
              value={formData.name}
              onChange={handleChange}
              className="w-full border-b border-[#D0C5AF]/50 bg-transparent py-2 px-0 focus:ring-0 focus:border-[var(--color-secondary)] text-sm outline-none transition-colors"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1 relative group">
              <label className="text-[10px] uppercase tracking-widest text-[var(--color-primary)]/60 transition-colors group-focus-within:text-[var(--color-secondary)]">Điện thoại</label>
              <input 
                name="phone"
                type="tel" 
                required
                placeholder="0988..."
                value={formData.phone}
                onChange={handleChange}
                className="w-full border-b border-[#D0C5AF]/50 bg-transparent py-2 px-0 focus:ring-0 focus:border-[var(--color-secondary)] text-sm outline-none transition-colors"
              />
            </div>
            <div className="space-y-1 relative group">
              <label className="text-[10px] uppercase tracking-widest text-[var(--color-primary)]/60 transition-colors group-focus-within:text-[var(--color-secondary)]">Email</label>
              <input 
                name="email"
                type="email" 
                required
                placeholder="vip@travela.vn"
                value={formData.email}
                onChange={handleChange}
                className="w-full border-b border-[#D0C5AF]/50 bg-transparent py-2 px-0 focus:ring-0 focus:border-[var(--color-secondary)] text-sm outline-none transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1 relative group">
            <label className="text-[10px] uppercase tracking-widest text-[var(--color-primary)]/60 transition-colors group-focus-within:text-[var(--color-secondary)]">Mật khẩu</label>
            <input 
              name="password"
              type="password" 
              required
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              className="w-full border-b border-[#D0C5AF]/50 bg-transparent py-2 px-0 focus:ring-0 focus:border-[var(--color-secondary)] text-sm outline-none transition-colors tracking-widest"
            />
          </div>

          <div className="space-y-1 relative group">
            <label className="text-[10px] uppercase tracking-widest text-[var(--color-primary)]/60 transition-colors group-focus-within:text-[var(--color-secondary)]">Xác nhận mật khẩu</label>
            <input 
              name="confirmPassword"
              type="password" 
              required
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full border-b border-[#D0C5AF]/50 bg-transparent py-2 px-0 focus:ring-0 focus:border-[var(--color-secondary)] text-sm outline-none transition-colors tracking-widest"
            />
          </div>
          
          <button 
            type="submit"
            className="w-full bg-[var(--color-primary)] text-white py-4 mt-4 font-sans uppercase tracking-[0.2em] text-xs hover:bg-[var(--color-secondary)] transition-colors duration-300"
          >
            Tạo Tài Khoản
          </button>
        </form>

        <div className="mt-8 text-center border-t border-[var(--color-surface)] pt-6">
          <p className="text-xs text-[var(--color-primary)]/70">
            Đã có tài khoản?{' '}
            <Link to="/login" className="text-[var(--color-primary)] font-medium underline decoration-[var(--color-secondary)] underline-offset-4 hover:text-[var(--color-secondary)] transition-colors">
              Đăng Nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
