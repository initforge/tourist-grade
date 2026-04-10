import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { mockTours, type DepartureScheduleEntry } from '../../data/tours';

const MONTH_NAMES: Record<number, string> = {
  1: 'Tháng 1', 2: 'Tháng 2', 3: 'Tháng 3', 4: 'Tháng 4',
  5: 'Tháng 5', 6: 'Tháng 6', 7: 'Tháng 7', 8: 'Tháng 8',
  9: 'Tháng 9', 10: 'Tháng 10', 11: 'Tháng 11', 12: 'Tháng 12',
};

interface ScheduleRow {
  month: number;
  monthLabel: string;
  date: DepartureScheduleEntry;
}

function buildScheduleRows(schedules: DepartureScheduleEntry[]): ScheduleRow[] {
  const sorted = [...schedules].sort((a, b) => a.date.localeCompare(b.date));
  const seen = new Set<number>();
  return sorted.map(s => {
    const d = new Date(s.date);
    const m = d.getMonth() + 1;
    const label = seen.has(m) ? '' : MONTH_NAMES[m];
    seen.add(m);
    return { month: m, monthLabel: label, date: s };
  });
}

export default function TourDetail() {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const user = useAuthStore(s => s.user);
  const isCustomer = user?.role === 'customer';
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<DepartureScheduleEntry | null>(null);
  const [expandedAccordion, setExpandedAccordion] = useState<string | null>(null);
  const [showGallery, setShowGallery] = useState(false);

  const tour = mockTours.find(t => t.slug === slug);

  if (!tour) {
    return (
      <div className="w-full bg-[var(--color-background)] min-h-screen flex items-center justify-center pt-20">
        <div className="text-center space-y-4">
          <span className="material-symbols-outlined text-5xl text-[#D0C5AF]">search_off</span>
          <p className="text-lg text-[#2A2421]/60">Không tìm thấy tour này</p>
          <button onClick={() => navigate('/tours')} className="text-[#D4AF37] hover:underline text-sm">
            Quay lại danh sách tour
          </button>
        </div>
      </div>
    );
  }

  const relatedTours = mockTours
    .filter(t => t.id !== tour.id && t.category === tour.category)
    .slice(0, 3);

  const scheduleRows = buildScheduleRows(tour.departureSchedule);

  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isCustomer) {
      navigate('/login');
      return;
    }
    setIsWishlisted(v => !v);
  };

  const handleBook = () => {
    if (!selectedSchedule) return;
    navigate(`/tours/${slug}/book?scheduleId=${selectedSchedule.id}`);
  };

  const toggleAccordion = (key: string) => {
    setExpandedAccordion(prev => prev === key ? null : key);
  };

  const AccordionItem = ({ title, keyName, children }: { title: string; keyName: string; children: React.ReactNode }) => (
    <div className="border-b border-[var(--color-surface)] last:border-0">
      <button
        onClick={() => toggleAccordion(keyName)}
        className="w-full flex items-center justify-between py-4 text-left hover:text-[var(--color-secondary)] transition-colors"
      >
        <span className="text-sm font-medium text-[var(--color-primary)]">{title}</span>
        <span className={`material-symbols-outlined text-lg transition-transform ${expandedAccordion === keyName ? 'rotate-180' : ''}`}>
          expand_more
        </span>
      </button>
      {expandedAccordion === keyName && (
        <div className="pb-5 text-sm text-[var(--color-primary)]/70 leading-relaxed">
          {children}
        </div>
      )}
    </div>
  );

  return (
    <div className="w-full bg-[var(--color-background)]">
      <main className="pt-20 pb-32 overflow-x-hidden">

        {/* Hero Gallery */}
        <section className="px-6 mb-8">
          <div className="grid grid-cols-12 gap-2 h-[420px] max-h-[420px]">
            <div
              className="col-span-8 h-full relative group cursor-pointer"
              onClick={() => setShowGallery(true)}
            >
              <img
                alt={tour.title}
                className="w-full h-full object-cover"
                src={tour.image}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all" />
              <div className="absolute bottom-4 left-4 bg-surface/90 px-3 py-1 text-[10px] tracking-[0.2em] uppercase font-medium">
                {tour.category === 'domestic' ? 'Trong nước' : 'Quốc tế'}
              </div>
            </div>
            <div className="col-span-4 flex flex-col gap-2 h-full">
              {tour.gallery.slice(0, 2).map((img, i) => (
                <div key={i} className="h-1/2 w-full overflow-hidden cursor-pointer" onClick={() => setShowGallery(true)}>
                  <img
                    alt={`${tour.title} ${i + 2}`}
                    className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
                    src={img}
                  />
                </div>
              ))}
              <div className="h-1/2 w-full relative cursor-pointer" onClick={() => setShowGallery(true)}>
                {tour.gallery[2] ? (
                  <img
                    alt={`${tour.title} 4`}
                    className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
                    src={tour.gallery[2]}
                  />
                ) : (
                  <div className="w-full h-full bg-surface flex items-center justify-center">
                    <span className="material-symbols-outlined text-4xl text-[var(--color-primary)]/20">image</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-primary/40 flex items-center justify-center">
                  <span className="text-surface font-label text-xs tracking-widest">+{tour.gallery.length}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Title & Meta */}
        <section className="px-6 mb-8 max-w-7xl mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-secondary font-label text-[10px] uppercase tracking-[0.2em]">
              {tour.category === 'domestic' ? 'Du lịch trong nước' : 'Du lịch quốc tế'}
            </span>
            {tour.tourType === 'mua_le' && (
              <span className="bg-red-100 text-red-700 text-[10px] px-2 py-0.5 font-label uppercase tracking-wider">
                Mùa lễ
              </span>
            )}
          </div>
          <h1 className="font-headline text-3xl leading-tight tracking-tight text-primary mb-3">
            {tour.title}
          </h1>
          <div className="flex items-center gap-4 flex-wrap">
            {tour.rating && (
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>
                  star
                </span>
                <span className="text-xs font-medium">{tour.rating} ({tour.reviewCount} đánh giá)</span>
              </div>
            )}
            <div className="w-px h-3 bg-outline-variant/40" />
            <div className="flex items-center gap-1 text-xs opacity-70">
              <span className="material-symbols-outlined text-[16px]">location_on</span>
              <span>{tour.departurePoint} → {tour.sightseeingSpots.join(', ')}</span>
            </div>
            <div className="w-px h-3 bg-outline-variant/40" />
            <div className="flex items-center gap-1 text-xs opacity-70">
              <span className="material-symbols-outlined text-[16px]">schedule</span>
              <span>{tour.duration.days}N{tour.duration.nights}Đ</span>
            </div>
          </div>
        </section>

        {/* 2-Column Layout: Left content + Right sticky card */}
        <section className="px-6 max-w-7xl mx-auto">
          <div className="flex gap-8 items-start">

            {/* LEFT: Main content */}
            <div className="flex-1 min-w-0 space-y-10">

              {/* Lịch khởi hành */}
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <h3 className="font-headline text-xl text-primary">Lịch khởi hành</h3>
                  <div className="flex-grow h-px bg-outline-variant/30" />
                </div>
                <div className="overflow-x-auto rounded-sm border border-[var(--color-primary)]/20">
                  <table className="w-full min-w-[800px]">
                    <thead>
                      <tr className="bg-[var(--color-primary)] text-white">
                        <th className="text-center text-[10px] uppercase tracking-widest font-semibold px-4 py-3 w-16">Tháng</th>
                        <th className="text-left text-[10px] uppercase tracking-widest font-semibold px-4 py-3">Ngày khởi hành</th>
                        <th className="text-right text-[10px] uppercase tracking-widest font-semibold px-4 py-3">Người lớn</th>
                        <th className="text-right text-[10px] uppercase tracking-widest font-semibold px-4 py-3">Trẻ em</th>
                        <th className="text-right text-[10px] uppercase tracking-widest font-semibold px-4 py-3">Em bé</th>
                        <th className="text-right text-[10px] uppercase tracking-widest font-semibold px-4 py-3">Phụ thu phòng đơn</th>
                        <th className="text-center text-[10px] uppercase tracking-widest font-semibold px-4 py-3">Số chỗ trống</th>
                        <th className="w-12" />
                      </tr>
                    </thead>
                    <tbody>
                      {scheduleRows.map((row) => {
                        const s = row.date;
                        const isSelected = selectedSchedule?.id === s.id;
                        const isSelectable = s.status !== 'full' && s.status !== 'closed';
                        const adultPrice = s.priceAdult ?? tour.price.adult;
                        const childPrice = s.priceChild ?? tour.price.child;
                        const infantPrice = s.priceInfant ?? (tour.price.infant ?? 0);
                        return (
                          <tr
                            key={s.id}
                            onClick={() => isSelectable && setSelectedSchedule(isSelected ? null : s)}
                            className={`border-b border-[var(--color-primary)]/10 last:border-0 cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-[var(--color-secondary)]/10 border-l-4 border-l-[var(--color-secondary)]'
                                : isSelectable
                                  ? 'hover:bg-[var(--color-surface)]'
                                  : 'opacity-50 cursor-default'
                            }`}
                          >
                            <td className="px-4 py-3.5 text-center text-sm font-semibold text-[var(--color-secondary)]">
                              {row.monthLabel}
                            </td>
                            <td className="px-4 py-3.5 text-sm font-medium text-primary">
                              {new Date(s.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                            </td>
                            <td className="px-4 py-3.5 text-right text-sm font-bold text-primary">
                              {adultPrice.toLocaleString('vi-VN')}đ
                            </td>
                            <td className="px-4 py-3.5 text-right text-sm text-primary/70">
                              {childPrice.toLocaleString('vi-VN')}đ
                            </td>
                            <td className="px-4 py-3.5 text-right text-sm text-primary/70">
                              {infantPrice.toLocaleString('vi-VN')}đ
                            </td>
                            <td className="px-4 py-3.5 text-right text-sm text-primary/60">
                              {s.singleRoomSurcharge ? `+${s.singleRoomSurcharge.toLocaleString('vi-VN')}đ` : '—'}
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              {s.availableSeats > 0 ? (
                                <span className={`font-bold text-sm ${s.availableSeats <= 5 ? 'text-red-500' : 'text-primary'}`}>
                                  {s.availableSeats}
                                </span>
                              ) : (
                                <span className="text-red-500 text-sm font-bold">Hết chỗ</span>
                              )}
                            </td>
                            <td className="px-2 py-3.5 text-center">
                              {isSelected && (
                                <span className="material-symbols-outlined text-lg text-[var(--color-secondary)]" style={{ fontVariationSettings: "'FILL' 1" }}>
                                  check_circle
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Lịch trình chi tiết */}
              <div className="relative">
                <div className="absolute left-10 top-24 bottom-10 vertical-gold-thread" />
                <div className="flex items-center gap-4 mb-8">
                  <h3 className="font-headline text-xl text-primary">Lịch trình chi tiết</h3>
                  <div className="flex-grow h-px bg-outline-variant/30" />
                </div>
                <div className="space-y-12">
                  {tour.itinerary.map((day, idx) => (
                    <div key={day.day} className="relative pl-12">
                      <div className={`absolute left-[13px] top-1 w-[11px] h-[11px] border border-surface shadow-sm ring-4 ring-surface ${
                        idx === 0 ? 'bg-secondary' : 'bg-outline-variant'
                      }`} />
                      <div className="mb-3">
                        <span className={`font-label text-[10px] uppercase tracking-widest ${
                          idx === 0 ? 'text-secondary' : 'text-secondary/60'
                        }`}>
                          Ngày {String(day.day).padStart(2, '0')}
                        </span>
                        <h4 className="font-headline text-lg mt-1 text-primary">{day.title}</h4>
                        {day.meals.length > 0 && (
                          <div className="flex gap-2 mt-2">
                            {day.meals.map(m => (
                              <span key={m} className="text-[10px] bg-[var(--color-surface)] px-2 py-1 text-primary/60 font-label uppercase tracking-wider">
                                {m === 'breakfast' ? 'Sáng' : m === 'lunch' ? 'Trưa' : 'Tối'}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-primary/70 leading-relaxed">{day.description}</p>
                      {day.activities.length > 0 && (
                        <ul className="mt-3 space-y-1.5">
                          {day.activities.map((act, ai) => (
                            <li key={ai} className="flex items-center gap-2 text-xs text-primary/60">
                              <span className="w-1 h-1 rounded-full bg-[var(--color-secondary)]" />
                              {act}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Thông tin cần lưu ý */}
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <h3 className="font-headline text-xl text-primary">Thông tin cần lưu ý</h3>
                  <div className="flex-grow h-px bg-outline-variant/30" />
                </div>
                <div className="bg-white border border-[var(--color-primary)]/20 p-5 space-y-0">
                  <AccordionItem title="Giá tour bao gồm" keyName="inclusions">
                    <ul className="space-y-2">
                      {tour.inclusions.map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="material-symbols-outlined text-emerald-500 text-base shrink-0">check</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </AccordionItem>

                  <AccordionItem title="Giá tour không bao gồm" keyName="exclusions">
                    <ul className="space-y-2">
                      {tour.exclusions.map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="material-symbols-outlined text-red-400 text-base shrink-0">close</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </AccordionItem>

                  <AccordionItem title="Giá trẻ em" keyName="child">
                    <p>{tour.childPolicy}</p>
                  </AccordionItem>

                  <AccordionItem title="Chính sách hủy tour" keyName="cancel">
                    <div className="space-y-3">
                      {tour.cancellationPolicy.map((tier, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <span className="text-xs font-medium bg-[var(--color-surface)] px-3 py-1.5 text-primary/80 min-w-[140px]">
                            {tier.daysBefore} ngày trước
                          </span>
                          <span className="text-sm">
                            → Hoàn <strong className="text-[var(--color-secondary)]">{tier.refundPercent}%</strong> giá tour
                          </span>
                        </div>
                      ))}
                    </div>
                  </AccordionItem>

                  <AccordionItem title="Thông tin khác" keyName="other">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-primary/40 text-base shrink-0">directions_bus</span>
                        <div>
                          <p className="font-medium text-primary text-sm">Phương tiện</p>
                          <p className="text-primary/70 text-xs">{tour.transport === 'xe' ? 'Xe du lịch' : 'Máy bay'} {tour.arrivalPoint && `→ ${tour.arrivalPoint}`}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-primary/40 text-base shrink-0">location_on</span>
                        <div>
                          <p className="font-medium text-primary text-sm">Khởi hành</p>
                          <p className="text-primary/70 text-xs">{tour.departurePoint}</p>
                        </div>
                      </div>
                      {tour.tourType === 'mua_le' && tour.holiday && (
                        <div className="flex items-start gap-3">
                          <span className="material-symbols-outlined text-primary/40 text-base shrink-0">celebration</span>
                          <div>
                            <p className="font-medium text-primary text-sm">Dịp lễ</p>
                            <p className="text-primary/70 text-xs">{tour.holiday}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </AccordionItem>
                </div>
              </div>
            </div>

            {/* RIGHT: Sticky booking card */}
            <div className="w-80 shrink-0 sticky top-24">
              <div className="bg-white border border-[var(--color-primary)]/20 overflow-hidden">
                {/* Tour image */}
                <div className="h-44 overflow-hidden">
                  <img
                    alt={tour.title}
                    src={tour.image}
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Card body */}
                <div className="p-5 space-y-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-secondary mb-1 font-label">
                      {tour.duration.days}N{tour.duration.nights}Đ · {tour.departurePoint}
                    </p>
                    <h4 className="font-headline text-base text-primary leading-snug line-clamp-2">
                      {tour.title}
                    </h4>
                  </div>

                  <div className="h-px bg-[var(--color-surface)]" />

                  {/* Departure info */}
                  <div className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-secondary text-base mt-0.5">location_on</span>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-primary/50 font-label mb-0.5">Khởi hành</p>
                      <p className="text-sm font-medium text-primary">{tour.departurePoint}</p>
                    </div>
                  </div>

                  <div className="h-px bg-[var(--color-surface)]" />

                  {/* Price */}
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-primary/50 font-label mb-1">Giá từ</p>
                    <div className="flex items-baseline gap-2">
                      <span className="font-headline text-2xl font-bold text-[var(--color-secondary)]">
                        {tour.price.adult.toLocaleString('vi-VN')}đ
                      </span>
                      <span className="text-xs text-primary/50">/ người lớn</span>
                    </div>
                    {tour.originalPrice && (
                      <p className="text-xs text-primary/40 line-through mt-0.5">
                        {tour.originalPrice.toLocaleString('vi-VN')}đ
                      </p>
                    )}
                  </div>

                  {/* CTA */}
                  <button
                    onClick={handleBook}
                    disabled={!selectedSchedule}
                    className={`w-full py-3 font-sans uppercase tracking-[0.15em] text-[11px] font-bold transition-all ${
                      selectedSchedule
                        ? 'bg-primary text-white hover:bg-[var(--color-secondary)] cursor-pointer'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Đặt tour
                  </button>

                  {!selectedSchedule && (
                    <p className="text-center text-[11px] text-primary/40 italic">
                      Vui lòng chọn ngày khởi hành bên trái
                    </p>
                  )}
                  {selectedSchedule && (
                    <p className="text-center text-[11px] text-primary/50">
                      {new Date(selectedSchedule.date).toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                  )}
                </div>
              </div>

              {/* Wishlist button below card */}
              <button
                onClick={toggleWishlist}
                className={`w-full mt-3 py-3 border font-sans uppercase tracking-[0.1em] text-[10px] font-bold transition-all flex items-center justify-center gap-2 ${
                  isWishlisted
                    ? 'border-[var(--color-tertiary)] text-[var(--color-tertiary)] hover:bg-[var(--color-tertiary)]/5'
                    : 'border-primary text-primary hover:bg-primary hover:text-white'
                }`}
              >
                <span
                  className="material-symbols-outlined text-lg"
                  style={{ fontVariationSettings: isWishlisted ? "'FILL' 1" : "'FILL' 0" }}
                >
                  favorite
                </span>
                {isWishlisted ? 'Đã lưu yêu thích' : 'Lưu yêu thích'}
              </button>
            </div>

          </div>
        </section>

        {/* Tour liên quan */}
        {relatedTours.length > 0 && (
          <div className="px-6 max-w-7xl mx-auto mt-16">
            <div className="flex items-center gap-4 mb-6">
              <h3 className="font-headline text-xl text-primary">Tour liên quan</h3>
              <div className="flex-grow h-px bg-outline-variant/30" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedTours.map(rt => (
                <div
                  key={rt.id}
                  onClick={() => navigate(`/tours/${rt.slug}`)}
                  className="bg-white border border-[var(--color-primary)]/20 overflow-hidden cursor-pointer group hover:border-[var(--color-secondary)] transition-all hover:shadow-md"
                >
                  <div className="h-44 overflow-hidden">
                    <img
                      alt={rt.title}
                      src={rt.image}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  </div>
                  <div className="p-4">
                    <p className="text-[10px] uppercase tracking-widest text-secondary mb-1 font-label">
                      {rt.category === 'domestic' ? 'Trong nước' : 'Quốc tế'}
                    </p>
                    <h4 className="font-headline text-sm text-primary leading-snug mb-2 line-clamp-2 group-hover:text-[var(--color-secondary)] transition-colors">
                      {rt.title}
                    </h4>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-primary/60">{rt.duration.days}N{rt.duration.nights}Đ</span>
                      <span className="text-sm font-bold text-[var(--color-secondary)]">
                        {rt.price.adult.toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
