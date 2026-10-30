export const dynamic = "force-dynamic";

import Link from "next/link";
import { yeuCauVaiTro } from "@/lib/auth";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { dbHr } from "@/lib/hr-db";

const TIEN = (v: number) => `${Math.round(v).toLocaleString("vi-VN")} đ`;
const so = (v: unknown) => Number(v ?? 0) || 0;

type Dong = { nhan_vien: { ho_ten: string; khoi: { ten: string } | null } | null; dong_bh: boolean; bh_xh: number; bh_yt: number; bh_tn: number; bh_cty: number; phu_cap_thuc: number; phu_cap_mien_thue: number; tien_an: number };

/** BHXH và phụ cấp theo kỳ lương: mức đóng từng người (người lao động + công ty), phụ cấp, tiền ăn, kèm bảng tỷ lệ đang dùng và trạng thái xác nhận. Chỉ Quản trị/Kỹ thuật. */
export default async function TrangBhxhPhuCap({ searchParams }: { searchParams: Promise<{ ky?: string }> }) {
  await yeuCauVaiTro(["admin", "ky_thuat"]);
  const sp = await searchParams;
  const db = dbHr();
  const [{ data: kyDs }, { data: thamSo }] = await Promise.all([
    db.from("ky_luong").select("id, ten_ky, thang, nam").not("thang", "is", null).order("nam", { ascending: false }).order("thang", { ascending: false }).limit(12),
    db.from("tham_so_luong").select("khoa, nhan, gia_tri, don_vi, nguon, xac_nhan_boi").or("khoa.like.bh*,khoa.like.kpcd*,khoa.like.mien_thue*").order("khoa"),
  ]);
  const ky = (kyDs ?? []) as { id: string; ten_ky: string }[];
  const chon = ky.find((k) => k.id === sp.ky) ?? ky[0];
  const { data } = chon
    ? await db.from("bang_luong").select("dong_bh, bh_xh, bh_yt, bh_tn, bh_cty, phu_cap_thuc, phu_cap_mien_thue, tien_an, nhan_vien(ho_ten, khoi(ten))").eq("ky_luong_id", chon.id)
    : { data: [] };
  const dong = ((data ?? []) as unknown as Dong[]).map((d) => ({ ...d, bh_xh: so(d.bh_xh), bh_yt: so(d.bh_yt), bh_tn: so(d.bh_tn), bh_cty: so(d.bh_cty), phu_cap_thuc: so(d.phu_cap_thuc), phu_cap_mien_thue: so(d.phu_cap_mien_thue), tien_an: so(d.tien_an) }));
  dong.sort((a, b) => (a.nhan_vien?.ho_ten ?? "").localeCompare(b.nhan_vien?.ho_ten ?? "", "vi"));
  const t = (f: (d: (typeof dong)[number]) => number) => dong.reduce((a, d) => a + f(d), 0);
  const tong = { nld: t((d) => d.bh_xh + d.bh_yt + d.bh_tn), cty: t((d) => d.bh_cty), pc: t((d) => d.phu_cap_thuc), an: t((d) => d.tien_an) };
  const ts = (thamSo ?? []) as { khoa: string; nhan: string; gia_tri: string; don_vi: string; nguon: string | null; xac_nhan_boi: string | null }[];
  return (
    <>
      <TieuDeTrang tieuDe="BHXH và phụ cấp" phu={chon ? `${chon.ten_ky}: người lao động đóng ${TIEN(tong.nld)}, công ty đóng ${TIEN(tong.cty)}.` : "Chưa có kỳ lương nào. Lập bảng lương ở màn Bảng lương, số liệu sẽ tự hiện ở đây."} />
      {ky.length > 1 && (
        <nav className="mb-4 flex flex-wrap gap-2" aria-label="Chọn kỳ lương">
          {ky.map((k) => (
            <Link key={k.id} href={`/bhxh-phu-cap?ky=${k.id}`} className={`rounded-nho border px-3 py-1.5 text-[13px] ${k.id === chon?.id ? "border-nhan bg-nhan-nhat font-medium text-nhan-dam" : "border-vien text-muc-2 hover:bg-giay-tram"}`}>{k.ten_ky}</Link>
          ))}
        </nav>
      )}
      <div className="space-y-5">
        {chon && (
          <section data-m="7" className="mau-nhom the-noi the-noi-thap mau-vach overflow-x-auto">
            <h2 className="mau-chu px-4 pt-4 text-[15px] font-semibold">Theo người, {chon.ten_ky}</h2>
            <table className="w-full min-w-[780px] text-[14px]">
              <thead><tr className="text-left text-[12px] font-medium text-muc-3"><th className="px-4 py-3">Nhân sự</th><th className="px-4 py-3">Đóng BH</th><th className="px-4 py-3 text-right">BHXH</th><th className="px-4 py-3 text-right">BHYT</th><th className="px-4 py-3 text-right">BHTN</th><th className="px-4 py-3 text-right">Công ty đóng</th><th className="px-4 py-3 text-right">Phụ cấp</th><th className="px-4 py-3 text-right">Tiền ăn</th></tr></thead>
              <tbody>
                {dong.map((d, i) => (
                  <tr key={i} className="border-t border-vien">
                    <td className="px-4 py-2.5 font-medium text-muc">{d.nhan_vien?.ho_ten ?? "?"}<span className="block text-[12px] font-normal text-muc-3">{d.nhan_vien?.khoi?.ten ?? "Chưa gán khối"}</span></td>
                    <td className="px-4 py-2.5">{d.dong_bh ? <NhanTrangThai kieu="tot">Có</NhanTrangThai> : <NhanTrangThai kieu="tram">Không</NhanTrangThai>}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{TIEN(d.bh_xh)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{TIEN(d.bh_yt)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{TIEN(d.bh_tn)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{TIEN(d.bh_cty)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{TIEN(d.phu_cap_thuc)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{TIEN(d.tien_an)}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-vien-dam font-semibold"><td className="px-4 py-3" colSpan={2}>Tổng</td><td className="px-4 py-3 text-right tabular-nums" colSpan={3}>{TIEN(tong.nld)}</td><td className="px-4 py-3 text-right tabular-nums">{TIEN(tong.cty)}</td><td className="px-4 py-3 text-right tabular-nums">{TIEN(tong.pc)}</td><td className="px-4 py-3 text-right tabular-nums">{TIEN(tong.an)}</td></tr>
              </tbody>
            </table>
          </section>
        )}
        <section data-m="3" className="mau-nhom the-noi the-noi-thap mau-vach overflow-x-auto self-start">
          <h2 className="mau-chu px-4 pt-4 text-[15px] font-semibold">Tỷ lệ và mức đang dùng</h2>
          <table className="w-full min-w-[520px] text-[14px]">
            <thead><tr className="text-left text-[12px] font-medium text-muc-3"><th className="px-4 py-3">Khoản</th><th className="px-4 py-3 text-right">Giá trị</th><th className="px-4 py-3">Nguồn</th><th className="px-4 py-3">Xác nhận</th></tr></thead>
            <tbody>
              {ts.map((x) => (
                <tr key={x.khoa} className="border-t border-vien">
                  <td className="px-4 py-2.5">{x.nhan}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{x.don_vi === "phan_tram" ? `${Number(x.gia_tri).toLocaleString("vi-VN")}%` : `${Number(x.gia_tri).toLocaleString("vi-VN")} đ`}</td>
                  <td className="px-4 py-2.5 text-[13px] text-muc-3">{x.nguon ?? "—"}</td>
                  <td className="px-4 py-2.5">{x.xac_nhan_boi ? <NhanTrangThai kieu="tot">Đã xác nhận</NhanTrangThai> : <NhanTrangThai kieu="cho">Chờ kế toán xác nhận</NhanTrangThai>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </>
  );
}
