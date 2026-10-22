export const dynamic = "force-dynamic";

import { HangChiSo } from "@/components/ui/HangChiSo";
import { MucTrang } from "@/components/ui/MucTrang";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { Bang, type Cot } from "@/components/ui/Table";
import { layDanhGiaKPI } from "@/lib/data";
import { yeuCauVaiTro } from "@/lib/auth";

type DanhGia = Awaited<ReturnType<typeof layDanhGiaKPI>>[number];
const kieu = (x: string) => (x === "Xuất sắc" ? "tot" : x === "Cần cải thiện" ? "loi" : "cho");

const cot: Cot<DanhGia>[] = [
  { nhan: "Nhân viên", hienThi: (k) => <span className="font-medium text-muc">{k.nhan_vien_ho_ten}</span> },
  { nhan: "Khối", hienThi: (k) => k.khoi_ten },
  { nhan: "Kỳ đánh giá", hienThi: (k) => k.ky },
  { nhan: "Điểm (/100)", phai: true, hienThi: (k) => k.diem },
  { nhan: "Xếp loại", hienThi: (k) => <NhanTrangThai kieu={kieu(k.xep_loai)}>{k.xep_loai}</NhanTrangThai> },
];

export default async function TrangDanhGia() {
  await yeuCauVaiTro(["admin", "ky_thuat"]);
  const ds = await layDanhGiaKPI();
  const tb = ds.length ? ds.reduce((t, k) => t + Number(k.diem), 0) / ds.length : 0;

  return (
    <div className="space-y-10">
      <HangChiSo
        muc={[
          { nhan: "Lượt đánh giá", so: String(ds.length) },
          { nhan: "Điểm trung bình", so: ds.length ? tb.toLocaleString("vi-VN", { maximumFractionDigits: 1 }) : "—" },
          { nhan: "Xuất sắc", so: String(ds.filter((k) => k.xep_loai === "Xuất sắc").length) },
          { nhan: "Cần cải thiện", so: String(ds.filter((k) => k.xep_loai === "Cần cải thiện").length) },
        ]}
      />
      <MucTrang tieuDe="Kết quả đánh giá theo kỳ">
        <Bang cot={cot} duLieu={ds} khoa={(k) => k.id} trong="Chưa có đánh giá nào." />
      </MucTrang>
    </div>
  );
}
