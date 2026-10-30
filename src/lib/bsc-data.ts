import "server-only";
import { dbHr } from "@/lib/hr-db";
import { tinhCay, type ChiSoVao, type ThangSo } from "@/lib/bsc";
import type { CachGop } from "@/lib/bsc";

const so = (v: unknown) => (v === null || v === undefined ? null : Number(v));

/** Cây BSC của một năm đến hết tháng `den` + các tháng đã khoá + danh sách năm có số liệu. */
export async function taiBsc(nam: number, den: number) {
  const db = dbHr();
  const [goc, muc, cs, khoa] = await Promise.all([
    db.from("bsc_goc_nhin").select("id, ten").eq("hoat_dong", true).order("sap_xep").limit(50),
    db.from("bsc_muc_tieu").select("id, goc_nhin_id, ten, mo_ta").eq("hoat_dong", true).order("sap_xep").limit(500),
    db.from("bsc_chi_so").select("id, muc_tieu_id, ten, don_vi, cach_gop, trong_so").eq("nam", nam).eq("hoat_dong", true).order("sap_xep").limit(2000),
    db.from("bsc_khoa_thang").select("thang").eq("nam", nam),
  ]);
  const ids = (cs.data ?? []).map((c) => c.id as string);
  const { data: th } = ids.length ? await db.from("bsc_chi_so_thang").select("chi_so_id, thang, ke_hoach, thuc_te").in("chi_so_id", ids).limit(30000) : { data: [] };
  const theoCs = new Map<string, ThangSo[]>();
  for (const t of th ?? []) (theoCs.get(t.chi_so_id as string) ?? theoCs.set(t.chi_so_id as string, []).get(t.chi_so_id as string)!).push({ thang: Number(t.thang), keHoach: so(t.ke_hoach), thucTe: so(t.thuc_te) });
  const chiSo: ChiSoVao[] = (cs.data ?? []).map((c) => ({ id: c.id, mucTieuId: c.muc_tieu_id, ten: c.ten, donVi: c.don_vi ?? "", cachGop: c.cach_gop as CachGop, trongSo: Number(c.trong_so), thangs: theoCs.get(c.id as string) ?? [] }));
  const cay = tinhCay((goc.data ?? []).map((g) => ({ id: g.id, ten: g.ten })), (muc.data ?? []).map((m) => ({ id: m.id, gocNhinId: m.goc_nhin_id, ten: m.ten, moTa: m.mo_ta ?? "" })), chiSo, den);
  return { cay, chiSo, khoa: new Set((khoa.data ?? []).map((k) => Number(k.thang))), coMucTieu: (muc.data ?? []).length > 0 };
}

export const namHienTai = () => Number(new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 4));
export const thangHienTai = () => Number(new Date(Date.now() + 7 * 3600e3).toISOString().slice(5, 7));
export const docNamThang = (nam?: string, thang?: string) => {
  const n = Number(nam), t = Number(thang);
  return { nam: Number.isInteger(n) && n >= 2020 && n <= 2100 ? n : namHienTai(), thang: Number.isInteger(t) && t >= 1 && t <= 12 ? t : thangHienTai() };
};
