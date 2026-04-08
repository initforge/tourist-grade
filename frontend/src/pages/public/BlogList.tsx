import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MOCK_BLOGS } from '../../data/mockData';

export default function BlogList() {
  const navigate = useNavigate();

  const featuredBlog = MOCK_BLOGS[0];
  const blogs = MOCK_BLOGS.slice(1);



  return (
    <div className="w-full bg-[var(--color-background)] min-h-screen">
      {/* Magazine Header */}
      <div className="pt-24 pb-8 border-b border-[#D0C5AF]/30">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-end">
          <div>
            <h1 className="font-serif text-5xl md:text-6xl tracking-tighter text-[var(--color-primary)] mb-4">Tạp Chí <br/> Hành Trình</h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-primary)]/60 font-medium font-sans">
               Tập san số 12 • Tháng 12, 2024
            </p>
          </div>
          <nav className="hidden md:flex gap-8 text-[10px] uppercase tracking-widest text-[var(--color-primary)] font-bold">
            <button  className="border-b border-[var(--color-secondary)] pb-1">Tất cả</button>
            <button className="opacity-50 hover:opacity-100 transition-opacity">Góc Nhìn Du Lịch</button>
            <button  className="opacity-50 hover:opacity-100 transition-opacity">�i?m �?n</button>
            <button  className="opacity-50 hover:opacity-100 transition-opacity">Tr?i Nghi?m</button>
          </nav>
        </div>
      </div>

      {/* Featured Article */}
      <section className="py-16 max-w-7xl mx-auto px-6">
        <div className="group cursor-pointer" onClick={() => navigate(`/blog/${featuredBlog.id}`)}>
           <div className="relative h-[65vh] md:h-[75vh] w-full overflow-hidden border sm:border-2 border-[var(--color-primary)]">
              <img src={featuredBlog.image} alt={featuredBlog.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[2s] ease-in-out grayscale-[20%]" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
              
              <div className="absolute bottom-0 left-0 p-8 md:p-16 text-white w-full max-w-4xl">
                 <span className="text-[10px] uppercase tracking-[0.3em] text-[var(--color-secondary)] mb-6 block font-bold">{featuredBlog.category}</span>
                 <h2 className="font-serif text-3xl md:text-5xl mb-6 leading-[1.1] transition-colors">{featuredBlog.title}</h2>
                 <p className="font-sans font-light text-white/80 max-w-2xl mb-8 leading-relaxed line-clamp-2 md:line-clamp-none">
                    {featuredBlog.excerpt}
                 </p>
                 <div className="flex items-center gap-6 font-sans text-xs uppercase tracking-widest opacity-80 border-t border-white/20 pt-6">
                    <span>{featuredBlog.author}</span>
                    <span className="w-1 h-1 rounded-full bg-[var(--color-secondary)]"></span>
                    <span>{featuredBlog.date}</span>
                    <span className="w-1 h-1 rounded-full bg-[var(--color-secondary)]"></span>
                    <span>{featuredBlog.readTime}</span>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* Recent Articles Grid */}
      <section className="py-16 max-w-7xl mx-auto px-6 border-t border-[#D0C5AF]/30">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
           {blogs.map(blog => (
             <article key={blog.id} className="group cursor-pointer" onClick={() => navigate(`/blog/${blog.id}`)}>
               <div className="aspect-[4/5] overflow-hidden mb-6 border border-[#D0C5AF]/30">
                 <img src={blog.image} alt={blog.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[1.5s]" />
               </div>
               <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-secondary)] mb-3 block font-bold">{blog.category}</span>
               <h3 className="font-serif text-2xl text-[var(--color-primary)] mb-4 leading-snug group-hover:text-[var(--color-secondary)] transition-colors">{blog.title}</h3>
               <div className="flex items-center justify-between font-sans text-[10px] uppercase tracking-widest text-[var(--color-primary)]/60 pt-4 border-t border-[#D0C5AF]/30">
                 <span>Bởi {blog.author}</span>
                 <span>{blog.date}</span>
               </div>
             </article>
           ))}
        </div>
        
        <div className="text-center pt-24 pb-8">
           <button className="px-10 py-4 border border-[var(--color-primary)] text-[var(--color-primary)] font-sans uppercase tracking-[0.2em] text-[10px] hover:bg-[var(--color-primary)] hover:text-white transition-colors duration-500">
             Tải Thêm Bài Viết
           </button>
        </div>
      </section>

      {/* Newsletter Magazine */}
      <section className="bg-[var(--color-primary)] py-24 text-center px-6">
         <div className="max-w-xl mx-auto border border-white/10 p-12 bg-white/5 backdrop-blur-sm">
            <span className="material-symbols-outlined text-[48px] text-[var(--color-secondary)] mb-6">workspace_premium</span>
            <h3 className="font-serif text-3xl text-white mb-4">Gia Nhập Giới Tinh Hoa</h3>
            <p className="font-sans font-light text-white/70 tracking-wide text-sm mb-8 leading-relaxed">
               Đăng ký nhận bản tin để không bỏ lỡ những tạp chí mới nhất về phong cách sống và nghệ thuật du lịch xa xỉ.
            </p>
            <div className="flex border-b border-white/30 pb-2 focus-within:border-[var(--color-secondary)] transition-colors">
               <input 
                  type="email" 
                  placeholder="Địa chỉ Email của bạn" 
                  className="bg-transparent w-full text-white placeholder-white/40 text-sm tracking-widest focus:outline-none"
               />
               <button className="text-[var(--color-secondary)] font-sans uppercase text-[10px] tracking-[0.2em] hover:text-white transition-colors pl-4 border-l border-white/20">
                  Đăng Ký
               </button>
            </div>
         </div>
      </section>
    </div>
  );
}
