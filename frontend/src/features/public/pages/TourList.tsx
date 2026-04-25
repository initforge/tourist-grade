import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDataStore } from '@shared/store/useAppDataStore';

export default function TourList() {
  const navigate = useNavigate();
  const tours = useAppDataStore((state) => state.publicTours);
  const publicLoading = useAppDataStore((state) => state.publicLoading);

  return (
    <div className="public-page">
      <main className="public-container relative pt-8 md:pt-10 pb-16 md:pb-20">
        <div aria-hidden="true" className="absolute pointer-events-none gold-thread h-7 md:h-8 left-4 sm:left-6 lg:left-8 top-0" />

        <nav className="flex items-center gap-2 mb-6 text-xs uppercase tracking-[0.2em] text-outline">
          <button onClick={() => navigate('/')} className="hover:text-secondary transition-colors cursor-pointer">Trang chủ</button>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-secondary font-medium">Tour nội địa</span>
        </nav>

        <header className="mb-6 md:mb-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)] lg:items-end">
          <div>
            <h1 className="font-headline text-[2.4rem] md:text-[3.2rem] leading-none tracking-[-0.04em] text-primary max-w-3xl">
              Tour Nội Địa Nổi Bật
            </h1>
            <div className="mt-4 flex items-center gap-4">
              <div className="h-[1px] w-12 bg-secondary" />
              <p className="text-outline uppercase tracking-widest text-xs">
                Danh sách tour lấy trực tiếp từ backend public.
              </p>
            </div>
          </div>
          <div className="public-floating-card p-5 md:p-6">
            <p className="text-[10px] uppercase tracking-[0.22em] text-secondary font-semibold mb-2">Kết quả tìm kiếm</p>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="font-headline text-3xl text-primary leading-none">{tours.length}</p>
                <p className="text-sm text-primary/60 mt-2">Hành trình đang mở bán</p>
              </div>
              <span className="text-xs uppercase tracking-[0.18em] text-primary/40 whitespace-nowrap">Cập nhật hôm nay</span>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-7">
          {publicLoading && tours.length === 0 ? (
            <div className="col-span-full text-center py-20 text-primary/50">Đang tải dữ liệu tour...</div>
          ) : (
            tours.map((tour) => (
              <article key={tour.id} className="group public-floating-card overflow-hidden flex flex-col">
                <div className="aspect-[16/11] overflow-hidden bg-surface-container-low relative">
                  <img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" data-alt={tour.title} src={tour.image} />
                  {tour.originalPrice && (
                    <span className="absolute top-4 left-4 px-3 py-1 text-[10px] tracking-[0.2em] font-medium uppercase bg-secondary text-on-secondary">
                      Khuyến mãi
                    </span>
                  )}
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-center gap-2 text-[10px] tracking-widest text-outline uppercase mb-3">
                    <span className="material-symbols-outlined text-sm">schedule</span>
                    {tour.duration.days} Ngày {tour.duration.nights} Đêm
                  </div>
                  <h2 className="font-headline text-xl leading-snug text-primary group-hover:text-secondary transition-colors duration-300">
                    {tour.title}
                  </h2>
                  <div className="pt-4 mt-auto border-t border-outline-variant/30 flex items-end justify-between gap-4">
                    <div className="flex flex-col">
                      <span className={`text-xs text-outline mb-1 ${tour.originalPrice ? 'line-through' : 'opacity-0'}`}>
                        {tour.originalPrice ? `${tour.originalPrice.toLocaleString('vi-VN')}đ` : '—'}
                      </span>
                      <span className={`text-lg font-semibold ${tour.originalPrice ? 'text-tertiary' : 'text-primary'}`}>
                        {tour.price.adult.toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                    <button
                      onClick={() => navigate(`/tours/${tour.slug}`)}
                      className="bg-primary text-white px-5 py-3 text-[10px] tracking-[0.2em] font-medium hover:bg-secondary transition-all uppercase shrink-0"
                    >
                      Đặt ngay
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
