export interface BlogPost {
  id: number;
  category: string;
  title: string;
  excerpt?: string;
  author: string;
  date: string;
  readTime?: string;
  image: string;
}

export const blogPosts: BlogPost[] = [
  {
    id: 1,
    category: 'Goc Nhin Du Lich',
    title: 'Amanoi Vinh Hy: Tuyen Ngon Khep Kin Cua Gioi Sieu Thuong Luu',
    excerpt:
      'Kham pha su tinh lang tinh mich nhung trang le tai mot trong nhung khu nghi duong biet lap va rieng tu nhat the gioi, noi hoa quyen hoan hao giua Nui Chua va Vinh Vinh Hy?.',
    author: 'Le Minh Khoi',
    date: '10 Thg 12, 2024',
    readTime: '6 Phut Doc',
    image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=2000',
  },
  {
    id: 2,
    category: 'Destinations',
    title: 'Dem Thuong Luu Tai Vinh Ha Long',
    author: 'Hoang My',
    date: '02 Thg 12, 2024',
    image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=800',
  },
  {
    id: 3,
    category: 'Experiences',
    title: 'Nghe Thuat Tra Dao Cung Dinh Hue',
    author: 'Nhat Nam',
    date: '28 Thg 11, 2024',
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=800',
  },
  {
    id: 4,
    category: 'Goc Nhin Du Lich',
    title: 'Tim Lai Dau Xua Giua Long Hoi An',
    author: 'Mai Quynh',
    date: '15 Thg 11, 2024',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800',
  },
];
