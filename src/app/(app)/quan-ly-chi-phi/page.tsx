export const dynamic = "force-dynamic";

import { yeuCauVaiTro } from "@/lib/auth";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { dbHr } from "@/lib/hr-db";
import { layDuLieuLuongBc } from "@/lib/bao-cao-luong-data";
import { chiPhiDaoTaoTheoThang, tongTheoKy } from "@/lib/bao-cao-luong";

const TIEN = (v: number) => `${Math.round(v).toLocaleString("vi-VN")} đ`;
const so = (v: unknown) => Number(v ?? 0) || 0;
const thangKy = (k: { thang: number; nam: number }) => `${k.nam}-${String(k.thang).padStart(2, "0")}`;

/** Chi phí nhân sự: mỗi kỳ lương gồm lương + bảo hiểm công ty đóng + đào tạo cùng tháng; thêm thực chi tuyển dụng đã ghi ở Kế hoạch tuyển dụng. Chỉ Quản trị/Kỹ thuật. */
export default async function TrangQuanLyChiPhi() {
  await yeuCauVaiTro(["admin", "ky_thuat"]);
  const db = dbHr();
  const [{ ky, dong }, kh, dt, td] = await Promise.all([
    layDuLieuLuongBc(),
    db.from("dao_tao_khoa_hoc").select("ngay_hoan_thanh, chi_phi"),
    db.from("dao_tao_ke_hoach").select("ngay_du_kien, ngan_sach, trang_thai"),
    db.from("ngan_sach_tuyen_dung").select("du_kien, thuc_te"),
  ]);
  const daoTao = chiPhiDaoTaoTheoThang(
    ((kh.data ?? []) as { ngay_hoan_thanh: string | null; chi_phi: number | null }[]).map((x) => ({ ngay: x.ngay_hoan_thanh, chiPhi: x.chi_phi === null ? null : so(x.chi_phi) })),
    ((dt.data ?? []) as { ngay_du_kien: string | null; ngan_sach: number | null; trang_thai: string }[]).map((x) => ({ ngay: x.ngay_du_kien, ngan: x.ngan_sach === null ? null : so(x.ngan_sach), trangThai: x.trang_thai })),
  );
  const tuyenDung = ((td.data ?? []) as { du_kien: number; thuc_te: number }[]).reduce((a, x) => ({ du: a.du + so(x.du_kien), thuc: a.thuc + so(x.thuc_te) }), { du: 0, thuc: 0 });
  const ds = tongTheoKy(ky, dong).map((k) => {
    const dao = daoTao.get(thangKy(k)) ?? 0;
    return { ...k, daoTao: dao, tong: k.chiPhiCty + dao };
  });
  const daoTaoNgoaiKy = [...daoTao.entries()].filter(([t]) => !ds.some((k) => thangKy(k) === t)).reduce((a, [, v]) => a + v, 0);
  return (
    <>
      <TieuDeTrang tieuDe="Quản lý chi phí" phu="Chi phí nhân sự theo kỳ lương, cộng đào tạo và tuyển dụng. Mọi số lấy từ sổ đã có, không nhập tay." />
      <div className="grid gap-5 lg:grid-cols-3">
        <section data-m="7" className="mau-nhom the-noi the-noi-thap mau-vach overflow-x-auto lg:col-span-2">
          <h2 className="mau-chu px-4 pt-4 text-[15px] font-semibold">Theo kỳ lương</h2>
          {ds.length === 0 ? (
            <p className="px-4 py-6 text-[14px] text-muc-3">Chưa có kỳ lương nào. Lập bảng lương ở màn Bảng lương, chi phí lương và bảo hiểm sẽ tự có.</p>
          ) : (
            <table className="w-full min-w-[560px] text-[14px]">
              <thead><tr className="text-left text-[12px] font-medium text-muc-3"><th className="px-4 py-3">Kỳ</th><th className="px-4 py-3 text-right">Lương</th><th className="px-4 py-3 text-right">BH công ty</th><th className="px-4 py-3 text-right">Đào tạo</th><th className="px-4 py-3 text-right">Tổng</th></tr></thead>
              <tbody>
                {[...ds].reverse().map((k) => (
                  <tr key={k.id} className="border-t border-vien"><td className="px-4 py-3 font-medium text-muc">{k.ten}</td><td className="px-4 py-3 text-right tabular-nums">{TIEN(k.tongThuNhap)}</td><td className="px-4 py-3 text-right tabular-nums">{TIEN(k.bhCty)}</td><td className="px-4 py-3 text-right tabular-nums">{TIEN(k.daoTao)}</td><td className="mau-chu px-4 py-3 text-right font-semibold tabular-nums">{TIEN(k.tong)}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
        <section data-m="1" className="mau-nhom the-noi the-noi-thap mau-vach self-start">
          <h2 className="mau-chu px-4 pt-4 text-[15px] font-semibold">Tuyển dụng (cộng dồn)</h2>
          <dl className="space-y-2 p-4 text-[14px]">
            <div className="flex justify-between"><dt className="text-muc-3">Dự kiến</dt><dd className="tabular-nums">{TIEN(tuyenDung.du)}</dd></div>
            <div className="flex justify-between"><dt className="text-muc-3">Thực chi</dt><dd className="mau-chu font-semibold tabular-nums">{TIEN(tuyenDung.thuc)}</dd></div>
            {daoTaoNgoaiKy > 0 && <div className="flex justify-between border-t border-vien pt-2"><dt className="text-muc-3">Đào tạo ngoài các kỳ lương</dt><dd className="tabular-nums">{TIEN(daoTaoNgoaiKy)}</dd></div>}
          </dl>
          <p className="px-4 pb-4 text-[12.5px] text-muc-3">Tuyển dụng ghi theo hạng mục ở Kế hoạch tuyển dụng, chưa chia theo tháng.</p>
        </section>
      </div>
    </>
  );
}
