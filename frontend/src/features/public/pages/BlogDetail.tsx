import React from 'react';

export default function BlogDetail() {
  return (
    <article className="public-page min-h-screen">
      <section className="relative h-[42vh] md:h-[52vh] lg:h-[58vh] w-full border-b-[6px] border-[var(--color-primary)]">
        <img
          src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=2000"
          alt="Amanoi Vinh Hy"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </section>

      <section className="public-container max-w-4xl -mt-14 md:-mt-20 relative z-10">
        <div className="public-floating-card p-6 md:p-10 lg:p-12 text-center">
          <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-[var(--color-secondary)] block mb-5">
            Góc Nhìn Du Lịch • Đánh Giá
          </span>
          <h1 className="font-serif text-3xl md:text-5xl text-[var(--color-primary)] leading-[1.15] tracking-tight mb-6 [text-wrap:balance]">
            Amanoi Vĩnh Hy: Tuyên Ngôn Khép Kín Của Giới Siêu Thượng Lưu
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4 border-t border-[#D0C5AF]/40 pt-6 mt-6 text-[10px] font-bold font-sans uppercase tracking-[0.2em] text-[var(--color-primary)]/80">
            <span>Bài viết bởi Le Minh Khoi</span>
            <span className="hidden md:block w-1.5 h-1.5 rounded-full bg-[var(--color-secondary)]" />
            <span>10 Thg 12, 2024</span>
            <span className="hidden md:block w-1.5 h-1.5 rounded-full bg-[var(--color-secondary)]" />
            <span>6 Phút Đọc</span>
            <span className="hidden md:block w-1.5 h-1.5 rounded-full bg-[var(--color-secondary)]" />
            <button className="flex items-center gap-1 hover:text-[var(--color-secondary)] transition-colors">
              <span className="material-symbols-outlined text-[14px]">share</span>
              Chia Sẻ
            </button>
          </div>
        </div>
      </section>

      <section className="public-container max-w-3xl py-14 md:py-16 font-sans text-base md:text-lg text-[var(--color-primary)]/80 font-light leading-relaxed">
        <p className="mb-8 [text-wrap:pretty]">
          <span className="float-left text-6xl md:text-7xl font-serif text-[var(--color-primary)] leading-[0.8] pr-4 mt-2">N</span>
          ằm ẩn mình vững chãi trên ngọn đồi rợp báng cây xanh của Vườn quốc gia Núi Chúa, hướng tầm mắt ra làn nước xanh ngắt của Vịnh Vĩnh Hy, Amanoi không chỉ là một khu nghỉ dưỡng?. Nơi đ?y giống như một tu viện của những tìm hồn tìm kiếm sự yên lành tuyệt đối, tách biệt hoàn toàn khỏi sự phù phiếm ồn ào của thế giới bên ngoài?.
        </p>

        <p className="mb-8 [text-wrap:pretty]">
          Kể từ khi ra mắt vào năm 2013, Amanoi đã lập tức định nghĩa lại tiêu chuẩn của sự xa xỉ tại Việt Nam?. Khàng dắt vàng, không ph? trương hoa mỹ, sự xa xỉ tại Amanoi nằm ở khoảng không khổng lồ, sự tĩnh mịch tuyệt đối và kiến trúc hài hòa đến mức dường như nó đã mọc lên từ đ? nói r??u phong?.
        </p>

        <figure className="my-12 md:my-16 border-y border-[#D0C5AF]/40 py-8">
          <blockquote className="font-serif text-2xl md:text-3xl text-center text-[var(--color-primary)] leading-snug tracking-tight">
            "Sự sang trọng tốt bậc không định lượng bằng những thứ ta có thể mua, mà bằng không gian, thời gian và sự riêng tư tuyệt đối?."
          </blockquote>
        </figure>

        <h2 className="font-serif text-3xl text-[var(--color-primary)] tracking-tight mb-6 mt-14">Kiến trúc của sự Tĩnh Lặng</h2>
        <p className="mb-8 [text-wrap:pretty]">
          Được thiết kế bởi kiến trúc sư kỳ cựu Jean-Michel Gathy, các Pavilion và Villa tại đ?y lấy cảm hứng từ kiến trúc truyền thống Việt Nam pha trộn với chủ nghĩa tối giản?. Mãi ngồi cong cổ điển, xà nhà bằng gỗ nguyên khối và các vách kính kịch trần tạo ra ảo giác rằng không hề có sự ngăn cách nào giữa thảm rừng xanh miên man và không gian sống bên trong?.
        </p>

        <img
          src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1200"
          alt="Interior view"
          className="w-full h-auto mb-4 border border-[#D0C5AF]/20 shadow-sm"
        />
        <figcaption className="text-xs text-center text-[var(--color-primary)]/50 uppercase tracking-widest mb-12">
          Hồ bơi vô cực Cliff Pool nhìn ra vịnh Vĩnh Hy
        </figcaption>

        <h2 className="font-serif text-3xl text-[var(--color-primary)] tracking-tight mb-6 mt-12">Nghệ Thuật Của Dịch Vụ Vô Hình</h2>
        <p className="mb-8 [text-wrap:pretty]">
          Tại Travela, chúng tôi gọi những gì diễn ra tại Amanoi là dịch vụ vô hình?. Bạn hiếm khi thấy nhân viên đi lại, nhưng một ly nước lạnh luôn sẵn sàng ngay khi bạn vừa nằm xuống chiếc ghế tắm nắng?. Căn phòng luôn được dọn dẹp không tì vết mỗi khi bạn dùng bữa xong?. Mọi yêu cầu đều được tiên liệu và thực hiện trước khi nó kịp cất lên bằng lời?.
        </p>

        <div className="bg-[var(--color-surface)] p-6 md:p-8 my-12 md:my-16 border-l-4 border-[var(--color-secondary)]">
          <h3 className="font-serif text-xl tracking-tight text-[var(--color-primary)] mb-4">Trải Nghiệm Khuyên Dùng Bởi Travela Concierge</h3>
          <ul className="list-none space-y-4 text-base font-normal text-[var(--color-primary)]/80">
            <li className="flex gap-4"><span className="material-symbols-outlined text-[var(--color-secondary)]">self_improvement</span> Dành một buổi chiều tại Lotus Spa Pavilion nằm giữa hồ sen?.</li>
            <li className="flex gap-4"><span className="material-symbols-outlined text-[var(--color-secondary)]">restaurant</span> Yêu cầu một bữa tối riêng tư tại bờ biển Rock Studio riêng biệt?.</li>
            <li className="flex gap-4"><span className="material-symbols-outlined text-[var(--color-secondary)]">hiking</span> Trekking buổi sớm lên đỉnh Goga Peak để ngắm toàn cảnh vườn quốc gia?.</li>
          </ul>
        </div>

        <p className="mb-12 [text-wrap:pretty]">
          Có thể nói, nghỉ dưỡng tại đ?y không chỉ là một chuyến đi, đó là một hành trình chữa lành sâu sắc cho tìm trà, một tuyên ngôn thầm lặng của những người hiểu được giá trị thực sự của cuộc sống?.
        </p>

        <div className="border border-[#D0C5AF]/40 bg-white p-6 md:p-8 mb-16 flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="w-20 h-20 rounded-full overflow-hidden shrink-0 border border-[var(--color-secondary)]">
            <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200" alt="Author" className="w-full h-full object-cover" />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-widest text-[var(--color-primary)]/50 font-bold block mb-1">Tác Giả</span>
            <h4 className="font-serif text-xl text-[var(--color-primary)] mb-2">Lê Minh Khôi</h4>
            <p className="text-sm">Chuyên gia đánh giá trải nghiệm nghỉ dưỡng cao cấp tại Travela. Sở hữu hơn 10 năm kinh nghiệm tại các chuỗi hệ thống khách sạn Luxury toàn cầu.</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 pb-4">
          <span className="px-4 py-2 bg-[var(--color-surface)] border border-[#D0C5AF]/30 text-xs font-bold uppercase tracking-widest text-[var(--color-primary)]">#LuxuryTravel</span>
          <span className="px-4 py-2 bg-[var(--color-surface)] border border-[#D0C5AF]/30 text-xs font-bold uppercase tracking-widest text-[var(--color-primary)]">#Vietnam</span>
          <span className="px-4 py-2 bg-[var(--color-surface)] border border-[#D0C5AF]/30 text-xs font-bold uppercase tracking-widest text-[var(--color-primary)]">#Resort</span>
        </div>
      </section>

      <section className="bg-[var(--color-surface)] py-16 md:py-20 border-t border-[#D0C5AF]/40">
        <div className="public-container">
          <h2 className="font-serif text-3xl text-[var(--color-primary)] mb-10 text-center">Bài Viết Liên Quan</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            <article className="group cursor-pointer bg-white border border-[#D0C5AF]/40 p-4 shadow-sm">
              <div className="aspect-[16/11] overflow-hidden mb-6">
                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800" alt="Mock" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[1.5s]" />
              </div>
              <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-secondary)] mb-2 block font-bold">Destinations</span>
              <h3 className="font-serif text-xl text-[var(--color-primary)]">Đêm Thượng Lưu Tại Vịnh Hạ Long</h3>
            </article>

            <article className="group cursor-pointer bg-white border border-[#D0C5AF]/40 p-4 shadow-sm">
              <div className="aspect-[16/11] overflow-hidden mb-6">
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
