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
  const publicBlogs = useAppDataStore((state) => state.publicBlogs);
  const [search, setSearch] = useState('');
  const [travelDate, setTravelDate] = useState('');
  const [budget, setBudget] = useState('all');
  const featuredTours = [...publicTours]
    .sort((left, right) => (right.reviewCount ?? 0) - (left.reviewCount ?? 0))
    .slice(0, 6);
  const promoTours = publicTours.filter((tour) => tour.originalPrice && tour.originalPrice > tour.price.adult).slice(0, 3);
  const regionGroups = [
    { key: 'north', label: 'Miền Bắc', terms: ['Hà Nội', 'Hạ Long', 'Sa Pa', 'Lào Cai', 'Ninh Bình'] },
    { key: 'central', label: 'Miền Trung', terms: ['Ninh Thuận', 'Đà Nẵng', 'Huế', 'Hội An', 'Quảng Nam'] },
    { key: 'south', label: 'Miền Nam', terms: ['Hồ Chí Minh', 'Phú Quốc', 'Cần Thơ', 'Vũng Tàu'] },
  ].map((region) => ({
    ...region,
    tours: publicTours.filter((tour) => {
      const haystack = [tour.title, tour.departurePoint, tour.arrivalPoint, ...tour.sightseeingSpots].join(' ').toLowerCase();
      return region.terms.some((term) => haystack.includes(term.toLowerCase()));
    }).slice(0, 3),
  }));
  const heroTour = publicTours[0];
  const highlightedReviews = publicTours
    .flatMap((tour) => (tour.reviews ?? []).slice(0, 1).map((review) => ({ ...review, tourTitle: tour.title })))
    .slice(0, 3);

  const submitSearch = () => {
    const params = new URLSearchParams();
    if (search.trim()) params.set('q', search.trim());
    if (travelDate) params.set('date', travelDate);
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

        <div className="public-container relative z-10 public-hero text-center">
          <div className="mx-auto max-w-3xl">
            <span className="inline-flex items-center justify-center gap-2 text-white/85 text-[0.72rem] uppercase tracking-[0.25em] mb-5">
              <span className="w-10 h-px bg-white/70" />
              Tour nội địa cao cấp
              <span className="w-10 h-px bg-white/70" />
            </span>
            <h1 className="font-headline text-4xl md:text-5xl lg:text-6xl text-white tracking-tighter drop-shadow-sm">
              Khám phá Việt Nam cùng Travela
            </h1>
          </div>

          <div className="public-floating-card mt-8 md:mt-10 p-3 md:p-4 max-w-5xl mx-auto text-left">
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
                    value={travelDate}
                    onChange={(event) => setTravelDate(event.target.value)}
                    className="w-full bg-transparent border-none p-0 text-primary focus:ring-0 text-sm"
                    type="date"
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
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <span className="text-secondary font-serif italic text-xl mb-3 block">Nhiều lượt quan tâm</span>
              <h2 className="font-headline text-3xl md:text-4xl tracking-tighter text-primary uppercase">Tour hot</h2>
            </div>
            <Link to="/tours" className="text-xs uppercase tracking-[0.22em] font-bold text-primary border-b border-primary pb-2 w-fit">
              Xem tất cả
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
          <div className="mb-10">
            <span className="text-secondary font-serif italic text-xl mb-3 block">Theo vùng miền</span>
            <h2 className="font-headline text-3xl md:text-4xl tracking-tighter text-primary uppercase">Tour theo điểm đến</h2>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            {regionGroups.map((region) => (
              <div key={region.key} className="border border-outline-variant/60 bg-surface p-5">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <h3 className="font-headline text-2xl text-primary">{region.label}</h3>
                  <Link to={`/tours?region=${region.key}`} className="text-[10px] uppercase tracking-[0.18em] font-bold text-secondary">Xem</Link>
                </div>
                <div className="space-y-3">
                  {(region.tours.length > 0 ? region.tours : publicTours.slice(0, 2)).map((tour) => (
                    <Link key={`${region.key}-${tour.id}`} to={`/tours/${tour.slug}`} className="grid grid-cols-[88px_minmax(0,1fr)] gap-3 bg-white p-3 hover:shadow-md transition-shadow">
                      <img src={tour.image} alt={tour.title} className="h-16 w-full object-cover" />
                      <div className="min-w-0">
                        <p className="line-clamp-2 text-sm font-semibold text-primary">{tour.title}</p>
                        <p className="mt-1 text-xs text-primary/55">{formatCurrency(tour.price.adult)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {promoTours.length > 0 && (
        <section className="public-section bg-surface">
          <div className="public-container">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
              <div>
                <span className="text-secondary font-serif italic text-xl mb-3 block">Ưu đãi đang áp dụng</span>
                <h2 className="font-headline text-3xl md:text-4xl tracking-tighter text-primary uppercase">Khuyến mãi</h2>
              </div>
              <Link to="/tours" className="text-xs uppercase tracking-[0.22em] font-bold text-primary border-b border-primary pb-2 w-fit">
                Xem tour giảm giá
              </Link>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              {promoTours.map((tour) => (
                <Link key={`promo-${tour.id}`} to={`/tours/${tour.slug}`} className="group bg-white border border-outline-variant/70 overflow-hidden">
                  <div className="aspect-[16/10] overflow-hidden">
                    <img src={tour.image} alt={tour.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  </div>
                  <div className="p-5">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-tertiary font-bold">Đang giảm giá</p>
                    <h3 className="mt-2 font-headline text-xl text-primary line-clamp-2">{tour.title}</h3>
                    <div className="mt-4 flex items-end gap-3">
                      <span className="text-sm text-primary/35 line-through">{formatCurrency(tour.originalPrice ?? tour.price.adult)}</span>
                      <strong className="text-xl text-tertiary">{formatCurrency(tour.price.adult)}</strong>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="public-section bg-white">
        <div className="public-container">
          <div className="mb-10">
            <span className="text-secondary font-serif italic text-xl mb-3 block">Dịch vụ vận hành rõ ràng</span>
            <h2 className="font-headline text-3xl md:text-4xl tracking-tighter text-primary uppercase">Lý do chọn Travela</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-4">
            {[
              ['verified', 'Lịch khởi hành từ hệ thống'],
              ['payments', 'Thanh toán trực tuyến theo từng mốc'],
              ['support_agent', 'Điều phối và xác nhận nhanh'],
              ['rate_review', 'Đánh giá sau chuyến đi'],
            ].map(([icon, label]) => (
              <div key={label} className="border border-outline-variant/60 p-5">
                <span className="material-symbols-outlined text-3xl text-secondary">{icon}</span>
                <p className="mt-4 font-semibold text-primary">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {highlightedReviews.length > 0 && (
        <section className="public-section bg-white">
          <div className="public-container">
            <div className="flex items-end justify-between gap-6 mb-8">
              <div>
                <span className="text-secondary font-serif italic text-xl mb-3 block">Trải nghiệm từ khách thật</span>
                <h2 className="font-headline text-3xl md:text-4xl tracking-tighter text-primary">Đánh giá tour</h2>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {highlightedReviews.map((review) => (
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
              ))}
            </div>
          </div>
        </section>
      )}

      {publicBlogs.length > 0 && (
        <section className="public-section bg-surface">
          <div className="public-container">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
              <div>
                <span className="text-secondary font-serif italic text-xl mb-3 block">Cẩm nang du lịch</span>
                <h2 className="font-headline text-3xl md:text-4xl tracking-tighter text-primary uppercase">Blog</h2>
              </div>
              <Link to="/blog" className="text-xs uppercase tracking-[0.22em] font-bold text-primary border-b border-primary pb-2 w-fit">
                Xem bài viết
              </Link>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              {publicBlogs.slice(0, 3).map((post) => (
                <Link key={post.id} to={`/blog/${post.slug}`} className="bg-white border border-outline-variant/70 overflow-hidden group">
                  <div className="aspect-[16/10] overflow-hidden">
                    <img src={post.image} alt={post.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  </div>
                  <div className="p-5">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-primary/45">{post.category}</p>
                    <h3 className="mt-2 font-headline text-xl text-primary line-clamp-2">{post.title}</h3>
                    <p className="mt-3 text-sm text-primary/60 line-clamp-2">{post.excerpt}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
