import { useState } from 'react';
import { Modal, message } from 'antd';

// ── Types ────────────────────────────────────────────────────────────────────

export interface SpecialDay {
  id: string;
  name: string;
  occasion: string;
  startDate: string;
  endDate: string;
  note?: string;
}

// ── Mock ────────────────────────────────────────────────────────────────────────

const mockSpecialDays: SpecialDay[] = [
  {
    id: 'SD001',
    name: 'Tết Dương lịch 2026',
    occasion: 'Nghỉ lễ',
    startDate: '2026-01-01',
    endDate: '2026-01-01',
    note: 'Nghỉ 1 ngày',
  },
  {
    id: 'SD002',
    name: 'Tết Nguyên Đán 2026',
    occasion: 'Tết lớn',
    startDate: '2026-02-17',
    endDate: '2026-02-23',
    note: 'Nghỉ 7 ngày — cao điểm du lịch',
  },
  {
    id: 'SD003',
    name: 'Giỗ Tổ Hùng Vương 2026',
    occasion: 'Nghỉ lễ',
    startDate: '2026-04-10',
    endDate: '2026-04-10',
    note: 'Kết hợp nghỉ lễ 30/4',
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso)?.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function SpecialDays() {
  const [items, setItems] = useState<SpecialDay[]>(mockSpecialDays);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<SpecialDay | null>(null);
  const [form, setForm] = useState<Partial<SpecialDay>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filtered = items?.filter(s =>
    s?.name?.toLowerCase()?.includes(search?.toLowerCase()) ||
    s?.occasion?.toLowerCase()?.includes(search?.toLowerCase())
  );

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form?.name?.trim()) e.name = 'Tên ngày đặc biệt không được trống';
    if (!form?.occasion?.trim()) e.occasion = 'Dịp đặc biệt không được trống';
    if (!form?.startDate) e.startDate = 'Ngày bắt đầu không được trống';
    if (!form?.endDate) e.endDate = 'Ngày kết thúc không được trống';
    setErrors(e);
    return Object.keys(e)?.length === 0;
  };

  const openCreate = () => {
    setForm({});
    setErrors({});
    setEditing({ id: '', name: '', occasion: '', startDate: '', endDate: '', note: '' } as SpecialDay);
  };

  const openEdit = (item: SpecialDay) => {
    setForm({ ...item });
    setErrors({});
    setEditing(item);
  };

  const handleSave = () => {
    if (!validate() || !editing) return;
    if (editing?.id) {
      setItems(prev => prev?.map(x => x.id === editing?.id ? { ...x, ...form } as SpecialDay : x));
      message?.success('Cập nhật thành công!');
    } else {
      const newItem: SpecialDay = { ...form, id: `SD${String(items?.length + 1)?.padStart(3, '0')}` } as SpecialDay;
      setItems(prev => [...prev, newItem]);
      message?.success('Thêm mới thành công!');
    }
    setEditing(null);
    setForm({});
  };

  const handleDelete = (item: SpecialDay) => {
    Modal?.confirm({
      title: 'Xóa ngày đặc biệt',
      content: `Xóa "${item?.name}"?`,
      okText: 'Xóa',
      okButtonProps: { danger: true },
      cancelText: 'Hủy',
      onOk: () => {
        setItems(prev => prev?.filter(x => x?.id !== item?.id));
        message?.success('Đã xóa!');
      },
    });
  };

  return (
    <div className="w-full bg-[#F3F3F3] min-h-full">
      <div className="p-6 md:p-10">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div className="space-y-1.5">
            <p className="font-['Inter'] text-[10px] uppercase tracking-[0.2em] text-[#D4AF37] font-bold">Danh mục</p>
            <h1 className="font-['Noto_Serif'] text-3xl text-[#2A2421] leading-tight">Ngày đặc biệt</h1>
            <p className="text-xs text-[#2A2421]/50">Quản lý các ngày lễ, dịp đặc biệt trong năm?.</p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-[#2A2421] text-white px-5 py-2.5 text-xs font-['Inter'] uppercase tracking-widest hover:bg-[#D4AF37] transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            Thêm ngày đặc biệt
          </button>
        </div>

        {/* Search */}
        <div className="bg-white border border-[#D0C5AF]/20 p-4 mb-6 flex items-center gap-3">
          <span className="material-symbols-outlined text-[#2A2421]/40 text-[18px]">search</span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e?.target?.value)}
            placeholder="Tìm theo tên hoặc dịp..."
            className="flex-1 text-sm outline-none bg-transparent"
          />
        </div>

        {/* Table */}
        <div className="bg-white border border-[#D0C5AF]/20 overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-[#FAFAF5] border-b border-[#D0C5AF]/30">
                {['Tên ngày đặc biệt', 'Dịp đặc biệt', 'Ngày bắt đầu', 'Ngày kết thúc', 'Ghi chú', 'Hành động']?.map(h => (
                  <th key={h} className="px-5 py-4 text-[10px] uppercase tracking-widest text-[#2A2421] font-bold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D0C5AF]/15">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-sm text-[#2A2421]/40">
                    <span className="material-symbols-outlined text-4xl block mb-2 text-[#D0C5AF]">event</span>
                    Không có ngày đặc biệt nào
                  </td>
                </tr>
              ) : filtered?.map(item => (
                <tr key={item?.id} className="hover:bg-[#FAFAF5] transition-colors">
                  <td className="px-5 py-4 font-medium text-sm font-['Noto_Serif'] text-[#2A2421]">{item?.name}</td>
                  <td className="px-5 py-4 text-sm text-[#2A2421]/70">{item?.occasion}</td>
                  <td className="px-5 py-4 text-sm text-[#2A2421]/70">{fmtDate(item?.startDate)}</td>
                  <td className="px-5 py-4 text-sm text-[#2A2421]/70">{fmtDate(item?.endDate)}</td>
                  <td className="px-5 py-4 text-sm text-[#2A2421]/50 max-w-[160px] truncate">{item?.note ?? '—'}</td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(item)}
                        className="px-2 py-1 text-[10px] font-bold border border-[#D0C5AF] text-[#2A2421]/60 hover:bg-gray-50">
                        Sửa
                      </button>
                      <button onClick={() => handleDelete(item)}
                        className="px-2 py-1 text-[10px] font-bold border border-red-300 text-red-600 hover:bg-red-50">
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-[11px] text-[#2A2421]/40">Hiển thị {filtered?.length} / {items?.length} ngày đặc biệt</p>
      </div>

      {/* Drawer */}
      {editing && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-[#2A2421]/50 backdrop-blur-sm" onClick={() => setEditing(null)}></div>
          <div className="absolute inset-y-0 right-0 max-w-lg w-full flex">
            <div className="w-full h-full bg-white shadow-2xl flex flex-col">
              <div className="px-6 py-5 border-b border-[#D0C5AF]/30 flex items-center justify-between shrink-0">
                <div>
                  <p className="font-['Inter'] text-[10px] uppercase tracking-[0.2em] text-[#D4AF37] font-bold">Danh mục</p>
                  <h2 className="font-['Noto_Serif'] text-xl text-[#2A2421]">
                    {editing?.id ? 'Chỉnh sửa ngày đặc biệt' : 'Thêm ngày đặc biệt'}
                  </h2>
                </div>
                <button onClick={() => setEditing(null)} className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full">
                  <span className="material-symbols-outlined text-[#2A2421]/60">close</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-[#2A2421]/60 font-bold mb-2 block">Tên ngày đặc biệt *</label>
                  <input type="text" value={form?.name ?? ''} onChange={e => setForm({ ...form, name: e?.target?.value })}
                    className={`w-full border p-3 text-sm outline-none ${errors?.name ? 'border-red-400' : 'border-[#D0C5AF]/40 focus:border-[#D4AF37]'}`}
                    placeholder="VD: Tết Nguyên Đán 2026" />
                  {errors?.name && <p className="text-red-500 text-xs mt-1">{errors?.name}</p>}
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-widest text-[#2A2421]/60 font-bold mb-2 block">Dịp đặc biệt *</label>
                  <select value={form?.occasion ?? ''} onChange={e => setForm({ ...form, occasion: e?.target?.value })}
                    className={`w-full border p-3 text-sm outline-none appearance-none ${errors?.occasion ? 'border-red-400' : 'border-[#D0C5AF]/40 focus:border-[#D4AF37]'}`}>
                    <option value="">Chọn dịp...</option>
                    <option value="Tết lớn">Tết lớn</option>
                    <option value="Nghỉ lễ">Nghỉ lễ</option>
                    <option value="Mùa cao điểm">Mùa cao điểm</option>
                    <option value="Lễ hội">Lễ hội</option>
                    <option value="Khác">Khác</option>
                  </select>
                  {errors?.occasion && <p className="text-red-500 text-xs mt-1">{errors?.occasion}</p>}
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-[10px] uppercase tracking-widest text-[#2A2421]/60 font-bold mb-2 block">Ngày bắt đầu *</label>
                    <input type="date" value={form?.startDate ?? ''} onChange={e => setForm({ ...form, startDate: e?.target?.value })}
                      className={`w-full border p-3 text-sm outline-none ${errors?.startDate ? 'border-red-400' : 'border-[#D0C5AF]/40 focus:border-[#D4AF37]'}`} />
                    {errors?.startDate && <p className="text-red-500 text-xs mt-1">{errors?.startDate}</p>}
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] uppercase tracking-widest text-[#2A2421]/60 font-bold mb-2 block">Ngày kết thúc *</label>
                    <input type="date" value={form?.endDate ?? ''} onChange={e => setForm({ ...form, endDate: e?.target?.value })}
                      className={`w-full border p-3 text-sm outline-none ${errors?.endDate ? 'border-red-400' : 'border-[#D0C5AF]/40 focus:border-[#D4AF37]'}`} />
                    {errors?.endDate && <p className="text-red-500 text-xs mt-1">{errors?.endDate}</p>}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-widest text-[#2A2421]/60 font-bold mb-2 block">Ghi chú (tùy chọn)</label>
                  <textarea value={form?.note ?? ''} onChange={e => setForm({ ...form, note: e?.target?.value })} rows={2}
                    className="w-full border border-[#D0C5AF]/40 p-3 text-sm outline-none focus:border-[#D4AF37] resize-none"
                    placeholder="VD: Nghỉ 7 ngày — cao điểm du lịch" />
                </div>
              </div>

              <div className="p-6 border-t border-[#D0C5AF]/30 bg-[#FAFAF5] flex gap-3 shrink-0">
                <button onClick={() => setEditing(null)}
                  className="flex-1 py-3 text-xs font-['Inter'] uppercase tracking-widest border border-[#2A2421]/20 hover:bg-white transition-colors">
                  Hủy bỏ
                </button>
                <button onClick={handleSave}
                  className="flex-1 py-3 text-xs font-['Inter'] uppercase tracking-widest font-bold bg-[#2A2421] text-white hover:bg-[#D4AF37] transition-colors">
                  Lưu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
