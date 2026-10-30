"use server";

import { revalidatePath } from "next/cache";
import { layNguoiDungHienTai } from "@/lib/auth";
import { dbHr, laGiamDocTaiKhoan } from "@/lib/hr-db";
import { chuanHoaGiaTri, timMucHr } from "@/lib/hr-module";
import { cotDoi, ghiLichSuNhanSu } from "@/lib/nhan-su-lich-su";

export type KetQuaHr = { loi?: string; ok?: boolean };
const KHONG_QUYEN: KetQuaHr = { loi: "Bạn không có quyền thực hiện thao tác này." };

/** Chỉ Quản trị/Kỹ thuật (phòng HCNS) được sửa dữ liệu vận hành HCNS. Cột lấy từ cấu hình, không nhận cột lạ từ trình duyệt. */
async function nguoiQuanTri(chiGiamDoc = false) {
  const nd = await layNguoiDungHienTai();
  if (!nd || !(nd.vaiTro === "admin" || nd.vaiTro === "ky_thuat")) return null;
  return chiGiamDoc && !(await laGiamDocTaiKhoan(nd.id)) ? null : nd;
}

export async function luuBanGhiHr(fd: FormData): Promise<KetQuaHr> {
  const muc = timMucHr(String(fd.get("ma") ?? ""));
  if (!muc) return { loi: "Không tìm thấy mục này." };
  const nd = await nguoiQuanTri(muc.chiGiamDocSua);
  if (!nd) return muc.chiGiamDocSua ? { loi: "Chỉ giám đốc được nhập hoặc sửa mục này." } : KHONG_QUYEN;
  const id = String(fd.get("id") ?? "");
  if (id && !/^[0-9a-f-]{36}$/i.test(id)) return { loi: "Bản ghi không hợp lệ." };
  const dong: Record<string, string | number | boolean | null> = {};
  for (const c of muc.cot) {
    const r = chuanHoaGiaTri(c, String(fd.get(c.k) ?? ""));
    if ("loi" in r) return { loi: r.loi };
    dong[c.k] = r.v;
  }
  const db = dbHr();
  const cu = id ? ((await db.from(muc.bang).select("*").eq("id", id).maybeSingle()).data as Record<string, unknown> | null) : null;
  const { data: moi, error } = id ? await db.from(muc.bang).update(dong).eq("id", id).select("id").maybeSingle() : await db.from(muc.bang).insert(dong).select("id").maybeSingle();
  if (error) return { loi: "Chưa lưu được. Kiểm tra lại các ô rồi thử lại." };
  const doi = cotDoi(cu, dong);
  await ghiLichSuNhanSu({
    nhanVienId: typeof dong.nhan_vien_id === "string" ? dong.nhan_vien_id : null, doiTuong: muc.ten, doiTuongId: (moi as { id: string } | null)?.id ?? (id || null), hanhDong: id ? "Sửa" : "Thêm",
    moTa: id ? `${muc.ten}: sửa ${doi.length ? doi.map((k) => muc.cot.find((c) => c.k === k)?.nhan ?? k).join(", ") : "không đổi gì"}` : `${muc.ten}: thêm mới`, truoc: cu, sau: dong, nguoi: { id: nd.id, hoTen: nd.hoTen },
  });
  revalidatePath(`/hr/${muc.ma}`); revalidatePath("/hr");
  return { ok: true };
}

export async function xoaBanGhiHr(ma: string, id: string): Promise<KetQuaHr> {
  const muc = timMucHr(ma);
  if (!muc || !/^[0-9a-f-]{36}$/i.test(id)) return { loi: "Bản ghi không hợp lệ." };
  const nd = await nguoiQuanTri(muc.chiGiamDocSua);
  if (!nd) return muc.chiGiamDocSua ? { loi: "Chỉ giám đốc được xoá mục này." } : KHONG_QUYEN;
  const cu = (await dbHr().from(muc.bang).select("*").eq("id", id).maybeSingle()).data as Record<string, unknown> | null;
  const { error } = await dbHr().from(muc.bang).delete().eq("id", id);
  if (error) return { loi: "Chưa xoá được." };
  await ghiLichSuNhanSu({ nhanVienId: typeof cu?.nhan_vien_id === "string" ? cu.nhan_vien_id : null, doiTuong: muc.ten, doiTuongId: id, hanhDong: "Xoá", moTa: `${muc.ten}: xoá một bản ghi`, truoc: cu, sau: null, nguoi: { id: nd.id, hoTen: nd.hoTen } });
  revalidatePath(`/hr/${muc.ma}`); revalidatePath("/hr");
  return { ok: true };
}
