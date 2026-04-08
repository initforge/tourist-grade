# Travela — User Guide

> How to use Travela — Premium Tour Booking Platform

---

## 1. What is Travela?

Travela is an online travel agency platform with **5 distinct user roles**, each with a dedicated workspace:

| Role | Who | Access |
|------|-----|--------|
| **Customer** | End-users browsing tours | Browse, book, manage personal bookings |
| **Sales** | Sales staff | View and manage customer bookings |
| **Coordinator** | Tour coordinators | Manage services, suppliers, settlements |
| **Manager** | Operations manager | Tour programs, active tours, estimates |
| **Admin** | System administrator | User management, vouchers, all operations |

---

## 2. Features by Role

### 2.1 Customer (Public)

**Tour Browsing**
1. Open http://localhost:5173 — you land on the **Landing** page
2. Click a tour card or navigate to **Tour List** to browse all tours
3. Click a tour → **Tour Detail** page shows itinerary, highlights, pricing, and booking CTA

**Booking Flow**
1. On Tour Detail, click **"Đặt Ngay"** (Book Now)
2. Fill in passenger information and contact details
3. Review and confirm booking
4. Receive booking confirmation with booking ID

**Managing Bookings**
- Go to **Booking History** to see upcoming, completed, and cancelled trips
- Click **"Xem Chi Tiết"** to view full booking details
- Cancel upcoming bookings or leave reviews for completed ones

---

### 2.2 Sales Dashboard

**Booking Management**
1. Navigate to **Sales → Booking List**
2. View all bookings in a filterable table (by status, refund status)
3. Click a row → **Booking Detail** opens in a slide-over drawer
4. From Booking Detail, you can:
   - Download passenger list as CSV
   - Confirm refund (for cancelled bookings with pending refund status)

---

### 2.3 Coordinator Dashboard

**Service Management**
1. Navigate to **Coordinator → Services**
2. View all services with filters and search
3. Click **"Chi Tiết"** to open service detail drawer

**Supplier Management**
1. Navigate to **Coordinator → Suppliers**
2. Manage supplier information (slide-over drawer)
3. Track supplier contracts and contacts

**Tour Settlement**
1. Navigate to **Coordinator → Settlement**
2. Review and process tour financial settlements

---

### 2.4 Manager Dashboard

**Tour Programs**
1. Navigate to **Manager → Tour Programs**
2. Create new tour programs with step-by-step wizard
3. Manage existing programs (publish, edit, archive)

**Active Tours**
1. Navigate to **Manager → Active Tours**
2. Monitor currently running and upcoming tours

**Tour Estimates**
1. Navigate to **Manager → Tour Estimates**
2. View and approve cost estimates for tour programs

---

### 2.5 Admin Dashboard

**User Management**
1. Navigate to **Admin → Users**
2. View all system users with role-based filtering
3. Click user row to open detail drawer (view profile, activity)

**Voucher Management**
1. Navigate to **Admin → Vouchers**
2. Create, edit, and deactivate voucher codes

**Booking Overview**
1. Navigate to **Admin → Bookings**
2. System-wide view of all bookings across all roles

---

## 3. Role Switching

Since this is a mock application without real authentication:

1. On the **Landing** page, look for the role switcher (top navigation or demo panel)
2. Select any role: **Admin**, **Manager**, **Coordinator**, **Sales**, or **Customer**
3. The navigation updates immediately to show the selected role's dashboard
4. The current role is shown in the sidebar or header

---

## 4. Troubleshooting

| Problem | Solution |
|---------|---------|
| "Không tìm thấy đơn booking" | Booking ID may not exist in mock data. Use IDs from `src/data/bookings.ts` |
| Role guard redirects to home | That role is not selected. Use the role switcher to select the correct role |
| Empty booking list | The mock data has 10 bookings. Filter by status to see results |
| Page not found 404 | Check URL matches route in `src/App.tsx` |

---

## 5. FAQ

**Q: Is this a real booking system?**
A: No — this is a frontend prototype with mock data. No real bookings are processed or stored.

**Q: How do I see the admin panel?**
A: Use the role switcher on the Landing page to select "Admin" role.

**Q: Can I add real tours?**
A: Currently, tours are in `src/data/tours.ts`. When the backend lands, this will be replaced with API calls.
