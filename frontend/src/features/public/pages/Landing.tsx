import { Link } from 'react-router-dom';
import { useAppDataStore } from '@shared/store/useAppDataStore';

function formatCurrency(value: number) {
  return `${value.toLocaleString('vi-VN')}đ`;
}

function formatDuration(days: number, nights: number) {
  if (nights <= 0) return `${days} Ngày`;
  return `${days} Ngày / ${nights} Đêm`;
}

export default function Landing() {
  const publicTours = useAppDataStore((state) => state.publicTours);
  const domesticTours = publicTours.filter((tour) => tour.category === 'domestic').slice(0, 4);
  const featuredTours = publicTours.slice(0, 4);
  const heroTour = publicTours[0];

  return (
    <div className="public-page">
      <section className="public-hero-banner flex items-center">
        <img
          className="absolute inset-0 w-full h-full object-cover"
          src={heroTour?.image ?? 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=1400'}
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
              Dữ liệu tour, giá, lịch trình và trạng thái được lấy từ backend local qua API, phục vụ demo thật cho các luồng đặt tour và vận hành.
            </p>
          </div>

          <div className="public-floating-card mt-8 md:mt-10 p-3 md:p-4 max-w-5xl">
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto] gap-3">
              <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-outline-variant/30">
                <div className="flex flex-col items-start px-4 py-3">
                  <label className="text-[0.65rem] uppercase tracking-widest text-secondary font-semibold mb-1">Điểm đến</label>
                  <input className="w-full bg-transparent border-none p-0 text-primary focus:ring-0 placeholder:text-primary/40 text-sm" placeholder="Hạ Long, Ninh Thuận, Kyoto..." type="text" />
                </div>
                <div className="flex flex-col items-start px-4 py-3">
                  <label className="text-[0.65rem] uppercase tracking-widest text-secondary font-semibold mb-1">Thời gian</label>
                  <input className="w-full bg-transparent border-none p-0 text-primary focus:ring-0 placeholder:text-primary/40 text-sm" placeholder="Chọn ngày khởi hành" type="text" />
                </div>
                <div className="flex flex-col items-start px-4 py-3">
                  <label className="text-[0.65rem] uppercase tracking-widest text-secondary font-semibold mb-1">Ngân sách</label>
                  <select className="w-full bg-transparent border-none p-0 text-primary focus:ring-0 text-sm">
                    <option>Tất cả mức giá</option>
                    <option>Dưới 5.000.000đ</option>
                    <option>Từ 5.000.000đ - 10.000.000đ</option>
                    <option>Trên 10.000.000đ</option>
                  </select>
                </div>
              </div>
              <Link to="/tours" className="w-full lg:w-auto bg-primary text-white px-7 py-4 font-serif text-sm uppercase tracking-widest hover:bg-secondary transition-colors duration-500 text-center">
                Tìm kiếm tour
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="public-section bg-surface">
        <div className="public-container">
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
          <h2 className="font-headline text-3xl md:text-4xl tracking-tighter text-primary mb-6">HÀNH TRÌNH TRONG NƯỚC</h2>
          <div className="flex gap-10 border-b border-primary/70 mb-10">
            <button className="pb-4 text-[0.75rem] uppercase tracking-[0.2em] font-bold text-secondary border-b-2 border-secondary">Tour nội địa</button>
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
    </div>
  );
}
