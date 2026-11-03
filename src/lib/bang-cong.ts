import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { khongCanChamCong } from "@/lib/chuc-danh";
import { layUserIdKyThuat, ngayHomNayHCM } from "@/lib/data";
import { congConThieu, congMotNgay, lechGioMotNgay, ngayIso, soNgayCuaThang, tongHopCong, type DonDaDuyet, type LechGio, type OCong, type TongHopCong } from "@/lib/cong";

export type DongBangCong = {
  nhanVienId: string;
  hoTen: string;
  maNhanVien: string | null;
  khoi: string;
  chucDanh: string;
  mienChamCong: boolean;
  /** Ô công của từng ngày trong tháng (chỉ số 0 = ngày 1). */
  o: OCong[];
  /** Lệch giờ từng ngày (cùng chỉ số với `o`); null = đúng giờ hoặc không xét. */
  lech: (LechGio | null)[];
  tong: TongHopCong;
  /** Số ngày vào trễ / check out sớm KHÔNG có đơn đã duyệt. */
  soMuon: number;
  soSom: number;
  /** Số ngày tính công trong tháng tới hôm nay, và công còn thiếu so với số đó. */
  ngayTinhCong: number;
  thieuCong: number;
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
    db.from("nhan_vien").select("id, ho_ten, ma_nhan_vien, chuc_danh, user_id, ngay_vao_lam, quyen_giam_doc, khoi(ten)").neq("trang_thai", "Đã nghỉ").order("ho_ten"),
    docHet((a, b) => db.from("cham_cong").select("nhan_vien_id, ngay, gio_vao, gio_ra").gte("ngay", tu).lte("ngay", den).order("ngay").range(a, b)),
    docHet((a, b) =>
      db.from("don_tu").select("nhan_vien_id, loai, tu_ngay, den_ngay, gio_tu, gio_den").eq("trang_thai", "Đã duyệt").lte("tu_ngay", den).gte("den_ngay", tu).order("created_at").range(a, b),
    ),
    layNgayLe(nam),
    layUserIdKyThuat(),
  ]);
  if (nv.error) throw new Error(nv.error.message);

  const lePhan = new Set(le.map((l) => l.ngay));
  const chamTheoNguoi = new Map<string, Set<string>>();
  const gioTheoNguoi = new Map<string, Map<string, { gio_vao: string | null; gio_ra: string | null }>>();
  for (const c of cc) {
    if (c.gio_vao) (chamTheoNguoi.get(c.nhan_vien_id) ?? chamTheoNguoi.set(c.nhan_vien_id, new Set()).get(c.nhan_vien_id)!).add(c.ngay);
    (gioTheoNguoi.get(c.nhan_vien_id) ?? gioTheoNguoi.set(c.nhan_vien_id, new Map()).get(c.nhan_vien_id)!).set(c.ngay, { gio_vao: c.gio_vao, gio_ra: c.gio_ra });
  }
  const donTheoNguoi = new Map<string, DonDaDuyet[]>();
  for (const d of don) (donTheoNguoi.get(d.nhan_vien_id) ?? donTheoNguoi.set(d.nhan_vien_id, []).get(d.nhan_vien_id)!).push(d);

  const dong: DongBangCong[] = (nv.data ?? []).map((n) => {
    const mien = khongCanChamCong(n.user_id && kyThuat.has(n.user_id) ? "ky_thuat" : null, n.chuc_danh, n.quyen_giam_doc);
    const co = chamTheoNguoi.get(n.id) ?? new Set<string>();
    const dn = donTheoNguoi.get(n.id) ?? [];
    const o = Array.from({ length: soNgay }, (_, i) => {
      const ngay = ngayIso(nam, thang, i + 1);
      return congMotNgay({ ngay, homNay, laNgayLe: lePhan.has(ngay), coChamCong: co.has(ngay), mienChamCong: mien, ngayVaoLam: n.ngay_vao_lam, don: dn });
    });
    const gio = gioTheoNguoi.get(n.id);
    const lech = o.map((c, i) => (mien ? null : lechGioMotNgay(c, gio?.get(ngayIso(nam, thang, i + 1)), ngayIso(nam, thang, i + 1), homNay, dn)));
    const { ngayTinhCong, thieu } = congConThieu(o);
    return {
      nhanVienId: n.id, hoTen: n.ho_ten, maNhanVien: n.ma_nhan_vien, khoi: n.khoi?.ten ?? "", chucDanh: n.chuc_danh ?? "", mienChamCong: mien, o, lech, tong: tongHopCong(o),
      soMuon: lech.filter((l) => l?.muon && !l.muonCoDon).length, soSom: lech.filter((l) => l?.som && !l.somCoDon).length, ngayTinhCong, thieuCong: thieu,
    };
  });
  return { dong, ngayLe: le, soNgay, homNay };
}
