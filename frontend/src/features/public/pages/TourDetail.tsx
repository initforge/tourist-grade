import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { addWishlistItem, removeWishlistItem } from '@shared/lib/api/wishlist';
import { useAuthStore } from '@shared/store/useAuthStore';
import { type DepartureScheduleEntry } from '@entities/tour/data/tours';
import { useAppDataStore } from '@shared/store/useAppDataStore';

const MONTH_NAMES: Record<number, string> = {
  1: 'Tháng 1',
  2: 'Tháng 2',
  3: 'Tháng 3',
  4: 'Tháng 4',
  5: 'Tháng 5',
  6: 'Tháng 6',
  7: 'Tháng 7',
  8: 'Tháng 8',
  9: 'Tháng 9',
  10: 'Tháng 10',
  11: 'Tháng 11',
  12: 'Tháng 12',
};
const FALLBACK_TOUR_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='800' viewBox='0 0 1200 800'%3E%3Crect width='1200' height='800' fill='%23f7f3ea'/%3E%3Cpath d='M180 560 470 250l180 190 120-130 250 250H180Z' fill='%23d8c89f'/%3E%3Ccircle cx='875' cy='190' r='82' fill='%23d4af37'/%3E%3Ctext x='90' y='710' font-family='Georgia,serif' font-size='54' fill='%232a2421'%3ETRAVELA%3C/text%3E%3C/svg%3E";

interface ScheduleRow {
  month: number;
  monthLabel: string;
  date: DepartureScheduleEntry;
}

function buildScheduleRows(schedules: DepartureScheduleEntry[]): ScheduleRow[] {
  const sorted = [...schedules].sort((a, b) => a.date.localeCompare(b.date));
  const seen = new Set<number>();

  return sorted.map((schedule) => {
    const parsed = new Date(schedule.date);
    const month = parsed.getMonth() + 1;
    const monthLabel = seen.has(month) ? '' : MONTH_NAMES[month];
    seen.add(month);
    return { month, monthLabel, date: schedule };
  });
}

export default function TourDetail() {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const publicTours = useAppDataStore((state) => state.publicTours);
  const publicLoading = useAppDataStore((state) => state.publicLoading);
  const wishlist = useAppDataStore((state) => state.wishlist);
  const upsertWishlistItem = useAppDataStore((state) => state.upsertWishlistItem);
  const removeWishlistStoreItem = useAppDataStore((state) => state.removeWishlistItem);
  const [selectedSchedule, setSelectedSchedule] = useState<DepartureScheduleEntry | null>(null);
  const [expandedAccordion, setExpandedAccordion] = useState<string | null>(null);
  const [collapsedItineraryDays, setCollapsedItineraryDays] = useState<number[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);
  const [wishlistBusy, setWishlistBusy] = useState(false);

  const tour = publicTours.find((item) => item.slug === slug);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [slug]);

  const isWishlisted = Boolean(tour && wishlist.some((item) => item.tourId === tour.id));

  const filteredSchedules = useMemo(
    () => (tour?.departureSchedule ?? []).filter((item) => item.availableSeats > 0 && item.status !== 'closed' && item.status !== 'full'),
    [tour?.departureSchedule],
  );
  const scheduleRows = buildScheduleRows(filteredSchedules);
  const fallbackSchedule = scheduleRows.find((row) => row.date.status === 'open' || row.date.status === 'filling')?.date ?? scheduleRows[0]?.date ?? null;
  const activeSchedule = selectedSchedule ?? fallbackSchedule;

  useEffect(() => {
    setSelectedSchedule(null);
    setExpandedAccordion(null);
    setCollapsedItineraryDays([]);
    setActiveImageIndex(null);
  }, [slug]);

  if (!tour && publicLoading) {
    return (
      <div className="public-page min-h-screen flex items-center justify-center pt-20">
        <p className="text-lg text-[#2A2421]/60">Đang tải chi tiết tour...</p>
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="public-page min-h-screen flex items-center justify-center pt-20">
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

  const relatedTours = publicTours
    .filter((item) => item.id !== tour.id)
    .filter((item) => item.regionKey === tour.regionKey)
    .slice(0, 3);
  const fallbackRelatedTours = publicTours
    .filter((item) => item.id !== tour.id)
    .filter((item) => item.category === tour.category)
    .slice(0, 3);
  const displayRelatedTours = relatedTours.length > 0 ? relatedTours : fallbackRelatedTours;
  const activeAdultPrice = activeSchedule?.priceAdult ?? tour.price.adult;
  const galleryImages = Array.from(new Set([tour.image, ...tour.gallery].filter(Boolean)));
  const safeGalleryImages = galleryImages.length > 0 ? galleryImages : [FALLBACK_TOUR_IMAGE];
  const secondaryImages = galleryImages.slice(1, 4);
  const reviewItems = tour.reviews ?? [];
  const useFallbackImage = (event: React.SyntheticEvent<HTMLImageElement>) => {
    if (event.currentTarget.src !== FALLBACK_TOUR_IMAGE) {
      event.currentTarget.src = FALLBACK_TOUR_IMAGE;
    }
  };

  const toggleWishlist = async (event: React.MouseEvent) => {
    event.preventDefault();
    const storedAccessToken = (() => {
      try {
        const raw = localStorage.getItem('__travela_auth_tokens');
        return raw ? (JSON.parse(raw) as { accessToken?: string }).accessToken : null;
      } catch {
        return null;
      }
    })();
    const effectiveAccessToken = accessToken ?? storedAccessToken;

    if (!effectiveAccessToken || (user && user.role !== 'customer')) {
      navigate('/login');
      return;
    }
    if (!tour || wishlistBusy) {
      return;
    }

    setWishlistBusy(true);
    try {
      if (isWishlisted) {
        await removeWishlistItem(tour.id, effectiveAccessToken);
        removeWishlistStoreItem(tour.id);
      } else {
        const response = await addWishlistItem(tour.id, effectiveAccessToken);
        upsertWishlistItem(response.item);
      }
    } finally {
      setWishlistBusy(false);
    }
  };

  const handleBook = () => {
    if (!activeSchedule) return;
    navigate(`/tours/${slug}/book?scheduleId=${activeSchedule.id}`);
  };

  const toggleAccordion = (key: string) => {
    setExpandedAccordion((current) => (current === key ? null : key));
  };

  const toggleItineraryDay = (day: number) => {
    setCollapsedItineraryDays((current) => (
      current.includes(day) ? current.filter((item) => item !== day) : [...current, day]
    ));
  };

  const mealLabel = (meal: string) => (
    meal === 'breakfast' ? 'sáng' : meal === 'lunch' ? 'trưa' : 'tối'
  );

  const AccordionItem = ({
    title,
    keyName,
    children,
  }: {
    title: string;
    keyName: string;
    children: React.ReactNode;
  }) => (
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
    <div className="public-page">
      <main className="public-container public-hero pb-16 md:pb-20">
        <section className="mb-5 md:mb-6">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.85fr)]">
            <button type="button" onClick={() => setActiveImageIndex(0)} className="public-media-frame relative aspect-[16/11] md:aspect-[16/10] lg:min-h-[420px] group text-left">
              <img alt={tour.title} className="w-full h-full object-cover" src={safeGalleryImages[0]} onError={useFallbackImage} />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all" />
              <div className="absolute bottom-4 left-4 bg-white/90 px-3 py-1 text-[10px] tracking-[0.2em] uppercase font-medium text-primary">
                {tour.category === 'domestic' ? 'Trong nước' : 'Quốc tế'}
              </div>
            </button>

            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-2 auto-rows-fr">
              {(secondaryImages.length > 0 ? secondaryImages : [safeGalleryImages[0]]).map((image, imageIndex) => (
                <button
                  key={`${image}-${imageIndex}`}
                  type="button"
                  onClick={() => setActiveImageIndex(imageIndex + 1)}
                  className={`public-media-frame overflow-hidden ${imageIndex === 0 ? 'aspect-[16/10] md:col-span-2' : 'aspect-[4/3]'}`}
                >
                  <img alt={`${tour.title} ${imageIndex + 2}`} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500" src={image} onError={useFallbackImage} />
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="mb-8 md:mb-9">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="text-secondary font-label text-[10px] uppercase tracking-[0.2em]">
              {tour.category === 'domestic' ? 'Du lịch trong nước' : 'Du lịch quốc tế'}
            </span>
            {tour.tourType === 'mua_le' && (
              <span className="bg-red-100 text-red-700 text-[10px] px-2 py-0.5 font-label uppercase tracking-wider">
                Mùa lễ
              </span>
            )}
          </div>
          <h1 className="font-headline text-3xl md:text-4xl leading-tight tracking-tight text-primary mb-3 max-w-4xl">
            {tour.title}
          </h1>
          <div className="flex items-center gap-x-4 gap-y-2 flex-wrap text-sm text-primary/70">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>
                star
              </span>
              <span>{tour.rating?.toFixed(1) ?? '0.0'} ({tour.reviewCount ?? 0} đánh giá)</span>
            </div>
            <div className="hidden md:block w-px h-3 bg-outline-variant/40" />
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">location_on</span>
              <span>{tour.departurePoint} → {tour.sightseeingSpots.join(', ')}</span>
            </div>
            <div className="hidden md:block w-px h-3 bg-outline-variant/40" />
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">schedule</span>
              <span>{tour.duration.days}N{tour.duration.nights}Đ</span>
            </div>
          </div>
        </section>

        <section>
          <div className="flex flex-col lg:flex-row gap-6 xl:gap-8 items-start">
            <div className="flex-1 min-w-0 space-y-8 md:space-y-10">
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <h3 className="font-headline text-xl text-primary">Lịch khởi hành còn chỗ</h3>
                  <div className="flex-grow h-px bg-outline-variant/30" />
                </div>
                <div id="tour-schedule-table" className="overflow-x-auto rounded-sm border border-[var(--color-primary)]/20 bg-white">
                  <table className="w-full min-w-[860px]">
                    <thead>
                      <tr className="bg-[var(--color-primary)] text-white">
                        <th className="text-center text-[10px] uppercase tracking-widest font-semibold px-4 py-3 w-16">Tháng</th>
                        <th className="text-left text-[10px] uppercase tracking-widest font-semibold px-4 py-3">Ngày khởi hành</th>
                        <th className="text-left text-[10px] uppercase tracking-widest font-semibold px-4 py-3">Mã tour</th>
                        <th className="text-right text-[10px] uppercase tracking-widest font-semibold px-4 py-3">Người lớn</th>
                        <th className="text-right text-[10px] uppercase tracking-widest font-semibold px-4 py-3">Trẻ em</th>
                        <th className="text-right text-[10px] uppercase tracking-widest font-semibold px-4 py-3">Em bé</th>
                        <th className="text-right text-[10px] uppercase tracking-widest font-semibold px-4 py-3">Phụ thu phòng đơn</th>
                        <th className="text-center text-[10px] uppercase tracking-widest font-semibold px-4 py-3">Chỗ trống</th>
                        <th className="w-12" />
                      </tr>
                    </thead>
                    <tbody>
                      {scheduleRows.map((row) => {
                        const scheduleItem = row.date;
                        const isSelected = selectedSchedule?.id === scheduleItem.id;
                        const adultPrice = scheduleItem.priceAdult ?? tour.price.adult;
                        const childPrice = scheduleItem.priceChild ?? tour.price.child;
                        const infantPrice = scheduleItem.priceInfant ?? (tour.price.infant ?? 0);

                        return (
                          <tr
                            key={scheduleItem.id}
                            onClick={() => setSelectedSchedule(isSelected ? null : scheduleItem)}
                            className={`border-b border-[var(--color-primary)]/10 last:border-0 cursor-pointer transition-colors ${
                              isSelected ? 'bg-[var(--color-secondary)]/10 border-l-4 border-l-[var(--color-secondary)]' : 'hover:bg-[var(--color-surface)]'
                            }`}
                          >
                            <td className="px-4 py-3.5 text-center text-sm font-semibold text-[var(--color-secondary)]">{row.monthLabel}</td>
                            <td className="px-4 py-3.5 text-sm font-medium text-primary">
                              {new Date(scheduleItem.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                            </td>
                            <td className="px-4 py-3.5 text-sm text-primary/65">{`${scheduleItem.programCode ?? tour.id} - ${scheduleItem.instanceCode ?? scheduleItem.id}`}</td>
                            <td className="px-4 py-3.5 text-right text-sm font-bold text-primary">{adultPrice.toLocaleString('vi-VN')}đ</td>
                            <td className="px-4 py-3.5 text-right text-sm text-primary/70">{childPrice.toLocaleString('vi-VN')}đ</td>
                            <td className="px-4 py-3.5 text-right text-sm text-primary/70">{infantPrice.toLocaleString('vi-VN')}đ</td>
                            <td className="px-4 py-3.5 text-right text-sm text-primary/60">
                              {scheduleItem.singleRoomSurcharge && scheduleItem.singleRoomSurcharge > 0 ? `+${scheduleItem.singleRoomSurcharge.toLocaleString('vi-VN')}đ` : 'Không có'}
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <span className={`font-bold text-sm ${scheduleItem.availableSeats <= 5 ? 'text-red-500' : 'text-primary'}`}>
                                {scheduleItem.availableSeats}/{scheduleItem.totalSlots ?? scheduleItem.availableSeats}
                              </span>
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

              <div>
                <div className="flex items-center gap-4 mb-6">
                  <h3 className="font-headline text-xl text-primary">Lịch trình chi tiết</h3>
                  <div className="flex-grow h-px bg-outline-variant/30" />
                </div>
                <div className="space-y-5">
                  {tour.itinerary.map((day) => {
                    const isCollapsed = collapsedItineraryDays.includes(day.day);
                    const meals = day.meals.map(mealLabel).join(', ');
                    return (
                      <article key={day.day} className="bg-white border border-outline-variant/20 shadow-sm px-5 py-5 md:px-6 md:py-6">
                        <button
                          type="button"
                          onClick={() => toggleItineraryDay(day.day)}
                          className="w-full flex items-center justify-between gap-4 text-left"
                        >
                          <h4 className="font-headline text-base md:text-lg font-bold leading-snug text-primary tracking-wide">
                            Ngày {String(day.day).padStart(2, '0')}: {day.title.toUpperCase()}
                            {meals && <span className="font-sans text-sm font-semibold normal-case"> (Ăn {meals})</span>}
                          </h4>
                          <span className={`material-symbols-outlined shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-full bg-sky-50 text-sky-600 leading-none transition-transform ${isCollapsed ? '-rotate-90' : 'rotate-0'}`}>
                            keyboard_arrow_down
                          </span>
                        </button>
                        {!isCollapsed && (
                          <div className="mt-5 space-y-4">
                            <p className="text-sm md:text-base text-primary/75 leading-7">{day.description}</p>
                            {day.activities.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {day.activities.map((activity, activityIndex) => (
                                  <span key={activityIndex} className="px-3 py-1 bg-[var(--color-surface)] text-xs text-primary/60">
                                    {activity}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-4 mb-4">
                  <h3 className="font-headline text-xl text-primary">Thông tin cần lưu ý</h3>
                  <div className="flex-grow h-px bg-outline-variant/30" />
                </div>
                <div className="bg-white border border-[var(--color-primary)]/20 p-5 space-y-0">
                  <AccordionItem title="Giá tour bao gồm" keyName="inclusions">
                    <ul className="space-y-2">
                      {tour.inclusions.map((item, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="material-symbols-outlined text-emerald-500 text-base shrink-0">check</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </AccordionItem>

                  <AccordionItem title="Giá tour không bao gồm" keyName="exclusions">
                    <ul className="space-y-2">
                      {tour.exclusions.map((item, index) => (
                        <li key={index} className="flex items-start gap-2">
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
                      {tour.cancellationPolicy.map((tier, index) => (
                        <div key={index} className="flex items-center gap-3 flex-wrap">
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
                </div>
              </div>
            </div>

            <div className="w-full lg:w-[340px] xl:w-[360px] shrink-0 lg:self-start lg:sticky lg:top-24">
              <div className="public-floating-card overflow-hidden">
                <div className="p-5 space-y-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-primary/50 font-label mb-2">Giá từ</p>
                    <div className="flex items-end gap-2 flex-wrap">
                      <span className="font-headline text-3xl font-bold text-[var(--color-secondary)]">
                        {activeAdultPrice.toLocaleString('vi-VN')}đ
                      </span>
                      <span className="text-sm text-primary/60 mb-1">/ khách</span>
                    </div>
                    {tour.originalPrice && (
                      <p className="text-xs text-primary/35 line-through mt-1">
                        {tour.originalPrice.toLocaleString('vi-VN')}đ
                      </p>
                    )}
                  </div>

                  <div className="space-y-3 border-y border-[var(--color-surface)] py-4">
                    <div className="flex items-start gap-3 text-sm">
                      <span className="material-symbols-outlined text-primary/45 text-[18px] mt-0.5">confirmation_number</span>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-primary/45 font-label mb-0.5">Mã tour</p>
                        <p className="font-semibold text-primary">{`${activeSchedule?.programCode ?? tour.id} - ${activeSchedule?.instanceCode ?? activeSchedule?.id ?? 'Chọn lịch'}`}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 text-sm">
                      <span className="material-symbols-outlined text-primary/45 text-[18px] mt-0.5">location_on</span>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-primary/45 font-label mb-0.5">Khởi hành</p>
                        <p className="font-semibold text-primary">{tour.departurePoint}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 text-sm">
                      <span className="material-symbols-outlined text-primary/45 text-[18px] mt-0.5">calendar_month</span>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-primary/45 font-label mb-0.5">Ngày khởi hành</p>
                        <p className="font-semibold text-primary">
                          {activeSchedule
                            ? new Date(activeSchedule.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
                            : 'Chọn trong bảng lịch'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 text-sm">
                      <span className="material-symbols-outlined text-primary/45 text-[18px] mt-0.5">schedule</span>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-primary/45 font-label mb-0.5">Thời gian</p>
                        <p className="font-semibold text-primary">{tour.duration.days}N{tour.duration.nights}Đ</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 text-sm">
                      <span className="material-symbols-outlined text-primary/45 text-[18px] mt-0.5">event_seat</span>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-primary/45 font-label mb-0.5">Chỗ trống</p>
                        <p className="font-semibold text-primary">{activeSchedule?.availableSeats ?? tour.availableSeats}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-[minmax(0,112px)_1fr] gap-2">
                    <button
                      type="button"
                      onClick={() => document.getElementById('tour-schedule-table')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                      className="py-3 border border-primary/20 text-primary font-sans uppercase tracking-[0.12em] text-[10px] font-bold hover:border-[var(--color-secondary)] hover:text-[var(--color-secondary)] transition-all"
                    >
                      Ngày khác
                    </button>
                    <button
                      onClick={handleBook}
                      disabled={!activeSchedule}
                      className={`py-3 font-sans uppercase tracking-[0.15em] text-[11px] font-bold transition-all ${
                        activeSchedule
                          ? 'bg-primary text-white hover:bg-[var(--color-secondary)] cursor-pointer'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      Đặt ngay
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={toggleWishlist}
                disabled={wishlistBusy}
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

        <section id="reviews" className="mt-12 md:mt-14">
          <div className="flex items-center gap-4 mb-6">
            <h3 className="font-headline text-xl text-primary">Đánh giá tour</h3>
            <div className="flex-grow h-px bg-outline-variant/30" />
          </div>
          <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
            <div className="bg-white border border-outline-variant/20 p-6">
              <p className="font-headline text-4xl text-primary leading-none">{tour.rating?.toFixed(1) ?? '0.0'}</p>
              <div className="flex gap-1 mt-3 text-secondary">
                {Array.from({ length: 5 }).map((_, index) => (
                  <span key={index} className="material-symbols-outlined text-lg" style={{ fontVariationSettings: `'FILL' ${index < Math.round(tour.rating ?? 0) ? 1 : 0}` }}>
                    star
                  </span>
                ))}
              </div>
              <p className="text-sm text-primary/60 mt-3">{tour.reviewCount ?? reviewItems.length} lượt đánh giá</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {reviewItems.length === 0 ? (
                <div className="md:col-span-2 xl:col-span-3 bg-white border border-outline-variant/20 p-6 text-sm text-primary/55">
                  Chưa có đánh giá nào cho lịch trình này.
                </div>
              ) : reviewItems.map((review) => (
                <article key={review.id} className="bg-white border border-outline-variant/20 p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="font-semibold text-primary">{review.authorName}</p>
                      <p className="text-xs text-primary/45">{new Date(review.createdAt).toLocaleDateString('vi-VN')}</p>
                    </div>
                    <div className="flex text-secondary">
                      {Array.from({ length: review.rating }).map((_, index) => (
                        <span key={index} className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                          star
                        </span>
                      ))}
                    </div>
                  </div>
                  {review.title && <p className="text-sm font-medium text-primary mb-2">{review.title}</p>}
                  <p className="text-sm text-primary/70 leading-relaxed">{review.comment}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {displayRelatedTours.length > 0 && (
          <section className="mt-14 md:mt-16">
            <div className="flex items-center gap-4 mb-6">
              <h3 className="font-headline text-xl text-primary">Tour liên quan</h3>
              <div className="flex-grow h-px bg-outline-variant/30" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayRelatedTours.map((item) => (
                <div
                  key={item.id}
                  onClick={() => navigate(`/tours/${item.slug}`)}
                  className="public-floating-card overflow-hidden cursor-pointer group hover:border-[var(--color-secondary)] transition-all"
                >
                  <div className="aspect-[16/10] overflow-hidden">
                    <img
                      alt={item.title}
                      src={item.image || FALLBACK_TOUR_IMAGE}
                      onError={useFallbackImage}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  </div>
                  <div className="p-4">
                    <p className="text-[10px] uppercase tracking-widest text-secondary mb-1 font-label">
                      {item.category === 'domestic' ? 'Trong nước' : 'Quốc tế'}
                    </p>
                    <h4 className="font-headline text-sm text-primary leading-snug mb-2 line-clamp-2 group-hover:text-[var(--color-secondary)] transition-colors">
                      {item.title}
                    </h4>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-xs text-primary/60">{item.duration.days}N{item.duration.nights}Đ</span>
                      <span className="text-sm font-bold text-[var(--color-secondary)]">{item.price.adult.toLocaleString('vi-VN')}đ</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {activeImageIndex !== null && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <button className="absolute inset-0" onClick={() => setActiveImageIndex(null)} aria-label="Đóng xem ảnh" />
          <div className="relative z-10 max-w-6xl w-full">
            <button onClick={() => setActiveImageIndex(null)} className="absolute right-0 -top-12 text-white">
              <span className="material-symbols-outlined text-3xl">close</span>
            </button>
            <img src={safeGalleryImages[activeImageIndex] ?? safeGalleryImages[0]} alt={`${tour.title} preview`} className="w-full max-h-[80vh] object-contain rounded-sm" onError={useFallbackImage} />
          </div>
        </div>
      )}
    </div>
  );
}
