import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAppDataStore } from '@shared/store/useAppDataStore';

function renderMarkdown(content: string) {
  return content
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export default function BlogDetail() {
  const { slug } = useParams<{ slug: string }>();
  const blogs = useAppDataStore((state) => state.publicBlogs);
  const publicReady = useAppDataStore((state) => state.publicReady);

  const post = useMemo(
    () => blogs.find((item) => item.slug === slug),
    [blogs, slug],
  );
  const related = useMemo(
    () => blogs.filter((item) => item.slug !== slug).slice(0, 2),
    [blogs, slug],
  );

  if (!publicReady) {
    return <div className="public-container py-24 text-center text-sm text-[var(--color-primary)]/60">Đang tải bài viết...</div>;
  }

  if (!post) {
    return <div className="public-container py-24 text-center text-sm text-[var(--color-primary)]/60">Không tìm thấy bài viết.</div>;
  }

  const paragraphs = renderMarkdown(post.contentMarkdown ?? post.excerpt ?? '');

  return (
    <article className="public-page min-h-screen">
      <section className="relative h-[42vh] md:h-[52vh] lg:h-[58vh] w-full border-b-[6px] border-[var(--color-primary)]">
        <img
          src={post.image}
          alt={post.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </section>

      <section className="public-container max-w-4xl -mt-14 md:-mt-20 relative z-10">
        <div className="public-floating-card p-6 md:p-10 lg:p-12 text-center">
          <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-[var(--color-secondary)] block mb-5">
            {post.category}
          </span>
          <h1 className="font-serif text-3xl md:text-5xl text-[var(--color-primary)] leading-[1.15] tracking-tight mb-6 [text-wrap:balance]">
            {post.title}
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4 border-t border-[#D0C5AF]/40 pt-6 mt-6 text-[10px] font-bold font-sans uppercase tracking-[0.2em] text-[var(--color-primary)]/80">
            <span>Bài viết bởi {post.author}</span>
            <span className="hidden md:block w-1.5 h-1.5 rounded-full bg-[var(--color-secondary)]" />
            <span>{post.date}</span>
            <span className="hidden md:block w-1.5 h-1.5 rounded-full bg-[var(--color-secondary)]" />
            <span>{post.readTime ?? '5 phút đọc'}</span>
          </div>
        </div>
      </section>

      <section className="public-container max-w-3xl py-14 md:py-16 font-sans text-base md:text-lg text-[var(--color-primary)]/80 font-light leading-relaxed">
        {paragraphs.map((paragraph, index) => (
          <p key={`${post.id}-${index}`} className="mb-8 [text-wrap:pretty]">
            {index === 0 ? (
              <>
                <span className="float-left text-6xl md:text-7xl font-serif text-[var(--color-primary)] leading-[0.8] pr-4 mt-2">
                  {paragraph.charAt(0)}
                </span>
                {paragraph.slice(1)}
              </>
            ) : paragraph}
          </p>
        ))}

        <div className="border border-[#D0C5AF]/40 bg-white p-6 md:p-8 mb-16 flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="w-20 h-20 rounded-full overflow-hidden shrink-0 border border-[var(--color-secondary)]">
            <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200" alt="Author" className="w-full h-full object-cover" />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-widest text-[var(--color-primary)]/50 font-bold block mb-1">Tác Giả</span>
            <h4 className="font-serif text-xl text-[var(--color-primary)] mb-2">{post.author}</h4>
            <p className="text-sm">Biên tập viên nội dung Travela.</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 pb-4">
          <span className="px-4 py-2 bg-[var(--color-surface)] border border-[#D0C5AF]/30 text-xs font-bold uppercase tracking-widest text-[var(--color-primary)]">#Travela</span>
          <span className="px-4 py-2 bg-[var(--color-surface)] border border-[#D0C5AF]/30 text-xs font-bold uppercase tracking-widest text-[var(--color-primary)]">#{post.category.replace(/\s+/g, '')}</span>
        </div>
      </section>

      <section className="bg-[var(--color-surface)] py-16 md:py-20 border-t border-[#D0C5AF]/40">
        <div className="public-container">
          <h2 className="font-serif text-3xl text-[var(--color-primary)] mb-10 text-center">Bài Viết Liên Quan</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {related.map((item) => (
              <Link key={item.id} to={`/blog/${item.slug ?? item.id}`} className="group cursor-pointer bg-white border border-[#D0C5AF]/40 p-4 shadow-sm">
                <div className="aspect-[16/11] overflow-hidden mb-6">
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[1.5s]" />
                </div>
                <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-secondary)] mb-2 block font-bold">{item.category}</span>
                <h3 className="font-serif text-xl text-[var(--color-primary)]">{item.title}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </article>
  );
}
