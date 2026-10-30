import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { chayVoiKhach, chayVoiTu, taoDbVoiMigration } from "./khung";

const u = (n: number) => `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
const loiMa = async (p: Promise<unknown>) => { try { await p; return null; } catch (e) { return (e as { code?: string }).code ?? "?"; } };

describe("Migration 0019: hợp đồng lao động + BSC", () => {
  let db: PGlite;
  const NV = u(301);
  let cs = "";
  beforeAll(async () => {
    db = await taoDbVoiMigration();
    await db.exec(`insert into auth.users (id) values ('${u(1)}'); insert into public.nhan_vien (id, ho_ten, trang_thai, user_id) values ('${NV}', 'Người Thử', 'Đang làm', '${u(1)}');`);
  });

  it("trình duyệt và khách không đọc/ghi được các bảng mới", async () => {
    for (const b of ["hop_dong_lao_dong", "danh_gia_tai_ky", "bsc_goc_nhin", "bsc_muc_tieu", "bsc_chi_so", "bsc_chi_so_thang", "bsc_nguoi_thang", "bsc_ke_hoach_hanh_dong", "bsc_khoa_thang"]) {
      expect(await loiMa(chayVoiTu(db, { sub: u(1) }, `select * from public.${b}`)), `${b} authenticated`).toBe("42501");
      expect(await loiMa(chayVoiKhach(db, `select * from public.${b}`)), `${b} anon`).toBe("42501");
    }
  });

  it("hợp đồng: đến ngày không trước từ ngày, phải có người ký, loại/trạng thái trong danh sách", async () => {
    await db.query(`insert into public.hop_dong_lao_dong (nhan_vien_id, tu_ngay, den_ngay) values ($1, '2026-01-01', '2026-12-31')`, [NV]);
    await db.query(`insert into public.hop_dong_lao_dong (ten_nguoi_ky, loai, tu_ngay) values ('CTV A', 'Cộng tác viên', '2026-01-01')`);
    expect(await loiMa(db.query(`insert into public.hop_dong_lao_dong (nhan_vien_id, tu_ngay, den_ngay) values ($1, '2026-05-01', '2026-04-01')`, [NV]))).toBe("23514");
    expect(await loiMa(db.query(`insert into public.hop_dong_lao_dong (tu_ngay) values ('2026-01-01')`))).toBe("23514");
    expect(await loiMa(db.query(`insert into public.hop_dong_lao_dong (nhan_vien_id, tu_ngay, loai) values ($1, '2026-01-01', 'Bậy')`, [NV]))).toBe("23514");
  });

  it("đánh giá tái ký: điểm 1-5, để trống được", async () => {
    await db.query(`insert into public.danh_gia_tai_ky (nhan_vien_id, thai_do) values ($1, 4)`, [NV]);
    expect(await loiMa(db.query(`insert into public.danh_gia_tai_ky (nhan_vien_id, thai_do) values ($1, 6)`, [NV]))).toBe("23514");
    expect(await loiMa(db.query(`insert into public.danh_gia_tai_ky (nhan_vien_id, nang_luc) values ($1, 0)`, [NV]))).toBe("23514");
  });

  it("BSC: có sẵn 4 góc nhìn; chỉ số theo tháng duy nhất; số liệu cá nhân tách Kế hoạch/Thực tế; xoá mục tiêu kéo theo chỉ số", async () => {
    const goc = (await db.query<{ id: string; ten: string }>(`select id, ten from public.bsc_goc_nhin order by sap_xep`)).rows;
    expect(goc.map((g) => g.ten)).toEqual(["Tài chính", "Khách hàng", "Quy trình nội bộ", "Học hỏi và phát triển"]);
    const mt = (await db.query<{ id: string }>(`insert into public.bsc_muc_tieu (goc_nhin_id, ten) values ($1, 'Tăng doanh thu') returning id`, [goc[0].id])).rows[0].id;
    cs = (await db.query<{ id: string }>(`insert into public.bsc_chi_so (nam, muc_tieu_id, ten, trong_so) values (2026, $1, 'Doanh thu', 40) returning id`, [mt])).rows[0].id;
    await db.query(`insert into public.bsc_chi_so_thang (chi_so_id, thang, ke_hoach) values ($1, 10, 100)`, [cs]);
    expect(await loiMa(db.query(`insert into public.bsc_chi_so_thang (chi_so_id, thang, ke_hoach) values ($1, 10, 5)`, [cs]))).toBe("23505");
    expect(await loiMa(db.query(`insert into public.bsc_chi_so_thang (chi_so_id, thang) values ($1, 13)`, [cs]))).toBe("23514");
    await db.query(`insert into public.bsc_nguoi_thang (chi_so_id, nhan_vien_id, thang, loai, gia_tri) values ($1, $2, 10, 'Kế hoạch', 50)`, [cs, NV]);
    await db.query(`insert into public.bsc_nguoi_thang (chi_so_id, nhan_vien_id, thang, loai, gia_tri) values ($1, $2, 10, 'Thực tế', 45)`, [cs, NV]);
    expect(await loiMa(db.query(`insert into public.bsc_nguoi_thang (chi_so_id, nhan_vien_id, thang, loai, gia_tri) values ($1, $2, 10, 'Thực tế', 1)`, [cs, NV]))).toBe("23505");
    expect(await loiMa(db.query(`insert into public.bsc_chi_so (nam, muc_tieu_id, ten, cach_gop) values (2026, $1, 'X', 'Bậy')`, [mt]))).toBe("23514");
    await db.query(`delete from public.bsc_muc_tieu where id = $1`, [mt]);
    expect((await db.query(`select 1 from public.bsc_chi_so_thang`)).rows).toHaveLength(0);
  });

  it("kế hoạch hành động: tiến độ 0-100, ưu tiên P0-P3, kết thúc không trước bắt đầu", async () => {
    const goc = (await db.query<{ id: string }>(`select id from public.bsc_goc_nhin limit 1`)).rows[0].id;
    const mt = (await db.query<{ id: string }>(`insert into public.bsc_muc_tieu (goc_nhin_id, ten) values ($1, 'M') returning id`, [goc])).rows[0].id;
    const c = (await db.query<{ id: string }>(`insert into public.bsc_chi_so (nam, muc_tieu_id, ten) values (2026, $1, 'C') returning id`, [mt])).rows[0].id;
    const them = (tienDo: number, up: string, kt: string) => db.query(`insert into public.bsc_ke_hoach_hanh_dong (chi_so_id, ten, nguoi_thuc_hien_id, uu_tien, bat_dau, ket_thuc, tien_do) values ($1, 'Việc', $2, $3, '2026-10-01', $4, $5)`, [c, NV, up, kt, tienDo]);
    await them(50, "P1", "2026-10-31");
    expect(await loiMa(them(101, "P1", "2026-10-31"))).toBe("23514");
    expect(await loiMa(them(50, "P9", "2026-10-31"))).toBe("23514");
    expect(await loiMa(them(50, "P1", "2026-09-30"))).toBe("23514");
  });
});
