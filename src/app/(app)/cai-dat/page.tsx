export const dynamic = "force-dynamic";

import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { MucTrang } from "@/components/ui/MucTrang";
import { Bang, type Cot } from "@/components/ui/Table";
import { layDanhSachTaiKhoan } from "@/lib/data";
import { yeuCauVaiTro } from "@/lib/auth";
import { VaiTroTaiKhoan } from "@/components/cai-dat/VaiTroTaiKhoan";

type TaiKhoan = Awaited<ReturnType<typeof layDanhSachTaiKhoan>>[number];

const cotVaiTro = (idToi: string): Cot<TaiKhoan> => ({ nhan: "Vai trò", hienThi: (t) => <VaiTroTaiKhoan key={t.id + t.vaiTro} userId={t.id} vaiTro={t.vaiTro} laToi={t.id === idToi} /> });

const VAI_TRO = [
  { ten: "Kỹ thuật", quyen: "Quyền cao nhất: làm được mọi thứ và xem mọi số liệu, kể cả lương; duyệt tài khoản và phân quyền mọi tài khoản." },
  { ten: "Quản trị", quyen: "Mọi chức năng nhân sự, kể cả lương. Phòng ban Hành chính nhân sự có quyền Quản trị." },
  { ten: "Nhân viên", quyen: "Chấm công của mình và nộp, theo dõi đơn từ của mình." },
  { ten: "Chờ duyệt", quyen: "Tài khoản vừa đăng ký, chưa thấy dữ liệu nào cho tới khi được duyệt ở trang Tổng quan." },
];

const cot: Cot<TaiKhoan>[] = [
  { nhan: "Tài khoản", hienThi: (t) => (<><div className="font-medium text-muc">{t.hoTen}</div><div className="text-[13px] text-muc-3">{t.email}</div></>) },
  { nhan: "Hồ sơ nhân sự", hienThi: (t) => t.hoSo ?? <span className="text-muc-3">Chưa gắn</span> },
  { nhan: "Đăng nhập gần nhất", hienThi: (t) => (t.dangNhapLuc ? new Date(t.dangNhapLuc).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }) : "Chưa lần nào") },
];

export default async function TrangCaiDat() {
  const nguoiDung = await yeuCauVaiTro(["admin", "ky_thuat"]);
  const taiKhoan = await layDanhSachTaiKhoan();
  const cotDayDu = [cot[0], cotVaiTro(nguoiDung.id), ...cot.slice(1)];

  return (
    <div className="space-y-10">
      <TieuDeTrang tieuDe="Cài đặt và phân quyền" phu="Vai trò, quyền và tài khoản đăng nhập" />
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
        <Bang cot={cotDayDu} duLieu={taiKhoan} khoa={(t) => t.id} />
      </MucTrang>
    </div>
  );
}
