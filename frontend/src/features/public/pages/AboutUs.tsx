import React from 'react';

export default function AboutUs() {
  return (
    <div className="public-page">
      <section className="public-hero-banner flex items-center justify-center">
        <img
          src="https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1800"
          alt="Luxury Resort"
          className="absolute inset-0 w-full h-full object-cover grayscale-[30%]"
        />
        <div className="absolute inset-0 bg-black/45" />
        <div className="public-container relative z-10 text-center text-white">
          <span className="text-[10px] uppercase tracking-[0.3em] font-medium mb-4 block text-[var(--color-secondary)]">Triết Lý Của Chúng Tôi</span>
          <h1 className="font-serif text-4xl md:text-6xl mb-6 tracking-tight">
            Vẻ Đẹp Đích Thực
            <br />
            Của Đông Dương
          </h1>
          <p className="text-base md:text-lg font-light opacity-90 leading-relaxed max-w-2xl mx-auto">
            Tại Travela, chúng tôi không chỉ tạo ra những chuyến đi, mà kiến tạo những trải nghiệm tinh tế, rõ ràng và đậm dấu ấn cá nhân.
          </p>
        </div>
      </section>

      <section className="public-section">
        <div className="public-container max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-14 items-center">
            <div className="space-y-6">
              <h2 className="font-serif text-3xl text-[var(--color-primary)]">
                Hành Trình Kiến Tạo
                <br />
                Sự Khác Biệt
              </h2>
              <div className="w-12 h-[1px] bg-[var(--color-secondary)]" />
              <p className="text-[var(--color-primary)]/70 leading-relaxed text-sm">
                Được thành lập từ năm 2010 bởi những tâm hồn đam mê xê dịch và am hiểu văn hóa sâu sắc, Travela ra đời với sứ mệnh định nghĩa lại chuẩn mực du lịch cao cấp tại Việt Nam.
              </p>
              <p className="text-[var(--color-primary)]/70 leading-relaxed text-sm">
                Chúng tôi tin rằng sự sang trọng không chỉ nằm ở khách sạn 5 sao hay dịch vụ xa xỉ, mà còn nằm ở cảm xúc chân thực, sự tỉ mỉ trong từng chi tiết và khả năng chạm đến giá trị nguyên bản của mỗi vùng đất.
              </p>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-[var(--color-surface)] translate-x-3 md:translate-x-4 -translate-y-3 md:-translate-y-4" />
              <img
                src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=1400"
                alt="Di sản Việt Nam"
                className="relative z-10 w-full aspect-[4/5] object-cover border border-[#D0C5AF]/30"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="public-section bg-[var(--color-surface)]">
        <div className="public-container max-w-6xl text-center">
          <h2 className="font-serif text-3xl text-[var(--color-primary)] mb-12">Giá Trị Cốt Lõi</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
            <div className="bg-white p-8 md:p-10 border border-[#D0C5AF]/30 shadow-sm relative overflow-hidden group hover:-translate-y-2 transition-transform duration-300">
              <span className="material-symbols-outlined text-4xl text-[var(--color-secondary)] mb-6">diamond</span>
              <h3 className="font-serif text-xl text-[var(--color-primary)] mb-4">Tinh Tế Độc Bản</h3>
              <p className="text-sm text-[var(--color-primary)]/60 leading-relaxed">
                Mỗi hành trình là một tác phẩm nghệ thuật trọn vẹn, được may đo riêng biệt cho từng du khách.
              </p>
            </div>
            <div className="bg-white p-8 md:p-10 border border-[#D0C5AF]/30 shadow-sm relative overflow-hidden group hover:-translate-y-2 transition-transform duration-300">
              <span className="material-symbols-outlined text-4xl text-[var(--color-secondary)] mb-6">workspace_premium</span>
              <h3 className="font-serif text-xl text-[var(--color-primary)] mb-4">Chuyên Gia Bản Địa</h3>
              <p className="text-sm text-[var(--color-primary)]/60 leading-relaxed">
                Đội ngũ chuyên gia không chỉ là hướng dẫn viên, mà còn là những người đồng hành truyền cảm hứng.
              </p>
            </div>
            <div className="bg-white p-8 md:p-10 border border-[#D0C5AF]/30 shadow-sm relative overflow-hidden group hover:-translate-y-2 transition-transform duration-300">
              <span className="material-symbols-outlined text-4xl text-[var(--color-secondary)] mb-6">nature_people</span>
              <h3 className="font-serif text-xl text-[var(--color-primary)] mb-4">Phát Triển Bền Vững</h3>
              <p className="text-sm text-[var(--color-primary)]/60 leading-relaxed">
                Cam kết bảo tồn văn hóa di sản và thiên nhiên, mang lại tác động tích cực và lâu dài cho cộng đồng địa phương.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="public-section">
        <div className="public-container max-w-5xl text-center">
          <h2 className="font-serif text-2xl text-[var(--color-primary)] mb-10">Chứng Nhận Danh Giá</h2>
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8 opacity-50 grayscale">
            <div className="text-sm font-bold uppercase tracking-widest border px-6 py-2">World Travel Awards 2024</div>
            <div className="text-sm font-bold uppercase tracking-widest border px-6 py-2">IATA Certified</div>
            <div className="text-sm font-bold uppercase tracking-widest border px-6 py-2">TripAdvisor Excellence</div>
            <div className="text-sm font-bold uppercase tracking-widest border px-6 py-2">Vietnam Tourism Board</div>
          </div>
        </div>
      </section>
    </div>
  );
}
