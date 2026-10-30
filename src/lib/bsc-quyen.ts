import "server-only";
import { layNguoiDungHienTai } from "@/lib/auth";
import { dbHr } from "@/lib/hr-db";

const UUID = /^[0-9a-f-]{36}$/i;

/** Ai được xem/nhập mục tiêu của `nvId`: chính họ, trưởng phòng trực tiếp, hoặc Quản trị/Kỹ thuật. Trả thêm: có phải quản lý (được nhập cả kế hoạch). */
export async function quyenMucTieuCaNhan(nvId: string) {
  const nd = await layNguoiDungHienTai();
  if (!nd || nd.vaiTro === "cho_duyet" || !UUID.test(nvId)) return null;
  const db = dbHr();
  const { data: toi } = await db.from("nhan_vien").select("id").eq("user_id", nd.id).maybeSingle();
  if (nd.vaiTro === "admin" || nd.vaiTro === "ky_thuat") return { nd, toiId: (toi?.id as string | undefined) ?? null, quanLy: true };
  if (!toi) return null;
  if (toi.id === nvId) return { nd, toiId: toi.id as string, quanLy: false };
  const { data: cap } = await db.from("nhan_vien").select("id").eq("id", nvId).eq("quan_ly_id", toi.id).maybeSingle();
  return cap ? { nd, toiId: toi.id as string, quanLy: true } : null;
}
