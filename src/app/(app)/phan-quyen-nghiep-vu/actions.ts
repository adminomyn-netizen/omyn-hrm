"use server";

import { revalidatePath } from "next/cache";
import { coVaiTro, layNguoiDungHienTai } from "@/lib/auth";
import { dbHr } from "@/lib/hr-db";
import { ghiLichSuNhanSu } from "@/lib/nhan-su-lich-su";
import { MANG, type Quyen } from "@/lib/quyen-mang";

export type KetQuaQuyen = { loi?: string; ok?: boolean; doi?: number };
const NHAN: Record<string, string> = { "": "Không", xem: "Xem", nhap: "Nhập" };

/** Lưu bảng phân quyền: mỗi ô `q:<mảng>:<mã khối>` = "" (không), "xem" hoặc "nhap". Chỉ ghi những ô đổi, mỗi ô đổi để lại một dòng lịch sử. */
export async function luuQuyenNghiepVu(fd: FormData): Promise<KetQuaQuyen> {
  if (!(await coVaiTro(["admin", "ky_thuat"]))) return { loi: "Bạn không có quyền thực hiện thao tác này." };
  const nd = await layNguoiDungHienTai();
  if (!nd) return { loi: "Bạn không có quyền thực hiện thao tác này." };
  const db = dbHr();
  const [{ data: khoi }, { data: cu }] = await Promise.all([
    db.from("khoi").select("id, ten"),
    db.from("quyen_man_nghiep_vu").select("mang, khoi_id, quyen"),
  ]);
  const tenKhoi = new Map((khoi ?? []).map((k) => [k.id as string, k.ten as string]));
  const hienTai = new Map(((cu ?? []) as { mang: string; khoi_id: string; quyen: Quyen }[]).map((r) => [`${r.mang}:${r.khoi_id}`, r.quyen]));
  let doi = 0;
  for (const m of MANG) {
    for (const [khoiId, ten] of tenKhoi) {
      const tho = String(fd.get(`q:${m.ma}:${khoiId}`) ?? "khong");
      const moi = tho === "khong" ? "" : tho;
      if (moi !== "" && moi !== "xem" && moi !== "nhap") return { loi: "Lựa chọn không hợp lệ." };
      const truoc = hienTai.get(`${m.ma}:${khoiId}`) ?? "";
      if (moi === truoc) continue;
      const loi =
        moi === ""
          ? (await db.from("quyen_man_nghiep_vu").delete().eq("mang", m.ma).eq("khoi_id", khoiId)).error
          : (await db.from("quyen_man_nghiep_vu").upsert({ mang: m.ma, khoi_id: khoiId, quyen: moi, cap_nhat_luc: new Date().toISOString() }, { onConflict: "mang,khoi_id" })).error;
      if (loi) return { loi: "Chưa lưu được. Thử lại sau." };
      doi++;
      await ghiLichSuNhanSu({
        nhanVienId: null,
        doiTuong: "Phân quyền màn nghiệp vụ",
        doiTuongId: khoiId,
        hanhDong: "Sửa",
        moTa: `${m.ten} — khối ${ten}: ${NHAN[truoc]} → ${NHAN[moi]}`,
        truoc: { quyen: truoc || null },
        sau: { quyen: moi || null },
        nguoi: { id: nd.id, hoTen: nd.hoTen },
      });
    }
  }
  revalidatePath("/phan-quyen-nghiep-vu");
  return { ok: true, doi };
}
