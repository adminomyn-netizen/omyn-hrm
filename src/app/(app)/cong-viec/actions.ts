"use server";

import { revalidatePath } from "next/cache";
import { layNguoiDungHienTai } from "@/lib/auth";
import { apDungGhiNhan, trangThaiSauGhiNhan } from "@/lib/cong-viec";
import { dbHr } from "@/lib/hr-db";
import { homNayHcm } from "@/lib/kpi-data";
import { chanHoanThanhThieuMinhChung, chuanHoaLink, mienBaoCaoCv, tinThemViec } from "@/lib/bao-cao-cv";
import { nguoiNhanTongHopBaoCao } from "@/lib/bao-cao-cv-data";
import { guiChoNguoiDung } from "@/lib/push";
import { MAU_CONG_VIEC } from "@/lib/mau-cong-viec";

export type KetQuaCv = { loi?: string; ok?: boolean };
const UUID = /^[0-9a-f-]{36}$/i;
const UU_TIEN = ["Cao", "Trung bình", "Thấp"],
  LOAI = ["Hằng ngày", "Vận hành"],
  LAP = ["Không", "Hằng ngày"];

/** Người được thao tác công việc của `nguoiLamId`: chính họ, trưởng phòng trực tiếp của họ, hoặc Quản trị/Kỹ thuật. Kiểm lại ở máy chủ cho MỌI thao tác. */
async function duocThaoTac(nguoiLamId: string) {
  const nd = await layNguoiDungHienTai();
  if (!nd || nd.vaiTro === "cho_duyet") return null;
  if (nd.vaiTro === "admin" || nd.vaiTro === "ky_thuat")
    return { nd, toiId: null as string | null };
  const db = dbHr();
  const { data: toi } = await db
    .from("nhan_vien")
    .select("id")
    .eq("user_id", nd.id)
    .maybeSingle();
  if (!toi) return null;
  if (toi.id === nguoiLamId) return { nd, toiId: toi.id as string };
  const { data: cap } = await db
    .from("nhan_vien")
    .select("id")
    .eq("id", nguoiLamId)
    .eq("quan_ly_id", toi.id)
    .maybeSingle();
  return cap ? { nd, toiId: toi.id as string } : null;
}
/** Người đang thao tác có thuộc diện PHẢI báo cáo (không phải Giám đốc/Phó giám đốc/Kỹ thuật) không — họ là người bị ràng buộc minh chứng và là nguồn thông báo "vừa thêm việc". */
async function thaoTacVien() {
  const nd = await layNguoiDungHienTai();
  if (!nd) return { nd: null, phaiBaoCao: false };
  const { data } = await dbHr().from("nhan_vien").select("chuc_danh, quyen_giam_doc").eq("user_id", nd.id).neq("trang_thai", "Đã nghỉ").maybeSingle();
  return { nd, phaiBaoCao: !mienBaoCaoCv(nd.vaiTro, data?.chuc_danh, data?.quyen_giam_doc) };
}

/** Việc này đã có link minh chứng chưa: việc lặp tính của HÔM NAY; việc một lần tính bất kỳ ngày nào đã gắn. */
async function coMinhChungChoViec(id: string, lapLai: boolean): Promise<boolean> {
  let q = dbHr().from("cong_viec_ngay").select("cong_viec_id", { head: true, count: "exact" }).eq("cong_viec_id", id).not("link_bao_cao", "is", null);
  if (lapLai) q = q.eq("ngay", homNayHcm());
  const { count } = await q;
  return (count ?? 0) > 0;
}

/** Báo Giám đốc / Phó giám đốc / Kỹ thuật khi một nhân sự vừa thêm việc: ai, phòng ban nào, việc gì. Lỗi gửi thông báo không làm hỏng việc thêm. */
async function baoQuanLyThemViec(nguoiLamId: string, tieuDe: string[]) {
  try {
    const { nd, phaiBaoCao } = await thaoTacVien();
    if (!nd || !phaiBaoCao || tieuDe.length === 0) return;
    const { data: nv } = await dbHr().from("nhan_vien").select("ho_ten, khoi(ten)").eq("id", nguoiLamId).maybeSingle();
    if (!nv) return;
    const tin = tinThemViec({ hoTen: nv.ho_ten as string, khoi: (nv.khoi as { ten?: string } | null)?.ten, tieuDe });
    const nhan = (await nguoiNhanTongHopBaoCao()).filter((u) => u !== nd.id);
    if (nhan.length) await guiChoNguoiDung(nhan, { ...tin, url: "/cong-viec/tong-quan", tag: `viec-moi-${nguoiLamId}-${Date.now()}` });
  } catch (e) {
    console.error("[bao-quan-ly-them-viec] lỗi", (e as Error).message);
  }
}

const KHONG_QUYEN: KetQuaCv = { loi: "Bạn không có quyền với việc này." };
const lamMoi = () => {
  revalidatePath("/cong-viec");
};

export async function luuCongViec(fd: FormData): Promise<KetQuaCv> {
  const id = String(fd.get("id") ?? "");
  const nguoiLamId = String(fd.get("nguoi_lam_id") ?? "");
  const tieuDe = String(fd.get("tieu_de") ?? "")
    .trim()
    .slice(0, 200);
  if (!tieuDe) return { loi: "Nhập tên việc." };
  if (!UUID.test(nguoiLamId) || (id && !UUID.test(id)))
    return { loi: "Chọn người làm." };
  const uuTien = String(fd.get("uu_tien") ?? "Trung bình"),
    loai = String(fd.get("loai") ?? "Vận hành"),
    lap = String(fd.get("lap_lai") ?? "Không");
  if (!UU_TIEN.includes(uuTien) || !LOAI.includes(loai) || !LAP.includes(lap))
    return { loi: "Có ô chưa hợp lệ." };
  const muc = Math.trunc(
    Number(String(fd.get("muc_tieu_so") ?? "1").replace(/[.,\s]/g, "")),
  );
  if (!Number.isFinite(muc) || muc < 1 || muc > 100000)
    return { loi: "Số lượng cần làm phải từ 1 đến 100.000." };
  const han = String(fd.get("han") ?? "");
  if (han && !/^\d{4}-\d{2}-\d{2}$/.test(han))
    return { loi: "Hạn chưa đúng ngày." };
  const quyen = await duocThaoTac(nguoiLamId);
  if (!quyen) return KHONG_QUYEN;
  const db = dbHr();
  if (id) {
    // đổi người làm sang người khác cũng phải trong quyền
    const { data: cu } = await db
      .from("cong_viec")
      .select("nguoi_lam_id")
      .eq("id", id)
      .maybeSingle();
    if (
      !cu ||
      (cu.nguoi_lam_id !== nguoiLamId && !(await duocThaoTac(cu.nguoi_lam_id)))
    )
      return KHONG_QUYEN;
  }
  const dong = {
    tieu_de: tieuDe,
    mo_ta:
      String(fd.get("mo_ta") ?? "")
        .trim()
        .slice(0, 2000) || null,
    loai,
    nguoi_lam_id: nguoiLamId,
    han: han || null,
    uu_tien: uuTien,
    muc_tieu_so: muc,
    don_vi: String(fd.get("don_vi") ?? "")
      .trim()
      .slice(0, 30),
    lap_lai: lap,
  };
  const { error } = id
    ? await db.from("cong_viec").update(dong).eq("id", id)
    : await db
        .from("cong_viec")
        .insert({ ...dong, nguoi_giao_id: quyen.toiId });
  if (error) return { loi: "Chưa lưu được. Kiểm tra lại các ô rồi thử lại." };
  if (!id) await baoQuanLyThemViec(nguoiLamId, [tieuDe]);
  lamMoi();
  return { ok: true };
}

/** Ghi nhận thêm (hoặc bớt) số lượng đã làm. Việc lặp hằng ngày ghi cho HÔM NAY; việc một lần cộng dồn và tự Hoàn thành khi đủ. */
export async function ghiNhanCongViec(
  id: string,
  them: number,
): Promise<KetQuaCv> {
  if (!UUID.test(id) || !Number.isFinite(them))
    return { loi: "Việc không hợp lệ." };
  const db = dbHr();
  const { data: v } = await db
    .from("cong_viec")
    .select("nguoi_lam_id, lap_lai, muc_tieu_so, da_lam_so, trang_thai")
    .eq("id", id)
    .maybeSingle();
  if (!v) return { loi: "Không tìm thấy việc." };
  if (!(await duocThaoTac(v.nguoi_lam_id))) return KHONG_QUYEN;
  const { phaiBaoCao } = await thaoTacVien();
  if (v.lap_lai === "Hằng ngày") {
    const ngay = homNayHcm();
    const { data: h } = await db
      .from("cong_viec_ngay")
      .select("da_lam")
      .eq("cong_viec_id", id)
      .eq("ngay", ngay)
      .maybeSingle();
    const chan = them > 0 && chanHoanThanhThieuMinhChung({ phaiCoMinhChung: phaiBaoCao, lapLai: true, daLamMoi: apDungGhiNhan(Number(h?.da_lam ?? 0), them), mucTieu: v.muc_tieu_so, coMinhChung: phaiBaoCao ? await coMinhChungChoViec(id, true) : true, dichHoanThanh: false });
    if (chan) return { loi: chan };
    const { error } = await db
      .from("cong_viec_ngay")
      .upsert(
        {
          cong_viec_id: id,
          ngay,
          da_lam: apDungGhiNhan(Number(h?.da_lam ?? 0), them),
          cap_nhat_luc: new Date().toISOString(),
        },
        { onConflict: "cong_viec_id,ngay" },
      );
    if (error) return { loi: "Chưa ghi được." };
  } else {
    const moi = apDungGhiNhan(v.da_lam_so, them),
      tt = trangThaiSauGhiNhan(v.trang_thai, moi, v.muc_tieu_so);
    const chan = them > 0 && chanHoanThanhThieuMinhChung({ phaiCoMinhChung: phaiBaoCao, lapLai: false, daLamMoi: moi, mucTieu: v.muc_tieu_so, coMinhChung: phaiBaoCao ? await coMinhChungChoViec(id, false) : true, dichHoanThanh: false });
    if (chan) return { loi: chan };
    const { error } = await db
      .from("cong_viec")
      .update({
        da_lam_so: moi,
        trang_thai: tt,
        hoan_thanh_luc: tt === "Hoàn thành" ? new Date().toISOString() : null,
      })
      .eq("id", id);
    if (error) return { loi: "Chưa ghi được." };
  }
  lamMoi();
  return { ok: true };
}

export async function doiTrangThaiCongViec(
  id: string,
  trangThai: "Chưa làm" | "Hoàn thành" | "Huỷ",
): Promise<KetQuaCv> {
  if (!UUID.test(id) || !["Chưa làm", "Hoàn thành", "Huỷ"].includes(trangThai))
    return { loi: "Việc không hợp lệ." };
  const db = dbHr();
  const { data: v } = await db
    .from("cong_viec")
    .select("nguoi_lam_id, muc_tieu_so, lap_lai")
    .eq("id", id)
    .maybeSingle();
  if (!v) return { loi: "Không tìm thấy việc." };
  if (!(await duocThaoTac(v.nguoi_lam_id))) return KHONG_QUYEN;
  if (trangThai === "Hoàn thành") {
    const { phaiBaoCao } = await thaoTacVien();
    const lap = v.lap_lai === "Hằng ngày";
    const chan = chanHoanThanhThieuMinhChung({ phaiCoMinhChung: phaiBaoCao, lapLai: lap, daLamMoi: v.muc_tieu_so, mucTieu: v.muc_tieu_so, coMinhChung: phaiBaoCao ? await coMinhChungChoViec(id, lap) : true, dichHoanThanh: true });
    if (chan) return { loi: chan };
  }
  const cap =
    trangThai === "Hoàn thành" && v.lap_lai === "Không"
      ? { da_lam_so: v.muc_tieu_so }
      : {};
  const { error } = await db
    .from("cong_viec")
    .update({
      trang_thai: trangThai,
      hoan_thanh_luc:
        trangThai === "Hoàn thành" ? new Date().toISOString() : null,
      ...cap,
    })
    .eq("id", id);
  if (error) return { loi: "Chưa lưu được." };
  lamMoi();
  return { ok: true };
}

export async function xoaCongViec(id: string): Promise<KetQuaCv> {
  if (!UUID.test(id)) return { loi: "Việc không hợp lệ." };
  const db = dbHr();
  const { data: v } = await db
    .from("cong_viec")
    .select("nguoi_lam_id")
    .eq("id", id)
    .maybeSingle();
  if (!v) return { ok: true };
  if (!(await duocThaoTac(v.nguoi_lam_id))) return KHONG_QUYEN;
  const { error } = await db.from("cong_viec").delete().eq("id", id);
  if (error) return { loi: "Chưa xoá được." };
  lamMoi();
  return { ok: true };
}

/** Hồ sơ nhân viên của người đang đăng nhập (null nếu chưa gắn hồ sơ). */
async function nhanVienCuaToi() {
  const nd = await layNguoiDungHienTai();
  if (!nd || nd.vaiTro === "cho_duyet") return null;
  const { data } = await dbHr().from("nhan_vien").select("id").eq("user_id", nd.id).neq("trang_thai", "Đã nghỉ").maybeSingle();
  return data ? { id: data.id as string, userId: nd.id } : null;
}

/** Gắn link minh chứng (và ghi chú ngắn) cho một việc HÔM NAY. Giữ nguyên số đã làm; chỉ nhận http/https. Để trống link là xoá. */
export async function luuMinhChungCongViec(id: string, link: string, ghiChu: string): Promise<KetQuaCv> {
  if (!UUID.test(id)) return { loi: "Việc không hợp lệ." };
  const l = chuanHoaLink(link);
  if (l === null) return { loi: "Link chưa đúng. Dán đường dẫn bắt đầu bằng http hoặc https." };
  const note = String(ghiChu ?? "").trim().slice(0, 1000);
  const db = dbHr();
  const { data: v } = await db.from("cong_viec").select("nguoi_lam_id").eq("id", id).maybeSingle();
  if (!v) return { loi: "Không tìm thấy việc." };
  if (!(await duocThaoTac(v.nguoi_lam_id))) return KHONG_QUYEN;
  const ngay = homNayHcm();
  const { data: h } = await db.from("cong_viec_ngay").select("da_lam").eq("cong_viec_id", id).eq("ngay", ngay).maybeSingle();
  const { error } = await db.from("cong_viec_ngay").upsert(
    { cong_viec_id: id, ngay, da_lam: Number(h?.da_lam ?? 0), link_bao_cao: l || null, ghi_chu: note || null, cap_nhat_luc: new Date().toISOString() },
    { onConflict: "cong_viec_id,ngay" },
  );
  if (error) return { loi: "Chưa lưu được link minh chứng." };
  lamMoi();
  return { ok: true };
}

/** Nộp (hoặc cập nhật) báo cáo cuối ngày của CHÍNH MÌNH cho hôm nay: tóm tắt kết quả + link minh chứng chung. */
export async function nopBaoCaoNgay(fd: FormData): Promise<KetQuaCv> {
  const toi = await nhanVienCuaToi();
  if (!toi) return { loi: "Tài khoản chưa gắn hồ sơ nhân viên nên chưa nộp báo cáo được." };
  const tomTat = String(fd.get("tom_tat") ?? "").trim().slice(0, 2000);
  if (!tomTat) return { loi: "Ghi vài dòng kết quả công việc hôm nay. Chưa làm được gì thì ghi rõ lý do." };
  const l = chuanHoaLink(fd.get("link"));
  if (l === null) return { loi: "Link chưa đúng. Dán đường dẫn bắt đầu bằng http hoặc https." };
  const { error } = await dbHr().from("cong_viec_bao_cao").upsert(
    { nhan_vien_id: toi.id, ngay: homNayHcm(), tom_tat: tomTat, link: l || null, nop_luc: new Date().toISOString() },
    { onConflict: "nhan_vien_id,ngay" },
  );
  if (error) return { loi: "Chưa nộp được báo cáo. Thử lại sau." };
  lamMoi();
  revalidatePath("/cong-viec/tong-quan");
  revalidatePath("/dashboard");
  return { ok: true };
}

/** Thêm các việc hằng ngày của một mẫu cho CHÍNH MÌNH (số lượng cần làm = 1). Việc đã có cùng tên thì bỏ qua. */
export async function themViecTuMau(ma: string): Promise<KetQuaCv & { them?: number }> {
  const toi = await nhanVienCuaToi();
  if (!toi) return { loi: "Tài khoản chưa gắn hồ sơ nhân viên." };
  const mau = MAU_CONG_VIEC.find((m) => m.ma === ma);
  if (!mau) return { loi: "Không tìm thấy mẫu." };
  const db = dbHr();
  const { data: co } = await db.from("cong_viec").select("tieu_de").eq("nguoi_lam_id", toi.id).eq("lap_lai", "Hằng ngày").limit(500);
  const daCo = new Set((co ?? []).map((x) => String(x.tieu_de).trim().toLowerCase()));
  const moi = mau.viec.filter((t) => !daCo.has(t.toLowerCase())).map((t) => ({
    tieu_de: t, loai: "Hằng ngày", nguoi_lam_id: toi.id, nguoi_giao_id: toi.id, uu_tien: "Trung bình", muc_tieu_so: 1, don_vi: "", lap_lai: "Hằng ngày", han: null,
  }));
  if (moi.length > 0) {
    const { error } = await db.from("cong_viec").insert(moi);
    if (error) return { loi: "Chưa thêm được việc từ mẫu." };
  }
  if (moi.length) await baoQuanLyThemViec(toi.id, moi.map((m) => m.tieu_de));
  lamMoi();
  return { ok: true, them: moi.length };
}
