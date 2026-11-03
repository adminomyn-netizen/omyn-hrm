"use server";

import { revalidatePath } from "next/cache";
import { layNguoiDungHienTai } from "@/lib/auth";
import { quyenTrenSo } from "@/lib/quyen-nghiep-vu";
import { dbHr, docTatCa } from "@/lib/hr-db";
import { ghiLichSuNhanSu } from "@/lib/nhan-su-lich-su";
import { chuanSdt, docBangDonLe, type LoiDong } from "@/lib/nhap-don-le";

export type KetQuaNhap = {
  loi?: string; thieuCot?: string[];
  /** true = mới kiểm, chưa ghi gì. */
  chiKiem?: boolean;
  moi?: number; daCo?: number; khachMoi?: number; khachKhop?: number; vangLai?: number; daGiao?: number; tongTien?: number; loiDong?: LoiDong[];
};
const KENH = ["Shopee", "TikTok Shop", "Facebook", "Zalo", "Điện thoại", "Khác"];
const TOI_DA = 2000;

/** Nhập đơn lẻ từ bảng dán/CSV. Bước "Kiểm" chỉ đếm, không ghi gì; bước "Nhập" ghi đơn mới, bỏ qua đơn đã có (cùng kênh + mã đơn), khớp khách theo số điện thoại. */
export async function nhapDonLeTuBang(text: string, kenh: string, taoKhach: boolean, chiKiem: boolean): Promise<KetQuaNhap> {
  const nd = await layNguoiDungHienTai();
  if (!nd || nd.phaiDoiMatKhau) return { loi: "Bạn không có quyền thực hiện thao tác này." };
  if (nd.vaiTro !== "admin" && nd.vaiTro !== "ky_thuat") {
    if (nd.vaiTro !== "nhan_vien") return { loi: "Bạn không có quyền thực hiện thao tác này." };
    if ((await quyenTrenSo(nd, "Kinh doanh")).muc !== "nhap") return { loi: "Bạn không có quyền nhập ở mục Kinh doanh." };
  }
  if (!KENH.includes(kenh)) return { loi: "Chọn kênh của đơn." };
  if (text.length > 2_000_000) return { loi: "Dữ liệu quá lớn, chia nhỏ file rồi nhập từng phần." };
  const r = docBangDonLe(text);
  if (r.thieuCot.length) return { loi: r.thieuCot[0] === "file trống" ? "Chưa có dữ liệu để nhập." : `Thiếu cột bắt buộc: ${r.thieuCot.join(", ")}. Dòng đầu phải là tiêu đề cột.`, thieuCot: r.thieuCot };
  if (r.don.length + r.loi.length > TOI_DA) return { loi: `Tối đa ${TOI_DA} dòng mỗi lần, hãy chia nhỏ file.` };

  const db = dbHr();
  const [daCoRows, khach] = await Promise.all([
    docTatCa<{ ma_don: string }>("kd_don_le", "id, ma_don", (q) => q.eq("kenh", kenh)),
    docTatCa<{ id: string; dien_thoai: string | null }>("kd_khach_le", "id, dien_thoai"),
  ]);
  const daCo = new Set(daCoRows.map((d) => d.ma_don));
  const khachTheoSdt = new Map(khach.filter((k) => k.dien_thoai).map((k) => [chuanSdt(k.dien_thoai), k.id]));
  const canNhap = r.don.filter((d) => !daCo.has(d.maDon));
  const sdtMoi = new Map<string, string>();
  let khop = 0, vangLai = 0;
  for (const d of canNhap) {
    if (!d.dienThoai) { vangLai++; continue; }
    if (khachTheoSdt.has(d.dienThoai)) { khop++; continue; }
    if (taoKhach) { if (!sdtMoi.has(d.dienThoai)) sdtMoi.set(d.dienThoai, d.tenKhach ?? d.dienThoai); } else vangLai++;
  }
  const tong = {
    moi: canNhap.length, daCo: r.don.length - canNhap.length, khachMoi: sdtMoi.size, khachKhop: khop, vangLai,
    daGiao: canNhap.filter((d) => d.trangThai === "Đã giao").length, tongTien: canNhap.reduce((a, d) => a + d.giaTri, 0), loiDong: r.loi,
  };
  if (chiKiem) return { ...tong, chiKiem: true };
  if (!canNhap.length) return { ...tong };

  if (sdtMoi.size) {
    const { data: moiKh, error } = await db.from("kd_khach_le").insert([...sdtMoi].map(([sdt, ten]) => ({ ten, dien_thoai: sdt, kenh, dong_y_nhan_tin: false, ghi_chu: "Tạo tự động khi nhập đơn lẻ" }))).select("id, dien_thoai");
    if (error) return { loi: "Chưa tạo được khách mới, không có đơn nào được ghi. Thử lại sau." };
    for (const k of moiKh ?? []) khachTheoSdt.set(chuanSdt(k.dien_thoai as string), k.id as string);
  }
  const dong = canNhap.map((d) => ({ ngay: d.ngay, ma_don: d.maDon, kenh, khach_le_id: d.dienThoai ? (khachTheoSdt.get(d.dienThoai) ?? null) : null, gia_tri: d.giaTri, trang_thai: d.trangThai, ghi_chu: "Nhập từ file" }));
  for (let i = 0; i < dong.length; i += 500) {
    const { error } = await db.from("kd_don_le").insert(dong.slice(i, i + 500));
    if (error) return { loi: `Đã ghi ${i} đơn rồi gặp lỗi (có thể có mã đơn trùng). Bấm Kiểm lại để xem còn thiếu đơn nào, đơn đã có sẽ tự bỏ qua.` };
  }
  await ghiLichSuNhanSu({ nhanVienId: null, doiTuong: "Sổ đơn lẻ", doiTuongId: null, hanhDong: "Thêm", moTa: `Nhập đơn lẻ từ file (${kenh}): thêm ${canNhap.length} đơn, ${sdtMoi.size} khách mới, bỏ qua ${tong.daCo} đơn đã có và ${r.loi.length} dòng lỗi`, truoc: null, sau: { kenh, don: canNhap.length, khach_moi: sdtMoi.size }, nguoi: { id: nd.id, hoTen: nd.hoTen } });
  for (const p of ["/hr/don-le", "/kinh-doanh/khach-le", "/kinh-doanh/lai-gop", "/hr/khach-le", "/kinh-doanh/tin-nhan"]) revalidatePath(p);
  return { ...tong };
}
