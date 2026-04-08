import { useState } from 'react';

// ── Types ────────────────────────────────────────────────────────────────────

interface CancelRule {
  id: string;
  fromDays: number;
  toDays: number;
  refundPercent: number;
  description?: string;
}

interface CancelPolicy {
  id: string;
  name: string;
  dayType: 'weekday' | 'holiday';
  vehicle: 'car' | 'flight';
  active: boolean;
  notes?: string;
  rules: CancelRule[];
  createdAt?: string;
  createdBy?: string;
}

// ── Mock Data ────────────────────────────────────────────────────────────────

const POLICIES: CancelPolicy[] = [
  {
    id: 'CP-01',
    name: 'Standard Policy',
    dayType: 'holiday',
    vehicle: 'car',
    active: true,
    notes: 'Chính sách hủy tiêu chuẩn',
    rules: [
      { id: 'R1', fromDays: 20, toDays: 999, refundPercent: 10, description: 'Từ 20 ngày trở lên' },
      { id: 'R2', fromDays: 10, toDays: 19, refundPercent: 30, description: '10 - 20 ngày' },
      { id: 'R3', fromDays: 5, toDays: 9, refundPercent: 50, description: '5 - 10 ngày' },
      { id: 'R4', fromDays: 0, toDays: 4, refundPercent: 100, description: 'Dưới 5 ngày' },
    ],
  },
  {
    id: 'CP-02',
    name: 'Flight Flexible',
    dayType: 'holiday',
    vehicle: 'flight',
    active: false,
    notes: 'Chính sách linh hoạt cho vé máy bay',
    rules: [
      { id: 'R5', fromDays: 30, toDays: 999, refundPercent: 0, description: 'Từ 30 ngày trở lên: Không phạt' },
      { id: 'R6', fromDays: 15, toDays: 29, refundPercent: 30, description: '15 - 30 ngày: Phạt 30%' },
      { id: 'R7', fromDays: 7, toDays: 14, refundPercent: 70, description: '7 - 14 ngày: Phạt 70%' },
      { id: 'R8', fromDays: 0, toDays: 6, refundPercent: 100, description: 'Dưới 7 ngày: Không hoàn tiền' },
    ],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const DAY_TYPE_LABEL: Record<string, string> = { weekday: 'Ngày thường', holiday: 'Ngày lễ' };
const VEHICLE_LABEL: Record<string, string> = { car: 'Xe ô tô', flight: 'Máy bay' };

// ── Add/Edit Popup ────────────────────────────────────────────────────────────

interface PolicyFormProps {
  policy: CancelPolicy | null;
  onSave: (p: CancelPolicy) => void;
  onClose: () => void;
}

function PolicyForm({ policy, onSave, onClose }: PolicyFormProps) {
  const isEdit = !!policy;
  const [name, setName] = useState(policy?.name ?? '');
  const [dayType, setDayType] = useState<'weekday' | 'holiday'>(policy?.dayType ?? 'weekday');
  const [vehicle, setVehicle] = useState<'car' | 'flight'>(policy?.vehicle ?? 'car');
  const [active, setActive] = useState(policy?.active ?? true);
  const [notes, setNotes] = useState(policy?.notes ?? '');
  const [rules, setRules] = useState<CancelRule[]>(policy?.rules ?? [
    { id: 'NEW-1', fromDays: 0, toDays: 0, refundPercent: 0 },
  ]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const addRule = () => {
    setRules(prev => [...prev, { id: `NEW-${Date.now()}`, fromDays: 0, toDays: 0, refundPercent: 0 }]);
  };

  const removeRule = (id: string) => {
    setRules(prev => prev.filter(r => r.id !== id));
  };

  const updateRule = (id: string, field: keyof CancelRule, value: string | number) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Tên chính sách không được trống';
    if (rules.length === 0) e.rules = 'Phải có ít nhất 1 rule';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const newPolicy: CancelPolicy = {
      id: policy?.id ?? `CP-${Date.now()}`,
      name, dayType, vehicle, active, notes,
      rules: rules.filter(r => r.fromDays > 0 || r.toDays > 0 || r.refundPercent > 0),
    };
    onSave(newPolicy);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-[#2A2421]/50 backdrop-blur-sm" onClick={onClose}></div>
      <div className="absolute inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-2xl md:max-h-[90vh] bg-white shadow-2xl border border-[#D0C5AF]/30 flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#D0C5AF]/30 flex items-center justify-between shrink-0">
          <div>
            <p className="font-['Inter'] text-[10px] uppercase tracking-[0.2em] text-[#D4AF37] font-bold">Chính sách hủy</p>
            <h2 className="font-['Noto_Serif'] text-xl text-[#2A2421]">{isEdit ? 'Sửa Chính sách Hủy' : 'Tạo Chính sách Hủy'}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full">
            <span className="material-symbols-outlined text-[#2A2421]/60">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Basic info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-[10px] uppercase tracking-widest text-[#2A2421]/60 font-bold mb-2 block">Tên chính sách *</label>
              <input value={name} onChange={e => setName(e.target.value)}
                placeholder="Ví dụ: Standard Policy"
                className={`w-full border p-3 text-sm outline-none focus:border-[#D4AF37] ${errors.name ? 'border-red-400' : 'border-[#D0C5AF]/40'}`} />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-[#2A2421]/60 font-bold mb-2 block">Loại ngày</label>
              <select value={dayType} onChange={e => setDayType(e.target.value as 'weekday' | 'holiday')}
                className="w-full border border-[#D0C5AF]/40 p-3 text-sm outline-none focus:border-[#D4AF37] appearance-none bg-white">
                <option value="weekday">Ngày thường</option>
                <option value="holiday">Ngày lễ</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-[#2A2421]/60 font-bold mb-2 block">Phương tiện</label>
              <select value={vehicle} onChange={e => setVehicle(e.target.value as 'car' | 'flight')}
                className="w-full border border-[#D0C5AF]/40 p-3 text-sm outline-none focus:border-[#D4AF37] appearance-none bg-white">
                <option value="car">Xe ô tô</option>
                <option value="flight">Máy bay</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-[10px] uppercase tracking-widest text-[#2A2421]/60 font-bold mb-2 block">Ghi chú (tùy chọn)</label>
              <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Nhập mô tả ngắn..."
                className="w-full border border-[#D0C5AF]/40 p-3 text-sm outline-none focus:border-[#D4AF37]" />
            </div>
            <div className="col-span-2 flex items-center gap-3 py-2 border border-[#D0C5AF]/20 bg-[#FAFAF5] px-3">
              <input type="checkbox" id="active-check" checked={active} onChange={e => setActive(e.target.checked)}
                className="w-4 h-4 accent-[#D4AF37]" />
              <label htmlFor="active-check" className="text-sm font-medium text-[#2A2421]">Hoạt động</label>
            </div>
          </div>

          {/* Rules table */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-['Inter'] text-[10px] uppercase tracking-widest font-bold text-[#2A2421]">Quy tắc hoàn tiền</h3>
              <button onClick={addRule}
                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-700 transition-colors">
                <span className="material-symbols-outlined text-[14px]">add</span>
                Thêm Quy tắc
              </button>
            </div>
            <div className="border border-[#D0C5AF]/30 overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[#FAFAF5] border-b border-[#D0C5AF]/30">
                    <th className="px-4 py-3 text-[9px] uppercase tracking-widest text-[#2A2421]/50 font-bold">Từ ngày</th>
                    <th className="px-4 py-3 text-[9px] uppercase tracking-widest text-[#2A2421]/50 font-bold">Đến ngày</th>
                    <th className="px-4 py-3 text-[9px] uppercase tracking-widest text-[#2A2421]/50 font-bold">Mức phạt (%)</th>
                    <th className="px-4 py-3 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D0C5AF]/10">
                  {rules.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-xs text-[#2A2421]/40">
                        Chưa có quy tắc nào. Nhấn "Thêm Quy tắc" để tạo.
                      </td>
                    </tr>
                  )}
                  {rules.map(r => (
                    <tr key={r.id}>
                      <td className="px-4 py-2">
                        <input type="number" value={r.fromDays} onChange={e => updateRule(r.id, 'fromDays', Number(e.target.value))}
                          min={0} placeholder="Ví dụ: 10"
                          className="w-full border border-[#D0C5AF]/40 p-2 text-sm outline-none focus:border-[#D4AF37]" />
                      </td>
                      <td className="px-4 py-2">
                        <input type="number" value={r.toDays} onChange={e => updateRule(r.id, 'toDays', Number(e.target.value))}
                          min={0} placeholder="Ví dụ: 20"
                          className="w-full border border-[#D0C5AF]/40 p-2 text-sm outline-none focus:border-[#D4AF37]" />
                      </td>
                      <td className="px-4 py-2">
                        <input type="number" value={r.refundPercent} onChange={e => updateRule(r.id, 'refundPercent', Number(e.target.value))}
                          min={0} max={100} placeholder="Ví dụ: 50"
                          className="w-full border border-[#D0C5AF]/40 p-2 text-sm outline-none focus:border-[#D4AF37]" />
                      </td>
                      <td className="px-4 py-2 text-center">
                        <button onClick={() => removeRule(r.id)}
                          className="w-7 h-7 bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-colors">
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {errors.rules && <p className="text-red-500 text-xs mt-2">{errors.rules}</p>}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#D0C5AF]/30 bg-[#FAFAF5] flex gap-3 shrink-0">
          <button onClick={onClose} className="flex-1 py-3 text-xs font-['Inter'] uppercase tracking-widest border border-[#2A2421]/20 hover:bg-white transition-colors">
            Hủy bỏ
          </button>
          <button onClick={handleSave}
            className="flex-1 py-3 text-xs font-['Inter'] uppercase tracking-widest font-bold bg-[#2A2421] text-white hover:bg-[#D4AF37] transition-colors">
            Lưu Chính sách
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ManagerCancelPolicy() {
  const [policies, setPolicies] = useState<CancelPolicy[]>(POLICIES);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [showForm, setShowForm] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<CancelPolicy | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleSave = (p: CancelPolicy) => {
    setPolicies(prev => {
      const idx = prev.findIndex(x => x.id === p.id);
      if (idx >= 0) return prev.map(x => x.id === p.id ? p : x);
      return [...prev, p];
    });
    setShowForm(false);
    setEditingPolicy(null);
  };

  const openAdd = () => { setEditingPolicy(null); setShowForm(true); };
  const openEdit = (p: CancelPolicy) => { setEditingPolicy(p); setShowForm(true); };

  const STATUS_STYLE = (active: boolean) => active
    ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
    : 'bg-gray-200 text-gray-500 border border-gray-300';

  return (
    <div className="w-full bg-[#F3F3F3] min-h-full">
      <div className="p-6 md:p-10">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-1 h-5 bg-[#D4AF37] rounded-sm"></div>
              <h1 className="font-['Noto_Serif'] text-3xl text-[#2A2421]">Quản lý Chính sách Hủy</h1>
            </div>
            <p className="text-xs text-[#2A2421]/50 ml-4">Thiết lập và quản lý các chính sách hủy booking cho từng loại phương tiện.</p>
          </div>
          <button onClick={openAdd}
            className="flex items-center gap-2 bg-[#2A2421] text-white px-5 py-2.5 text-xs font-['Inter'] uppercase tracking-widest hover:bg-[#D4AF37] transition-colors">
            <span className="material-symbols-outlined text-[16px]">add</span>
            Thêm chính sách
          </button>
        </div>

        {/* Filter bar */}
        <div className="bg-white border border-[#D0C5AF]/20 p-4 mb-6 flex gap-3 flex-wrap">
          <button className="px-4 py-2 text-xs font-medium border border-[#D4AF37] bg-[#D4AF37]/5 text-[#D4AF37]">Tất cả</button>
          <button className="px-4 py-2 text-xs font-medium border border-[#D0C5AF]/40 text-[#2A2421]/60 hover:border-[#D4AF37] transition-colors">Ngày thường</button>
          <button className="px-4 py-2 text-xs font-medium border border-[#D0C5AF]/40 text-[#2A2421]/60 hover:border-[#D4AF37] transition-colors">Ngày lễ</button>
          <button className="px-4 py-2 text-xs font-medium border border-[#D0C5AF]/40 text-[#2A2421]/60 hover:border-[#D4AF37] transition-colors">Xe ô tô</button>
          <button className="px-4 py-2 text-xs font-medium border border-[#D0C5AF]/40 text-[#2A2421]/60 hover:border-[#D4AF37] transition-colors">Máy bay</button>
        </div>

        {/* Table */}
        <div className="bg-white border border-[#D0C5AF]/20 shadow-sm overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-[#FAFAF5] border-b border-[#D0C5AF]/30">
                <th className="px-4 py-3.5 w-10"></th>
                <th className="px-4 py-3.5 text-[10px] uppercase tracking-widest text-[#2A2421] font-bold">Tên chính sách</th>
                <th className="px-4 py-3.5 text-[10px] uppercase tracking-widest text-[#2A2421] font-bold">Loại ngày</th>
                <th className="px-4 py-3.5 text-[10px] uppercase tracking-widest text-[#2A2421] font-bold">Phương tiện</th>
                <th className="px-4 py-3.5 text-[10px] uppercase tracking-widest text-[#2A2421] font-bold">Trạng thái</th>
                <th className="px-4 py-3.5 text-[10px] uppercase tracking-widest text-[#2A2421] font-bold">Ghi chú</th>
                <th className="px-4 py-3.5 text-[10px] uppercase tracking-widest text-[#2A2421] font-bold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D0C5AF]/15">
              {policies.map(p => {
                const expanded = expandedIds.has(p.id);
                return [
                  <tr key={`row-${p.id}`} className="hover:bg-[#FAFAF5] transition-colors">
                    {/* Expand icon */}
                    <td className="px-4 py-4 text-center">
                      <button onClick={() => toggleExpand(p.id)} className="w-7 h-7 flex items-center justify-center hover:bg-[#D4AF37]/10 transition-colors">
                        <span className="material-symbols-outlined text-[#D4AF37] text-lg">
                          {expanded ? 'expand_more' : 'chevron_right'}
                        </span>
                      </button>
                    </td>
                    {/* Name */}
                    <td className="px-4 py-4 font-medium text-sm font-['Noto_Serif'] text-[#2A2421]">{p.name}</td>
                    {/* Day type */}
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1">
                        <span className="px-2 py-0.5 bg-gray-100 text-[#2A2421]/60 text-[10px] font-bold rounded">{DAY_TYPE_LABEL[p.dayType]}</span>
                      </div>
                    </td>
                    {/* Vehicle */}
                    <td className="px-4 py-4">
                      <span className="px-2 py-0.5 bg-gray-100 text-[#2A2421]/60 text-[10px] font-bold rounded">{VEHICLE_LABEL[p.vehicle]}</span>
                    </td>
                    {/* Status */}
                    <td className="px-4 py-4">
                      <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${STATUS_STYLE(p.active)}`}>
                        {p.active ? 'Hoạt động' : 'Ngừng'}
                      </span>
                    </td>
                    {/* Notes */}
                    <td className="px-4 py-4 text-xs text-[#2A2421]/50 max-w-32 truncate">{p.notes ?? '—'}</td>
                    {/* Actions */}
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(p)} className="p-1.5 hover:bg-[#D4AF37]/10 transition-colors text-[#2A2421]/40 hover:text-[#D4AF37]" title="Sửa">
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button className="p-1.5 hover:bg-red-50 transition-colors text-red-400 hover:text-red-600" title="Xóa">
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>,
                  // Expanded rules rows
                  ...(expanded ? p.rules.map((r, ri) => (
                    <tr key={`rule-${p.id}-${r.id}`} className={ri === 0 ? 'border-t-0' : ''}>
                      <td className="px-4 py-2 pl-12 border-l-2 border-[#3B82F6]/30 bg-blue-50/20" colSpan={2}>
                        <span className="text-xs text-[#2A2421]/70">{r.description ?? `${r.fromDays} — ${r.toDays} ngày`}</span>
                      </td>
                      <td className="px-4 py-2 border-l-2 border-[#3B82F6]/30 bg-blue-50/20">
                        <span className="text-xs font-bold text-blue-600">Phạt {r.refundPercent}%</span>
                      </td>
                      <td colSpan={4} className="px-4 py-2 border-l-2 border-[#3B82F6]/30 bg-blue-50/20"></td>
                    </tr>
                  )) : [])
                ];
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex justify-between items-center">
          <p className="text-[11px] text-[#2A2421]/40">Hiển thị {policies.length} chính sách</p>
        </div>
      </div>

      {showForm && (
        <PolicyForm policy={editingPolicy} onSave={handleSave} onClose={() => { setShowForm(false); setEditingPolicy(null); }} />
      )}
    </div>
  );
}
