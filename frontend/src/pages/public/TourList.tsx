import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function TourList() {
  const navigate = useNavigate();
  return (
    <div className="w-full bg-[var(--color-background)]">
      


<main className="max-w-[1440px] mx-auto px-10 pt-12 pb-24 relative">

<div className="gold-thread h-32 left-10 top-0"></div>

<nav className="flex items-center gap-2 mb-12 text-xs uppercase tracking-[0.2em] text-outline">
<button onClick={() => navigate('/')} className="hover:text-secondary transition-colors cursor-pointer">Trang chủ</button>
<span className="material-symbols-outlined text-[14px]">chevron_right</span>
<span className="text-secondary font-medium">Tìm Kiếm Tuyệt Phẩm</span>
</nav>

<header className="mb-20">
<h1 className="font-headline text-[3.5rem] leading-none tracking-[-0.04em] text-primary max-w-2xl">Hành Trình Tuyệt Tác</h1>
<div className="mt-6 flex items-center gap-4">
<div className="h-[1px] w-12 bg-secondary"></div>
<p className="text-outline uppercase tracking-widest text-xs">Kết quả tìm kiếm: 124 tours cao cấp</p>
</div>
</header>
<div className="flex flex-col lg:flex-row gap-16">

<aside className="w-full lg:w-72 flex-shrink-0">
<div className="sticky top-32 space-y-12">

<section>
<h3 className="font-headline text-lg mb-6 flex items-center justify-between">
                            Điểm Đến
                            <span className="material-symbols-outlined text-outline">expand_more</span>
</h3>
<div className="space-y-4">
<label className="flex items-center gap-3 group cursor-pointer">
<input className="w-4 h-4 border-outline-variant text-secondary focus:ring-secondary rounded-none bg-transparent" type="checkbox"/>
<span className="text-sm tracking-wide text-primary group-hover:text-secondary transition-colors">Sapa</span>
</label>
<label className="flex items-center gap-3 group cursor-pointer">
<input checked className="w-4 h-4 border-outline-variant text-secondary focus:ring-secondary rounded-none bg-transparent" type="checkbox"/>
<span className="text-sm tracking-wide text-primary group-hover:text-secondary transition-colors">Hạ Long</span>
</label>
<label className="flex items-center gap-3 group cursor-pointer">
<input className="w-4 h-4 border-outline-variant text-secondary focus:ring-secondary rounded-none bg-transparent" type="checkbox"/>
<span className="text-sm tracking-wide text-primary group-hover:text-secondary transition-colors">Phú Quốc</span>
</label>
<label className="flex items-center gap-3 group cursor-pointer">
<input className="w-4 h-4 border-outline-variant text-secondary focus:ring-secondary rounded-none bg-transparent" type="checkbox"/>
<span className="text-sm tracking-wide text-primary group-hover:text-secondary transition-colors">Ninh Bình</span>
</label>
<label className="flex items-center gap-3 group cursor-pointer">
<input className="w-4 h-4 border-outline-variant text-secondary focus:ring-secondary rounded-none bg-transparent" type="checkbox"/>
<span className="text-sm tracking-wide text-primary group-hover:text-secondary transition-colors">Côn Đảo</span>
</label>
</div>
</section>

<section>
<h3 className="font-headline text-lg mb-6">Khoảng Giá</h3>
<div className="relative h-1 bg-surface-container-highest w-full mt-8">
<div className="absolute h-1 bg-secondary w-2/3 left-0"></div>
<div className="absolute -top-1.5 left-0 w-4 h-4 bg-primary border-2 border-background"></div>
<div className="absolute -top-1.5 left-2/3 w-4 h-4 bg-primary border-2 border-background"></div>
</div>
<div className="flex justify-between mt-4 text-[10px] tracking-widest text-outline uppercase">
<span>5tr VNĐ</span>
<span>50tr VNĐ</span>
</div>
</section>

<section>
<h3 className="font-headline text-lg mb-6">Thời Gian</h3>
<div className="space-y-4">
<label className="flex items-center gap-3 group cursor-pointer">
<input className="w-4 h-4 border-outline-variant text-primary focus:ring-primary bg-transparent" name="duration" type="radio"/>
<span className="text-sm tracking-wide">2 Ngày 1 Đêm</span>
</label>
<label className="flex items-center gap-3 group cursor-pointer">
<input checked className="w-4 h-4 border-outline-variant text-primary focus:ring-primary bg-transparent" name="duration" type="radio"/>
<span className="text-sm tracking-wide">3 Ngày 2 Đêm</span>
</label>
<label className="flex items-center gap-3 group cursor-pointer">
<input className="w-4 h-4 border-outline-variant text-primary focus:ring-primary bg-transparent" name="duration" type="radio"/>
<span className="text-sm tracking-wide">4 Ngày 3 Đêm</span>
</label>
</div>
</section>
<button className="w-full border border-outline-variant py-4 text-xs tracking-[0.2em] hover:bg-primary hover:text-white transition-all duration-500 uppercase">
                        Xóa Bộ Lọc
                    </button>
</div>
</aside>

<div className="flex-1">
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-16">

<article className="group relative">
<div className="aspect-[4/5] overflow-hidden bg-surface-container-low relative mb-6">
<img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" data-alt="luxury cruise boat sailing through turquoise waters of Ha Long Bay limestone karsts at sunrise" src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=1200"/>
<span className="absolute top-4 left-4 bg-secondary text-on-secondary px-3 py-1 text-[10px] tracking-[0.2em] font-medium uppercase">Flash Sale</span>
</div>
<div className="space-y-3">
<div className="flex items-center gap-2 text-[10px] tracking-widest text-outline uppercase">
<span className="material-symbols-outlined text-sm">schedule</span> 3 Ngày 2 Đêm
                            </div>
<h2 className="font-headline text-xl leading-snug text-primary group-hover:text-secondary transition-colors duration-300">Hạ Long: Du Thuyền Di Sản Heritage Bình Chuẩn</h2>
<div className="pt-2 border-t border-outline-variant/30 flex items-end justify-between">
<div className="flex flex-col">
<span className="text-xs text-outline line-through mb-1">12.500.000đ</span>
<span className="text-lg font-semibold text-tertiary">8.900.000đ</span>
</div>
<button className="bg-primary text-white px-6 py-3 text-[10px] tracking-[0.2em] font-medium hover:bg-secondary transition-all uppercase">Đặt Ngay</button>
</div>
</div>
</article>

<article className="group relative">
<div className="aspect-[4/5] overflow-hidden bg-surface-container-low relative mb-6">
<img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" data-alt="luxury mountain resort balcony overlooking misty green rice terraces of Sapa mountains at dawn" src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=1200"/>
<span className="absolute top-4 left-4 bg-tertiary text-on-tertiary px-3 py-1 text-[10px] tracking-[0.2em] font-medium uppercase">Mới</span>
</div>
<div className="space-y-3">
<div className="flex items-center gap-2 text-[10px] tracking-widest text-outline uppercase">
<span className="material-symbols-outlined text-sm">schedule</span> 4 Ngày 3 Đêm
                            </div>
<h2 className="font-headline text-xl leading-snug text-primary group-hover:text-secondary transition-colors duration-300">Sapa: Trải Nghiệm Thượng Lưu Tại Hotel de la Coupole</h2>
<div className="pt-2 border-t border-outline-variant/30 flex items-end justify-between">
<div className="flex flex-col">
<span className="text-xs text-outline opacity-0 mb-1">.</span>
<span className="text-lg font-semibold text-primary">15.200.000đ</span>
</div>
<button className="bg-primary text-white px-6 py-3 text-[10px] tracking-[0.2em] font-medium hover:bg-secondary transition-all uppercase">Đặt Ngay</button>
</div>
</div>
</article>

<article className="group relative">
<div className="aspect-[4/5] overflow-hidden bg-surface-container-low relative mb-6">
<img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" data-alt="scenic boat ride on narrow river surrounded by dramatic karst limestone cliffs in Ninh Binh" src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=1200"/>
</div>
<div className="space-y-3">
<div className="flex items-center gap-2 text-[10px] tracking-widest text-outline uppercase">
<span className="material-symbols-outlined text-sm">schedule</span> 2 Ngày 1 Đêm
                            </div>
<h2 className="font-headline text-xl leading-snug text-primary group-hover:text-secondary transition-colors duration-300">Ninh Bình: Tuyệt Tác Tràng An &amp; Emeralda Resort</h2>
<div className="pt-2 border-t border-outline-variant/30 flex items-end justify-between">
<div className="flex flex-col">
<span className="text-xs text-outline line-through mb-1">6.800.000đ</span>
<span className="text-lg font-semibold text-tertiary">4.500.000đ</span>
</div>
<button className="bg-primary text-white px-6 py-3 text-[10px] tracking-[0.2em] font-medium hover:bg-secondary transition-all uppercase">Đặt Ngay</button>
</div>
</div>
</article>

<article className="group relative">
<div className="aspect-[4/5] overflow-hidden bg-surface-container-low relative mb-6">
<img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" data-alt="crystal clear turquoise ocean water hitting white sandy beach with palm trees in Phu Quoc island" src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=1200"/>
<span className="absolute top-4 left-4 bg-secondary text-on-secondary px-3 py-1 text-[10px] tracking-[0.2em] font-medium uppercase">Flash Sale</span>
</div>
<div className="space-y-3">
<div className="flex items-center gap-2 text-[10px] tracking-widest text-outline uppercase">
<span className="material-symbols-outlined text-sm">schedule</span> 4 Ngày 3 Đêm
                            </div>
<h2 className="font-headline text-xl leading-snug text-primary group-hover:text-secondary transition-colors duration-300">Phú Quốc: Nghỉ Dưỡng Tại JW Marriott Emerald Bay</h2>
<div className="pt-2 border-t border-outline-variant/30 flex items-end justify-between">
<div className="flex flex-col">
<span className="text-xs text-outline line-through mb-1">22.000.000đ</span>
<span className="text-lg font-semibold text-tertiary">18.500.000đ</span>
</div>
<button className="bg-primary text-white px-6 py-3 text-[10px] tracking-[0.2em] font-medium hover:bg-secondary transition-all uppercase">Đặt Ngay</button>
</div>
</div>
</article>

<article className="group relative">
<div className="aspect-[4/5] overflow-hidden bg-surface-container-low relative mb-6">
<img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" data-alt="luxury beachfront villa at Con Dao island with traditional wooden architecture and private pool" src="https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=1200"/>
</div>
<div className="space-y-3">
<div className="flex items-center gap-2 text-[10px] tracking-widest text-outline uppercase">
<span className="material-symbols-outlined text-sm">schedule</span> 3 Ngày 2 Đêm
                            </div>
<h2 className="font-headline text-xl leading-snug text-primary group-hover:text-secondary transition-colors duration-300">Côn Đảo: Hành Trình Tâm Linh &amp; Six Senses Luxe</h2>
<div className="pt-2 border-t border-outline-variant/30 flex items-end justify-between">
<div className="flex flex-col">
<span className="text-xs text-outline opacity-0 mb-1">.</span>
<span className="text-lg font-semibold text-primary">28.900.000đ</span>
</div>
<button className="bg-primary text-white px-6 py-3 text-[10px] tracking-[0.2em] font-medium hover:bg-secondary transition-all uppercase">Đặt Ngay</button>
</div>
</div>
</article>

<article className="group relative">
<div className="aspect-[4/5] overflow-hidden bg-surface-container-low relative mb-6">
<img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" data-alt="vibrant traditional vietnamese silk lanterns illuminating an ancient yellow wall at night in Hoi An" src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1200"/>
<span className="absolute top-4 left-4 bg-tertiary text-on-tertiary px-3 py-1 text-[10px] tracking-[0.2em] font-medium uppercase">Mới</span>
</div>
<div className="space-y-3">
<div className="flex items-center gap-2 text-[10px] tracking-widest text-outline uppercase">
<span className="material-symbols-outlined text-sm">schedule</span> 3 Ngày 2 Đêm
                            </div>
<h2 className="font-headline text-xl leading-snug text-primary group-hover:text-secondary transition-colors duration-300">Hội An: Ký Ức Di Sản &amp; Trải Nghiệm Chèo Kayak</h2>
<div className="pt-2 border-t border-outline-variant/30 flex items-end justify-between">
<div className="flex flex-col">
<span className="text-xs text-outline line-through mb-1">8.200.000đ</span>
<span className="text-lg font-semibold text-tertiary">5.990.000đ</span>
</div>
<button className="bg-primary text-white px-6 py-3 text-[10px] tracking-[0.2em] font-medium hover:bg-secondary transition-all uppercase">Đặt Ngay</button>
</div>
</div>
</article>
</div>

<div className="mt-24 flex items-center justify-center gap-4">
<button className="w-12 h-12 flex items-center justify-center border border-outline-variant hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-all group">
<span className="material-symbols-outlined text-outline group-hover:text-[var(--color-primary)]">chevron_left</span>
</button>

<button className="w-12 h-12 flex items-center justify-center bg-[var(--color-primary)] text-white font-medium">1</button>
<button className="w-12 h-12 flex items-center justify-center border border-outline-variant hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-all font-medium">2</button>
<button className="w-12 h-12 flex items-center justify-center border border-outline-variant hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-all font-medium">3</button>
<span className="text-outline-variant">...</span>
<button className="w-12 h-12 flex items-center justify-center border border-outline-variant hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-all font-medium">12</button>
<button className="w-12 h-12 flex items-center justify-center border border-outline-variant hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-all group">
<span className="material-symbols-outlined text-outline group-hover:text-[var(--color-primary)]">chevron_right</span>
</button>
</div>
</div>
</div>
</main>



    </div>
  );
}
