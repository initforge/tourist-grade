import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { mockTours } from '../../data/tours';
import { mockBookings, type Passenger } from '../../data/bookings';
import { useAuthStore } from '../../store/useAuthStore';
import type { Tour, DepartureScheduleEntry } from '../../data/tours';


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
  const scheduleId = searchParams.get('scheduleId') ?? '';
  const user = useAuthStore(s => s.user);

  const tour = mockTours.find(t => t.slug === slug);
  const schedule: DepartureScheduleEntry | undefined = tour?.departureSchedule.find(s => s.id === scheduleId);

  const [step, setStep] = useState<1 | 2>(1);
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'bank' | 'card'>('bank');
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
  const totalPassengers = counts.adult + counts.child + counts.infant;

  const setCount = (type: keyof typeof counts, delta: number) => {
    setCounts(prev => {
      const next = { ...prev, [type]: Math.max(type === 'adult' ? 1 : 0, prev[type] + delta) };
      const total = next.adult + next.child + next.infant;
      if (total > maxSeats) return prev;
      return next;
    });
  };

  // Passengers
  const buildPassengers = (): Passenger[] => {
    const list: Passenger[] = [];
    for (let i = 0; i < counts.adult; i++) {
      list.push({ type: 'adult', name: '', dob: '', gender: 'male', nationality: 'Việt Nam', singleRoomSupplement: 0 });
    }
    for (let i = 0; i < counts.child; i++) {
      list.push({ type: 'child', name: '', dob: '', gender: 'male', nationality: 'Việt Nam' });
    }
    for (let i = 0; i < counts.infant; i++) {
      list.push({ type: 'infant', name: '', dob: '', gender: 'male', nationality: 'Việt Nam' });
    }
    return list;
  };

  const [passengers, setPassengers] = useState<Passenger[]>(buildPassengers());

  // Re-sync when counts change
  const syncPassengers = (newCounts: typeof counts) => {
    const list: Passenger[] = [];
    for (let i = 0; i < newCounts.adult; i++) {
      list.push({ type: 'adult', name: '', dob: '', gender: 'male', nationality: 'Việt Nam', singleRoomSupplement: 0 });
    }
    for (let i = 0; i < newCounts.child; i++) {
      list.push({ type: 'child', name: '', dob: '', gender: 'male', nationality: 'Việt Nam' });
    }
    for (let i = 0; i < newCounts.infant; i++) {
      list.push({ type: 'infant', name: '', dob: '', gender: 'male', nationality: 'Việt Nam' });
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
  const priceAdult = schedule?.priceAdult ?? tour?.price.adult ?? 0;
  const priceChild = tour?.price.child ?? 0;
  const priceInfant = tour?.price.infant ?? 0;
  const singleRoomPrice = 500000; // mock phụ thu phòng đơn
  const totalSingleRoomSupplement = passengers
    .filter(p => p.type === 'adult' && p.singleRoomSupplement)
    .reduce((sum, p) => sum + (p.singleRoomSupplement ?? 0), 0);
  const discount = promoApplied ? Math.round(priceAdult * 0.1) : 0; // mock 10%
  const subtotal = counts.adult * priceAdult + counts.child * priceChild + counts.infant * priceInfant + totalSingleRoomSupplement - discount;
  const paymentAmount = subtotal;
  const remainingAmount = 0;

  // Validate step 1
  const canProceedStep1 = contact.name.trim() && contact.phone.trim() && contact.email.trim()
    && totalPassengers > 0 && totalPassengers <= maxSeats;

  // Validate step 2
  const canProceedStep2 = () => {
    return passengers.every(p =>
      p.name.trim() && p.dob && p.gender
    );
  };

  const handleApplyPromo = () => {
    if (promoCode.toUpperCase() === 'TRAVELA10') {
      setPromoApplied(true);
    }
  };

  const handleSubmit = async () => {
    if (!canProceedStep2()) return;
    setIsSubmitting(true);

    // Simulate API delay
    await new Promise(r => setTimeout(r, 1200));

    // Create booking in memory
    const newBooking = {
      id: `B${String(mockBookings.length + 1).padStart(3, '0')}`,
      bookingCode: `BK-${Math.floor(Math.random() * 900000 + 100000)}`,
      tourId: tour!.id,
      tourName: tour!.title,
      tourDate: schedule?.date ?? '',
      tourDuration: `${tour!.duration.days}N${tour!.duration.nights}Đ`,
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
      paymentStatus: 'paid' as const,
      paymentTransactions: [{
        id: `TX${Date.now()}`,
        amount: paymentAmount,
        method: paymentMethod === 'bank' ? 'vnpay' : 'stripe',
        status: 'completed' as const,
        paidAt: new Date().toISOString(),
      }],
      roomCounts,
      promoCode: promoApplied ? promoCode : undefined,
      discountAmount: discount,
      createdAt: new Date().toISOString(),
    };

    // Navigate with booking data
    navigate('/booking/success', {
      state: { bookingId: newBooking.id, bookingCode: newBooking.bookingCode, tourName: tour!.title, amount: subtotal }
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
    <div className="w-full bg-[var(--color-background)] min-h-screen pb-48">
      <main className="pt-24 px-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <button
            onClick={() => step > 1 ? setStep(1) : navigate(`/tours/${slug}`)}
            className="flex items-center gap-2 hover:opacity-70 transition-opacity"
          >
            <span className="material-symbols-outlined text-[var(--color-primary)]">arrow_back</span>
          </button>
          <div>
            <h1 className="font-serif text-2xl text-primary">Thủ tục đặt chỗ</h1>
            <p className="text-xs text-primary/50 font-sans mt-0.5">
              {tour.title} · {new Date(schedule.date).toLocaleDateString('vi-VN')}
            </p>
          </div>
        </div>

        {/* Stepper */}
        <div className="mb-12 max-w-xl">
          <div className="flex items-center gap-0 relative">
            <div className="absolute top-4 left-0 w-full h-[1px] bg-outline-variant/30 -z-10" />
            {[1, 2].map(s => (
              <div key={s} className="flex flex-col items-center gap-2 flex-1">
                <div className={`w-8 h-8 flex items-center justify-center border text-sm font-bold transition-all ${
                  step >= s
                    ? 'border-[var(--color-secondary)] text-[var(--color-secondary)] bg-[var(--color-secondary)]/10'
                    : 'border-outline-variant/40 text-primary/30'
                }`}>
                  {s}
                </div>
                <span className={`text-[10px] uppercase tracking-widest font-label ${
                  step >= s ? 'text-[var(--color-secondary)] font-semibold' : 'text-primary/30'
                }`}>
                  {s === 1 ? 'Thông tin & Hành khách' : 'Thanh toán'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* Main content */}
          <div className="flex-1 min-w-0 space-y-10">

            {/* STEP 1 */}
            {step === 1 && (
              <div className="space-y-10">
                {/* Contact Info */}
                <section>
                  <h2 className="font-headline text-xl text-primary mb-1">Thông tin liên hệ</h2>
                  <p className="text-xs text-primary/50 font-light italic mb-6">Thông tin xác nhận đặt tour sẽ gửi đến email này</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-5">
                      <div className="relative group">
                        <label className="block text-[10px] font-label uppercase tracking-widest text-primary/60 mb-1">
                          Họ và tên <span className="text-red-500">*</span>
                        </label>
                        <input
                          value={contact.name}
                          onChange={e => setContact(c => ({ ...c, name: e.target.value }))}
                          className="w-full bg-transparent border-t-0 border-x-0 border-b border-outline-variant focus:border-[var(--color-secondary)] px-0 py-2 text-sm placeholder:text-primary/20 transition-all"
                          placeholder="Nguyễn Văn A"
                        />
                      </div>
                      <div className="relative group">
                        <label className="block text-[10px] font-label uppercase tracking-widest text-primary/60 mb-1">
                          Số điện thoại <span className="text-red-500">*</span>
                        </label>
                        <input
                          value={contact.phone}
                          onChange={e => setContact(c => ({ ...c, phone: e.target.value }))}
                          className="w-full bg-transparent border-t-0 border-x-0 border-b border-outline-variant focus:border-[var(--color-secondary)] px-0 py-2 text-sm placeholder:text-primary/20 transition-all"
                          placeholder="0901 234 567"
                        />
                      </div>
                      <div className="relative group">
                        <label className="block text-[10px] font-label uppercase tracking-widest text-primary/60 mb-1">
                          Email <span className="text-red-500">*</span>
                        </label>
                        <input
                          value={contact.email}
                          onChange={e => setContact(c => ({ ...c, email: e.target.value }))}
                          className="w-full bg-transparent border-t-0 border-x-0 border-b border-outline-variant focus:border-[var(--color-secondary)] px-0 py-2 text-sm placeholder:text-primary/20 transition-all"
                          placeholder="email@example.com"
                        />
                      </div>
                      <div className="relative group">
                        <label className="block text-[10px] font-label uppercase tracking-widest text-primary/60 mb-1">
                          Yêu cầu đặc biệt
                        </label>
                        <textarea
                          value={contact.note}
                          onChange={e => setContact(c => ({ ...c, note: e.target.value }))}
                          className="w-full bg-transparent border-t-0 border-x-0 border-b border-outline-variant focus:border-[var(--color-secondary)] px-0 py-2 text-sm placeholder:text-primary/20 transition-all resize-none"
                          rows={2}
                          placeholder="Chế độ ăn, dịch vụ đón tiễn..."
                        />
                      </div>
                    </div>
                  </div>
                </section>

                {/* Passenger Count Selector */}
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
                    {(['adult', 'child', 'infant'] as const).map(type => (
                      <div key={type} className="flex items-center justify-between p-4 bg-white border border-outline-variant/30">
                        <div>
                          <p className="text-sm font-medium text-primary">{passengerTypeLabel(type)}</p>
                          <p className="text-xs text-primary/50 mt-0.5">
                            {type === 'adult' ? `${priceAdult.toLocaleString('vi-VN')}đ / người` :
                             type === 'child' ? `${priceChild.toLocaleString('vi-VN')}đ / người` :
                             `${priceInfant.toLocaleString('vi-VN')}đ / người (không chiếm ghế)`}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => { const next = { ...counts, [type]: Math.max(type === 'adult' ? 1 : 0, counts[type] - 1) }; setCounts(next); syncPassengers(next); }}
                            className="w-8 h-8 border border-outline-variant/50 flex items-center justify-center hover:border-[var(--color-secondary)] transition-colors"
                          >
                            <span className="material-symbols-outlined text-base">remove</span>
                          </button>
                          <span className="text-lg font-bold w-8 text-center">{counts[type]}</span>
                          <button
                            onClick={() => { const next = { ...counts, [type]: counts[type] + 1 }; setCounts(next); syncPassengers(next); }}
                            className="w-8 h-8 border border-outline-variant/50 flex items-center justify-center hover:border-[var(--color-secondary)] transition-colors"
                          >
                            <span className="material-symbols-outlined text-base">add</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Passenger Forms */}
                <section>
                  <h2 className="font-headline text-xl text-primary mb-6">
                    Thông tin hành khách
                    <span className="ml-3 text-sm font-sans font-normal bg-[var(--color-secondary)]/10 text-[var(--color-secondary)] px-3 py-1 rounded-full">
                      {totalPassengers} khách
                    </span>
                  </h2>
                  <div className="space-y-6">
                    {passengers.map((p, idx) => (
                      <div key={idx} className="p-6 bg-white border border-outline-variant/30 space-y-5 hover:border-[var(--color-secondary)]/30 transition-colors">
                        <h3 className="flex items-center gap-2 font-label text-xs uppercase tracking-widest font-bold text-primary">
                          <span className="material-symbols-outlined text-sm text-[var(--color-secondary)]" style={{ fontVariationSettings: "'FILL' 1" }}>
                            person
                          </span>
                          {passengerTypeLabel(p.type)} {idx < counts.adult ? idx + 1 : idx - counts.adult + 1}
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                          {/* Họ tên */}
                          <div>
                            <label className="block text-[10px] font-label uppercase tracking-widest text-primary/60 mb-1">
                              Họ và tên <span className="text-red-500">*</span>
                            </label>
                            <input
                              value={p.name}
                              onChange={e => updatePassenger(idx, 'name', e.target.value)}
                              className="w-full bg-transparent border-t-0 border-x-0 border-b border-outline-variant focus:border-[var(--color-secondary)] px-0 py-2 text-sm placeholder:text-primary/20 transition-all"
                              placeholder="Đúng theo CCCD/Passport"
                            />
                          </div>
                          {/* CCCD / Passport */}
                          <div>
                            <label className="block text-[10px] font-label uppercase tracking-widest text-primary/60 mb-1">
                              CCCD / Passport
                            </label>
                            <input
                              value={p.cccd ?? ''}
                              onChange={e => updatePassenger(idx, 'cccd', e.target.value)}
                              className="w-full bg-transparent border-t-0 border-x-0 border-b border-outline-variant focus:border-[var(--color-secondary)] px-0 py-2 text-sm placeholder:text-primary/20 transition-all"
                              placeholder="001 085 012 345"
                            />
                          </div>
                          {/* Ngày sinh */}
                          <div>
                            <label className="block text-[10px] font-label uppercase tracking-widest text-primary/60 mb-1">
                              Ngày sinh <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="date"
                              value={p.dob}
                              onChange={e => updatePassenger(idx, 'dob', e.target.value)}
                              className="w-full bg-transparent border-t-0 border-x-0 border-b border-outline-variant focus:border-[var(--color-secondary)] px-0 py-2 text-sm transition-all"
                            />
                          </div>
                          {/* Giới tính */}
                          <div>
                            <label className="block text-[10px] font-label uppercase tracking-widest text-primary/60 mb-1">
                              Giới tính <span className="text-red-500">*</span>
                            </label>
                            <div className="flex gap-4 pt-2">
                              {(['male', 'female'] as const).map(g => (
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
                          {/* Quốc tịch */}
                          <div>
                            <label className="block text-[10px] font-label uppercase tracking-widest text-primary/60 mb-1">
                              Quốc tịch
                            </label>
                            <input
                              value={p.nationality ?? 'Việt Nam'}
                              onChange={e => updatePassenger(idx, 'nationality', e.target.value)}
                              className="w-full bg-transparent border-t-0 border-x-0 border-b border-outline-variant focus:border-[var(--color-secondary)] px-0 py-2 text-sm placeholder:text-primary/20 transition-all"
                              placeholder="Việt Nam"
                            />
                          </div>
                          {/* Phụ thu phòng đơn (chỉ người lớn) */}
                          {p.type === 'adult' && (
                            <div>
                              <label className="block text-[10px] font-label uppercase tracking-widest text-primary/60 mb-1">
                                Phụ thu phòng đơn
                              </label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  value={p.singleRoomSupplement ?? 0}
                                  onChange={e => updatePassenger(idx, 'singleRoomSupplement', Number(e.target.value))}
                                  className="w-full bg-transparent border-t-0 border-x-0 border-b border-outline-variant focus:border-[var(--color-secondary)] px-0 py-2 text-sm transition-all"
                                  placeholder="0"
                                  min={0}
                                />
                                <span className="text-xs text-primary/40">VNĐ</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Next button */}
                <div className="flex justify-end pt-4">
                  <button
                    onClick={() => setStep(2)}
                    disabled={!canProceedStep1}
                    className={`px-12 py-4 font-sans uppercase tracking-[0.2em] text-[12px] font-bold transition-all ${
                      canProceedStep1
                        ? 'bg-primary text-surface hover:bg-[var(--color-secondary)]'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Tiếp tục: Thanh toán
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <div className="space-y-8">
                <div className="flex items-center gap-4">
                  <button onClick={() => setStep(1)} className="flex items-center gap-2 hover:opacity-70 transition-opacity">
                    <span className="material-symbols-outlined text-[var(--color-primary)]">arrow_back</span>
                  </button>
                  <h2 className="font-headline text-2xl text-primary">Xác nhận & Thanh toán</h2>
                </div>

                {/* Left col */}
                <div className="space-y-6">

                  {/* Passenger summary (read-only) */}
                  <section className="bg-white border border-outline-variant/30 p-6">
                    <h3 className="font-headline text-lg text-primary mb-4 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[var(--color-secondary)]">group</span>
                      Thông tin hành khách
                    </h3>
                    <div className="divide-y divide-[var(--color-surface)]">
                      {passengers.map((p, idx) => (
                        <div key={idx} className="py-3 flex items-center justify-between gap-4">
                          <div>
                            <p className="text-sm font-medium text-primary">{p.name}</p>
                            <p className="text-xs text-primary/50 mt-0.5">
                              {p.dob ? new Date(p.dob).toLocaleDateString('vi-VN') : '—'} · {p.gender === 'male' ? 'Nam' : 'Nữ'}
                              {p.cccd ? ` · ${p.cccd}` : ''}
                            </p>
                          </div>
                          <span className="text-[10px] uppercase tracking-widest bg-[var(--color-surface)] px-3 py-1 text-primary/60 shrink-0">
                            {passengerTypeLabel(p.type)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => setStep(1)}
                      className="mt-3 text-xs text-[var(--color-secondary)] hover:underline"
                    >
                      Chỉnh sửa thông tin
                    </button>
                  </section>

                  {/* Payment method */}
                  <section className="bg-white border border-outline-variant/30 p-6">
                    <h3 className="font-headline text-lg text-primary mb-5">Phương thức thanh toán</h3>
                    <div className="space-y-4">
                      <label className={`block p-5 border cursor-pointer flex items-start gap-4 transition-colors ${
                        paymentMethod === 'bank'
                          ? 'border-[var(--color-secondary)] bg-[var(--color-secondary)]/5'
                          : 'border-outline-variant/30 hover:border-outline-variant'
                      }`}>
                        <input type="radio" name="payment" checked={paymentMethod === 'bank'}
                          onChange={() => setPaymentMethod('bank')} className="mt-1 accent-[var(--color-secondary)]" />
                        <div className="flex-1">
                          <h4 className="font-headline font-bold text-base text-primary">Chuyển khoản Ngân hàng</h4>
                          <p className="text-xs opacity-60 mt-1">Qua mã VietQR NAPAS. Thanh toán trong 24h để giữ chỗ.</p>
                        </div>
                        <span className="material-symbols-outlined text-3xl opacity-20">account_balance</span>
                      </label>
                      <label className={`block p-5 border cursor-pointer flex items-start gap-4 transition-colors ${
                        paymentMethod === 'card'
                          ? 'border-[var(--color-secondary)] bg-[var(--color-secondary)]/5'
                          : 'border-outline-variant/30 hover:border-outline-variant'
                      }`}>
                        <input type="radio" name="payment" checked={paymentMethod === 'card'}
                          onChange={() => setPaymentMethod('card')} className="mt-1 accent-[var(--color-secondary)]" />
                        <div className="flex-1">
                          <h4 className="font-headline font-bold text-base text-primary">Thẻ tín dụng / Thẻ thanh toán</h4>
                          <p className="text-xs opacity-60 mt-1">Visa, Mastercard, JCB qua cổng VNPAY.</p>
                        </div>
                        <span className="material-symbols-outlined text-3xl opacity-20">credit_card</span>
                      </label>
                    </div>
                  </section>

                  {/* Submit */}
                  <div className="flex gap-4">
                    <button
                      onClick={() => setStep(1)}
                      className="border border-outline-variant/60 text-primary px-8 py-4 font-sans uppercase tracking-[0.2em] text-[12px] hover:bg-surface transition-all"
                    >
                      Quay lại
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className={`flex-1 py-4 font-sans uppercase tracking-[0.2em] text-[12px] font-bold transition-all flex items-center justify-center gap-2 ${
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
                          Thanh toán {paymentAmount.toLocaleString('vi-VN')}đ
                          <span className="material-symbols-outlined text-lg">arrow_forward</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right: Booking Summary Card (sticky) */}
          <div className="w-full lg:w-80 shrink-0">
            <div className="sticky top-24 space-y-4">
              <div className="bg-white border border-outline-variant/30 overflow-hidden">
                {/* Tour info */}
                <div className="relative">
                  <img alt={tour.title} src={tour.image} className="w-full h-40 object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-3 left-4">
                    <p className="text-surface font-serif text-sm font-medium line-clamp-2">{tour.title}</p>
                    <p className="text-surface/80 text-xs mt-1">
                      {new Date(schedule.date).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                {/* Summary */}
                <div className="p-5 space-y-4">
                  {/* Passengers */}
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase tracking-widest text-primary/50 font-label">Hành khách</p>
                    {passengers.map((p, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="text-primary/70">
                          {p.name || `${passengerTypeLabel(p.type)} ${idx + 1}`}
                        </span>
                        <span className="text-primary/50 text-xs">
                          {p.type === 'adult' ? priceAdult :
                           p.type === 'child' ? priceChild :
                           priceInfant}{' đ'}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-outline-variant/30 pt-3 space-y-2">
                    {counts.adult > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-primary/60">Người lớn × {counts.adult}</span>
                        <span>{(counts.adult * priceAdult).toLocaleString('vi-VN')}đ</span>
                      </div>
                    )}
                    {counts.child > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-primary/60">Trẻ em × {counts.child}</span>
                        <span>{(counts.child * priceChild).toLocaleString('vi-VN')}đ</span>
                      </div>
                    )}
                    {counts.infant > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-primary/60">Em bé × {counts.infant}</span>
                        <span>{(counts.infant * priceInfant).toLocaleString('vi-VN')}đ</span>
                      </div>
                    )}
                    {totalSingleRoomSupplement > 0 && (
                      <div className="flex justify-between text-sm text-amber-600">
                        <span>Phụ thu phòng đơn</span>
                        <span>+{totalSingleRoomSupplement.toLocaleString('vi-VN')}đ</span>
                      </div>
                    )}
                    {promoApplied && (
                      <div className="flex justify-between text-sm text-emerald-600">
                        <span>Mã giảm giá (-10%)</span>
                        <span>-{discount.toLocaleString('vi-VN')}đ</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-primary/60">Thuế & phí</span>
                      <span className="text-primary/50">Đã tính</span>
                    </div>
                  </div>

                  {/* Promo code */}
                  <div className="border-t border-outline-variant/30 pt-3">
                    <p className="text-[10px] uppercase tracking-widest text-primary/50 font-label mb-2">Mã giảm giá</p>
                    <div className="flex gap-2">
                      <input
                        value={promoCode}
                        onChange={e => setPromoCode(e.target.value.toUpperCase())}
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

                  {/* Total */}
                  <div className="border-t border-outline-variant/30 pt-3">
                    <div className="flex justify-between items-end mb-1">
                      <span className="text-[10px] uppercase tracking-widest text-primary/50 font-label">Tổng cộng</span>
                      <span className="text-xl font-headline font-bold text-[var(--color-secondary)]">
                        {subtotal.toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
