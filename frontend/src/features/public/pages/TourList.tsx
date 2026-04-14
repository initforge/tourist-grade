import React from 'react';
import { useNavigate } from 'react-router-dom';

const tourCards = [
  {
    title: 'Hạ Long: Du thuyền di sản Heritage',
    duration: '3 Ngày 2 Đêm',
    originalPrice: '12.500.000đ',
    price: '8.900.000đ',
    badge: 'Flash Sale',
    image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=1200',
  },
  {
    title: 'Sapa: Nghỉ dưỡng trên núi và săn máy',
    duration: '4 Ngày 3 Đêm',
    originalPrice: '',
    price: '15.200.000đ',
    badge: 'Mới',
    image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=1200',
  },
  {
    title: 'Ninh Bình: Tràng An và nghỉ dưỡng cuối tuần',
    duration: '2 Ngày 1 Đêm',
    originalPrice: '6.800.000đ',
    price: '4.500.000đ',
    badge: '',
    image: 'https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=1200',
  },
  {
    title: 'Phú Quốc: Biển xanh và resort ven biển',
    duration: '4 Ngày 3 Đêm',
    originalPrice: '22.000.000đ',
    price: '18.500.000đ',
    badge: 'Flash Sale',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200',
  },
  {
    title: 'Côn Đảo: Hành trình biển đảo và tìm linh',
    duration: '3 Ngày 2 Đêm',
    originalPrice: '',
    price: '28.900.000đ',
    badge: '',
    image: 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?q=80&w=1200',
  },
  {
    title: 'Hội An: Di sản phố cổ và ẩm thực địa phương',
    duration: '3 Ngày 2 Đêm',
    originalPrice: '8.200.000đ',
    price: '5.990.000đ',
    badge: 'Mới',
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1200',
  },
];

export default function TourList() {
  const navigate = useNavigate();

  return (
    <div className="public-page">
      <main className="public-container public-hero relative pb-16 md:pb-20">
        <div aria-hidden="true" className="absolute pointer-events-none gold-thread h-16 md:h-20 left-4 sm:left-6 lg:left-8 top-0" />

        <nav className="flex items-center gap-2 mb-6 text-xs uppercase tracking-[0.2em] text-outline">
          <button onClick={() => navigate('/')} className="hover:text-secondary transition-colors cursor-pointer">Trang chủ</button>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-secondary font-medium">Tour nội địa</span>
        </nav>

        <header className="mb-8 md:mb-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)] lg:items-end">
          <div>
            <h1 className="font-headline text-[2.4rem] md:text-[3.2rem] leading-none tracking-[-0.04em] text-primary max-w-3xl">
              Tour Nội Địa Nổi Bật
            </h1>
            <div className="mt-4 flex items-center gap-4">
              <div className="h-[1px] w-12 bg-secondary" />
              <p className="text-outline uppercase tracking-widest text-xs">
                Bố cục gọn hơn, hình vừa khung hơn, dễ chụp báo cáo hơn
              </p>
            </div>
          </div>
          <div className="public-floating-card p-5 md:p-6">
            <p className="text-[10px] uppercase tracking-[0.22em] text-secondary font-semibold mb-2">Kết quả tìm kiếm</p>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="font-headline text-3xl text-primary leading-none">{tourCards?.length}</p>
                <p className="text-sm text-primary/60 mt-2">Hành trình trong nước đang mở bán</p>
              </div>
              <span className="text-xs uppercase tracking-[0.18em] text-primary/40 whitespace-nowrap">Cập nhật hôm nay</span>
            </div>
          </div>
        </header>

        <div className="flex flex-col lg:flex-row gap-6 xl:gap-8 items-start">
          <aside className="w-full lg:w-72 flex-shrink-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 lg:sticky lg:top-24">
              <section className="public-floating-card p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-headline text-lg">Điểm đến</h3>
                  <span className="material-symbols-outlined text-outline">expand_more</span>
                </div>
                <div className="space-y-3">
                  {['Sapa', 'Ha Long', 'Phu Quoc', 'Ninh Binh', 'Con Dao']?.map(place => (
                    <label key={place} className="flex items-center gap-3 group cursor-pointer">
                      <input
                        className="w-4 h-4 border-outline-variant text-secondary focus:ring-secondary rounded-none bg-transparent"
                        type="checkbox"
                        defaultChecked={place === 'Ha Long'}
                      />
                      <span className="text-sm tracking-wide text-primary group-hover:text-secondary transition-colors">{place}</span>
                    </label>
                  ))}
                </div>
              </section>

              <section className="public-floating-card p-5 space-y-4">
                <h3 className="font-headline text-lg">Khoảng giá</h3>
                <div className="relative h-1 bg-surface-container-highest w-full mt-7">
                  <div className="absolute h-1 bg-secondary w-2/3 left-0" />
                  <div className="absolute -top-1.5 left-0 w-4 h-4 bg-primary border-2 border-background" />
                  <div className="absolute -top-1.5 left-2/3 w-4 h-4 bg-primary border-2 border-background" />
                </div>
                <div className="flex justify-between text-[10px] tracking-widest text-outline uppercase">
                  <span>5tr VNĐ</span>
                  <span>50tr VNĐ</span>
                </div>
              </section>

              <section className="public-floating-card p-5 space-y-4">
                <h3 className="font-headline text-lg">Thời gian</h3>
                <div className="space-y-3">
                  {['2 Ngày 1 Đêm', '3 Ngày 2 Đêm', '4 Ngày 3 Đêm']?.map(duration => (
                    <label key={duration} className="flex items-center gap-3 group cursor-pointer">
                      <input
                        className="w-4 h-4 border-outline-variant text-primary focus:ring-primary bg-transparent"
                        name="duration"
                        type="radio"
                        defaultChecked={duration === '3 Ngày 2 Đêm'}
                      />
                      <span className="text-sm tracking-wide">{duration}</span>
                    </label>
                  ))}
                </div>
                <button className="w-full border border-outline-variant py-3 text-xs tracking-[0.2em] hover:bg-primary hover:text-white transition-all duration-500 uppercase">
                  Xóa bộ lọc
                </button>
              </section>
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-7">
              {tourCards?.map(card => (
                <article key={card?.title} className="group public-floating-card overflow-hidden flex flex-col">
                  <div className="aspect-[16/11] overflow-hidden bg-surface-container-low relative">
                    <img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" data-alt={card?.title} src={card?.image} />
                    {card?.badge && (
                      <span className={`absolute top-4 left-4 px-3 py-1 text-[10px] tracking-[0.2em] font-medium uppercase ${
                        card.badge === 'Flash Sale' ? 'bg-secondary text-on-secondary' : 'bg-tertiary text-on-tertiary'
                      }`}>
                        {card?.badge}
                      </span>
                    )}
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-center gap-2 text-[10px] tracking-widest text-outline uppercase mb-3">
                      <span className="material-symbols-outlined text-sm">schedule</span>
                      {card?.duration}
                    </div>
                    <h2 className="font-headline text-xl leading-snug text-primary group-hover:text-secondary transition-colors duration-300">
                      {card?.title}
                    </h2>
                    <div className="pt-4 mt-auto border-t border-outline-variant/30 flex items-end justify-between gap-4">
                      <div className="flex flex-col">
                        <span className={`text-xs text-outline mb-1 ${card?.originalPrice ? 'line-through' : 'opacity-0'}`}>
                          {card?.originalPrice || '?.'}
                        </span>
                        <span className={`text-lg font-semibold ${card?.originalPrice ? 'text-tertiary' : 'text-primary'}`}>
                          {card?.price}
                        </span>
                      </div>
                      <button className="bg-primary text-white px-5 py-3 text-[10px] tracking-[0.2em] font-medium hover:bg-secondary transition-all uppercase shrink-0">
                        Đặt ngay
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-12 md:mt-14 flex flex-wrap items-center justify-center gap-3 md:gap-4">
              <button className="w-11 h-11 flex items-center justify-center border border-outline-variant hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-all group">
                <span className="material-symbols-outlined inline-flex h-5 w-5 items-center justify-center overflow-hidden text-xl leading-none text-outline group-hover:text-[var(--color-primary)]">chevron_left</span>
              </button>
              <button className="w-11 h-11 flex items-center justify-center bg-[var(--color-primary)] text-white font-medium">1</button>
              <button className="w-11 h-11 flex items-center justify-center border border-outline-variant hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-all font-medium">2</button>
              <button className="w-11 h-11 flex items-center justify-center border border-outline-variant hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-all font-medium">3</button>
              <span className="text-outline-variant">...</span>
              <button className="w-11 h-11 flex items-center justify-center border border-outline-variant hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-all font-medium">12</button>
              <button className="w-11 h-11 flex items-center justify-center border border-outline-variant hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-all group">
                <span className="material-symbols-outlined inline-flex h-5 w-5 items-center justify-center overflow-hidden text-xl leading-none text-outline group-hover:text-[var(--color-primary)]">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
