import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import type { Booking, Passenger } from '@entities/booking/data/bookings';
import type { DepartureScheduleEntry } from '@entities/tour/data/tours';
import {
  createBookingPaymentLink,
  createPublicBooking,
  getBookingDetail,
  getPublicTourDetail,
  lookupBooking,
  updateCheckoutBooking,
  validatePublicPromoCode,
} from '@shared/lib/api/bookings';
import { formatCurrency } from '@shared/lib/booking';
import {
  getPassengerTypeLabel,
  NATIONALITY_OPTIONS,
  validatePassengerAgeByType,
  validatePassengerDocument,
  validatePhoneNumber,
} from '@shared/lib/customerBooking';
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

type ContactErrors = {
  name?: string;
  phone?: string;
  email?: string;
};

type PassengerErrors = Record<number, { name?: string; dob?: string; cccd?: string }>;

type RoomCounts = {
  single: number;
  double: number;
  triple: number;
};

type PendingDraftRestore = Record<string, unknown> | null;

const LEGACY_BOOKING_DRAFT_STORAGE_KEY = 'travela-public-booking-draft';
const BOOKING_DRAFT_STORAGE_PREFIX = 'travela-public-booking-draft';

function buildPassengers(counts: Counts, previous: Passenger[] = []) {
  const nextPassengers: Passenger[] = [];
  const grouped = {
    adult: previous.filter((passenger) => passenger.type === 'adult'),
    child: previous.filter((passenger) => passenger.type === 'child'),
    infant: previous.filter((passenger) => passenger.type === 'infant'),
  };

  (['adult', 'child', 'infant'] as const).forEach((type) => {
    const total = counts[type];
    for (let index = 0; index < total; index += 1) {
      nextPassengers.push(grouped[type][index] ?? {
        type,
        name: '',
        dob: '',
        gender: 'male',
        nationality: 'Việt Nam',
        singleRoomSupplement: 0,
      });
    }
  });

  return nextPassengers;
}

function buildPromoPreviewPassengers(counts: Counts): Passenger[] {
  const adultPassengers = Array.from({ length: counts.adult }, (_, index) => ({
    type: 'adult' as const,
    name: `Khach nguoi lon ${index + 1}`,
    dob: '1990-01-01',
    gender: 'male' as const,
    cccd: `001199000${String(index + 1).padStart(3, '0')}`,
    nationality: 'Việt Nam',
    singleRoomSupplement: 0,
  }));
  const childPassengers = Array.from({ length: counts.child }, (_, index) => ({
    type: 'child' as const,
    name: `Khach tre em ${index + 1}`,
    dob: '2018-01-01',
    gender: 'male' as const,
    nationality: 'Việt Nam',
    singleRoomSupplement: 0,
  }));
  const infantPassengers = Array.from({ length: counts.infant }, (_, index) => ({
    type: 'infant' as const,
    name: `Khach em be ${index + 1}`,
    dob: '2025-01-01',
    gender: 'male' as const,
    nationality: 'Việt Nam',
    singleRoomSupplement: 0,
  }));
  return [...adultPassengers, ...childPassengers, ...infantPassengers];
}

function StepChip({ active, complete, index, label }: { active: boolean; complete?: boolean; index: number; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold ${active ? 'border-[var(--color-secondary)] bg-[var(--color-secondary)] text-white' : complete ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-outline-variant/50 text-primary/45'}`}>
        {complete ? <span className="material-symbols-outlined text-base">check</span> : index}
      </div>
      <div className={`text-sm font-medium ${active ? 'text-primary' : complete ? 'text-primary/80' : 'text-primary/45'}`}>{label}</div>
    </div>
  );
}

function SummaryRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-primary/60">{label}</span>
      <span className={strong ? 'font-semibold text-primary text-right' : 'text-primary text-right'}>{value}</span>
    </div>
  );
}

function buildDraftStorageKey(ownerKey: string, slug?: string, scheduleId?: string) {
  return `${BOOKING_DRAFT_STORAGE_PREFIX}:${ownerKey}:${slug ?? 'unknown-tour'}:${scheduleId ?? 'unknown-schedule'}`;
}

function matchesScheduleId(schedule: DepartureScheduleEntry, scheduleId: string) {
  return schedule.id === scheduleId
    || schedule.legacyId === scheduleId
    || schedule.instanceCode === scheduleId
    || `${schedule.programCode ?? ''}-${schedule.instanceCode ?? ''}` === scheduleId;
}

function saveDraftToStorage(storageKey: string, payload: Record<string, unknown>) {
  try {
    localStorage.removeItem(LEGACY_BOOKING_DRAFT_STORAGE_KEY);
    localStorage.setItem(storageKey, JSON.stringify(payload));
  } catch {
    // Ignore storage failures.
  }
}

function loadDraftFromStorage(storageKey: string) {
  try {
    localStorage.removeItem(LEGACY_BOOKING_DRAFT_STORAGE_KEY);
    const raw = localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

function clearDraftFromStorage(storageKey?: string) {
  try {
    localStorage.removeItem(LEGACY_BOOKING_DRAFT_STORAGE_KEY);
    if (storageKey) {
      localStorage.removeItem(storageKey);
    }
  } catch {
    // Ignore storage failures.
  }
}

function isSuccessfulPaymentStatus(paymentStatus?: Booking['paymentStatus']) {
  return paymentStatus === 'partial' || paymentStatus === 'paid' || paymentStatus === 'refunded';
}

function isCancelledBookingStatus(status?: Booking['status']) {
  return status === 'cancelled';
}

function getPassengerDisplayNumber(passengers: Passenger[], index: number) {
  const target = passengers[index];
  if (!target) {
    return index + 1;
  }

  return passengers.slice(0, index + 1).filter((passenger) => passenger.type === target.type).length;
}

function shouldResetAppliedPromo(promoCode: string, discountAmount: number) {
  return promoCode.trim().length > 0 || discountAmount > 0;
}

function getBillablePassengerCounts(counts: Counts) {
  const freeInfants = Math.floor(counts.adult / 2);
  const infantsChargedAsChildren = Math.max(0, counts.infant - freeInfants);
  const includedChildren = Math.floor(counts.adult / 2);
  const childrenChargedAsAdults = Math.max(0, counts.child - includedChildren - 1);

  return {
    adult: counts.adult + childrenChargedAsAdults,
    child: Math.max(0, counts.child - childrenChargedAsAdults) + infantsChargedAsChildren,
    infant: Math.max(0, counts.infant - infantsChargedAsChildren),
    infantsChargedAsChildren,
    childrenChargedAsAdults,
    hasChildSurchargeWarning: counts.child > includedChildren,
  };
}

function getDefaultContact(user?: { name?: string; phone?: string; email?: string } | null): ContactState {
  return {
    name: user?.name ?? '',
    phone: user?.phone ?? '',
    email: user?.email ?? '',
    note: '',
  };
}

export default function BookingCheckout() {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const scheduleId = searchParams.get('scheduleId') ?? '';
  const payosState = searchParams.get('payos');
  const bookingIdParam = searchParams.get('bookingId') ?? '';

  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const tours = useAppDataStore((state) => state.publicTours);
  const bookings = useAppDataStore((state) => state.bookings);
  const upsertBooking = useAppDataStore((state) => state.upsertBooking);
  const upsertReview = useAppDataStore((state) => state.upsertReview);
  const bookingsRef = useRef(bookings);
  const restoredDraftKeyRef = useRef<string | null>(null);

  useEffect(() => {
    bookingsRef.current = bookings;
  }, [bookings]);

  const tour = tours.find((item) => item.slug === slug);
  const schedule: DepartureScheduleEntry | undefined = tour?.departureSchedule.find((item) => matchesScheduleId(item, scheduleId));
  const draftOwnerKey = user?.id ? `user-${user.id}` : 'guest';
  const draftStorageKey = useMemo(
    () => buildDraftStorageKey(draftOwnerKey, slug, scheduleId),
    [draftOwnerKey, scheduleId, slug],
  );

  const [activeStep, setActiveStep] = useState<CheckoutStep>(0);
  const [contact, setContact] = useState<ContactState>(() => getDefaultContact(user));
  const [counts, setCounts] = useState<Counts>({ adult: 1, child: 0, infant: 0 });
  const [passengers, setPassengers] = useState<Passenger[]>(buildPassengers({ adult: 1, child: 0, infant: 0 }));
  const [roomCounts, setRoomCounts] = useState<RoomCounts>({ single: 0, double: 1, triple: 0 });
  const [promoCode, setPromoCode] = useState('');
  const [promoMessage, setPromoMessage] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'bank' | 'card'>('bank');
  const [paymentRatio, setPaymentRatio] = useState<'deposit' | 'full'>('full');
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isStartingPayment, setIsStartingPayment] = useState(false);
  const [createdBooking, setCreatedBooking] = useState<Booking | null>(null);
  const [liveScheduleAvailableSeats, setLiveScheduleAvailableSeats] = useState<number | null>(null);
  const [paymentUrl, setPaymentUrl] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState('');
  const [contactErrors, setContactErrors] = useState<ContactErrors>({});
  const [passengerErrors, setPassengerErrors] = useState<PassengerErrors>({});
  const [countError, setCountError] = useState('');
  const [pendingDraftRestore, setPendingDraftRestore] = useState<PendingDraftRestore>(null);
  const pendingDraftBooking = (pendingDraftRestore?.booking as Booking | null | undefined) ?? null;
  const pendingDraftBookingCode = pendingDraftBooking?.bookingCode ?? '';
  const pendingDraftContact = pendingDraftBooking?.contactInfo.email || pendingDraftBooking?.contactInfo.phone || '';

  const effectiveBooking = createdBooking ?? (bookingIdParam ? bookings.find((item) => item.id === bookingIdParam) ?? null : null);
  const checkoutBooking = createdBooking ?? effectiveBooking;
  const checkoutBookingId = checkoutBooking?.id ?? ((bookingIdParam && accessToken) ? bookingIdParam : '');

  const priceAdult = schedule?.priceAdult ?? tour?.price.adult ?? 0;
  const priceChild = schedule?.priceChild ?? tour?.price.child ?? 0;
  const priceInfant = schedule?.priceInfant ?? tour?.price.infant ?? 0;
  const singleRoomSurcharge = schedule?.singleRoomSurcharge ?? 0;
  const availableSeats = liveScheduleAvailableSeats ?? schedule?.availableSeats ?? 0;
  const existingHeldSeats =
    effectiveBooking
    && (effectiveBooking.instanceCode === (schedule?.instanceCode ?? schedule?.id) || effectiveBooking.tourDate === schedule?.date)
      ? effectiveBooking.passengers.length
      : 0;
  const selectableSeatLimit = availableSeats + existingHeldSeats;

  const totalGuests = counts.adult + counts.child + counts.infant;
  const billableCounts = useMemo(() => getBillablePassengerCounts(counts), [counts]);
  const surchargeTotal = passengers.reduce((sum, passenger) => sum + (passenger.singleRoomSupplement ?? 0), 0);
  const subtotal = useMemo(
    () => billableCounts.adult * priceAdult + billableCounts.child * priceChild + billableCounts.infant * priceInfant + surchargeTotal,
    [billableCounts.adult, billableCounts.child, billableCounts.infant, priceAdult, priceChild, priceInfant, surchargeTotal],
  );
  const totalAfterDiscount = Math.max(subtotal - discountAmount, 0);
  const isDepositDisabled = Boolean(schedule && Math.ceil((new Date(schedule.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) <= 7);
  const payableAmount = paymentRatio === 'deposit' ? Math.ceil(totalAfterDiscount * 0.5) : totalAfterDiscount;

  const restoreDraft = useCallback((draft: Record<string, unknown>) => {
    const draftBooking = (draft.booking as Booking | null | undefined) ?? null;
    const draftStep = (draft.activeStep as CheckoutStep | undefined) ?? 0;
    const storedBooking = draftBooking
      ? bookingsRef.current.find((b) => b.id === draftBooking.id || b.bookingCode === draftBooking.bookingCode)
      : null;
    const isStoredCancelled = storedBooking ? isCancelledBookingStatus(storedBooking.status) : false;
    if (
      draftStep === 2
      || isSuccessfulPaymentStatus(draftBooking?.paymentStatus)
      || isStoredCancelled
      || isCancelledBookingStatus(draftBooking?.status)
      || !draftBooking
      || draftStep === 0
    ) {
      clearDraftFromStorage(draftStorageKey);
      setPendingDraftRestore(null);
      return;
    }

    restoredDraftKeyRef.current = draftStorageKey;
    clearDraftFromStorage(draftStorageKey);
    setPendingDraftRestore(null);
    setContact((current) => ({
      ...current,
      ...(draft.contact as ContactState | undefined),
    }));
    setCounts((draft.counts as Counts | undefined) ?? { adult: 1, child: 0, infant: 0 });
    setPassengers(buildPassengers((draft.counts as Counts | undefined) ?? { adult: 1, child: 0, infant: 0 }, (draft.passengers as Passenger[] | undefined) ?? []));
    setRoomCounts((draft.roomCounts as RoomCounts | undefined) ?? { single: 0, double: 1, triple: 0 });
    setPromoCode(String(draft.promoCode ?? ''));
    setDiscountAmount(Number(draft.discountAmount ?? 0));
    setPaymentMethod((draft.paymentMethod as 'bank' | 'card' | undefined) ?? 'bank');
    setPaymentRatio((draft.paymentRatio as 'deposit' | 'full' | undefined) ?? (isDepositDisabled ? 'full' : 'full'));
    setCreatedBooking(draftBooking);
    setActiveStep(draftStep);
  }, [draftStorageKey, isDepositDisabled]);

  const startNewDraft = () => {
    restoredDraftKeyRef.current = null;
    clearDraftFromStorage(draftStorageKey);
    setPendingDraftRestore(null);
    setCreatedBooking(null);
    setActiveStep(0);
  };

  useEffect(() => {
    if (!tour || !schedule) {
      return;
    }
    if (pendingDraftRestore) {
      return;
    }

    const draft = loadDraftFromStorage(draftStorageKey);
    if (!draft || draft.slug !== slug || draft.scheduleId !== schedule.id) {
      if (restoredDraftKeyRef.current === draftStorageKey) {
        return;
      }
      if (!bookingIdParam && !payosState) {
        clearDraftFromStorage(draftStorageKey);
        setContact(getDefaultContact(user));
        setCounts({ adult: 1, child: 0, infant: 0 });
        setPassengers(buildPassengers({ adult: 1, child: 0, infant: 0 }));
        setRoomCounts({ single: 0, double: 1, triple: 0 });
        setPromoCode('');
        setPromoMessage('');
        setDiscountAmount(0);
        setPaymentMethod('bank');
        setPaymentRatio('full');
        setCreatedBooking(null);
        setActiveStep(0);
        setError('');
        setStatusMessage('');
      }
      return;
    }

    const draftBooking = (draft.booking as Booking | null | undefined) ?? null;
    const storedDraftBooking = draftBooking
      ? bookingsRef.current.find((booking) => booking.id === draftBooking.id || booking.bookingCode === draftBooking.bookingCode)
      : null;
    const effectiveDraftBooking = storedDraftBooking ?? draftBooking;
    const draftStep = (draft.activeStep as CheckoutStep | undefined) ?? 0;

    const isStoredCancelled = storedDraftBooking ? isCancelledBookingStatus(storedDraftBooking.status) : false;
    const isLocalCancelled = isCancelledBookingStatus(draftBooking?.status);

    if (
      draftStep === 2
      || isSuccessfulPaymentStatus(effectiveDraftBooking?.paymentStatus)
      || (storedDraftBooking && isStoredCancelled)
      || (storedDraftBooking === null && isLocalCancelled)
    ) {
      clearDraftFromStorage(draftStorageKey);
      return;
    }

    if (!draftBooking || draftStep === 0) {
      clearDraftFromStorage(draftStorageKey);
      return;
    }

    if (!bookingIdParam && !payosState) {
      if (restoredDraftKeyRef.current === draftStorageKey) {
        return;
      }
      if (isStoredCancelled || isLocalCancelled) {
        clearDraftFromStorage(draftStorageKey);
        return;
      }
      setPendingDraftRestore({ ...draft, booking: effectiveDraftBooking });
      return;
    }

    restoreDraft({ ...draft, booking: effectiveDraftBooking });
  }, [bookingIdParam, draftStorageKey, isDepositDisabled, payosState, pendingDraftRestore, restoreDraft, schedule, slug, tour, user]);

  useEffect(() => {
    if (!pendingDraftBookingCode || !pendingDraftContact) {
      return;
    }

    let cancelled = false;
    void lookupBooking(pendingDraftBookingCode, pendingDraftContact)
      .then((response) => {
        if (cancelled) return;
        if (
          isCancelledBookingStatus(response.booking.status)
          || isSuccessfulPaymentStatus(response.booking.paymentStatus)
        ) {
          clearDraftFromStorage(draftStorageKey);
          setPendingDraftRestore(null);
          return;
        }
        upsertBooking(response.booking);
        setPendingDraftRestore((current) => current ? { ...current, booking: response.booking } : current);
      })
      .catch(() => {
        // Keep the local draft prompt if lookup is temporarily unavailable.
      });

    return () => {
      cancelled = true;
    };
  }, [draftStorageKey, pendingDraftBookingCode, pendingDraftContact, upsertBooking]);

  useEffect(() => {
    if (!bookingIdParam || createdBooking || effectiveBooking || !accessToken) {
      return;
    }

    let cancelled = false;

    void getBookingDetail(bookingIdParam, accessToken)
      .then((response) => {
        if (cancelled) {
          return;
        }
        upsertBooking(response.booking);
        setCreatedBooking(response.booking);
      })
      .catch(() => {
        if (!cancelled) {
          setError('Không thể tải lại đơn đặt chỗ hiện tại.');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken, bookingIdParam, createdBooking, effectiveBooking, upsertBooking]);

  useEffect(() => {
    if (!slug || !schedule) {
      setLiveScheduleAvailableSeats(null);
      return;
    }

    let cancelled = false;

    void getPublicTourDetail(slug)
      .then((response) => {
        if (cancelled) {
          return;
        }

        const latestSchedule = response.tour.departureSchedule.find((item) => item.id === schedule.id);
        setLiveScheduleAvailableSeats(latestSchedule ? latestSchedule.availableSeats : 0);
      })
      .catch(() => {
        if (!cancelled) {
          setLiveScheduleAvailableSeats(schedule.availableSeats ?? null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [createdBooking?.id, createdBooking?.passengers.length, schedule, slug]);

  useEffect(() => {
    if (isDepositDisabled && paymentRatio === 'deposit') {
      setPaymentRatio('full');
    }
  }, [isDepositDisabled, paymentRatio]);

  useEffect(() => {
    if (!bookingIdParam || !checkoutBooking) {
      return;
    }

    if (isSuccessfulPaymentStatus(checkoutBooking.paymentStatus)) {
      clearDraftFromStorage(draftStorageKey);
      setActiveStep(2);
      return;
    }

    setActiveStep((current) => (current === 2 ? current : 1));
  }, [bookingIdParam, checkoutBooking, draftStorageKey]);

  useEffect(() => {
    if (!tour || !schedule) {
      return;
    }
    if (pendingDraftRestore) {
      return;
    }

    if (
      activeStep === 2
      || isSuccessfulPaymentStatus(checkoutBooking?.paymentStatus)
      || isCancelledBookingStatus(checkoutBooking?.status)
    ) {
      clearDraftFromStorage(draftStorageKey);
      return;
    }

    if (activeStep === 0 && !checkoutBooking) {
      const stored = loadDraftFromStorage(draftStorageKey);
      if (stored && stored.slug === slug && stored.scheduleId === schedule.id && stored.booking) {
        return;
      }
      clearDraftFromStorage(draftStorageKey);
      return;
    }

    saveDraftToStorage(draftStorageKey, {
      slug,
      scheduleId: schedule.id,
      contact,
      counts,
      passengers,
      roomCounts,
      promoCode,
      discountAmount,
      paymentMethod,
      paymentRatio,
      booking: checkoutBooking,
      activeStep,
    });
  }, [activeStep, checkoutBooking, contact, counts, discountAmount, draftStorageKey, passengers, paymentMethod, paymentRatio, pendingDraftRestore, promoCode, roomCounts, schedule, slug, tour]);

  useEffect(() => {
    if (!bookingIdParam || !payosState) {
      return;
    }

    let cancelled = false;

    const syncBookingAfterPayment = async () => {
      const stored = loadDraftFromStorage(draftStorageKey);
      const draftBooking = (stored?.booking as Booking | undefined) ?? effectiveBooking ?? null;
      const lookupContact = draftBooking?.contactInfo.email || draftBooking?.contactInfo.phone || contact.email || contact.phone;
      const lookupCode = draftBooking?.bookingCode;
      if (!lookupContact || !lookupCode) {
        setActiveStep(payosState === 'return' ? 2 : 1);
        setStatusMessage(payosState === 'cancel' ? 'Thanh toán chưa hoàn tất. Đơn giữ chỗ trong 15 phút.' : 'Đã quay lại từ cổng thanh toán.');
        return;
      }

      try {
        const response = await lookupBooking(lookupCode, lookupContact);
        if (cancelled) {
          return;
        }
        upsertBooking(response.booking);
        setCreatedBooking(response.booking);
        const success = ['partial', 'paid'].includes(response.booking.paymentStatus);
        setActiveStep(success && payosState === 'return' ? 2 : 1);
        setStatusMessage(
          success && payosState === 'return'
            ? 'Thanh toán thành công.'
            : 'Thanh toán chưa hoàn tất. Đơn giữ chỗ trong 15 phút để bạn thử lại.',
        );
      } catch {
        if (!cancelled) {
          setActiveStep(1);
          setStatusMessage('Không thể đồng bộ lại kết quả thanh toán. Bạn có thể thử lại trong thời gian giữ chỗ.');
        }
      } finally {
        if (!cancelled) {
          const next = new URLSearchParams(searchParams);
          next.delete('payos');
          setSearchParams(next, { replace: true });
        }
      }
    };

    void syncBookingAfterPayment();

    return () => {
      cancelled = true;
    };
  }, [bookingIdParam, contact.email, contact.phone, draftStorageKey, effectiveBooking, payosState, searchParams, setSearchParams, upsertBooking]);

  const updatePassenger = (index: number, field: keyof Passenger, value: string | number) => {
    setPassengers((current) => current.map((passenger, passengerIndex) => (
      passengerIndex === index ? { ...passenger, [field]: value } : passenger
    )));
  };

  const resetAppliedPromo = () => {
    if (!shouldResetAppliedPromo(promoCode, discountAmount)) {
      return;
    }

    setDiscountAmount(0);
    setPromoMessage('');
  };

  const refreshScheduleAvailability = async () => {
    if (!slug || !schedule) {
      return null;
    }

    try {
      const response = await getPublicTourDetail(slug);
      const latestSchedule = response.tour.departureSchedule.find((item) => item.id === schedule.id);
      const latestAvailableSeats = latestSchedule ? latestSchedule.availableSeats : 0;
      setLiveScheduleAvailableSeats(latestAvailableSeats);
      return latestAvailableSeats;
    } catch {
      setLiveScheduleAvailableSeats(schedule.availableSeats ?? null);
      return schedule.availableSeats ?? null;
    }
  };

  const refreshSeatsIfNeeded = async (message: string) => {
    if (/ch[oỗ] tr[oố]ng|slot|seat|v[uư][oợ]t qu[aá]|available/i.test(message)) {
      await refreshScheduleAvailability();
    }
  };

  const syncPassengerCounts = (next: Counts) => {
    const nextTotalGuests = next.adult + next.child + next.infant;
    if (nextTotalGuests > selectableSeatLimit && nextTotalGuests >= totalGuests) {
      setCountError(`Số lượng hành khách không được vượt quá ${selectableSeatLimit} chỗ trống.`);
      return;
    }

    resetAppliedPromo();
    setCountError('');
    setCounts(next);
    setPassengers((current) => buildPassengers(next, current));
  };

  const toggleSingleRoom = (index: number, checked: boolean) => {
    resetAppliedPromo();
    updatePassenger(index, 'singleRoomSupplement', checked ? singleRoomSurcharge : 0);
  };

  const validateStepOne = () => {
    const nextContactErrors: ContactErrors = {};
    const nextPassengerErrors: PassengerErrors = {};

    if (!contact.name.trim()) nextContactErrors.name = 'Cần nhập họ tên liên hệ';
    else if (contact.name.trim().length < 2) nextContactErrors.name = 'Họ tên liên hệ phải có ít nhất 2 ký tự';
    if (!contact.phone.trim()) nextContactErrors.phone = 'Cần nhập số điện thoại';
    else if (!validatePhoneNumber(contact.phone)) nextContactErrors.phone = 'Số điện thoại không hợp lệ';
    if (!contact.email.trim()) nextContactErrors.email = 'Cần nhập email';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email.trim())) nextContactErrors.email = 'Email không đúng định dạng';

    passengers.forEach((passenger, index) => {
      const errors: PassengerErrors[number] = {};
      if (!passenger.name.trim()) errors.name = 'Cần nhập họ tên hành khách';
      else if (passenger.name.trim().length < 2) errors.name = 'Họ tên hành khách phải có ít nhất 2 ký tự';
      if (!passenger.dob) errors.dob = 'Cần nhập ngày sinh';
      else {
        const ageMessage = validatePassengerAgeByType(passenger, schedule?.date ?? '');
        if (ageMessage) errors.dob = ageMessage;
      }
      const documentMessage = validatePassengerDocument(passenger);
      if (documentMessage) errors.cccd = documentMessage;
      if (Object.keys(errors).length > 0) {
        nextPassengerErrors[index] = errors;
      }
    });

    if (totalGuests <= 0) {
      setCountError('Cần có ít nhất một hành khách.');
    } else if (totalGuests > selectableSeatLimit) {
      setCountError(`Số lượng hành khách không được vượt quá ${selectableSeatLimit} chỗ trống.`);
    } else {
      setCountError('');
    }

    setContactErrors(nextContactErrors);
    setPassengerErrors(nextPassengerErrors);

    return Object.keys(nextContactErrors).length === 0
      && Object.keys(nextPassengerErrors).length === 0
      && totalGuests > 0
      && totalGuests <= selectableSeatLimit;
  };

  const applyPromoCode = async () => {
    if (!tour || !schedule) {
      return;
    }

    if (!promoCode.trim()) {
      setDiscountAmount(0);
      setPromoMessage('');
      return;
    }

    try {
      const response = await validatePublicPromoCode({
        tourSlug: tour.slug,
        scheduleId: schedule.id,
        promoCode,
        passengers: buildPromoPreviewPassengers(counts),
      }, accessToken);

      setDiscountAmount(response.promo.discountAmount);
      setPromoMessage(response.promo.discountAmount > 0 ? `Đã áp dụng ${response.promo.code}` : 'Mã không áp dụng cho đơn này.');
      setError('');
    } catch (promoError) {
      setDiscountAmount(0);
      setPromoMessage('');
      setError(promoError instanceof Error ? promoError.message : 'Không thể áp dụng mã giảm giá.');
    }
  };

  const persistBookingDraft = async () => {
    if (!tour || !schedule || !validateStepOne()) {
      setError('Vui lòng hoàn thiện đầy đủ thông tin hành khách và liên hệ.');
      return null;
    }

    setIsSavingDraft(true);
    setError('');

    try {
      const payload = {
        tourSlug: tour.slug,
        scheduleId: schedule.id,
        contact,
        passengers,
        roomCounts,
        promoCode: promoCode.trim(),
        paymentMethod,
        paymentRatio,
      };

      const response = checkoutBookingId
        ? await updateCheckoutBooking(checkoutBookingId, {
            scheduleId: schedule.id,
            contact,
            passengers,
            roomCounts,
            promoCode: promoCode.trim(),
            paymentMethod,
            paymentRatio,
          }, accessToken)
        : await createPublicBooking(payload, accessToken);

      upsertBooking(response.booking);
      setCreatedBooking(response.booking);
      setDiscountAmount(response.booking.discountAmount ?? 0);
      setPromoMessage(response.booking.promoCode && (response.booking.discountAmount ?? 0) > 0 ? `Đã áp dụng ${response.booking.promoCode}` : '');
      setActiveStep(1);
      setStatusMessage(checkoutBookingId ? 'Đã cập nhật đơn đặt chỗ.' : 'Đã tạo đơn đặt chỗ. Vui lòng hoàn tất thanh toán trong 15 phút.');
      if (response.booking.review) {
        upsertReview({
          id: response.booking.review.id,
          bookingId: response.booking.id,
          rating: response.booking.review.rating,
          title: response.booking.review.title,
          comment: response.booking.review.comment,
          createdAt: response.booking.review.createdAt,
          authorName: user?.name ?? 'Khách hàng',
        });
      }
      return response.booking;
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Không thể tạo đơn đặt chỗ.';
      await refreshSeatsIfNeeded(message);
      setError(message);
      return null;
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleStartPayment = async () => {
    const booking = await persistBookingDraft();
    if (!booking) {
      return;
    }

    setIsStartingPayment(true);
    setError('');

    try {
      const refreshed = await updateCheckoutBooking(booking.id, {
        scheduleId: schedule!.id,
        contact,
        passengers,
        roomCounts,
        promoCode: promoCode.trim(),
        paymentMethod,
        paymentRatio,
      }, accessToken);

      upsertBooking(refreshed.booking);
      setCreatedBooking(refreshed.booking);

      const paymentResponse = await createBookingPaymentLink(booking.id, accessToken);
      setPaymentUrl(paymentResponse.paymentLink.checkoutUrl ?? '');
      if (paymentResponse.paymentLink.checkoutUrl) {
        window.location.href = paymentResponse.paymentLink.checkoutUrl;
      } else {
        setError('Không tạo được link thanh toán.');
      }
    } catch (paymentError) {
      const message = paymentError instanceof Error ? paymentError.message : 'Không thể khởi tạo thanh toán.';
      await refreshSeatsIfNeeded(message);
      setError(message);
    } finally {
      setIsStartingPayment(false);
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
            <h1 className="font-serif text-2xl text-primary">Đặt tour</h1>
            <p className="text-xs text-primary/50 font-sans mt-0.5">{tour.title} · {new Date(schedule.date).toLocaleDateString('vi-VN')}</p>
          </div>
        </div>

        <div className="mb-8 grid gap-4 rounded-2xl border border-outline-variant/30 bg-white p-5 md:grid-cols-3">
          <StepChip index={1} label="Thông tin" active={activeStep === 0} />
          <StepChip index={2} label="Thanh toán" active={activeStep === 1} complete={activeStep === 2} />
          <StepChip index={3} label="Hoàn tất" active={activeStep === 2} />
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
          <div className="flex-1 min-w-0 space-y-8">
            {activeStep === 0 && (
              <>
                <section className="bg-white border border-outline-variant/30 p-6 space-y-5">
                  <h2 className="font-headline text-xl text-primary">Thông tin liên hệ</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <label className="space-y-2">
                      <span className="text-xs font-medium text-primary/70">Họ tên liên hệ</span>
                      <input value={contact.name} onChange={(event) => setContact((current) => ({ ...current, name: event.target.value }))} className="w-full border border-outline-variant/50 px-4 py-3 text-sm" placeholder="Nguyễn Văn A" />
                      {contactErrors.name && <p className="text-xs text-red-600">{contactErrors.name}</p>}
                    </label>
                    <label className="space-y-2">
                      <span className="text-xs font-medium text-primary/70">Số điện thoại</span>
                      <input value={contact.phone} onChange={(event) => setContact((current) => ({ ...current, phone: event.target.value }))} className="w-full border border-outline-variant/50 px-4 py-3 text-sm" placeholder="0901 234 567" />
                      {contactErrors.phone && <p className="text-xs text-red-600">{contactErrors.phone}</p>}
                    </label>
                    <label className="space-y-2 md:col-span-2">
                      <span className="text-xs font-medium text-primary/70">Email nhận xác nhận</span>
                      <input value={contact.email} onChange={(event) => setContact((current) => ({ ...current, email: event.target.value }))} className="w-full border border-outline-variant/50 px-4 py-3 text-sm" placeholder="email@example.com" />
                      {contactErrors.email && <p className="text-xs text-red-600">{contactErrors.email}</p>}
                    </label>
                    <label className="space-y-2 md:col-span-2">
                      <span className="text-xs font-medium text-primary/70">Ghi chú</span>
                      <textarea value={contact.note} onChange={(event) => setContact((current) => ({ ...current, note: event.target.value }))} className="w-full border border-outline-variant/50 px-4 py-3 text-sm resize-none" placeholder="Yêu cầu đặc biệt" rows={3} />
                    </label>
                  </div>
                </section>

                <section className="bg-white border border-outline-variant/30 p-6 space-y-5">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <h2 className="font-headline text-xl text-primary">Số lượng hành khách</h2>
                    <p className="text-sm text-primary/60">Còn {selectableSeatLimit} chỗ trống</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {([
                      { type: 'adult' as const, label: 'Người lớn', hint: 'Từ 12 tuổi' },
                      { type: 'child' as const, label: 'Trẻ em', hint: 'Từ 2 - 11 tuổi' },
                      { type: 'infant' as const, label: 'Em bé', hint: 'Dưới 2 tuổi' },
                    ]).map((item) => (
                      <div key={item.type} className="border border-outline-variant/30 p-4">
                        <p className="text-sm font-medium text-primary">{item.label}</p>
                        <p className="text-xs text-primary/45 mt-1">{item.hint}</p>
                        <div className="flex items-center gap-3 mt-4">
                          <button
                            onClick={() => {
                              const minimum = item.type === 'adult' ? 1 : 0;
                              syncPassengerCounts({ ...counts, [item.type]: Math.max(minimum, counts[item.type] - 1) });
                            }}
                            className="w-9 h-9 border border-outline-variant/50 flex items-center justify-center"
                          >
                            <span className="material-symbols-outlined text-base">remove</span>
                          </button>
                          <span className="text-lg font-bold w-8 text-center">{counts[item.type]}</span>
                          <button
                            onClick={() => syncPassengerCounts({ ...counts, [item.type]: counts[item.type] + 1 })}
                            className="w-9 h-9 border border-outline-variant/50 flex items-center justify-center"
                          >
                            <span className="material-symbols-outlined text-base">add</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {countError && <p className="text-sm text-red-600">{countError}</p>}
                  {(billableCounts.infantsChargedAsChildren > 0 || billableCounts.hasChildSurchargeWarning) && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                      {billableCounts.infantsChargedAsChildren > 0 && (
                        <p>{billableCounts.infantsChargedAsChildren} em bé được tính giá như trẻ em.</p>
                      )}
                      {billableCounts.hasChildSurchargeWarning && billableCounts.childrenChargedAsAdults === 0 && (
                        <p>Có thể phát sinh phụ phí với số lượng trẻ em đã chọn.</p>
                      )}
                      {billableCounts.childrenChargedAsAdults > 0 && (
                        <p>{billableCounts.childrenChargedAsAdults} trẻ em được tính giá như người lớn.</p>
                      )}
                    </div>
                  )}
                </section>

                <section className="bg-white border border-outline-variant/30 p-6 space-y-5">
                  <h2 className="font-headline text-xl text-primary">Thông tin hành khách</h2>
                  <div className="space-y-4">
                    {passengers.map((passenger, index) => {
                      const singleRoomChecked = Number(passenger.singleRoomSupplement ?? 0) > 0;
                      const errors = passengerErrors[index] ?? {};

                      return (
                        <div key={`${passenger.type}-${index}`} className="grid grid-cols-1 md:grid-cols-4 gap-3 border border-outline-variant/20 p-4">
                          <div className="md:col-span-4 flex items-center justify-between gap-3">
                            <div>
                              <p className="font-medium text-primary">{getPassengerTypeLabel(passenger.type)} {getPassengerDisplayNumber(passengers, index)}</p>
                              <p className="text-xs text-primary/45">Đúng theo giấy tờ tùy thân</p>
                            </div>
                            {passenger.type === 'adult' && singleRoomSurcharge > 0 && (
                              <label className="flex items-center gap-2 text-xs text-primary/70">
                                <input type="checkbox" checked={singleRoomChecked} onChange={(event) => toggleSingleRoom(index, event.target.checked)} />
                                Phụ thu phòng đơn {formatCurrency(singleRoomSurcharge)}
                              </label>
                            )}
                          </div>

                          <label className="space-y-2 md:col-span-2">
                            <span className="text-xs font-medium text-primary/70">Họ tên hành khách</span>
                            <input value={passenger.name} onChange={(event) => updatePassenger(index, 'name', event.target.value)} className="w-full border border-outline-variant/50 px-4 py-3 text-sm" placeholder="Đúng theo CCCD/Passport" />
                            {errors.name && <p className="text-xs text-red-600">{errors.name}</p>}
                          </label>

                          <label className="space-y-2">
                            <span className="text-xs font-medium text-primary/70">Ngày sinh</span>
                            <input type="date" value={passenger.dob} onChange={(event) => updatePassenger(index, 'dob', event.target.value)} className="w-full border border-outline-variant/50 px-4 py-3 text-sm" />
                            {errors.dob && <p className="text-xs text-red-600">{errors.dob}</p>}
                          </label>

                          <label className="space-y-2">
                            <span className="text-xs font-medium text-primary/70">Giới tính</span>
                            <select value={passenger.gender} onChange={(event) => updatePassenger(index, 'gender', event.target.value)} className="w-full border border-outline-variant/50 px-4 py-3 text-sm bg-white">
                              <option value="male">Nam</option>
                              <option value="female">Nữ</option>
                            </select>
                          </label>

                          <label className="space-y-2 md:col-span-2">
                            <span className="text-xs font-medium text-primary/70">Quốc tịch</span>
                            <select value={passenger.nationality ?? 'Việt Nam'} onChange={(event) => updatePassenger(index, 'nationality', event.target.value)} className="w-full border border-outline-variant/50 px-4 py-3 text-sm bg-white">
                              {NATIONALITY_OPTIONS.map((option) => (
                                <option key={option} value={option}>{option}</option>
                              ))}
                            </select>
                          </label>

                          <label className="space-y-2 md:col-span-2">
                            <span className="text-xs font-medium text-primary/70">CCCD / GKS / Passport</span>
                            <input value={passenger.cccd ?? ''} onChange={(event) => updatePassenger(index, 'cccd', event.target.value)} className="w-full border border-outline-variant/50 px-4 py-3 text-sm" placeholder="Số giấy tờ" />
                            {errors.cccd && <p className="text-xs text-red-600">{errors.cccd}</p>}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </>
            )}

            {activeStep === 1 && (
              <section className="bg-white border border-outline-variant/30 p-6 space-y-6">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <h2 className="font-headline text-xl text-primary">Thanh toán</h2>
                    <p className="text-sm text-primary/55 mt-1">Đơn {effectiveBooking?.bookingCode ?? createdBooking?.bookingCode} đã được tạo. Bạn có thể sửa thông tin trước khi thanh toán.</p>
                  </div>
                  <button onClick={() => setActiveStep(0)} className="px-4 py-2 border border-outline-variant/50 text-primary text-xs uppercase tracking-[0.15em] hover:bg-[var(--color-surface)] transition-colors">
                    Quay lại sửa đơn
                  </button>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-3 rounded-2xl border border-outline-variant/30 p-5">
                    <p className="text-[10px] uppercase tracking-widest text-primary/45 font-label">Thông tin liên hệ</p>
                    <SummaryRow label="Họ tên" value={contact.name} />
                    <SummaryRow label="Số điện thoại" value={contact.phone} />
                    <SummaryRow label="Email" value={contact.email} />
                  </div>

                  <div className="space-y-3 rounded-2xl border border-outline-variant/30 p-5">
                    <p className="text-[10px] uppercase tracking-widest text-primary/45 font-label">Thông tin tour</p>
                    <SummaryRow label="Mã tour" value={`${schedule.programCode ?? tour.id} - ${schedule.instanceCode ?? schedule.id}`} />
                    <SummaryRow label="Khởi hành" value={new Date(schedule.date).toLocaleDateString('vi-VN')} />
                    <SummaryRow label="Số lượng khách" value={`${totalGuests} khách`} />
                    <SummaryRow label="Phụ thu phòng đơn" value={surchargeTotal > 0 ? formatCurrency(surchargeTotal) : 'Không có'} />
                  </div>
                </div>

                <div className="space-y-3 rounded-2xl border border-outline-variant/30 p-5">
                  <p className="text-[10px] uppercase tracking-widest text-primary/45 font-label">Hình thức thanh toán</p>
                  <label className={`flex items-start gap-3 text-sm rounded-xl border px-4 py-4 ${isDepositDisabled ? 'border-outline-variant/20 bg-gray-50 text-primary/40' : 'border-outline-variant/30'}`}>
                    <input type="radio" checked={paymentRatio === 'deposit'} onChange={() => setPaymentRatio('deposit')} disabled={isDepositDisabled} className="mt-0.5" />
                    <span>
                      <span className="font-medium text-primary block">Thanh toán 50%</span>
                      <span className="text-primary/55 text-xs">Áp dụng khi còn ít nhất 7 ngày tới ngày khởi hành.</span>
                    </span>
                  </label>
                  <label className="flex items-start gap-3 text-sm rounded-xl border border-outline-variant/30 px-4 py-4">
                    <input type="radio" checked={paymentRatio === 'full'} onChange={() => setPaymentRatio('full')} className="mt-0.5" />
                    <span>
                      <span className="font-medium text-primary block">Thanh toán toàn bộ</span>
                      <span className="text-primary/55 text-xs">Xác nhận số tiền cần thanh toán ngay trên cổng PayOS.</span>
                    </span>
                  </label>
                </div>

                <div className="space-y-3 rounded-2xl border border-outline-variant/30 p-5">
                  <p className="text-[10px] uppercase tracking-widest text-primary/45 font-label">Cổng thanh toán</p>
                  <label className="flex items-center gap-3 text-sm"><input type="radio" checked={paymentMethod === 'bank'} onChange={() => setPaymentMethod('bank')} /> Ưu tiên QR hoặc chuyển khoản qua PayOS</label>
                  <label className="flex items-center gap-3 text-sm"><input type="radio" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} /> Ưu tiên thẻ qua PayOS</label>
                </div>

                {effectiveBooking?.paymentWindowExpiresAt && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    Vui lòng hoàn tất thanh toán trước {new Date(effectiveBooking.paymentWindowExpiresAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ngày {new Date(effectiveBooking.paymentWindowExpiresAt).toLocaleDateString('vi-VN')}.
                  </div>
                )}
              </section>
            )}

            {activeStep === 2 && (
              <section className="bg-white border border-outline-variant/30 p-8 md:p-10 text-center">
                <span className="material-symbols-outlined text-5xl text-emerald-600 mb-4 block" style={{ fontVariationSettings: "'FILL' 1" }}>
                  check_circle
                </span>
                <h2 className="font-headline text-2xl text-primary">Đặt tour thành công</h2>
                <p className="text-sm text-primary/60 mt-2">Đơn {effectiveBooking?.bookingCode ?? createdBooking?.bookingCode} đã ghi nhận thanh toán {effectiveBooking?.paymentStatus === 'partial' ? 'một phần' : 'thành công'}.</p>

                <div className="mt-8 grid gap-4 sm:grid-cols-2 text-left">
                  <div className="bg-[var(--color-surface)] p-4">
                    <p className="text-[10px] uppercase tracking-widest text-primary/45 font-label">Mã đơn</p>
                    <p className="font-serif text-lg text-primary mt-1">{effectiveBooking?.bookingCode ?? createdBooking?.bookingCode}</p>
                  </div>
                  <div className="bg-[var(--color-surface)] p-4">
                    <p className="text-[10px] uppercase tracking-widest text-primary/45 font-label">Đã thanh toán</p>
                    <p className="font-serif text-lg text-primary mt-1">{formatCurrency(effectiveBooking?.paidAmount ?? payableAmount)}</p>
                  </div>
                </div>

                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  <button
                    onClick={() => {
                      clearDraftFromStorage(draftStorageKey);
                      navigate('/customer/bookings');
                    }}
                    className="px-6 py-3 bg-primary text-white font-sans uppercase tracking-[0.15em] text-[11px] font-bold hover:bg-[var(--color-secondary)] transition-colors"
                  >
                    Xem lịch sử đặt tour
                  </button>
                  {effectiveBooking?.id && (
                    <button
                      onClick={() => navigate(`/customer/bookings/${effectiveBooking.id}`)}
                      className="px-6 py-3 border border-outline-variant text-primary font-sans uppercase tracking-[0.15em] text-[11px] font-bold hover:border-primary transition-colors"
                    >
                      Xem chi tiết đơn
                    </button>
                  )}
                </div>
              </section>
            )}
          </div>

          <div className="w-full lg:w-[360px] shrink-0 lg:self-start lg:sticky lg:top-24">
            <div className="bg-white border border-outline-variant/30 overflow-hidden shadow-sm">
              <div className="relative">
                <img alt={tour.title} src={tour.image} className="w-full h-44 object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-surface font-serif text-base font-medium line-clamp-2">{tour.title}</p>
                  <p className="text-surface/80 text-xs mt-1">{new Date(schedule.date).toLocaleDateString('vi-VN')}</p>
                </div>
              </div>

              <div className="p-5 space-y-5">
                <div className="space-y-2">
                  <p className="text-[10px] uppercase tracking-widest text-primary/50 font-label">Mã giảm giá</p>
                  <div className="flex gap-2">
                    <input
                      value={promoCode}
                      onChange={(event) => {
                        const nextPromoCode = event.target.value.toUpperCase();
                        if (nextPromoCode !== promoCode) {
                          setPromoMessage('');
                          setDiscountAmount(0);
                        }
                        setPromoCode(nextPromoCode);
                      }}
                      className="w-full border border-outline-variant/50 px-3 py-2 text-sm"
                      placeholder="Nhập mã..."
                    />
                    <button onClick={() => void applyPromoCode()} className="px-4 py-2 border border-outline-variant/50 text-xs font-semibold text-primary hover:border-primary">Áp dụng</button>
                  </div>
                  {promoMessage && <p className="text-sm text-emerald-700">{promoMessage}</p>}
                </div>

                <div className="space-y-3 rounded-2xl bg-[var(--color-surface)] p-4">
                  <SummaryRow label="Mã tour" value={`${schedule.programCode ?? tour.id} - ${schedule.instanceCode ?? schedule.id}`} />
                  <SummaryRow label="Người lớn tính phí" value={`${billableCounts.adult} × ${formatCurrency(priceAdult)}`} />
                  <SummaryRow label="Trẻ em tính phí" value={`${billableCounts.child} × ${formatCurrency(priceChild)}`} />
                  <SummaryRow label="Em bé theo giá em bé" value={`${billableCounts.infant} × ${formatCurrency(priceInfant)}`} />
                  <SummaryRow label="Phụ thu phòng đơn" value={surchargeTotal > 0 ? formatCurrency(surchargeTotal) : 'Không có'} />
                  {discountAmount > 0 && <SummaryRow label="Giảm giá" value={`- ${formatCurrency(discountAmount)}`} />}
                  <SummaryRow label="Tổng cộng" value={formatCurrency(totalAfterDiscount)} strong />
                  {activeStep >= 1 && (
                    <SummaryRow label={paymentRatio === 'deposit' ? 'Thanh toán đợt này' : 'Thanh toán ngay'} value={formatCurrency(payableAmount)} strong />
                  )}
                </div>

                {statusMessage && <p className="text-sm text-emerald-700">{statusMessage}</p>}
                {error && <p className="text-sm text-red-600">{error}</p>}

                {activeStep === 0 && (
                  <button
                    onClick={() => void persistBookingDraft()}
                    disabled={isSavingDraft}
                    className={`w-full py-3.5 font-sans uppercase tracking-[0.15em] text-[11px] font-bold transition-all ${!isSavingDraft ? 'bg-primary text-surface hover:bg-[var(--color-secondary)]' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                  >
                    {isSavingDraft ? 'Đang tạo đơn...' : 'Tiếp tục thanh toán'}
                  </button>
                )}

                {activeStep === 1 && (
                  <div className="space-y-3">
                    <button
                      onClick={() => void handleStartPayment()}
                      disabled={isStartingPayment}
                      className={`w-full py-3.5 font-sans uppercase tracking-[0.15em] text-[11px] font-bold transition-all ${!isStartingPayment ? 'bg-primary text-surface hover:bg-[var(--color-secondary)]' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                    >
                      {isStartingPayment ? 'Đang chuyển sang PayOS...' : `Thanh toán ${formatCurrency(payableAmount)}`}
                    </button>
                    {paymentUrl && (
                      <button
                        onClick={() => { window.location.href = paymentUrl; }}
                        className="w-full py-3 border border-outline-variant/50 text-primary font-sans uppercase tracking-[0.15em] text-[11px] font-bold hover:bg-[var(--color-surface)] transition-colors"
                      >
                        Mở lại cổng thanh toán
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      {pendingDraftRestore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
          <div role="dialog" aria-modal="true" className="w-full max-w-md border border-outline-variant/40 bg-white p-6 shadow-2xl">
            <h2 className="font-headline text-2xl text-primary">Bạn có thông tin đặt tour dang dở</h2>
            <p className="mt-3 text-sm leading-6 text-primary/65">
              Bạn muốn khôi phục để thanh toán tiếp đơn đang giữ chỗ, hay đặt mới từ đầu?
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => restoreDraft(pendingDraftRestore)}
                className="bg-primary px-4 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-white hover:bg-[var(--color-secondary)]"
              >
                Khôi phục
              </button>
              <button
                type="button"
                onClick={startNewDraft}
                className="border border-outline-variant/60 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-primary hover:border-primary"
              >
                Đặt mới
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
