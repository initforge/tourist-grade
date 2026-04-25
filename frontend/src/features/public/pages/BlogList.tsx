import { useNavigate } from 'react-router-dom';
import { useAppDataStore } from '@shared/store/useAppDataStore';

export default function BlogList() {
  const navigate = useNavigate();
  const blogs = useAppDataStore((state) => state.publicBlogs);
  const publicReady = useAppDataStore((state) => state.publicReady);

  const featuredBlog = blogs[0];
  const remainingBlogs = blogs.slice(1);

  if (!publicReady) {
    return (
      <div className="public-container py-24 md:py-32 text-center text-sm text-[var(--color-primary)]/60">
        Đang tải bài viết...
      </div>
    );
  }

  return (
    <div className="public-page min-h-screen">
      {!featuredBlog ? (
        <div className="public-container py-24 md:py-32 text-center">
          <span className="material-symbols-outlined text-5xl text-[var(--color-primary)]/20 mb-4 block">library_books</span>
          <h1 className="font-serif text-4xl text-[var(--color-primary)] mb-4">Tạp Chí Hành Trình</h1>
          <p className="text-sm text-[var(--color-primary)]/50">
            Chưa có dữ liệu bài viết?. Trang này sẽ được nối API khi backend blog/cẩm nang được triển khai?.
          </p>
        </div>
      ) : (
        <>
          <div className="public-container pt-10 md:pt-14 pb-6 md:pb-8 border-b border-[#D0C5AF]/30">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-5">
              <div>
                <h1 className="font-serif text-4xl md:text-5xl tracking-tighter text-[var(--color-primary)] mb-3">
                  Tạp Chí
                  <br />
                  Hành Trình
                </h1>
                <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-primary)]/60 font-medium font-sans">
                  Tập san số 12 - Tháng 12, 2024
                </p>
              </div>
              <nav className="flex flex-wrap gap-5 md:gap-8 text-[10px] uppercase tracking-widest text-[var(--color-primary)] font-bold">
                <button className="border-b border-[var(--color-secondary)] pb-1">Tất cả</button>
                <button className="opacity-50 hover:opacity-100 transition-opacity">Góc nhìn du lịch</button>
                <button className="opacity-50 hover:opacity-100 transition-opacity">Điểm đến</button>
                <button className="opacity-50 hover:opacity-100 transition-opacity">Trải nghiệm</button>
              </nav>
            </div>
          </div>

          <section className="public-section-tight">
            <div className="public-container">
              <div className="group cursor-pointer" onClick={() => navigate(`/blog/${featuredBlog?.slug ?? featuredBlog?.id}`)}>
                <div className="relative aspect-[16/11] lg:aspect-[16/9] w-full overflow-hidden border sm:border-2 border-[var(--color-primary)]">
                  <img src={featuredBlog?.image} alt={featuredBlog?.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[2s] ease-in-out grayscale-[20%]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  <div className="absolute inset-x-0 bottom-0 p-6 md:p-10 lg:p-14 text-white max-w-4xl">
                    <span className="text-[10px] uppercase tracking-[0.3em] text-[var(--color-secondary)] mb-4 block font-bold">{featuredBlog?.category}</span>
                    <h2 className="font-serif text-2xl md:text-4xl mb-4 leading-[1.1] transition-colors">{featuredBlog?.title}</h2>
                    <p className="font-sans font-light text-white/80 max-w-2xl mb-6 leading-relaxed line-clamp-3">
                      {featuredBlog?.excerpt}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 md:gap-6 font-sans text-xs uppercase tracking-widest opacity-80 border-t border-white/20 pt-4">
                      <span>{featuredBlog?.author}</span>
                      <span className="hidden md:block w-1 h-1 rounded-full bg-[var(--color-secondary)]" />
                      <span>{featuredBlog?.date}</span>
                      <span className="hidden md:block w-1 h-1 rounded-full bg-[var(--color-secondary)]" />
                      <span>{featuredBlog?.readTime}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="public-section border-t border-[#D0C5AF]/30">
            <div className="public-container">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 md:gap-10">
                {remainingBlogs?.map(blog => (
                  <article key={blog?.id} className="group cursor-pointer public-floating-card overflow-hidden" onClick={() => navigate(`/blog/${blog?.slug ?? blog?.id}`)}>
                    <div className="aspect-[16/11] overflow-hidden">
                      <img src={blog?.image} alt={blog?.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[1.5s]" />
                    </div>
                    <div className="p-5">
                      <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-secondary)] mb-3 block font-bold">{blog?.category}</span>
                      <h3 className="font-serif text-2xl text-[var(--color-primary)] mb-4 leading-snug group-hover:text-[var(--color-secondary)] transition-colors">
                        {blog?.title}
                      </h3>
                      <div className="flex items-center justify-between gap-4 font-sans text-[10px] uppercase tracking-widest text-[var(--color-primary)]/60 pt-4 border-t border-[#D0C5AF]/30">
                        <span>Bởi {blog?.author}</span>
                        <span>{blog?.date}</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <div className="text-center pt-14 md:pt-16">
                <button className="px-10 py-4 border border-[var(--color-primary)] text-[var(--color-primary)] font-sans uppercase tracking-[0.2em] text-[10px] hover:bg-[var(--color-primary)] hover:text-white transition-colors duration-500">
                  Tải Thêm Bài Viết
                </button>
              </div>
            </div>
          </section>

          <section className="bg-[var(--color-primary)] py-16 md:py-20 px-6">
            <div className="max-w-xl mx-auto border border-white/10 p-8 md:p-10 bg-white/5 backdrop-blur-sm text-center">
              <span className="material-symbols-outlined text-[48px] text-[var(--color-secondary)] mb-6">workspace_premium</span>
              <h3 className="font-serif text-3xl text-white mb-4">Gia Nhập Giới Tinh Hoa</h3>
              <p className="font-sans font-light text-white/70 tracking-wide text-sm mb-8 leading-relaxed">
                Đăng k? nhận bản tin để không bỏ lỡ những tập chí mới nhất về phong cách sống và nghệ thuật du lịch?.
              </p>
              <div className="flex border-b border-white/30 pb-2 focus-within:border-[var(--color-secondary)] transition-colors">
                <input
                  type="email"
                  placeholder="Địa chỉ Email của bạn"
                  className="bg-transparent w-full text-white placeholder-white/40 text-sm tracking-widest focus:outline-none"
                />
                <button className="text-[var(--color-secondary)] font-sans uppercase text-[10px] tracking-[0.2em] hover:text-white transition-colors pl-4 border-l border-white/20">
                  Đăng K?
                </button>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

