import { useParams, useNavigate } from 'react-router-dom';
import { mockBookings } from '../../data/bookings';
import { CancelBookingModal } from '../../components/CancelBookingModal';

// Redirects to modal — booking ID from URL param
export default function CancelBooking() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const booking = mockBookings.find(b => b.id === id);

  if (!booking) {
    return (
      <div className="w-full bg-[var(--color-background)] min-h-screen flex items-center justify-center pt-20">
        <div className="text-center space-y-4">
          <span className="material-symbols-outlined text-5xl text-[#D0C5AF]">search_off</span>
          <p className="text-lg text-[#2A2421]/60">Không tìm thấy đơn booking</p>
          <button onClick={() => navigate('/customer/bookings')} className="text-[#D4AF37] hover:underline">
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  return <CancelBookingModal booking={booking} onClose={() => navigate(-1)} />;
}
