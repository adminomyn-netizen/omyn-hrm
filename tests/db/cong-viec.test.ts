import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { chayVoiKhach, chayVoiTu, taoDbVoiMigration } from "./khung";

const u = (n: number) => `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
const loiMa = async (p: Promise<unknown>) => { try { await p; return null; } catch (e) { return (e as { code?: string }).code ?? "?"; } };

describe("Migration 0032: công việc", () => {
  let db: PGlite;
  const NV = u(401);
  beforeAll(async () => { db = await taoDbVoiMigration(); await db.exec(`insert into auth.users (id) values ('${u(1)}'); insert into public.nhan_vien (id, ho_ten, trang_thai, user_id) values ('${NV}', 'Người Thử', 'Đang làm', '${u(1)}')`); });

  it("trình duyệt và khách không đọc/ghi được", async () => {
    for (const b of ["cong_viec", "cong_viec_ngay"]) {
      expect(await loiMa(chayVoiTu(db, { sub: u(1) }, `select * from public.${b}`)), b).toBe("42501");
      expect(await loiMa(chayVoiKhach(db, `select * from public.${b}`)), b).toBe("42501");
    }
  });
  it("mặc định đúng; tên trống, số lượng 0, ưu tiên/loại/lặp ngoài danh sách bị chặn", async () => {
    const r = (await db.query<{ trang_thai: string; muc_tieu_so: number; da_lam_so: number; uu_tien: string; lap_lai: string }>(`insert into public.cong_viec (tieu_de, nguoi_lam_id) values ('Gọi khách', $1) returning trang_thai, muc_tieu_so, da_lam_so, uu_tien, lap_lai`, [NV])).rows[0];
    expect(r).toEqual({ trang_thai: "Chưa làm", muc_tieu_so: 1, da_lam_so: 0, uu_tien: "Trung bình", lap_lai: "Không" });
    for (const cot of ["tieu_de, nguoi_lam_id) values ('  ', $1", "tieu_de, nguoi_lam_id, muc_tieu_so) values ('a', $1, 0", "tieu_de, nguoi_lam_id, uu_tien) values ('a', $1, 'Gấp'", "tieu_de, nguoi_lam_id, loai) values ('a', $1, 'Khác'", "tieu_de, nguoi_lam_id, lap_lai) values ('a', $1, 'Hằng tuần'", "tieu_de, nguoi_lam_id, da_lam_so) values ('a', $1, -1"])
      expect(await loiMa(db.query(`insert into public.cong_viec (${cot})`, [NV])), cot).toBe("23514");
  });
  it("tiến độ từng ngày duy nhất mỗi việc/ngày; xoá việc xoá luôn tiến độ; xoá nhân sự xoá việc", async () => {
    const id = (await db.query<{ id: string }>(`insert into public.cong_viec (tieu_de, nguoi_lam_id, lap_lai, muc_tieu_so) values ('Đăng bài', $1, 'Hằng ngày', 3) returning id`, [NV])).rows[0].id;
    await db.query(`insert into public.cong_viec_ngay (cong_viec_id, ngay, da_lam) values ($1, '2026-10-30', 1)`, [id]);
    expect(await loiMa(db.query(`insert into public.cong_viec_ngay (cong_viec_id, ngay, da_lam) values ($1, '2026-10-30', 2)`, [id]))).toBe("23505");
    expect(await loiMa(db.query(`insert into public.cong_viec_ngay (cong_viec_id, ngay, da_lam) values ($1, '2026-10-31', -1)`, [id]))).toBe("23514");
    await db.query(`delete from public.cong_viec where id = $1`, [id]);
    expect((await db.query(`select 1 from public.cong_viec_ngay`)).rows).toHaveLength(0);
    await db.query(`delete from public.nhan_vien where id = $1`, [NV]);
    expect((await db.query(`select 1 from public.cong_viec`)).rows).toHaveLength(0);
  });
});
