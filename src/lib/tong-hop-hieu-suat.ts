import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { ngayVN } from "@/lib/dinh-dang";

export type LoaiKy = "tuan" | "thang" | "nam";
export type KyTongHop = { loai: LoaiKy; ky: string; tu: string; den: string; nhan: string };

const congNgay = (d: string, n: number) => new Date(Date.parse(`${d}T00:00:00Z`) + n * 864e5).toISOString().slice(0, 10);
const cuoiThang = (nam: number, thang: number) => new Date(Date.UTC(nam, thang, 0)).toISOString().slice(0, 10);

/** Kỳ vừa kết thúc cần báo hôm nay (theo giờ HCM): Thứ Hai → tuần trước; ngày 1 → tháng trước; 1/1 → năm trước. Có thể trả nhiều kỳ cùng lúc (vd Thứ Hai trùng ngày 1). */
export function kyCanBaoHomNay(homNay: string): KyTongHop[] {
  const ra: KyTongHop[] = [];
  const [y, m, d] = homNay.split("-").map(Number);
  if (new Date(`${homNay}T00:00:00Z`).getUTCDay() === 1) {
    const tu = congNgay(homNay, -7), den = congNgay(homNay, -1);
    ra.push({ loai: "tuan", ky: tu, tu, den, nhan: `tuần ${ngayVN(tu).slice(0, 5)} – ${ngayVN(den).slice(0, 5)}` });
  }
  if (d === 1) {
    const nam = m === 1 ? y - 1 : y, thang = m === 1 ? 12 : m - 1;
    ra.push({ loai: "thang", ky: `${nam}-${String(thang).padStart(2, "0")}`, tu: `${nam}-${String(thang).padStart(2, "0")}-01`, den: cuoiThang(nam, thang), nhan: `tháng ${String(thang).padStart(2, "0")}/${nam}` });
  }
  if (m === 1 && d === 1) ra.push({ loai: "nam", ky: String(y - 1), tu: `${y - 1}-01-01`, den: `${y - 1}-12-31`, nhan: `năm ${y - 1}` });
  return ra;
}

/** Tổng hợp hiệu suất của Omyn HRM trong một kỳ, toàn bằng số liệu thật: chuyên cần, đơn từ, nhân sự, tuyển dụng. */
export async function tinhTongHop(k: KyTongHop): Promise<{ tieuDe: string; noiDung: string; chiTiet: Record<string, number> }> {
  const db = createAdminClient();
  const [{ data: cc }, { data: don }, { data: nvMoi }, { count: dangLam }, { data: uv }] = await Promise.all([
    db.from("cham_cong").select("trang_thai, gio_ra, ngay").gte("ngay", k.tu).lte("ngay", k.den).limit(20000),
    db.from("don_tu").select("trang_thai").gte("created_at", `${k.tu}T00:00:00+07:00`).lt("created_at", `${congNgay(k.den, 1)}T00:00:00+07:00`).limit(20000),
    db.from("nhan_vien").select("id").gte("ngay_vao_lam", k.tu).lte("ngay_vao_lam", k.den),
    db.from("nhan_vien").select("id", { count: "exact", head: true }).neq("trang_thai", "Đã nghỉ"),
    db.from("ung_vien").select("id").gte("ngay_nhan_ho_so", k.tu).lte("ngay_nhan_ho_so", k.den),
  ]);
  const luot = cc?.length ?? 0, dungGio = (cc ?? []).filter((c) => c.trang_thai === "Đúng giờ").length, diMuon = (cc ?? []).filter((c) => c.trang_thai === "Đi muộn").length;
  const thieuRa = (cc ?? []).filter((c) => !c.gio_ra).length;
  const duyet = (don ?? []).filter((d) => d.trang_thai === "Đã duyệt").length, tuChoi = (don ?? []).filter((d) => d.trang_thai === "Từ chối").length, cho = (don ?? []).filter((d) => d.trang_thai === "Chờ duyệt").length;
  const ty = luot ? Math.round((dungGio / luot) * 100) : 0;
  const chiTiet = { luot, dungGio, diMuon, thieuRa, donDuyet: duyet, donTuChoi: tuChoi, donCho: cho, nhanSuMoi: nvMoi?.length ?? 0, dangLam: dangLam ?? 0, ungVienMoi: uv?.length ?? 0, tyLeDungGio: ty };
  const noiDung = [
    luot ? `Chuyên cần: ${luot} lượt chấm công, đúng giờ ${ty}% (${dungGio}), đi muộn ${diMuon}, thiếu giờ ra ${thieuRa}.` : "Chuyên cần: chưa có lượt chấm công nào.",
    `Đơn từ: ${duyet} duyệt, ${tuChoi} từ chối, ${cho} chờ.`,
    `Nhân sự: mới vào ${chiTiet.nhanSuMoi}, đang làm ${chiTiet.dangLam}. Ứng viên mới: ${chiTiet.ungVienMoi}.`,
  ].join(" ");
  return { tieuDe: `Tổng hợp hiệu suất ${k.nhan}`, noiDung, chiTiet };
}
