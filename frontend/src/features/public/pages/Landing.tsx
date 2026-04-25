import React from 'react';

const promoCards = [
  ['Hội An Tuyệt Tác Di Sản', '3 Ngày 2 Đêm', '5.500.000 VND', '4.500.000 VND', '-25%'],
  ['Phú Quốc Emerald Bay', '4 Ngày 3 Đêm', '8.200.000 VND', '6.900.000 VND', '-15%'],
  ['Cố Đô Ninh Bình Huyền Thoại', '2 Ngày 1 Đêm', '3.900.000 VND', '2.700.000 VND', '-30%'],
  ['Sapa Máy Ngàn Đỉnh Fansipan', '3 Ngày 2 Đêm', '6.500.000 VND', '5.200.000 VND', '-20%'],
];

const regionCards = [
  ['Văn hóa và bản sắc', 'Khám Phá Bản Cót Cót - Lao Chải', '3 Ngày / 2 Đêm', 'Từ 3.200.000đ'],
  ['Chinh phục đỉnh cao', 'Fansipan - Nóc Nhà Đông Dương', '2 Ngày / 1 Đêm', 'Từ 2.800.000đ'],
  ['Ẩm thực đặc sản', 'Chợ phiên Bắc Hà ngày cuối tuần', '1 Ngày', 'Từ 1.200.000đ'],
  ['Nghỉ dưỡng trên núi', 'Topas Ecolodge: Giấc Mơ Máy Ngàn', '3 Ngày / 2 Đêm', 'Từ 9.500.000đ'],
];

export default function Landing() {
  return (
    <div className="public-page">
      <section className="public-hero-banner flex items-center">
        <img
          className="absolute inset-0 w-full h-full object-cover"
          data-alt="Cinematic wide shot of Halong Bay limestone karsts at sunrise with mystical fog and a traditional wooden junk boat sailing on calm emerald water"
          src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=1400"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/25 via-primary/15 to-surface/95" />

        <div className="public-container relative z-10 public-hero">
          <div className="public-copy-width">
            <span className="inline-flex items-center gap-2 text-white/85 text-[0.72rem] uppercase tracking-[0.25em] mb-5">
              <span className="w-10 h-px bg-white/70" />
              Tour nội địa cao cấp
            </span>
            <h1 className="font-headline text-4xl md:text-5xl lg:text-6xl text-white tracking-tighter drop-shadow-sm">
              Khám Phá Di Sản Việt Nam
            </h1>
            <p className="mt-5 text-sm md:text-base text-white/85 leading-relaxed max-w-2xl">
              Tổng hợp các hành trình trong nước được sắp xếp gọn gàng, dễ theo dõi và hiển thị tốt hơn trên cả desktop lẫn mobile?.
            </p>
          </div>

          <div className="public-floating-card mt-8 md:mt-10 p-3 md:p-4 max-w-5xl">
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto] gap-3">
              <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-outline-variant/30">
                <div className="flex flex-col items-start px-4 py-3">
                  <label className="text-[0.65rem] uppercase tracking-widest text-secondary font-semibold mb-1">Điểm đến</label>
                  <input
                    className="w-full bg-transparent border-none p-0 text-primary focus:ring-0 placeholder:text-primary/40 text-sm"
                    placeholder="Hạ Long, Đà Lạt, Phú Quốc..."
                    type="text"
                  />
                </div>
                <div className="flex flex-col items-start px-4 py-3">
                  <label className="text-[0.65rem] uppercase tracking-widest text-secondary font-semibold mb-1">Thời gian</label>
                  <input
                    className="w-full bg-transparent border-none p-0 text-primary focus:ring-0 placeholder:text-primary/40 text-sm"
                    placeholder="Chọn ngày khởi hành"
                    type="text"
                  />
                </div>
                <div className="flex flex-col items-start px-4 py-3">
                  <label className="text-[0.65rem] uppercase tracking-widest text-secondary font-semibold mb-1">Ngàn sách</label>
                  <select className="w-full bg-transparent border-none p-0 text-primary focus:ring-0 text-sm">
                    <option>Tất cả mức giá</option>
                    <option>Dưới 5.000.000 VND</option>
                    <option>Từ 5tr - 10tr VND</option>
                    <option>Trên 10.000.000 VND</option>
                  </select>
                </div>
              </div>
              <button className="w-full lg:w-auto bg-primary text-white px-7 py-4 font-serif text-sm uppercase tracking-widest hover:bg-secondary transition-colors duration-500">
                Tìm Kiếm Tour
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="public-section">
        <div className="public-container">
          <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-8 md:mb-10">
            <div>
              <span className="text-secondary font-serif italic text-lg block mb-2">Ưu đãi hiện tại</span>
              <h2 className="font-headline text-3xl md:text-4xl tracking-tighter text-primary uppercase">Flash Sale Cuối Tuần</h2>
            </div>
            <div className="flex items-center gap-4 text-sm font-label tracking-widest text-primary/60 border-b border-outline-variant pb-2">
              Kết thúc sau <span className="text-primary font-bold">12 : 45 : 09</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            {promoCards?.map(([title, duration, originalPrice, salePrice, badge], index) => (
              <div key={title} className="group cursor-pointer public-floating-card overflow-hidden">
                <div className="relative aspect-[16/11] overflow-hidden bg-surface-container-low">
                  <img
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    data-alt={title}
                    src={`https://images.unsplash.com/photo-${index % 2 === 0 ? '1582719508461-905c673771fd' : '1490645935967-10de6ba17061'}?q=80&w=1200`}
                  />
                  <div className="absolute top-4 left-4 bg-tertiary text-white text-[0.65rem] px-3 py-1 uppercase tracking-widest">
                    {badge}
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-headline text-lg md:text-xl mb-2 group-hover:text-secondary transition-colors">{title}</h3>
                  <div className="text-[0.7rem] uppercase tracking-widest text-primary/50 mb-3 flex items-center">
                    <span className="material-symbols-outlined text-sm mr-1">schedule</span>
                    {duration}
                  </div>
                  <div className="flex flex-col gap-1 mb-4">
                    <span className="text-sm line-through text-primary/40 font-light">{originalPrice}</span>
                    <span className="text-xl font-bold text-secondary tracking-tighter">{salePrice}</span>
                  </div>
                  <button className="w-full py-3 border border-primary text-primary text-[0.75rem] uppercase tracking-widest hover:bg-primary hover:text-white transition-all">
                    Đặt ngay
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="public-section bg-surface-container-low">
        <div className="public-container">
          <div className="mb-10">
            <h2 className="font-headline text-3xl md:text-4xl tracking-tighter text-primary mb-6">HÀNH TRÌNH TRONG NƯỚC</h2>
            <div className="flex flex-wrap gap-6 md:gap-8 border-b border-outline-variant/40">
              <button className="pb-4 text-[0.75rem] uppercase tracking-[0.2em] font-bold text-secondary border-b-2 border-secondary">Miền Bắc</button>
              <button className="pb-4 text-[0.75rem] uppercase tracking-[0.2em] font-medium text-primary/40 hover:text-primary transition-colors">Miền Trung</button>
              <button className="pb-4 text-[0.75rem] uppercase tracking-[0.2em] font-medium text-primary/40 hover:text-primary transition-colors">Miền Nam</button>
              <button className="pb-4 text-[0.75rem] uppercase tracking-[0.2em] font-medium text-primary/40 hover:text-primary transition-colors">Nghỉ dưỡng</button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            {regionCards?.map(([tag, title, duration, price], index) => (
              <div key={title} className="bg-surface p-4 border border-outline-variant/20 hover:border-secondary/50 transition-colors">
                <div className="aspect-[16/11] mb-4 overflow-hidden public-media-frame">
                  <img
                    className="w-full h-full object-cover"
                    data-alt={title}
                    src={`https://images.unsplash.com/photo-${index === 1 ? '1555396273-367ea4eb4db5' : '1490645935967-10de6ba17061'}?q=80&w=1200`}
                  />
                </div>
                <div className="text-[0.65rem] uppercase tracking-widest text-tertiary mb-2 font-bold">{tag}</div>
                <h4 className="font-headline text-lg mb-3 leading-tight">{title}</h4>
                <div className="flex justify-between items-center text-xs text-primary/60 gap-4">
                  <span>{duration}</span>
                  <span className="font-bold text-primary italic">{price}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="public-section">
        <div className="public-container">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-10 md:gap-12 items-center">
            <div className="relative">
              <div className="absolute -top-6 -left-4 md:-left-8 w-24 md:w-32 h-24 md:h-32 bg-secondary/10 -z-10" />
              <h2 className="font-headline text-4xl md:text-5xl tracking-tighter text-primary leading-tight mb-6">
                Bộ Sưu Tập
                <br />
                Hành Trình Nội Địa
              </h2>
              <p className="text-base leading-relaxed text-primary/70 mb-8 max-w-md">
                Giao diện được tinh gọn lại để ảnh tour không tràn màn hình, mật độ nội dung còn đối hơn và vẫn giữ nguyên bố cục public hiện tại?.
              </p>
              <button className="bg-primary text-white px-8 py-4 font-serif text-sm uppercase tracking-widest hover:bg-secondary transition-all">
                Xem tour nội địa
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 md:gap-6">
              <div className="space-y-4 md:space-y-6 md:pt-8">
                <div className="group relative aspect-[4/5] overflow-hidden public-media-frame">
                  <img className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" data-alt="Ha Long" src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=1200" />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-5 text-white">
                    <div className="text-[0.6rem] uppercase tracking-widest mb-1">Miền Bắc</div>
                    <div className="text-xl font-headline">Hạ Long</div>
                  </div>
                </div>
                <div className="group relative aspect-[4/5] overflow-hidden public-media-frame">
                  <img className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" data-alt="Da Lat" src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200" />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-5 text-white">
                    <div className="text-[0.6rem] uppercase tracking-widest mb-1">Cao nguyên</div>
                    <div className="text-xl font-headline">Đà Lạt</div>
                  </div>
                </div>
              </div>
              <div className="space-y-4 md:space-y-6">
                <div className="group relative aspect-[4/5] overflow-hidden public-media-frame">
                  <img className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" data-alt="Phu Quoc" src="https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=1200" />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-5 text-white">
                    <div className="text-[0.6rem] uppercase tracking-widest mb-1">Biển đảo</div>
                    <div className="text-xl font-headline">Phú Quốc</div>
                  </div>
                </div>
                <div className="group relative aspect-[4/5] overflow-hidden public-media-frame">
                  <img className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" data-alt="Ninh Binh" src="https://images.unsplash.com/photo-1472396961693-142e6e269027?q=80&w=1200" />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-5 text-white">
                    <div className="text-[0.6rem] uppercase tracking-widest mb-1">Di sản</div>
                    <div className="text-xl font-headline">Ninh Bình</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="public-section bg-surface">
        <div className="public-container border-t border-b border-outline-variant/30 py-14 md:py-16">
          <div className="text-center mb-12">
            <span className="text-secondary font-serif italic text-xl mb-4 block">Gọn gàng và dễ nhìn hơn</span>
            <h2 className="font-headline text-3xl md:text-4xl tracking-tighter text-primary uppercase">Giá Trị Hiển Thị Của Travela</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
            <div className="text-center group gold-thread">
              <div className="w-16 h-16 mx-auto mb-6 border border-outline-variant flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-white transition-all duration-500">
                <span className="material-symbols-outlined text-3xl">concierge</span>
              </div>
              <h4 className="font-headline text-xl mb-3">Bố cục dễ theo dõi</h4>
              <p className="text-sm leading-relaxed text-primary/60 px-4">
                Tăng mật độ nội dung vừa đủ, giảm khoảng trống thừa để giao diện khi chụp báo cáo nhân chắc hơn?.
              </p>
            </div>
            <div className="text-center group gold-thread">
              <div className="w-16 h-16 mx-auto mb-6 border border-outline-variant flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-white transition-all duration-500">
                <span className="material-symbols-outlined text-3xl">photo_size_select_large</span>
              </div>
              <h4 className="font-headline text-xl mb-3">Ảnh vừa khung</h4>
              <p className="text-sm leading-relaxed text-primary/60 px-4">
                Giảm chiều cao các khối ảnh lớn để vẫn đẹp mắt nhưng không còn cảm giác một ảnh chiếm hết màn hình?.
              </p>
            </div>
            <div className="text-center group">
              <div className="w-16 h-16 mx-auto mb-6 border border-outline-variant flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-white transition-all duration-500">
                <span className="material-symbols-outlined text-3xl">travel_explore</span>
              </div>
              <h4 className="font-headline text-xl mb-3">Đúng bối cảnh nội địa</h4>
              <p className="text-sm leading-relaxed text-primary/60 px-4">
                Toàn bộ copy chính trên landing đều theo đúng bối cảnh tour trong nước, trình lệch nội dung với sản phẩm thực tế?.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
