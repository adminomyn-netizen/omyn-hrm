"use server";

import { revalidatePath } from "next/cache";
import { layNguoiDungHienTai } from "@/lib/auth";
import { quyenTrenSo } from "@/lib/quyen-nghiep-vu";
import { dbHr } from "@/lib/hr-db";
import { ngayHomNayHCM } from "@/lib/data";
import { ghiLichSuNhanSu } from "@/lib/nhan-su-lich-su";
import { thanhTienDong } from "@/lib/kinh-doanh";

export type KetQuaXuatKho = { loi?: string; ok?: boolean; tomTat?: string };
const TRANG_THAI_DUOC_XUAT = ["Đã chốt", "Đang giao", "Đã giao", "Đã thu đủ"];

/** Từ một đơn sỉ đã chốt: tạo phiếu xuất kho cho từng dòng hàng và ghi một khoản công nợ phát sinh cho đại lý.
 * Số tiền = tổng dòng hàng; đơn lệch tiền so với dòng hàng thì không làm (tránh ghi nợ sai). Mỗi đơn chỉ làm một lần (cột da_xuat_kho_luc). */
export async function xuatKhoGhiNoAction(donId: string): Promise<KetQuaXuatKho> {
  if (!/^[0-9a-f-]{36}$/i.test(donId)) return { loi: "Đơn không hợp lệ." };
  const nd = await layNguoiDungHienTai();
  if (!nd || nd.phaiDoiMatKhau) return { loi: "Bạn không có quyền thực hiện thao tác này." };
  if (nd.vaiTro !== "admin" && nd.vaiTro !== "ky_thuat") {
    if (nd.vaiTro !== "nhan_vien") return { loi: "Bạn không có quyền thực hiện thao tác này." };
    const [kd, kho] = await Promise.all([quyenTrenSo(nd, "Kinh doanh"), quyenTrenSo(nd, "Tài chính & Kho")]);
    if (kd.muc !== "nhap" || kho.muc !== "nhap") return { loi: "Cần quyền nhập ở cả Kinh doanh và Kho." };
  }
  const db = dbHr();
  const { data: don } = await db.from("kd_don_si").select("id, ma_don, dai_ly_id, gia_tri, han_thanh_toan, trang_thai, da_xuat_kho_luc").eq("id", donId).maybeSingle();
  if (!don) return { loi: "Không tìm thấy đơn." };
  if (don.da_xuat_kho_luc) return { loi: "Đơn này đã tạo phiếu xuất kho và ghi công nợ rồi." };
  if (!TRANG_THAI_DUOC_XUAT.includes(don.trang_thai)) return { loi: "Chỉ đơn đã chốt trở đi mới xuất kho." };
  const { data: dong } = await db.from("kd_don_si_dong").select("san_pham_id, so_luong, don_gia, chiet_khau").eq("don_si_id", donId);
  if (!dong?.length) return { loi: "Đơn chưa có dòng hàng nào." };
  const tong = dong.reduce((a, x) => a + thanhTienDong(x.so_luong, x.don_gia, x.chiet_khau), 0);
  if (tong !== don.gia_tri) return { loi: "Giá trị đơn đang lệch với tổng dòng hàng. Sửa cho khớp rồi làm lại." };
  const { data: dl } = await db.from("kd_dai_ly").select("ten").eq("id", don.dai_ly_id).maybeSingle();
  const { data: nv } = await db.from("nhan_vien").select("id").eq("user_id", nd.id).maybeSingle();

  // Giữ chỗ trước (chỉ một người thắng); hỏng giữa chừng thì gỡ lại.
  const { data: giu } = await db.from("kd_don_si").update({ da_xuat_kho_luc: new Date().toISOString() }).eq("id", donId).is("da_xuat_kho_luc", null).select("id");
  if (!giu?.length) return { loi: "Đơn này đang được xử lý hoặc đã xong." };
  const ngay = ngayHomNayHCM();
  const phieu = dong.map((x) => ({ ngay, loai: "Xuất", san_pham_id: x.san_pham_id, so_luong: x.so_luong, doi_tuong: dl?.ten ?? null, chung_tu: don.ma_don, nguoi_lap_id: nv?.id ?? null, ghi_chu: `Xuất theo đơn sỉ ${don.ma_don}` }));
  const { data: moiPhieu, error: l1 } = await db.from("kho_nhap_xuat").insert(phieu).select("id");
  let loi2 = false;
  let idNo: string | null = null;
  if (!l1 && tong > 0) {
    const { data: no, error: l2 } = await db.from("kd_cong_no_dai_ly").insert({ dai_ly_id: don.dai_ly_id, ngay, loai: "Phát sinh", so_tien: tong, han_thanh_toan: don.han_thanh_toan, ghi_chu: `Đơn sỉ ${don.ma_don}` }).select("id").maybeSingle();
    loi2 = !!l2; idNo = no?.id ?? null;
  }
  if (l1 || loi2) {
    if (moiPhieu?.length) await db.from("kho_nhap_xuat").delete().in("id", moiPhieu.map((p) => p.id));
    await db.from("kd_don_si").update({ da_xuat_kho_luc: null }).eq("id", donId);
    return { loi: "Chưa tạo được. Không có gì bị ghi, thử lại sau." };
  }
  await ghiLichSuNhanSu({ nhanVienId: null, doiTuong: "Đơn bán sỉ", doiTuongId: donId, hanhDong: "Sửa", moTa: `Đơn sỉ ${don.ma_don}: xuất kho ${dong.length} dòng hàng${tong > 0 ? `, ghi công nợ ${tong.toLocaleString("vi-VN")} đ` : ""}`, truoc: { da_xuat_kho_luc: null }, sau: { phieu_xuat: moiPhieu?.map((p) => p.id), cong_no: idNo }, nguoi: { id: nd.id, hoTen: nd.hoTen } });
  for (const p of ["/kinh-doanh/don-si", "/kinh-doanh/cong-no", "/ton-kho", "/hr/nhap-xuat-kho", "/hr/cong-no-dai-ly"]) revalidatePath(p);
  return { ok: true, tomTat: `Đã xuất kho ${dong.length} dòng hàng${tong > 0 ? " và ghi công nợ cho đại lý" : ""}.` };
}
