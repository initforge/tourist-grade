import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDataStore } from '@shared/store/useAppDataStore';

function formatCurrency(value: number) {
  return `${value.toLocaleString('vi-VN')}đ`;
}

function formatDuration(days: number, nights: number) {
  if (nights <= 0) return `${days} Ngày`;
  return `${days} Ngày / ${nights} Đêm`;
}

export default function Landing() {
  const navigate = useNavigate();
  const publicTours = useAppDataStore((state) => state.publicTours);
  const [search, setSearch] = useState('');
  const [budget, setBudget] = useState('all');
  const domesticTours = publicTours.filter((tour) => tour.category === 'domestic').slice(0, 4);
  const featuredTours = publicTours.slice(0, 4);
  const heroTour = publicTours[0];
  const highlightedReviews = publicTours
    .flatMap((tour) => (tour.reviews ?? []).slice(0, 1).map((review) => ({ ...review, tourTitle: tour.title })))
    .slice(0, 3);

  const submitSearch = () => {
    const params = new URLSearchParams();
    if (search.trim()) params.set('q', search.trim());
    if (budget !== 'all') params.set('budget', budget);
    navigate(`/tours${params.toString() ? `?${params.toString()}` : ''}`);
  };

  return (
    <div className="public-page">
      <section className="public-hero-banner flex items-center">
        <img
          className="absolute inset-0 w-full h-full object-cover"
          src={heroTour?.image ?? 'https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=1400'}
          alt={heroTour?.title ?? 'Du lịch Việt Nam'}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/25 via-primary/15 to-surface/95" />

        <div className="public-container relative z-10 public-hero">
          <div className="public-copy-width">
            <span className="inline-flex items-center gap-2 text-white/85 text-[0.72rem] uppercase tracking-[0.25em] mb-5">
              <span className="w-10 h-px bg-white/70" />
              Tour nội địa cao cấp
            </span>
            <h1 className="font-headline text-4xl md:text-5xl lg:text-6xl text-white tracking-tighter drop-shadow-sm">
              Khám phá Việt Nam cùng Travela
            </h1>
            <p className="mt-5 text-sm md:text-base text-white/85 leading-relaxed max-w-2xl">
              Dữ liệu tour, giá, lịch trình và trạng thái được đồng bộ từ backend local qua API cho luồng đặt tour và vận hành.
            </p>
          </div>

          <div className="public-floating-card mt-8 md:mt-10 p-3 md:p-4 max-w-5xl">
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto] gap-3">
              <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-outline-variant/30">
                <div className="flex flex-col items-start px-4 py-3">
                  <label className="text-[0.65rem] uppercase tracking-widest text-secondary font-semibold mb-1">Điểm đến</label>
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    onKeyDown={(event) => event.key === 'Enter' && submitSearch()}
                    className="w-full bg-transparent border-none p-0 text-primary focus:ring-0 placeholder:text-primary/40 text-sm"
                    placeholder="Hạ Long, Ninh Thuận, Kyoto..."
                    type="text"
                  />
                </div>
                <div className="flex flex-col items-start px-4 py-3">
                  <label className="text-[0.65rem] uppercase tracking-widest text-secondary font-semibold mb-1">Thời gian</label>
                  <input
                    onKeyDown={(event) => event.key === 'Enter' && submitSearch()}
                    className="w-full bg-transparent border-none p-0 text-primary focus:ring-0 placeholder:text-primary/40 text-sm"
                    placeholder="Chọn trên trang chi tiết tour"
                    type="text"
                  />
                </div>
                <div className="flex flex-col items-start px-4 py-3">
                  <label className="text-[0.65rem] uppercase tracking-widest text-secondary font-semibold mb-1">Ngân sách</label>
                  <select value={budget} onChange={(event) => setBudget(event.target.value)} className="w-full bg-transparent border-none p-0 text-primary focus:ring-0 text-sm">
                    <option value="all">Tất cả mức giá</option>
                    <option value="under-5m">Dưới 5.000.000đ</option>
                    <option value="5m-10m">Từ 5.000.000đ - 10.000.000đ</option>
                    <option value="over-10m">Trên 10.000.000đ</option>
                  </select>
                </div>
              </div>
              <button type="button" onClick={submitSearch} className="w-full lg:w-auto bg-primary text-white px-7 py-4 font-serif text-sm uppercase tracking-widest hover:bg-secondary transition-colors duration-500 text-center">
                Tìm kiếm tour
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="public-section bg-surface">
        <div className="public-container">
          <div className="grid gap-4 md:grid-cols-3 mb-10">
            <div className="public-floating-card p-5">
              <p className="text-[10px] uppercase tracking-[0.22em] text-secondary font-semibold mb-2">Lịch khởi hành</p>
              <p className="font-headline text-3xl text-primary">{publicTours.reduce((sum, tour) => sum + tour.departureSchedule.length, 0)}</p>
              <p className="text-sm text-primary/55 mt-2">Lấy trực tiếp từ dữ liệu điều phối đang mở bán.</p>
            </div>
            <div className="public-floating-card p-5">
              <p className="text-[10px] uppercase tracking-[0.22em] text-secondary font-semibold mb-2">Đánh giá thật</p>
              <p className="font-headline text-3xl text-primary">{publicTours.reduce((sum, tour) => sum + (tour.reviewCount ?? 0), 0)}</p>
              <p className="text-sm text-primary/55 mt-2">Hiển thị theo tour đã hoàn thành và đã gửi đánh giá.</p>
            </div>
            <div className="public-floating-card p-5">
              <p className="text-[10px] uppercase tracking-[0.22em] text-secondary font-semibold mb-2">Theo dõi booking</p>
              <p className="font-headline text-3xl text-primary">3 bước</p>
              <p className="text-sm text-primary/55 mt-2">Điền thông tin, thanh toán, quay lại kiểm tra trạng thái ngay.</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <span className="text-secondary font-serif italic text-xl mb-3 block">Dữ liệu từ hệ thống</span>
              <h2 className="font-headline text-3xl md:text-4xl tracking-tighter text-primary uppercase">Tour đang mở bán</h2>
            </div>
            <Link to="/tours" className="text-xs uppercase tracking-[0.22em] font-bold text-primary border-b border-primary pb-2 w-fit">
              Xem tất cả
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {featuredTours.map((tour) => (
              <Link key={tour.id} to={`/tours/${tour.slug}`} className="group block bg-white border border-outline-variant/70 p-4 hover:shadow-lg transition-all duration-300">
                <div className="aspect-[4/3] overflow-hidden mb-4 bg-surface">
                  <img src={tour.image} alt={tour.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                </div>
                <div className="text-[0.65rem] uppercase tracking-widest font-bold text-primary/70 mb-2">
                  {tour.category === 'domestic' ? 'Tour nội địa' : 'Tour quốc tế'}
                </div>
                <h3 className="font-headline text-xl text-primary leading-tight min-h-[3.2rem]">{tour.title}</h3>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-primary/60">{formatDuration(tour.duration.days, tour.duration.nights)}</span>
                  <strong className="italic text-primary">Từ {formatCurrency(tour.price.adult)}</strong>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="public-section bg-white">
        <div className="public-container">
          <div className="flex items-end justify-between gap-6 mb-8">
            <h2 className="font-headline text-3xl md:text-4xl tracking-tighter text-primary">Hành trình trong nước</h2>
            <Link to="/tours?region=all" className="text-xs uppercase tracking-[0.22em] font-bold text-primary border-b border-primary pb-2 w-fit">
              Lọc thêm
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-7">
            {domesticTours.map((tour) => (
              <Link key={tour.id} to={`/tours/${tour.slug}`} className="group border border-primary/80 bg-surface p-5 hover:bg-white transition-colors">
                <img src={tour.image} alt={tour.title} className="w-full aspect-[4/3] object-cover mb-5" />
                <div className="text-[0.65rem] uppercase tracking-widest font-bold text-primary mb-3">
                  {tour.departurePoint} → {tour.arrivalPoint ?? tour.sightseeingSpots[0] ?? 'Việt Nam'}
                </div>
                <h3 className="font-headline text-2xl text-primary leading-tight min-h-[4rem]">{tour.title}</h3>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-primary/60">{formatDuration(tour.duration.days, tour.duration.nights)}</span>
                  <strong className="italic text-primary">Từ {formatCurrency(tour.price.adult)}</strong>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="public-section bg-surface">
        <div className="public-container">
          <div className="flex items-end justify-between gap-6 mb-8">
            <div>
              <span className="text-secondary font-serif italic text-xl mb-3 block">Trải nghiệm từ khách thật</span>
              <h2 className="font-headline text-3xl md:text-4xl tracking-tighter text-primary">Nhận xét mới nhất</h2>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {highlightedReviews.length > 0 ? highlightedReviews.map((review) => (
              <article key={review.id} className="public-floating-card p-6">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <p className="font-semibold text-primary">{review.authorName}</p>
                  <div className="flex text-secondary">
                    {Array.from({ length: review.rating }).map((_, index) => (
                      <span key={index} className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                        star
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-primary/75 leading-relaxed mb-4 line-clamp-4">{review.comment}</p>
                <p className="text-xs uppercase tracking-[0.18em] text-primary/45">{review.tourTitle}</p>
              </article>
            )) : (
              <div className="md:col-span-3 public-floating-card p-6 text-sm text-primary/55">
                Chưa có đủ dữ liệu đánh giá để hiển thị nổi bật trên trang chủ.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
