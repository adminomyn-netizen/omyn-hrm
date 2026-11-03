"use server";

import { revalidatePath } from "next/cache";
import { layNguoiDungHienTai } from "@/lib/auth";
import { dbHr } from "@/lib/hr-db";
import { oDieuKhienDuoc } from "@/lib/phe-duyet";
import { mauTheoMa } from "@/lib/phe-duyet-mau";
import { docDanhMuc, SU_KIEN_THONG_BAO } from "@/lib/phe-duyet-data";

export type KetQuaCauHinh = { ok?: boolean; loi?: string };

const KIEU = ["AND", "OR", "CC"];
const LOAI_NGUOI = ["Quản lý trực tiếp", "Quản lý cấp trên", "Chức danh", "Nhân viên", "Giám đốc", "Kỹ thuật"];
/** Riêng bước duyệt: thêm người nộp (nhận bản sao) và người chọn trong ô nhân sự của phiếu. */
const LOAI_BUOC = [...LOAI_NGUOI, "Người nộp", "Người trong phiếu"];
const UUID = /^[0-9a-f-]{36}$/i;
const TRANG = "/ky-thuat/luong-phieu";

/** Chỉ tài khoản Kỹ thuật được sửa luồng phiếu. */
async function kyThuat() {
  const nd = await layNguoiDungHienTai();
  return nd && nd.vaiTro === "ky_thuat" ? nd : null;
}

type Nguoi = { id: string; hoTen: string };
const ghiLichSu = (ma: string, doiTuong: string, hanhDong: "Thêm" | "Sửa" | "Xoá", moTa: string, truoc: unknown, sau: unknown, nd: Nguoi) =>
  dbHr().from("pd_cau_hinh_lich_su").insert({ ma_phieu: ma, doi_tuong: doiTuong, hanh_dong: hanhDong, mo_ta: moTa, truoc: truoc ?? null, sau: sau ?? null, user_id: nd.id, ten_nguoi: nd.hoTen });

const chuoi = (v: unknown, toiDa = 200) => (typeof v === "string" ? v.trim().slice(0, toiDa) : "");
const moTaNguoi = (loai: string, chucDanh: string | null, tenNv: string | null) => (loai === "Chức danh" ? `Chức danh ${chucDanh}` : loai === "Nhân viên" ? `Nhân viên ${tenNv ?? ""}` : loai === "Người trong phiếu" ? `Người chọn ở ô ${chucDanh}` : loai);

async function tenNhanVien(id: string | null): Promise<string | null> {
  if (!id) return null;
  const { data } = await dbHr().from("nhan_vien").select("ho_ten").eq("id", id).maybeSingle();
  return (data as { ho_ten: string } | null)?.ho_ten ?? null;
}

// ------------------------------------------------------------------ bước duyệt

export type BuocVao = { id?: string; ma_phieu: string; buoc: number; ten_buoc: string; kieu: string; loai_nguoi: string; chuc_danh: string; nhan_vien_id: string; dk_truong: string; dk_gia_tri: string };

export async function luuBuoc(v: BuocVao): Promise<KetQuaCauHinh> {
  const nd = await kyThuat();
  if (!nd) return { loi: "Chỉ tài khoản Kỹ thuật được sửa luồng phiếu." };
  const mau = mauTheoMa(v.ma_phieu);
  if (!mau) return { loi: "Không có loại phiếu này." };
  const buoc = Number(v.buoc);
  if (!Number.isInteger(buoc) || buoc < 1 || buoc > 30) return { loi: "Bước số từ 1 đến 30." };
  if (!KIEU.includes(v.kieu)) return { loi: "Kiểu duyệt không hợp lệ." };
  if (!LOAI_BUOC.includes(v.loai_nguoi)) return { loi: "Loại người duyệt không hợp lệ." };
  const chucDanh = chuoi(v.chuc_danh);
  const nvId = v.loai_nguoi === "Nhân viên" ? chuoi(v.nhan_vien_id, 40) : "";
  if (v.loai_nguoi === "Chức danh" && !chucDanh) return { loi: "Nhập chức danh cần duyệt." };
  if (v.loai_nguoi === "Nhân viên" && !UUID.test(nvId)) return { loi: "Chọn nhân sự." };
  if (v.loai_nguoi === "Người trong phiếu" && !mau.truong.some((t) => t.ma === chucDanh && t.kieu === "nv")) return { loi: "Chọn ô nhân sự của phiếu." };
  const dkT = chuoi(v.dk_truong), dkG = chuoi(v.dk_gia_tri);
  if ((dkT === "") !== (dkG === "")) return { loi: "Điều kiện cần đủ cả ô và giá trị, hoặc bỏ trống cả hai." };
  if (dkT && !oDieuKhienDuoc(mau, "").some((t) => t.ma === dkT)) return { loi: "Ô điều kiện phải là ô chọn của phiếu này." };
  const dong = { ma_phieu: v.ma_phieu, buoc, ten_buoc: chuoi(v.ten_buoc) || null, kieu: v.kieu, loai_nguoi: v.loai_nguoi, chuc_danh: v.loai_nguoi === "Chức danh" || v.loai_nguoi === "Người trong phiếu" ? chucDanh : null, nhan_vien_id: nvId || null, dieu_kien_truong: dkT || null, dieu_kien_gia_tri: dkG || null };
  const db = dbHr();
  const ten = await tenNhanVien(dong.nhan_vien_id);
  const mo = `Bước ${buoc} (${v.kieu}): ${moTaNguoi(v.loai_nguoi, dong.chuc_danh, ten)}${dkT ? `, khi ${dkT} = ${dkG}` : ""}`;
  if (v.id) {
    if (!UUID.test(v.id)) return { loi: "Dòng không hợp lệ." };
    const { data: cu } = await db.from("pd_luong_duyet").select("*").eq("id", v.id).eq("ma_phieu", v.ma_phieu).maybeSingle();
    if (!cu) return { loi: "Không tìm thấy dòng cần sửa." };
    const { error } = await db.from("pd_luong_duyet").update(dong).eq("id", v.id);
    if (error) return { loi: "Không lưu được, thử lại." };
    await ghiLichSu(v.ma_phieu, "Bước duyệt", "Sửa", mo, cu, dong, nd);
  } else {
    const { error } = await db.from("pd_luong_duyet").insert(dong);
    if (error) return { loi: "Không lưu được, thử lại." };
    await ghiLichSu(v.ma_phieu, "Bước duyệt", "Thêm", mo, null, dong, nd);
  }
  revalidatePath(TRANG);
  return { ok: true };
}

export async function xoaBuoc(ma: string, id: string): Promise<KetQuaCauHinh> {
  const nd = await kyThuat();
  if (!nd) return { loi: "Chỉ tài khoản Kỹ thuật được sửa luồng phiếu." };
  if (!UUID.test(id)) return { loi: "Dòng không hợp lệ." };
  const db = dbHr();
  const { data: cu } = await db.from("pd_luong_duyet").select("*").eq("id", id).eq("ma_phieu", ma).maybeSingle();
  if (!cu) return { loi: "Không tìm thấy dòng." };
  const { error } = await db.from("pd_luong_duyet").delete().eq("id", id);
  if (error) return { loi: "Không xoá được, thử lại." };
  const c = cu as { buoc: number; kieu: string; loai_nguoi: string; chuc_danh: string | null; nhan_vien_id: string | null };
  await ghiLichSu(ma, "Bước duyệt", "Xoá", `Bước ${c.buoc} (${c.kieu}): ${moTaNguoi(c.loai_nguoi, c.chuc_danh, await tenNhanVien(c.nhan_vien_id))}`, cu, null, nd);
  revalidatePath(TRANG);
  return { ok: true };
}

// ------------------------------------------------------------------ ô nhập

export type GhiDeVao = { ma_phieu: string; truong: string; bat_buoc: string; che_do_hien: string; hien_truong: string; hien_gia_tri: string[] };

export async function luuGhiDeO(v: GhiDeVao): Promise<KetQuaCauHinh> {
  const nd = await kyThuat();
  if (!nd) return { loi: "Chỉ tài khoản Kỹ thuật được sửa luồng phiếu." };
  const mau = mauTheoMa(v.ma_phieu);
  const o = mau?.truong.find((t) => t.ma === v.truong);
  if (!mau || !o) return { loi: "Không có ô này." };
  if (!["Mặc định", "Bắt buộc", "Không bắt buộc"].includes(v.bat_buoc) || !["Mặc định", "Luôn hiện", "Theo điều kiện", "Ẩn"].includes(v.che_do_hien)) return { loi: "Giá trị không hợp lệ." };
  const db = dbHr();
  const { data: cu } = await db.from("pd_o_cau_hinh").select("*").eq("ma_phieu", v.ma_phieu).eq("truong", v.truong).maybeSingle();
  let dkT: string | null = null, dkG: string[] | null = null;
  if (v.che_do_hien === "Theo điều kiện") {
    const dk = oDieuKhienDuoc(mau, v.truong).find((t) => t.ma === v.hien_truong);
    if (!dk) return { loi: "Chọn ô điều khiển (ô chọn khác của phiếu)." };
    const gt = [...new Set((v.hien_gia_tri ?? []).map((x) => chuoi(x)).filter(Boolean))];
    if (gt.length === 0) return { loi: "Chọn ít nhất một giá trị để hiện ô." };
    const hopLe = dk.kieu === "chon" ? dk.luaChon ?? [] : (await docDanhMuc())[dk.danhMuc ?? ""] ?? [];
    if (hopLe.length > 0 && gt.some((x) => !hopLe.includes(x))) return { loi: "Có giá trị không thuộc danh sách của ô điều khiển." };
    dkT = dk.ma; dkG = gt;
  }
  const tenO = `${mau.ten} › ${o.ten}`;
  const macDinh = v.bat_buoc === "Mặc định" && v.che_do_hien === "Mặc định";
  if (macDinh) {
    if (cu) {
      await db.from("pd_o_cau_hinh").delete().eq("id", (cu as { id: string }).id);
      await ghiLichSu(v.ma_phieu, "Ô nhập", "Xoá", `${tenO}: trả về mặc định`, cu, null, nd);
    }
  } else {
    const dong = { ma_phieu: v.ma_phieu, truong: v.truong, bat_buoc: v.bat_buoc, che_do_hien: v.che_do_hien, hien_truong: dkT, hien_gia_tri: dkG };
    const { error } = await db.from("pd_o_cau_hinh").upsert(dong, { onConflict: "ma_phieu,truong" });
    if (error) return { loi: "Không lưu được, thử lại." };
    await ghiLichSu(v.ma_phieu, "Ô nhập", cu ? "Sửa" : "Thêm", `${tenO}: ${v.bat_buoc === "Mặc định" ? "" : v.bat_buoc.toLowerCase() + "; "}hiện ${v.che_do_hien === "Theo điều kiện" ? `khi ${dkT} = ${dkG?.join(" / ")}` : v.che_do_hien.toLowerCase()}`, cu, dong, nd);
  }
  revalidatePath(TRANG);
  return { ok: true };
}

// ------------------------------------------------------------------ thông báo

export type ThongBaoVao = { id?: string; ma_phieu: string; su_kien: string; loai_nguoi: string; chuc_danh: string; nhan_vien_id: string; dang_bat: boolean };

export async function luuThongBao(v: ThongBaoVao): Promise<KetQuaCauHinh> {
  const nd = await kyThuat();
  if (!nd) return { loi: "Chỉ tài khoản Kỹ thuật được sửa luồng phiếu." };
  if (!mauTheoMa(v.ma_phieu)) return { loi: "Không có loại phiếu này." };
  if (!(SU_KIEN_THONG_BAO as readonly string[]).includes(v.su_kien)) return { loi: "Sự kiện không hợp lệ." };
  if (!LOAI_NGUOI.includes(v.loai_nguoi)) return { loi: "Loại người nhận không hợp lệ." };
  const chucDanh = chuoi(v.chuc_danh);
  const nvId = v.loai_nguoi === "Nhân viên" ? chuoi(v.nhan_vien_id, 40) : "";
  if (v.loai_nguoi === "Chức danh" && !chucDanh) return { loi: "Nhập chức danh nhận thông báo." };
  if (v.loai_nguoi === "Nhân viên" && !UUID.test(nvId)) return { loi: "Chọn nhân sự." };
  const dong = { ma_phieu: v.ma_phieu, su_kien: v.su_kien, loai_nguoi: v.loai_nguoi, chuc_danh: v.loai_nguoi === "Chức danh" ? chucDanh : null, nhan_vien_id: nvId || null, dang_bat: !!v.dang_bat };
  const db = dbHr();
  const mo = `Khi ${v.su_kien.toLowerCase()}: báo ${moTaNguoi(v.loai_nguoi, dong.chuc_danh, await tenNhanVien(dong.nhan_vien_id))}${dong.dang_bat ? "" : " (tắt)"}`;
  if (v.id) {
    if (!UUID.test(v.id)) return { loi: "Dòng không hợp lệ." };
    const { data: cu } = await db.from("pd_thong_bao_cau_hinh").select("*").eq("id", v.id).eq("ma_phieu", v.ma_phieu).maybeSingle();
    if (!cu) return { loi: "Không tìm thấy dòng." };
    const { error } = await db.from("pd_thong_bao_cau_hinh").update(dong).eq("id", v.id);
    if (error) return { loi: "Không lưu được, thử lại." };
    await ghiLichSu(v.ma_phieu, "Thông báo", "Sửa", mo, cu, dong, nd);
  } else {
    const { error } = await db.from("pd_thong_bao_cau_hinh").insert(dong);
    if (error) return { loi: "Không lưu được, thử lại." };
    await ghiLichSu(v.ma_phieu, "Thông báo", "Thêm", mo, null, dong, nd);
  }
  revalidatePath(TRANG);
  return { ok: true };
}

export async function xoaThongBao(ma: string, id: string): Promise<KetQuaCauHinh> {
  const nd = await kyThuat();
  if (!nd) return { loi: "Chỉ tài khoản Kỹ thuật được sửa luồng phiếu." };
  if (!UUID.test(id)) return { loi: "Dòng không hợp lệ." };
  const db = dbHr();
  const { data: cu } = await db.from("pd_thong_bao_cau_hinh").select("*").eq("id", id).eq("ma_phieu", ma).maybeSingle();
  if (!cu) return { loi: "Không tìm thấy dòng." };
  const { error } = await db.from("pd_thong_bao_cau_hinh").delete().eq("id", id);
  if (error) return { loi: "Không xoá được, thử lại." };
  const c = cu as { su_kien: string; loai_nguoi: string; chuc_danh: string | null; nhan_vien_id: string | null };
  await ghiLichSu(ma, "Thông báo", "Xoá", `Khi ${c.su_kien.toLowerCase()}: báo ${moTaNguoi(c.loai_nguoi, c.chuc_danh, await tenNhanVien(c.nhan_vien_id))}`, cu, null, nd);
  revalidatePath(TRANG);
  return { ok: true };
}

// ------------------------------------------------------------------ nhóm mã, trạng thái loại phiếu

export async function luuNhomMa(ma: string, nhom: string, dangDung: boolean): Promise<KetQuaCauHinh> {
  const nd = await kyThuat();
  if (!nd) return { loi: "Chỉ tài khoản Kỹ thuật được sửa luồng phiếu." };
  const mau = mauTheoMa(ma);
  if (!mau) return { loi: "Không có loại phiếu này." };
  const n = chuoi(nhom, 6).toUpperCase();
  if (!/^[A-Z]{2,6}$/.test(n)) return { loi: "Nhóm mã gồm 2-6 chữ cái, ví dụ HR, FIN, MKT, ADM." };
  const db = dbHr();
  const { data: cu } = await db.from("pd_cau_hinh_phieu").select("nhom_ma, dang_dung").eq("ma_phieu", ma).maybeSingle();
  const c = (cu as { nhom_ma: string; dang_dung: boolean } | null) ?? { nhom_ma: mau.nhomMacDinh, dang_dung: true };
  if (c.nhom_ma === n && c.dang_dung === dangDung) return { ok: true };
  const { error } = await db.from("pd_cau_hinh_phieu").upsert({ ma_phieu: ma, nhom_ma: n, dang_dung: dangDung }, { onConflict: "ma_phieu" });
  if (error) return { loi: "Không lưu được, thử lại." };
  if (c.nhom_ma !== n) await ghiLichSu(ma, "Nhóm mã", "Sửa", `Nhóm mã ${c.nhom_ma} → ${n} (áp dụng cho phiếu nộp từ sau)`, c, { nhom_ma: n, dang_dung: dangDung }, nd);
  if (c.dang_dung !== dangDung) await ghiLichSu(ma, "Trạng thái loại phiếu", "Sửa", dangDung ? "Mở lại loại phiếu" : "Tạm ngưng loại phiếu (không nộp mới được)", c, { nhom_ma: n, dang_dung: dangDung }, nd);
  revalidatePath(TRANG);
  return { ok: true };
}
