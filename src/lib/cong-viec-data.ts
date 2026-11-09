import "server-only";
import { cache } from "react";
import { layNguoiDungDaDuyet } from "@/lib/auth";
import { dbHr } from "@/lib/hr-db";
import type { Viec } from "@/lib/cong-viec";
import { homNayHcm } from "@/lib/kpi-data";

export type NguoiCv = { id: string; ten: string; quanLyId: string | null; userId: string | null };

/** Ai làm gì với công việc của ai: nhân viên chỉ thấy/sửa việc của mình; trưởng phòng (người được trỏ quan_ly_id) thêm cấp dưới trực tiếp; Quản trị/Kỹ thuật tất cả. */
export const taiCongViec = cache(async () => {
  const nd = await layNguoiDungDaDuyet();
  const db = dbHr();
  const { data: nvs } = await db.from("nhan_vien").select("id, ho_ten, quan_ly_id, user_id").neq("trang_thai", "Đã nghỉ").order("ho_ten").limit(2000);
  const nguoi: NguoiCv[] = (nvs ?? []).map((x) => ({ id: x.id, ten: x.ho_ten, quanLyId: x.quan_ly_id, userId: x.user_id }));
  const toi = nguoi.find((x) => x.userId === nd.id) ?? null;
  const quanTri = nd.vaiTro === "admin" || nd.vaiTro === "ky_thuat";
  const trongTam = quanTri ? nguoi : nguoi.filter((x) => x.id === toi?.id || (!!toi && x.quanLyId === toi.id));
  const homNay = homNayHcm();
  const ids = trongTam.map((x) => x.id);
  const { data: rows } = ids.length ? await db.from("cong_viec").select("id, tieu_de, mo_ta, loai, nguoi_lam_id, nguoi_giao_id, han, uu_tien, muc_tieu_so, da_lam_so, don_vi, lap_lai, trang_thai").in("nguoi_lam_id", ids).limit(3000) : { data: [] };
  const viecIds = (rows ?? []).map((r) => r.id);
  const { data: ngay } = viecIds.length ? await db.from("cong_viec_ngay").select("cong_viec_id, da_lam, link_bao_cao, ghi_chu").eq("ngay", homNay).in("cong_viec_id", viecIds) : { data: [] };
  const homNayDaLam = new Map((ngay ?? []).map((x) => [x.cong_viec_id as string, Number(x.da_lam)]));
  const homNayMinhChung = new Map((ngay ?? []).map((x) => [x.cong_viec_id as string, { link: (x.link_bao_cao as string | null) ?? null, ghiChu: (x.ghi_chu as string | null) ?? null }]));
  const { data: coLink } = viecIds.length ? await db.from("cong_viec_ngay").select("cong_viec_id").or("link_bao_cao.not.is.null,ghi_chu.not.is.null").in("cong_viec_id", viecIds) : { data: [] };
  const daTungCoLink = new Set((coLink ?? []).map((x) => x.cong_viec_id as string));
  const viec = (rows ?? []).map((r) => ({
    v: { id: r.id, tieuDe: r.tieu_de, loai: r.loai, nguoiLamId: r.nguoi_lam_id, han: r.han, uuTien: r.uu_tien, mucTieu: r.muc_tieu_so, daLam: r.da_lam_so, donVi: r.don_vi ?? "", lapLai: r.lap_lai, trangThai: r.trang_thai } as Viec,
    moTa: (r.mo_ta as string | null) ?? "", nguoiGiaoId: (r.nguoi_giao_id as string | null) ?? null, daLamHomNay: homNayDaLam.get(r.id) ?? 0, link: homNayMinhChung.get(r.id)?.link ?? null, coMinhChung: r.lap_lai === "Hằng ngày" ? !!(homNayMinhChung.get(r.id)?.link || homNayMinhChung.get(r.id)?.ghiChu) : daTungCoLink.has(r.id), ghiChuNgay: homNayMinhChung.get(r.id)?.ghiChu ?? null,
  }));
  return { nguoi, toi, quanTri, trongTam, viec, homNay };
});
