"use server";

import { revalidatePath } from "next/cache";
import { layNguoiDungHienTai } from "@/lib/auth";
import { dbHr } from "@/lib/hr-db";
import { quyenMucTieuCaNhan } from "@/lib/bsc-quyen";

export type KetQuaBsc = { loi?: string; ok?: boolean; daLuu?: number };
const UUID = /^[0-9a-f-]{36}$/i;
const QUAN_TRI = async () => {
  const nd = await layNguoiDungHienTai();
  return nd && (nd.vaiTro === "admin" || nd.vaiTro === "ky_thuat") ? nd : null;
};
const hopLe = (nam: number, thang: number) =>
  Number.isInteger(nam) &&
  nam >= 2020 &&
  nam <= 2100 &&
  Number.isInteger(thang) &&
  thang >= 1 &&
  thang <= 12;
const dangKhoa = async (nam: number, thang: number) =>
  !!(
    await dbHr()
      .from("bsc_khoa_thang")
      .select("id")
      .eq("nam", nam)
      .eq("thang", thang)
      .maybeSingle()
  ).data;
const doc = (
  raw: FormDataEntryValue,
): { v: number | null } | { loi: string } => {
  const s = String(raw).trim().replace(/\s/g, "").replace(",", ".");
  if (s === "") return { v: null };
  const n = Number(s);
  return Number.isFinite(n) && Math.abs(n) <= 1e12
    ? { v: n }
    : { loi: `“${String(raw).slice(0, 20)}” chưa phải số.` };
};

/** Quản trị/Kỹ thuật nhập kế hoạch + thực tế cả công ty cho một tháng (ô tên `kh|<chỉ số>` và `tt|<chỉ số>`; trống = xoá). Tháng đã khoá thì không sửa. */
export async function luuSoLieuBsc(fd: FormData): Promise<KetQuaBsc> {
  if (!(await QUAN_TRI()))
    return { loi: "Chỉ Quản trị hoặc Kỹ thuật nhập số liệu BSC." };
  const nam = Number(fd.get("nam")),
    thang = Number(fd.get("thang"));
  if (!hopLe(nam, thang)) return { loi: "Kỳ không hợp lệ." };
  if (await dangKhoa(nam, thang))
    return { loi: `Tháng ${thang}/${nam} đã khoá, không sửa được.` };
  const db = dbHr();
  const { data: cs } = await db
    .from("bsc_chi_so")
    .select("id")
    .eq("nam", nam)
    .limit(5000);
  const hopLeCs = new Set((cs ?? []).map((c) => c.id as string));
  const theoCs = new Map<string, { kh?: number | null; tt?: number | null }>();
  for (const [k, raw] of fd.entries()) {
    const m = /^(kh|tt)\|([0-9a-f-]{36})$/i.exec(k);
    if (!m) continue;
    if (!hopLeCs.has(m[2]))
      return { loi: "Có chỉ số không thuộc năm này. Tải lại trang." };
    const r = doc(raw);
    if ("loi" in r) return { loi: r.loi };
    theoCs.set(m[2], { ...(theoCs.get(m[2]) ?? {}), [m[1]]: r.v });
  }
  let dem = 0;
  for (const [id, x] of theoCs) {
    if ((x.kh ?? null) === null && (x.tt ?? null) === null) {
      await db
        .from("bsc_chi_so_thang")
        .delete()
        .eq("chi_so_id", id)
        .eq("thang", thang);
      continue;
    }
    const { error } = await db
      .from("bsc_chi_so_thang")
      .upsert(
        { chi_so_id: id, thang, ke_hoach: x.kh ?? null, thuc_te: x.tt ?? null },
        { onConflict: "chi_so_id,thang" },
      );
    if (error) return { loi: "Chưa lưu được. Thử lại sau." };
    dem++;
  }
  revalidatePath("/bsc");
  revalidatePath("/bsc/so-lieu");
  return { ok: true, daLuu: dem };
}

export async function khoaThangBsc(
  nam: number,
  thang: number,
  khoa: boolean,
): Promise<KetQuaBsc> {
  const nd = await QUAN_TRI();
  if (!nd) return { loi: "Chỉ Quản trị hoặc Kỹ thuật khoá/mở tháng." };
  if (!hopLe(nam, thang)) return { loi: "Kỳ không hợp lệ." };
  const db = dbHr();
  const { error } = khoa
    ? await db
        .from("bsc_khoa_thang")
        .upsert({ nam, thang, khoa_boi: nd.id }, { onConflict: "nam,thang" })
    : await db
        .from("bsc_khoa_thang")
        .delete()
        .eq("nam", nam)
        .eq("thang", thang);
  if (error) return { loi: "Chưa lưu được." };
  revalidatePath("/bsc");
  revalidatePath("/bsc/so-lieu");
  return { ok: true };
}

/** Nhập số liệu mục tiêu cá nhân một tháng. Người được giao nhập THỰC TẾ của mình; kế hoạch chỉ quản lý nhập. Chỉ ghi cho chỉ số đã giao đúng người. */
export async function luuMucTieuCaNhan(fd: FormData): Promise<KetQuaBsc> {
  const nvId = String(fd.get("nv") ?? ""),
    nam = Number(fd.get("nam")),
    thang = Number(fd.get("thang"));
  if (!hopLe(nam, thang)) return { loi: "Kỳ không hợp lệ." };
  const q = await quyenMucTieuCaNhan(nvId);
  if (!q) return { loi: "Bạn không có quyền với mục tiêu này." };
  if (await dangKhoa(nam, thang))
    return { loi: `Tháng ${thang}/${nam} đã khoá, không sửa được.` };
  const db = dbHr();
  const { data: gan } = await db
    .from("bsc_chi_so_nguoi")
    .select("chi_so_id, bsc_chi_so!inner(nam)")
    .eq("nhan_vien_id", nvId)
    .eq("bsc_chi_so.nam", nam)
    .limit(2000);
  const duoc = new Set((gan ?? []).map((g) => g.chi_so_id as string));
  const ghi: {
    chi_so_id: string;
    loai: "Kế hoạch" | "Thực tế";
    v: number | null;
  }[] = [];
  for (const [k, raw] of fd.entries()) {
    const m = /^(kh|tt)\|([0-9a-f-]{36})$/i.exec(k);
    if (!m) continue;
    if (!duoc.has(m[2]))
      return { loi: "Có chỉ số chưa được giao cho người này." };
    if (m[1] === "kh" && !q.quanLy) continue; // người được giao không tự sửa kế hoạch của mình
    const r = doc(raw);
    if ("loi" in r) return { loi: r.loi };
    ghi.push({
      chi_so_id: m[2],
      loai: m[1] === "kh" ? "Kế hoạch" : "Thực tế",
      v: r.v,
    });
  }
  for (const g of ghi) {
    const { error } =
      g.v === null
        ? await db
            .from("bsc_nguoi_thang")
            .delete()
            .eq("chi_so_id", g.chi_so_id)
            .eq("nhan_vien_id", nvId)
            .eq("thang", thang)
            .eq("loai", g.loai)
        : await db
            .from("bsc_nguoi_thang")
            .upsert(
              {
                chi_so_id: g.chi_so_id,
                nhan_vien_id: nvId,
                thang,
                loai: g.loai,
                gia_tri: g.v,
              },
              { onConflict: "chi_so_id,nhan_vien_id,thang,loai" },
            );
    if (error) return { loi: "Chưa lưu được. Thử lại sau." };
  }
  revalidatePath("/bsc/cua-toi");
  return { ok: true, daLuu: ghi.length };
}

/** Người thực hiện (hoặc quản lý của họ) cập nhật tiến độ việc: 0-100. Đủ 100 thì ghi giờ hoàn thành. */
export async function capNhatTienDoViec(
  id: string,
  tienDo: number,
): Promise<KetQuaBsc> {
  if (!UUID.test(id) || !Number.isInteger(tienDo) || tienDo < 0 || tienDo > 100)
    return { loi: "Tiến độ không hợp lệ." };
  const db = dbHr();
  const { data: v } = await db
    .from("bsc_ke_hoach_hanh_dong")
    .select("nguoi_thuc_hien_id")
    .eq("id", id)
    .maybeSingle();
  if (!v) return { loi: "Không tìm thấy việc." };
  if (!(await quyenMucTieuCaNhan(v.nguoi_thuc_hien_id)))
    return { loi: "Bạn không có quyền với việc này." };
  const { error } = await db
    .from("bsc_ke_hoach_hanh_dong")
    .update({
      tien_do: tienDo,
      hoan_thanh_luc: tienDo === 100 ? new Date().toISOString() : null,
    })
    .eq("id", id);
  if (error) return { loi: "Chưa lưu được." };
  revalidatePath("/bsc/cua-toi");
  return { ok: true };
}
