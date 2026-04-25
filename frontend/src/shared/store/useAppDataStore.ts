import { create } from 'zustand';
import type { Tour } from '@entities/tour/data/tours';
import type { BlogPost } from '@entities/blog/data/blogs';
import type { Booking } from '@entities/booking/data/bookings';
import type { User } from '@entities/user/data/users';
import type { TourGuide, TourInstance, TourProgram } from '@entities/tour-program/data/tourProgram';
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

interface BootstrapPayload {
  users: User[];
  tourPrograms: TourProgram[];
  tourInstances: TourInstance[];
  suppliers: SupplierRow[];
  services: ServiceRow[];
  guides: TourGuide[];
  vouchers: Voucher[];
  blogs: Array<Record<string, unknown>>;
  tours: Tour[];
  bookings: Booking[];
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
  bookings: Booking[];
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
  setBookings: (bookings: Booking[]) => void;
  upsertBooking: (booking: Booking) => void;
  upsertUser: (user: User) => void;
  upsertTourProgram: (tourProgram: TourProgram) => void;
  upsertTourInstance: (tourInstance: TourInstance) => void;
  upsertService: (service: ServiceRow) => void;
  upsertSupplier: (supplier: SupplierRow) => void;
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
  bookings: [],
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
        bookings: [],
        protectedReady: false,
        protectedLoading: false,
      });
      return;
    }

    set({ protectedLoading: true });

    try {
      const response = await apiRequest<BootstrapResponse>('/bootstrap', { token });

      set({
        users: response.data.users,
        tourPrograms: response.data.tourPrograms,
        tourInstances: response.data.tourInstances,
        suppliers: response.data.suppliers,
        services: response.data.services,
        guides: response.data.guides,
        vouchers: response.data.vouchers,
        bookings: response.data.bookings,
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
    bookings: [],
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
  setBookings: (bookings) => set({ bookings }),

  upsertBooking: (booking) => set((state) => ({
    bookings: state.bookings.some((item) => item.id === booking.id)
      ? state.bookings.map((item) => (item.id === booking.id ? booking : item))
      : [booking, ...state.bookings],
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

  upsertVoucher: (voucher) => set((state) => ({
    vouchers: state.vouchers.some((item) => item.id === voucher.id)
      ? state.vouchers.map((item) => (item.id === voucher.id ? voucher : item))
      : [voucher, ...state.vouchers],
  })),

  removeVoucher: (id) => set((state) => ({
    vouchers: state.vouchers.filter((item) => item.id !== id),
  })),
}));


