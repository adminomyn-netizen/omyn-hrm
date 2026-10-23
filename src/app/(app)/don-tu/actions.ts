"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { layNguoiDungHienTai, yeuCauVaiTro } from "@/lib/auth";
import { layHoSoChamCong, layNhanVienIdTheoUser, layPhepNamDaDung, ngayHomNayHCM } from "@/lib/data";
import {
  CA_RA,
  CA_VAO,
  GIAI_TRINH_TOI_DA_NGAY,
  GIO_COI_LA_DI_MUON,
  LOAI_DON,
  LOAI_DON_CHAM_CONG,
  LOAI_NGHI_THEO_GIO,
  NGUONG_RA_MUON,
  PHEP_NAM_MOI_NAM,
  gioNgan,
  ngayLamViec,
  phatHienSaiPham,
  soNgayNghi,
  type SaiPham,
} from "@/lib/don-tu";
import { createAdminClient } from "@/lib/supabase/admin";

// Xem ghi chú đầy đủ trong src/lib/actions.ts: KHÔNG được gọi từ một <form>
// có nổ sự kiện submit thật — chỉ gọi từ onClick của nút type="button".
export type KetQuaDonTu = { loi?: string; ok?: boolean };

const laGio = (g: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(g);

/** Người nộp đơn: chính mình (cần hồ sơ nhân sự), hoặc — chỉ Kỹ thuật — một nhân viên đang làm. */
async function nguoiNopDon(nopChoId: string): Promise<{ nhanVienId: string; laKyThuat: boolean; canChamCong: boolean } | { loi: string }> {
  const nguoiDung = await layNguoiDungHienTai();
  if (!nguoiDung) redirect("/dang-nhap");
  if (nguoiDung.vaiTro === "cho_duyet") redirect("/cho-duyet");
  const laKyThuat = nguoiDung.vaiTro === "ky_thuat";
  const ho = await layHoSoChamCong(nguoiDung.id, nguoiDung.vaiTro);
  let nhanVienId = ho.nhanVienId;
  // Kỹ thuật tạo được mọi loại đơn và nộp thay cho bất kỳ nhân viên nào đang làm để nắm tình hình các đơn.
  if (laKyThuat && nopChoId) {
    const { data: nv } = await createAdminClient().from("nhan_vien").select("id").eq("id", nopChoId).neq("trang_thai", "Đã nghỉ").maybeSingle();
    if (!nv) return { loi: "Không tìm thấy nhân viên để nộp đơn." };
    nhanVienId = nv.id;
  }
  if (!nhanVienId) {
    return { loi: laKyThuat ? "Chọn nhân viên để nộp đơn (tài khoản Kỹ thuật chưa gắn hồ sơ nhân sự)." : "Tài khoản của bạn chưa gắn với hồ sơ nhân sự nào, không thể nộp đơn." };
  }
  return { nhanVienId, laKyThuat, canChamCong: ho.canChamCong || (laKyThuat && !!nopChoId) };
}

export type KetQuaChamCongNgay = { loi?: string; coDuLieu?: boolean; gioVao?: string | null; gioRa?: string | null; saiPham?: SaiPham[] };

/** Cho form Giải trình công: lấy chấm công của người nộp trong ĐÚNG ngày đã chọn và nêu các sai phạm cần giải trình. */
export async function layChamCongDeGiaiTrinh(ngay: string, nopCho: string): Promise<KetQuaChamCongNgay> {
  const nguoi = await nguoiNopDon(nopCho);
  if ("loi" in nguoi) return { loi: nguoi.loi };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ngay)) return { loi: "Ngày không hợp lệ." };
  const homNay = ngayHomNayHCM();
  if (ngay > homNay) return { loi: "Chỉ giải trình được những ngày đã chấm công." };
  const { data } = await createAdminClient().from("cham_cong").select("gio_vao, gio_ra").eq("nhan_vien_id", nguoi.nhanVienId).eq("ngay", ngay).maybeSingle();
  if (!data) return { coDuLieu: false };
  return { coDuLieu: true, gioVao: gioNgan(data.gio_vao) || null, gioRa: gioNgan(data.gio_ra) || null, saiPham: phatHienSaiPham(data, ngay, homNay) };
}

export async function taoDonTu(formData: FormData): Promise<KetQuaDonTu> {
  const nguoi = await nguoiNopDon(String(formData.get("nop_cho") || ""));
  if ("loi" in nguoi) return { loi: nguoi.loi };
  const { nhanVienId, laKyThuat, canChamCong } = nguoi;

  const loai = String(formData.get("loai") || "");
  const tuNgay = String(formData.get("tu_ngay") || "");
  let denNgay = String(formData.get("den_ngay") || "");
  const lyDo = String(formData.get("ly_do") || "").trim();

  if (!(LOAI_DON as readonly string[]).includes(loai)) {
    return { loi: "Loại đơn không hợp lệ." };
  }
  if (!laKyThuat && !canChamCong && (LOAI_DON_CHAM_CONG as readonly string[]).includes(loai)) {
    return { loi: "Chức vụ của bạn không phải chấm công nên không nộp loại đơn này." };
  }
  const supabase = createAdminClient();
  const dongThem: { gio_tu?: string; gio_den?: string; gio_vao_dung?: string; gio_ra_dung?: string } = {};

  if (loai === "Giải trình công") {
    // Chỉ MỘT ngày; hệ thống tự lấy chấm công của người đó trong ngày, chỉ giải trình khi có sai phạm và phải ghi giờ đúng.
    if (!tuNgay) return { loi: "Chọn ngày cần giải trình." };
    denNgay = tuNgay;
    if (!lyDo) return { loi: "Ghi lý do giải trình." };
    const { data: cc } = await supabase.from("cham_cong").select("gio_vao, gio_ra").eq("nhan_vien_id", nhanVienId).eq("ngay", tuNgay).maybeSingle();
    if (!cc) return { loi: "Ngày này chưa có dữ liệu chấm công để giải trình." };
    const saiPham = phatHienSaiPham(cc, tuNgay, ngayHomNayHCM());
    if (saiPham.length === 0) return { loi: "Ngày này không có sai phạm chấm công nên không cần giải trình." };
    const vaoDung = String(formData.get("gio_vao_dung") || "");
    const raDung = String(formData.get("gio_ra_dung") || "");
    if (saiPham.some((s) => s.ma === "vao_tre")) {
      if (!laGio(vaoDung)) return { loi: "Chọn giờ vào đúng cần sửa về." };
      if (`${vaoDung}:00` > GIO_COI_LA_DI_MUON) return { loi: `Giờ vào đúng phải từ ${gioNgan(GIO_COI_LA_DI_MUON)} trở về trước.` };
      dongThem.gio_vao_dung = vaoDung;
    }
    if (saiPham.some((s) => s.ma !== "vao_tre")) {
      if (!laGio(raDung)) return { loi: "Chọn giờ ra đúng cần sửa về." };
      if (`${raDung}:00` < CA_RA || `${raDung}:00` > NGUONG_RA_MUON) return { loi: `Giờ ra đúng phải từ ${gioNgan(CA_RA)} đến ${gioNgan(NGUONG_RA_MUON)}.` };
      dongThem.gio_ra_dung = raDung;
    }
    const { data: trung } = await supabase.from("don_tu").select("id").eq("nhan_vien_id", nhanVienId).eq("loai", "Giải trình công").eq("tu_ngay", tuNgay).in("trang_thai", ["Chờ duyệt", "Đã duyệt"]).limit(1);
    if (trung && trung.length > 0) return { loi: "Ngày này đã có đơn giải trình đang chờ hoặc đã được duyệt." };
  } else {
    if (!tuNgay || !denNgay) return { loi: "Thiếu từ ngày hoặc đến ngày." };
    if (denNgay < tuNgay) return { loi: "Đến ngày phải sau hoặc bằng từ ngày." };
  }
  if (loai === "Nghỉ chế độ" && !lyDo) return { loi: "Ghi rõ loại chế độ ở phần lý do (thai sản, ...)." };

  // Nghỉ một buổi / theo khoảng giờ: chỉ trong một ngày.
  const gioTu = String(formData.get("gio_tu") || "");
  const gioDen = String(formData.get("gio_den") || "");
  if (gioTu || gioDen) {
    if (!(LOAI_NGHI_THEO_GIO as readonly string[]).includes(loai)) return { loi: "Loại đơn này không chọn theo giờ." };
    if (!laGio(gioTu) || !laGio(gioDen)) return { loi: "Chọn đủ giờ bắt đầu và giờ kết thúc." };
    if (gioDen <= gioTu) return { loi: "Giờ kết thúc phải sau giờ bắt đầu." };
    if (tuNgay !== denNgay) return { loi: "Nghỉ theo giờ chỉ trong một ngày." };
    dongThem.gio_tu = gioTu;
    dongThem.gio_den = gioDen;
  }

  if (loai === "Nghỉ phép năm") {
    if (tuNgay.slice(0, 4) !== denNgay.slice(0, 4)) return { loi: "Đơn nghỉ phép năm không được nằm vắt qua hai năm, hãy tách thành hai đơn." };
    const xin = soNgayNghi(tuNgay, denNgay, dongThem.gio_tu, dongThem.gio_den);
    const daDung = await layPhepNamDaDung(nhanVienId, Number(tuNgay.slice(0, 4)));
    if (daDung + xin > PHEP_NAM_MOI_NAM) {
      return { loi: `Năm ${tuNgay.slice(0, 4)} còn ${Math.max(0, PHEP_NAM_MOI_NAM - daDung)}/${PHEP_NAM_MOI_NAM} ngày phép, đơn này xin ${xin} ngày (không tính Chủ nhật; nghỉ theo giờ tối đa 4 tiếng tính nửa ngày).` };
    }
  }

  const { error } = await supabase.from("don_tu").insert({
    nhan_vien_id: nhanVienId,
    loai,
    tu_ngay: tuNgay,
    den_ngay: denNgay,
    ly_do: lyDo || null,
    trang_thai: "Chờ duyệt",
    ...dongThem,
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
  const { data: don } = await supabase.from("don_tu").select("id, nhan_vien_id, trang_thai, loai, tu_ngay, den_ngay, gio_vao_dung, gio_ra_dung").eq("id", id).maybeSingle();
  if (!don) return { loi: "Không tìm thấy đơn." };
  if (don.trang_thai !== "Chờ duyệt") return { loi: "Đơn này đã được xử lý rồi." };
  if (nguoiDuyetNhanVienId && don.nhan_vien_id === nguoiDuyetNhanVienId) return { loi: "Bạn không tự duyệt đơn của chính mình." };

  const giaiTrinh = hanhDong === "duyet" && don.loai === "Giải trình công";
  const coGioDung = !!(don.gio_vao_dung || don.gio_ra_dung);
  if (giaiTrinh && !coGioDung && (Date.parse(don.den_ngay) - Date.parse(don.tu_ngay)) / 864e5 >= GIAI_TRINH_TOI_DA_NGAY) {
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

  // Giải trình công được duyệt: chấm công của ngày đó tự sửa về đúng giờ người đó đề nghị (vd giờ vào 08:00);
  // trạng thái thành Đúng giờ. Ghi lỗi thì đơn trả về "Chờ duyệt" để không có đơn duyệt mà giờ công chưa sửa.
  if (giaiTrinh) {
    const loiSua = coGioDung ? await suaVeGioDung(don.nhan_vien_id, don.tu_ngay, don.gio_vao_dung, don.gio_ra_dung) : await veDungCa(don.nhan_vien_id, don.tu_ngay, don.den_ngay);
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

/** Sửa chấm công MỘT ngày về giờ vào/ra đúng ghi trong đơn giải trình; phần không ghi giữ nguyên. */
async function suaVeGioDung(nhanVienId: string, ngay: string, vaoDung: string | null, raDung: string | null) {
  const cap: { gio_vao?: string; gio_ra?: string; trang_thai: string } = { trang_thai: "Đúng giờ" };
  if (vaoDung) cap.gio_vao = vaoDung;
  if (raDung) cap.gio_ra = raDung;
  const { data, error } = await createAdminClient().from("cham_cong").update(cap).eq("nhan_vien_id", nhanVienId).eq("ngay", ngay).select("id");
  if (error) return error.message;
  return data && data.length > 0 ? null : "Không còn dòng chấm công của ngày này.";
}

/** Đơn giải trình cũ (chưa ghi giờ đúng): đưa các ngày làm việc trong đơn về đúng ca. */
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
