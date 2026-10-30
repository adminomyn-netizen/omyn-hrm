"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { layNguoiDungHienTai } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { dbHr } from "@/lib/hr-db";
import { ngayHomNayHCM } from "@/lib/data";
import {
  batDauLuong, dungCacO, hangApDung, kiemTraPhieu, quyenTrenPhieu, soPhieuText, thangMa, xuLyO,
  type HanhDongDuyet, type HangLuong, type O,
} from "@/lib/phe-duyet";
import { mauTheoMa } from "@/lib/phe-duyet-mau";
import {
  COT_PHIEU, KHO_TEP, baoNguoiDung, docDanhMuc, docLuong, docNhomMa, docO, ghiO, nguCanhNguoiDuyet, nhanVienCuaTaiKhoan, type PhieuTho,
} from "@/lib/phe-duyet-data";

// Xem ghi chú trong src/lib/actions.ts: gọi từ onClick của nút type="button", không từ <form> submit thật.
export type KetQuaPd = { loi?: string; loiO?: Record<string, string>; ok?: boolean; id?: string; soPhieu?: string };
export type TepMoi = { truong: string; ten: string; duongDan: string; kichThuoc: number; loai: string | null };

const TOI_DA_MOI_TEP = 25 * 1024 * 1024;
const TOI_DA_TEP_MOI_PHIEU = 30;
const DUOI_CHO_PHEP = /\.(pdf|png|jpe?g|webp|heic|docx?|xlsx?|pptx?|csv|txt|zip)$/i;
const tenAnToan = (ten: string) => ten.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").replace(/[^\w.-]+/g, "_").slice(-80) || "tep";

async function nguoiHienTai() {
  const nd = await layNguoiDungHienTai();
  if (!nd) redirect("/dang-nhap");
  if (nd.vaiTro === "cho_duyet") redirect("/cho-duyet");
  return nd;
}

/** Bước 1 của đính kèm: máy chủ cấp đường tải lên trực tiếp lên kho (qua Vercel bị giới hạn 4,5 MB/lượt). */
export async function xinUploadTep(ds: { ten: string; kichThuoc: number }[]): Promise<{ loi?: string; ds?: { duongDan: string; token: string }[] }> {
  const nd = await nguoiHienTai();
  if (ds.length === 0 || ds.length > TOI_DA_TEP_MOI_PHIEU) return { loi: `Mỗi lần chọn tối đa ${TOI_DA_TEP_MOI_PHIEU} tệp.` };
  for (const f of ds) {
    if (!DUOI_CHO_PHEP.test(f.ten)) return { loi: `Tệp “${f.ten}” không đúng loại cho phép (PDF, ảnh, Word, Excel, PowerPoint, CSV, TXT, ZIP).` };
    if (!(f.kichThuoc > 0) || f.kichThuoc > TOI_DA_MOI_TEP) return { loi: `Tệp “${f.ten}” quá 25 MB.` };
  }
  const kho = createAdminClient().storage.from(KHO_TEP);
  const ra: { duongDan: string; token: string }[] = [];
  for (const f of ds) {
    const duongDan = `tam/${nd.id}/${crypto.randomUUID()}-${tenAnToan(f.ten)}`;
    const { data, error } = await kho.createSignedUploadUrl(duongDan);
    if (error || !data) return { loi: "Không tạo được đường tải tệp, thử lại." };
    ra.push({ duongDan, token: data.token });
  }
  return { ds: ra };
}

/** Kiểm tệp mới đã lên kho thật và thuộc về chính người nộp. */
async function kiemTepMoi(tep: TepMoi[], userId: string): Promise<string | null> {
  const kho = createAdminClient().storage.from(KHO_TEP);
  for (const t of tep) {
    if (!t.duongDan.startsWith(`tam/${userId}/`) || t.duongDan.includes("..")) return "Tệp đính kèm không hợp lệ.";
    const { data } = await kho.exists(t.duongDan);
    if (!data) return `Tệp “${t.ten}” chưa tải lên xong, thử lại.`;
  }
  return null;
}

/** Chuyển tệp từ thư mục tạm sang thư mục của phiếu rồi ghi bảng tệp. */
async function luuTep(phieuId: string, tep: TepMoi[]): Promise<string | null> {
  const kho = createAdminClient().storage.from(KHO_TEP);
  const dong: Record<string, unknown>[] = [];
  for (const t of tep) {
    const dich = `phieu/${phieuId}/${t.duongDan.split("/").pop()}`;
    const { error } = await kho.move(t.duongDan, dich);
    if (error) return "Không lưu được tệp đính kèm, thử lại.";
    dong.push({ phieu_id: phieuId, truong: t.truong, ten_tep: t.ten.slice(0, 200), duong_dan: dich, kich_thuoc: Math.max(0, Math.round(t.kichThuoc)), loai: t.loai });
  }
  if (dong.length === 0) return null;
  const { error } = await dbHr().from("pd_tep").insert(dong);
  return error ? "Không ghi được tệp đính kèm." : null;
}

async function soTepTheoO(phieuId: string | null, moi: TepMoi[]): Promise<Record<string, number>> {
  const dem: Record<string, number> = {};
  if (phieuId) {
    const { data } = await dbHr().from("pd_tep").select("truong").eq("phieu_id", phieuId);
    for (const r of (data ?? []) as { truong: string }[]) dem[r.truong] = (dem[r.truong] ?? 0) + 1;
  }
  for (const t of moi) dem[t.truong] = (dem[t.truong] ?? 0) + 1;
  return dem;
}

const lichSu = (phieuId: string, buoc: number | null, userId: string, ten: string, hanhDong: string, ghiChu?: string | null) =>
  dbHr().from("pd_lich_su").insert({ phieu_id: phieuId, buoc, user_id: userId, ten_nguoi: ten, hanh_dong: hanhDong, ghi_chu: ghiChu?.trim() || null });

const URL_PHIEU = (id: string) => `/phe-duyet/${id}`;

/** Nộp phiếu mới: kiểm tra, cấp số phiếu, lưu tệp, dựng luồng duyệt rồi báo người duyệt bước đầu. */
export async function nopPhieu(ma: string, du: Record<string, unknown>, tep: TepMoi[]): Promise<KetQuaPd> {
  const nd = await nguoiHienTai();
  const mau = mauTheoMa(ma);
  if (!mau) return { loi: "Không có loại phiếu này." };
  const nhom = (await docNhomMa())[ma];
  if (nhom && !nhom.dung) return { loi: "Loại phiếu này đang tạm ngưng." };
  const nguoiNop = await nhanVienCuaTaiKhoan(nd.id);
  if (!nguoiNop) return { loi: "Tài khoản của bạn chưa gắn với hồ sơ nhân sự nào, chưa nộp phiếu được." };
  if (tep.length > TOI_DA_TEP_MOI_PHIEU) return { loi: `Tối đa ${TOI_DA_TEP_MOI_PHIEU} tệp mỗi phiếu.` };
  const oTep = new Set(mau.truong.filter((t) => t.kieu === "tep").map((t) => t.ma));
  if (tep.some((t) => !oTep.has(t.truong))) return { loi: "Tệp đính kèm không hợp lệ." };
  const { loi, sach } = kiemTraPhieu(mau, du, { danhMuc: await docDanhMuc(), soTep: await soTepTheoO(null, tep) });
  if (Object.keys(loi).length > 0) return { loi: "Kiểm tra lại các ô báo đỏ.", loiO: loi };
  const loiTep = await kiemTepMoi(tep, nd.id);
  if (loiTep) return { loi: loiTep };

  const nhomMa = nhom?.nhom ?? mau.nhomMacDinh;
  const homNay = ngayHomNayHCM();
  const db = dbHr();
  const { data: so, error: eSo } = await db.rpc("pd_cap_so", { p_nhom: nhomMa, p_thang: thangMa(homNay) });
  if (eSo || typeof so !== "number") return { loi: "Chưa cấp được số phiếu, thử lại." };
  const soPhieu = soPhieuText(nhomMa, homNay, so);
  const { data: p, error: eP } = await db.from("pd_phieu").insert({ so_phieu: soPhieu, ma_phieu: ma, nhom_ma: nhomMa, nguoi_nop_id: nguoiNop.id, nguoi_tao_user: nd.id, du_lieu: sach }).select("id").single();
  if (eP || !p) return { loi: "Không lưu được phiếu, thử lại." };
  const id = p.id as string;
  const huyPhieuLoi = async (loi: string): Promise<KetQuaPd> => { await db.from("pd_phieu").delete().eq("id", id); return { loi }; };

  const loiLuu = await luuTep(id, tep);
  if (loiLuu) return huyPhieuLoi(loiLuu);

  const ctx = await nguCanhNguoiDuyet(nguoiNop);
  let hang: HangLuong[] = hangApDung(await docLuong(ma), sach);
  let cacO = dungCacO(hang, ctx).map((x) => ({ ...x, id: crypto.randomUUID() }));
  let kq = batDauLuong(cacO);
  if (kq.trangThai === "Đã duyệt") {
    // Chưa có ai để duyệt (luồng trống hoặc chưa gắn quản lý): chuyển cho Kỹ thuật xử lý thay vì tự duyệt.
    hang = [{ buoc: 1, tenBuoc: "Chưa có người duyệt: Kỹ thuật xử lý", kieu: "AND", loaiNguoi: "Kỹ thuật", chucDanh: null, nhanVienId: null, dieuKienTruong: null, dieuKienGiaTri: null }];
    cacO = dungCacO(hang, ctx).map((x) => ({ ...x, id: crypto.randomUUID() }));
    kq = batDauLuong(cacO);
    if (kq.trangThai === "Đã duyệt") return huyPhieuLoi("Phiếu này chưa có người duyệt nào được cấu hình, báo Kỹ thuật bổ sung luồng duyệt.");
  }
  const { error: eB } = await db.from("pd_buoc").insert(kq.o.map((x) => ({ id: x.id, phieu_id: id, buoc: x.buoc, ten_buoc: x.tenBuoc ?? null, kieu: x.kieu, nhan_vien_id: x.nhanVienId, user_id: x.userId, ten_nguoi: x.ten, trang_thai: x.trangThai, xu_ly_luc: x.trangThai === "Đã xem" ? new Date().toISOString() : null })));
  if (eB) return huyPhieuLoi("Không dựng được luồng duyệt, thử lại.");
  await db.from("pd_phieu").update({ buoc_hien_tai: kq.buocHienTai }).eq("id", id);
  await lichSu(id, null, nd.id, nd.hoTen, "Nộp");

  await baoNguoiDung(kq.canBao.cho.map((x) => x.userId), { tieuDe: `Phiếu chờ bạn duyệt: ${soPhieu}`, noiDung: `${mau.ten} — ${nguoiNop.hoTen}`, url: URL_PHIEU(id), tag: `pd-${id}` });
  await baoNguoiDung(kq.canBao.banSao.map((x) => x.userId), { tieuDe: `Bản sao phiếu ${soPhieu}`, noiDung: `${mau.ten} — ${nguoiNop.hoTen}`, url: URL_PHIEU(id) });
  revalidatePath("/phe-duyet");
  return { ok: true, id, soPhieu };
}

async function taiPhieu(id: string): Promise<PhieuTho | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data } = await dbHr().from("pd_phieu").select(COT_PHIEU).eq("id", id).maybeSingle();
  return (data as unknown as PhieuTho) ?? null;
}

/** Duyệt / từ chối / yêu cầu bổ sung ở ô duyệt của chính người dùng, ở đúng bước hiện tại. */
export async function xuLyPhieu(id: string, hanhDong: HanhDongDuyet, ghiChu: string): Promise<KetQuaPd> {
  const nd = await nguoiHienTai();
  const p = await taiPhieu(id);
  if (!p) return { loi: "Không tìm thấy phiếu." };
  if (hanhDong !== "Duyệt" && ghiChu.trim().length < 3) return { loi: hanhDong === "Từ chối" ? "Ghi lý do từ chối." : "Ghi rõ cần người nộp bổ sung gì." };
  if (ghiChu.length > 1000) return { loi: "Ghi chú quá dài." };
  const nv = await nhanVienCuaTaiKhoan(nd.id);
  const o = await docO(id);
  const q = quyenTrenPhieu({ trangThai: p.trang_thai, nguoiNopId: p.nguoi_nop_id, buocHienTai: p.buoc_hien_tai }, o, { nhanVienId: nv?.id ?? null, userId: nd.id });
  if (!q.oDuyet) return { loi: "Phiếu này hiện không chờ bạn duyệt." };
  const kq = xuLyO(o, q.oDuyet.id, hanhDong, p.buoc_hien_tai);
  if (kq.loi !== undefined) return { loi: kq.loi };
  const luc = new Date().toISOString();
  // Giữ chỗ bằng cap_nhat_luc: hai người cùng bấm một lúc thì chỉ một người thành công.
  const hoanTat = kq.trangThai === "Đã duyệt" || kq.trangThai === "Từ chối";
  const { data: cas } = await dbHr().from("pd_phieu").update({ trang_thai: kq.trangThai, buoc_hien_tai: kq.buocHienTai, cap_nhat_luc: luc, hoan_tat_luc: hoanTat ? luc : null }).eq("id", id).eq("cap_nhat_luc", p.cap_nhat_luc).select("id");
  if (!cas || cas.length === 0) return { loi: "Phiếu vừa được người khác xử lý, tải lại trang để xem." };
  await ghiO(o, kq.o, luc, { oId: q.oDuyet.id, yKien: ghiChu.trim() || null });
  await lichSu(id, p.buoc_hien_tai, nd.id, nd.hoTen, hanhDong, ghiChu);

  const mau = mauTheoMa(p.ma_phieu);
  const nguoiNopUser = await userCuaNhanVien(p.nguoi_nop_id);
  const ten = `${p.so_phieu} — ${mau?.ten ?? p.ma_phieu}`;
  if (kq.trangThai === "Đã duyệt") await baoNguoiDung([nguoiNopUser], { tieuDe: `Phiếu đã được duyệt: ${p.so_phieu}`, noiDung: ten, url: URL_PHIEU(id) });
  else if (kq.trangThai === "Từ chối") await baoNguoiDung([nguoiNopUser], { tieuDe: `Phiếu bị từ chối: ${p.so_phieu}`, noiDung: `${nd.hoTen}: ${ghiChu.trim()}`, url: URL_PHIEU(id) });
  else if (kq.trangThai === "Cần bổ sung") await baoNguoiDung([nguoiNopUser], { tieuDe: `Phiếu cần bổ sung: ${p.so_phieu}`, noiDung: `${nd.hoTen}: ${ghiChu.trim()}`, url: URL_PHIEU(id) });
  else if (kq.canBao.cho.length > 0 || kq.canBao.banSao.length > 0) {
    await baoNguoiDung(kq.canBao.cho.map((x) => x.userId), { tieuDe: `Phiếu chờ bạn duyệt: ${p.so_phieu}`, noiDung: `${mau?.ten ?? p.ma_phieu} — ${p.nguoi_nop?.ho_ten ?? ""}`, url: URL_PHIEU(id), tag: `pd-${id}` });
    await baoNguoiDung(kq.canBao.banSao.map((x) => x.userId), { tieuDe: `Bản sao phiếu ${p.so_phieu}`, noiDung: ten, url: URL_PHIEU(id) });
  }
  revalidatePath("/phe-duyet"); revalidatePath(URL_PHIEU(id));
  return { ok: true, id, soPhieu: p.so_phieu };
}

async function userCuaNhanVien(nvId: string | null): Promise<string | null> {
  if (!nvId) return null;
  const { data } = await dbHr().from("nhan_vien").select("user_id").eq("id", nvId).maybeSingle();
  return (data as { user_id: string | null } | null)?.user_id ?? null;
}

/** Người nộp sửa theo yêu cầu bổ sung và nộp lại: luồng duyệt chạy lại từ bước đầu. */
export async function nopLaiPhieu(id: string, du: Record<string, unknown>, tep: TepMoi[]): Promise<KetQuaPd> {
  const nd = await nguoiHienTai();
  const p = await taiPhieu(id);
  if (!p) return { loi: "Không tìm thấy phiếu." };
  const nv = await nhanVienCuaTaiKhoan(nd.id);
  const o = await docO(id);
  const q = quyenTrenPhieu({ trangThai: p.trang_thai, nguoiNopId: p.nguoi_nop_id, buocHienTai: p.buoc_hien_tai }, o, { nhanVienId: nv?.id ?? null, userId: nd.id });
  if (!q.suaVaNopLai) return { loi: "Phiếu này không ở trạng thái cần bổ sung của bạn." };
  const mau = mauTheoMa(p.ma_phieu);
  if (!mau) return { loi: "Loại phiếu không còn." };
  const oTep = new Set(mau.truong.filter((t) => t.kieu === "tep").map((t) => t.ma));
  if (tep.some((t) => !oTep.has(t.truong))) return { loi: "Tệp đính kèm không hợp lệ." };
  const { loi, sach } = kiemTraPhieu(mau, du, { danhMuc: await docDanhMuc(), soTep: await soTepTheoO(id, tep) });
  if (Object.keys(loi).length > 0) return { loi: "Kiểm tra lại các ô báo đỏ.", loiO: loi };
  const loiTep = await kiemTepMoi(tep, nd.id);
  if (loiTep) return { loi: loiTep };
  const loiLuu = await luuTep(id, tep);
  if (loiLuu) return { loi: loiLuu };

  const kq = batDauLuong(o);
  const luc = new Date().toISOString();
  const { data: cas } = await dbHr().from("pd_phieu").update({ du_lieu: sach, trang_thai: kq.trangThai, buoc_hien_tai: kq.buocHienTai, cap_nhat_luc: luc, hoan_tat_luc: null }).eq("id", id).eq("cap_nhat_luc", p.cap_nhat_luc).select("id");
  if (!cas || cas.length === 0) return { loi: "Phiếu vừa thay đổi, tải lại trang." };
  await ghiO(o, kq.o, luc);
  await lichSu(id, null, nd.id, nd.hoTen, "Nộp lại");
  await baoNguoiDung(kq.canBao.cho.map((x) => x.userId), { tieuDe: `Phiếu nộp lại, chờ bạn duyệt: ${p.so_phieu}`, noiDung: `${mau.ten} — ${nv?.hoTen ?? ""}`, url: URL_PHIEU(id), tag: `pd-${id}` });
  await baoNguoiDung(kq.canBao.banSao.map((x) => x.userId), { tieuDe: `Bản sao phiếu ${p.so_phieu}`, noiDung: mau.ten, url: URL_PHIEU(id) });
  revalidatePath("/phe-duyet"); revalidatePath(URL_PHIEU(id));
  return { ok: true, id, soPhieu: p.so_phieu };
}

/** Người nộp huỷ phiếu khi chưa xong. */
export async function huyPhieu(id: string, ghiChu: string): Promise<KetQuaPd> {
  const nd = await nguoiHienTai();
  const p = await taiPhieu(id);
  if (!p) return { loi: "Không tìm thấy phiếu." };
  const nv = await nhanVienCuaTaiKhoan(nd.id);
  const o = await docO(id);
  const q = quyenTrenPhieu({ trangThai: p.trang_thai, nguoiNopId: p.nguoi_nop_id, buocHienTai: p.buoc_hien_tai }, o, { nhanVienId: nv?.id ?? null, userId: nd.id });
  if (!q.huy) return { loi: "Chỉ người nộp huỷ được, và chỉ khi phiếu chưa duyệt xong." };
  const luc = new Date().toISOString();
  const { data: cas } = await dbHr().from("pd_phieu").update({ trang_thai: "Đã huỷ", buoc_hien_tai: 0, cap_nhat_luc: luc, hoan_tat_luc: luc }).eq("id", id).eq("cap_nhat_luc", p.cap_nhat_luc).select("id");
  if (!cas || cas.length === 0) return { loi: "Phiếu vừa thay đổi, tải lại trang." };
  await dbHr().from("pd_buoc").update({ trang_thai: "Bỏ qua", xu_ly_luc: luc }).eq("phieu_id", id).eq("trang_thai", "Chờ");
  await lichSu(id, null, nd.id, nd.hoTen, "Huỷ", ghiChu);
  const dangCho = o.filter((x: O) => x.kieu !== "CC" && x.trangThai === "Chờ" && x.buoc === p.buoc_hien_tai);
  await baoNguoiDung(dangCho.map((x) => x.userId), { tieuDe: `Phiếu đã bị huỷ: ${p.so_phieu}`, noiDung: `${nv?.hoTen ?? ""} đã huỷ phiếu`, url: URL_PHIEU(id) });
  revalidatePath("/phe-duyet"); revalidatePath(URL_PHIEU(id));
  return { ok: true, id, soPhieu: p.so_phieu };
}
