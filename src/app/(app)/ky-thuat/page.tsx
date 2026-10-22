export const dynamic = "force-dynamic";

import { HangChiSo } from "@/components/ui/HangChiSo";
import { MucTrang } from "@/components/ui/MucTrang";
import { ThanhTyLe } from "@/components/ui/ThanhTyLe";
import { layThongKeHeThong } from "@/lib/data";
import { yeuCauVaiTro } from "@/lib/auth";

const TEN_BANG: Record<string, string> = {
  nhan_vien: "Nhân viên",
  khoi: "Khối",
  cham_cong: "Chấm công",
  don_tu: "Đơn từ",
  bang_luong: "Dòng bảng lương",
  tin_tuyen_dung: "Tin tuyển dụng",
  ung_vien: "Ứng viên",
  danh_gia_hieu_suat: "Đánh giá hiệu suất",
};

const HA_TANG = [
  ["Framework", "Next.js 16 (App Router)"],
  ["Nơi chạy", "Vercel · Singapore (sin1)"],
  ["Cơ sở dữ liệu", "Supabase Postgres · ap-southeast-1"],
  ["Đăng nhập", "Supabase Auth (email, mật khẩu)"],
];

export default async function TrangKyThuat() {
  await yeuCauVaiTro(["admin", "ky_thuat"]);
  const he = await layThongKeHeThong();
  const tongDong = he.bang.reduce((t, b) => t + b.soDong, 0);

  return (
    <div className="space-y-10">
      <HangChiSo
        muc={[
          { nhan: "Tổng số dòng dữ liệu", so: tongDong.toLocaleString("vi-VN"), ghiChu: `${he.bang.length} bảng` },
          { nhan: "Đơn chờ xử lý", so: String(he.soDonChoDuyet) },
          { nhan: "Cơ sở dữ liệu", so: "Singapore", ghiChu: "Supabase · ap-southeast-1" },
        ]}
      />
      <div className="grid gap-x-14 gap-y-10 lg:grid-cols-[1.35fr_1fr]">
        <MucTrang tieuDe="Số dòng theo bảng">
          <ThanhTyLe donVi="dòng" dong={he.bang.map((b) => ({ nhan: TEN_BANG[b.bang] ?? b.bang, so: b.soDong }))} />
        </MucTrang>
        <MucTrang tieuDe="Hạ tầng đang chạy">
          <dl>
            {HA_TANG.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 border-b border-vien py-3 text-[14px] last:border-b-0">
                <dt className="text-muc-3">{k}</dt>
                <dd className="text-right font-medium text-muc">{v}</dd>
              </div>
            ))}
          </dl>
        </MucTrang>
      </div>
    </div>
  );
}
