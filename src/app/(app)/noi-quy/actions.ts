"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { layNguoiDungDaDuyet } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { dbHr } from "@/lib/hr-db";
import { KHO_TEP } from "@/lib/tep-dinh-kem";
import { chuanHoaChu, duocQuanLyNoiQuy, duongDanNoiQuy, duongDanNoiQuyHopLe, kiemTepNoiQuy, laLoaiNoiQuy } from "@/lib/noi-quy";

type Loi = { loi: string };
const KHONG_QUYEN: Loi = { loi: "Chỉ Quản trị và Kỹ thuật mới tải lên hoặc xoá tài liệu." };
const kho = () => createAdminClient().storage.from(KHO_TEP);

async function quanLy() {
  const nd = await layNguoiDungDaDuyet();
  return duocQuanLyNoiQuy(nd.vaiTro) ? nd : null;
}

/** Bước 1: cấp link tải lên (file đi thẳng vào kho, không qua máy chủ). */
export async function taoLinkNoiQuy(v: { loai: string; tenTep: string; kichThuoc: number }): Promise<Loi | { duongDan: string; token: string; linkTai: string }> {
  if (!(await quanLy())) return KHONG_QUYEN;
  if (!laLoaiNoiQuy(v.loai)) return { loi: "Loại tài liệu không hợp lệ." };
  const l = kiemTepNoiQuy(v.tenTep, v.kichThuoc);
  if (l) return { loi: l };
  const duongDan = duongDanNoiQuy(randomUUID(), v.tenTep);
  const { data, error } = await kho().createSignedUploadUrl(duongDan);
  if (error || !data) return { loi: "Chưa tạo được link tải lên. Thử lại sau." };
  return { duongDan, token: data.token, linkTai: data.signedUrl };
}

/** Bước 2: tệp đã nằm trong kho thì ghi thông tin. Dung lượng lấy từ kho, không tin số khách khai. */
export async function xacNhanNoiQuy(v: { loai: string; ten: string; ghiChu: string; tenTep: string; duongDan: string }): Promise<Loi | { ok: true }> {
  const nd = await quanLy();
  if (!nd) return KHONG_QUYEN;
  if (!laLoaiNoiQuy(v.loai) || !duongDanNoiQuyHopLe(v.duongDan)) return { loi: "Thông tin tài liệu không hợp lệ." };
  const ten = chuanHoaChu(v.ten, 200);
  if (!ten) return { loi: "Nhập tên tài liệu." };
  const thu = "noi-quy";
  const tenFile = v.duongDan.slice(thu.length + 1);
  const { data: ds } = await kho().list(thu, { search: tenFile.slice(0, 36) });
  const f = (ds ?? []).find((x) => x.name === tenFile);
  const size = Number((f?.metadata as { size?: number } | null)?.size ?? 0);
  if (!f || size <= 0) return { loi: "Chưa thấy tệp trong kho. Tải lên chưa xong?" };
  const l = kiemTepNoiQuy(v.tenTep, size);
  if (l) {
    await kho().remove([v.duongDan]);
    return { loi: l };
  }
  const db = dbHr();
  const { data: dong, error } = await db
    .from("noi_quy_tai_lieu")
    .insert({ loai: v.loai, ten, ghi_chu: chuanHoaChu(v.ghiChu, 500) || null, duong_dan: v.duongDan, ten_tep: chuanHoaChu(v.tenTep, 200), kich_thuoc: size, nguoi_tai: nd.id, ten_nguoi_tai: nd.hoTen.slice(0, 120) })
    .select("id")
    .single();
  if (error || !dong) {
    await kho().remove([v.duongDan]);
    return { loi: "Chưa lưu được tài liệu. Thử lại sau." };
  }
  await db.from("nhat_ky").insert({ nguoi_thuc_hien: nd.id, bang: "noi_quy_tai_lieu", hanh_dong: "TAI_LEN", ban_ghi: dong.id, truoc: null, sau: { ten, loai: v.loai, tep: chuanHoaChu(v.tenTep, 200) } });
  revalidatePath("/noi-quy");
  return { ok: true };
}

export async function xoaNoiQuy(id: string): Promise<Loi | { ok: true }> {
  const nd = await quanLy();
  if (!nd) return KHONG_QUYEN;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { loi: "Tài liệu không hợp lệ." };
  const db = dbHr();
  const { data: t } = await db.from("noi_quy_tai_lieu").select("id, ten, loai, duong_dan").eq("id", id).maybeSingle();
  if (!t) return { loi: "Không tìm thấy tài liệu." };
  const { error } = await db.from("noi_quy_tai_lieu").delete().eq("id", id);
  if (error) return { loi: "Chưa xoá được. Thử lại sau." };
  await kho().remove([t.duong_dan as string]);
  await db.from("nhat_ky").insert({ nguoi_thuc_hien: nd.id, bang: "noi_quy_tai_lieu", hanh_dong: "XOA", ban_ghi: id, truoc: { ten: t.ten, loai: t.loai }, sau: null });
  revalidatePath("/noi-quy");
  return { ok: true };
}

/** Link tải có hạn 2 phút, chỉ cấp cho người đã duyệt. */
export async function layLinkNoiQuy(id: string): Promise<Loi | { url: string }> {
  await layNguoiDungDaDuyet();
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { loi: "Tài liệu không hợp lệ." };
  const { data: t } = await dbHr().from("noi_quy_tai_lieu").select("duong_dan, ten_tep").eq("id", id).maybeSingle();
  if (!t) return { loi: "Không tìm thấy tài liệu." };
  const { data, error } = await kho().createSignedUrl(t.duong_dan as string, 120, { download: t.ten_tep as string });
  if (error || !data) return { loi: "Chưa tạo được link. Thử lại sau." };
  return { url: data.signedUrl };
}
