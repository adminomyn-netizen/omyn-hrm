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
