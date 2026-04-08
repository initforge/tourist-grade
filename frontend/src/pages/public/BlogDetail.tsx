import React from 'react';

export default function BlogDetail() {
  return (
    <article className="w-full bg-[var(--color-background)] min-h-screen">
      {/* Massive Hero Image */}
      <section className="relative h-[80vh] w-full border-b-[8px] border-[var(--color-primary)]">
         <img 
            src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=2000" 
            alt="Amanoi Vinh Hy" 
            className="w-full h-full object-cover"
         />
         <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
      </section>

      {/* Article Header */}
      <section className="max-w-4xl mx-auto px-6 -mt-24 relative z-10 text-center">
         <div className="bg-white border sm:border-2 border-[var(--color-primary)] p-10 md:p-16 shadow-2xl">
            <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-[var(--color-secondary)] block mb-6">
               G�c Nh�n Du L?ch • Đánh Giá
            </span>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-[var(--color-primary)] leading-[1.15] tracking-tight mb-8 [text-wrap:balance]">
               Amanoi Vĩnh Hy: Tuyên Ngôn Khép Kín Của Giới Siêu Thượng Lưu
            </h1>
            <div className="flex flex-wrap items-center justify-center gap-4 border-t border-[#D0C5AF]/40 pt-8 mt-8 text-[10px] font-bold font-sans uppercase tracking-[0.2em] text-[var(--color-primary)]/80">
               <span>Bài viết bởi Le Minh Khoi</span>
               <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-secondary)]"></span>
               <span>10 Thg 12, 2024</span>
               <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-secondary)]"></span>
               <span>6 Phút Đọc</span>
               <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-secondary)]"></span>
               <button className="flex items-center gap-1 hover:text-[var(--color-secondary)] transition-colors">
                  <span className="material-symbols-outlined text-[14px]">share</span> Chia Sẻ
               </button>
            </div>
         </div>
      </section>

      {/* Article Content */}
      <section className="max-w-3xl mx-auto px-6 py-20 font-sans text-lg text-[var(--color-primary)]/80 font-light leading-relaxed">
         <p className="mb-8 [text-wrap:pretty]">
            <span className="float-left text-7xl font-serif text-[var(--color-primary)] leading-[0.8] pr-4 mt-2">N</span>ằm ẩn mình vững chãi trên ngọn đồi rợp bóng cây xanh của Vườn quốc gia Núi Chúa, hướng tầm mắt ra làn nước xanh ngắt của Vịnh Vĩnh Hy, Amanoi không chỉ là một khu nghỉ dưỡng. Nơi đây giống như một tu viện của những tâm hồn tìm kiếm sự yên lành tuyệt đối, tách biệt hoàn toàn khỏi sự phù phiếm ồn ào của thế giới bên ngoài. 
         </p>

         <p className="mb-8 [text-wrap:pretty]">
            Kể từ khi ra mắt vào năm 2013, Amanơi (Amanoi) đã lập tức định nghĩa lại tiêu chuẩn của sự xa xỉ tại Việt Nam. Không dát vàng, không phô trương hoa mỹ, sự xa xỉ tại Amanoi nằm ở khoảng không khổng lồ, sự tĩnh mịch tuyệt đối và kiến trúc hài hòa đến mức dường như nó đã "mọc lên" từ đá núi rêu phong.
         </p>

         <figure className="my-16 border-y border-[#D0C5AF]/40 py-8">
            <blockquote className="font-serif text-2xl md:text-3xl text-center text-[var(--color-primary)] leading-snug tracking-tight">
               "Sự sang trọng tột bậc không định lượng bằng những thứ ta có thể mua, mà bằng không gian, thời gian và sự riêng tư tuyệt đối."
            </blockquote>
         </figure>

         <h2 className="font-serif text-3xl text-[var(--color-primary)] tracking-tight mb-6 mt-16">
            Kiến trúc của sự Tĩnh Lặng
         </h2>
         <p className="mb-8 [text-wrap:pretty]">
            Được thiết kế bởi kiến trúc sư kỳ cựu Jean-Michel Gathy, các Pavilion và Villa tại đây lấy cảm hứng từ kiến trúc truyền thống Việt Nam pha trộn với chủ nghĩa tối giản. Mái ngói cong cổ điển, xà nhà bằng gỗ nguyên khối và các vách kính kịch trần tạo ra ảo giác rằng không hề có sự ngăn cách nào giữa thảm rừng xanh miên man và không gian sống bên trong.
         </p>

         <img 
            src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1200" 
            alt="Interior view" 
            className="w-full h-auto mb-6 border border-[#D0C5AF]/20 shadow-sm"
         />
         <figcaption className="text-xs text-center text-[var(--color-primary)]/50 uppercase tracking-widest mb-16">
            Hồ bơi vô cực Cliff Pool nhìn ra vịnh Vĩnh Hy
         </figcaption>

         <h2 className="font-serif text-3xl text-[var(--color-primary)] tracking-tight mb-6 mt-12">
            Nghệ Thuật Của Dịch Vụ "Vô Hình"
         </h2>
         <p className="mb-8 [text-wrap:pretty]">
            Tại Travela, chúng tôi gọi những gì diễn ra tại Amanoi là "dịch vụ vô hình". Bạn hiếm khi thấy nhân viên đi lại, nhưng một ly nước lạnh luôn sẵn sàng ngay khi bạn vừa nằm xuống chiếc ghế tắm nắng. Căn phòng luôn được dọn dẹp không tì vết mỗi khi bạn dùng bữa xong. Mọi yêu cầu đều được tiên liệu và thực hiện trước khi nó kịp cất lên bằng lời.
         </p>

         <div className="bg-[var(--color-surface)] p-8 my-16 border-l-4 border-[var(--color-secondary)]">
            <h3 className="font-serif text-xl tracking-tight text-[var(--color-primary)] mb-4">Trải Nghiệm Khuyên Dùng Bởi Travela Concierge</h3>
            <ul className="list-none space-y-4 text-base font-normal text-[var(--color-primary)]/80">
               <li className="flex gap-4"><span className="material-symbols-outlined text-[var(--color-secondary)]">self_improvement</span> Dành một buổi chiều tại Lotus Spa Pavilion nằm giữa hồ sen.</li>
               <li className="flex gap-4"><span className="material-symbols-outlined text-[var(--color-secondary)]">restaurant</span> Yêu cầu một bữa tối riêng tư tại bờ biển Rock Studio riêng biệt.</li>
               <li className="flex gap-4"><span className="material-symbols-outlined text-[var(--color-secondary)]">hiking</span> Trekking buổi sớm lên định goga peak để ngắm toàn cảnh vườn quốc gia.</li>
            </ul>
         </div>

         <p className="mb-12 [text-wrap:pretty]">
            Có thể nói, nghỉ dưỡng tại đây không chỉ là một chuyến đi, đó là một hành trình chữa lành sâu sắc cho tâm trí, một tuyên ngôn thầm lặng của những người hiểu được giá trị thực sự của cuộc sống.
         </p>

         {/* Author Bio */}
         <div className="border border-[#D0C5AF]/40 bg-white p-8 mb-16 flex items-center gap-6">
            <div className="w-20 h-20 rounded-full overflow-hidden shrink-0 border border-[var(--color-secondary)]">
               <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200" alt="Author" className="w-full h-full object-cover" />
            </div>
            <div>
               <span className="text-[10px] uppercase tracking-widest text-[var(--color-primary)]/50 font-bold block mb-1">Tác Giả</span>
               <h4 className="font-serif text-xl text-[var(--color-primary)] mb-2">Lê Minh Khôi</h4>
               <p className="text-sm">Chuyên gia đánh giá trải nghiệm nghỉ dưỡng cao cấp tại Travela. Sở hữu hơn 10 năm kinh nghiệm tại các chuỗi hệ thống khách sạn Luxury toàn cầu.</p>
            </div>
         </div>
         
         {/* Footer tags */}
         <div className="flex flex-wrap gap-3 pb-8">
            <span className="px-4 py-2 bg-[var(--color-surface)] border border-[#D0C5AF]/30 text-xs font-bold uppercase tracking-widest text-[var(--color-primary)]">#LuxuryTravel</span>
            <span className="px-4 py-2 bg-[var(--color-surface)] border border-[#D0C5AF]/30 text-xs font-bold uppercase tracking-widest text-[var(--color-primary)]">#Vietnam</span>
            <span className="px-4 py-2 bg-[var(--color-surface)] border border-[#D0C5AF]/30 text-xs font-bold uppercase tracking-widest text-[var(--color-primary)]">#Resort</span>
         </div>
      </section>

      {/* Recommended Articles */}
      <section className="bg-[var(--color-surface)] py-20 border-t border-[#D0C5AF]/40">
         <div className="max-w-7xl mx-auto px-6">
            <h2 className="font-serif text-3xl text-[var(--color-primary)] mb-12 text-center">Bài Viết Liên Quan</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
               
               {/* Note: Just re-using the design for 2 grid items as mock */}
               <article className="group cursor-pointer bg-white border border-[#D0C5AF]/40 p-4 shadow-sm">
                 <div className="aspect-[4/3] overflow-hidden mb-6">
                   <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800" alt="Mock" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[1.5s]" />
                 </div>
                 <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-secondary)] mb-2 block font-bold">Destinations</span>
                 <h3 className="font-serif text-xl text-[var(--color-primary)]">Đêm Thượng Lưu Tại Vịnh Hạ Long</h3>
               </article>

               <article className="group cursor-pointer bg-white border border-[#D0C5AF]/40 p-4 shadow-sm">
                 <div className="aspect-[4/3] overflow-hidden mb-6">
                   <img src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=800" alt="Mock 2" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[1.5s]" />
                 </div>
                 <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-secondary)] mb-2 block font-bold">Experiences</span>
                 <h3 className="font-serif text-xl text-[var(--color-primary)]">Nghệ Thuật Trà Đạo Cung Đình Huế</h3>
               </article>

            </div>
         </div>
      </section>
    </article>
  );
}
