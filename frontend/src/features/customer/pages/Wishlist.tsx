import { useNavigate } from 'react-router-dom';
import { removeWishlistItem } from '@shared/lib/api/wishlist';
import { useAuthStore } from '@shared/store/useAuthStore';
import { useRequireAuth } from '@shared/hooks/useAuthGuard';
import { useAppDataStore } from '@shared/store/useAppDataStore';

export default function Wishlist() {
  useRequireAuth('/login?redirect=/customer/wishlist');
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const tours = useAppDataStore((state) => state.publicTours);
  const wishlist = useAppDataStore((state) => state.wishlist);
  const removeWishlistStoreItem = useAppDataStore((state) => state.removeWishlistItem);

  const wishlistedTours = tours.filter((tour) => wishlist.some((item) => item.tourId === tour.id));

  const handleRemove = async (id: string) => {
    await removeWishlistItem(id, accessToken);
    removeWishlistStoreItem(id);
  };

  return (
    <div className="w-full bg-[var(--color-background)] min-h-screen pt-16 pb-32">
      <main className="max-w-5xl mx-auto px-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="material-symbols-outlined text-[32px] text-[var(--color-tertiary)]" style={{ fontVariationSettings: "'FILL' 1" }}>
            favorite
          </span>
          <h1 className="font-serif text-3xl text-[var(--color-primary)]">Wishlist của tôi</h1>
        </div>
        <p className="text-sm text-[var(--color-primary)]/60 mb-10">
          {user ? `Xin chào, ${user.name.split(' ').slice(-1)[0]}! ` : ''}
          Lưu trữ những hành trình bạn đang cân nhắc.
        </p>

        {wishlistedTours.length === 0 ? (
          <div className="text-center py-24 border border-[#D0C5AF]/30 bg-white">
            <span className="material-symbols-outlined text-[48px] text-[var(--color-primary)]/20 mb-4 block" style={{ fontVariationSettings: "'FILL' 1" }}>
              heart_broken
            </span>
            <p className="text-[var(--color-primary)]/60 text-sm mb-6">Bạn chưa lưu tour nào vào wishlist.</p>
            <button
              onClick={() => navigate('/tours')}
              className="px-8 py-3 bg-[var(--color-primary)] text-white font-sans uppercase tracking-[0.1em] text-xs hover:bg-[var(--color-secondary)] transition-colors"
            >
              Khám phá tour ngay
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlistedTours.map((tour) => (
              <div key={tour.id} className="bg-white border border-[#D0C5AF]/40 shadow-sm group relative flex flex-col">
                <button
                  onClick={() => void handleRemove(tour.id)}
                  className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-full hover:bg-[#ba1a1a] hover:text-white text-[var(--color-tertiary)] transition-colors shadow-sm"
                  title="Xóa khỏi wishlist"
                >
                  <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    favorite
                  </span>
                </button>

                <div className="h-48 overflow-hidden cursor-pointer" onClick={() => navigate(`/tours/${tour.slug}`)}>
                  <img
                    src={tour.image}
                    alt={tour.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-secondary mb-2 font-label">
                      <span className="material-symbols-outlined text-[14px]">schedule</span>
                      {tour.duration.days}N{tour.duration.nights}Đ
                    </div>
                    <h3
                      onClick={() => navigate(`/tours/${tour.slug}`)}
                      className="font-serif text-base text-primary hover:text-[var(--color-secondary)] cursor-pointer transition-colors line-clamp-2 leading-snug mb-2"
                    >
                      {tour.title}
                    </h3>
                    {typeof tour.rating === 'number' && (
                      <div className="flex items-center gap-1 text-xs text-primary/50 mb-3">
                        <span className="material-symbols-outlined text-[14px] text-[var(--color-secondary)]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        {tour.rating.toFixed(1)} · {tour.reviewCount ?? 0} đánh giá
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-outline-variant/30 flex items-center justify-between">
                    <div>
                      <p className="font-serif text-lg text-primary font-medium">
                        {tour.price.adult.toLocaleString('vi-VN')}đ
                      </p>
                      <p className="text-[10px] text-primary/40">/ người lớn</p>
                    </div>
                    <button
                      onClick={() => navigate(`/tours/${tour.slug}`)}
                      className="px-5 py-2.5 bg-[var(--color-primary)] text-white font-sans uppercase tracking-[0.1em] text-[10px] hover:bg-[var(--color-secondary)] transition-colors"
                    >
                      Đặt tour
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
