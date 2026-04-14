import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { mockTours } from '@entities/tour/data/tours';
import { mockBookings, type Passenger } from '@entities/booking/data/bookings';
import { useAuthStore } from '@shared/store/useAuthStore';
import type { Tour, DepartureScheduleEntry } from '@entities/tour/data/tours';


interface ContactInfo {
  name: string;
  phone: string;
  email: string;
  note: string;
}

export default function BookingCheckout() {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const scheduleId = searchParams?.get('scheduleId') ?? '';
  const user = useAuthStore(s => s?.user);

  const tour = mockTours?.find(t => t.slug === slug);
  const schedule: DepartureScheduleEntry | undefined = tour?.departureSchedule?.find(s => s.id === scheduleId);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'bank' | 'card'>('bank');
  const [paymentRatio, setPaymentRatio] = useState<'deposit' | 'full'>('full');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Số phòng
  const [roomCounts, setRoomCounts] = useState({ single: 0, double: 1, triple: 0 });

  // Contact
  const [contact, setContact] = useState<ContactInfo>({
    name: user?.name ?? '',
    phone: user?.phone ?? '',
    email: user?.email ?? '',
    note: '',
  });

  // Passenger counts
  const maxSeats = schedule?.availableSeats ?? 30;
  const [counts, setCounts] = useState({ adult: 1, child: 0, infant: 0 });
  const totalPassengers = counts?.adult + counts?.child + counts?.infant;

  // Passengers
  const buildPassengers = (): Passenger[] => {
    const list: Passenger[] = [];
    for (let i = 0; i < counts?.adult; i++) {
      list?.push({ type: 'adult', name: '', dob: '', gender: 'male', nationality: 'Việt Nam', singleRoomSupplement: 0 });
    }
    for (let i = 0; i < counts?.child; i++) {
      list?.push({ type: 'child', name: '', dob: '', gender: 'male', nationality: 'Việt Nam' });
    }
    for (let i = 0; i < counts?.infant; i++) {
      list?.push({ type: 'infant', name: '', dob: '', gender: 'male', nationality: 'Việt Nam' });
    }
    return list;
  };

  const [passengers, setPassengers] = useState<Passenger[]>(buildPassengers());

  // Re-sync when counts change
  const syncPassengers = (newCounts: typeof counts) => {
    const list: Passenger[] = [];
    for (let i = 0; i < newCounts?.adult; i++) {
      list?.push({ type: 'adult', name: '', dob: '', gender: 'male', nationality: 'Việt Nam', singleRoomSupplement: 0 });
    }
    for (let i = 0; i < newCounts?.child; i++) {
      list?.push({ type: 'child', name: '', dob: '', gender: 'male', nationality: 'Việt Nam' });
    }
    for (let i = 0; i < newCounts?.infant; i++) {
      list?.push({ type: 'infant', name: '', dob: '', gender: 'male', nationality: 'Việt Nam' });
    }
    setPassengers(list);
  };

  const updatePassenger = (idx: number, field: keyof Passenger, value: string | number) => {
    setPassengers(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  // Pricing
  const priceAdult = schedule?.priceAdult ?? tour?.price?.adult ?? 0;
  const priceChild = tour?.price?.child ?? 0;
  const priceInfant = tour?.price?.infant ?? 0;
  const singleRoomPrice = 500000; // mock phụ thu phòng đơn
  const totalSingleRoomSupplement = passengers
    ?.filter(p => p.type === 'adult' && p?.singleRoomSupplement)
    ?.reduce((sum, p) => sum + (p?.singleRoomSupplement ?? 0), 0);
  const discount = promoApplied ? Math.round(priceAdult * 0.1) : 0; // mock 10%
  const subtotal = counts?.adult * priceAdult + counts?.child * priceChild + counts?.infant * priceInfant + totalSingleRoomSupplement - discount;
  const paymentAmount = paymentRatio === 'deposit' ? Math.ceil(subtotal * 0.5) : subtotal;
  const remainingAmount = Math.max(subtotal - paymentAmount, 0);

  const canProceedContact = Boolean(contact?.name?.trim() && contact?.phone?.trim() && contact?.email?.trim());
  const canProceedPassengers = totalPassengers > 0
    && totalPassengers <= maxSeats
    && passengers?.every(p => p?.name?.trim() && p?.dob && p?.gender);

  const handleApplyPromo = () => {
    if (promoCode?.toUpperCase() === 'TRAVELA10') {
      setPromoApplied(true);
    }
  };

  const handleSubmit = async () => {
    if (!canProceedPassengers) return;
    setIsSubmitting(true);

    // Simulate API delay
    await new Promise(r => setTimeout(r, 1200));

    // Create booking in memory
    const newBooking = {
      id: `B${String(mockBookings?.length + 1)?.padStart(3, '0')}`,
      bookingCode: `BK-${Math.floor(Math.random() * 900000 + 100000)}`,
      tourId: tour!?.id,
      tourName: tour!?.title,
      tourDate: schedule?.date ?? '',
      tourDuration: `${tour!?.duration?.days}N${tour!?.duration?.nights}Đ`,
      userId: user?.id,
      status: 'booked' as const,
      refundStatus: 'none' as const,
      passengers,
      contactInfo: contact,
      totalAmount: subtotal,
      paidAmount: paymentAmount,
      remainingAmount,
      paymentMethod: paymentMethod === 'bank' ? 'vnpay' : 'stripe',
      paymentType: 'online' as const,
      paymentStatus: remainingAmount > 0 ? ('partial' as const) : ('paid' as const),
      paymentTransactions: [{
        id: `TX${Date.now()}`,
        amount: paymentAmount,
        method: paymentMethod === 'bank' ? 'vnpay' : 'stripe',
        status: 'completed' as const,
        paidAt: new Date()?.toISOString(),
      }],
      roomCounts,
      promoCode: promoApplied ? promoCode : undefined,
      discountAmount: discount,
      createdAt: new Date()?.toISOString(),
    };

    // Navigate with booking data
    navigate('/booking/success', {
      state: { bookingId: newBooking?.id, bookingCode: newBooking?.bookingCode, tourName: tour!?.title, amount: subtotal }
    });
  };

  if (!tour || !schedule) {
    return (
      <div className="w-full bg-[var(--color-background)] min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <span className="material-symbols-outlined text-5xl text-[#D0C5AF]">error</span>
          <p className="text-lg text-[#2A2421]/60">Tour không hợp lệ hoặc đã hết chỗ</p>
          <button onClick={() => navigate('/tours')} className="text-[#D4AF37] hover:underline">
            Quay lại danh sách tour
          </button>
        </div>
      </div>
    );
  }

  const passengerTypeLabel = (type: Passenger['type']) =>
    type === 'adult' ? 'Người lớn' : type === 'child' ? 'Trẻ em' : 'Em bé';

  return (
    <div className="w-full bg-[var(--color-background)] min-h-screen pb-20 md:pb-24">
      <main className="pt-6 md:pt-8 px-4 sm:px-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6 md:mb-8">
          <button
            onClick={() => step > 1 ? setStep((step - 1) as 1 | 2 | 3) : navigate(`/tours/${slug}`)}
            className="flex items-center gap-2 hover:opacity-70 transition-opacity"
          >
            <span className="material-symbols-outlined text-[var(--color-primary)]">arrow_back</span>
          </button>
          <div>
            <h1 className="font-serif text-2xl text-primary">Thủ tục đặt chỗ</h1>
            <p className="text-xs text-primary/50 font-sans mt-0.5">
              {tour?.title} · {new Date(schedule?.date)?.toLocaleDateString('vi-VN')}
            </p>
          </div>
        </div>

        {/* Stepper */}
        <div className="mb-8 md:mb-10 max-w-3xl w-full">
          <div className="flex items-center gap-0 relative">
            <div className="absolute top-4 left-0 w-full h-[1px] bg-outline-variant/30 -z-10" />
            {[
              { id: 1, label: 'Liên hệ' },
              { id: 2, label: 'Hành khách' },
              { id: 3, label: 'Thanh toán' },
            ]?.map(item => (
              <div key={item?.id} className="flex flex-col items-center gap-2 flex-1">
                <div className={`w-8 h-8 flex items-center justify-center border text-sm font-bold transition-all ${
                  step >= item?.id
                    ? 'border-[var(--color-secondary)] text-[var(--color-secondary)] bg-[var(--color-secondary)]/10'
                    : 'border-outline-variant/40 text-primary/30'
                }`}>
                  {item?.id}
                </div>
                <span className={`text-[10px] uppercase tracking-widest font-label ${
                  step >= item?.id ? 'text-[var(--color-secondary)] font-semibold' : 'text-primary/30'
                }`}>
                  {item?.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">

          {/* Main content */}
          <div className="flex-1 min-w-0 space-y-8">

            {/* STEP 1 */}
            {step === 1 && (
              <div className="space-y-8">
                {/* Contact Info */}
                <section>
                  <h2 className="font-headline text-xl text-primary mb-1">Thông tin liên hệ</h2>
                  <p className="text-xs text-primary/50 font-light italic mb-6">Thàng tin xác nhận đặt tour sẽ gửi đến email này</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-5">
                      <div className="relative group">
                        <label className="block text-[10px] font-label uppercase tracking-widest text-primary/60 mb-1">
                          Họ và tên <span className="text-red-500">*</span>
                        </label>
                        <input
                          value={contact?.name}
                          onChange={e => setContact(c => ({ ...c, name: e?.target?.value }))}
                          className="w-full bg-transparent border-t-0 border-x-0 border-b border-outline-variant focus:border-[var(--color-secondary)] px-0 py-2 text-sm placeholder:text-primary/20 transition-all"
                          placeholder="Nguyễn Văn A"
                        />
                      </div>
                      <div className="relative group">
                        <label className="block text-[10px] font-label uppercase tracking-widest text-primary/60 mb-1">
                          Số điện thoại <span className="text-red-500">*</span>
                        </label>
                        <input
                          value={contact?.phone}
                          onChange={e => setContact(c => ({ ...c, phone: e?.target?.value }))}
                          className="w-full bg-transparent border-t-0 border-x-0 border-b border-outline-variant focus:border-[var(--color-secondary)] px-0 py-2 text-sm placeholder:text-primary/20 transition-all"
                          placeholder="0901 234 567"
                        />
                      </div>
                      <div className="relative group">
                        <label className="block text-[10px] font-label uppercase tracking-widest text-primary/60 mb-1">
                          Email <span className="text-red-500">*</span>
                        </label>
                        <input
                          value={contact?.email}
                          onChange={e => setContact(c => ({ ...c, email: e?.target?.value }))}
                          className="w-full bg-transparent border-t-0 border-x-0 border-b border-outline-variant focus:border-[var(--color-secondary)] px-0 py-2 text-sm placeholder:text-primary/20 transition-all"
                          placeholder="email@example.com"
                        />
                      </div>
                      <div className="relative group">
                        <label className="block text-[10px] font-label uppercase tracking-widest text-primary/60 mb-1">
                          Yêu cầu đặc biệt
                        </label>
                        <textarea
                          value={contact?.note}
                          onChange={e => setContact(c => ({ ...c, note: e?.target?.value }))}
                          className="w-full bg-transparent border-t-0 border-x-0 border-b border-outline-variant focus:border-[var(--color-secondary)] px-0 py-2 text-sm placeholder:text-primary/20 transition-all resize-none"
                          rows={2}
                          placeholder="Chế độ ăn, dịch vụ đón tiễn..."
                        />
                      </div>
                    </div>
                  </div>
                </section>

                <div className="flex justify-end pt-4">
                  <button
                    onClick={() => setStep(2)}
                    disabled={!canProceedContact}
                    className={`px-12 py-4 font-sans uppercase tracking-[0.2em] text-[12px] font-bold transition-all ${
                      canProceedContact
                        ? 'bg-primary text-surface hover:bg-[var(--color-secondary)]'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Tiếp tục: Hành khách
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <div className="space-y-8">
                <section>
                  <h2 className="font-headline text-xl text-primary mb-1">Số lượng hành khách</h2>
                  <p className="text-xs text-primary/50 font-light italic mb-5">
                    Tối đa {maxSeats} người · {maxSeats - totalPassengers} chỗ còn trống
                  </p>

                  {totalPassengers > maxSeats && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 mb-4 rounded-sm">
                      Số lượng hành khách vượt quá chỗ trống ({maxSeats} chỗ)
                    </div>
                  )}

                  <div className="space-y-4">
                    {(['adult', 'child', 'infant'] as const)?.map(type => (
                      <div key={type} className="flex items-center justify-between p-4 bg-white border border-outline-variant/30">
                        <div>
                          <p className="text-sm font-medium text-primary">{passengerTypeLabel(type)}</p>
                          <p className="text-xs text-primary/50 mt-0.5">
                            {type === 'adult' ? `${priceAdult?.toLocaleString('vi-VN')}đ / người` :
                             type === 'child' ? `${priceChild?.toLocaleString('vi-VN')}đ / người` :
                             `${priceInfant?.toLocaleString('vi-VN')}đ / người (không chiếm ghế)`}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => {
                              const next = { ...counts, [type]: Math.max(type === 'adult' ? 1 : 0, counts[type] - 1) };
                              setCounts(next);
                              syncPassengers(next);
                            }}
                            className="w-8 h-8 border border-outline-variant/50 flex items-center justify-center hover:border-[var(--color-secondary)] transition-colors"
                          >
                            <span className="material-symbols-outlined text-base">remove</span>
                          </button>
                          <span className="text-lg font-bold w-8 text-center">{counts[type]}</span>
                          <button
                            onClick={() => {
                              const next = { ...counts, [type]: counts[type] + 1 };
                              setCounts(next);
                              syncPassengers(next);
                            }}
                            className="w-8 h-8 border border-outline-variant/50 flex items-center justify-center hover:border-[var(--color-secondary)] transition-colors"
                          >
                            <span className="material-symbols-outlined text-base">add</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <h2 className="font-headline text-xl text-primary mb-6">
                    Thàng tin hành khách
                    <span className="ml-3 text-sm font-sans font-normal bg-[var(--color-secondary)]/10 text-[var(--color-secondary)] px-3 py-1 rounded-full">
                      {totalPassengers} khách
                    </span>
                  </h2>
                  <div className="space-y-6">
                    {passengers?.map((p, idx) => (
                      <div key={idx} className="p-6 bg-white border border-outline-variant/30 space-y-5 hover:border-[var(--color-secondary)]/30 transition-colors">
                        <h3 className="flex items-center gap-2 font-label text-xs uppercase tracking-widest font-bold text-primary">
                          <span className="material-symbols-outlined text-sm text-[var(--color-secondary)]" style={{ fontVariationSettings: "'FILL' 1" }}>
                            person
                          </span>
                          {passengerTypeLabel(p?.type)} {idx < counts?.adult ? idx + 1 : idx - counts?.adult + 1}
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                          <div>
                            <label className="block text-[10px] font-label uppercase tracking-widest text-primary/60 mb-1">
                              Họ và tên <span className="text-red-500">*</span>
                            </label>
                            <input
                              value={p?.name}
                              onChange={e => updatePassenger(idx, 'name', e?.target?.value)}
                              className="w-full bg-transparent border-t-0 border-x-0 border-b border-outline-variant focus:border-[var(--color-secondary)] px-0 py-2 text-sm placeholder:text-primary/20 transition-all"
                              placeholder="Đúng theo CCCD/Passport"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-label uppercase tracking-widest text-primary/60 mb-1">
                              CCCD / Passport
                            </label>
                            <input
                              value={p?.cccd ?? ''}
                              onChange={e => updatePassenger(idx, 'cccd', e?.target?.value)}
                              className="w-full bg-transparent border-t-0 border-x-0 border-b border-outline-variant focus:border-[var(--color-secondary)] px-0 py-2 text-sm placeholder:text-primary/20 transition-all"
                              placeholder="001 085 012 345"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-label uppercase tracking-widest text-primary/60 mb-1">
                              Ngày sinh <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="date"
                              value={p?.dob}
                              onChange={e => updatePassenger(idx, 'dob', e?.target?.value)}
                              className="w-full bg-transparent border-t-0 border-x-0 border-b border-outline-variant focus:border-[var(--color-secondary)] px-0 py-2 text-sm transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-label uppercase tracking-widest text-primary/60 mb-1">
                              Giới tính <span className="text-red-500">*</span>
                            </label>
                            <div className="flex gap-4 pt-2">
                              {(['male', 'female'] as const)?.map(g => (
                                <label key={g} className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="radio"
                                    name={`gender-${idx}`}
                                    checked={p.gender === g}
                                    onChange={() => updatePassenger(idx, 'gender', g)}
                                    className="accent-[var(--color-secondary)]"
                                  />
                                  <span className="text-sm">{g === 'male' ? 'Nam' : 'Nữ'}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-label uppercase tracking-widest text-primary/60 mb-1">
                              Quốc tịch
                            </label>
                            <input
                              value={p?.nationality ?? 'Việt Nam'}
                              onChange={e => updatePassenger(idx, 'nationality', e?.target?.value)}
                              className="w-full bg-transparent border-t-0 border-x-0 border-b border-outline-variant focus:border-[var(--color-secondary)] px-0 py-2 text-sm placeholder:text-primary/20 transition-all"
                              placeholder="Việt Nam"
                            />
                          </div>
                          {p.type === 'adult' && (
                            <div className="rounded-sm border border-outline-variant/30 bg-[var(--color-surface)]/60 p-4">
                              <p className="text-[10px] font-label uppercase tracking-widest text-primary/60 mb-2">Tùy chọn phòng</p>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={(p?.singleRoomSupplement ?? 0) > 0}
                    onChange={e => updatePassenger(idx, 'singleRoomSupplement', e?.target?.checked ? (schedule?.singleRoomSurcharge ?? 0) : 0)}
                    aria-label="Phòng đơn"
                    className="h-5 w-5 shrink-0 cursor-pointer accent-[var(--color-secondary)]"
                  />
                  <div className="min-w-0">
                                  <p className="text-sm font-medium text-primary">Phòng đơn</p>
                                  <p className="text-xs text-primary/50">Phụ thu +{(schedule?.singleRoomSurcharge ?? 0)?.toLocaleString('vi-VN')}đ</p>
                                </div>
                              </label>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <div className="space-y-8">
                <div>
                  <h2 className="font-headline text-2xl text-primary">Xác nhận thông tin</h2>
                  <p className="text-xs text-primary/50 mt-0.5">Kiểm tra kỹ thông tin trước khi thanh toán</p>
                </div>

                {/* Contact info review */}
                <section className="bg-white border border-outline-variant/30 p-6">
                  <h3 className="font-headline text-lg text-primary mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[var(--color-secondary)]">contact_phone</span>
                    Thàng tin liên hệ
                  </h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-primary/40 font-label">Họ tên</p>
                      <p className="text-sm font-medium text-primary mt-1">{contact?.name}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-primary/40 font-label">Số điện thoại</p>
                      <p className="text-sm font-medium text-primary mt-1">{contact?.phone}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-primary/40 font-label">Email</p>
                      <p className="text-sm font-medium text-primary mt-1">{contact?.email}</p>
                    </div>
                    {contact?.note && (
                      <div className="col-span-2">
                        <p className="text-[10px] uppercase tracking-widest text-primary/40 font-label">Yêu cầu đặc biệt</p>
                        <p className="text-sm text-primary/70 mt-1 italic">{contact?.note}</p>
                      </div>
                    )}
                  </div>
                  <button onClick={() => setStep(1)} className="mt-3 text-xs text-[var(--color-secondary)] hover:underline">
                    Chỉnh sửa
                  </button>
                </section>

                {/* Passenger info review */}
                <section className="bg-white border border-outline-variant/30 p-6">
                  <h3 className="font-headline text-lg text-primary mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[var(--color-secondary)]">group</span>
                    Hành khách
                  </h3>
                  <div className="space-y-4">
                    {passengers?.map((p, idx) => (
                      <div key={idx} className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-[var(--color-surface)] flex items-center justify-center shrink-0 mt-0.5">
                          <span className="material-symbols-outlined text-base text-primary/40">person</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-primary">
                              {passengerTypeLabel(p?.type)} {idx < counts?.adult ? idx + 1 : idx - counts?.adult + 1}
                            </span>
                            <span className="text-[10px] uppercase tracking-widest bg-[var(--color-surface)] px-2 py-0.5 text-primary/50">
                              {p.gender === 'male' ? 'Nam' : 'Nữ'}
                            </span>
                            {(p?.singleRoomSupplement ?? 0) > 0 && (
                              <span className="text-[10px] uppercase tracking-widest bg-amber-50 text-amber-600 px-2 py-0.5">
                                Phòng đơn
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-primary/50">
                            {p?.name} · {p?.dob ? new Date(p?.dob)?.toLocaleDateString('vi-VN') : '—'}
                            {p?.cccd ? ` · ${p?.cccd}` : ''}
                            {p?.nationality && p?.nationality !== 'Việt Nam' ? ` · ${p?.nationality}` : ''}
                          </p>
                        </div>
                        <span className="text-sm text-primary/70 shrink-0">
                          {(p.type === 'adult' ? priceAdult : p.type === 'child' ? priceChild : priceInfant)?.toLocaleString('vi-VN')}đ
                        </span>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setStep(2)} className="mt-4 text-xs text-[var(--color-secondary)] hover:underline">
                    Chỉnh sửa thông tin hành khách
                  </button>
                </section>
              </div>
            )}
          </div>

          {/* Right: Booking Summary Card ? sticky, no passenger list */}
          <div className="w-full lg:w-80 shrink-0">
            <div className="lg:sticky lg:top-24">
              <div className="bg-white border border-outline-variant/30 overflow-hidden">

                {/* Tour image */}
                <div className="relative">
                  <img alt={tour?.title} src={tour?.image} className="w-full h-36 md:h-40 object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4">
                    <p className="text-surface font-serif text-sm font-medium line-clamp-2">{tour?.title}</p>
                    <p className="text-surface/80 text-xs mt-1">
                      {new Date(schedule?.date)?.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                {/* Pricing breakdown */}
                <div className="p-5 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-primary/60">Người lớn × {counts?.adult}</span>
                    <span>{(counts?.adult * priceAdult)?.toLocaleString('vi-VN')}đ</span>
                  </div>
                  {counts?.child > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-primary/60">Trẻ em × {counts?.child}</span>
                      <span>{(counts?.child * priceChild)?.toLocaleString('vi-VN')}đ</span>
                    </div>
                  )}
                  {counts?.infant > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-primary/60">Em bé × {counts?.infant}</span>
                      <span>{(counts?.infant * priceInfant)?.toLocaleString('vi-VN')}đ</span>
                    </div>
                  )}
                  {totalSingleRoomSupplement > 0 && (
                    <div className="flex justify-between text-sm text-amber-600">
                      <span>Phụ thu phòng đơn</span>
                      <span>+{totalSingleRoomSupplement?.toLocaleString('vi-VN')}đ</span>
                    </div>
                  )}
                  {promoApplied && (
                    <div className="flex justify-between text-sm text-emerald-600">
                      <span>Mã giảm giá (-10%)</span>
                      <span>-{discount?.toLocaleString('vi-VN')}đ</span>
                    </div>
                  )}
                  <div className="border-t border-outline-variant/30 pt-3 flex justify-between">
                    <span className="text-[10px] uppercase tracking-widest text-primary/50 font-label">Tổng cộng</span>
                    <span className="font-headline font-bold text-lg text-[var(--color-secondary)]">
                      {subtotal?.toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                </div>

                {/* Promo code */}
                <div className="px-5 pb-5">
                  <div className="border-t border-outline-variant/30 pt-4">
                    <p className="text-[10px] uppercase tracking-widest text-primary/50 font-label mb-2">Mã giảm giá</p>
                    <div className="flex gap-2">
                      <input
                        value={promoCode}
                        onChange={e => setPromoCode(e?.target?.value?.toUpperCase())}
                        disabled={promoApplied}
                        className="flex-1 bg-transparent border border-outline-variant/50 px-3 py-2 text-xs focus:border-[var(--color-secondary)] outline-none disabled:opacity-60"
                        placeholder="Nhập mã..."
                      />
                      {!promoApplied ? (
                        <button
                          onClick={handleApplyPromo}
                          className="bg-[var(--color-surface)] border border-outline-variant/50 px-3 py-2 text-xs font-bold hover:bg-[var(--color-secondary)]/10 hover:border-[var(--color-secondary)] transition-colors"
                        >
                          Áp dụng
                        </button>
                      ) : (
                        <span className="flex items-center px-3 text-xs text-emerald-600 font-medium">
                          <span className="material-symbols-outlined text-base mr-1">check_circle</span>
                          Đã áp dụng
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-primary/30 mt-1">Thử: TRAVELA10</p>
                  </div>
                </div>

                {/* Payment button */}
                <div className="border-t border-outline-variant/30 px-5 py-4">
                  {step === 1 ? (
                    <button
                      onClick={() => setStep(2)}
                      disabled={!canProceedContact}
                      className={`w-full py-3.5 font-sans uppercase tracking-[0.15em] text-[11px] font-bold transition-all flex items-center justify-center gap-2 ${
                        canProceedContact
                          ? 'bg-primary text-surface hover:bg-[var(--color-secondary)] cursor-pointer'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      Tiếp tục: Hành khách
                      <span className="material-symbols-outlined text-lg">arrow_forward</span>
                    </button>
                  ) : step === 2 ? (
                    <button
                      onClick={() => setStep(3)}
                      disabled={!canProceedPassengers}
                      className={`w-full py-3.5 font-sans uppercase tracking-[0.15em] text-[11px] font-bold transition-all flex items-center justify-center gap-2 ${
                        canProceedPassengers
                          ? 'bg-primary text-surface hover:bg-[var(--color-secondary)] cursor-pointer'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      Tiếp tục: Thanh toán
                      <span className="material-symbols-outlined text-lg">arrow_forward</span>
                    </button>
                  ) : (
                    <div className="space-y-3">
                      {/* Payment ratio */}
                      <div className="space-y-2">
                        <p className="text-[10px] uppercase tracking-widest text-primary/50 font-label">Tỷ lệ thanh toán</p>
                        <label className={`block p-3 border cursor-pointer flex items-center gap-3 transition-colors ${
                          paymentRatio === 'deposit'
                            ? 'border-[var(--color-secondary)] bg-[var(--color-secondary)]/5'
                            : 'border-outline-variant/30 hover:border-outline-variant'
                        }`}>
                          <input
                            type="radio"
                            name="paymentRatio"
                            checked={paymentRatio === 'deposit'}
                            onChange={() => setPaymentRatio('deposit')}
                            className="accent-[var(--color-secondary)]"
                          />
                          <div className="flex-1">
                            <p className="text-xs font-medium text-primary">Thanh toán 50%</p>
                            <p className="text-[10px] text-primary/50">{Math.ceil(subtotal * 0.5)?.toLocaleString('vi-VN')}đ khi chọn đặt cọc</p>
                          </div>
                        </label>
                        <label className={`block p-3 border cursor-pointer flex items-center gap-3 transition-colors ${
                          paymentRatio === 'full'
                            ? 'border-[var(--color-secondary)] bg-[var(--color-secondary)]/5'
                            : 'border-outline-variant/30 hover:border-outline-variant'
                        }`}>
                          <input
                            type="radio"
                            name="paymentRatio"
                            checked={paymentRatio === 'full'}
                            onChange={() => setPaymentRatio('full')}
                            className="accent-[var(--color-secondary)]"
                          />
                          <div className="flex-1">
                            <p className="text-xs font-medium text-primary">Thanh toán toán bộ</p>
                            <p className="text-[10px] text-primary/50">Không còn công nợ sau khi thanh toán</p>
                          </div>
                        </label>
                      </div>

                      {/* Payment methods */}
                      <div className="space-y-2">
                        <label className={`block p-3 border cursor-pointer flex items-center gap-3 transition-colors ${
                          paymentMethod === 'bank'
                            ? 'border-[var(--color-secondary)] bg-[var(--color-secondary)]/5'
                            : 'border-outline-variant/30 hover:border-outline-variant'
                        }`}>
                          <input type="radio" name="payMethod" checked={paymentMethod === 'bank'}
                            onChange={() => setPaymentMethod('bank')} className="accent-[var(--color-secondary)]" />
                          <div className="flex-1">
                            <p className="text-xs font-medium text-primary">Chuyển khoản VietQR</p>
                          </div>
                          <span className="material-symbols-outlined text-xl opacity-30">account_balance</span>
                        </label>
                        <label className={`block p-3 border cursor-pointer flex items-center gap-3 transition-colors ${
                          paymentMethod === 'card'
                            ? 'border-[var(--color-secondary)] bg-[var(--color-secondary)]/5'
                            : 'border-outline-variant/30 hover:border-outline-variant'
                        }`}>
                          <input type="radio" name="payMethod" checked={paymentMethod === 'card'}
                            onChange={() => setPaymentMethod('card')} className="accent-[var(--color-secondary)]" />
                          <div className="flex-1">
                            <p className="text-xs font-medium text-primary">Thẻ VNPAY</p>
                          </div>
                          <span className="material-symbols-outlined text-xl opacity-30">credit_card</span>
                        </label>
                      </div>

                      <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className={`w-full py-3.5 font-sans uppercase tracking-[0.15em] text-[11px] font-bold transition-all flex items-center justify-center gap-2 ${
                          isSubmitting
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-primary text-surface hover:bg-[var(--color-secondary)]'
                        }`}
                      >
                        {isSubmitting ? (
                          <>
                            <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                            Đang xử lý...
                          </>
                        ) : (
                          <>
                            Thanh toán {paymentAmount?.toLocaleString('vi-VN')}đ
                            <span className="material-symbols-outlined text-lg">arrow_forward</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => setStep(2)}
                        className="w-full py-2 border border-outline-variant/60 text-primary/60 text-xs font-sans uppercase tracking-widest hover:bg-surface transition-all"
                      >
                        Quay lại
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

