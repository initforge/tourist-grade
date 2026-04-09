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

// Admin pages
import AdminUsers from './pages/admin/AdminUsers';

// Manager pages
import ManagerDashboard from './pages/manager/ManagerDashboard';
import ManagerVoucherApproval from './pages/manager/ManagerVoucherApproval';
import AdminTourProgramApproval from './pages/manager/AdminTourProgramApproval';
import ManagerTourEstimateApproval from './pages/manager/ManagerTourEstimateApproval';
import ManagerCancelPolicy from './pages/manager/ManagerCancelPolicy';
import ManagerTourPrograms from './pages/manager/TourPrograms';
import ManagerActiveTours from './pages/manager/ActiveTours';
import ManagerTourEstimate from './pages/manager/TourEstimate';
import ManagerTourProgramDetail from './pages/manager/TourProgramDetail';
import ManagerVouchers from './pages/manager/Vouchers';

// Coordinator pages
import CoordinatorDashboard from './pages/coordinator/CoordinatorDashboard';
import CoordinatorTourPrograms from './pages/coordinator/TourInstances';
import CoordinatorTourProgramWizard from './pages/coordinator/TourProgramWizard';
import CoordinatorTourProgramDetail from './pages/coordinator/TourProgramDetail';
import CoordinatorTourEstimate from './pages/coordinator/TourEstimate';
import CoordinatorTourSettlement from './pages/coordinator/TourSettlement';
import CoordinatorServiceList from './pages/coordinator/ServiceList';
import CoordinatorSuppliers from './pages/coordinator/Suppliers';
import CoordinatorVouchers from './pages/coordinator/Vouchers';
import TourReceiveDispatch from './pages/coordinator/TourReceiveDispatch';
import TourGenerationRules from './pages/coordinator/TourGenerationRules';

// Sales pages
import SalesDashboard from './pages/sales/SalesDashboard';
import SalesBookings from './pages/sales/SalesBookings';
import SalesBookingDetail from './pages/sales/SalesBookingDetail';
import SalesVouchers from './pages/sales/Vouchers';

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
          <Route path="tour-programs" element={<ManagerTourPrograms />} />
          <Route path="tour-programs/:id" element={<ManagerTourProgramDetail />} />
          <Route path="tour-programs/:id/approval" element={<AdminTourProgramApproval />} />
          <Route path="tours" element={<ManagerActiveTours />} />
          <Route path="tours/:id/estimate" element={<ManagerTourEstimate />} />
          <Route path="tours/:id/estimate-approval" element={<ManagerTourEstimateApproval />} />
          <Route path="voucher-approval" element={<ManagerVoucherApproval />} />
          <Route path="cancel-policies" element={<ManagerCancelPolicy />} />
          <Route path="vouchers" element={<ManagerVouchers />} />
        </Route>

        {/* Coordinator routes */}
        <Route path="/coordinator" element={<CoordinatorLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<CoordinatorDashboard />} />
          <Route path="tour-programs" element={<CoordinatorTourPrograms />} />
          <Route path="tour-programs/create" element={<CoordinatorTourProgramWizard />} />
          <Route path="tour-programs/:id" element={<CoordinatorTourProgramDetail />} />
          <Route path="tour-programs/:id/receive" element={<TourReceiveDispatch />} />
          <Route path="tour-rules" element={<TourGenerationRules />} />
          <Route path="tours" element={<CoordinatorTourPrograms />} />
          <Route path="tours/:id/estimate" element={<CoordinatorTourEstimate />} />
          <Route path="tours/:id/settle" element={<CoordinatorTourSettlement />} />
          <Route path="services" element={<CoordinatorServiceList />} />
          <Route path="suppliers" element={<CoordinatorSuppliers />} />
          <Route path="vouchers" element={<CoordinatorVouchers />} />
        </Route>

        {/* Sales routes */}
        <Route path="/sales" element={<SalesLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<SalesDashboard />} />
          <Route path="bookings" element={<SalesBookings />} />
          <Route path="bookings/:id" element={<SalesBookingDetail />} />
          <Route path="vouchers" element={<SalesVouchers />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
