import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { khongCanChamCong, nenLaQuanTri } from "@/lib/chuc-danh";
import { soNgayNghi } from "@/lib/don-tu";

export type NguoiCanCham = { nhanVienId: string; userId: string; hoTen: string; vao: string | null; ra: string | null };
export type Nhac = { khung: string; tieuDe: string; noiDung: string; url: string };

const congNgay = (d: string, n: number) => new Date(Date.parse(`${d}T00:00:00Z`) + n * 864e5).toISOString().slice(0, 10);
const NGHI_CA_NGAY = new Set(["Nghỉ phép năm", "Nghỉ không lương", "Nghỉ ốm"]);
// Đơn đã duyệt phủ cả ngày thì người đó không phải chấm công (cùng quy tắc với bảng công: lib/cong.ts).
const KHONG_CHAM = new Set(["Nghỉ chế độ", "Công tác", "Làm remote", "Chấm công ngoài công ty"]);

/** Những người PHẢI chấm công trong `ngay` (kèm giờ vào/ra đã có): Thứ Hai đến Thứ Bảy, không phải ngày lễ, đã tới ngày vào làm, có tài khoản,
 *  không thuộc nhóm miễn chấm công (Tổng giám đốc, Giám đốc, Kỹ thuật) và không có đơn nghỉ/công tác/làm ngoài cả ngày đã duyệt.
 *  Chuông, thông báo đẩy và tổng hợp đều gọi hàm này nên không bao giờ lệch nhau. `userId` chỉ lấy một người. */
export async function nguoiPhaiChamCong(ngay: string, userId?: string): Promise<NguoiCanCham[]> {
  if (new Date(`${ngay}T00:00:00Z`).getUTCDay() === 0) return [];
  const db = createAdminClient();
  let qNv = db.from("nhan_vien").select("id, user_id, ho_ten, chuc_danh, ngay_vao_lam").neq("trang_thai", "Đã nghỉ").not("user_id", "is", null);
  if (userId) qNv = qNv.eq("user_id", userId);
  const [{ data: le }, { data: nvs }, { data: dons }, { data: ccs }] = await Promise.all([
    db.from("ngay_le").select("ngay").eq("ngay", ngay).maybeSingle(),
    qNv,
    db.from("don_tu").select("nhan_vien_id, loai, tu_ngay, den_ngay, gio_tu, gio_den").eq("trang_thai", "Đã duyệt").lte("tu_ngay", ngay).gte("den_ngay", ngay),
    db.from("cham_cong").select("nhan_vien_id, gio_vao, gio_ra").eq("ngay", ngay),
  ]);
  if (le || !nvs?.length) return [];
  // Vai trò lưu ở app_metadata của tài khoản: chỉ cần biết ai là Kỹ thuật.
  const kyThuat = new Set<string>();
  if (userId) {
    const { data } = await db.auth.admin.getUserById(userId);
    if (data.user?.app_metadata?.vai_tro === "ky_thuat") kyThuat.add(userId);
  } else {
    const { data } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
    for (const u of data?.users ?? []) if (u.app_metadata?.vai_tro === "ky_thuat") kyThuat.add(u.id);
  }
  const donTheo = new Map<string, NonNullable<typeof dons>>();
  for (const d of dons ?? []) donTheo.set(d.nhan_vien_id, [...(donTheo.get(d.nhan_vien_id) ?? []), d]);
  const ccTheo = new Map((ccs ?? []).map((c) => [c.nhan_vien_id, c]));
  return nvs.flatMap((n) => {
    if (!n.user_id || khongCanChamCong(kyThuat.has(n.user_id) ? "ky_thuat" : "nhan_vien", n.chuc_danh)) return [];
    if (n.ngay_vao_lam && ngay < n.ngay_vao_lam) return [];
    const phu = donTheo.get(n.id) ?? [];
    const caNgay = phu.some((d) => KHONG_CHAM.has(d.loai) || (NGHI_CA_NGAY.has(d.loai) && ((!d.gio_tu && !d.gio_den) || soNgayNghi(d.tu_ngay, d.den_ngay, d.gio_tu, d.gio_den) >= 1)));
    if (caNgay) return [];
    const c = ccTheo.get(n.id);
    return [{ nhanVienId: n.id, userId: n.user_id, hoTen: n.ho_ten, vao: c?.gio_vao ?? null, ra: c?.gio_ra ?? null }];
  });
}

const VAO = 8 * 60, RA = 17 * 60;
/** Thời hạn nhắc: chưa chấm công vào thì nhắc đến 11:05 (3 giờ), chưa chấm công ra thì nhắc đến 20:00. Chấm xong là dừng ngay. */
const HET_NHAC_VAO = 11 * 60 + 5, HET_NHAC_RA = 20 * 60;

/** Việc cần nhắc NGAY BÂY GIỜ cho một người (null = không cần). `khung` là khoá chống gửi trùng: mỗi 10 phút một khung, nên "nhắc liên tục" nhưng không dồn dập.
 *  Từ lần nhắc thứ hai trở đi trỏ sang đơn giải trình / chấm công ngoài công ty, vì người không chấm được (thường do lỗi định vị) cần một lối ra. */
export function nhacHienTai(c: { vao: string | null; ra: string | null }, phut: number): Nhac | null {
  if (!c.vao) {
    if (phut >= VAO - 10 && phut < VAO) {
      const sau = phut >= VAO - 5;
      return { khung: sau ? "vao_t5" : "vao_t10", tieuDe: "Sắp đến giờ chấm công vào", noiDung: `Còn khoảng ${sau ? 5 : 10} phút nữa đến 08:00. Nhớ chấm công vào nhé.`, url: "/cham-cong" };
    }
    if (phut >= VAO + 5 && phut < HET_NHAC_VAO) {
      const n = Math.floor((phut - (VAO + 5)) / 10);
      return n === 0
        ? { khung: "vao_l0", tieuDe: "Bạn chưa chấm công vào", noiDung: "Đã quá 08:00. Chấm công ngay để không bị tính vắng.", url: "/cham-cong" }
        : { khung: `vao_l${n}`, tieuDe: "Vẫn chưa chấm công vào", noiDung: "Chấm công chưa được (lỗi vị trí)? Gửi đơn Giải trình công hoặc Chấm công ngoài công ty để vẫn được tính công.", url: "/don-tu" };
    }
    return null;
  }
  if (!c.ra) {
    if (phut >= RA - 10 && phut < RA) {
      const sau = phut >= RA - 5;
      return { khung: sau ? "ra_t5" : "ra_t10", tieuDe: "Sắp hết giờ làm", noiDung: `Còn khoảng ${sau ? 5 : 10} phút nữa đến 17:00. Nhớ chấm công ra khi về.`, url: "/cham-cong" };
    }
    if (phut >= RA && phut < HET_NHAC_RA) {
      const n = Math.floor((phut - RA) / 10);
      return n === 0
        ? { khung: "ra_l0", tieuDe: "Nhớ chấm công ra", noiDung: "Đã hết giờ làm 17:00. Chấm công ra trước khi rời văn phòng nhé.", url: "/cham-cong" }
        : { khung: `ra_l${n}`, tieuDe: "Vẫn chưa chấm công ra", noiDung: "Chấm công chưa được (lỗi vị trí)? Gửi đơn Giải trình công để được tính đủ giờ.", url: "/don-tu" };
    }
  }
  return null;
}

/** Ngày làm việc gần nhất trước `ngay` (bỏ Chủ nhật và ngày lễ). */
export async function ngayLamViecTruoc(ngay: string): Promise<string> {
  const { data } = await createAdminClient().from("ngay_le").select("ngay").gte("ngay", congNgay(ngay, -7)).lt("ngay", ngay);
  const le = new Set((data ?? []).map((l) => l.ngay));
  for (let i = 1; i <= 7; i++) {
    const d = congNgay(ngay, -i);
    if (new Date(`${d}T00:00:00Z`).getUTCDay() !== 0 && !le.has(d)) return d;
  }
  return congNgay(ngay, -1);
}

/** Người thiếu check in / check out ở ngày làm việc trước mà CHƯA gửi đơn Giải trình công cho ngày đó (đơn chờ duyệt hoặc đã duyệt đều tính là đã xử lý). */
export async function thieuNgayTruoc(ngay: string, userId?: string): Promise<(NguoiCanCham & { thieu: "vao" | "ra" | "ca-hai" })[]> {
  const ds = (await nguoiPhaiChamCong(ngay, userId)).filter((n) => !n.vao || !n.ra);
  if (!ds.length) return [];
  const { data } = await createAdminClient().from("don_tu").select("nhan_vien_id").eq("loai", "Giải trình công").in("trang_thai", ["Chờ duyệt", "Đã duyệt"]).lte("tu_ngay", ngay).gte("den_ngay", ngay);
  const daGui = new Set((data ?? []).map((d) => d.nhan_vien_id));
  return ds.filter((n) => !daGui.has(n.nhanVienId)).map((n) => ({ ...n, thieu: !n.vao && !n.ra ? "ca-hai" : !n.vao ? "vao" : "ra" }));
}
export const NHAN_THIEU = { vao: "check in", ra: "check out", "ca-hai": "check in và check out" } as const;

/** Tài khoản quản lý nhận việc của cả công ty: Kỹ thuật và Quản trị (theo vị trí). */
export async function layNguoiQuanLy(): Promise<string[]> {
  const db = createAdminClient();
  const [{ data: nvs }, { data: us }] = await Promise.all([
    db.from("nhan_vien").select("user_id, chuc_danh, trang_thai, khoi(ten)").not("user_id", "is", null),
    db.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ]);
  const ra = new Set<string>();
  for (const u of us?.users ?? []) if (u.app_metadata?.vai_tro === "ky_thuat") ra.add(u.id);
  for (const n of nvs ?? []) if (n.user_id && n.trang_thai !== "Đã nghỉ" && nenLaQuanTri(n.chuc_danh, (n.khoi as { ten?: string } | null)?.ten)) ra.add(n.user_id);
  return [...ra];
}
