import "server-only";
import { dbHr } from "@/lib/hr-db";
import { gopTheo, tongHop, trangThaiKhoa, type DongSoLieu } from "@/lib/quang-cao";

export type NenTang = "facebook" | "tiktok";
const BANG = {
  facebook: { tk: "qc_meta_tai_khoan", cd: "qc_meta_chien_dich", nhom: "qc_meta_nhom", qc: "qc_meta_quang_cao", sl: "qc_meta_so_lieu", ketQua: false },
  tiktok: { tk: "qc_tiktok_tai_khoan", cd: "qc_tiktok_chien_dich", nhom: "qc_tiktok_nhom", qc: "qc_tiktok_quang_cao", sl: "qc_tiktok_so_lieu", ketQua: true },
} as const;

/** Đọc hết số liệu trong khoảng ngày (nhiều hơn 1000 dòng thì đọc từng trang). */
async function docSoLieu(nt: NenTang, tu: string, den: string) {
  const b = BANG[nt], db = dbHr();
  const ra: DongSoLieu[] = [];
  for (let i = 0; i < 200_000; i += 1000) {
    const { data } = await db.from(b.sl).select(`quang_cao_id, ngay, chi_tieu, hien_thi, nhap, tiep_can${b.ketQua ? ", ket_qua" : ""}`).gte("ngay", tu).lte("ngay", den).order("ngay").order("quang_cao_id").range(i, i + 999);
    for (const r of (data ?? []) as unknown as Record<string, string | number>[]) ra.push({ quangCaoId: String(r.quang_cao_id), ngay: String(r.ngay), chiTieu: Number(r.chi_tieu), hienThi: Number(r.hien_thi), nhap: Number(r.nhap), tiepCan: Number(r.tiep_can), ketQua: b.ketQua ? Number(r.ket_qua) : 0 });
    if (!data || data.length < 1000) break;
  }
  return ra;
}

export type DongCapDoi = { id: string; ten: string; trangThai: string | null; tong: ReturnType<typeof tongHop> };

/** Bảng tổng + danh sách chiến dịch (hoặc nhóm trong một chiến dịch, hoặc quảng cáo trong một nhóm) kèm số liệu trong khoảng ngày. */
export async function bangQuangCao(nt: NenTang, tu: string, den: string, cap: { chienDich?: string; nhom?: string }) {
  const b = BANG[nt], db = dbHr();
  const [sl, tk, ls] = await Promise.all([
    docSoLieu(nt, tu, den),
    db.from(b.tk).select("id, ten, dong_bo_luc").order("ten").limit(100),
    db.from("qc_nhat_ky_dong_bo").select("trang_thai, bat_dau, so_dong, ghi_chu").eq("nen_tang", nt === "facebook" ? "Facebook" : "TikTok").order("bat_dau", { ascending: false }).limit(1),
  ]);
  const [cd, nh, qc] = await Promise.all([
    db.from(b.cd).select("id, ten, trang_thai, tai_khoan_id").limit(2000),
    db.from(b.nhom).select("id, ten, trang_thai, chien_dich_id").limit(5000),
    db.from(b.qc).select("id, ten, trang_thai, nhom_id, chien_dich_id").limit(10000),
  ]);
  const nhomCua = new Map((qc.data ?? []).map((x) => [x.id as string, { nhom: x.nhom_id as string, cd: x.chien_dich_id as string }]));
  const nhomThuoc = new Map((nh.data ?? []).map((x) => [x.id as string, x.chien_dich_id as string]));
  const theoQc = gopTheo(sl, (x) => x.quangCaoId);
  const theoNhom = gopTheo(sl.filter((x) => nhomCua.has(x.quangCaoId)), (x) => nhomCua.get(x.quangCaoId)!.nhom);
  const theoCd = gopTheo(sl.filter((x) => nhomCua.has(x.quangCaoId)), (x) => nhomCua.get(x.quangCaoId)!.cd);
  const dong = (r: { id: unknown; ten: unknown; trang_thai: unknown }, m: Map<string, ReturnType<typeof tongHop>>): DongCapDoi => ({ id: String(r.id), ten: String(r.ten), trangThai: (r.trang_thai as string | null) ?? null, tong: m.get(String(r.id)) ?? tongHop([]) });
  const danhSach = cap.nhom
    ? (qc.data ?? []).filter((x) => x.nhom_id === cap.nhom).map((x) => dong(x, theoQc))
    : cap.chienDich
      ? (nh.data ?? []).filter((x) => x.chien_dich_id === cap.chienDich).map((x) => dong(x, theoNhom))
      : (cd.data ?? []).map((x) => dong(x, theoCd));
  void nhomThuoc;
  danhSach.sort((a, c) => c.tong.chiTieu - a.tong.chiTieu);
  return {
    tong: tongHop(sl), soLieu: sl, danhSach, taiKhoan: (tk.data ?? []).length,
    lanCuoi: (ls.data?.[0] ?? null) as { trang_thai: string; bat_dau: string; so_dong: number; ghi_chu: string | null } | null,
    khoa: trangThaiKhoa(process.env),
  };
}

type SoLieuNen = { chi_tieu: number | string; don: number | string; doanh_thu: number | string };
const cong = (ds: SoLieuNen[]) => ds.reduce<{ chiTieu: number; don: number; doanhThu: number }>((a, x) => ({ chiTieu: a.chiTieu + Number(x.chi_tieu), don: a.don + Number(x.don), doanhThu: a.doanhThu + Number(x.doanh_thu) }), { chiTieu: 0, don: 0, doanhThu: 0 });

/** Đọc hết một bảng số liệu ngày trong khoảng (từng trang 1000 dòng). */
async function docTrang(bang: string, cot: string, tu: string, den: string, cotNgay = "ngay") {
  const db = dbHr(), ra: Record<string, string | number>[] = [];
  for (let i = 0; i < 200_000; i += 1000) {
    const { data } = await db.from(bang).select(cot).gte(cotNgay, tu).lte(cotNgay, den).order(cotNgay).range(i, i + 999);
    ra.push(...((data ?? []) as unknown as Record<string, string | number>[]));
    if (!data || data.length < 1000) break;
  }
  return ra;
}

/** Số liệu Shopee theo ngày (doanh thu, đơn, quảng cáo) cho các gian hàng trong khoảng. */
export async function bangShopee(tu: string, den: string) {
  const db = dbHr();
  const [sl, gh, ls] = await Promise.all([
    docTrang("qc_shopee_so_lieu_ngay", "gian_hang_id, ngay, so_don, don_huy, doanh_thu, chi_phi_qc, hien_thi_qc, nhap_qc, don_tu_qc, doanh_thu_tu_qc", tu, den),
    db.from("qc_shopee_gian_hang").select("id, ten").order("ten").limit(100),
    db.from("qc_nhat_ky_dong_bo").select("trang_thai, bat_dau, so_dong, ghi_chu").eq("nen_tang", "Shopee").order("bat_dau", { ascending: false }).limit(1),
  ]);
  const tong = sl.reduce<Record<"soDon" | "donHuy" | "doanhThu" | "chiPhiQc" | "hienThi" | "nhap" | "donQc" | "doanhThuQc", number>>((a, x) => ({ soDon: a.soDon + Number(x.so_don), donHuy: a.donHuy + Number(x.don_huy), doanhThu: a.doanhThu + Number(x.doanh_thu), chiPhiQc: a.chiPhiQc + Number(x.chi_phi_qc), hienThi: a.hienThi + Number(x.hien_thi_qc), nhap: a.nhap + Number(x.nhap_qc), donQc: a.donQc + Number(x.don_tu_qc), doanhThuQc: a.doanhThuQc + Number(x.doanh_thu_tu_qc) }), { soDon: 0, donHuy: 0, doanhThu: 0, chiPhiQc: 0, hienThi: 0, nhap: 0, donQc: 0, doanhThuQc: 0 });
  const theoGianHang = (gh.data ?? []).map((g) => { const r = sl.filter((x) => x.gian_hang_id === g.id); return { id: g.id as string, ten: g.ten as string, soDon: r.reduce((a, x) => a + Number(x.so_don), 0), doanhThu: r.reduce((a, x) => a + Number(x.doanh_thu), 0), chiPhiQc: r.reduce((a, x) => a + Number(x.chi_phi_qc), 0) }; });
  return { tong, theoGianHang, theoNgay: sl.map((x) => ({ ngay: String(x.ngay), doanhThu: Number(x.doanh_thu), chiTieu: Number(x.chi_phi_qc) })), lanCuoi: (ls.data?.[0] ?? null) as { trang_thai: string; bat_dau: string; so_dong: number; ghi_chu: string | null } | null, khoa: trangThaiKhoa(process.env) };
}

/** Bảng so sánh ba nền tảng trong khoảng: chi tiêu quảng cáo, đơn và doanh thu TỪ QUẢNG CÁO (cùng một thước đo để so sánh được). */
export async function tongQuanNenTang(tu: string, den: string) {
  const [fb, tt, sp] = await Promise.all([
    docTrang("qc_meta_so_lieu", "chi_tieu, don_mua, doanh_thu", tu, den),
    docTrang("qc_tiktok_so_lieu", "chi_tieu, chuyen_doi, doanh_thu", tu, den),
    docTrang("qc_shopee_so_lieu_ngay", "chi_phi_qc, don_tu_qc, doanh_thu_tu_qc, so_don, doanh_thu", tu, den),
  ]);
  const f = cong(fb.map((x) => ({ chi_tieu: x.chi_tieu, don: x.don_mua, doanh_thu: x.doanh_thu })));
  const t = cong(tt.map((x) => ({ chi_tieu: x.chi_tieu, don: x.chuyen_doi, doanh_thu: x.doanh_thu })));
  const s = cong(sp.map((x) => ({ chi_tieu: x.chi_phi_qc, don: x.don_tu_qc, doanh_thu: x.doanh_thu_tu_qc })));
  const caGianHang = sp.reduce<{ don: number; doanhThu: number }>((a, x) => ({ don: a.don + Number(x.so_don), doanhThu: a.doanhThu + Number(x.doanh_thu) }), { don: 0, doanhThu: 0 });
  return { facebook: f, tiktok: t, shopee: s, shopeeCaGianHang: caGianHang, khoa: trangThaiKhoa(process.env) };
}
