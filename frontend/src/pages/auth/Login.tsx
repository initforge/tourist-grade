import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.includes('admin')) {
      login('admin');
      navigate('/admin/users');
    } else if (email.includes('sales')) {
      login('sales');
      navigate('/sales');
    } else if (email.includes('coordinator')) {
      login('coordinator');
      navigate('/coordinator');
    } else if (email.includes('manager')) {
      login('manager');
      navigate('/manager');
    } else {
      login('customer');
      navigate('/');
    }
  };

  return (
    <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
      <div className="text-center mb-10">
        <h1 className="font-serif text-4xl text-[var(--color-primary)] tracking-tight mb-3">Travela</h1>
        <p className="text-[10px] uppercase tracking-[0.2em] font-medium text-[var(--color-secondary)]">Khám phá vẻ đẹp di sản dải đất hình chữ S</p>
      </div>

      <div className="bg-white p-10 border border-[#D0C5AF]/30 shadow-sm relative">
        <div className="absolute top-0 w-full h-1 bg-[var(--color-secondary)] left-0"></div>
        <h2 className="font-serif text-2xl text-[var(--color-primary)] mb-8 text-center">Đăng Nhập</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1 relative group">
            <label className="text-[10px] uppercase tracking-widest text-[var(--color-primary)]/60 transition-colors group-focus-within:text-[var(--color-secondary)]">Email đăng nhập</label>
            <input 
              type="text" 
              required
              placeholder="customer@travela.vn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border-b border-[#D0C5AF]/50 bg-transparent py-2 px-0 focus:ring-0 focus:border-[var(--color-secondary)] text-sm outline-none transition-colors"
            />
          </div>
          <div className="space-y-1 relative group">
            <label className="text-[10px] uppercase tracking-widest text-[var(--color-primary)]/60 transition-colors group-focus-within:text-[var(--color-secondary)]">Mật khẩu</label>
            <input 
              type="password" 
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border-b border-[#D0C5AF]/50 bg-transparent py-2 px-0 focus:ring-0 focus:border-[var(--color-secondary)] text-sm outline-none transition-colors tracking-widest"
            />
          </div>
          
          <button 
            type="submit"
            className="w-full bg-[var(--color-primary)] text-white py-4 mt-4 font-sans uppercase tracking-[0.2em] text-xs hover:bg-[var(--color-secondary)] transition-colors duration-300"
          >
            Đăng Nhập
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-xs text-[var(--color-primary)]/70">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="text-[var(--color-primary)] font-medium underline decoration-[var(--color-secondary)] underline-offset-4 hover:text-[var(--color-secondary)] transition-colors">
              Đăng Ký Tài Khoản
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
