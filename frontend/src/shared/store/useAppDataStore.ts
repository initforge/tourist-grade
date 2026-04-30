import { create } from 'zustand';
import type { Tour } from '@entities/tour/data/tours';
import type { BlogPost } from '@entities/blog/data/blogs';
import type { Booking } from '@entities/booking/data/bookings';
import type { User } from '@entities/user/data/users';
import type { SpecialDay, TourGuide, TourInstance, TourProgram } from '@entities/tour-program/data/tourProgram';
import type { Voucher } from '@entities/voucher/data/vouchers';
import { apiRequest } from '@shared/lib/api/client';
import { useAuthStore } from './useAuthStore';

export interface SupplierPriceRow {
  id: string;
  fromDate: string;
  toDate: string;
  unitPrice: number;
  note: string;
  createdBy: string;
}

export interface SupplierServiceLine {
  id: string;
  name: string;
  description: string;
  unit: string;
  quantity: number;
  capacity?: number;
  transportType?: 'Xe' | 'Máy bay';
  priceMode?: 'Báo giá' | 'Niêm yết';
  menu?: string;
  note?: string;
  formulaCount?: string;
  formulaCountDefault?: string;
  formulaQuantity?: string;
  formulaQuantityDefault?: string;
  prices: SupplierPriceRow[];
}

export interface SupplierRow {
  id: string;
  name: string;
  phone: string;
  email: string;
  category: string;
  service: string;
  operatingArea: string;
  status: string;
  address: string;
  establishedYear: string;
  description: string;
  standards?: string[];
  services: SupplierServiceLine[];
  mealServices: SupplierServiceLine[];
}

export interface ServicePriceRow {
  id: string;
  unitPrice: number;
  note: string;
  effectiveDate: string;
  endDate: string;
  createdBy: string;
}

export interface ServiceRow {
  id: string;
  name: string;
  category: string;
  unit: string;
  priceMode: string;
  setup: string;
  status: string;
  description: string;
  supplierName?: string;
  contactInfo?: string;
  province?: string;
  formulaCount?: string;
  formulaCountDefault?: string;
  formulaQuantity?: string;
  formulaQuantityDefault?: string;
  prices: ServicePriceRow[];
}

export interface WishlistItem {
  id: string;
  tourId: string;
  slug: string;
  addedAt: string;
}

export interface CustomerReview {
  id: string;
  bookingId: string;
  rating: number;
  title?: string;
  comment: string;
  createdAt: string;
  authorName: string;
}

export interface ProvinceRow {
  id: string;
  code: string;
  name: string;
  hasAirport: boolean;
}

interface BootstrapPayload {
  users: User[];
  tourPrograms: TourProgram[];
  tourInstances: TourInstance[];
  suppliers: SupplierRow[];
  services: ServiceRow[];
  guides: TourGuide[];
  vouchers: Voucher[];
  specialDays: SpecialDay[];
  provinces: ProvinceRow[];
  blogs: Array<Record<string, unknown>>;
  tours: Tour[];
  bookings: Booking[];
  wishlist: WishlistItem[];
  reviews: CustomerReview[];
}

interface PublicBlogsResponse {
  success: boolean;
  blogs: Array<{
    id: string;
    slug: string;
    title: string;
    category: string;
    excerpt: string;
    contentMarkdown: string;
    coverImageUrl: string;
    publishedAt: string | null;
  }>;
}

interface PublicToursResponse {
  success: boolean;
  tours: Tour[];
}

interface BootstrapResponse {
  success: boolean;
  data: BootstrapPayload;
}

interface AppDataState {
  publicTours: Tour[];
  publicBlogs: BlogPost[];
  users: User[];
  tourPrograms: TourProgram[];
  tourInstances: TourInstance[];
  suppliers: SupplierRow[];
  services: ServiceRow[];
  guides: TourGuide[];
  vouchers: Voucher[];
  specialDays: SpecialDay[];
  provinces: ProvinceRow[];
  bookings: Booking[];
  wishlist: WishlistItem[];
  reviews: CustomerReview[];
  publicReady: boolean;
  protectedReady: boolean;
  publicLoading: boolean;
  protectedLoading: boolean;
  initializePublic: () => Promise<void>;
  initializeProtected: () => Promise<void>;
  clearProtected: () => void;
  setUsers: (users: User[]) => void;
  setTourPrograms: (tourPrograms: TourProgram[]) => void;
  setTourInstances: (tourInstances: TourInstance[]) => void;
  setSuppliers: (suppliers: SupplierRow[]) => void;
  setServices: (services: ServiceRow[]) => void;
  setGuides: (guides: TourGuide[]) => void;
  setVouchers: (vouchers: Voucher[]) => void;
  setSpecialDays: (specialDays: SpecialDay[]) => void;
  setProvinces: (provinces: ProvinceRow[]) => void;
  setBookings: (bookings: Booking[]) => void;
  setWishlist: (wishlist: WishlistItem[]) => void;
  setReviews: (reviews: CustomerReview[]) => void;
  upsertBooking: (booking: Booking) => void;
  upsertWishlistItem: (item: WishlistItem) => void;
  removeWishlistItem: (tourId: string) => void;
  upsertReview: (review: CustomerReview) => void;
  appendPublicTourReview: (tourId: string, review: CustomerReview) => void;
  upsertUser: (user: User) => void;
  upsertTourProgram: (tourProgram: TourProgram) => void;
  upsertTourInstance: (tourInstance: TourInstance) => void;
  upsertService: (service: ServiceRow) => void;
  upsertSupplier: (supplier: SupplierRow) => void;
  upsertGuide: (guide: TourGuide) => void;
  upsertVoucher: (voucher: Voucher) => void;
  removeVoucher: (id: string) => void;
}

function getToken() {
  return useAuthStore.getState().accessToken ?? undefined;
}

function mapBlogPost(post: PublicBlogsResponse['blogs'][number], index: number): BlogPost {
  return {
    id: post.id || index + 1,
    slug: post.slug,
    category: post.category,
    title: post.title,
    excerpt: post.excerpt,
    author: 'Travela',
    date: post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('vi-VN') : 'Chưa xuất bản',
    readTime: '5 phút đọc',
    image: post.coverImageUrl,
    contentMarkdown: post.contentMarkdown,
    publishedAt: post.publishedAt,
  };
}

export const useAppDataStore = create<AppDataState>((set) => ({
  publicTours: [],
  publicBlogs: [],
  users: [],
  tourPrograms: [],
  tourInstances: [],
  suppliers: [],
  services: [],
  guides: [],
  vouchers: [],
  specialDays: [],
  provinces: [],
  bookings: [],
  wishlist: [],
  reviews: [],
  publicReady: false,
  protectedReady: false,
  publicLoading: false,
  protectedLoading: false,

  initializePublic: async () => {
    set({ publicLoading: true });

    try {
      const [toursResponse, blogsResponse] = await Promise.all([
        apiRequest<PublicToursResponse>('/public/tours'),
        apiRequest<PublicBlogsResponse>('/public/blogs'),
      ]);

      set({
        publicTours: toursResponse.tours,
        publicBlogs: blogsResponse.blogs.map(mapBlogPost),
        publicReady: true,
        publicLoading: false,
      });
    } catch {
      set({ publicLoading: false });
    }
  },

  initializeProtected: async () => {
    const token = getToken();

    if (!token) {
      set({
        users: [],
        tourPrograms: [],
        tourInstances: [],
        suppliers: [],
        services: [],
        guides: [],
        vouchers: [],
        specialDays: [],
        provinces: [],
        bookings: [],
        wishlist: [],
        reviews: [],
        protectedReady: false,
        protectedLoading: false,
      });
      return;
    }

    set({ protectedLoading: true });

    try {
      const response = await apiRequest<BootstrapResponse>('/bootstrap', { token });
      const data = response.data;

      set({
        users: data.users ?? [],
        tourPrograms: data.tourPrograms ?? [],
        tourInstances: data.tourInstances ?? [],
        suppliers: data.suppliers ?? [],
        services: data.services ?? [],
        guides: data.guides ?? [],
        vouchers: data.vouchers ?? [],
        specialDays: data.specialDays ?? [],
        provinces: data.provinces ?? [],
        bookings: data.bookings ?? [],
        wishlist: data.wishlist ?? [],
        reviews: data.reviews ?? [],
        protectedReady: true,
        protectedLoading: false,
      });
    } catch {
      set({ protectedLoading: false, protectedReady: false });
    }
  },

  clearProtected: () => set({
    users: [],
    tourPrograms: [],
    tourInstances: [],
    suppliers: [],
    services: [],
    guides: [],
    vouchers: [],
    specialDays: [],
    provinces: [],
    bookings: [],
    wishlist: [],
    reviews: [],
    protectedReady: false,
    protectedLoading: false,
  }),

  setUsers: (users) => set({ users }),
  setTourPrograms: (tourPrograms) => set({ tourPrograms }),
  setTourInstances: (tourInstances) => set({ tourInstances }),
  setSuppliers: (suppliers) => set({ suppliers }),
  setServices: (services) => set({ services }),
  setGuides: (guides) => set({ guides }),
  setVouchers: (vouchers) => set({ vouchers }),
  setSpecialDays: (specialDays) => set({ specialDays }),
  setProvinces: (provinces) => set({ provinces }),
  setBookings: (bookings) => set({ bookings }),
  setWishlist: (wishlist) => set({ wishlist }),
  setReviews: (reviews) => set({ reviews }),

  upsertBooking: (booking) => set((state) => ({
    bookings: state.bookings.some((item) => item.id === booking.id)
      ? state.bookings.map((item) => (item.id === booking.id ? booking : item))
      : [booking, ...state.bookings],
  })),

  upsertWishlistItem: (item) => set((state) => ({
    wishlist: state.wishlist.some((entry) => entry.tourId === item.tourId)
      ? state.wishlist.map((entry) => (entry.tourId === item.tourId ? item : entry))
      : [item, ...state.wishlist],
  })),

  removeWishlistItem: (tourId) => set((state) => ({
    wishlist: state.wishlist.filter((entry) => entry.tourId !== tourId),
  })),

  upsertReview: (review) => set((state) => ({
    reviews: state.reviews.some((entry) => entry.id === review.id)
      ? state.reviews.map((entry) => (entry.id === review.id ? review : entry))
      : [review, ...state.reviews],
    bookings: state.bookings.map((booking) => (
      booking.id === review.bookingId
        ? {
            ...booking,
            review: {
              id: review.id,
              rating: review.rating,
              title: review.title,
              comment: review.comment,
              createdAt: review.createdAt,
            },
          }
        : booking
    )),
  })),

  appendPublicTourReview: (tourId, review) => set((state) => ({
    publicTours: state.publicTours.map((tour) => {
      if (tour.id !== tourId) {
        return tour;
      }

      const nextReviews = [
        {
          id: review.id,
          bookingId: review.bookingId,
          rating: review.rating,
          title: review.title,
          comment: review.comment,
          createdAt: review.createdAt,
          authorName: review.authorName,
        },
        ...(tour.reviews ?? []),
      ];
      const nextReviewCount = nextReviews.length;
      const nextRating = nextReviews.reduce((sum, item) => sum + item.rating, 0) / nextReviewCount;

      return {
        ...tour,
        reviews: nextReviews,
        reviewCount: nextReviewCount,
        rating: Math.round(nextRating * 10) / 10,
      };
    }),
  })),

  upsertUser: (user) => set((state) => ({
    users: state.users.some((item) => item.id === user.id)
      ? state.users.map((item) => (item.id === user.id ? user : item))
      : [...state.users, user],
  })),

  upsertTourProgram: (tourProgram) => set((state) => ({
    tourPrograms: state.tourPrograms.some((item) => item.id === tourProgram.id)
      ? state.tourPrograms.map((item) => (item.id === tourProgram.id ? tourProgram : item))
      : [...state.tourPrograms, tourProgram],
  })),

  upsertTourInstance: (tourInstance) => set((state) => ({
    tourInstances: state.tourInstances.some((item) => item.id === tourInstance.id)
      ? state.tourInstances.map((item) => (item.id === tourInstance.id ? tourInstance : item))
      : [...state.tourInstances, tourInstance],
  })),

  upsertService: (service) => set((state) => ({
    services: state.services.some((item) => item.id === service.id)
      ? state.services.map((item) => (item.id === service.id ? service : item))
      : [service, ...state.services],
  })),

  upsertSupplier: (supplier) => set((state) => ({
    suppliers: state.suppliers.some((item) => item.id === supplier.id)
      ? state.suppliers.map((item) => (item.id === supplier.id ? supplier : item))
      : [supplier, ...state.suppliers],
  })),

  upsertGuide: (guide) => set((state) => ({
    guides: state.guides.some((item) => item.id === guide.id)
      ? state.guides.map((item) => (item.id === guide.id ? guide : item))
      : [guide, ...state.guides],
  })),

  upsertVoucher: (voucher) => set((state) => ({
    vouchers: state.vouchers.some((item) => item.id === voucher.id)
      ? state.vouchers.map((item) => (item.id === voucher.id ? voucher : item))
      : [voucher, ...state.vouchers],
  })),

  removeVoucher: (id) => set((state) => ({
    vouchers: state.vouchers.filter((item) => item.id !== id),
  })),
}));


