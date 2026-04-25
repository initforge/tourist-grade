import { useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import type { Passenger } from '@entities/booking/data/bookings';
import type { DepartureScheduleEntry } from '@entities/tour/data/tours';
import { createBookingPaymentLink, createPublicBooking } from '@shared/lib/api/bookings';
import { formatCurrency } from '@shared/lib/booking';
import { useAuthStore } from '@shared/store/useAuthStore';
import { useAppDataStore } from '@shared/store/useAppDataStore';

type CheckoutStep = 0 | 1 | 2;

type Counts = {
  adult: number;
  child: number;
  infant: number;
};

type ContactState = {
  name: string;
  phone: string;
  email: string;
  note: string;
};

function buildPassengers(counts: Counts) {
  const passengers: Passenger[] = [];

  for (let index = 0; index < counts.adult; index += 1) {
    passengers.push({
      type: 'adult',
      name: '',
      dob: '',
      gender: 'male',
      nationality: 'Việt Nam',
      singleRoomSupplement: 0,
    });
  }

  for (let index = 0; index < counts.child; index += 1) {
    passengers.push({
      type: 'child',
      name: '',
      dob: '',
      gender: 'male',
      nationality: 'Việt Nam',
    });
  }

  for (let index = 0; index < counts.infant; index += 1) {
    passengers.push({
      type: 'infant',
      name: '',
      dob: '',
      gender: 'male',
      nationality: 'Việt Nam',
    });
  }

  return passengers;
}

function StepChip({ active, index, label }: { active: boolean; index: number; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold ${active ? 'border-[var(--color-secondary)] bg-[var(--color-secondary)] text-white' : 'border-outline-variant/50 text-primary/45'}`}>
        {index}
      </div>
      <div className={`text-sm font-medium ${active ? 'text-primary' : 'text-primary/45'}`}>{label}</div>
    </div>
  );
}

function SummaryRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-primary/60">{label}</span>
      <span className={strong ? 'font-semibold text-primary' : 'text-primary'}>{value}</span>
    </div>
  );
}

export default function BookingCheckout() {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const scheduleId = searchParams.get('scheduleId') ?? '';
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const tours = useAppDataStore((state) => state.publicTours);
  const upsertBooking = useAppDataStore((state) => state.upsertBooking);
  const tour = tours.find((item) => item.slug === slug);
  const schedule: DepartureScheduleEntry | undefined = tour?.departureSchedule.find((item) => item.id === scheduleId);

  const [activeStep, setActiveStep] = useState<CheckoutStep>(0);
  const [contact, setContact] = useState<ContactState>({
    name: user?.name ?? '',
    phone: user?.phone ?? '',
    email: user?.email ?? '',
    note: '',
  });
  const [counts, setCounts] = useState<Counts>({ adult: 1, child: 0, infant: 0 });
  const [passengers, setPassengers] = useState<Passenger[]>(buildPassengers({ adult: 1, child: 0, infant: 0 }));
  const [roomCounts, setRoomCounts] = useState({ single: 0, double: 1, triple: 0 });
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromoCode, setAppliedPromoCode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'bank' | 'card'>('bank');
  const [paymentRatio, setPaymentRatio] = useState<'deposit' | 'full'>('full');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdBookingId, setCreatedBookingId] = useState('');
  const [createdBookingCode, setCreatedBookingCode] = useState('');
  const [paymentUrl, setPaymentUrl] = useState('');
  const [error, setError] = useState('');

  const singleRoomSurcharge = schedule?.singleRoomSurcharge ?? 500000;
  const priceAdult = schedule?.priceAdult ?? tour?.price.adult ?? 0;
  const priceChild = schedule?.priceChild ?? tour?.price.child ?? 0;
  const priceInfant = schedule?.priceInfant ?? tour?.price.infant ?? 0;

  const totalGuests = counts.adult + counts.child + counts.infant;
  const surchargeTotal = passengers.reduce((sum, passenger) => sum + (passenger.singleRoomSupplement ?? 0), 0);
  const subtotal = useMemo(
    () => counts.adult * priceAdult + counts.child * priceChild + counts.infant * priceInfant + surchargeTotal,
    [counts.adult, counts.child, counts.infant, priceAdult, priceChild, priceInfant, surchargeTotal],
  );
  const payableAmount = paymentRatio === 'deposit' ? Math.ceil(subtotal * 0.5) : subtotal;

  const syncPassengerCounts = (next: Counts) => {
    setCounts(next);
    setPassengers(buildPassengers(next));
  };

  const updatePassenger = (index: number, field: keyof Passenger, value: string | number) => {
    setPassengers((current) => current.map((passenger, passengerIndex) => (
      passengerIndex === index ? { ...passenger, [field]: value } : passenger
    )));
  };

  const toggleSingleRoom = (index: number, checked: boolean) => {
    updatePassenger(index, 'singleRoomSupplement', checked ? singleRoomSurcharge : 0);
  };

  const infoStepReady = Boolean(
    tour
    && schedule
    && contact.name.trim()
    && contact.phone.trim()
    && contact.email.trim()
    && passengers.every((passenger) => passenger.name.trim() && passenger.dob),
  );

  const applyPromoCode = () => {
    if (promoCode.trim().toUpperCase() === 'TRAVELA10') {
      setAppliedPromoCode('TRAVELA10');
      setError('');
      return;
    }

    setAppliedPromoCode('');
    setError('Mã giảm giá không hợp lệ.');
  };

  const goToPaymentStep = () => {
    if (!infoStepReady) {
      setError('Vui lòng điền đầy đủ thông tin liên hệ và hành khách.');
      return;
    }

    setError('');
    setActiveStep(1);
  };

  const handleSubmit = async () => {
    if (!tour || !schedule || !infoStepReady) {
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const bookingResponse = await createPublicBooking({
        tourSlug: tour.slug,
        scheduleId: schedule.id,
        contact,
        passengers,
        roomCounts,
        promoCode: appliedPromoCode || promoCode.trim(),
        paymentMethod,
        paymentRatio,
      }, accessToken);

      upsertBooking(bookingResponse.booking);
      setCreatedBookingId(bookingResponse.booking.id);
      setCreatedBookingCode(bookingResponse.booking.bookingCode);

      const paymentResponse = await createBookingPaymentLink(bookingResponse.booking.id, accessToken);
      setPaymentUrl(paymentResponse.paymentLink.checkoutUrl ?? '');
      setActiveStep(2);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Không thể tạo booking.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!tour || !schedule) {
    return (
      <div className="w-full bg-[var(--color-background)] min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <span className="material-symbols-outlined text-5xl text-[#D0C5AF]">search_off</span>
          <p className="text-lg text-[#2A2421]/60">Không tìm thấy lịch khởi hành phù hợp.</p>
          <button onClick={() => navigate('/tours')} className="text-[#D4AF37] hover:underline">Quay lại danh sách tour</button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[var(--color-background)] min-h-screen pb-20 md:pb-24">
      <main className="pt-6 md:pt-8 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6 md:mb-8">
          <button onClick={() => navigate(`/tours/${slug}`)} className="flex items-center gap-2 hover:opacity-70 transition-opacity">
            <span className="material-symbols-outlined text-[var(--color-primary)]">arrow_back</span>
          </button>
          <div>
            <h1 className="font-serif text-2xl text-primary">Thủ tục đặt chỗ</h1>
            <p className="text-xs text-primary/50 font-sans mt-0.5">{tour.title} · {new Date(schedule.date).toLocaleDateString('vi-VN')}</p>
          </div>
        </div>

        <div className="mb-8 grid gap-4 rounded-2xl border border-outline-variant/30 bg-white p-5 md:grid-cols-3">
          <StepChip index={1} label="Thông tin" active={activeStep === 0} />
          <StepChip index={2} label="Thanh toán" active={activeStep === 1} />
          <StepChip index={3} label="Hoàn tất" active={activeStep === 2} />
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
          <div className="flex-1 min-w-0 space-y-8">
            {activeStep === 0 && (
              <>
                <section className="bg-white border border-outline-variant/30 p-6 space-y-5">
                  <h2 className="font-headline text-xl text-primary">Thông tin liên hệ</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <input value={contact.name} onChange={(event) => setContact((current) => ({ ...current, name: event.target.value }))} className="w-full border border-outline-variant/50 px-4 py-3 text-sm" placeholder="Nguyễn Văn A" />
                    <input value={contact.phone} onChange={(event) => setContact((current) => ({ ...current, phone: event.target.value }))} className="w-full border border-outline-variant/50 px-4 py-3 text-sm" placeholder="0901 234 567" />
                    <input value={contact.email} onChange={(event) => setContact((current) => ({ ...current, email: event.target.value }))} className="w-full border border-outline-variant/50 px-4 py-3 text-sm md:col-span-2" placeholder="email@example.com" />
                    <textarea value={contact.note} onChange={(event) => setContact((current) => ({ ...current, note: event.target.value }))} className="w-full border border-outline-variant/50 px-4 py-3 text-sm resize-none md:col-span-2" placeholder="Yêu cầu đặc biệt" rows={3} />
                  </div>
                </section>

                <section className="bg-white border border-outline-variant/30 p-6 space-y-5">
                  <h2 className="font-headline text-xl text-primary">Số lượng hành khách</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {(['adult', 'child', 'infant'] as const).map((type) => (
                      <div key={type} className="border border-outline-variant/30 p-4">
                        <p className="text-sm font-medium text-primary mb-3">{type === 'adult' ? 'Người lớn' : type === 'child' ? 'Trẻ em' : 'Em bé'}</p>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => {
                              const next = { ...counts, [type]: Math.max(type === 'adult' ? 1 : 0, counts[type] - 1) };
                              syncPassengerCounts(next);
                            }}
                            className="w-8 h-8 border border-outline-variant/50 flex items-center justify-center"
                          >
                            <span className="material-symbols-outlined text-base">remove</span>
                          </button>
                          <span className="text-lg font-bold w-8 text-center">{counts[type]}</span>
                          <button
                            onClick={() => syncPassengerCounts({ ...counts, [type]: counts[type] + 1 })}
                            className="w-8 h-8 border border-outline-variant/50 flex items-center justify-center"
                          >
                            <span className="material-symbols-outlined text-base">add</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="bg-white border border-outline-variant/30 p-6 space-y-5">
                  <h2 className="font-headline text-xl text-primary">Thông tin hành khách</h2>
                  <div className="space-y-4">
                    {passengers.map((passenger, index) => {
                      const singleRoomChecked = Number(passenger.singleRoomSupplement ?? 0) > 0;

                      return (
                        <div key={`${passenger.type}-${index}`} className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-outline-variant/20 p-4">
                          <input value={passenger.name} onChange={(event) => updatePassenger(index, 'name', event.target.value)} className="w-full border border-outline-variant/50 px-4 py-3 text-sm" placeholder="Đúng theo CCCD/Passport" />
                          <input type="date" value={passenger.dob} onChange={(event) => updatePassenger(index, 'dob', event.target.value)} className="w-full border border-outline-variant/50 px-4 py-3 text-sm" />
                          <select value={passenger.gender} onChange={(event) => updatePassenger(index, 'gender', event.target.value)} className="w-full border border-outline-variant/50 px-4 py-3 text-sm bg-white">
                            <option value="male">Nam</option>
                            <option value="female">Nữ</option>
                          </select>
                          <input value={passenger.nationality ?? 'Việt Nam'} onChange={(event) => updatePassenger(index, 'nationality', event.target.value)} className="w-full border border-outline-variant/50 px-4 py-3 text-sm" placeholder="Quốc tịch" />
                          <input value={passenger.cccd ?? ''} onChange={(event) => updatePassenger(index, 'cccd', event.target.value)} className="w-full border border-outline-variant/50 px-4 py-3 text-sm md:col-span-2" placeholder="Số CCCD/Passport/GKS" />
                          {passenger.type === 'adult' && (
                            <div className="md:col-span-2 rounded-xl border border-outline-variant/30 bg-[var(--color-surface)] p-4">
                              <label className="flex items-center gap-3 text-sm text-primary">
                                <input
                                  type="checkbox"
                                  checked={singleRoomChecked}
                                  onChange={(event) => toggleSingleRoom(index, event.target.checked)}
                                />
                                Phòng đơn
                              </label>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              </>
            )}

            {activeStep === 1 && (
              <section className="bg-white border border-outline-variant/30 p-6 space-y-6">
                <h2 className="font-headline text-xl text-primary">Xác nhận thông tin</h2>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-3 rounded-2xl border border-outline-variant/30 p-5">
                    <p className="text-[10px] uppercase tracking-widest text-primary/45 font-label">Thông tin liên hệ</p>
                    <SummaryRow label="Họ tên" value={contact.name} />
                    <SummaryRow label="Số điện thoại" value={contact.phone} />
                    <SummaryRow label="Email" value={contact.email} />
                  </div>

                  <div className="space-y-3 rounded-2xl border border-outline-variant/30 p-5">
                    <p className="text-[10px] uppercase tracking-widest text-primary/45 font-label">Thông tin booking</p>
                    <SummaryRow label="Khởi hành" value={new Date(schedule.date).toLocaleDateString('vi-VN')} />
                    <SummaryRow label="Số lượng khách" value={`${totalGuests} khách`} />
                    <SummaryRow label="Phụ thu phòng đơn" value={surchargeTotal > 0 ? formatCurrency(surchargeTotal) : 'Không có'} />
                  </div>
                </div>

                <div className="space-y-3 rounded-2xl border border-outline-variant/30 p-5">
                  <p className="text-[10px] uppercase tracking-widest text-primary/45 font-label">Tỷ lệ thanh toán</p>
                  <label className="flex items-center gap-3 text-sm"><input type="radio" checked={paymentRatio === 'deposit'} onChange={() => setPaymentRatio('deposit')} /> Thanh toán 50%</label>
                  <label className="flex items-center gap-3 text-sm"><input type="radio" checked={paymentRatio === 'full'} onChange={() => setPaymentRatio('full')} /> Thanh toán toàn bộ</label>
                </div>

                <div className="space-y-3 rounded-2xl border border-outline-variant/30 p-5">
                  <p className="text-[10px] uppercase tracking-widest text-primary/45 font-label">Cách thanh toán trên cổng PayOS</p>
                  <label className="flex items-center gap-3 text-sm"><input type="radio" checked={paymentMethod === 'bank'} onChange={() => setPaymentMethod('bank')} /> Ưu tiên QR hoặc chuyển khoản qua PayOS</label>
                  <label className="flex items-center gap-3 text-sm"><input type="radio" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} /> Ưu tiên thẻ qua PayOS</label>
                  <p className="text-xs text-primary/60">
                    Hệ thống hiện tạo link PayOS thật. VietQR chưa có business flow nội bộ tách riêng ngoài cổng PayOS này.
                  </p>
                </div>
              </section>
            )}

            {activeStep === 2 && (
              <section className="bg-white border border-outline-variant/30 p-8 md:p-10 text-center">
                <span className="material-symbols-outlined text-5xl text-emerald-600 mb-4 block" style={{ fontVariationSettings: "'FILL' 1" }}>
                  check_circle
                </span>
                <h2 className="font-headline text-2xl text-primary">Hoàn tất đặt chỗ</h2>
                <p className="text-sm text-primary/60 mt-2">Đơn {createdBookingCode} đã được ghi nhận trên hệ thống backend thật.</p>

                <div className="mt-8 grid gap-4 sm:grid-cols-2 text-left">
                  <div className="bg-[var(--color-surface)] p-4">
                    <p className="text-[10px] uppercase tracking-widest text-primary/45 font-label">Mã đơn</p>
                    <p className="font-serif text-lg text-primary mt-1">{createdBookingCode}</p>
                  </div>
                  <div className="bg-[var(--color-surface)] p-4">
                    <p className="text-[10px] uppercase tracking-widest text-primary/45 font-label">Số tiền cần thanh toán</p>
                    <p className="font-serif text-lg text-primary mt-1">{formatCurrency(payableAmount)}</p>
                  </div>
                </div>

                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  {paymentUrl && (
                    <button
                      onClick={() => { window.location.href = paymentUrl; }}
                      className="px-6 py-3 bg-primary text-white font-sans uppercase tracking-[0.15em] text-[11px] font-bold hover:bg-[var(--color-secondary)] transition-colors"
                    >
                      Đi đến cổng thanh toán
                    </button>
                  )}
                  <button
                    onClick={() => navigate(`/customer/bookings/${createdBookingId}`)}
                    className="px-6 py-3 border border-outline-variant text-primary font-sans uppercase tracking-[0.15em] text-[11px] font-bold hover:border-primary transition-colors"
                  >
                    Xem đơn
                  </button>
                </div>
              </section>
            )}
          </div>

          <div className="w-full lg:w-80 shrink-0">
            <div className="lg:sticky lg:top-24 bg-white border border-outline-variant/30 overflow-hidden">
              <div className="relative">
                <img alt={tour.title} src={tour.image} className="w-full h-40 object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-3 left-4 right-4">
                  <p className="text-surface font-serif text-sm font-medium line-clamp-2">{tour.title}</p>
                  <p className="text-surface/80 text-xs mt-1">{new Date(schedule.date).toLocaleDateString('vi-VN')}</p>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <input value={String(roomCounts.single)} onChange={(event) => setRoomCounts((current) => ({ ...current, single: Number(event.target.value || 0) }))} type="number" className="border border-outline-variant/50 px-3 py-2 text-sm" placeholder="Phòng đơn" />
                  <input value={String(roomCounts.double)} onChange={(event) => setRoomCounts((current) => ({ ...current, double: Number(event.target.value || 0) }))} type="number" className="border border-outline-variant/50 px-3 py-2 text-sm" placeholder="Phòng đôi" />
                  <input value={String(roomCounts.triple)} onChange={(event) => setRoomCounts((current) => ({ ...current, triple: Number(event.target.value || 0) }))} type="number" className="border border-outline-variant/50 px-3 py-2 text-sm" placeholder="Phòng ba" />
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] uppercase tracking-widest text-primary/50 font-label">Mã giảm giá</p>
                  <div className="flex gap-2">
                    <input value={promoCode} onChange={(event) => setPromoCode(event.target.value.toUpperCase())} className="w-full border border-outline-variant/50 px-3 py-2 text-sm" placeholder="Nhập mã..." />
                    <button onClick={applyPromoCode} className="px-4 py-2 border border-outline-variant/50 text-xs font-semibold text-primary hover:border-primary">Áp dụng</button>
                  </div>
                  {appliedPromoCode && <p className="text-sm text-emerald-700">Đã áp dụng {appliedPromoCode}</p>}
                </div>

                <div className="space-y-2 rounded-2xl bg-[var(--color-surface)] p-4">
                  <SummaryRow label="Tổng hành khách" value={`${totalGuests} khách`} />
                  <SummaryRow label="Phụ thu phòng đơn" value={surchargeTotal > 0 ? formatCurrency(surchargeTotal) : 'Không có'} />
                  <SummaryRow label="Tổng cộng" value={formatCurrency(subtotal)} strong />
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                {activeStep === 0 && (
                  <button
                    onClick={goToPaymentStep}
                    disabled={!infoStepReady}
                    className={`w-full py-3.5 font-sans uppercase tracking-[0.15em] text-[11px] font-bold transition-all ${
                      infoStepReady
                        ? 'bg-primary text-surface hover:bg-[var(--color-secondary)]'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Tiếp tục: Thanh toán
                  </button>
                )}

                {activeStep === 1 && (
                  <div className="space-y-3">
                    <button
                      onClick={() => void handleSubmit()}
                      disabled={isSubmitting}
                      className={`w-full py-3.5 font-sans uppercase tracking-[0.15em] text-[11px] font-bold transition-all ${
                        !isSubmitting
                          ? 'bg-primary text-surface hover:bg-[var(--color-secondary)]'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {isSubmitting ? 'Đang tạo booking...' : `Thanh toán ${formatCurrency(payableAmount)}`}
                    </button>
                    <button
                      onClick={() => setActiveStep(0)}
                      className="w-full py-3.5 border border-outline-variant/50 text-primary font-sans uppercase tracking-[0.15em] text-[11px] font-bold hover:bg-[var(--color-surface)] transition-colors"
                    >
                      Quay lại
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
