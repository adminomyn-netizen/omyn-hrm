import "server-only";
import { docTatCa } from "@/lib/hr-db";
import { gopDoanhThuSan, type DongSanTay } from "@/lib/kinh-doanh";
import { trangThaiKhoa } from "@/lib/quang-cao";

/** Doanh thu sàn trong khoảng [dau, cuoi) theo 3 nguồn, đã gộp số Shopee tự kéo về (ưu tiên) với số nhập tay. Dùng chung cho các màn doanh số và hiệu quả marketing. */
export async function docDoanhThuSan(dau: string, cuoi: string) {
  const trongKhoang = (q: any) => q.gte("ngay", dau).lt("ngay", cuoi); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [gh, tay, keo] = await Promise.all([
    docTatCa<{ id: string; nen_tang: string; nguoi_van_hanh_id: string | null }>("kd_gian_hang", "id, nen_tang, nguoi_van_hanh_id"),
    docTatCa<{ ngay: string; gian_hang_id: string; doanh_thu: number | null; doanh_thu_hoan: number | null }>("kd_doanh_thu_ngay", "id, ngay, gian_hang_id, doanh_thu, doanh_thu_hoan", trongKhoang),
    docTatCa<{ ngay: string; doanh_thu: number | null; so_don: number | null }>("qc_shopee_so_lieu_ngay", "ngay, doanh_thu, so_don", trongKhoang, ["ngay", "gian_hang_id"]),
  ]);
  const nen = new Map(gh.map((g) => [g.id, g.nen_tang]));
  const dongTay: (DongSanTay & { gianHangId: string })[] = tay.map((d) => ({ gianHangId: d.gian_hang_id, ngay: d.ngay, nenTang: nen.get(d.gian_hang_id) ?? "Khác", doanhThu: d.doanh_thu ?? 0, hoan: d.doanh_thu_hoan ?? 0 }));
  const shopeeKeo = keo.map((d) => ({ ngay: d.ngay, doanhThu: Number(d.doanh_thu ?? 0), soDon: d.so_don ?? 0 }));
  const { theoNguon, ngayShopeeKeo } = gopDoanhThuSan(dongTay, shopeeKeo);
  return {
    theoNguon,
    ngayShopeeKeo,
    gianHang: gh,
    dongTay,
    shopeeKeoTong: shopeeKeo.filter((d) => ngayShopeeKeo.has(d.ngay)).reduce((a, d) => a + d.doanhThu, 0),
    shopeeDaNoi: trangThaiKhoa(process.env).shopee,
    /** Doanh thu sàn đã trừ hoàn, cộng 3 nguồn. */
    tongRong: theoNguon.reduce((a, n) => a + n.rong, 0),
  };
}
