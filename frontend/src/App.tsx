import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { PublicLayout } from './components/layout/PublicLayout';
import { AdminLayout } from './components/layout/AdminLayout';
import { ManagerLayout } from './components/layout/ManagerLayout';
import { CoordinatorLayout } from './components/layout/CoordinatorLayout';
import { SalesLayout } from './components/layout/SalesLayout';
import { AuthLayout } from './components/layout/AuthLayout';

// Public pages
import Landing from './pages/public/Landing';
import TourList from './pages/public/TourList';
import TourDetail from './pages/public/TourDetail';
import BookingCheckout from './pages/public/BookingCheckout';
import BookingSuccess from './pages/public/BookingSuccess';
import OrderLookup from './pages/public/OrderLookup';
import BlogList from './pages/public/BlogList';
import BlogDetail from './pages/public/BlogDetail';
import AboutUs from './pages/public/AboutUs';

// Auth pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Customer pages
import BookingHistory from './pages/customer/BookingHistory';
import BookingDetail from './pages/customer/BookingDetail';
import CancelBooking from './pages/customer/CancelBooking';
import Wishlist from './pages/customer/Wishlist';
import Profile from './pages/customer/Profile';

// Shared office pages (used by multiple roles)
import AdminTourPrograms from './pages/admin/AdminTourPrograms';
import AdminTourProgramWizard from './pages/admin/AdminTourProgramWizard';
import AdminTourProgramDetail from './pages/admin/AdminTourProgramDetail';
import AdminActiveTours from './pages/admin/AdminActiveTours';
import TourEstimate from './pages/admin/TourEstimate';
import TourSettlement from './pages/admin/TourSettlement';
import ServiceList from './pages/admin/ServiceList';
import AdminSuppliers from './pages/admin/AdminSuppliers';
import BookingManagement from './pages/admin/BookingManagement';
import SalesBookingDetail from './pages/admin/SalesBookingDetail';
import VoucherManagement from './pages/admin/VoucherManagement';

// Admin-only pages
import AdminUsers from './pages/admin/AdminUsers';

// Per-role dashboards
import ManagerDashboard from './pages/manager/ManagerDashboard';
import CoordinatorDashboard from './pages/coordinator/CoordinatorDashboard';
import SalesDashboard from './pages/sales/SalesDashboard';
import ManagerVoucherApproval from './pages/manager/ManagerVoucherApproval';
import AdminTourProgramApproval from './pages/manager/AdminTourProgramApproval';
import ManagerTourEstimateApproval from './pages/manager/ManagerTourEstimateApproval';
import ManagerCancelPolicy from './pages/manager/ManagerCancelPolicy';
import CoordinatorTourPrograms from './pages/coordinator/AdminTourPrograms';
import TourReceiveDispatch from './pages/coordinator/TourReceiveDispatch';
import TourGenerationRules from './pages/coordinator/TourGenerationRules';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route element={<PublicLayout />}>
          <Route index element={<Landing />} />
          <Route path="tours" element={<TourList />} />
          <Route path="tours/:slug" element={<TourDetail />} />
          <Route path="tours/:slug/book" element={<BookingCheckout />} />
          <Route path="booking/success" element={<BookingSuccess />} />
          <Route path="booking/lookup" element={<OrderLookup />} />
          <Route path="blog" element={<BlogList />} />
          <Route path="blog/:slug" element={<BlogDetail />} />
          <Route path="about" element={<AboutUs />} />
          
          {/* Customer routes (auth required) */}
          <Route path="customer/bookings" element={<BookingHistory />} />
          <Route path="customer/bookings/:id" element={<BookingDetail />} />
          <Route path="customer/bookings/:id/cancel" element={<CancelBooking />} />
          <Route path="customer/wishlist" element={<Wishlist />} />
          <Route path="customer/profile" element={<Profile />} />
        </Route>

        {/* Auth routes */}
        <Route element={<AuthLayout />}>
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="reset-password" element={<ResetPassword />} />
        </Route>

        {/* Admin routes (Admin only) */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="users" replace />} />
          <Route path="users" element={<AdminUsers />} />
        </Route>

        {/* Manager routes */}
        <Route path="/manager" element={<ManagerLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<ManagerDashboard />} />
          <Route path="tour-programs" element={<AdminTourPrograms />} />
          <Route path="tour-programs/:id" element={<AdminTourProgramDetail />} />
          <Route path="tours" element={<AdminActiveTours />} />
          <Route path="tours/:id/estimate" element={<TourEstimate />} />
          <Route path="voucher-approval" element={<ManagerVoucherApproval />} />
          <Route path="tour-programs/:id/approval" element={<AdminTourProgramApproval />} />
          <Route path="tours/:id/estimate-approval" element={<ManagerTourEstimateApproval />} />
          <Route path="cancel-policies" element={<ManagerCancelPolicy />} />
        </Route>

        {/* Coordinator routes */}
        <Route path="/coordinator" element={<CoordinatorLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<CoordinatorDashboard />} />
          <Route path="tour-programs" element={<CoordinatorTourPrograms />} />
          <Route path="tour-programs/create" element={<AdminTourProgramWizard />} />
          <Route path="tour-programs/:id" element={<AdminTourProgramDetail />} />
          <Route path="tour-programs/:id/receive" element={<TourReceiveDispatch />} />
          <Route path="tour-rules" element={<TourGenerationRules />} />
          <Route path="tours" element={<AdminActiveTours />} />
          <Route path="tours/:id/estimate" element={<TourEstimate />} />
          <Route path="tours/:id/settle" element={<TourSettlement />} />
          <Route path="services" element={<ServiceList />} />
          <Route path="suppliers" element={<AdminSuppliers />} />
          <Route path="vouchers" element={<VoucherManagement />} />
        </Route>

        {/* Sales routes */}
        <Route path="/sales" element={<SalesLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<SalesDashboard />} />
          <Route path="bookings" element={<BookingManagement />} />
          <Route path="bookings/:id" element={<SalesBookingDetail />} />
          <Route path="vouchers" element={<VoucherManagement />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
