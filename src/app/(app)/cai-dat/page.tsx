export const dynamic = "force-dynamic";

import { MucTrang } from "@/components/ui/MucTrang";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { Bang, type Cot } from "@/components/ui/Table";
import { layDanhSachTaiKhoan } from "@/lib/data";
import { yeuCauVaiTro } from "@/lib/auth";
import { NHAN_VAI_TRO } from "@/lib/nav";

type TaiKhoan = Awaited<ReturnType<typeof layDanhSachTaiKhoan>>[number];

const VAI_TRO = [
  { ten: "Quản trị", quyen: "Mọi chức năng, kể cả duyệt tài khoản và gán vai trò Kỹ thuật, Quản trị." },
  { ten: "Kỹ thuật", quyen: "Hồ sơ nhân sự, tuyển dụng, đơn từ, lương, báo cáo; duyệt tài khoản mới ở vai trò Nhân viên." },
  { ten: "Nhân viên", quyen: "Chấm công của mình và nộp, theo dõi đơn từ của mình." },
  { ten: "Chờ duyệt", quyen: "Tài khoản vừa đăng ký, chưa thấy dữ liệu nào cho tới khi được duyệt ở trang Tổng quan." },
];

const cot: Cot<TaiKhoan>[] = [
  { nhan: "Tài khoản", hienThi: (t) => (<><div className="font-medium text-muc">{t.hoTen}</div><div className="text-[13px] text-muc-3">{t.email}</div></>) },
  { nhan: "Vai trò", hienThi: (t) => <NhanTrangThai kieu={t.vaiTro === "cho_duyet" ? "cho" : t.vaiTro === "nhan_vien" ? "tram" : "tot"}>{NHAN_VAI_TRO[t.vaiTro]}</NhanTrangThai> },
  { nhan: "Hồ sơ nhân sự", hienThi: (t) => t.hoSo ?? <span className="text-muc-3">Chưa gắn</span> },
  { nhan: "Đăng nhập gần nhất", hienThi: (t) => (t.dangNhapLuc ? new Date(t.dangNhapLuc).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }) : "Chưa lần nào") },
];

export default async function TrangCaiDat() {
  await yeuCauVaiTro(["admin"]);
  const taiKhoan = await layDanhSachTaiKhoan();

  return (
    <div className="space-y-10">
      <MucTrang tieuDe="Vai trò và quyền đang áp dụng">
        <dl>
          {VAI_TRO.map((v) => (
            <div key={v.ten} className="flex flex-wrap justify-between gap-x-8 gap-y-1 border-b border-vien py-3.5 last:border-b-0">
              <dt className="text-[14px] font-medium text-muc">{v.ten}</dt>
              <dd className="max-w-xl text-[14px] text-muc-2 sm:text-right">{v.quyen}</dd>
            </div>
          ))}
        </dl>
      </MucTrang>
      <MucTrang tieuDe={`Tài khoản đăng nhập (${taiKhoan.length})`}>
        <Bang cot={cot} duLieu={taiKhoan} khoa={(t) => t.id} />
      </MucTrang>
    </div>
  );
}
