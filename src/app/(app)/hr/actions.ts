"use server";

import { revalidatePath } from "next/cache";
import { layNguoiDungHienTai } from "@/lib/auth";
import { quyenTrenSo } from "@/lib/quyen-nghiep-vu";
import { dbHr, laGiamDocTaiKhoan } from "@/lib/hr-db";
import { chuanHoaGiaTri, timMucHr, type MucHr } from "@/lib/hr-module";
import { cotDoi, ghiLichSuNhanSu } from "@/lib/nhan-su-lich-su";
import { tinhHoaHong, tyLeApDung } from "@/lib/hoa-hong";
import { dongBoKhoDonLe } from "@/lib/kho-don-le";
import { kiemTraDung, tinhGiam, type LanDung, type Voucher } from "@/lib/khuyen-mai";
import type { SupabaseClient } from "@supabase/supabase-js";

export type KetQuaHr = { loi?: string; ok?: boolean };
const KHONG_QUYEN: KetQuaHr = {
  loi: "Bạn không có quyền thực hiện thao tác này.",
};

/** Quản trị/Kỹ thuật (phòng HCNS) sửa được mọi sổ. Nhân viên chỉ sửa sổ nghiệp vụ mà khối của họ được mở quyền "nhập" (xoá thì từ Trưởng bộ phận trở lên).
 * Cột lấy từ cấu hình, không nhận cột lạ từ trình duyệt. */
async function nguoiQuanTri(muc: MucHr, xoa = false) {
  const nd = await layNguoiDungHienTai();
  if (!nd || nd.phaiDoiMatKhau) return null;
  if (nd.vaiTro === "admin" || nd.vaiTro === "ky_thuat") return muc.chiGiamDocSua && !(await laGiamDocTaiKhoan(nd.id)) ? null : nd;
  if (muc.chiGiamDocSua || nd.vaiTro !== "nhan_vien") return null;
  const q = await quyenTrenSo(nd, muc.nhom);
  return q.muc === "nhap" && (!xoa || q.xoa) ? nd : null;
}

type Dong = Record<string, string | number | boolean | null>;
const laVoucher = (r: Record<string, unknown>): Voucher => ({
  id: String(r.id), ma: String(r.ma), loai: String(r.loai), giaTri: Number(r.gia_tri), giamToiDa: r.giam_toi_da == null ? null : Number(r.giam_toi_da), donToiThieu: Number(r.don_toi_thieu),
  kenh: String(r.kenh), tuNgay: String(r.tu_ngay), denNgay: String(r.den_ngay), gioiHanLuot: r.gioi_han_luot == null ? null : Number(r.gioi_han_luot),
  gioiHanMoiKhach: r.gioi_han_moi_khach == null ? null : Number(r.gioi_han_moi_khach), bat: Boolean(r.bat),
});

/** Kiểm riêng theo mục trước khi lưu (có thể bổ sung giá trị tự tính vào dòng). Trả câu lỗi hoặc null. */
async function kiemTraRiengCuaMuc(ma: string, dong: Dong, db: SupabaseClient, id: string): Promise<string | null> {
  if (ma === "voucher") {
    dong.ma = String(dong.ma ?? "").trim().toUpperCase();
    if (!dong.ma) return "Cần ghi mã voucher.";
    if (dong.loai === "Giảm %" && Number(dong.gia_tri) > 100) return "Giảm theo % thì mức giảm tối đa 100.";
    if (dong.loai === "Giảm tiền" && dong.giam_toi_da != null) return "Mức giảm tối đa chỉ dùng cho loại giảm %.";
    if (String(dong.den_ngay) < String(dong.tu_ngay)) return "Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.";
    return null;
  }
  if (ma === "voucher-dung") {
    const { data: vr } = await db.from("kd_voucher").select("*").eq("id", String(dong.voucher_id)).maybeSingle();
    if (!vr) return "Không tìm thấy voucher.";
    const v = laVoucher(vr as Record<string, unknown>);
    const { data: ds } = await db.from("kd_voucher_dung").select("id, voucher_id, khach_le_id, ngay, kenh, so_tien_don, so_tien_giam").eq("voucher_id", v.id);
    const daDung: LanDung[] = ((ds ?? []) as Record<string, unknown>[]).filter((r) => String(r.id) !== id).map((r) => ({ voucherId: v.id, khachId: (r.khach_le_id as string | null) ?? null, ngay: String(r.ngay), kenh: String(r.kenh), soTienDon: Number(r.so_tien_don), soTienGiam: Number(r.so_tien_giam) }));
    const don = Number(dong.so_tien_don);
    const loi = kiemTraDung(v, { ngay: String(dong.ngay), kenh: String(dong.kenh), khachId: (dong.khach_le_id as string | null) ?? null, soTienDon: don }, daDung);
    if (loi) return loi;
    const toiDa = tinhGiam(v, don);
    if (dong.so_tien_giam == null) dong.so_tien_giam = toiDa;
    else if (Number(dong.so_tien_giam) > toiDa) return `Số tiền giảm không được quá ${toiDa.toLocaleString("vi-VN")}đ theo quy định của voucher.`;
  }
  if (ma === "hoa-hong") {
    const { data: c } = await db.from("kd_ctv").select("ty_le_hoa_hong").eq("id", String(dong.ctv_id)).maybeSingle();
    if (!c) return "Không tìm thấy người giới thiệu.";
    const tyLe = tyLeApDung(dong.ty_le == null ? null : Number(dong.ty_le), { tyLe: (c as { ty_le_hoa_hong: number | null }).ty_le_hoa_hong });
    if (tyLe === null) return "Người này chưa có tỷ lệ hoa hồng mặc định, hãy nhập tỷ lệ cho đơn.";
    dong.ty_le = tyLe;
    const don = Number(dong.so_tien_don);
    const toiDa = tinhHoaHong(don, tyLe);
    if (dong.so_tien_hoa_hong == null) dong.so_tien_hoa_hong = toiDa;
    else if (Number(dong.so_tien_hoa_hong) > toiDa) return `Hoa hồng không được quá ${toiDa.toLocaleString("vi-VN")}đ (${tyLe}% giá trị đơn).`;
    if (dong.trang_thai === "Đã chi" && !dong.ngay_chi) return "Cần ghi ngày chi khi chọn Đã chi.";
    if (dong.trang_thai !== "Đã chi" && dong.ngay_chi) return "Chỉ ghi ngày chi khi trạng thái là Đã chi.";
    if (dong.ma_don && dong.trang_thai !== "Huỷ") {
      let q = db.from("kd_hoa_hong").select("id").eq("ctv_id", String(dong.ctv_id)).eq("ma_don", String(dong.ma_don)).neq("trang_thai", "Huỷ");
      if (id) q = q.neq("id", id);
      const { data: trung } = await q.limit(1);
      if (trung && trung.length) return "Mã đơn này đã tính hoa hồng cho người này rồi.";
    }
  }
  return null;
}

export async function luuBanGhiHr(fd: FormData): Promise<KetQuaHr> {
  const muc = timMucHr(String(fd.get("ma") ?? ""));
  if (!muc) return { loi: "Không tìm thấy mục này." };
  const nd = await nguoiQuanTri(muc);
  if (!nd)
    return muc.chiGiamDocSua
      ? { loi: "Chỉ giám đốc được nhập hoặc sửa mục này." }
      : KHONG_QUYEN;
  const id = String(fd.get("id") ?? "");
  if (id && !/^[0-9a-f-]{36}$/i.test(id))
    return { loi: "Bản ghi không hợp lệ." };
  const dong: Record<string, string | number | boolean | null> = {};
  for (const c of muc.cot) {
    const r = chuanHoaGiaTri(c, String(fd.get(c.k) ?? ""));
    if ("loi" in r) return { loi: r.loi };
    dong[c.k] = r.v;
  }
  for (const c of muc.cot) {
    if (c.batBuocKhi && c.batBuocKhi.la.includes(String(dong[c.batBuocKhi.k] ?? "")) && (dong[c.k] === null || dong[c.k] === "" || dong[c.k] === undefined))
      return { loi: `Cần ghi “${c.nhan.replace(/\s*\(.*$/, "")}” khi chọn ${String(dong[c.batBuocKhi.k]).toLowerCase()}.` };
  }
  const db = dbHr();
  const loiRieng = await kiemTraRiengCuaMuc(muc.ma, dong, db, id);
  if (loiRieng) return { loi: loiRieng };
  const cu = id
    ? ((await db.from(muc.bang).select("*").eq("id", id).maybeSingle())
        .data as Record<string, unknown> | null)
    : null;
  if (muc.ma === "nhap-xuat-kho" && cu?.don_le_dong_id) return { loi: "Phiếu này tự sinh từ đơn lẻ. Sửa ở Sổ đơn lẻ hoặc Dòng hàng đơn lẻ." };
  const { data: moi, error } = id
    ? await db
        .from(muc.bang)
        .update(dong)
        .eq("id", id)
        .select("id")
        .maybeSingle()
    : await db.from(muc.bang).insert(dong).select("id").maybeSingle();
  if (error) return { loi: "Chưa lưu được. Kiểm tra lại các ô rồi thử lại." };
  let ghiChuKho = "";
  if (muc.ma === "don-le" || muc.ma === "don-le-dong-hang") {
    const donIds = new Set<string>();
    if (muc.ma === "don-le") donIds.add((moi as { id: string } | null)?.id ?? id);
    else { donIds.add(String(dong.don_le_id)); if (cu?.don_le_id) donIds.add(String(cu.don_le_id)); }
    for (const d of donIds) {
      const kq = await dongBoKhoDonLe(db, d);
      if (kq.loi) return { loi: kq.loi };
      if (kq.xuat || kq.go) ghiChuKho = `; kho: ${kq.xuat ? `tự xuất ${kq.xuat} phiếu` : `gỡ ${kq.go} phiếu xuất`}`;
    }
    revalidatePath("/ton-kho");
    revalidatePath("/hr/nhap-xuat-kho");
    revalidatePath("/kho/lo-han-dung");
  }
  const doi = cotDoi(cu, dong);
  await ghiLichSuNhanSu({
    nhanVienId:
      typeof dong.nhan_vien_id === "string" ? dong.nhan_vien_id : null,
    doiTuong: muc.ten,
    doiTuongId: (moi as { id: string } | null)?.id ?? (id || null),
    hanhDong: id ? "Sửa" : "Thêm",
    moTa: id
      ? `${muc.ten}: sửa ${doi.length ? doi.map((k) => muc.cot.find((c) => c.k === k)?.nhan ?? k).join(", ") : "không đổi gì"}${ghiChuKho}`
      : `${muc.ten}: thêm mới${ghiChuKho}`,
    truoc: cu,
    sau: dong,
    nguoi: { id: nd.id, hoTen: nd.hoTen },
  });
  revalidatePath(`/hr/${muc.ma}`);
  revalidatePath("/hr");
  return { ok: true };
}

export async function xoaBanGhiHr(ma: string, id: string): Promise<KetQuaHr> {
  const muc = timMucHr(ma);
  if (!muc || !/^[0-9a-f-]{36}$/i.test(id))
    return { loi: "Bản ghi không hợp lệ." };
  const nd = await nguoiQuanTri(muc, true);
  if (!nd)
    return muc.chiGiamDocSua
      ? { loi: "Chỉ giám đốc được xoá mục này." }
      : KHONG_QUYEN;
  const cu = (
    await dbHr().from(muc.bang).select("*").eq("id", id).maybeSingle()
  ).data as Record<string, unknown> | null;
  if (muc.ma === "nhap-xuat-kho" && cu?.don_le_dong_id) return { loi: "Phiếu này tự sinh từ đơn lẻ. Muốn gỡ, đổi trạng thái đơn hoặc xoá dòng hàng đơn lẻ." };
  const { error } = await dbHr().from(muc.bang).delete().eq("id", id);
  if (error) return { loi: "Chưa xoá được." };
  if (muc.ma === "don-le" || muc.ma === "don-le-dong-hang") {
    revalidatePath("/ton-kho");
    revalidatePath("/hr/nhap-xuat-kho");
  }
  await ghiLichSuNhanSu({
    nhanVienId: typeof cu?.nhan_vien_id === "string" ? cu.nhan_vien_id : null,
    doiTuong: muc.ten,
    doiTuongId: id,
    hanhDong: "Xoá",
    moTa: `${muc.ten}: xoá một bản ghi`,
    truoc: cu,
    sau: null,
    nguoi: { id: nd.id, hoTen: nd.hoTen },
  });
  revalidatePath(`/hr/${muc.ma}`);
  revalidatePath("/hr");
  return { ok: true };
}
