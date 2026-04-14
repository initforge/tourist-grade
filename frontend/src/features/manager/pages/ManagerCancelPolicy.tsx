export default function ManagerCancelPolicy() {
  return (
    <div className="w-full bg-[#F3F3F3] min-h-full p-10">
      <div className="max-w-3xl bg-white border border-[#D0C5AF]/30 p-8 shadow-sm">
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#D4AF37] font-bold mb-2">Chính sách cố định</p>
        <h1 className="font-['Noto_Serif'] text-3xl text-[#2A2421] mb-4">Chính sách hủy tour</h1>
        <p className="text-sm text-[#2A2421]/60 leading-relaxed">
          Module quản lý chính sách hủy đã được bỏ theo feedback khách hàng. Hệ thống dùng chính sách cố định từ use case, không còn danh sách, thêm mới hoặc sửa rule hủy trong màn quản lý.
        </p>
      </div>
    </div>
  );
}
