import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { chayVoiKhach, chayVoiTu, taoDbVoiMigration } from "./khung";

const u = (n: number) => `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
const loiMa = async (p: Promise<unknown>) => { try { await p; return null; } catch (e) { return (e as { code?: string }).code ?? "?"; } };

describe("Migration 0018: KPI & thi đua", () => {
  let db: PGlite;
  const NV = u(201);
  let ct = "";
  beforeAll(async () => {
    db = await taoDbVoiMigration();
    await db.exec(`insert into auth.users (id) values ('${u(1)}'); insert into public.nhan_vien (id, ho_ten, trang_thai, user_id) values ('${NV}', 'Người Thử', 'Đang làm', '${u(1)}');`);
    ct = (await db.query<{ id: string }>(`insert into public.kpi_chi_tieu (ten, muc_tieu_ngay) values ('Cuộc gọi', 20) returning id`)).rows[0].id;
  });

  it("trình duyệt và khách không đọc/ghi được 3 bảng KPI", async () => {
    for (const b of ["kpi_chi_tieu", "kpi_ket_qua", "kpi_thuong"]) {
      expect(await loiMa(chayVoiTu(db, { sub: u(1) }, `select * from public.${b}`)), `${b} authenticated`).toBe("42501");
      expect(await loiMa(chayVoiKhach(db, `select * from public.${b}`)), `${b} anon`).toBe("42501");
    }
  });

  it("chỉ tiêu: mục tiêu > 0, trọng số 1-10, chiều thuộc danh sách", async () => {
    expect(await loiMa(db.query(`insert into public.kpi_chi_tieu (ten, muc_tieu_ngay) values ('X', 0)`))).toBe("23514");
    expect(await loiMa(db.query(`insert into public.kpi_chi_tieu (ten, muc_tieu_ngay, trong_so) values ('X', 1, 11)`))).toBe("23514");
    expect(await loiMa(db.query(`insert into public.kpi_chi_tieu (ten, muc_tieu_ngay, chieu) values ('X', 1, 'Bậy')`))).toBe("23514");
  });

  it("kết quả: mỗi người/chỉ tiêu/ngày một dòng, không âm; xoá chỉ tiêu thì xoá kết quả", async () => {
    await db.query(`insert into public.kpi_ket_qua (nhan_vien_id, chi_tieu_id, ngay, thuc_te) values ($1, $2, '2026-10-30', 18)`, [NV, ct]);
    expect(await loiMa(db.query(`insert into public.kpi_ket_qua (nhan_vien_id, chi_tieu_id, ngay, thuc_te) values ($1, $2, '2026-10-30', 5)`, [NV, ct]))).toBe("23505");
    expect(await loiMa(db.query(`insert into public.kpi_ket_qua (nhan_vien_id, chi_tieu_id, ngay, thuc_te) values ($1, $2, '2026-10-29', -1)`, [NV, ct]))).toBe("23514");
    await db.query(`delete from public.kpi_chi_tieu where id = $1`, [ct]);
    expect((await db.query(`select 1 from public.kpi_ket_qua`)).rows).toHaveLength(0);
  });

  it("thưởng: hạng 1-3, phạm vi và kỳ thuộc danh sách", async () => {
    await db.query(`insert into public.kpi_thuong (ky_loai, pham_vi, hang, so_tien) values ('Quý', 'Phòng', 1, 2000000)`);
    expect(await loiMa(db.query(`insert into public.kpi_thuong (hang) values (4)`))).toBe("23514");
    expect(await loiMa(db.query(`insert into public.kpi_thuong (hang, pham_vi) values (1, 'Lạ')`))).toBe("23514");
    expect(await loiMa(db.query(`insert into public.kpi_thuong (hang, so_tien) values (1, -5)`))).toBe("23514");
  });
});
