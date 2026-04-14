import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import {
  AdminLayout,
  AuthLayout,
  CoordinatorLayout,
  ManagerLayout,
  PublicLayout,
  SalesLayout,
} from '@shared/layouts';
import {
  AboutUs,
  BlogDetail,
  BlogList,
  BookingCheckout,
  BookingSuccess,
  Landing,
  OrderLookup,
  TourDetail,
  TourList,
} from '@features/public/pages';
import { ForgotPassword, Login, Register, ResetPassword } from '@features/auth/pages';
import { BookingDetail, BookingHistory, CancelBooking, Profile, Wishlist } from '@features/customer/pages';
import { AdminUsers } from '@features/admin/pages';
import {
  ActiveTours,
  AdminTourProgramApproval,
  ManagerCancelPolicy,
  ManagerDashboard,
  ManagerTourEstimateApproval,
  ManagerVoucherApproval,
  SpecialDays,
  TourEstimate as ManagerTourEstimate,
  TourProgramDetail as ManagerTourProgramDetail,
  TourPrograms as ManagerTourPrograms,
  Vouchers as ManagerVouchers,
} from '@features/manager/pages';
import {
  CoordinatorDashboard,
  ServiceList,
  Suppliers,
  TourEstimate as CoordinatorTourEstimate,
  TourGenerationRules,
  TourInstances as CoordinatorTourOperations,
  TourProgramDetail as CoordinatorTourProgramDetail,
  TourPrograms as CoordinatorTourPrograms,
  TourProgramWizard as CoordinatorTourProgramWizard,
  TourReceiveDispatch,
  TourSettlement as CoordinatorTourSettlement,
  Vouchers as CoordinatorVouchers,
} from '@features/coordinator/pages';
import {
  SalesBookingDetail,
  SalesBookings,
  SalesDashboard,
  Vouchers as SalesVouchers,
} from '@features/sales/pages';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
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
          <Route path="customer/bookings" element={<BookingHistory />} />
          <Route path="customer/bookings/:id" element={<BookingDetail />} />
          <Route path="customer/bookings/:id/cancel" element={<CancelBooking />} />
          <Route path="customer/wishlist" element={<Wishlist />} />
          <Route path="customer/profile" element={<Profile />} />
        </Route>

        <Route element={<AuthLayout />}>
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="reset-password" element={<ResetPassword />} />
        </Route>

        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="users" replace />} />
          <Route path="users" element={<AdminUsers />} />
        </Route>

        <Route path="/manager" element={<ManagerLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<ManagerDashboard />} />
          <Route path="tour-programs" element={<ManagerTourPrograms />} />
          <Route path="tour-programs/:id" element={<ManagerTourProgramDetail />} />
          <Route path="tour-programs/:id/approval" element={<AdminTourProgramApproval />} />
          <Route path="tours" element={<ActiveTours />} />
          <Route path="tours/:id/estimate" element={<ManagerTourEstimate />} />
          <Route path="tours/:id/estimate-approval" element={<ManagerTourEstimateApproval />} />
          <Route path="voucher-approval" element={<ManagerVoucherApproval />} />
          <Route path="cancel-policies" element={<ManagerCancelPolicy />} />
          <Route path="vouchers" element={<ManagerVouchers />} />
          <Route path="special-days" element={<SpecialDays />} />
        </Route>

        <Route path="/coordinator" element={<CoordinatorLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<CoordinatorDashboard />} />
          <Route path="tour-programs" element={<CoordinatorTourPrograms />} />
          <Route path="tour-programs/create" element={<CoordinatorTourProgramWizard />} />
          <Route path="tour-programs/:id" element={<CoordinatorTourProgramDetail />} />
          <Route path="tour-programs/:id/receive" element={<TourReceiveDispatch />} />
          <Route path="tour-rules" element={<TourGenerationRules />} />
          <Route path="tours" element={<CoordinatorTourOperations />} />
          <Route path="tours/:id/estimate" element={<CoordinatorTourEstimate />} />
          <Route path="tours/:id/settle" element={<CoordinatorTourSettlement />} />
          <Route path="services" element={<ServiceList />} />
          <Route path="suppliers" element={<Suppliers />} />
          <Route path="vouchers" element={<CoordinatorVouchers />} />
        </Route>

        <Route path="/sales" element={<SalesLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<SalesDashboard />} />
          <Route path="bookings" element={<SalesBookings />} />
          <Route path="bookings/:id" element={<SalesBookingDetail />} />
          <Route path="vouchers" element={<SalesVouchers />} />
          <Route path="vouchers/:id" element={<SalesVouchers />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
