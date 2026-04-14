import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Breadcrumb } from 'antd';
import { useAuthStore } from '@shared/store/useAuthStore';

type Category = 'Vận chuyển' | 'Lưu trú' | 'Vé thắng cảnh' | 'Hướng dẫn viên' | 'Các dịch vụ khác';
type AddCategory = 'Vận chuyển' | 'Vé thắng cảnh' | 'Các dịch vụ khác';

const services: Array<{
  id: string;
  name: string;
  category: Category;
  unit: string;
  priceMode: 'Báo giá' | 'Giá niêm yết';
  setup: 'Giá chung' | 'Theo độ tuổi' | '-';
  status: 'Hoạt động' | 'Dừng hoạt động';
}> = [
  { id: 'SV-HDV', name: 'Dịch vụ Hướng dẫn viên', category: 'Hướng dẫn viên', unit: 'ngày', priceMode: 'Giá niêm yết', setup: 'Giá chung', status: 'Hoạt động' },
  { id: 'SV-SGL', name: 'Phòng đơn', category: 'Lưu trú', unit: 'phòng/đêm', priceMode: 'Giá niêm yết', setup: 'Giá chung', status: 'Hoạt động' },
  { id: 'SV-DBL', name: 'Phòng đôi', category: 'Lưu trú', unit: 'phòng/đêm', priceMode: 'Giá niêm yết', setup: 'Giá chung', status: 'Hoạt động' },
  { id: 'SV-TPL', name: 'Phòng ba', category: 'Lưu trú', unit: 'phòng/đêm', priceMode: 'Giá niêm yết', setup: 'Giá chung', status: 'Hoạt động' },
  { id: 'SV-BUS', name: 'Xe tham quan', category: 'Vận chuyển', unit: 'phương tiện', priceMode: 'Báo giá', setup: '-', status: 'Hoạt động' },
  { id: 'SV-AIR', name: 'Vé máy bay', category: 'Vận chuyển', unit: 'khách', priceMode: 'Báo giá', setup: 'Theo độ tuổi', status: 'Hoạt động' },
  { id: 'SV-TKT', name: 'Vé tham quan danh thắng', category: 'Vé thắng cảnh', unit: 'vé', priceMode: 'Giá niêm yết', setup: 'Theo độ tuổi', status: 'Hoạt động' },
  { id: 'SV-INS', name: 'Bảo hiểm du lịch', category: 'Các dịch vụ khác', unit: 'khách', priceMode: 'Giá niêm yết', setup: 'Giá chung', status: 'Hoạt động' },
];

export default function ServiceList() {
  const role = useAuthStore(s => s?.user?.role || 'guest');
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<AddCategory>('Vận chuyển');
  const [setup, setSetup] = useState<'Giá chung' | 'Theo độ tuổi'>('Giá chung');
  const [transportCostMode, setTransportCostMode] = useState<'Theo người' | 'Theo phương tiện'>('Theo người');

  return (
    <div className="w-full bg-[var(--color-background)] min-h-screen">
      <main className="p-10">
        <Breadcrumb className="mb-6 text-xs" items={[
          { title: <Link to="/coordinator/services" className="text-[#D4AF37] hover:underline">Kho Dịch vụ</Link> },
          { title: <span className="text-[#2A2421]/30">Danh mục dịch vụ</span> },
        ]} />
        <div className="flex justify-between items-end mb-10 gap-6">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-bold mb-2 block">Quản lý dịch vụ</span>
            <h1 className="text-3xl font-serif text-[#2A2421]">Danh mục dịch vụ</h1>
            <p className="text-sm text-[#2A2421]/50 mt-2">Bỏ giá người lớn/trẻ em và nhà cung cấp khỏi danh sách; cấu hình giá nằm trong chi tiết và bảng giá.</p>
          </div>
          {role === 'coordinator' && (
            <button onClick={() => setOpen(true)} className="px-8 py-4 bg-[#D4AF37] text-white font-bold uppercase tracking-widest text-[10px] hover:opacity-90 shadow-lg">
              Thêm dịch vụ
            </button>
          )}
        </div>

        <div className="bg-white border border-[#D0C5AF]/20 shadow-sm overflow-hidden min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-[#D0C5AF]/30 text-stone-500">
                {['Dịch vụ', 'Phân loại', 'Đơn vị', 'Hình thức giá', 'Thiết lập giá', 'Trạng thái']?.map(h => (
                  <th key={h} className="py-4 px-6 text-[9px] uppercase tracking-widest font-bold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {services?.map(service => (
                <tr key={service?.id} className="hover:bg-stone-50/50 transition-colors">
                  <td className="py-5 px-6">
                    <p className="font-serif text-sm font-bold text-[#2A2421]">{service?.name}</p>
                    <span className="text-[10px] text-stone-400 font-mono">{service?.id}</span>
                  </td>
                  <td className="py-5 px-6"><span className="text-[9px] uppercase tracking-wider font-bold text-[#D4AF37] opacity-70 px-2 py-1 border border-[#D4AF37]/20">{service?.category}</span></td>
                  <td className="py-5 px-6 text-xs text-stone-600 font-medium">{service?.unit}</td>
                  <td className="py-5 px-6 text-xs text-stone-600">{service?.priceMode}</td>
                  <td className="py-5 px-6 text-xs text-stone-600">{service?.setup}</td>
                  <td className="py-5 px-6 text-[10px] uppercase tracking-wider font-bold text-emerald-700">{service?.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {open && (
        <div className="fixed inset-0 z-[100] flex justify-end overflow-hidden">
          <div className="absolute inset-0 bg-[#2A2421]/30 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div role="dialog" aria-modal="true" aria-labelledby="add-service-title" className="relative max-w-xl w-full h-full bg-white shadow-2xl flex flex-col">
            <div className="p-8 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
              <div>
                <h2 id="add-service-title" className="font-serif text-2xl text-[#2A2421]">Thêm dịch vụ</h2>
                <p className="text-xs text-stone-500 mt-1">Chỉ cho thêm Vận chuyển, Vé thắng cảnh và Các dịch vụ khác.</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-stone-300 hover:text-[#2A2421]"><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              <select value={category} onChange={e => setCategory(e?.target?.value as AddCategory)} className="w-full border border-stone-200 px-4 py-3 text-sm outline-none" aria-label="Phân loại">
                <option>Vận chuyển</option>
                <option>Vé thắng cảnh</option>
                <option>Các dịch vụ khác</option>
              </select>
              <input className="w-full border border-stone-200 px-4 py-3 text-sm outline-none" placeholder="T?n dịch vụ" />
              <textarea className="w-full border border-stone-200 px-4 py-3 text-sm outline-none resize-none" rows={3} placeholder="Mô tả" />

              {category === 'Vé thắng cảnh' && (
                <section className="space-y-4 border border-stone-200 p-4">
                  <input className="w-full border border-stone-200 px-4 py-3 text-sm outline-none" placeholder="Tỉnh thành" />
                  <select value={setup} onChange={e => setSetup(e?.target?.value as 'Giá chung' | 'Theo độ tuổi')} className="w-full border border-stone-200 px-4 py-3 text-sm outline-none" aria-label="Thiết lập giá">
                    <option>Giá chung</option>
                    <option>Theo độ tuổi</option>
                  </select>
                  <input className="w-full border border-stone-200 px-4 py-3 text-sm outline-none" placeholder="Nhà cung cấp" />
                  <input className="w-full border border-stone-200 px-4 py-3 text-sm outline-none" placeholder="Thông tin liên hệ (optional)" />
                  {setup === 'Giá chung' ? <input type="number" className="w-full border border-stone-200 px-4 py-3 text-sm outline-none" placeholder="Đơn giá" /> : (
                    <div className="grid grid-cols-2 gap-4">
                      <input type="number" className="border border-stone-200 px-4 py-3 text-sm outline-none" placeholder="Giá người lớn" />
                      <input type="number" className="border border-stone-200 px-4 py-3 text-sm outline-none" placeholder="Giá trẻ em" />
                    </div>
                  )}
                </section>
              )}

              {category === 'Vận chuyển' && (
                <section className="space-y-4 border border-stone-200 p-4">
                  <select className="w-full border border-stone-200 px-4 py-3 text-sm outline-none" aria-label="Loại phương tiện">
                    <option>Xe</option>
                    <option>Máy bay</option>
                    <option>Tàu thuyền</option>
                  </select>
                  <input className="w-full border border-stone-200 px-4 py-3 text-sm outline-none" placeholder="Khu vực hoạt động" />
                  <select className="w-full border border-stone-200 px-4 py-3 text-sm outline-none" aria-label="Hình thức giá">
                    <option>Báo giá</option>
                    <option>Giá niêm yết</option>
                  </select>
                  <select value={transportCostMode} onChange={e => setTransportCostMode(e?.target?.value as 'Theo người' | 'Theo phương tiện')} className="w-full border border-stone-200 px-4 py-3 text-sm outline-none" aria-label="Cách tính chi phí">
                    <option>Theo người</option>
                    <option>Theo phương tiện</option>
                  </select>
                  {transportCostMode === 'Theo phương tiện' && (
                    <div className="grid grid-cols-2 gap-3">
                      <input className="border border-stone-200 px-3 py-2 text-sm" placeholder="Tên loại" />
                      <input className="border border-stone-200 px-3 py-2 text-sm" placeholder="Sức chứa" />
                    </div>
                  )}
                </section>
              )}

              {category === 'Các dịch vụ khác' && (
                <section className="space-y-4 border border-stone-200 p-4">
                  <input type="number" className="w-full border border-stone-200 px-4 py-3 text-sm outline-none" placeholder="Đơn giá" />
                  <input className="w-full border border-stone-200 px-4 py-3 text-sm outline-none" placeholder="Nhà cung cấp" />
                  <input className="w-full border border-stone-200 px-4 py-3 text-sm outline-none" placeholder="Thông tin liên hệ (optional)" />
                  <select className="w-full border border-stone-200 px-4 py-3 text-sm outline-none" aria-label="Công thức tính số lần"><option>Khàng có</option><option>Giá trị mặc định</option><option>Theo ngày</option></select>
                  <select className="w-full border border-stone-200 px-4 py-3 text-sm outline-none" aria-label="Công thức tính số lượng"><option>Khàng có</option><option>Giá trị mặc định</option><option>Theo người</option></select>
                </section>
              )}
            </div>
            <div className="p-8 border-t border-stone-100 bg-stone-50/50 flex gap-4">
              <button onClick={() => setOpen(false)} className="flex-1 py-4 border border-[#2A2421] text-[10px] uppercase tracking-[0.2em] font-bold">Hủy bỏ</button>
              <button onClick={() => setOpen(false)} className="flex-1 py-4 bg-[#2A2421] text-white text-[10px] uppercase tracking-[0.2em] font-bold">Lưu dịch vụ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

