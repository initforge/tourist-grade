import React from 'react';

export default function AdminTourProgramDetail() {
  return (
    <div className="w-full bg-[var(--color-background)]">
      

<header className="sticky top-0 z-50 w-full bg-[#FBFBFB] border-b border-[#D0C5AF]/40 px-10 py-4 flex justify-between items-center">
<div className="flex items-center gap-6">
<button className="hover:text-[#D4AF37] transition-colors duration-300">
<span className="material-symbols-outlined" data-icon="arrow_back">arrow_back</span>
</button>
<div className="flex flex-col">
<h1 className="font-headline tracking-tighter text-xl text-[#2A2421]">Phê duyệt: Hạ Long Du thuyền Di sản</h1>
<div className="flex items-center gap-2 mt-1">
<span className="inline-block w-2 h-2 rounded-full bg-[#D4AF37]"></span>
<span className="text-[10px] uppercase tracking-widest font-semibold text-[#D4AF37]">Chờ duyệt</span>
</div>
</div>
</div>
<div className="flex items-center gap-4">
<button className="px-6 py-2.5 border border-[#2A2421] text-[#2A2421] text-xs uppercase tracking-widest hover:bg-[#2A2421] hover:text-white transition-all duration-300">
                Từ chối
            </button>
<button className="px-6 py-2.5 bg-[#3d6656] text-white text-xs uppercase tracking-widest hover:bg-[#2A2421] transition-all duration-300">
                Phê duyệt &amp; Đăng bán
            </button>
</div>
</header>
<div className="flex min-h-screen">



<main className="flex-1 p-10 grid grid-cols-1 lg:grid-cols-3 gap-10">

<div className="lg:col-span-2 space-y-12">

<section className="relative">
<div className="absolute -top-4 -left-4 w-24 h-24 dashed-accent border-r-0 border-b-0"></div>
<div className="absolute -bottom-4 -right-4 w-24 h-24 dashed-accent border-l-0 border-t-0"></div>
<div className="overflow-hidden aspect-[21/9] relative group">
<img alt="Luxury Heritage Cruise Halong Bay" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" data-alt="luxury traditional wooden cruise ship sailing through emerald waters of halong bay with karst limestone mountains in golden hour light" src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=1200"/>
<div className="absolute inset-0 bg-gradient-to-t from-[#2A2421]/40 to-transparent"></div>
</div>
</section>

<section className="bg-[#FBFBFB] p-10 relative">
<div className="absolute top-0 right-10 h-1 w-20 bg-[#D4AF37]"></div>
<h2 className="font-headline text-2xl mb-8 tracking-tight border-b border-[#D0C5AF]/20 pb-4 uppercase tracking-[0.2em] text-sm font-bold text-[#2A2421]/40">Thông tin chung</h2>
<div className="grid grid-cols-3 gap-8">
<div>
<p className="text-[10px] uppercase tracking-widest text-[#2A2421]/60 mb-1">Mã Tour</p>
<p className="font-medium tracking-wide">HL-HERI-2024</p>
</div>
<div>
<p className="text-[10px] uppercase tracking-widest text-[#2A2421]/60 mb-1">Thời lượng</p>
<p className="font-medium tracking-wide">3 Ngày 2 Đêm</p>
</div>
<div>
<p className="text-[10px] uppercase tracking-widest text-[#2A2421]/60 mb-1">Loại hình</p>
<p className="font-medium tracking-wide flex items-center gap-2">
<span className="material-symbols-outlined text-[16px] text-[#3d6656]" data-icon="star">star</span>
                                Nghỉ dưỡng cao cấp
                            </p>
</div>
</div>
</section>

<section className="space-y-8">
<h2 className="font-headline text-2xl tracking-tight border-b border-[#D0C5AF]/20 pb-4 uppercase tracking-[0.2em] text-sm font-bold text-[#2A2421]/40">Lịch trình chi tiết</h2>

<div className="flex gap-8 group">
<div className="flex flex-col items-center">
<div className="w-12 h-12 border border-[#D4AF37] flex items-center justify-center font-headline text-lg group-hover:bg-[#D4AF37] group-hover:text-white transition-colors duration-300">01</div>
<div className="flex-1 w-[1px] bg-[#D0C5AF]/40 my-2"></div>
</div>
<div className="flex-1 bg-[#FBFBFB] p-8 border-l-4 border-[#2A2421]">
<h3 className="font-headline text-xl mb-4 italic">Hà Nội – Vịnh Hạ Long – Du thuyền Di sản</h3>
<div className="space-y-4 text-[#2A2421]/80 leading-relaxed body-lg">
<div className="flex gap-4">
<span className="text-xs font-bold w-12 pt-1">12:00</span>
<p>Chào đón tại bến cảng Tuần Châu. Thủ tục nhận phòng và thưởng thức cocktail đặc biệt từ công thức bí mật của các Mandarin cổ xưa.</p>
</div>
<div className="flex gap-4 text-[#3d6656]">
<span className="material-symbols-outlined" data-icon="restaurant" style={{"fontVariationSettings":"'FILL' 1"}}>restaurant</span>
<p className="text-sm italic">Bữa trưa Buffet thượng hạng với hải sản địa phương vùng vịnh.</p>
</div>
<div className="flex gap-4">
<span className="text-xs font-bold w-12 pt-1">15:30</span>
<p>Khám phá hang động bí mật bằng thuyền nan gỗ hoặc trải nghiệm chèo Kayak giữa đại dương tĩnh lặng.</p>
</div>
</div>
</div>
</div>

<div className="flex gap-8 group">
<div className="flex flex-col items-center">
<div className="w-12 h-12 border border-[#D4AF37] flex items-center justify-center font-headline text-lg group-hover:bg-[#D4AF37] group-hover:text-white transition-colors duration-300">02</div>
<div className="flex-1 w-[1px] bg-[#D0C5AF]/40 my-2"></div>
</div>
<div className="flex-1 bg-[#FBFBFB] p-8">
<h3 className="font-headline text-xl mb-4 italic">Bình minh trên Vịnh – Làng chài nổi – Tiệc đêm</h3>
<div className="space-y-4 text-[#2A2421]/80 leading-relaxed body-lg">
<p>Đón bình minh với bài tập Thái Cực Quyền trên boong tàu. Tham quan khu nuôi cấy ngọc trai thiên nhiên và tìm hiểu quy trình chế tác thủ công truyền thống.</p>
<div className="p-4 border-l border-[#D4AF37] bg-[#F3F3F3]/50 italic text-sm">
                                    "Trải nghiệm trà chiều Indochine đặc trưng với các loại bánh điểm tâm Pháp hòa quyện hương vị Việt."
                                </div>
</div>
</div>
</div>
</section>

<section className="bg-[#FBFBFB] p-10 border border-[#D0C5AF]/20">
<h2 className="font-headline text-lg mb-6 flex items-center gap-3">
<span className="material-symbols-outlined text-[#D4AF37]" data-icon="policy">policy</span>
                        Chính sách Hoàn hủy
                    </h2>
<div className="prose prose-sm max-w-none text-[#2A2421]/70 leading-relaxed">
<ul className="space-y-2 list-none p-0">
<li className="flex items-start gap-2">
<span className="text-[#D4AF37] mt-1">•</span> 
                                Hoàn hủy miễn phí trước 30 ngày khởi hành.
                            </li>
<li className="flex items-start gap-2">
<span className="text-[#D4AF37] mt-1">•</span> 
                                Phí hủy 50% trong khoảng 15-29 ngày trước khởi hành.
                            </li>
<li className="flex items-start gap-2">
<span className="text-[#D4AF37] mt-1">•</span> 
                                Không hoàn lại chi phí nếu hủy dưới 14 ngày hoặc vắng mặt.
                            </li>
</ul>
</div>
</section>
</div>

<div className="space-y-8">

<div className="bg-[#FBFBFB] p-8 shadow-sm relative overflow-hidden">
<div className="absolute top-0 right-0 w-12 h-12 bg-[#D4AF37]/10 flex items-center justify-center">
<span className="material-symbols-outlined text-[#D4AF37] text-lg" data-icon="payments">payments</span>
</div>
<h3 className="text-[10px] uppercase tracking-widest font-bold text-[#2A2421]/40 mb-6">Cấu hình Giá</h3>
<div className="space-y-6">
<div className="flex justify-between items-end border-b border-[#D0C5AF]/20 pb-4">
<div>
<p className="text-xs text-[#2A2421]/60">Người lớn</p>
<p className="font-headline text-xl text-[#2A2421]">12.500.000</p>
</div>
<span className="text-[10px] uppercase text-[#D4AF37] mb-1">VND / Khách</span>
</div>
<div className="flex justify-between items-end border-b border-[#D0C5AF]/20 pb-4">
<div>
<p className="text-xs text-[#2A2421]/60">Trẻ em (6-11t)</p>
<p className="font-headline text-lg text-[#2A2421]">8.750.000</p>
</div>
<span className="text-[10px] uppercase text-[#2A2421]/40 mb-1">VND / Khách</span>
</div>
<div className="flex justify-between items-end">
<div>
<p className="text-xs text-[#2A2421]/60">Phụ thu phòng đơn</p>
<p className="font-headline text-lg text-[#2A2421]">4.200.000</p>
</div>
<span className="text-[10px] uppercase text-[#2A2421]/40 mb-1">VND</span>
</div>
</div>
</div>

<div className="bg-[#FBFBFB] p-8">
<h3 className="text-[10px] uppercase tracking-widest font-bold text-[#2A2421]/40 mb-6">Thông tin hệ thống</h3>
<div className="space-y-5">
<div className="flex items-center gap-4">
<div className="w-10 h-10 rounded-full bg-[#D0C5AF]/20 flex items-center justify-center overflow-hidden">
<img alt="Creator Avatar" className="w-full h-full object-cover" data-alt="portrait of a professional asian travel consultant man in a neutral studio background" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400"/>
</div>
<div>
<p className="text-[10px] uppercase tracking-widest text-[#2A2421]/40">Người tạo</p>
<p className="text-sm font-medium">Lê Minh Hoàng</p>
</div>
</div>
<div className="flex items-center gap-4">
<div className="w-10 h-10 flex items-center justify-center text-[#2A2421]/40">
<span className="material-symbols-outlined" data-icon="calendar_month">calendar_month</span>
</div>
<div>
<p className="text-[10px] uppercase tracking-widest text-[#2A2421]/40">Ngày tạo</p>
<p className="text-sm font-medium">12/05/2024 - 14:20</p>
</div>
</div>
<div className="flex items-center gap-4">
<div className="w-10 h-10 flex items-center justify-center text-[#2A2421]/40">
<span className="material-symbols-outlined" data-icon="handshake">handshake</span>
</div>
<div>
<p className="text-[10px] uppercase tracking-widest text-[#2A2421]/40">Đối tác</p>
<p className="text-sm font-medium">Heritage Cruises Binh Chuan</p>
</div>
</div>
</div>
</div>

<div className="bg-white p-0 border border-[#D0C5AF]/20 flex flex-col h-[400px]">
<div className="p-4 border-b border-[#D0C5AF]/20 bg-[#FBFBFB]">
<h3 className="text-[10px] uppercase tracking-widest font-bold text-[#2A2421]">Nhật ký trao đổi</h3>
</div>
<div className="flex-1 overflow-y-auto p-4 space-y-4">

<div className="flex gap-3">
<div className="w-8 h-8 rounded-full bg-[#3d6656] text-white flex items-center justify-center text-[10px] shrink-0">AN</div>
<div className="bg-[#F3F3F3] p-3 text-xs leading-relaxed">
<div className="flex justify-between mb-1 gap-4">
<span className="font-bold">An Nguyễn (Manager)</span>
<span className="text-[9px] text-[#2A2421]/40">Hôm qua 16:30</span>
</div>
<p>Anh kiểm tra lại giá phòng đơn giúp em, hình như đang thấp hơn hợp đồng - Ngọc</p>
</div>
</div>

<div className="text-center">
<span className="text-[9px] uppercase tracking-tighter px-2 py-1 bg-[#F3F3F3] text-[#2A2421]/50">Trạng thái đổi thành: Chờ duyệt</span>
</div>

<div className="flex gap-3 justify-end">
<div className="bg-[#ece0db] p-3 text-xs leading-relaxed max-w-[80%]">
<div className="flex justify-between mb-1 gap-4">
<span className="text-[9px] text-[#2A2421]/40">Hôm nay 09:15</span>
<span className="font-bold">Hoàng (Bạn)</span>
</div>
<p>Đã cập nhật lại giá theo phụ lục số 03 ký ngày 10/05 ạ.</p>
</div>
</div>
</div>

<div className="p-4 bg-[#FBFBFB] border-t border-[#D0C5AF]/20">
<div className="relative">
<input className="w-full border-none border-b border-[#D0C5AF]/40 bg-transparent text-xs py-2 focus:ring-0 focus:border-[#D4AF37] placeholder:text-[#2A2421]/30" placeholder="Nhập phản hồi nội bộ..." type="text"/>
<button className="absolute right-0 top-1/2 -translate-y-1/2 text-[#D4AF37] hover:scale-110 transition-transform">
<span className="material-symbols-outlined text-lg" data-icon="send">send</span>
</button>
</div>
</div>
</div>
</div>
</main>
</div>

    </div>
  );
}
