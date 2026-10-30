import "server-only";
import { cache } from "react";
import { layNguoiDungDaDuyet } from "@/lib/auth";
import { dbHr } from "@/lib/hr-db";
import { diemCacNguoi, diemCacPhong, xepHang, type ChiTieu, type Chieu, type DiemChiTieu, type Ky, type KetQuaNgay, type NguoiKpi, type XepHang } from "@/lib/kpi";

export const homNayHcm = () => new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" });

export type NguoiKpiDay = NguoiKpi & { quanLyId: string | null; ma: string | null };
export type Toi = { nhanVienId: string | null; khoiId: string | null; vaiTro: "admin" | "ky_thuat" | "nhan_vien"; hoTen: string; laTruongPhong: boolean; xemToanCongTy: boolean };

/** Sếp, Kỹ thuật và HCNS (đều là vai trò admin/ky_thuat) xem và nhập cho cả công ty. */
const QUAN_TRI = new Set(["admin", "ky_thuat"]);

/** Đọc hết một truy vấn dài hơn 1000 dòng (giới hạn mặc định của PostgREST). */
async function docHet<T>(lay: (tu: number, den: number) => PromiseLike<{ data: T[] | null }>): Promise<T[]> {
  const ra: T[] = [];
  for (let i = 0; i < 100_000; i += 1000) {
    const { data } = await lay(i, i + 999);
    ra.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  return ra;
}

/** Người, chỉ tiêu đang dùng, khối và "tôi là ai" — một lần cho mỗi yêu cầu. */
export const taiNen = cache(async () => {
  const nd = await layNguoiDungDaDuyet();
  const db = dbHr();
  const [nv, ct, kh] = await Promise.all([
    db.from("nhan_vien").select("id, ho_ten, ma_nhan_vien, khoi_id, quan_ly_id, user_id").neq("trang_thai", "Đã nghỉ").order("ho_ten").limit(2000),
    db.from("kpi_chi_tieu").select("id, khoi_id, ten, don_vi, muc_tieu_ngay, trong_so, chieu").eq("hoat_dong", true).order("tao_luc").limit(500),
    db.from("khoi").select("id, ten").order("ten").limit(200),
  ]);
  const nguoi: NguoiKpiDay[] = (nv.data ?? []).map((x) => ({ id: x.id, hoTen: x.ho_ten, khoiId: x.khoi_id, quanLyId: x.quan_ly_id, ma: x.ma_nhan_vien }));
  const chiTieu: (ChiTieu & { donVi: string })[] = (ct.data ?? []).map((x) => ({ id: x.id, khoiId: x.khoi_id, ten: x.ten, donVi: x.don_vi ?? "", mucTieuNgay: Number(x.muc_tieu_ngay), trongSo: x.trong_so, chieu: x.chieu as Chieu }));
  const khoi = new Map<string, string>((kh.data ?? []).map((x) => [x.id, x.ten]));
  const toiRow = (nv.data ?? []).find((x) => x.user_id === nd.id);
  const nhanVienId = toiRow?.id ?? null;
  const toi: Toi = {
    nhanVienId, khoiId: toiRow?.khoi_id ?? null, vaiTro: nd.vaiTro, hoTen: nd.hoTen,
    laTruongPhong: !!nhanVienId && nguoi.some((n) => n.quanLyId === nhanVienId),
    xemToanCongTy: QUAN_TRI.has(nd.vaiTro),
  };
  return { nguoi, chiTieu, khoi, toi };
});

/** Những người `toi` được nhập kết quả hộ: quản trị cả công ty; trưởng phòng (người được trỏ quan_ly_id) cho cấp dưới trực tiếp; ai cũng nhập được của chính mình. */
export function nguoiNhapDuoc(nen: Awaited<ReturnType<typeof taiNen>>): NguoiKpiDay[] {
  const { nguoi, toi } = nen;
  if (toi.xemToanCongTy) return nguoi;
  return nguoi.filter((n) => n.id === toi.nhanVienId || (!!toi.nhanVienId && n.quanLyId === toi.nhanVienId));
}

export async function docKetQua(tu: string, den: string): Promise<KetQuaNgay[]> {
  const db = dbHr();
  const dong = await docHet<{ nhan_vien_id: string; chi_tieu_id: string; ngay: string; thuc_te: number | string }>((a, b) =>
    db.from("kpi_ket_qua").select("nhan_vien_id, chi_tieu_id, ngay, thuc_te").gte("ngay", tu).lte("ngay", den).order("ngay").order("id").range(a, b));
  return dong.map((r) => ({ nhanVienId: r.nhan_vien_id, chiTieuId: r.chi_tieu_id, ngay: r.ngay, thucTe: Number(r.thuc_te) }));
}

export type Thuong = { kyLoai: "Tháng" | "Quý"; phamVi: "Phòng" | "Cá nhân trong phòng" | "Cá nhân toàn công ty"; hang: number; soTien: number; moTa: string | null };
export async function docThuong(): Promise<Thuong[]> {
  const { data } = await dbHr().from("kpi_thuong").select("ky_loai, pham_vi, hang, so_tien, mo_ta").limit(100);
  return (data ?? []).map((x) => ({ kyLoai: x.ky_loai, phamVi: x.pham_vi, hang: x.hang, soTien: Number(x.so_tien), moTa: x.mo_ta }));
}

export type DongNguoi = XepHang<{ id: string; ten: string; khoiId: string | null; diem: number }>;
export type DongPhong = XepHang<{ id: string; ten: string; diem: number; soNguoi: number }>;

/** Bảng xếp hạng của một kỳ: phòng, toàn công ty, trong từng phòng, kèm điểm chi tiết từng người (để người đó xem mình hụt ở đâu). */
export async function bangXepHang(ky: Ky) {
  const nen = await taiNen();
  const kq = await docKetQua(ky.tu, ky.den);
  const diem = diemCacNguoi(nen.nguoi, nen.chiTieu, kq);
  const phong = diemCacPhong(nen.nguoi, diem);
  const hangPhong: DongPhong[] = xepHang([...phong].map(([id, v]) => ({ id, ten: nen.khoi.get(id) ?? "Chưa rõ phòng", diem: v.diem, soNguoi: v.soNguoi })));
  const toanCongTy: DongNguoi[] = xepHang(nen.nguoi.filter((n) => diem.has(n.id)).map((n) => ({ id: n.id, ten: n.hoTen, khoiId: n.khoiId, diem: diem.get(n.id)!.diem })));
  const trongPhong = new Map<string, DongNguoi[]>();
  for (const [khoiId] of phong) trongPhong.set(khoiId, xepHang(toanCongTy.filter((x) => x.khoiId === khoiId).map(({ id, ten, khoiId: k, diem: d }) => ({ id, ten, khoiId: k, diem: d }))));
  const chiTiet = new Map<string, DiemChiTieu[]>([...diem].map(([id, v]) => [id, v.chiTiet]));
  const soNgayCoBao = new Set(kq.map((r) => r.ngay)).size;
  const daBaoHomNay = (id: string, ngay: string) => kq.some((r) => r.nhanVienId === id && r.ngay === ngay);
  return { nen, hangPhong, toanCongTy, trongPhong, chiTiet, soNgayCoBao, daBaoHomNay };
}
