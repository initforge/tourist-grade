import React, { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';

// Defines the 6 core categories from Docs
type ServiceType = 
  | 'Vận chuyển' 
  | 'Chi phí ăn' 
  | 'Khách sạn' 
  | 'Vé thắng cảnh' 
  | 'Hướng dẫn viên (HDV)' 
  | 'Chi phí khác';

// Pricing Models for Transit
type PricingModel = 'Báo giá từ NCC' | 'Chọn từ danh mục' | 'Nhập tay';

interface ServiceTemplate {
  id: string;
  name: string;
  type: ServiceType;
  province?: string; // For Sightseeing
  capacity?: string; // For Transit/Hotel
  description?: string;
}

interface SupplierAssignment {
  serviceId: string;
  supplierName: string;
  pricingModel: PricingModel;
  priceAdult: number;
  priceChild: number;
  unit: string;
  active: boolean;
}

const INITIAL_TEMPLATES: ServiceTemplate[] = [
  { id: 'TMP-001', name: 'Phòng Suite Heritage', type: 'Khách sạn', capacity: '2 Người lớn' },
  { id: 'TMP-002', name: 'Xe Limousine 9 chỗ', type: 'Vận chuyển', capacity: '9 Chỗ' },
  { id: 'TMP-003', name: 'Vé tham quan Vịnh Hạ Long', type: 'Vé thắng cảnh', province: 'Quảng Ninh' },
  { id: 'TMP-004', name: 'HDV Tiếng Anh - Chuyên tuyến Tây Bắc', type: 'Hướng dẫn viên (HDV)' },
];

const INITIAL_ASSIGNMENTS: SupplierAssignment[] = [
  { serviceId: 'TMP-001', supplierName: 'Khách Sạn Di Sản Việt', pricingModel: 'Chọn từ danh mục', priceAdult: 3500000, priceChild: 1750000, unit: 'Đêm', active: true },
  { serviceId: 'TMP-002', supplierName: 'Vận Tải Xuyên Việt', pricingModel: 'Báo giá từ NCC', priceAdult: 4500000, priceChild: 4500000, unit: 'Chuyến', active: true },
  { serviceId: 'TMP-003', supplierName: 'Travela Ops', pricingModel: 'Chọn từ danh mục', priceAdult: 250000, priceChild: 150000, unit: 'Vé', active: true },
];

export default function ServiceList() {
  const { user } = useAuthStore();
  const role = user?.role || 'guest';
  
  const [templates] = useState<ServiceTemplate[]>(INITIAL_TEMPLATES);
  const [assignments] = useState<SupplierAssignment[]>(INITIAL_ASSIGNMENTS);
  const [activeTab, setActiveTab] = useState<'all' | 'Vận chuyển' | 'Khách sạn' | 'Vé thắng cảnh'>('all');
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<SupplierAssignment & ServiceTemplate>>({
    type: 'Khách sạn',
    pricingModel: 'Chọn từ danh mục'
  });

  const filteredAssignments = assignments.filter(a => {
    const template = templates.find(t => t.id === a.serviceId);
    if (activeTab === 'all') return true;
    return template?.type === activeTab;
  });

  const getTemplate = (id: string) => templates.find(t => t.id === id);

  return (
    <div className="w-full bg-[var(--color-background)] min-h-screen">
      <main className="p-10">
        <div className="flex justify-between items-end mb-10">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-bold mb-2 block">Quản lý Kho Dịch Vụ</span>
            <h1 className="text-3xl font-serif text-[#2A2421]">Danh Mục Dịch Vụ & Bảng Giá</h1>
          </div>
          {role === 'coordinator' && (
            <button onClick={() => setIsDrawerOpen(true)} className="px-8 py-4 bg-[#D4AF37] text-white font-bold uppercase tracking-widest text-[10px] hover:opacity-90 shadow-lg">Thêm Dịch Vụ Mới</button>
          )}
        </div>

        <div className="flex gap-8 border-b border-[#D0C5AF]/30 mb-8 overflow-x-auto pb-1">
          {['all', 'Khách sạn', 'Vận chuyển', 'Vé thắng cảnh', 'Hướng dẫn viên (HDV)', 'Chi phí ăn'].map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab as 'all' | 'Vận chuyển' | 'Khách sạn' | 'Vé thắng cảnh')}
              className={`pb-4 px-2 text-[10px] uppercase tracking-widest font-bold transition-all whitespace-nowrap ${activeTab === tab ? 'border-b-2 border-[#D4AF37] text-[#2A2421]' : 'text-stone-400 hover:text-stone-600'}`}
            >
              {tab === 'all' ? 'Tất cả' : tab}
            </button>
          ))}
        </div>

        <div className="bg-white border border-[#D0C5AF]/20 shadow-sm overflow-hidden min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-[#D0C5AF]/30 text-stone-500">
                <th className="py-4 px-6 text-[9px] uppercase tracking-widest font-bold">Dịch vụ</th>
                <th className="py-4 px-6 text-[9px] uppercase tracking-widest font-bold">Phân Loại</th>
                <th className="py-4 px-6 text-[9px] uppercase tracking-widest font-bold">Nhà Cung Cấp</th>
                <th className="py-4 px-6 text-[9px] uppercase tracking-widest font-bold">Hình thức giá</th>
                <th className="py-4 px-6 text-[9px] uppercase tracking-widest font-bold text-right">Giá Người Lớn</th>
                <th className="py-4 px-6 text-[9px] uppercase tracking-widest font-bold text-right">Giá Trẻ Em</th>
                <th className="py-4 px-6 text-[9px] uppercase tracking-widest font-bold text-center">Trạng Thái</th>
                <th className="py-4 px-6"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredAssignments.map((a, idx) => {
                const template = getTemplate(a.serviceId);
                return (
                  <tr key={idx} className="hover:bg-stone-50/50 transition-colors group">
                    <td className="py-5 px-6">
                      <p className="font-serif text-sm font-bold text-[#2A2421]">{template?.name}</p>
                      {template?.capacity && <span className="text-[10px] text-stone-400">Sức chứa: {template.capacity}</span>}
                      {template?.province && <span className="text-[10px] text-stone-400 ml-2 italic">({template.province})</span>}
                    </td>
                    <td className="py-5 px-6">
                      <span className="text-[9px] uppercase tracking-wider font-bold text-[#D4AF37] opacity-60 px-2 py-1 border border-[#D4AF37]/20">{template?.type}</span>
                    </td>
                    <td className="py-5 px-6 text-xs text-stone-600 font-medium">{a.supplierName}</td>
                    <td className="py-5 px-6 text-xs italic text-stone-400">{a.pricingModel}</td>
                    <td className="py-5 px-6 text-right font-serif font-bold text-[#2C5545]">{a.priceAdult.toLocaleString()} đ</td>
                    <td className="py-5 px-6 text-right font-serif font-bold text-stone-400">{a.priceChild.toLocaleString()} đ</td>
                    <td className="py-5 px-6 text-center">
                      <span className={`w-2 h-2 inline-block rounded-full ${a.active ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    </td>
                    <td className="py-5 px-6 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                       <button className="text-stone-300 hover:text-stone-900 transition-colors mr-3"><span className="material-symbols-outlined text-[18px]">edit</span></button>
                       <button className="text-stone-300 hover:text-red-600 transition-colors"><span className="material-symbols-outlined text-[18px]">delete</span></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>

      {/* Redesigned Add Service Drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end overflow-hidden">
          <div className="absolute inset-0 bg-[#2A2421]/30 backdrop-blur-sm transition-opacity" onClick={() => setIsDrawerOpen(false)}></div>
          <div className="relative max-w-lg w-full h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
            <div className="p-8 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
              <h2 className="font-serif text-2xl text-[#2A2421]">Thêm Dịch Vụ & Bảng Giá</h2>
              <button onClick={() => setIsDrawerOpen(false)} className="text-stone-300 hover:text-[#2A2421] transition-colors"><span className="material-symbols-outlined">close</span></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-10">
              <section className="space-y-6">
                <label className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-black border-b border-[#D4AF37]/20 pb-2 block">Thông Tin Cơ Bản</label>
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="text-[10px] text-stone-400 uppercase tracking-widest mb-2 block">Loại Dịch Vụ</label>
                    <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value as ServiceType})} className="w-full border-0 border-b border-stone-200 py-3 text-sm focus:ring-0 focus:border-[#D4AF37] outline-none">
                      <option value="Vận chuyển">Vận chuyển (Xe hơi/Máy bay/Tàu)</option>
                      <option value="Khách sạn">Khách sạn / Lưu trú / Du thuyền</option>
                      <option value="Chi phí ăn">Chi phí ăn uống / Nhà hàng</option>
                      <option value="Vé thắng cảnh">Vé tham quan / Vé thắng cảnh</option>
                      <option value="Hướng dẫn viên (HDV)">Hướng dẫn viên (HDV)</option>
                      <option value="Chi phí khác">Chi phí khác</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-stone-400 uppercase tracking-widest mb-2 block">Tên Dịch Vụ (Mẫu)</label>
                    <input className="w-full border-0 border-b border-stone-200 py-3 text-sm focus:ring-0 focus:border-[#D4AF37] outline-none placeholder:text-stone-300" placeholder="VD: Xe Limousine 29 chỗ đời mới" />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="text-[10px] text-stone-400 uppercase tracking-widest mb-2 block">Tỉnh / Thành</label>
                      <input className="w-full border-0 border-b border-stone-200 py-3 text-sm focus:ring-0 focus:border-[#D4AF37] outline-none" placeholder="VD: Quảng Ninh" />
                    </div>
                    <div>
                      <label className="text-[10px] text-stone-400 uppercase tracking-widest mb-2 block">Sức chứa / Quy mô</label>
                      <input className="w-full border-0 border-b border-stone-200 py-3 text-sm focus:ring-0 focus:border-[#D4AF37] outline-none" placeholder="VD: 29 chỗ / 2NL+1TE" />
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-6">
                <label className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-black border-b border-[#D4AF37]/20 pb-2 block">Cấu Hình Giá NCC</label>
                <div className="grid grid-cols-1 gap-6">
                   <div>
                      <label className="text-[10px] text-stone-400 uppercase tracking-widest mb-2 block">Nhà Cung Cấp</label>
                      <input className="w-full border-0 border-b border-stone-200 py-3 text-sm focus:ring-0 focus:border-[#D4AF37] outline-none" placeholder="VD: Khách Sạn Di Sản Việt" />
                   </div>
                   <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="text-[10px] text-stone-400 uppercase tracking-widest mb-2 block">Hình thức giá</label>
                        <select value={formData.pricingModel} onChange={(e) => setFormData({...formData, pricingModel: e.target.value as PricingModel})} className="w-full border-0 border-b border-stone-200 py-3 text-sm focus:ring-0 focus:border-[#D4AF37] outline-none">
                          <option value="Chọn từ danh mục">Chọn từ danh mục</option>
                          <option value="Báo giá từ NCC">Báo giá từng đoàn</option>
                          <option value="Nhập tay">Nhập tay trực tiếp</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-stone-400 uppercase tracking-widest mb-2 block">Đơn vị tính</label>
                        <input className="w-full border-0 border-b border-stone-200 py-3 text-sm focus:ring-0 focus:border-[#D4AF37] outline-none" placeholder="VD: Đêm / Khách / Đoàn" />
                      </div>
                   </div>
                   <div className="grid grid-cols-2 gap-6 p-4 bg-stone-50 border-l-2 border-[#D4AF37]">
                      <div>
                        <label className="text-[10px] text-[#2C5545] uppercase tracking-widest mb-2 block font-bold">Giá Người Lớn (Adult)</label>
                        <input type="number" className="w-full bg-transparent border-0 border-b border-stone-200 py-3 text-lg font-serif font-bold focus:ring-0 focus:border-[#2C5545] outline-none" placeholder="0" />
                      </div>
                      <div>
                        <label className="text-[10px] text-stone-400 uppercase tracking-widest mb-2 block font-bold">Giá Trẻ Em (Child)</label>
                        <input type="number" className="w-full bg-transparent border-0 border-b border-stone-200 py-3 text-lg font-serif font-bold focus:ring-0 focus:border-[#D4AF37] outline-none opacity-60" placeholder="0" />
                      </div>
                   </div>
                </div>
              </section>
            </div>

            <div className="p-8 border-t border-stone-100 bg-stone-50/50 flex gap-4">
              <button onClick={() => setIsDrawerOpen(false)} className="flex-1 py-4 border border-[#2A2421] text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-white transition-colors">Hủy Bỏ</button>
              <button className="flex-1 py-4 bg-[#2A2421] text-white text-[10px] uppercase tracking-[0.2em] font-bold hover:opacity-95 shadow-xl shadow-[#2A2421]/20">Lưu Dịch Vụ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
