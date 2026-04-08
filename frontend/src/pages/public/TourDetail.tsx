import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { mockTours, type Tour, type DepartureScheduleEntry } from '../../data/tours';

const STATUS_SCHEDULE_LABEL: Record<DepartureScheduleEntry['status'], string> = {
  open: 'Còn chỗ',
  filling: 'Còn ít chỗ',
  full: 'Hết chỗ',
  closed: 'Đã đóng',
};

const STATUS_SCHEDULE_STYLE: Record<DepartureScheduleEntry['status'], string> = {
  open: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  filling: 'bg-amber-50 text-amber-700 border-amber-200',
  full: 'bg-red-50 text-red-600 border-red-200',
  closed: 'bg-gray-100 text-gray-500 border-gray-200',
};

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
      <main className="pt-20 pb-40 overflow-x-hidden">

        {/* Hero Gallery */}
        <section className="px-6 mb-10">
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
        <section className="px-6 mb-10 max-w-7xl mx-auto">
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
          <div className="flex items-center gap-4">
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

        {/* Main Content + Booking Card */}
        <section className="px-6 max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-8">

            {/* Left: Content */}
            <div className="flex-1 min-w-0 space-y-10">

              {/* Departure Schedule Table */}
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <h3 className="font-headline text-xl text-primary">Lịch khởi hành</h3>
                  <div className="flex-grow h-px bg-outline-variant/30" />
                </div>
                <div className="overflow-x-auto rounded-sm border border-outline-variant/30">
                  <table className="w-full min-w-[500px]">
                    <thead>
                      <tr className="bg-[var(--color-surface)] border-b border-outline-variant/30">
                        <th className="text-left text-[10px] uppercase tracking-widest text-primary/60 font-medium px-4 py-3">Ngày khởi hành</th>
                        <th className="text-center text-[10px] uppercase tracking-widest text-primary/60 font-medium px-4 py-3">Số chỗ</th>
                        <th className="text-center text-[10px] uppercase tracking-widest text-primary/60 font-medium px-4 py-3">Giá</th>
                        <th className="text-center text-[10px] uppercase tracking-widest text-primary/60 font-medium px-4 py-3">Trạng thái</th>
                        <th className="w-12" />
                      </tr>
                    </thead>
                    <tbody>
                      {tour.departureSchedule.map((schedule) => {
                        const price = schedule.priceAdjusted ?? tour.price.adult;
                        const isSelected = selectedSchedule?.id === schedule.id;
                        const isSelectable = schedule.status !== 'full' && schedule.status !== 'closed';
                        return (
                          <tr
                            key={schedule.id}
                            onClick={() => isSelectable && setSelectedSchedule(isSelected ? null : schedule)}
                            className={`border-b border-outline-variant/20 last:border-0 cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-[var(--color-secondary)]/10 border-l-2 border-l-[var(--color-secondary)]'
                                : isSelectable
                                  ? 'hover:bg-surface-container-low'
                                  : 'opacity-50 cursor-default'
                            }`}
                          >
                            <td className="px-4 py-3.5">
                              <span className="text-sm font-medium text-primary">
                                {new Date(schedule.date).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-center text-sm">
                              {schedule.availableSeats > 0 ? (
                                <span className={`font-medium ${schedule.availableSeats <= 5 ? 'text-amber-600' : 'text-primary/70'}`}>
                                  {schedule.availableSeats} chỗ
                                </span>
                              ) : (
                                <span className="text-red-500">Hết chỗ</span>
                              )}
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              {schedule.priceAdjusted && schedule.priceAdjusted < tour.price.adult ? (
                                <div className="flex flex-col items-center">
                                  <span className="text-xs text-red-500 line-through">{tour.price.adult.toLocaleString('vi-VN')}đ</span>
                                  <span className="text-sm font-bold text-[var(--color-secondary)]">{price.toLocaleString('vi-VN')}đ</span>
                                </div>
                              ) : (
                                <span className="text-sm font-medium text-primary">{price.toLocaleString('vi-VN')}đ</span>
                              )}
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <span className={`text-[10px] px-2 py-1 border font-label uppercase tracking-wider ${STATUS_SCHEDULE_STYLE[schedule.status]}`}>
                                {STATUS_SCHEDULE_LABEL[schedule.status]}
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

              {/* Highlights */}
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <h3 className="font-headline text-xl text-primary">Điểm nổi bật</h3>
                  <div className="flex-grow h-px bg-outline-variant/30" />
                </div>
                <ul className="grid grid-cols-1 gap-y-4">
                  {tour.highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-tertiary text-lg mt-0.5">check_circle</span>
                      <p className="text-sm leading-relaxed">{h}</p>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Itinerary */}
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

              {/* Thông tin cần lưu ý — collapsible accordion */}
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <h3 className="font-headline text-xl text-primary">Thông tin cần lưu ý</h3>
                  <div className="flex-grow h-px bg-outline-variant/30" />
                </div>
                <div className="bg-white border border-outline-variant/30 p-5 space-y-0">
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
                          <span className="text-xs font-medium bg-[var(--color-surface)] px-3 py-1.5 text-primary/80 min-w-[120px]">
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
                        <span className="material-symbols-outlined text-primary/40 text-base shrink-0">event</span>
                        <div>
                          <p className="font-medium text-primary text-sm">Thời hạn đặt tour</p>
                          <p className="text-primary/70 text-xs">Đặt tối thiểu {tour.bookingDeadline} ngày trước ngày khởi hành</p>
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

              {/* Related Tours */}
              {relatedTours.length > 0 && (
                <div>
                  <div className="flex items-center gap-4 mb-6">
                    <h3 className="font-headline text-xl text-primary">Tour liên quan</h3>
                    <div className="flex-grow h-px bg-outline-variant/30" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {relatedTours.map(rt => (
                      <div
                        key={rt.id}
                        onClick={() => navigate(`/tours/${rt.slug}`)}
                        className="bg-white border border-outline-variant/30 overflow-hidden cursor-pointer group hover:border-[var(--color-secondary)]/50 transition-all hover:shadow-md"
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
            </div>

            {/* Right: Booking Card (sticky) */}
            <div className="w-full lg:w-80 shrink-0">
              <div className="sticky top-24 space-y-4">
                {/* Tour Image */}
                <div className="aspect-[4/3] overflow-hidden rounded-sm">
                  <img alt={tour.title} src={tour.image} className="w-full h-full object-cover" />
                </div>

                {/* Price */}
                <div className="bg-white border border-outline-variant/30 p-5 space-y-3">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-primary/50 font-label">Giá / người lớn</p>
                      <div className="flex items-baseline gap-2">
                        {tour.originalPrice && (
                          <span className="text-xs text-red-500 line-through">
                            {tour.originalPrice.toLocaleString('vi-VN')}đ
                          </span>
                        )}
                        <span className="text-2xl font-headline font-bold text-[var(--color-secondary)]">
                          {tour.price.adult.toLocaleString('vi-VN')}đ
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-widest text-primary/50 font-label">Trẻ em</p>
                      <p className="text-sm font-medium text-primary">
                        {tour.price.child.toLocaleString('vi-VN')}đ
                      </p>
                    </div>
                  </div>

                  {/* Selected schedule */}
                  {selectedSchedule ? (
                    <div className="bg-[var(--color-secondary)]/5 border border-[var(--color-secondary)]/20 p-3 space-y-1">
                      <p className="text-[10px] uppercase tracking-widest text-secondary font-label">Đã chọn ngày khởi hành</p>
                      <p className="text-sm font-medium text-primary">
                        {new Date(selectedSchedule.date).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                      </p>
                      <p className="text-xs text-primary/60 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">group</span>
                        Còn {selectedSchedule.availableSeats} chỗ
                      </p>
                    </div>
                  ) : (
                    <div className="bg-amber-50 border border-amber-200 p-3 text-xs text-amber-700">
                      Vui lòng chọn ngày khởi hành trong bảng bên trên
                    </div>
                  )}

                  {/* Info */}
                  <div className="space-y-2 text-xs text-primary/60">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[14px] text-secondary">schedule</span>
                      <span>{tour.duration.days} ngày {tour.duration.nights} đêm</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[14px] text-secondary">directions_bus</span>
                      <span>{tour.transport === 'xe' ? 'Xe du lịch' : 'Máy bay'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[14px] text-secondary">event</span>
                      <span>Đặt tối thiểu {tour.bookingDeadline} ngày trước</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[14px] text-secondary">group</span>
                      <span>Tối thiểu {tour.minParticipants} khách</span>
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="flex flex-col gap-3 pt-2">
                    <button
                      onClick={handleBook}
                      disabled={!selectedSchedule}
                      className={`w-full py-4 font-sans uppercase tracking-[0.2em] text-[12px] font-bold transition-all ${
                        selectedSchedule
                          ? 'bg-primary text-surface hover:bg-[var(--color-secondary)] cursor-pointer'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      Đặt tour
                    </button>
                    <button
                      onClick={toggleWishlist}
                      className={`w-full py-3.5 font-sans uppercase tracking-[0.15em] text-[10px] font-bold border transition-all flex items-center justify-center gap-2 ${
                        isWishlisted
                          ? 'border-[var(--color-tertiary)] text-[var(--color-tertiary)] hover:bg-[var(--color-tertiary)]/5'
                          : 'border-primary text-primary hover:bg-primary hover:text-surface'
                      }`}
                    >
                      <span
                        className="material-symbols-outlined text-lg"
                        style={{ fontVariationSettings: isWishlisted ? "'FILL' 1" : "'FILL' 0" }}
                      >
                        favorite
                      </span>
                      {isWishlisted ? 'Đã lưu' : 'Lưu yêu thích'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-[60] bg-surface shadow-[0_-10px_30px_rgba(42,36,33,0.08)] px-6 pt-4 pb-8 border-t border-outline-variant/30 hidden md:block">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <img alt={tour.title} src={tour.image} className="w-14 h-14 object-cover rounded-sm" />
            <div>
              <p className="text-sm font-serif font-medium text-primary line-clamp-1">{tour.title}</p>
              <p className="text-xs text-primary/60">{tour.duration.days}N{ tour.duration.nights}Đ · {tour.departurePoint}</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-widest text-primary/50">Từ</p>
              <p className="text-2xl font-headline font-bold text-[var(--color-secondary)]">
                {tour.price.adult.toLocaleString('vi-VN')}đ
              </p>
            </div>
            <button
              onClick={handleBook}
              disabled={!selectedSchedule}
              className={`px-10 py-4 font-sans uppercase tracking-[0.2em] text-[12px] font-bold transition-all ${
                selectedSchedule
                  ? 'bg-primary text-surface hover:bg-[var(--color-secondary)]'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Đặt tour
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
