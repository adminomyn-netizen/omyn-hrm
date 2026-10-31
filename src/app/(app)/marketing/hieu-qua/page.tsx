export const dynamic = "force-dynamic";

import Link from "next/link";
import { yeuCauQuyenSo } from "@/lib/quyen-nghiep-vu";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { docTatCa } from "@/lib/hr-db";
import { tienVN } from "@/lib/dinh-dang";
import { tinhDoanhSo } from "@/lib/kinh-doanh";
import { docDoanhThuSan } from "@/lib/kinh-doanh-data";
import { tinhHieuQuaMkt } from "@/lib/hieu-qua-mkt";

const THANG = /^\d{4}-(0[1-9]|1[0-2])$/;
const thangKe = (t: string, n: number) => new Date(Date.UTC(Number(t.slice(0, 4)), Number(t.slice(5)) - 1 + n, 1)).toISOString().slice(0, 7);
const tong = (r: Record<string, number | string | null>[], c: string) => r.reduce((a, d) => a + Number(d[c] ?? 0), 0);

/** Hiệu quả marketing tháng: tổng chi quảng cáo (Meta, TikTok, Shopee) và KOL/KOC so với doanh thu sàn và sỉ. Số tự tính từ các màn khác, không nhập tay. */
export default async function TrangHieuQuaMkt({ searchParams }: { searchParams: Promise<{ thang?: string }> }) {
  await yeuCauQuyenSo("Marketing & Thương hiệu");
  const { thang: t } = await searchParams;
  const thang = t && THANG.test(t) ? t : new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" }).slice(0, 7);
  const dau = `${thang}-01`;
  const cuoi = `${thangKe(thang, 1)}-01`;
  const trongThang = (q: any) => q.gte("ngay", dau).lt("ngay", cuoi); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [meta, tiktok, shopee, kol, ns, san, si] = await Promise.all([
    docTatCa<Record<string, number>>("qc_meta_so_lieu", "chi_tieu", trongThang, ["ngay", "quang_cao_id"]),
    docTatCa<Record<string, number>>("qc_tiktok_so_lieu", "chi_tieu", trongThang, ["ngay", "quang_cao_id"]),
    docTatCa<Record<string, number>>("qc_shopee_so_lieu_ngay", "chi_phi_qc", trongThang, ["ngay", "gian_hang_id"]),
    docTatCa<Record<string, number>>("mkt_kol_koc", "id, chi_phi_thuc_te", (q) => q.in("trang_thai", ["Đã đăng", "Đã nghiệm thu", "Đã thanh toán"]).gte("ngay_dang", dau).lt("ngay_dang", cuoi)),
    docTatCa<Record<string, number>>("mkt_ngan_sach_qc", "id, ngan_sach_duyet", (q) => q.eq("thang", dau).in("trang_thai", ["Đã duyệt", "Đã quyết toán"])),
    docDoanhThuSan(dau, cuoi),
    docTatCa<{ trang_thai: string; gia_tri: number }>("kd_don_si", "id, trang_thai, gia_tri", (q) => q.gte("ngay", dau).lt("ngay", cuoi)),
  ]);
  const doanhThu = tinhDoanhSo([], san.tongRong, 0, si.map((d) => ({ trangThai: d.trang_thai, giaTri: d.gia_tri })), 0).find((k) => k.kenh === "Tổng")?.thucDat ?? 0;
  const r = tinhHieuQuaMkt({ chiMeta: tong(meta, "chi_tieu"), chiTikTok: tong(tiktok, "chi_tieu"), chiShopee: tong(shopee, "chi_phi_qc"), chiKol: tong(kol, "chi_phi_thuc_te"), nganSachDuyet: tong(ns, "ngan_sach_duyet"), doanhThu });
  const dong = [
    ["Quảng cáo Facebook, Instagram", r.chiMeta],
    ["Quảng cáo TikTok", r.chiTikTok],
    ["Quảng cáo Shopee", r.chiShopee],
    ["KOL và KOC đã đăng", r.chiKol],
  ] as const;
  return (
    <>
      <TieuDeTrang tieuDe="Hiệu quả marketing" phu="Tổng chi quảng cáo và KOL/KOC trong tháng so với doanh thu (sàn sau trừ hoàn + đơn sỉ đã chốt). Chi quảng cáo tự kéo về ở màn Quảng cáo; chưa kết nối thì hiện 0.">
        <Link href="/hr/ngan-sach-qc" className="nut-vang rounded-nho px-3.5 py-2 text-[14px] font-medium">Ngân sách quảng cáo</Link>
      </TieuDeTrang>
      <nav aria-label="Chọn tháng" className="mb-5 flex items-center gap-3 text-[14px]">
        <Link href={`?thang=${thangKe(thang, -1)}`} className="text-muc-2 underline-offset-4 hover:underline">← Tháng trước</Link>
        <span className="font-semibold text-muc">Tháng {thang.slice(5)}/{thang.slice(0, 4)}</span>
        <Link href={`?thang=${thangKe(thang, 1)}`} className="text-muc-2 underline-offset-4 hover:underline">Tháng sau →</Link>
      </nav>
      {r.vuotNganSach && (
        <p role="alert" className="mb-4 rounded-nho bg-loi-nen px-3 py-2.5 text-[13px] text-loi">Tổng chi {tienVN(r.tongChi)} đã vượt ngân sách duyệt {tienVN(r.nganSachDuyet)} của tháng này.</p>
      )}
      <ul className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <li data-m="5" className="mau-nhom the-noi mau-vach mau-nen rounded-nho p-4"><div className="text-[13px] font-medium text-muc-2">Tổng chi</div><div className="chu-tieu-de mau-chu mt-1 text-[26px] leading-none">{tienVN(r.tongChi)}</div><div className="mt-2 text-[13px] text-muc-3">{r.nganSachDuyet > 0 ? `Ngân sách duyệt ${tienVN(r.nganSachDuyet)}` : "Chưa có ngân sách đã duyệt"}</div></li>
        <li data-m="7" className="mau-nhom the-noi mau-vach mau-nen rounded-nho p-4"><div className="text-[13px] font-medium text-muc-2">Doanh thu</div><div className="chu-tieu-de mau-chu mt-1 text-[26px] leading-none">{tienVN(r.doanhThu)}</div><div className="mt-2 text-[13px] text-muc-3">Sàn sau trừ hoàn + đơn sỉ đã chốt</div></li>
        <li data-m="1" className="mau-nhom the-noi mau-vach mau-nen rounded-nho p-4"><div className="text-[13px] font-medium text-muc-2">Chi phí trên doanh thu</div><div className="chu-tieu-de mau-chu mt-1 text-[26px] leading-none">{r.tiLeChiPhi === null ? "—" : `${r.tiLeChiPhi.toLocaleString("vi-VN")}%`}</div><div className="mt-2 text-[13px] text-muc-3">{r.tiLeChiPhi === null ? "Cần nhập doanh thu ở màn Doanh thu sàn theo ngày" : "Tổng chi ÷ doanh thu"}</div></li>
      </ul>
      <section data-m="5" className="mau-nhom the-noi the-noi-thap mau-vach overflow-x-auto">
        <table className="w-full min-w-[360px] text-[14px]">
          <thead><tr className="text-left text-[12px] font-medium text-muc-3"><th className="px-4 py-3">Khoản chi</th><th className="px-4 py-3 text-right">Số tiền</th></tr></thead>
          <tbody>
            {dong.map(([ten, so]) => (
              <tr key={ten} className="border-t border-vien"><td className="px-4 py-3 text-muc">{ten}</td><td className="px-4 py-3 text-right tabular-nums">{tienVN(so)}</td></tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
