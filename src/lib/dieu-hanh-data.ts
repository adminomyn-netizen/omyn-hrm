import "server-only";
import { dbHr } from "@/lib/hr-db";
import { congNgay, hopDongCanNhac, soNgayTu } from "@/lib/nhac-hr";

/** Những việc HCNS cần chú ý ngay: hợp đồng sắp hết hạn, offer chờ, phỏng vấn tuần này, người đang thử việc. */
export async function hrCanChuY(homNay: string) {
  const db = dbHr();
  const [hd, of, pv, tv] = await Promise.all([
    db.from("hop_dong_lao_dong").select("id, nhan_vien_id, ten_nguoi_ky, den_ngay, trang_thai, nhan_vien(ho_ten)").eq("trang_thai", "Đang hiệu lực").not("den_ngay", "is", null).gte("den_ngay", congNgay(homNay, -7)).lte("den_ngay", congNgay(homNay, 45)).order("den_ngay").limit(200),
    db.from("offer_tuyen_dung").select("id", { count: "exact", head: true }).in("trang_thai", ["Chờ duyệt", "Đã gửi", "Thương lượng"]),
    db.from("lich_phong_van").select("id", { count: "exact", head: true }).eq("ket_qua", "Chờ").gte("thoi_gian", `${homNay}T00:00:00+07:00`).lte("thoi_gian", `${congNgay(homNay, 7)}T23:59:59+07:00`),
    db.from("theo_doi_onboarding").select("id", { count: "exact", head: true }).eq("tinh_trang", "Đang thử việc"),
  ]);
  const hopDong = (hd.data ?? []).map((h) => ({ id: h.id as string, ten: ((Array.isArray(h.nhan_vien) ? h.nhan_vien[0] : h.nhan_vien) as { ho_ten?: string } | null)?.ho_ten ?? (h.ten_nguoi_ky as string | null) ?? "(chưa rõ)", den: h.den_ngay as string, con: soNgayTu(homNay, h.den_ngay as string) }));
  return { hopDong, hopDongMoc: hopDong.filter((h) => hopDongCanNhac(h.den, "Đang hiệu lực", homNay) !== null).length, offerCho: of.count ?? 0, phongVanTuan: pv.count ?? 0, dangThuViec: tv.count ?? 0 };
}

/** Thống kê công việc toàn công ty: quá hạn, hôm nay, đang làm, xong 7 ngày; người có nhiều việc quá hạn nhất. */
export async function thongKeCongViec(homNay: string) {
  const db = dbHr();
  const [mo, xong, ngay] = await Promise.all([
    db.from("cong_viec").select("id, nguoi_lam_id, han, lap_lai, trang_thai, nhan_vien!cong_viec_nguoi_lam_id_fkey(ho_ten)").in("trang_thai", ["Chưa làm", "Đang làm"]).limit(5000),
    db.from("cong_viec").select("id", { count: "exact", head: true }).eq("trang_thai", "Hoàn thành").gte("hoan_thanh_luc", `${congNgay(homNay, -6)}T00:00:00+07:00`),
    db.from("cong_viec_ngay").select("da_lam").eq("ngay", homNay).limit(5000),
  ]);
  const rows = mo.data ?? [];
  const quaHan = rows.filter((r) => r.lap_lai === "Không" && r.han && (r.han as string) < homNay);
  const theoNguoi = new Map<string, { ten: string; so: number }>();
  for (const r of quaHan) {
    const ten = ((Array.isArray(r.nhan_vien) ? r.nhan_vien[0] : r.nhan_vien) as { ho_ten?: string } | null)?.ho_ten ?? "(chưa rõ)";
    const x = theoNguoi.get(r.nguoi_lam_id as string) ?? { ten, so: 0 };
    x.so++; theoNguoi.set(r.nguoi_lam_id as string, x);
  }
  return {
    dangMo: rows.length, quaHan: quaHan.length, homNay: rows.filter((r) => r.han === homNay || r.lap_lai === "Hằng ngày").length, xong7Ngay: xong.count ?? 0,
    luotGhiHomNay: (ngay.data ?? []).reduce((a, x) => a + Number(x.da_lam), 0),
    nhieuQuaHan: [...theoNguoi.values()].sort((a, b) => b.so - a.so).slice(0, 5),
  };
}
