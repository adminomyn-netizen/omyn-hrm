export const dynamic = "force-dynamic";

import { HangChiSo } from "@/components/ui/HangChiSo";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { MucTrang } from "@/components/ui/MucTrang";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { Bang, type Cot } from "@/components/ui/Table";
import { layBangLuongKyGanNhat } from "@/lib/data";
import { yeuCauVaiTro } from "@/lib/auth";
import { tienVN, trieuVN } from "@/lib/dinh-dang";
import { NUT_PHU } from "@/components/ui/dinh-dang";

type DongLuong = NonNullable<Awaited<ReturnType<typeof layBangLuongKyGanNhat>>>["chiTiet"][number];

const cot: Cot<DongLuong>[] = [
  { nhan: "Nhân viên", hienThi: (d) => <span className="font-medium text-muc">{d.nhan_vien_ho_ten}</span> },
  { nhan: "Khối", hienThi: (d) => d.khoi_ten },
  { nhan: "Lương cơ bản", phai: true, hienThi: (d) => tienVN(d.luong_co_ban) },
  { nhan: "Phụ cấp", phai: true, hienThi: (d) => tienVN(d.phu_cap) },
  { nhan: "Thực lĩnh", phai: true, hienThi: (d) => <span className="font-semibold text-muc">{tienVN(d.thuc_linh)}</span> },
];

export default async function TrangLuong() {
  await yeuCauVaiTro(["admin", "ky_thuat"]);
  const luong = await layBangLuongKyGanNhat();

  if (!luong) {
    return (
      <>
        <TieuDeTrang tieuDe="Bảng lương" phu="Quỹ lương và chi tiết theo kỳ" />
        <p className="chu-tieu-de py-20 text-center text-[28px] italic text-muc-3">
          Chưa có kỳ lương nào. Khi có kỳ lương đầu tiên, bảng lương sẽ hiện ở đây.
        </p>
      </>
    );
  }

  return (
    <div className="space-y-10">
      <TieuDeTrang tieuDe="Bảng lương" phu="Quỹ lương và chi tiết theo kỳ" />
      <HangChiSo
        muc={[
          { nhan: "Kỳ lương", so: luong.ky },
          { nhan: "Tổng quỹ lương", so: trieuVN(luong.tongQuyLuong) },
          { nhan: "Số người", so: String(luong.chiTiet.length) },
        ]}
      />
      <MucTrang
        tieuDe={`Chi tiết bảng lương · ${luong.ky}`}
        phai={
          <span className="flex items-center gap-4">
            <NhanTrangThai kieu={luong.daThanhToan ? "tot" : "cho"}>{luong.daThanhToan ? "Đã thanh toán" : "Chưa thanh toán"}</NhanTrangThai>
            <button type="button" disabled title="Tính năng xuất file chuyển khoản làm ở giai đoạn Lương" className={NUT_PHU}>
              Xuất file chuyển khoản
            </button>
          </span>
        }
      >
        <Bang cot={cot} duLieu={luong.chiTiet} khoa={(d) => d.nhan_vien_ho_ten} />
      </MucTrang>
    </div>
  );
}
