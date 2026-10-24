import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { khongCanChamCong } from "@/lib/chuc-danh";
import { layUserIdKyThuat, ngayHomNayHCM } from "@/lib/data";
import { congMotNgay, ngayIso, soNgayCuaThang, tongHopCong, type DonDaDuyet, type OCong, type TongHopCong } from "@/lib/cong";

export type DongBangCong = {
  nhanVienId: string;
  hoTen: string;
  maNhanVien: string | null;
  khoi: string;
  chucDanh: string;
  mienChamCong: boolean;
  /** Ô công của từng ngày trong tháng (chỉ số 0 = ngày 1). */
  o: OCong[];
  tong: TongHopCong;
};

export type NgayLe = { ngay: string; ten: string };

/** Đọc hết các dòng của một truy vấn (Supabase trả tối đa 1000 dòng mỗi lần). */
async function docHet<T>(lay: (tu: number, den: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>) {
  const ra: T[] = [];
  for (let tu = 0; ; tu += 1000) {
    const { data, error } = await lay(tu, tu + 999);
    if (error) throw new Error(error.message);
    ra.push(...(data ?? []));
    if (!data || data.length < 1000) return ra;
  }
}

export async function layNgayLe(nam?: number): Promise<NgayLe[]> {
  let q = createAdminClient().from("ngay_le").select("ngay, ten").order("ngay");
  if (nam) q = q.gte("ngay", `${nam}-01-01`).lte("ngay", `${nam}-12-31`);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data ?? [];
}

/** Bảng công của MỌI nhân viên còn làm trong tháng: mã công từng ngày + tổng hợp.
 * Cùng hàm `congMotNgay` với lập bảng lương, nên bảng công và bảng lương không thể lệch nhau. */
export async function layBangCongThang(nam: number, thang: number): Promise<{ dong: DongBangCong[]; ngayLe: NgayLe[]; soNgay: number; homNay: string }> {
  const db = createAdminClient();
  const soNgay = soNgayCuaThang(nam, thang);
  const tu = ngayIso(nam, thang, 1);
  const den = ngayIso(nam, thang, soNgay);
  const homNay = ngayHomNayHCM();

  const [nv, cc, don, le, kyThuat] = await Promise.all([
    db.from("nhan_vien").select("id, ho_ten, ma_nhan_vien, chuc_danh, user_id, ngay_vao_lam, khoi(ten)").neq("trang_thai", "Đã nghỉ").order("ho_ten"),
    docHet((a, b) => db.from("cham_cong").select("nhan_vien_id, ngay, gio_vao").gte("ngay", tu).lte("ngay", den).order("ngay").range(a, b)),
    docHet((a, b) =>
      db.from("don_tu").select("nhan_vien_id, loai, tu_ngay, den_ngay, gio_tu, gio_den").eq("trang_thai", "Đã duyệt").lte("tu_ngay", den).gte("den_ngay", tu).order("created_at").range(a, b),
    ),
    layNgayLe(nam),
    layUserIdKyThuat(),
  ]);
  if (nv.error) throw new Error(nv.error.message);

  const lePhan = new Set(le.map((l) => l.ngay));
  const chamTheoNguoi = new Map<string, Set<string>>();
  for (const c of cc) if (c.gio_vao) (chamTheoNguoi.get(c.nhan_vien_id) ?? chamTheoNguoi.set(c.nhan_vien_id, new Set()).get(c.nhan_vien_id)!).add(c.ngay);
  const donTheoNguoi = new Map<string, DonDaDuyet[]>();
  for (const d of don) (donTheoNguoi.get(d.nhan_vien_id) ?? donTheoNguoi.set(d.nhan_vien_id, []).get(d.nhan_vien_id)!).push(d);

  const dong: DongBangCong[] = (nv.data ?? []).map((n) => {
    const mien = khongCanChamCong(n.user_id && kyThuat.has(n.user_id) ? "ky_thuat" : null, n.chuc_danh);
    const co = chamTheoNguoi.get(n.id) ?? new Set<string>();
    const dn = donTheoNguoi.get(n.id) ?? [];
    const o = Array.from({ length: soNgay }, (_, i) => {
      const ngay = ngayIso(nam, thang, i + 1);
      return congMotNgay({ ngay, homNay, laNgayLe: lePhan.has(ngay), coChamCong: co.has(ngay), mienChamCong: mien, ngayVaoLam: n.ngay_vao_lam, don: dn });
    });
    return { nhanVienId: n.id, hoTen: n.ho_ten, maNhanVien: n.ma_nhan_vien, khoi: n.khoi?.ten ?? "", chucDanh: n.chuc_danh ?? "", mienChamCong: mien, o, tong: tongHopCong(o) };
  });
  return { dong, ngayLe: le, soNgay, homNay };
}
