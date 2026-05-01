import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppDataStore } from '@shared/store/useAppDataStore';
import type { Tour } from '@entities/tour/data/tours';

const regions = [
  { key: 'all', label: 'Tất cả' },
  { key: 'north', label: 'Miền Bắc', terms: ['Hà Nội', 'Hạ Long', 'Sa Pa', 'Lào Cai', 'Ninh Bình'] },
  { key: 'central', label: 'Miền Trung', terms: ['Ninh Thuận', 'Đà Nẵng', 'Huế', 'Hội An', 'Quảng Nam'] },
  { key: 'south', label: 'Miền Nam', terms: ['Hồ Chí Minh', 'Phú Quốc', 'Cần Thơ', 'Vũng Tàu'] },
  { key: 'resort', label: 'Nghỉ dưỡng', terms: ['Amanoi', 'resort', 'spa', 'biệt thự', 'Vĩnh Hy'] },
] as const;

function formatCurrency(value: number) {
  return `${value.toLocaleString('vi-VN')}đ`;
}

function getSearchText(tour: Tour) {
  return [tour.title, tour.description, tour.departurePoint, tour.arrivalPoint, ...tour.sightseeingSpots, ...tour.highlights].join(' ').toLowerCase();
}

function matchesRegion(tour: Tour, regionKey: string) {
  if (regionKey === 'all') return true;
  const region = regions.find((item) => item.key === regionKey);
  if (!region || !('terms' in region)) return true;
  const haystack = getSearchText(tour);
  return region.terms.some((term) => haystack.includes(term.toLowerCase()));
}

export default function TourList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tours = useAppDataStore((state) => state.publicTours);
  const publicLoading = useAppDataStore((state) => state.publicLoading);
  const query = searchParams.get('q') ?? '';
  const region = searchParams.get('region') ?? 'all';
  const budget = searchParams.get('budget') ?? 'all';
  const date = searchParams.get('date') ?? '';

  const filteredTours = tours.filter((tour) => {
    const text = getSearchText(tour);
    const price = tour.price.adult;
    const matchesQuery = !query.trim() || text.includes(query.trim().toLowerCase());
    const matchesBudget =
      budget === 'all' ||
      (budget === 'under-5m' && price < 5000000) ||
      (budget === '5m-10m' && price >= 5000000 && price <= 10000000) ||
      (budget === 'over-10m' && price > 10000000);
    const matchesDate = !date || tour.departureSchedule.some((schedule) => schedule.date >= date);
    return matchesQuery && matchesBudget && matchesRegion(tour, region) && matchesDate;
  });

  const updateFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value && value !== 'all') next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  };

  return (
    <div className="public-page">
      <main className="public-container relative pt-8 md:pt-10 pb-16 md:pb-20">
        <div aria-hidden="true" className="absolute pointer-events-none gold-thread h-7 md:h-8 left-4 sm:left-6 lg:left-8 top-0" />

        <nav className="flex items-center gap-2 mb-6 text-xs uppercase tracking-[0.2em] text-outline">
          <button onClick={() => navigate('/')} className="hover:text-secondary transition-colors cursor-pointer">Trang chủ</button>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-secondary font-medium">Danh sách tour</span>
        </nav>

        <header className="mb-6 md:mb-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] lg:items-end">
          <div>
            <h1 className="font-headline text-[2.4rem] md:text-[3.2rem] leading-none tracking-[-0.04em] text-primary max-w-3xl">
              Tour đang mở bán
            </h1>
            <div className="mt-4 flex items-center gap-4">
              <div className="h-[1px] w-12 bg-secondary" />
              <p className="text-outline uppercase tracking-widest text-xs">
                Danh sách tour lấy trực tiếp từ backend public.
              </p>
            </div>
          </div>
          <div className="public-floating-card p-5 md:p-6">
            <p className="text-[10px] uppercase tracking-[0.22em] text-secondary font-semibold mb-2">Kết quả tìm kiếm</p>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="font-headline text-3xl text-primary leading-none">{filteredTours.length}</p>
                <p className="text-sm text-primary/60 mt-2">Hành trình phù hợp</p>
              </div>
              <span className="text-xs uppercase tracking-[0.18em] text-primary/40 whitespace-nowrap">Cập nhật hôm nay</span>
            </div>
          </div>
        </header>

        <section className="public-floating-card p-4 md:p-5 mb-7 space-y-4">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_220px]">
            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.2em] text-secondary font-semibold">Tìm điểm đến</span>
              <input
                value={query}
                onChange={(event) => updateFilter('q', event.target.value)}
                placeholder="Hạ Long, Ninh Thuận, Kyoto..."
                className="mt-2 w-full border border-outline-variant/70 bg-white px-4 py-3 text-sm text-primary focus:outline-none focus:border-secondary"
              />
            </label>
            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.2em] text-secondary font-semibold">Thời gian</span>
              <input
                value={date}
                onChange={(event) => updateFilter('date', event.target.value)}
                type="date"
                className="mt-2 w-full border border-outline-variant/70 bg-white px-4 py-3 text-sm text-primary focus:outline-none focus:border-secondary"
              />
            </label>
            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.2em] text-secondary font-semibold">Ngân sách</span>
              <select
                value={budget}
                onChange={(event) => updateFilter('budget', event.target.value)}
                className="mt-2 w-full border border-outline-variant/70 bg-white px-4 py-3 text-sm text-primary focus:outline-none focus:border-secondary"
              >
                <option value="all">Tất cả mức giá</option>
                <option value="under-5m">Dưới 5.000.000đ</option>
                <option value="5m-10m">Từ 5.000.000đ - 10.000.000đ</option>
                <option value="over-10m">Trên 10.000.000đ</option>
              </select>
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            {regions.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => updateFilter('region', item.key)}
                className={`px-4 py-2 text-[10px] uppercase tracking-[0.18em] border transition-colors ${region === item.key ? 'bg-primary text-white border-primary' : 'bg-white text-primary border-outline-variant hover:border-secondary'}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-7">
          {publicLoading && tours.length === 0 ? (
            <div className="col-span-full text-center py-20 text-primary/50">Đang tải dữ liệu tour...</div>
          ) : filteredTours.length === 0 ? (
            <div className="col-span-full public-floating-card p-8 text-center text-primary/60">Không có tour phù hợp bộ lọc hiện tại.</div>
          ) : (
            filteredTours.map((tour) => (
              <article key={tour.id} className="group public-floating-card overflow-hidden flex flex-col">
                <button type="button" onClick={() => navigate(`/tours/${tour.slug}`)} className="aspect-[16/11] overflow-hidden bg-surface-container-low relative text-left">
                  <img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={tour.title} src={tour.image} />
                  {tour.originalPrice && (
                    <span className="absolute top-4 left-4 px-3 py-1 text-[10px] tracking-[0.2em] font-medium uppercase bg-secondary text-on-secondary">
                      Khuyến mãi
                    </span>
                  )}
                </button>
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-center gap-2 text-[10px] tracking-widest text-outline uppercase mb-3">
                    <span className="material-symbols-outlined text-sm">schedule</span>
                    {tour.duration.days} Ngày {tour.duration.nights} Đêm
                  </div>
                  <h2 className="font-headline text-xl leading-snug text-primary group-hover:text-secondary transition-colors duration-300">
                    {tour.title}
                  </h2>
                  <p className="mt-3 text-sm text-primary/60 line-clamp-2">{tour.departurePoint} → {tour.sightseeingSpots.join(', ')}</p>
                  <div className="pt-4 mt-auto border-t border-outline-variant/30 flex items-end justify-between gap-4">
                    <div className="flex flex-col">
                      <span className={`text-xs text-outline mb-1 ${tour.originalPrice ? 'line-through' : 'opacity-0'}`}>
                        {tour.originalPrice ? formatCurrency(tour.originalPrice) : '—'}
                      </span>
                      <span className={`text-lg font-semibold ${tour.originalPrice ? 'text-tertiary' : 'text-primary'}`}>
                        {formatCurrency(tour.price.adult)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate(`/tours/${tour.slug}`)}
                      className="bg-primary text-white px-5 py-3 text-[10px] tracking-[0.2em] font-medium hover:bg-secondary transition-all uppercase shrink-0"
                    >
                      Đặt ngay
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
