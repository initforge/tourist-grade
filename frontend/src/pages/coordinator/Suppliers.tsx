import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Breadcrumb } from 'antd';
import { useAuthStore } from '../../store/useAuthStore';

type SupplierType = 'lodging' | 'transport' | 'restaurant';

interface Supplier {
  id: string;
  name: string;
  email: string;
  type: SupplierType;
  region: string;
  rating: number;
  active: boolean;
  image: string;
}

const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: '#SUP-012',
    name: 'Khách Sạn Di Sản Việt',
    email: 'contact@heritage-hanoi.vn',
    type: 'lodging',
    region: 'Hà Nội',
    rating: 4.8,
    active: true,
    image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=1200'
  },
  {
    id: '#SUP-015',
    name: 'Vận Tải Xuyên Việt',
    email: 'ops@vantaiviet.com',
    type: 'transport',
    region: 'Sapa',
    rating: 4.5,
    active: true,
    image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1200'
  },
  {
    id: '#SUP-021',
    name: 'The Lotus Dining Room',
    email: 'reserve@lotus-dining.vn',
    type: 'restaurant',
    region: 'Hà Nội',
    rating: 4.9,
    active: false,
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1200'
  }
];

export default function AdminSuppliers() {
  const { user } = useAuthStore();
  const role = user?.role || 'guest';
  
  const [suppliers, setSuppliers] = useState<Supplier[]>(INITIAL_SUPPLIERS);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState<Partial<Supplier>>({});

  const filteredSuppliers = suppliers.filter(sup => {
    const matchesSearch = sup.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          sup.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter ? sup.type === typeFilter : true;
    return matchesSearch && matchesType;
  });

  const getTypeLabel = (type: SupplierType) => {
    switch(type) {
      case 'lodging': return <span className="px-3 py-1 bg-secondary/10 text-secondary text-[0.65rem] font-sans uppercase tracking-wider font-bold">Lưu trú</span>;
      case 'transport': return <span className="px-3 py-1 bg-primary/5 text-primary/60 text-[0.65rem] font-sans uppercase tracking-wider font-bold">Vận chuyển</span>;
      case 'restaurant': return <span className="px-3 py-1 bg-tertiary/10 text-tertiary text-[0.65rem] font-sans uppercase tracking-wider font-bold">Nhà hàng</span>;
    }
  };

  const openDrawer = (sup: Supplier | null = null) => {
    if (sup) {
      setEditingSupplier(sup);
      setFormData(sup);
    } else {
      setEditingSupplier(null);
      setFormData({
        name: '', email: '', type: 'lodging', region: '', active: true, image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=1200', rating: 5.0
      });
    }
    setIsDrawerOpen(true);
  };

  const handleSave = () => {
    if (editingSupplier) {
      setSuppliers(suppliers.map(s => s.id === editingSupplier.id ? { ...s, ...formData } as Supplier : s));
    } else {
      const newSup: Supplier = {
        ...(formData as Supplier),
        id: `#SUP-0${suppliers.length + 50}`,
      };
      setSuppliers([...suppliers, newSup]);
    }
    setIsDrawerOpen(false);
  };

  const handleDelete = (id: string) => {
    setSuppliers(suppliers.filter(s => s.id !== id));
  };

  const handleToggleActive = (id: string) => {
    setSuppliers(suppliers.map(s => s.id === id ? { ...s, active: !s.active } : s));
  };

  return (
    <div className="w-full bg-[var(--color-background)] min-h-screen relative">
      <main className="min-h-screen flex flex-col pb-20">
        <div className="p-10 flex-1">
          <Breadcrumb
            className="mb-6 text-xs"
            items={[
              { title: <Link to="/coordinator/suppliers" className="text-[var(--color-primary)]/50 hover:text-[var(--color-primary)]">Đối tác (NCC)</Link> },
              { title: <span className="text-[var(--color-primary)]/30">Danh sách</span> },
            ]}
          />
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
            <div>
              <span className="label-md font-sans uppercase tracking-[0.2em] text-secondary mb-2 block">Cơ sở dữ liệu (CRM)</span>
              <h3 className="text-3xl font-serif text-primary tracking-tight">Đối tác & Nhà cung cấp</h3>
            </div>
            {role === 'coordinator' && (
              <button onClick={() => openDrawer()} className="bg-tertiary text-white px-8 py-4 font-sans uppercase tracking-widest text-xs hover:opacity-90 transition-opacity flex items-center space-x-2">
                <span className="material-symbols-outlined text-sm">add</span>
                <span>Thêm đối tác</span>
              </button>
            )}
          </div>

          <div className="bg-white p-6 mb-8 flex flex-col md:flex-row items-center gap-6 border-l-4 border-secondary shadow-sm">
            <div className="relative flex-1 w-full">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary/40">search</span>
              <input 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-transparent border-b border-outline-variant focus:border-secondary outline-none font-sans text-sm transition-colors" 
                placeholder="Tìm kiếm đối tác hoặc mã NCC..." 
                type="text"
              />
            </div>
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="relative min-w-[180px]">
                <select 
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full appearance-none bg-transparent border-b border-outline-variant py-3 pr-8 focus:border-secondary outline-none font-sans text-sm cursor-pointer"
                >
                  <option value="">Phân loại: Tất cả</option>
                  <option value="lodging">Lưu trú</option>
                  <option value="transport">Vận chuyển</option>
                  <option value="restaurant">Nhà hàng</option>
                </select>
                <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-primary/40">expand_more</span>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-sm border border-outline-variant/30">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant/40">
                  <th className="px-6 py-5 font-sans uppercase tracking-widest text-[0.65rem] text-primary/60 font-semibold">Mã NCC</th>
                  <th className="px-6 py-5 font-sans uppercase tracking-widest text-[0.65rem] text-primary/60 font-semibold">Tên đối tác</th>
                  <th className="px-6 py-5 font-sans uppercase tracking-widest text-[0.65rem] text-primary/60 font-semibold">Phân loại</th>
                  <th className="px-6 py-5 font-sans uppercase tracking-widest text-[0.65rem] text-primary/60 font-semibold">Khu vực hoạt động</th>
                  <th className="px-6 py-5 font-sans uppercase tracking-widest text-[0.65rem] text-primary/60 font-semibold">Trạng thái</th>
                  <th className="px-6 py-5 font-sans uppercase tracking-widest text-[0.65rem] text-primary/60 font-semibold text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {filteredSuppliers.map(sup => (
                  <tr key={sup.id} className="hover:bg-surface-container-low transition-colors group">
                    <td className="px-6 py-6 font-sans text-xs text-primary/70">{sup.id}</td>
                    <td className="px-6 py-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 overflow-hidden bg-surface-container-high border border-outline-variant/30 shrink-0">
                          <img alt={sup.name} className={`w-full h-full object-cover ${!sup.active ? 'grayscale opacity-50' : ''}`} src={sup.image} />
                        </div>
                        <div>
                          <p className={`font-serif text-sm font-bold ${sup.active ? 'text-primary' : 'text-primary/50 line-through'}`}>{sup.name}</p>
                          <p className="text-[0.65rem] font-sans text-primary/50">{sup.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      {getTypeLabel(sup.type)}
                    </td>
                    <td className="px-6 py-6 font-sans text-xs">{sup.type === 'transport' ? sup.region : '—'}</td>
                    <td className="px-6 py-6">
                      <div className="flex items-center space-x-2">
                        <span className={`w-2 h-2 rounded-full ${sup.active ? 'bg-tertiary' : 'bg-red-500'}`}></span>
                        <span className={`text-xs font-sans font-medium ${sup.active ? 'text-tertiary' : 'text-red-500'}`}>
                          {sup.active ? 'Hoạt động' : 'Ngừng hợp tác'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-right">
                      {role === 'coordinator' && (
                        <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button onClick={() => openDrawer(sup)} className="text-secondary hover:text-primary transition-colors" title="Chỉnh sửa">
                             <span className="material-symbols-outlined text-[18px]">edit</span>
                           </button>
                           <button onClick={() => handleToggleActive(sup.id)} className={`${sup.active ? 'text-orange-500' : 'text-tertiary'} transition-colors`} title={sup.active ? "Ngừng hợp tác" : "Mở lại"}>
                             <span className="material-symbols-outlined text-[18px]">{sup.active ? 'block' : 'lock_open'}</span>
                           </button>
                           <button onClick={() => handleDelete(sup.id)} className="text-error hover:text-red-800 transition-colors" title="Xóa hẳn">
                             <span className="material-symbols-outlined text-[18px]">delete</span>
                           </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredSuppliers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-primary/50 text-sm">
                      Không tìm thấy nhà cung cấp nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Slide-over Drawer for Add/Edit Supplier */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm transition-opacity" onClick={() => setIsDrawerOpen(false)}></div>
          <div className="absolute inset-y-0 right-0 max-w-md w-full flex">
            <div className="w-full h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
              <div className="px-6 py-6 border-b border-outline-variant/30 flex items-center justify-between bg-surface-container-low">
                <h2 className="font-serif text-2xl text-primary">
                  {editingSupplier ? 'Sửa Thông Tin Đối Tác' : 'Thêm Nhà Cung Cấp Mới'}
                </h2>
                <button onClick={() => setIsDrawerOpen(false)} className="text-primary/50 hover:text-primary transition-colors">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-primary/60 font-medium mb-2 block">Tên đối tác (Pháp nhân)</label>
                    <input 
                      type="text" 
                      value={formData.name || ''}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full border border-outline-variant/50 p-3 text-sm focus:border-secondary outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-primary/60 font-medium mb-2 block">Email liên hệ đặt dịch vụ</label>
                    <input 
                      type="email" 
                      value={formData.email || ''}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full border border-outline-variant/50 p-3 text-sm focus:border-secondary outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-primary/60 font-medium mb-2 block">Phân loại Dịch vụ cung cấp</label>
                    <select 
                      value={formData.type || 'lodging'}
                      onChange={(e) => setFormData({...formData, type: e.target.value as SupplierType})}
                      className="w-full border border-outline-variant/50 p-3 text-sm focus:border-secondary outline-none appearance-none bg-white"
                    >
                      <option value="lodging">Khách sạn / Lưu trú</option>
                      <option value="transport">Đội xe / Hãng hàng không / Du thuyền</option>
                      <option value="restaurant">Nhà hàng / Ẩm thực</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-primary/60 font-medium mb-2 block">Khu vực hoạt động cốt lõi</label>
                    <input 
                      type="text" 
                      value={formData.region || ''}
                      onChange={(e) => setFormData({...formData, region: e.target.value})}
                      className="w-full border border-outline-variant/50 p-3 text-sm focus:border-secondary outline-none"
                    />
                  </div>
                  <div className="pt-4 border-t border-outline-variant/30 flex items-center justify-between">
                    <label className="text-sm text-primary font-medium">Trạng thái hợp đồng</label>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={formData.active !== false} onChange={(e) => setFormData({...formData, active: e.target.checked})} />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-tertiary"></div>
                      <span className="ml-3 text-xs font-medium text-primary">{formData.active !== false ? 'Còn hiệu lực' : 'Đã thanh lý'}</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-outline-variant/30 bg-surface-container-low flex gap-4">
                <button onClick={() => setIsDrawerOpen(false)} className="flex-1 px-4 py-3 border border-primary text-primary text-xs font-bold uppercase tracking-widest hover:bg-white transition-colors">
                  Hủy
                </button>
                <button onClick={handleSave} className="flex-1 px-4 py-3 bg-primary text-white text-xs font-bold uppercase tracking-widest hover:bg-black transition-colors">
                  {editingSupplier ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
