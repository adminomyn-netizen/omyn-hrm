"use server";

import { revalidatePath } from "next/cache";
import { layNguoiDungHienTai } from "@/lib/auth";
import { quyenTrenSo } from "@/lib/quyen-nghiep-vu";
import { dbHr, docTatCa } from "@/lib/hr-db";
import { ghiLichSuNhanSu } from "@/lib/nhan-su-lich-su";
import ExcelJS from "exceljs";
import { chuanSdt, docBangDonLe, donGiaCacDong, hangExcelThanhBang, khopSanPham, type DonLeDoc, type LoiDong, type SanPhamKhop } from "@/lib/nhap-don-le";
import { dongBoKhoDonLe } from "@/lib/kho-don-le";

export type KetQuaNhap = {
  loi?: string; thieuCot?: string[];
  /** true = mới kiểm, chưa ghi gì. */
  chiKiem?: boolean;
  moi?: number; daCo?: number; khachMoi?: number; khachKhop?: number; vangLai?: number; daGiao?: number; tongTien?: number; loiDong?: LoiDong[];
  /** Dòng hàng: số dòng sẽ ghi (đã ghi), số đơn cũ được bổ sung hàng, dòng bị bỏ vì chưa có sản phẩm trong danh mục, tên sản phẩm chưa có (tối đa 20), cảnh báo đọc file. */
  hangGhi?: number; donBoSung?: number; hangBoQua?: number; spChuaCo?: string[]; canhBao?: LoiDong[]; coHang?: boolean;
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
    docTatCa<{ id: string; ma_don: string; trang_thai: string; gia_tri: number }>("kd_don_le", "id, ma_don, trang_thai, gia_tri", (q) => q.eq("kenh", kenh)),
    docTatCa<{ id: string; dien_thoai: string | null }>("kd_khach_le", "id, dien_thoai"),
  ]);
  const daCoId = new Map(daCoRows.map((d) => [d.ma_don, d.id]));
  const donCuTheoMa = new Map(daCoRows.map((d) => [d.ma_don, d]));
  const daCo = new Set(daCoId.keys());
  const khachTheoSdt = new Map(khach.filter((k) => k.dien_thoai).map((k) => [chuanSdt(k.dien_thoai), k.id]));
  const canNhap = r.don.filter((d) => !daCo.has(d.maDon));
  const sdtMoi = new Map<string, string>();
  let khop = 0, vangLai = 0;
  for (const d of canNhap) {
    if (!d.dienThoai) { vangLai++; continue; }
    if (khachTheoSdt.has(d.dienThoai)) { khop++; continue; }
    if (taoKhach) { if (!sdtMoi.has(d.dienThoai)) sdtMoi.set(d.dienThoai, d.tenKhach ?? d.dienThoai); } else vangLai++;
  }
  // Dòng hàng: khớp sản phẩm trong danh mục; đơn cũ chưa có hàng thì được bổ sung.
  const coHang = r.don.some((d) => d.hang.length > 0);
  type DongPlan = { sanPhamId: string; soLuong: number; donGia: number };
  const keHoach = new Map<string, DongPlan[]>();
  const donCuBoSung = new Map<string, { don: DonLeDoc; id: string }>();
  const chuaCo = new Set<string>();
  let hangBoQua = 0;
  if (coHang) {
    const sp = ((await db.from("sp_san_pham").select("id, ma_sp, ten")).data ?? []).map((x) => ({ id: x.id as string, maSp: String(x.ma_sp ?? ""), ten: String(x.ten ?? "") })) as SanPhamKhop[];
    const cuDaCoHang = new Set<string>();
    const idsCu = r.don.filter((d) => daCoId.has(d.maDon) && d.hang.length).map((d) => daCoId.get(d.maDon)!);
    for (let i = 0; i < idsCu.length; i += 200) {
      const { data } = await db.from("kd_don_le_dong").select("don_le_id").in("don_le_id", idsCu.slice(i, i + 200));
      for (const x of data ?? []) cuDaCoHang.add(x.don_le_id as string);
    }
    for (const d of r.don) {
      const cu = daCoId.get(d.maDon);
      if (cu && cuDaCoHang.has(cu)) continue;
      if (!d.hang.length) continue;
      const gia = donGiaCacDong(cu ? Number(donCuTheoMa.get(d.maDon)?.gia_tri ?? d.giaTri) : d.giaTri, d.hang);
      const dongs: DongPlan[] = [];
      d.hang.forEach((h, i) => {
        const id = khopSanPham(h, sp);
        if (!id) { hangBoQua++; chuaCo.add(h.sku ?? h.tenSp ?? "?"); return; }
        dongs.push({ sanPhamId: id, soLuong: h.soLuong, donGia: gia[i] });
      });
      if (!dongs.length) continue;
      keHoach.set(d.maDon, dongs);
      if (cu) donCuBoSung.set(d.maDon, { don: d, id: cu });
    }
  }
  const hangMoiDon = canNhap.reduce((a, d) => a + (keHoach.get(d.maDon)?.length ?? 0), 0);
  const hangBoSung = [...donCuBoSung.keys()].reduce((a, m) => a + (keHoach.get(m)?.length ?? 0), 0);
  const tong = {
    coHang, hangGhi: hangMoiDon + hangBoSung, donBoSung: donCuBoSung.size, hangBoQua, spChuaCo: [...chuaCo].slice(0, 20), canhBao: r.canhBao.slice(0, 50),
    moi: canNhap.length, daCo: r.don.length - canNhap.length, khachMoi: sdtMoi.size, khachKhop: khop, vangLai,
    daGiao: canNhap.filter((d) => d.trangThai === "Đã giao").length, tongTien: canNhap.reduce((a, d) => a + d.giaTri, 0), loiDong: r.loi,
  };
  if (chiKiem) return { ...tong, chiKiem: true };
  if (!canNhap.length && !donCuBoSung.size) return { ...tong };

  if (sdtMoi.size) {
    const { data: moiKh, error } = await db.from("kd_khach_le").insert([...sdtMoi].map(([sdt, ten]) => ({ ten, dien_thoai: sdt, kenh, dong_y_nhan_tin: false, ghi_chu: "Tạo tự động khi nhập đơn lẻ" }))).select("id, dien_thoai");
    if (error) return { loi: "Chưa tạo được khách mới, không có đơn nào được ghi. Thử lại sau." };
    for (const k of moiKh ?? []) khachTheoSdt.set(chuanSdt(k.dien_thoai as string), k.id as string);
  }
  const idDonMoi = new Map<string, string>();
  const dong = canNhap.map((d) => ({ ngay: d.ngay, ma_don: d.maDon, kenh, khach_le_id: d.dienThoai ? (khachTheoSdt.get(d.dienThoai) ?? null) : null, gia_tri: d.giaTri, trang_thai: d.trangThai, ghi_chu: "Nhập từ file" }));
  for (let i = 0; i < dong.length; i += 500) {
    const { data: ghi, error } = await db.from("kd_don_le").insert(dong.slice(i, i + 500)).select("id, ma_don");
    for (const x of ghi ?? []) idDonMoi.set(x.ma_don as string, x.id as string);
    if (error) return { loi: `Đã ghi ${i} đơn rồi gặp lỗi (có thể có mã đơn trùng). Bấm Kiểm lại để xem còn thiếu đơn nào, đơn đã có sẽ tự bỏ qua.` };
  }
  // Ghi dòng hàng rồi đồng bộ kho cho đơn "Đã giao" (trừ kho + lãi gộp).
  let hangDaGhi = 0;
  if (keHoach.size) {
    const dongHang: Record<string, unknown>[] = [], canDongBo: string[] = [];
    for (const [ma, ds] of keHoach) {
      const id = daCoId.get(ma) ?? idDonMoi.get(ma);
      if (!id) continue;
      for (const x of ds) dongHang.push({ don_le_id: id, san_pham_id: x.sanPhamId, so_luong: x.soLuong, don_gia: x.donGia });
      const trangThai = donCuBoSung.has(ma) ? donCuTheoMa.get(ma)?.trang_thai : r.don.find((d) => d.maDon === ma)?.trangThai;
      if (trangThai === "Đã giao") canDongBo.push(id);
    }
    for (let i = 0; i < dongHang.length; i += 500) {
      const { error } = await db.from("kd_don_le_dong").insert(dongHang.slice(i, i + 500));
      if (error) return { ...tong, loi: `Đã ghi đơn nhưng chưa ghi được dòng hàng (đã ghi ${hangDaGhi}). Bấm Kiểm lại: đơn đã có mà chưa có hàng sẽ được bổ sung.` };
      hangDaGhi += Math.min(500, dongHang.length - i);
    }
    for (let i = 0; i < canDongBo.length; i += 10) await Promise.all(canDongBo.slice(i, i + 10).map((id) => dongBoKhoDonLe(db, id)));
  }
  await ghiLichSuNhanSu({ nhanVienId: null, doiTuong: "Sổ đơn lẻ", doiTuongId: null, hanhDong: "Thêm", moTa: `Nhập đơn lẻ từ file (${kenh}): thêm ${canNhap.length} đơn, ${hangDaGhi} dòng hàng (${donCuBoSung.size} đơn cũ được bổ sung hàng), ${sdtMoi.size} khách mới, bỏ qua ${tong.daCo - donCuBoSung.size} đơn đã có và ${r.loi.length} dòng lỗi`, truoc: null, sau: { kenh, don: canNhap.length, khach_moi: sdtMoi.size }, nguoi: { id: nd.id, hoTen: nd.hoTen } });
  for (const p of ["/hr/don-le", "/kinh-doanh/khach-le", "/kinh-doanh/lai-gop", "/hr/khach-le", "/kinh-doanh/tin-nhan"]) revalidatePath(p);
  return { ...tong };
}

/** Đọc file Excel (.xlsx) thành bảng chữ để đưa vào ô nhập (trang tính đầu tiên, dòng đầu là tên cột). Chỉ đọc, không ghi gì. */
export async function docFileExcelDonLe(fd: FormData): Promise<{ loi?: string; text?: string; soDong?: number }> {
  const nd = await layNguoiDungHienTai();
  if (!nd || nd.phaiDoiMatKhau) return { loi: "Bạn không có quyền thực hiện thao tác này." };
  if (nd.vaiTro !== "admin" && nd.vaiTro !== "ky_thuat") {
    if (nd.vaiTro !== "nhan_vien") return { loi: "Bạn không có quyền thực hiện thao tác này." };
    if ((await quyenTrenSo(nd, "Kinh doanh")).muc !== "nhap") return { loi: "Bạn không có quyền nhập ở mục Kinh doanh." };
  }
  const f = fd.get("file");
  if (!(f instanceof File) || !f.name.toLowerCase().endsWith(".xlsx")) return { loi: "Chọn file Excel đuôi .xlsx." };
  if (f.size > 8 * 1024 * 1024) return { loi: "File quá lớn (tối đa 8 MB), chia nhỏ rồi nhập từng phần." };
  try {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load((await f.arrayBuffer()) as ArrayBuffer);
    const ws = wb.worksheets.find((w) => w.rowCount > 0);
    if (!ws) return { loi: "File không có dữ liệu." };
    const hang: unknown[][] = [];
    const cot = Math.min(ws.columnCount, 40);
    ws.eachRow({ includeEmpty: false }, (row) => { hang.push(Array.from({ length: cot }, (_, i) => row.getCell(i + 1).value)); });
    const text = hangExcelThanhBang(hang);
    if (!text) return { loi: "File không có dữ liệu." };
    return { text, soDong: text.split("\n").length - 1 };
  } catch {
    return { loi: "Không đọc được file này. Kiểm tra đây là file .xlsx (không phải .xls cũ) và không đặt mật khẩu." };
  }
}
