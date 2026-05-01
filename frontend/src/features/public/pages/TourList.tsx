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

const regionSpotlights = [
  {
    key: 'north',
    label: 'Miền Bắc',
    description: 'Vịnh Hạ Long, Hà Nội, Ninh Bình',
    image: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=900&q=80',
  },
  {
    key: 'central',
    label: 'Miền Trung',
    description: 'Biển xanh, di sản và nghỉ dưỡng',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80',
  },
  {
    key: 'south',
    label: 'Miền Nam',
    description: 'Sông nước, đảo biển và nhịp sống mới',
    image: 'https://images.unsplash.com/photo-1470004914212-05527e49370b?auto=format&fit=crop&w=900&q=80',
  },
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

        <header className="relative mb-8 overflow-hidden min-h-[360px] md:min-h-[430px] flex items-center justify-center bg-primary">
          <img
            src="https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1800&q=80"
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/35 to-black/50" />
          <div className="relative z-10 w-full max-w-5xl px-5 py-12 text-center text-white">
            <p className="text-sm font-medium text-white/80">Tour nội địa</p>
            <h1 className="mt-3 font-headline text-4xl sm:text-5xl md:text-6xl leading-none whitespace-nowrap">
              Khám phá Việt Nam
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm md:text-base text-white/82">
              Chọn điểm đến, thời gian và ngân sách để tìm lịch khởi hành đang mở bán.
            </p>

            <div className="mx-auto mt-8 grid max-w-4xl gap-3 bg-white/95 p-3 text-left shadow-2xl md:grid-cols-[minmax(0,1fr)_180px_220px]">
              <label className="block">
                <span className="text-[10px] uppercase tracking-[0.2em] text-secondary font-semibold">Điểm đến</span>
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
          </div>
        </header>

        <section className="mb-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-end">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-secondary font-semibold">Tour theo điểm đến</p>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              {regionSpotlights.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => updateFilter('region', item.key)}
                  className={`group relative min-h-[132px] overflow-hidden border text-left ${region === item.key ? 'border-secondary' : 'border-transparent'}`}
                >
                  <img src={item.image} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <span className="absolute inset-0 bg-gradient-to-t from-black/68 via-black/20 to-transparent" />
                  <span className="relative z-10 flex h-full min-h-[132px] flex-col justify-end p-4 text-white">
                    <span className="font-headline text-2xl leading-tight">{item.label}</span>
                    <span className="mt-1 text-sm text-white/78">{item.description}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div className="border border-outline-variant/50 bg-white p-5">
            <p className="text-[10px] uppercase tracking-[0.2em] text-secondary font-semibold mb-2">Kết quả tìm kiếm</p>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="font-headline text-3xl text-primary leading-none">{filteredTours.length}</p>
                <p className="text-sm text-primary/60 mt-2">Hành trình phù hợp</p>
              </div>
              <span className="text-xs uppercase tracking-[0.18em] text-primary/40 whitespace-nowrap">Hôm nay</span>
            </div>
          </div>
        </section>

        <section className="mb-7 space-y-4">
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
