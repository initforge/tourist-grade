import { useState } from 'react';
import type { BookingReview } from '@entities/booking/data/bookings';
import { createTourReview } from '@shared/lib/api/reviews';
import { useAuthStore } from '@shared/store/useAuthStore';
import { useAppDataStore } from '@shared/store/useAppDataStore';

interface TourReviewModalProps {
  bookingId: string;
  tourId: string;
  onClose: () => void;
  review?: BookingReview;
}

export function TourReviewModal({ bookingId, tourId, onClose, review }: TourReviewModalProps) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const upsertReview = useAppDataStore((state) => state.upsertReview);
  const appendPublicTourReview = useAppDataStore((state) => state.appendPublicTourReview);
  const isReadOnly = Boolean(review);
  const [rating, setRating] = useState(review?.rating ?? 5);
  const [title, setTitle] = useState(review?.title ?? '');
  const [comment, setComment] = useState(review?.comment ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isReadOnly || comment.trim().length < 10 || submitting) {
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const response = await createTourReview({
        bookingId,
        rating,
        title: title.trim(),
        comment: comment.trim(),
      }, accessToken);

      upsertReview(response.review);
      appendPublicTourReview(tourId, {
        ...response.review,
        authorName: response.review.authorName || user?.name || 'Khách hàng',
      });
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Không thể gửi đánh giá.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button className="absolute inset-0 bg-primary/40 backdrop-blur-sm" onClick={onClose} aria-label="Đóng đánh giá tour" />
      <form onSubmit={submit} className="relative z-10 w-full max-w-lg bg-white shadow-2xl p-8 space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl text-primary">{isReadOnly ? 'Đánh giá của bạn' : 'Đánh giá tour'}</h2>
            <p className="text-sm text-primary/55 mt-1">
              {isReadOnly ? 'Nội dung đánh giá đã gửi được hiển thị để bạn xem lại.' : 'Chia sẻ trải nghiệm của bạn sau chuyến đi.'}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-primary/50 hover:text-primary">
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        <div>
          <p className="text-xs font-medium text-primary/70 mb-2">Mức đánh giá</p>
          <div className="flex gap-2">
            {Array.from({ length: 5 }).map((_, index) => {
              const star = index + 1;
              return (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  disabled={isReadOnly}
                  className={`text-secondary ${isReadOnly ? 'cursor-default' : ''}`}
                >
                  <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: `'FILL' ${star <= rating ? 1 : 0}` }}>
                    star
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <label className="block space-y-2">
          <span className="text-xs font-medium text-primary/70">Tiêu đề</span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            readOnly={isReadOnly}
            className={`w-full border border-outline-variant/50 px-4 py-3 text-sm ${isReadOnly ? 'bg-surface text-primary/75' : ''}`}
            placeholder="Điều bạn ấn tượng nhất"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-xs font-medium text-primary/70">Nội dung đánh giá</span>
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            readOnly={isReadOnly}
            className={`w-full border border-outline-variant/50 px-4 py-3 text-sm min-h-[140px] resize-none ${isReadOnly ? 'bg-surface text-primary/75' : ''}`}
            placeholder="Chia sẻ chi tiết trải nghiệm của bạn"
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 py-3 border border-outline-variant/50 text-primary font-sans uppercase tracking-[0.14em] text-xs hover:bg-surface transition-colors">
            {isReadOnly ? 'Đóng' : 'Để sau'}
          </button>
          {!isReadOnly && (
            <button type="submit" disabled={comment.trim().length < 10 || submitting} className={`flex-1 py-3 font-sans uppercase tracking-[0.14em] text-xs ${comment.trim().length >= 10 && !submitting ? 'bg-primary text-white hover:bg-[var(--color-secondary)]' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
              {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
