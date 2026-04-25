import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError } from '@shared/lib/api/client';
import { useAuthStore } from '@shared/store/useAuthStore';

const roleRedirects: Record<string, string> = {
  admin: '/admin/users',
  manager: '/manager/dashboard',
  coordinator: '/coordinator/dashboard',
  sales: '/sales/dashboard',
  customer: '/',
};

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const user = await login(email, password);
      navigate(roleRedirects[user.role] ?? '/', { replace: true });
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Đăng nhập thất bại');
    } finally {
      setIsSubmitting(false);
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
              type="email"
              required
              placeholder="customer@travela.vn"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
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
              onChange={(event) => setPassword(event.target.value)}
              className="w-full border-b border-[#D0C5AF]/50 bg-transparent py-2 px-0 focus:ring-0 focus:border-[var(--color-secondary)] text-sm outline-none transition-colors tracking-widest"
            />
          </div>

          {errorMessage && (
            <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[var(--color-primary)] text-white py-4 mt-4 font-sans uppercase tracking-[0.2em] text-xs hover:bg-[var(--color-secondary)] transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Đang xử lý...' : 'Đăng Nhập'}
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
