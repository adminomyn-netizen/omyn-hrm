export const dynamic = "force-dynamic";

import Link from "next/link";
import { yeuCauQuyenSo } from "@/lib/quyen-nghiep-vu";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { docTatCa } from "@/lib/hr-db";
import { tienVN } from "@/lib/dinh-dang";
import { tinhDoanhSoTheoNguoi } from "@/lib/kinh-doanh";

const THANG = /^\d{4}-(0[1-9]|1[0-2])$/;
const thangKe = (t: string, n: number) => new Date(Date.UTC(Number(t.slice(0, 4)), Number(t.slice(5)) - 1 + n, 1)).toISOString().slice(0, 7);

/** Doanh số tháng của từng người, tự tính: sàn theo gian hàng vận hành, sỉ theo người phụ trách đơn, live theo host, cơ hội đã chốt. */
export default async function TrangDoanhSoTheoNguoi({ searchParams }: { searchParams: Promise<{ thang?: string }> }) {
  await yeuCauQuyenSo("Kinh doanh");
  const { thang: t } = await searchParams;
  const thang = t && THANG.test(t) ? t : new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" }).slice(0, 7);
  const dau = `${thang}-01`;
  const cuoi = `${thangKe(thang, 1)}-01`;
  const [nv, gh, san, si, live, ch] = await Promise.all([
    docTatCa<{ id: string; ho_ten: string }>("nhan_vien", "id, ho_ten"),
    docTatCa<{ id: string; nguoi_van_hanh_id: string | null }>("kd_gian_hang", "id, nguoi_van_hanh_id"),
    docTatCa<{ gian_hang_id: string; doanh_thu: number | null; doanh_thu_hoan: number | null }>("kd_doanh_thu_ngay", "id, gian_hang_id, doanh_thu, doanh_thu_hoan", (q) => q.gte("ngay", dau).lt("ngay", cuoi)),
    docTatCa<{ nguoi_phu_trach_id: string | null; trang_thai: string; gia_tri: number }>("kd_don_si", "id, nguoi_phu_trach_id, trang_thai, gia_tri", (q) => q.gte("ngay", dau).lt("ngay", cuoi)),
    docTatCa<{ host_id: string | null; doanh_thu: number | null }>("kd_phien_live", "id, host_id, doanh_thu", (q) => q.eq("trang_thai", "Đã live").gte("ngay", dau).lt("ngay", cuoi)),
    docTatCa<{ nguoi_phu_trach_id: string | null; giai_doan: string }>("kd_co_hoi", "id, nguoi_phu_trach_id, giai_doan", (q) => q.eq("giai_doan", "Đã chốt").gte("tao_luc", `${dau}T00:00:00+07:00`).lt("tao_luc", `${cuoi}T00:00:00+07:00`)),
  ]);
  const vanHanh = new Map(gh.map((g) => [g.id, g.nguoi_van_hanh_id]));
  const ds = tinhDoanhSoTheoNguoi({
    ten: new Map(nv.map((n) => [n.id, n.ho_ten])),
    sanTheoGianHang: san.map((s) => ({ nguoiVanHanhId: vanHanh.get(s.gian_hang_id) ?? null, doanhThu: s.doanh_thu ?? 0, hoan: s.doanh_thu_hoan ?? 0 })),
    donSi: si.map((o) => ({ nguoiId: o.nguoi_phu_trach_id, trangThai: o.trang_thai, giaTri: o.gia_tri })),
    live: live.map((l) => ({ hostId: l.host_id, doanhThu: l.doanh_thu ?? 0 })),
    coHoi: ch.map((c) => ({ nguoiId: c.nguoi_phu_trach_id, giaiDoan: c.giai_doan })),
  });
  return (
    <>
      <TieuDeTrang tieuDe="Doanh số theo người" phu="Sàn: doanh thu (trừ hoàn) các gian hàng người đó vận hành. Sỉ: đơn đã chốt trở đi người đó phụ trách. Live: phiên người đó làm host. Không cộng các cột vì live bán qua sàn đã nằm trong cột Sàn. Cơ hội chốt tính theo tháng tạo cơ hội (sổ chưa ghi ngày chốt). Số tự tính, dùng để đối chiếu KPI và hoa hồng.">
        <Link href="/kinh-doanh/doanh-so" className="nut-vang rounded-nho px-3.5 py-2 text-[14px] font-medium">Doanh số so chỉ tiêu</Link>
      </TieuDeTrang>
      <nav aria-label="Chọn tháng" className="mb-5 flex items-center gap-3 text-[14px]">
        <Link href={`?thang=${thangKe(thang, -1)}`} className="text-muc-2 underline-offset-4 hover:underline">← Tháng trước</Link>
        <span className="font-semibold text-muc">Tháng {thang.slice(5)}/{thang.slice(0, 4)}</span>
        <Link href={`?thang=${thangKe(thang, 1)}`} className="text-muc-2 underline-offset-4 hover:underline">Tháng sau →</Link>
      </nav>
      <section data-m="1" className="mau-nhom the-noi the-noi-thap mau-vach overflow-x-auto">
        {ds.length === 0 ? (
          <p className="px-4 py-6 text-[14px] text-muc-3">Tháng này chưa có doanh số nào gắn với người. Gán người vận hành ở Gian hàng sàn, người phụ trách ở Đơn bán sỉ, host ở Phiên livestream.</p>
        ) : (
          <table className="w-full min-w-[640px] text-[14px]">
            <thead><tr className="text-left text-[12px] font-medium text-muc-3"><th className="px-4 py-3">Người</th><th className="px-4 py-3 text-right">Sàn</th><th className="px-4 py-3 text-right">Sỉ</th><th className="px-4 py-3 text-right">Số đơn sỉ</th><th className="px-4 py-3 text-right">Live</th><th className="px-4 py-3 text-right">Cơ hội chốt</th></tr></thead>
            <tbody>
              {ds.map((d) => (
                <tr key={d.nguoiId} className="border-t border-vien">
                  <td className="px-4 py-3 font-medium text-muc">{d.ten}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{d.san ? tienVN(d.san) : "—"}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{d.si ? tienVN(d.si) : "—"}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{d.soDonSi || "—"}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{d.live ? tienVN(d.live) : "—"}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{d.coHoiChot || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
