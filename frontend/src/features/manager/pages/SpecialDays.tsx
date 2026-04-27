import { useMemo, useState } from 'react';
import { message, Modal } from 'antd';
import type { SpecialDay } from '@entities/tour-program/data/tourProgram';
import { createSpecialDay, deleteSpecialDay, updateSpecialDay } from '@shared/lib/api/specialDays';
import { useAuthStore } from '@shared/store/useAuthStore';
import { useAppDataStore } from '@shared/store/useAppDataStore';

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function SpecialDays() {
  const token = useAuthStore((state) => state.accessToken);
  const specialDays = useAppDataStore((state) => state.specialDays);
  const setSpecialDays = useAppDataStore((state) => state.setSpecialDays);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<SpecialDay | null>(null);
  const [form, setForm] = useState<Partial<SpecialDay>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return specialDays;
    return specialDays.filter((item) => `${item.name} ${item.occasion} ${item.note ?? ''}`.toLowerCase().includes(keyword));
  }, [search, specialDays]);

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!form.name?.trim()) nextErrors.name = 'Tên ngày đặc biệt không được để trống';
    if (!form.occasion?.trim()) nextErrors.occasion = 'Dịp đặc biệt không được để trống';
    if (!form.startDate) nextErrors.startDate = 'Ngày bắt đầu không được để trống';
    if (!form.endDate) nextErrors.endDate = 'Ngày kết thúc không được để trống';
    if (form.startDate && form.endDate && form.endDate < form.startDate) nextErrors.endDate = 'Ngày kết thúc phải sau hoặc bằng ngày bắt đầu';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const openCreate = () => {
    setEditing({ id: '', name: '', occasion: '', startDate: '', endDate: '', note: '' });
    setForm({ id: '', name: '', occasion: '', startDate: '', endDate: '', note: '' });
    setErrors({});
  };

  const openEdit = (item: SpecialDay) => {
    setEditing(item);
    setForm({ ...item });
    setErrors({});
  };

  const persistList = (nextItems: SpecialDay[]) => {
    setSpecialDays([...nextItems].sort((left, right) => left.startDate.localeCompare(right.startDate)));
  };

  const handleSave = async () => {
    if (!editing || !validate()) return;

    const payload: SpecialDay = {
      id: form.id?.trim() || editing.id || `SD${String(specialDays.length + 1).padStart(3, '0')}`,
      name: form.name!.trim(),
      occasion: form.occasion!.trim(),
      startDate: form.startDate!,
      endDate: form.endDate!,
      note: form.note?.trim() || '',
    };

    try {
      if (editing.id) {
        persistList(specialDays.map((item) => item.id === editing.id ? payload : item));
        if (token) {
          const response = await updateSpecialDay(token, editing.id, payload);
          persistList(specialDays.map((item) => item.id === editing.id ? response.specialDay : item));
        }
        message.success('Cập nhật thành công');
      } else {
        persistList([payload, ...specialDays]);
        if (token) {
          const response = await createSpecialDay(token, payload);
          persistList([response.specialDay, ...specialDays]);
        }
        message.success('Thêm mới thành công');
      }

      setEditing(null);
      setForm({});
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Không thể lưu ngày đặc biệt');
    }
  };

  const handleDelete = (item: SpecialDay) => {
    Modal.confirm({
      title: 'Xóa ngày đặc biệt',
      content: `Xóa "${item.name}"?`,
      okText: 'Xóa',
      okButtonProps: { danger: true },
      cancelText: 'Hủy',
      onOk: async () => {
        const nextItems = specialDays.filter((entry) => entry.id !== item.id);
        persistList(nextItems);
        try {
          if (token) {
            await deleteSpecialDay(token, item.id);
          }
          message.success('Đã xóa');
        } catch (error) {
          message.error(error instanceof Error ? error.message : 'Không thể xóa ngày đặc biệt');
        }
      },
    });
  };

  return (
    <div className="w-full min-h-full bg-[#F3F3F3]">
      <div className="p-6 md:p-10">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1.5">
            <p className="font-['Inter'] text-[10px] uppercase tracking-[0.2em] text-[#D4AF37] font-bold">Danh mục</p>
            <h1 className="font-['Noto_Serif'] text-3xl text-[#2A2421]">Ngày đặc biệt</h1>
            <p className="text-xs text-[#2A2421]/50">Quản lý các dịp lễ và mùa cao điểm dùng chung cho hệ thống.</p>
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 bg-[#2A2421] px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-white">
            <span className="material-symbols-outlined text-[16px]">add</span>
            Thêm ngày đặc biệt
          </button>
        </div>

        <div className="mb-6 flex items-center gap-3 border border-[#D0C5AF]/20 bg-white p-4">
          <span className="material-symbols-outlined text-[18px] text-[#2A2421]/40">search</span>
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm theo tên hoặc dịp..."
            className="flex-1 bg-transparent text-sm outline-none"
          />
        </div>

        <div className="overflow-x-auto border border-[#D0C5AF]/20 bg-white">
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead>
              <tr className="border-b border-[#D0C5AF]/30 bg-[#FAFAF5]">
                {['Tên ngày đặc biệt', 'Dịp đặc biệt', 'Ngày bắt đầu', 'Ngày kết thúc', 'Ghi chú', 'Hành động'].map((header) => (
                  <th key={header} className="px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-[#2A2421]">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D0C5AF]/15">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-sm text-[#2A2421]/40">
                    <span className="material-symbols-outlined mb-2 block text-4xl text-[#D0C5AF]">event</span>
                    Không có ngày đặc biệt nào
                  </td>
                </tr>
              )}
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-[#FAFAF5]">
                  <td className="px-5 py-4 font-medium text-[#2A2421]">{item.name}</td>
                  <td className="px-5 py-4 text-sm text-[#2A2421]/70">{item.occasion}</td>
                  <td className="px-5 py-4 text-sm text-[#2A2421]/70">{fmtDate(item.startDate)}</td>
                  <td className="px-5 py-4 text-sm text-[#2A2421]/70">{fmtDate(item.endDate)}</td>
                  <td className="px-5 py-4 text-sm text-[#2A2421]/60">{item.note || '—'}</td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(item)} className="border border-[#D0C5AF] px-2 py-1 text-[10px] font-bold text-[#2A2421]/60">Sửa</button>
                      <button onClick={() => handleDelete(item)} className="border border-red-300 px-2 py-1 text-[10px] font-bold text-red-600">Xóa</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-[#2A2421]/50" onClick={() => setEditing(null)} />
          <div className="absolute inset-y-0 right-0 flex w-full max-w-lg">
            <div className="flex h-full w-full flex-col bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#D0C5AF]/30 px-6 py-5">
                <div>
                  <p className="font-['Inter'] text-[10px] uppercase tracking-[0.2em] text-[#D4AF37] font-bold">Danh mục</p>
                  <h2 className="font-['Noto_Serif'] text-xl text-[#2A2421]">{editing.id ? 'Chỉnh sửa ngày đặc biệt' : 'Thêm ngày đặc biệt'}</h2>
                </div>
                <button onClick={() => setEditing(null)} className="w-8 h-8 rounded-full hover:bg-gray-100">
                  <span className="material-symbols-outlined text-[#2A2421]/60">close</span>
                </button>
              </div>

              <div className="flex-1 space-y-5 overflow-y-auto p-6">
                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-[#2A2421]/60">Tên ngày đặc biệt *</label>
                  <input value={form.name ?? ''} onChange={(event) => setForm({ ...form, name: event.target.value })} className="w-full border border-[#D0C5AF]/40 p-3 text-sm outline-none" />
                  {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                </div>
                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-[#2A2421]/60">Dịp đặc biệt *</label>
                  <input value={form.occasion ?? ''} onChange={(event) => setForm({ ...form, occasion: event.target.value })} className="w-full border border-[#D0C5AF]/40 p-3 text-sm outline-none" />
                  {errors.occasion && <p className="mt-1 text-xs text-red-500">{errors.occasion}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-[#2A2421]/60">Ngày bắt đầu *</label>
                    <input type="date" value={form.startDate ?? ''} onChange={(event) => setForm({ ...form, startDate: event.target.value })} className="w-full border border-[#D0C5AF]/40 p-3 text-sm outline-none" />
                    {errors.startDate && <p className="mt-1 text-xs text-red-500">{errors.startDate}</p>}
                  </div>
                  <div>
                    <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-[#2A2421]/60">Ngày kết thúc *</label>
                    <input type="date" value={form.endDate ?? ''} onChange={(event) => setForm({ ...form, endDate: event.target.value })} className="w-full border border-[#D0C5AF]/40 p-3 text-sm outline-none" />
                    {errors.endDate && <p className="mt-1 text-xs text-red-500">{errors.endDate}</p>}
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-[#2A2421]/60">Ghi chú</label>
                  <textarea value={form.note ?? ''} onChange={(event) => setForm({ ...form, note: event.target.value })} rows={3} className="w-full resize-none border border-[#D0C5AF]/40 p-3 text-sm outline-none" />
                </div>
              </div>

              <div className="flex gap-3 border-t border-[#D0C5AF]/30 bg-[#FAFAF5] p-6">
                <button onClick={() => setEditing(null)} className="flex-1 border border-[#2A2421]/20 py-3 text-xs font-bold uppercase tracking-widest">Hủy</button>
                <button onClick={() => void handleSave()} className="flex-1 bg-[#2A2421] py-3 text-xs font-bold uppercase tracking-widest text-white">Lưu</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
