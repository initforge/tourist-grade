import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '@shared/store/useAuthStore';
import { mockTours, type DepartureScheduleEntry } from '@entities/tour/data/tours';

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

interface ScheduleRow {
  month: number;
  monthLabel: string;
  date: DepartureScheduleEntry;
}

function buildScheduleRows(schedules: DepartureScheduleEntry[]): ScheduleRow[] {
  const sorted = [...schedules]?.sort((a, b) => a?.date?.localeCompare(b?.date));
  const seen = new Set<number>();

  return sorted?.map(schedule => {
    const parsed = new Date(schedule?.date);
    const month = parsed?.getMonth() + 1;
    const monthLabel = seen?.has(month) ? '' : MONTH_NAMES[month];
    seen?.add(month);
    return { month, monthLabel, date: schedule };
  });
}

export default function TourDetail() {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const user = useAuthStore(s => s?.user);
  const isCustomer = user?.role === 'customer';
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<DepartureScheduleEntry | null>(null);
  const [expandedAccordion, setExpandedAccordion] = useState<string | null>(null);

  const tour = mockTours?.find(item => item.slug === slug);

  if (!tour) {
    return (
      <div className="public-page min-h-screen flex items-center justify-center pt-20">
        <div className="text-center space-y-4">
          <span className="material-symbols-outlined text-5xl text-[#D0C5AF]">search_off</span>
          <p className="text-lg text-[#2A2421]/60">Khàng tìm thấy tour này</p>
          <button onClick={() => navigate('/tours')} className="text-[#D4AF37] hover:underline text-sm">
            Quay lại danh sách tour
          </button>
        </div>
      </div>
    );
  }

  const relatedTours = mockTours?.filter(item => item?.id !== tour?.id && item.category === 'domestic')?.slice(0, 3);
  const scheduleRows = buildScheduleRows(tour?.departureSchedule);
  const fallbackSchedule = scheduleRows?.find(row => row?.date.status === 'open' || row?.date.status === 'filling')?.date ?? scheduleRows[0]?.date ?? null;
  const activeSchedule = selectedSchedule ?? fallbackSchedule;
  const activeAdultPrice = activeSchedule?.priceAdult ?? tour?.price?.adult;
  const galleryImages = [tour?.image, ...tour?.gallery]?.slice(0, 4);
  const sideTopImage = galleryImages[1] ?? tour?.image;
  const sideBottomImages = [galleryImages[2] ?? tour?.image, galleryImages[3] ?? sideTopImage];

  const toggleWishlist = (event: React.MouseEvent) => {
    event?.preventDefault();
    if (!isCustomer) {
      navigate('/login');
      return;
    }
    setIsWishlisted(current => !current);
  };

  const handleBook = () => {
    if (!activeSchedule) return;
    navigate(`/tours/${slug}/book?scheduleId=${activeSchedule?.id}`);
  };

  const toggleAccordion = (key: string) => {
    setExpandedAccordion(current => current === key ? null : key);
  };

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
      <main className="public-container public-hero pb-16 md:pb-20 overflow-x-hidden">
        <section className="mb-6 md:mb-8">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.85fr)]">
            <button type="button" className="public-media-frame relative aspect-[16/11] md:aspect-[16/10] lg:min-h-[420px] group text-left">
              <img alt={tour?.title} className="w-full h-full object-cover" src={galleryImages[0]} />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all" />
              <div className="absolute bottom-4 left-4 bg-white/90 px-3 py-1 text-[10px] tracking-[0.2em] uppercase font-medium text-primary">
                {tour.category === 'domestic' ? 'Trong nước' : 'Quốc tế'}
              </div>
            </button>

            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-1 lg:grid-rows-[minmax(0,1fr)_minmax(0,1fr)]">
              <div className="public-media-frame aspect-[16/10] md:aspect-[4/3] lg:min-h-[204px] overflow-hidden">
                <img alt={`${tour?.title} 2`} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500" src={sideTopImage} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="public-media-frame aspect-square overflow-hidden">
                  <img alt={`${tour?.title} 3`} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500" src={sideBottomImages[0]} />
                </div>
                <div className="public-media-frame relative aspect-square overflow-hidden">
                  <img alt={`${tour?.title} 4`} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500" src={sideBottomImages[1]} />
                  <div className="absolute inset-0 bg-primary/45 flex items-center justify-center">
                    <span className="text-white font-label text-xs tracking-widest">+{galleryImages?.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-8 md:mb-10">
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
          <h1 className="font-headline text-3xl md:text-4xl leading-tight tracking-tight text-primary mb-4 max-w-4xl">
            {tour?.title}
          </h1>
          <div className="flex items-center gap-x-4 gap-y-2 flex-wrap text-sm text-primary/70">
            {tour?.rating && (
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>
                  star
                </span>
                <span>{tour?.rating} ({tour?.reviewCount} đánh giá)</span>
              </div>
            )}
            <div className="hidden md:block w-px h-3 bg-outline-variant/40" />
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">location_on</span>
              <span>{tour?.departurePoint} → {tour?.sightseeingSpots?.join(', ')}</span>
            </div>
            <div className="hidden md:block w-px h-3 bg-outline-variant/40" />
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">schedule</span>
              <span>{tour?.duration?.days}N{tour?.duration?.nights}Đ</span>
            </div>
          </div>
        </section>

        <section>
          <div className="flex flex-col lg:flex-row gap-6 xl:gap-8 items-start">
            <div className="flex-1 min-w-0 space-y-8 md:space-y-10">
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <h3 className="font-headline text-xl text-primary">Lịch khởi hành</h3>
                  <div className="flex-grow h-px bg-outline-variant/30" />
                </div>
                <div id="tour-schedule-table" className="overflow-x-auto rounded-sm border border-[var(--color-primary)]/20 bg-white">
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
                      {scheduleRows?.map(row => {
                        const schedule = row?.date;
                        const isSelected = selectedSchedule?.id === schedule?.id;
                        const isSelectable = schedule?.status !== 'full' && schedule?.status !== 'closed';
                        const adultPrice = schedule?.priceAdult ?? tour?.price?.adult;
                        const childPrice = schedule?.priceChild ?? tour?.price?.child;
                        const infantPrice = schedule?.priceInfant ?? (tour?.price?.infant ?? 0);

                        return (
                          <tr
                            key={schedule?.id}
                            onClick={() => isSelectable && setSelectedSchedule(isSelected ? null : schedule)}
                            className={`border-b border-[var(--color-primary)]/10 last:border-0 cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-[var(--color-secondary)]/10 border-l-4 border-l-[var(--color-secondary)]'
                                : isSelectable
                                  ? 'hover:bg-[var(--color-surface)]'
                                  : 'opacity-50 cursor-default'
                            }`}
                          >
                            <td className="px-4 py-3.5 text-center text-sm font-semibold text-[var(--color-secondary)]">{row?.monthLabel}</td>
                            <td className="px-4 py-3.5 text-sm font-medium text-primary">
                              {new Date(schedule?.date)?.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                            </td>
                            <td className="px-4 py-3.5 text-right text-sm font-bold text-primary">{adultPrice?.toLocaleString('vi-VN')}đ</td>
                            <td className="px-4 py-3.5 text-right text-sm text-primary/70">{childPrice?.toLocaleString('vi-VN')}đ</td>
                            <td className="px-4 py-3.5 text-right text-sm text-primary/70">{infantPrice?.toLocaleString('vi-VN')}đ</td>
                            <td className="px-4 py-3.5 text-right text-sm text-primary/60">
                              {schedule?.singleRoomSurcharge ? `+${schedule?.singleRoomSurcharge?.toLocaleString('vi-VN')}đ` : '—'}
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              {schedule?.availableSeats > 0 ? (
                                <span className={`font-bold text-sm ${schedule?.availableSeats <= 5 ? 'text-red-500' : 'text-primary'}`}>
                                  {schedule?.availableSeats}
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

              <div className="relative">
                <div className="hidden md:block absolute left-10 top-24 bottom-10 vertical-gold-thread" />
                <div className="flex items-center gap-4 mb-8">
                  <h3 className="font-headline text-xl text-primary">Lịch trình chi tiết</h3>
                  <div className="flex-grow h-px bg-outline-variant/30" />
                </div>
                <div className="space-y-10 md:space-y-12">
                  {tour?.itinerary?.map((day, index) => (
                    <div key={day?.day} className="relative pl-8 md:pl-12">
                      <div className={`absolute left-[4px] md:left-[13px] top-1 w-[11px] h-[11px] border border-surface shadow-sm ring-4 ring-surface ${
                        index === 0 ? 'bg-secondary' : 'bg-outline-variant'
                      }`} />
                      <div className="mb-3">
                        <span className={`font-label text-[10px] uppercase tracking-widest ${
                          index === 0 ? 'text-secondary' : 'text-secondary/60'
                        }`}>
                          Ngày {String(day?.day)?.padStart(2, '0')}
                        </span>
                        <h4 className="font-headline text-lg mt-1 text-primary">{day?.title}</h4>
                        {day?.meals?.length > 0 && (
                          <div className="flex gap-2 mt-2 flex-wrap">
                            {day?.meals?.map(meal => (
                              <span key={meal} className="text-[10px] bg-[var(--color-surface)] px-2 py-1 text-primary/60 font-label uppercase tracking-wider">
                                {meal === 'breakfast' ? 'Sáng' : meal === 'lunch' ? 'Trưa' : 'Tối'}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-primary/70 leading-relaxed">{day?.description}</p>
                      {day?.activities?.length > 0 && (
                        <ul className="mt-3 space-y-1.5">
                          {day?.activities?.map((activity, activityIndex) => (
                            <li key={activityIndex} className="flex items-center gap-2 text-xs text-primary/60">
                              <span className="w-1 h-1 rounded-full bg-[var(--color-secondary)]" />
                              {activity}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
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
                      {tour?.inclusions?.map((item, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="material-symbols-outlined text-emerald-500 text-base shrink-0">check</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </AccordionItem>

                  <AccordionItem title="Giá tour không bao gồm" keyName="exclusions">
                    <ul className="space-y-2">
                      {tour?.exclusions?.map((item, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="material-symbols-outlined text-red-400 text-base shrink-0">close</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </AccordionItem>

                  <AccordionItem title="Giá trẻ em" keyName="child">
                    <p>{tour?.childPolicy}</p>
                  </AccordionItem>

                  <AccordionItem title="Chính sách hủy tour" keyName="cancel">
                    <div className="space-y-3">
                      {tour?.cancellationPolicy?.map((tier, index) => (
                        <div key={index} className="flex items-center gap-3 flex-wrap">
                          <span className="text-xs font-medium bg-[var(--color-surface)] px-3 py-1.5 text-primary/80 min-w-[140px]">
                            {tier?.daysBefore} ngày trước
                          </span>
                          <span className="text-sm">
                            → Hoàn <strong className="text-[var(--color-secondary)]">{tier?.refundPercent}%</strong> giá tour
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
                          <p className="text-primary/70 text-xs">{tour.transport === 'xe' ? 'Xe du lịch' : 'Máy bay'} {tour?.arrivalPoint && `→ ${tour?.arrivalPoint}`}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-primary/40 text-base shrink-0">location_on</span>
                        <div>
                          <p className="font-medium text-primary text-sm">Khởi hành</p>
                          <p className="text-primary/70 text-xs">{tour?.departurePoint}</p>
                        </div>
                      </div>
                      {tour.tourType === 'mua_le' && tour?.holiday && (
                        <div className="flex items-start gap-3">
                          <span className="material-symbols-outlined text-primary/40 text-base shrink-0">celebration</span>
                          <div>
                            <p className="font-medium text-primary text-sm">Dịp lễ</p>
                            <p className="text-primary/70 text-xs">{tour?.holiday}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </AccordionItem>
                </div>
              </div>
            </div>

            <div className="w-full lg:w-[320px] xl:w-[340px] shrink-0 lg:sticky lg:top-24">
              <div className="public-floating-card overflow-hidden">
                <div className="p-5 space-y-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-primary/50 font-label mb-2">Giá</p>
                    <div className="flex items-end gap-2 flex-wrap">
                      <span className="font-headline text-3xl font-bold text-[var(--color-secondary)]">
                        {activeAdultPrice?.toLocaleString('vi-VN')}đ
                      </span>
                      <span className="text-sm text-primary/60 mb-1">/ khách</span>
                    </div>
                    {tour?.originalPrice && (
                      <p className="text-xs text-primary/35 line-through mt-1">
                        {tour?.originalPrice?.toLocaleString('vi-VN')}đ
                      </p>
                    )}
                  </div>

                  <div className="space-y-3 border-y border-[var(--color-surface)] py-4">
                    <div className="flex items-start gap-3 text-sm">
                      <span className="material-symbols-outlined text-primary/45 text-[18px] mt-0.5">confirmation_number</span>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-primary/45 font-label mb-0.5">Mã tour</p>
                        <p className="font-semibold text-primary">{tour?.id}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 text-sm">
                      <span className="material-symbols-outlined text-primary/45 text-[18px] mt-0.5">location_on</span>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-primary/45 font-label mb-0.5">Khởi hành</p>
                        <p className="font-semibold text-primary">{tour?.departurePoint}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 text-sm">
                      <span className="material-symbols-outlined text-primary/45 text-[18px] mt-0.5">calendar_month</span>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-primary/45 font-label mb-0.5">Ngày khởi hành</p>
                        <p className="font-semibold text-primary">
                          {activeSchedule
                            ? new Date(activeSchedule?.date)?.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
                            : 'Chọn trong bảng lịch'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 text-sm">
                      <span className="material-symbols-outlined text-primary/45 text-[18px] mt-0.5">schedule</span>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-primary/45 font-label mb-0.5">Thời gian</p>
                        <p className="font-semibold text-primary">{tour?.duration?.days}N{tour?.duration?.nights}Đ</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 text-sm">
                      <span className="material-symbols-outlined text-primary/45 text-[18px] mt-0.5">event_seat</span>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-primary/45 font-label mb-0.5">Số chỗ còn</p>
                        <p className="font-semibold text-primary">{activeSchedule?.availableSeats ?? tour?.availableSeats}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-[minmax(0,112px)_1fr] gap-2">
                    <button
                      type="button"
                      onClick={() => document?.getElementById('tour-schedule-table')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
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

                  {!selectedSchedule && activeSchedule && (
                    <p className="text-center text-[11px] text-primary/45 italic">
                      Đang hiển thị lịch gần nhất?. Bạn có thể đổi ở bảng lịch phóa trái?.
                    </p>
                  )}
                </div>
              </div>

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

        {relatedTours?.length > 0 && (
          <section className="mt-14 md:mt-16">
            <div className="flex items-center gap-4 mb-6">
              <h3 className="font-headline text-xl text-primary">Tour liên quan</h3>
              <div className="flex-grow h-px bg-outline-variant/30" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedTours?.map(item => (
                <div
                  key={item?.id}
                  onClick={() => navigate(`/tours/${item?.slug}`)}
                  className="public-floating-card overflow-hidden cursor-pointer group hover:border-[var(--color-secondary)] transition-all"
                >
                  <div className="aspect-[16/10] overflow-hidden">
                    <img
                      alt={item?.title}
                      src={item?.image}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  </div>
                  <div className="p-4">
                    <p className="text-[10px] uppercase tracking-widest text-secondary mb-1 font-label">
                      {item.category === 'domestic' ? 'Trong nước' : 'Quốc tế'}
                    </p>
                    <h4 className="font-headline text-sm text-primary leading-snug mb-2 line-clamp-2 group-hover:text-[var(--color-secondary)] transition-colors">
                      {item?.title}
                    </h4>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-xs text-primary/60">{item?.duration?.days}N{item?.duration?.nights}Đ</span>
                      <span className="text-sm font-bold text-[var(--color-secondary)]">{item?.price?.adult?.toLocaleString('vi-VN')}đ</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

