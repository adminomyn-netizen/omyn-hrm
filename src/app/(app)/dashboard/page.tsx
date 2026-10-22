export const dynamic = "force-dynamic";

import Link from "next/link";
import { HangChiSo } from "@/components/ui/HangChiSo";
import { MucTrang } from "@/components/ui/MucTrang";
import { ThanhTyLe } from "@/components/ui/ThanhTyLe";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { Bang, type Cot } from "@/components/ui/Table";
import { DuyetTaiKhoan } from "@/components/dashboard/DuyetTaiKhoan";
import {
  layBangLuongKyGanNhat,
  layChamCongHomNay,
  layDanhGiaKPI,
  layDanhSachKhoi,
  layDanhSachNhanVien,
  layDonTu,
  layHoSoChuaGanTaiKhoan,
  layTaiKhoanChoDuyet,
} from "@/lib/data";
import { yeuCauVaiTro } from "@/lib/auth";
import { ngayVN, trieuVN } from "@/lib/dinh-dang";

type Kpi = Awaited<ReturnType<typeof layDanhGiaKPI>>[number];
const kieuXepLoai = (x: string) => (x === "Xuất sắc" ? "tot" : x === "Cần cải thiện" ? "loi" : "cho");

const cotKpi: Cot<Kpi>[] = [
  { nhan: "Nhân viên", hienThi: (k) => <span className="font-medium text-muc">{k.nhan_vien_ho_ten}</span> },
  { nhan: "Khối", hienThi: (k) => k.khoi_ten },
  { nhan: "Kỳ", hienThi: (k) => k.ky },
  { nhan: "Điểm", phai: true, hienThi: (k) => k.diem },
  { nhan: "Xếp loại", hienThi: (k) => <NhanTrangThai kieu={kieuXepLoai(k.xep_loai)}>{k.xep_loai}</NhanTrangThai> },
];

export default async function TrangTongQuan() {
  const nguoiGoi = await yeuCauVaiTro(["admin", "ky_thuat"]);
  const [khoi, nhanVien, chamCong, donTu, kpi, luong, taiKhoanChoDuyet, hoSoTrong] = await Promise.all([
    layDanhSachKhoi(),
    layDanhSachNhanVien(),
    layChamCongHomNay(),
    layDonTu(),
    layDanhGiaKPI(),
    layBangLuongKyGanNhat(),
    layTaiKhoanChoDuyet(),
    layHoSoChuaGanTaiKhoan(),
  ]);

  const dangLam = nhanVien.filter((n) => n.trang_thai === "Đang làm").length;
  const choDuyet = donTu.filter((d) => d.trang_thai === "Chờ duyệt");

  return (
    <div className="space-y-10">
      <DuyetTaiKhoan taiKhoan={taiKhoanChoDuyet} hoSo={hoSoTrong} nguoiGoi={nguoiGoi.vaiTro} />

      <HangChiSo
        muc={[
          { nhan: "Nhân viên đang làm", so: String(dangLam), ghiChu: `Tổng ${nhanVien.length} hồ sơ` },
          { nhan: "Đơn chờ duyệt", so: String(choDuyet.length) },
          { nhan: "Chấm công hôm nay", so: `${chamCong.daChamCong}/${chamCong.tongNhanVien}`, ghiChu: `${chamCong.diMuon} đi muộn · ${chamCong.vangMat} vắng` },
          { nhan: luong ? `Quỹ lương ${luong.ky}` : "Quỹ lương", so: luong ? trieuVN(luong.tongQuyLuong) : "—", ghiChu: luong ? (luong.daThanhToan ? "Đã thanh toán" : "Chưa thanh toán") : "Chưa có kỳ lương" },
        ]}
      />

      <div className="grid gap-x-14 gap-y-10 lg:grid-cols-[1.35fr_1fr]">
        <MucTrang tieuDe="Nhân sự theo khối">
          <ThanhTyLe donVi="người" dong={khoi.map((k) => ({ nhan: k.ten, so: nhanVien.filter((n) => n.khoi_ten === k.ten).length }))} />
        </MucTrang>

        <MucTrang tieuDe="Đơn chờ xử lý" phai={<Link href="/don-tu" className="font-medium text-nhan-dam underline-offset-4 hover:underline">Xem tất cả</Link>}>
          {choDuyet.length === 0 ? (
            <p className="text-[14px] text-muc-3">Không có đơn nào đang chờ duyệt.</p>
          ) : (
            <ul>
              {choDuyet.slice(0, 6).map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-3 border-b border-vien py-3 last:border-b-0">
                  <div className="min-w-0">
                    <div className="truncate text-[14px] font-medium text-muc">{d.nhan_vien_ho_ten}</div>
                    <div className="text-[13px] text-muc-3">{d.loai} · {ngayVN(d.tu_ngay)}</div>
                  </div>
                  <NhanTrangThai kieu="cho">Chờ duyệt</NhanTrangThai>
                </li>
              ))}
            </ul>
          )}
        </MucTrang>
      </div>

      <MucTrang tieuDe="Đánh giá hiệu suất gần nhất" phai={<Link href="/danh-gia" className="font-medium text-nhan-dam underline-offset-4 hover:underline">Xem tất cả</Link>}>
        <Bang cot={cotKpi} duLieu={kpi.slice(0, 6)} khoa={(k) => k.id} trong="Chưa có đánh giá nào." />
      </MucTrang>
    </div>
  );
}
