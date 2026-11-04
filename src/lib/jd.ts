export type DongJd = { vi_tri: string; muc_dich: string | null; nhiem_vu: string | null; yeu_cau: string | null; ky_nang: string | null; quyen_loi: string | null; muc_luong: string | null };

/** Ghép các ô của một JD thành một đoạn văn bản để điền vào mô tả tin tuyển dụng (bỏ ô trống). */
export function jdThanhVanBan(j: DongJd): string {
  const phan: [string, string | null][] = [["Mục đích vị trí", j.muc_dich], ["Nhiệm vụ chính", j.nhiem_vu], ["Yêu cầu", j.yeu_cau], ["Kỹ năng", j.ky_nang], ["Quyền lợi", j.quyen_loi], ["Khoảng lương", j.muc_luong]];
  return phan.filter(([, v]) => v && v.trim()).map(([t, v]) => `${t}:\n${v!.trim()}`).join("\n\n");
}
