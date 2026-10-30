import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { chayVoiKhach, chayVoiTu, taoDbVoiMigration } from "./khung";

const u = (n: number) => `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
const loiMa = async (p: Promise<unknown>) => { try { await p; return null; } catch (e) { return (e as { code?: string }).code ?? "?"; } };

describe("Migration 0030: quảng cáo Facebook + TikTok", () => {
  let db: PGlite;
  beforeAll(async () => { db = await taoDbVoiMigration(); await db.exec(`insert into auth.users (id) values ('${u(1)}')`); });

  it("trình duyệt và khách không đọc/ghi được", async () => {
    for (const b of ["qc_meta_tai_khoan", "qc_meta_so_lieu", "qc_tiktok_quang_cao", "qc_nhat_ky_dong_bo"]) {
      expect(await loiMa(chayVoiTu(db, { sub: u(1) }, `select * from public.${b}`)), b).toBe("42501");
      expect(await loiMa(chayVoiKhach(db, `select * from public.${b}`)), b).toBe("42501");
    }
  });
  it("kéo lại cùng số liệu không trùng (khoá quảng cáo + ngày) và xoá chiến dịch kéo theo cả cây", async () => {
    await db.exec(`insert into public.qc_meta_tai_khoan (id, ten) values ('1', 'T');
      insert into public.qc_meta_chien_dich (id, tai_khoan_id, ten) values ('c1', '1', 'CD');
      insert into public.qc_meta_nhom (id, chien_dich_id, ten) values ('n1', 'c1', 'N');
      insert into public.qc_meta_quang_cao (id, nhom_id, chien_dich_id, ten) values ('a1', 'n1', 'c1', 'QC');
      insert into public.qc_meta_so_lieu (quang_cao_id, ngay, chi_tieu) values ('a1', '2026-10-29', 100)`);
    expect(await loiMa(db.query(`insert into public.qc_meta_so_lieu (quang_cao_id, ngay, chi_tieu) values ('a1', '2026-10-29', 5)`))).toBe("23505");
    await db.query(`insert into public.qc_meta_so_lieu (quang_cao_id, ngay, chi_tieu) values ('a1', '2026-10-29', 120) on conflict (quang_cao_id, ngay) do update set chi_tieu = excluded.chi_tieu`);
    expect(Number((await db.query<{ chi_tieu: string }>(`select chi_tieu from public.qc_meta_so_lieu`)).rows[0].chi_tieu)).toBe(120);
    await db.query(`delete from public.qc_meta_chien_dich where id = 'c1'`);
    expect((await db.query(`select 1 from public.qc_meta_so_lieu`)).rows).toHaveLength(0);
  });
  it("nhật ký đồng bộ: nền tảng và trạng thái thuộc danh sách", async () => {
    await db.query(`insert into public.qc_nhat_ky_dong_bo (nen_tang, trang_thai) values ('TikTok', 'Bỏ qua')`);
    expect(await loiMa(db.query(`insert into public.qc_nhat_ky_dong_bo (nen_tang) values ('Zalo')`))).toBe("23514");
    expect(await loiMa(db.query(`insert into public.qc_nhat_ky_dong_bo (nen_tang, trang_thai) values ('Facebook', 'Bậy')`))).toBe("23514");
  });
});
