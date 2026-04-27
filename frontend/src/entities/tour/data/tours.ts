export interface DepartureScheduleEntry {
  id: string;
  programCode?: string;
  instanceCode?: string;
  date: string;
  availableSeats: number;
  totalSlots?: number;
  status: 'open' | 'filling' | 'full' | 'closed';
  priceAdult?: number;
  priceChild?: number;
  priceInfant?: number;
  singleRoomSurcharge?: number;
  bookingDeadlineAt?: string;
}

export interface TourReview {
  id: string;
  bookingId: string;
  rating: number;
  title?: string;
  comment: string;
  createdAt: string;
  authorName: string;
}

export interface CancellationTier {
  daysBefore: number;
  refundPercent: number;
}

export interface ItineraryDay {
  day: number;
  title: string;
  description: string;
  activities: string[];
  meals: ('breakfast' | 'lunch' | 'dinner')[];
}

export interface Tour {
  id: string;
  slug: string;
  regionKey?: string;
  title: string;
  description: string;
  highlights: string[];
  duration: { days: number; nights: number };
  price: { adult: number; child: number; infant?: number };
  originalPrice?: number;
  image: string;
  gallery: string[];
  startDate: string;
  availableSeats: number;
  minParticipants: number;
  status: 'published' | 'draft' | 'archived';
  category: 'domestic' | 'international';
  itinerary: ItineraryDay[];
  // Coach/Customer fields
  departurePoint: string;
  sightseeingSpots: string[];
  transport: 'xe' | 'maybay';
  arrivalPoint?: string;
  tourType: 'mua_le' | 'quanh_nam';
  holiday?: string;
  bookingDeadline: number;
  departureSchedule: DepartureScheduleEntry[];
  inclusions: string[];
  exclusions: string[];
  childPolicy: string;
  cancellationPolicy: CancellationTier[];
  rating?: number;
  reviewCount?: number;
  reviews?: TourReview[];
}
