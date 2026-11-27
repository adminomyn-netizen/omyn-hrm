"use server";

import { revalidatePath } from "next/cache";
import { layNguoiDungHienTai } from "@/lib/auth";
import { quyenTrenSo } from "@/lib/quyen-nghiep-vu";
import { dbHr, docTatCa } from "@/lib/hr-db";
import { ghiLichSuNhanSu } from "@/lib/nhan-su-lich-su";
import { chuanMaVanDon, docBangVanChuyen, soVoiSo } from "@/lib/doi-soat-van-chuyen";
import type { LoiDong } from "@/lib/nhap-don-le";

export type KetQuaVanChuyen = {
  loi?: string; thieuCot?: string[]; chiKiem?: boolean;
  /** Dòng file khớp một đơn trong sổ (sẽ cập nhật / đã cập nhật). */
  khop?: number; tongCodChuyen?: number; tongPhi?: number;
  /** Mã vận đơn trong file không có trong sổ (tối đa 20) và số lượng. */
  khongThay?: string[]; soKhongThay?: number;
  /** Mã trùng nhiều đơn trong sổ nên bỏ qua. */
  trungTrongSo?: string[];
  chenhCod?: string[]; chuaDaGiao?: string[]; chuyenNhieuHon?: string[];
  loiDong?: LoiDong[]; canhBao?: LoiDong[];
};
const TOI_DA = 3000;
const NHOM = "Tài chính & Kho";

/**
 * Nhập bảng đối soát của đơn vị vận chuyển: khớp theo mã vận đơn với sổ Đóng gói và giao hàng, ghi đè COD đã nhận, ngày nhận COD và phí vận chuyển (nếu file có).
 * "Kiểm trước" chỉ so, không ghi. Nhập lại cùng file cho cùng kết quả.
 */
export async function nhapDoiSoatVanChuyen(text: string, truPhi: boolean, chiKiem: boolean): Promise<KetQuaVanChuyen> {
  const nd = await layNguoiDungHienTai();
  if (!nd || nd.phaiDoiMatKhau) return { loi: "Bạn không có quyền thực hiện thao tác này." };
  if (nd.vaiTro !== "admin" && nd.vaiTro !== "ky_thuat") {
    if (nd.vaiTro !== "nhan_vien") return { loi: "Bạn không có quyền thực hiện thao tác này." };
    if ((await quyenTrenSo(nd, NHOM)).muc !== "nhap") return { loi: "Bạn không có quyền nhập ở mục Tài chính và Kho." };
  }
  if (text.length > 3_000_000) return { loi: "Dữ liệu quá lớn, chia nhỏ file rồi nhập từng phần." };
  const r = docBangVanChuyen(text, truPhi);
  if (r.thieuCot.length) return { loi: r.thieuCot[0] === "file trống" ? "Chưa có dữ liệu để đối soát." : `Thiếu cột bắt buộc: ${r.thieuCot.join(", ")}. Dòng đầu phải là tiêu đề cột.`, thieuCot: r.thieuCot };
  if (r.dong.length + r.loi.length > TOI_DA) return { loi: `Tối đa ${TOI_DA} dòng mỗi lần, hãy chia nhỏ file.` };

  const so = await docTatCa<{ id: string; ma_van_don: string | null; thu_ho: number; trang_thai: string }>("kho_dong_goi_giao", "id, ma_van_don, thu_ho, trang_thai", (q) => q.not("ma_van_don", "is", null));
  const theoMa = new Map<string, { id: string; maVanDon: string; thuHo: number; trangThai: string }[]>();
  for (const d of so) { const k = chuanMaVanDon(d.ma_van_don ?? ""); if (k) theoMa.set(k, [...(theoMa.get(k) ?? []), { id: d.id, maVanDon: k, thuHo: Number(d.thu_ho), trangThai: d.trang_thai }]); }
  const kq: KetQuaVanChuyen = { khop: 0, tongCodChuyen: 0, tongPhi: 0, khongThay: [], soKhongThay: 0, trungTrongSo: [], chenhCod: [], chuaDaGiao: [], chuyenNhieuHon: [], loiDong: r.loi, canhBao: r.canhBao.slice(0, 50) };
  const capNhat: { id: string; sau: Record<string, unknown> }[] = [];
  for (const d of r.dong) {
    const ds = theoMa.get(d.maVanDon);
    if (!ds) { kq.soKhongThay!++; if (kq.khongThay!.length < 20) kq.khongThay!.push(d.maVanDon); continue; }
    if (ds.length > 1) { kq.trungTrongSo!.push(d.maVanDon); continue; }
    const don = ds[0], c = soVoiSo(d, don);
    kq.khop!++; kq.tongCodChuyen! += d.codDaChuyen; kq.tongPhi! += d.phi ?? 0;
    if (c.chenhCod) kq.chenhCod!.push(d.maVanDon);
    if (c.chuaDaGiao) kq.chuaDaGiao!.push(d.maVanDon);
    if (c.chuyenNhieuHon) kq.chuyenNhieuHon!.push(d.maVanDon);
    const sau: Record<string, unknown> = { cod_da_nhan: d.codDaChuyen };
    if (d.ngayChuyen) sau.ngay_nhan_cod = d.ngayChuyen;
    if (d.phi !== null) sau.phi_van_chuyen = d.phi;
    capNhat.push({ id: don.id, sau });
  }
  for (const k of ["chenhCod", "chuaDaGiao", "chuyenNhieuHon", "trungTrongSo"] as const) kq[k] = kq[k]!.slice(0, 20);
  if (chiKiem) return { ...kq, chiKiem: true };
  if (!capNhat.length) return kq;

  const db = dbHr();
  let loiGhi = 0;
  for (let i = 0; i < capNhat.length; i += 20) {
    const kqLo = await Promise.all(capNhat.slice(i, i + 20).map((c) => db.from("kho_dong_goi_giao").update(c.sau).eq("id", c.id)));
    loiGhi += kqLo.filter((x) => x.error).length;
  }
  await ghiLichSuNhanSu({
    nhanVienId: null, doiTuong: "Đóng gói và giao hàng", doiTuongId: null, hanhDong: "Sửa",
    moTa: `Nhập đối soát vận chuyển: cập nhật COD đã nhận cho ${capNhat.length - loiGhi} đơn (tổng ${kq.tongCodChuyen!.toLocaleString("vi-VN")} đ), ${kq.soKhongThay} mã không có trong sổ, ${r.loi.length} dòng lỗi`,
    truoc: null, sau: { don: capNhat.length - loiGhi }, nguoi: { id: nd.id, hoTen: nd.hoTen },
  });
  revalidatePath("/kho/cod-van-chuyen");
  if (loiGhi) return { ...kq, loi: `Đã cập nhật ${capNhat.length - loiGhi} đơn, ${loiGhi} đơn chưa ghi được. Bấm Kiểm trước rồi nhập lại, đơn đã cập nhật sẽ cho cùng kết quả.` };
  return kq;
}
