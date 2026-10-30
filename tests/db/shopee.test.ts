import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { chayVoiKhach, chayVoiTu, taoDbVoiMigration } from "./khung";

const u = (n: number) => `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
const loiMa = async (p: Promise<unknown>) => { try { await p; return null; } catch (e) { return (e as { code?: string }).code ?? "?"; } };

describe("Migration 0031: Shopee", () => {
  let db: PGlite;
  beforeAll(async () => { db = await taoDbVoiMigration(); await db.exec(`insert into auth.users (id) values ('${u(1)}'); insert into public.qc_shopee_gian_hang (id, ten) values ('9', 'Omyn Mall')`); });

  it("trình duyệt và khách không đọc/ghi được", async () => {
    for (const b of ["qc_shopee_gian_hang", "qc_shopee_don_hang", "qc_shopee_so_lieu_ngay"]) {
      expect(await loiMa(chayVoiTu(db, { sub: u(1) }, `select * from public.${b}`)), b).toBe("42501");
      expect(await loiMa(chayVoiKhach(db, `select * from public.${b}`)), b).toBe("42501");
    }
  });
  it("kéo đơn và quảng cáo vào cùng một dòng ngày mà không đè nhau; kéo lại không trùng đơn", async () => {
    await db.query(`insert into public.qc_shopee_so_lieu_ngay (gian_hang_id, ngay, so_don, doanh_thu) values ('9', '2026-10-29', 3, 900) on conflict (gian_hang_id, ngay) do update set so_don = excluded.so_don, doanh_thu = excluded.doanh_thu`);
    await db.query(`insert into public.qc_shopee_so_lieu_ngay (gian_hang_id, ngay, chi_phi_qc) values ('9', '2026-10-29', 50) on conflict (gian_hang_id, ngay) do update set chi_phi_qc = excluded.chi_phi_qc`);
    const r = (await db.query<{ so_don: number; doanh_thu: string; chi_phi_qc: string }>(`select so_don, doanh_thu, chi_phi_qc from public.qc_shopee_so_lieu_ngay`)).rows;
    expect(r).toHaveLength(1);
    expect([r[0].so_don, Number(r[0].doanh_thu), Number(r[0].chi_phi_qc)]).toEqual([3, 900, 50]);
    await db.query(`insert into public.qc_shopee_don_hang (ma_don, gian_hang_id, tao_don_luc, ngay) values ('A1', '9', now(), '2026-10-29')`);
    expect(await loiMa(db.query(`insert into public.qc_shopee_don_hang (ma_don, gian_hang_id, tao_don_luc, ngay) values ('A1', '9', now(), '2026-10-29')`))).toBe("23505");
  });
  it("nhật ký nhận Shopee; cột đơn/doanh thu mới của Facebook/TikTok có mặc định 0", async () => {
    await db.query(`insert into public.qc_nhat_ky_dong_bo (nen_tang, trang_thai) values ('Shopee', 'Bỏ qua')`);
    expect(await loiMa(db.query(`insert into public.qc_nhat_ky_dong_bo (nen_tang) values ('Lazada')`))).toBe("23514");
    await db.exec(`insert into public.qc_meta_tai_khoan (id, ten) values ('1','T'); insert into public.qc_meta_chien_dich (id, tai_khoan_id, ten) values ('c','1','C'); insert into public.qc_meta_nhom (id, chien_dich_id, ten) values ('n','c','N'); insert into public.qc_meta_quang_cao (id, nhom_id, chien_dich_id, ten) values ('a','n','c','Q'); insert into public.qc_meta_so_lieu (quang_cao_id, ngay) values ('a', '2026-10-29')`);
    expect((await db.query<{ don_mua: number; doanh_thu: string }>(`select don_mua, doanh_thu from public.qc_meta_so_lieu`)).rows[0]).toEqual({ don_mua: 0, doanh_thu: "0.00" });
  });
});
