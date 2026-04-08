import React from 'react';

export default function Landing() {
  return (
    <div className="w-full bg-[var(--color-background)]">
      



<section className="relative h-[921px] w-full flex items-center justify-center overflow-hidden">
<img className="absolute inset-0 w-full h-full object-cover" data-alt="Cinematic wide shot of Halong Bay limestone karsts at sunrise with mystical fog and a traditional wooden junk boat sailing on calm emerald water" src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=1200"/>
<div className="absolute inset-0 bg-gradient-to-b from-primary/20 via-transparent to-surface"></div>
<div className="relative z-10 w-full max-w-6xl px-6 text-center">
<h1 className="font-headline text-5xl md:text-7xl text-white mb-12 tracking-tighter drop-shadow-sm">Khám Phá Di Sản Việt Nam</h1>

<div className="bg-surface/95 backdrop-blur-md p-2 shadow-2xl flex flex-col md:flex-row items-center gap-2 max-w-5xl mx-auto border border-outline-variant/30">
<div className="flex-1 w-full grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-outline-variant/40">
<div className="flex flex-col items-start px-6 py-3">
<label className="text-[0.65rem] uppercase tracking-widest text-secondary font-semibold mb-1">Điểm Đến</label>
<input className="w-full bg-transparent border-none p-0 text-primary focus:ring-0 placeholder:text-primary/40 text-sm" placeholder="Bạn muốn đi đâu?" type="text"/>
</div>
<div className="flex flex-col items-start px-6 py-3">
<label className="text-[0.65rem] uppercase tracking-widest text-secondary font-semibold mb-1">Thời Gian</label>
<input className="w-full bg-transparent border-none p-0 text-primary focus:ring-0 placeholder:text-primary/40 text-sm" placeholder="Chọn ngày khởi hành" type="text"/>
</div>
<div className="flex flex-col items-start px-6 py-3">
<label className="text-[0.65rem] uppercase tracking-widest text-secondary font-semibold mb-1">Ngân Sách</label>
<select className="w-full bg-transparent border-none p-0 text-primary focus:ring-0 text-sm">
<option>Tất cả mức giá</option>
<option>Dưới 10.000.000 VNĐ</option>
<option>Từ 10tr - 30tr VNĐ</option>
<option>Trên 30.000.000 VNĐ</option>
</select>
</div>
</div>
<button className="w-full md:w-auto bg-primary text-white px-10 py-5 font-serif text-sm uppercase tracking-widest hover:bg-secondary transition-colors duration-500">
                    Tìm Kiếm Hành Trình
                </button>
</div>
</div>
</section>

<section className="py-24 px-10 max-w-7xl mx-auto">
<div className="flex justify-between items-end mb-12">
<div>
<span className="text-secondary font-serif italic text-lg block mb-2">Ưu Đãi Giới Hạn</span>
<h2 className="font-headline text-4xl tracking-tighter text-primary uppercase">Flash Sales Cuối Tuần</h2>
</div>
<div className="flex items-center gap-4 text-sm font-label tracking-widest text-primary/60 border-b border-outline-variant pb-2">
                Kết thúc sau <span className="text-primary font-bold">12 : 45 : 09</span>
</div>
</div>
<div className="grid grid-cols-1 md:grid-cols-4 gap-8">

<div className="group cursor-pointer">
<div className="relative aspect-[3/4] mb-6 overflow-hidden bg-surface-container-low">
<img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" data-alt="Luxury boutique hotel suite with traditional Indochine interior design, dark wood furniture and white linen, soft morning light" src="https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=1200"/>
<div className="absolute top-4 left-4 bg-tertiary text-white text-[0.65rem] px-3 py-1 uppercase tracking-widest">-25%</div>
</div>
<h3 className="font-headline text-xl mb-2 group-hover:text-secondary transition-colors">Hội An Tuyệt Tác Di Sản</h3>
<div className="text-[0.7rem] uppercase tracking-widest text-primary/50 mb-4 flex items-center">
<span className="material-symbols-outlined text-sm mr-1">schedule</span> 3 Ngày 2 Đêm
                </div>
<div className="flex flex-col gap-1 mb-6">
<span className="text-sm line-through text-primary/40 font-light">5.500.000 VNĐ</span>
<span className="text-xl font-bold text-secondary tracking-tighter">4.500.000 VNĐ</span>
</div>
<button className="w-full py-3 border border-primary text-primary text-[0.75rem] uppercase tracking-widest hover:bg-primary hover:text-white transition-all">Book Now</button>
</div>

<div className="group cursor-pointer">
<div className="relative aspect-[3/4] mb-6 overflow-hidden bg-surface-container-low">
<img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" data-alt="A private infinity pool overlooking the turquoise waters of Phu Quoc island with palm trees and sunset sky" src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=1200"/>
<div className="absolute top-4 left-4 bg-tertiary text-white text-[0.65rem] px-3 py-1 uppercase tracking-widest">-15%</div>
</div>
<h3 className="font-headline text-xl mb-2 group-hover:text-secondary transition-colors">Phú Quoc Emerald Bay</h3>
<div className="text-[0.7rem] uppercase tracking-widest text-primary/50 mb-4 flex items-center">
<span className="material-symbols-outlined text-sm mr-1">schedule</span> 4 Ngày 3 Đêm
                </div>
<div className="flex flex-col gap-1 mb-6">
<span className="text-sm line-through text-primary/40 font-light">8.200.000 VNĐ</span>
<span className="text-xl font-bold text-secondary tracking-tighter">6.900.000 VNĐ</span>
</div>
<button className="w-full py-3 border border-primary text-primary text-[0.75rem] uppercase tracking-widest hover:bg-primary hover:text-white transition-all">Book Now</button>
</div>

<div className="group cursor-pointer">
<div className="relative aspect-[3/4] mb-6 overflow-hidden bg-surface-container-low">
<img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" data-alt="Traditional sampan boat on the river in Ninh Binh surrounded by towering limestone mountains and lush rice paddies" src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=1200"/>
<div className="absolute top-4 left-4 bg-tertiary text-white text-[0.65rem] px-3 py-1 uppercase tracking-widest">-30%</div>
</div>
<h3 className="font-headline text-xl mb-2 group-hover:text-secondary transition-colors">Cố Đô Ninh Bình Huyền Thoại</h3>
<div className="text-[0.7rem] uppercase tracking-widest text-primary/50 mb-4 flex items-center">
<span className="material-symbols-outlined text-sm mr-1">schedule</span> 2 Ngày 1 Đêm
                </div>
<div className="flex flex-col gap-1 mb-6">
<span className="text-sm line-through text-primary/40 font-light">3.900.000 VNĐ</span>
<span className="text-xl font-bold text-secondary tracking-tighter">2.700.000 VNĐ</span>
</div>
<button className="w-full py-3 border border-primary text-primary text-[0.75rem] uppercase tracking-widest hover:bg-primary hover:text-white transition-all">Book Now</button>
</div>

<div className="group cursor-pointer">
<div className="relative aspect-[3/4] mb-6 overflow-hidden bg-surface-container-low">
<img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" data-alt="Distant view of mountain peaks in Sapa shrouded in mist with terraced rice fields in the foreground" src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=1200"/>
<div className="absolute top-4 left-4 bg-tertiary text-white text-[0.65rem] px-3 py-1 uppercase tracking-widest">-20%</div>
</div>
<h3 className="font-headline text-xl mb-2 group-hover:text-secondary transition-colors">Sapa Mây Ngàn Đỉnh Fansipan</h3>
<div className="text-[0.7rem] uppercase tracking-widest text-primary/50 mb-4 flex items-center">
<span className="material-symbols-outlined text-sm mr-1">schedule</span> 3 Ngày 2 Đêm
                </div>
<div className="flex flex-col gap-1 mb-6">
<span className="text-sm line-through text-primary/40 font-light">6.500.000 VNĐ</span>
<span className="text-xl font-bold text-secondary tracking-tighter">5.200.000 VNĐ</span>
</div>
<button className="w-full py-3 border border-primary text-primary text-[0.75rem] uppercase tracking-widest hover:bg-primary hover:text-white transition-all">Book Now</button>
</div>
</div>
</section>

<section className="py-24 bg-surface-container-low">
<div className="max-w-7xl mx-auto px-10">
<div className="mb-16">
<h2 className="font-headline text-4xl tracking-tighter text-primary mb-8">HÀNH TRÌNH TRONG NƯỚC</h2>
<div className="flex gap-12 border-b border-outline-variant/40">
<button className="pb-4 text-[0.75rem] uppercase tracking-[0.2em] font-bold text-secondary border-b-2 border-secondary">Sapa</button>
<button className="pb-4 text-[0.75rem] uppercase tracking-[0.2em] font-medium text-primary/40 hover:text-primary transition-colors">Phú Quốc</button>
<button className="pb-4 text-[0.75rem] uppercase tracking-[0.2em] font-medium text-primary/40 hover:text-primary transition-colors">Ninh Bình</button>
<button className="pb-4 text-[0.75rem] uppercase tracking-[0.2em] font-medium text-primary/40 hover:text-primary transition-colors">Đà Lạt</button>
</div>
</div>
<div className="grid grid-cols-1 md:grid-cols-4 gap-8">

<div className="bg-surface p-4 border border-outline-variant/20 hover:border-secondary/50 transition-colors">
<div className="aspect-square mb-6">
<img className="w-full h-full object-cover" data-alt="Hmong ethnic children in traditional vibrant clothing walking along a dirt road in the mountains of Sapa" src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=1200"/>
</div>
<div className="text-[0.65rem] uppercase tracking-widest text-tertiary mb-2 font-bold">Văn Hóa &amp; Bản Sắc</div>
<h4 className="font-headline text-lg mb-4 leading-tight">Khám Phá Bản Cát Cát - Lao Chải</h4>
<div className="flex justify-between items-center text-xs text-primary/60">
<span>3 Ngày / 2 Đêm</span>
<span className="font-bold text-primary italic">Từ 3.200.000đ</span>
</div>
</div>

<div className="bg-surface p-4 border border-outline-variant/20 hover:border-secondary/50 transition-colors">
<div className="aspect-square mb-6">
<img className="w-full h-full object-cover" data-alt="Trekking path through lush green tea plantations in the misty highlands of Vietnam" src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1200"/>
</div>
<div className="text-[0.65rem] uppercase tracking-widest text-tertiary mb-2 font-bold">Chinh Phục Đỉnh Cao</div>
<h4 className="font-headline text-lg mb-4 leading-tight">Fansipan - Nóc Nhà Đông Dương</h4>
<div className="flex justify-between items-center text-xs text-primary/60">
<span>2 Ngày / 1 Đêm</span>
<span className="font-bold text-primary italic">Từ 2.800.000đ</span>
</div>
</div>
<div className="bg-surface p-4 border border-outline-variant/20 hover:border-secondary/50 transition-colors">
<div className="aspect-square mb-6">
<img className="w-full h-full object-cover" data-alt="Morning market scene with local people in colorful ethnic dress and various fresh mountain produce" src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=1200"/>
</div>
<div className="text-[0.65rem] uppercase tracking-widest text-tertiary mb-2 font-bold">Ẩm Thực Đặc Sản</div>
<h4 className="font-headline text-lg mb-4 leading-tight">Chợ Phiên Bắc Hà Ngày Chủ Nhật</h4>
<div className="flex justify-between items-center text-xs text-primary/60">
<span>1 Ngày</span>
<span className="font-bold text-primary italic">Từ 1.200.000đ</span>
</div>
</div>
<div className="bg-surface p-4 border border-outline-variant/20 hover:border-secondary/50 transition-colors">
<div className="aspect-square mb-6">
<img className="w-full h-full object-cover" data-alt="Aerial view of serpentine mountain roads winding through steep green valleys and limestone cliffs" src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=1200"/>
</div>
<div className="text-[0.65rem] uppercase tracking-widest text-tertiary mb-2 font-bold">Nghỉ Dưỡng Thượng Lưu</div>
<h4 className="font-headline text-lg mb-4 leading-tight">Topas Ecolodge: Giấc Mơ Mây Ngàn</h4>
<div className="flex justify-between items-center text-xs text-primary/60">
<span>3 Ngày / 2 Đêm</span>
<span className="font-bold text-primary italic">Từ 9.500.000đ</span>
</div>
</div>
</div>
</div>
</section>

<section className="py-24 px-10 max-w-7xl mx-auto">
<div className="grid grid-cols-1 md:grid-cols-2 gap-24 items-center">
<div className="relative">
<div className="absolute -top-10 -left-10 w-40 h-40 bg-secondary/10 -z-10"></div>
<h2 className="font-headline text-5xl tracking-tighter text-primary leading-tight mb-8">Hành Trình <br/>Vươn Tầm Thế Giới</h2>
<p className="text-lg leading-relaxed text-primary/70 mb-10 max-w-md">Vượt xa khỏi biên giới, Travela mang đến những bộ sưu tập hành trình độc bản tại các kinh đô ánh sáng và những vùng đất huyền bí nhất hành tinh.</p>
<button className="bg-primary text-white px-10 py-5 font-serif text-sm uppercase tracking-widest hover:bg-secondary transition-all">Xem Bộ Sưu Tập Quốc Tế</button>
</div>
<div className="grid grid-cols-2 gap-6">
<div className="space-y-6 pt-12">
<div className="group relative aspect-[3/4] overflow-hidden">
<img className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" data-alt="Classic view of the Eiffel Tower at dusk with city lights starting to twinkle and warm purple sky" src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=1200"/>
<div className="absolute bottom-6 left-6 text-white">
<div className="text-[0.6rem] uppercase tracking-widest mb-1">Châu Âu</div>
<div className="text-xl font-headline">Paris Lãng Mạn</div>
</div>
</div>
<div className="group relative aspect-[3/4] overflow-hidden">
<img className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" data-alt="Futuristic skyline of Tokyo at night with neon lights, skyscrapers, and busy street traffic light trails" src="https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=1200"/>
<div className="absolute bottom-6 left-6 text-white">
<div className="text-[0.6rem] uppercase tracking-widest mb-1">Châu Á</div>
<div className="text-xl font-headline">Tokyo Hiện Đại</div>
</div>
</div>
</div>
<div className="space-y-6">
<div className="group relative aspect-[3/4] overflow-hidden">
<img className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" data-alt="A tranquil stone temple in Bali surrounded by lush rainforest and a misty lake during sunrise" src="https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=1200"/>
<div className="absolute bottom-6 left-6 text-white">
<div className="text-[0.6rem] uppercase tracking-widest mb-1">Đông Nam Á</div>
<div className="text-xl font-headline">Bali Yên Bình</div>
</div>
</div>
<div className="group relative aspect-[3/4] overflow-hidden">
<img className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" data-alt="The Swiss Alps with snow-capped peaks and a small mountain village nestled in a green valley below" src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=1200"/>
<div className="absolute bottom-6 left-6 text-white">
<div className="text-[0.6rem] uppercase tracking-widest mb-1">Châu Âu</div>
<div className="text-xl font-headline">Thụy Sĩ Hùng Vĩ</div>
</div>
</div>
</div>
</div>
</div>
</section>

<section className="py-32 bg-surface">
<div className="max-w-7xl mx-auto px-10 border-t border-b border-outline-variant/30 py-24">
<div className="text-center mb-20">
<span className="text-secondary font-serif italic text-xl mb-4 block">Đẳng Cấp &amp; Uy Tín</span>
<h2 className="font-headline text-4xl tracking-tighter text-primary uppercase">Giá Trị Đặc Quyền Tại Travela</h2>
</div>
<div className="grid grid-cols-1 md:grid-cols-3 gap-16">
<div className="text-center group gold-thread">
<div className="w-16 h-16 mx-auto mb-8 border border-outline-variant flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-white transition-all duration-500">
<span className="material-symbols-outlined text-3xl">concierge</span>
</div>
<h4 className="font-headline text-xl mb-4">Dịch Vụ Cá Nhân Hóa</h4>
<p className="text-sm leading-relaxed text-primary/60 px-6">Chúng tôi thiết kế từng chi tiết nhỏ nhất dựa trên sở thích cá nhân, đảm bảo mỗi chuyến đi là một tác phẩm nghệ thuật riêng biệt.</p>
</div>
<div className="text-center group gold-thread">
<div className="w-16 h-16 mx-auto mb-8 border border-outline-variant flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-white transition-all duration-500">
<span className="material-symbols-outlined text-3xl">verified_user</span>
</div>
<h4 className="font-headline text-xl mb-4">Chuyên Gia 5 Sao</h4>
<p className="text-sm leading-relaxed text-primary/60 px-6">Mạng lưới đối tác cao cấp toàn cầu và đội ngũ chuyên gia giàu kinh nghiệm luôn đồng hành cùng bạn trên mọi nẻo đường.</p>
</div>
<div className="text-center group">
<div className="w-16 h-16 mx-auto mb-8 border border-outline-variant flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-white transition-all duration-500">
<span className="material-symbols-outlined text-3xl">diamond</span>
</div>
<h4 className="font-headline text-xl mb-4">Bộ Sưu Tập Độc Bản</h4>
<p className="text-sm leading-relaxed text-primary/60 px-6">Chỉ những điểm đến tinh túy nhất, những trải nghiệm hiếm có mới được Travela tuyển chọn vào danh mục phục vụ thượng khách.</p>
</div>
</div>
</div>
</section>



    </div>
  );
}
