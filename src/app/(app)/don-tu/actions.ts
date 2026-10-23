"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { layNguoiDungHienTai, yeuCauVaiTro } from "@/lib/auth";
import { layHoSoChamCong, layNhanVienIdTheoUser, layPhepNamDaDung, ngayHomNayHCM } from "@/lib/data";
import { CA_RA, CA_VAO, GIAI_TRINH_TOI_DA_NGAY, LOAI_DON, LOAI_DON_CHAM_CONG, PHEP_NAM_MOI_NAM, demNgayPhep, ngayLamViec } from "@/lib/don-tu";
import { createAdminClient } from "@/lib/supabase/admin";

// Xem ghi chú đầy đủ trong src/lib/actions.ts: KHÔNG được gọi từ một <form>
// có nổ sự kiện submit thật — chỉ gọi từ onClick của nút type="button".
export type KetQuaDonTu = { loi?: string; ok?: boolean };

export async function taoDonTu(formData: FormData): Promise<KetQuaDonTu> {
  const nguoiDung = await layNguoiDungHienTai();
  if (!nguoiDung) redirect("/dang-nhap");

  if (nguoiDung.vaiTro === "cho_duyet") redirect("/cho-duyet");

  const laKyThuat = nguoiDung.vaiTro === "ky_thuat";
  const ho = await layHoSoChamCong(nguoiDung.id, nguoiDung.vaiTro);
  let nhanVienId = ho.nhanVienId;
  // Kỹ thuật tạo được mọi loại đơn và nộp thay cho bất kỳ nhân viên nào đang làm để nắm tình hình các đơn.
  const nopCho = laKyThuat ? String(formData.get("nop_cho") || "") : "";
  if (nopCho) {
    const { data: nv } = await createAdminClient().from("nhan_vien").select("id").eq("id", nopCho).neq("trang_thai", "Đã nghỉ").maybeSingle();
    if (!nv) return { loi: "Không tìm thấy nhân viên để nộp đơn." };
    nhanVienId = nv.id;
  }
  const canChamCong = ho.canChamCong || (laKyThuat && !!nopCho);
  if (!nhanVienId) {
    return { loi: laKyThuat ? "Chọn nhân viên để nộp đơn (tài khoản Kỹ thuật chưa gắn hồ sơ nhân sự)." : "Tài khoản của bạn chưa gắn với hồ sơ nhân sự nào, không thể nộp đơn." };
  }
  const loai = String(formData.get("loai") || "");
  const tuNgay = String(formData.get("tu_ngay") || "");
  const denNgay = String(formData.get("den_ngay") || "");
  const lyDo = String(formData.get("ly_do") || "").trim();

  if (!(LOAI_DON as readonly string[]).includes(loai)) {
    return { loi: "Loại đơn không hợp lệ." };
  }
  if (!laKyThuat && !canChamCong && (LOAI_DON_CHAM_CONG as readonly string[]).includes(loai)) {
    return { loi: "Chức vụ của bạn không phải chấm công nên không nộp loại đơn này." };
  }
  if (!tuNgay || !denNgay) return { loi: "Thiếu từ ngày hoặc đến ngày." };
  if (denNgay < tuNgay) return { loi: "Đến ngày phải sau hoặc bằng từ ngày." };
  if (loai === "Nghỉ chế độ" && !lyDo) return { loi: "Ghi rõ loại chế độ ở phần lý do (thai sản, ...)." };

  if (loai === "Nghỉ phép năm") {
    if (tuNgay.slice(0, 4) !== denNgay.slice(0, 4)) return { loi: "Đơn nghỉ phép năm không được nằm vắt qua hai năm, hãy tách thành hai đơn." };
    const xin = demNgayPhep(tuNgay, denNgay);
    const daDung = await layPhepNamDaDung(nhanVienId, Number(tuNgay.slice(0, 4)));
    if (daDung + xin > PHEP_NAM_MOI_NAM) {
      return { loi: `Năm ${tuNgay.slice(0, 4)} bạn còn ${Math.max(0, PHEP_NAM_MOI_NAM - daDung)}/${PHEP_NAM_MOI_NAM} ngày phép, đơn này xin ${xin} ngày (không tính Chủ nhật).` };
    }
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("don_tu").insert({
    nhan_vien_id: nhanVienId,
    loai,
    tu_ngay: tuNgay,
    den_ngay: denNgay,
    ly_do: lyDo || null,
    trang_thai: "Chờ duyệt",
  });
  if (error) return { loi: error.message };

  revalidatePath("/don-tu");
  return { ok: true };
}

/** Duyệt/từ chối đơn. Chỉ đổi được đơn còn "Chờ duyệt" (không lật quyết định cũ) và không tự duyệt đơn của chính mình. */
export async function duyetDonTu(formData: FormData): Promise<KetQuaDonTu> {
  const nguoiDuyet = await yeuCauVaiTro(["admin", "ky_thuat"]);
  const id = String(formData.get("id") || "");
  const hanhDong = String(formData.get("hanh_dong") || "");
  if (!id || (hanhDong !== "duyet" && hanhDong !== "tu_choi")) return { loi: "Dữ liệu không hợp lệ." };

  const supabase = createAdminClient();
  const nguoiDuyetNhanVienId = await layNhanVienIdTheoUser(nguoiDuyet.id);
  const { data: don } = await supabase.from("don_tu").select("id, nhan_vien_id, trang_thai, loai, tu_ngay, den_ngay").eq("id", id).maybeSingle();
  if (!don) return { loi: "Không tìm thấy đơn." };
  if (don.trang_thai !== "Chờ duyệt") return { loi: "Đơn này đã được xử lý rồi." };
  if (nguoiDuyetNhanVienId && don.nhan_vien_id === nguoiDuyetNhanVienId) return { loi: "Bạn không tự duyệt đơn của chính mình." };

  const giaiTrinh = hanhDong === "duyet" && don.loai === "Giải trình công";
  if (giaiTrinh && (Date.parse(don.den_ngay) - Date.parse(don.tu_ngay)) / 864e5 >= GIAI_TRINH_TOI_DA_NGAY) {
    return { loi: `Đơn giải trình công trải quá ${GIAI_TRINH_TOI_DA_NGAY} ngày, hãy yêu cầu tách nhỏ rồi duyệt.` };
  }

  const { data: capNhat, error } = await supabase
    .from("don_tu")
    .update({ trang_thai: hanhDong === "duyet" ? "Đã duyệt" : "Từ chối", nguoi_duyet_id: nguoiDuyetNhanVienId })
    .eq("id", id)
    .eq("trang_thai", "Chờ duyệt")
    .select("id");
  if (error) return { loi: "Chưa lưu được quyết định. Thử lại sau." };
  if (!capNhat || capNhat.length === 0) return { loi: "Đơn này vừa được người khác xử lý." };

  // Giải trình công được duyệt: giờ chấm công các ngày làm việc trong đơn trở về đúng ca đã quy định
  // (vào không muộn hơn đầu ca, ra không sớm hơn cuối ca, ngày chưa có dòng thì tạo mới); trạng thái thành Đúng giờ.
  if (giaiTrinh) {
    const loiSua = await veDungCa(don.nhan_vien_id, don.tu_ngay, don.den_ngay);
    if (loiSua) {
      await supabase.from("don_tu").update({ trang_thai: "Chờ duyệt", nguoi_duyet_id: null }).eq("id", id);
      return { loi: "Chưa chỉnh được giờ chấm công nên đơn vẫn chờ duyệt. Thử lại sau." };
    }
    revalidatePath("/cham-cong");
  }

  revalidatePath("/don-tu");
  revalidatePath("/dashboard");
  return { ok: true };
}

/** Đưa chấm công của một người trong khoảng ngày về đúng ca; trả về chuỗi lỗi nếu ghi thất bại. */
async function veDungCa(nhanVienId: string, tu: string, den: string) {
  const supabase = createAdminClient();
  const ngay = ngayLamViec(tu, den, ngayHomNayHCM());
  if (ngay.length === 0) return null;
  const { data: cu, error } = await supabase.from("cham_cong").select("ngay, gio_vao, gio_ra").eq("nhan_vien_id", nhanVienId).in("ngay", ngay);
  if (error) return error.message;
  const theoNgay = new Map((cu ?? []).map((c) => [c.ngay as string, c]));
  const dong = ngay.map((n) => {
    const c = theoNgay.get(n);
    return {
      nhan_vien_id: nhanVienId,
      ngay: n,
      gio_vao: c?.gio_vao && c.gio_vao <= CA_VAO ? c.gio_vao : CA_VAO,
      gio_ra: c?.gio_ra && c.gio_ra >= CA_RA ? c.gio_ra : CA_RA,
      trang_thai: "Đúng giờ",
    };
  });
  const { error: loiGhi } = await supabase.from("cham_cong").upsert(dong, { onConflict: "nhan_vien_id,ngay" });
  return loiGhi?.message ?? null;
}
