import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { chayVoiKhach, chayVoiTu, taoDbVoiMigration } from "./khung";

const u = (n: number) => `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
const loiMa = async (p: Promise<unknown>) => { try { await p; return null; } catch (e) { return (e as { code?: string }).code ?? "?"; } };

describe("Migration 0012: quy trình tuyển dụng + hồ sơ nhân viên", () => {
  let db: PGlite;
  const NV = u(101);
  beforeAll(async () => {
    db = await taoDbVoiMigration();
    await db.exec(`insert into auth.users (id) values ('${u(1)}');
      insert into public.nhan_vien (id, ho_ten, trang_thai, user_id) values ('${NV}', 'Người Thử', 'Đang làm', '${u(1)}');`);
  });

  it("trình duyệt (authenticated) và khách (anon) không đọc/ghi được bảng mới", async () => {
    for (const b of ["yeu_cau_tuyen_dung", "dang_tin_kenh", "ho_so_ca_nhan", "than_nhan", "tai_lieu_nhan_vien", "nhat_ky_xem_tai_lieu"]) {
      expect(await loiMa(chayVoiTu(db, { sub: u(1) }, `select * from public.${b}`)), `${b} authenticated`).toBe("42501");
      expect(await loiMa(chayVoiKhach(db, `select * from public.${b}`)), `${b} anon`).toBe("42501");
    }
  });

  it("yêu cầu tuyển dụng: mã tự tăng YC-0001, mặc định Chờ tiếp nhận; trạng thái và số lượng ngoài khoảng bị chặn", async () => {
    const r = await db.query<{ ma: string; trang_thai: string }>(`insert into public.yeu_cau_tuyen_dung (vi_tri, nguoi_yeu_cau_ten) values ('Content', 'Sếp Thử') returning ma, trang_thai`);
    expect(r.rows[0]).toEqual({ ma: "YC-0001", trang_thai: "Chờ tiếp nhận" });
    const r2 = await db.query<{ ma: string }>(`insert into public.yeu_cau_tuyen_dung (vi_tri, nguoi_yeu_cau_ten) values ('Kế toán', 'Sếp Thử') returning ma`);
    expect(r2.rows[0].ma).toBe("YC-0002");
    expect(await loiMa(db.query(`insert into public.yeu_cau_tuyen_dung (vi_tri, nguoi_yeu_cau_ten, trang_thai) values ('X1', 'a', 'Bậy bạ')`))).toBe("23514");
    expect(await loiMa(db.query(`insert into public.yeu_cau_tuyen_dung (vi_tri, nguoi_yeu_cau_ten, so_luong) values ('X2', 'a', 0)`))).toBe("23514");
  });

  it("đăng tin theo kênh: chi phí không âm, kênh phải thuộc danh sách; xoá tin thì xoá theo các dòng kênh", async () => {
    const tin = (await db.query<{ id: string }>(`insert into public.tin_tuyen_dung (vi_tri) values ('Content') returning id`)).rows[0].id;
    await db.query(`insert into public.dang_tin_kenh (tin_tuyen_dung_id, kenh, chi_phi) values ($1, 'TopCV', 1500000)`, [tin]);
    expect(await loiMa(db.query(`insert into public.dang_tin_kenh (tin_tuyen_dung_id, kenh, chi_phi) values ($1, 'TopCV', -1)`, [tin]))).toBe("23514");
    expect(await loiMa(db.query(`insert into public.dang_tin_kenh (tin_tuyen_dung_id, kenh) values ($1, 'Kênh lạ')`, [tin]))).toBe("23514");
    await db.query(`delete from public.tin_tuyen_dung where id = $1`, [tin]);
    expect((await db.query(`select 1 from public.dang_tin_kenh`)).rows).toHaveLength(0);
  });

  it("giấy tờ: chỉ PDF/JPG/PNG, ≤ 10 MB; kho tệp riêng tư", async () => {
    const them = (mime: string, kt: number, dd: string) => db.query(`insert into public.tai_lieu_nhan_vien (nhan_vien_id, loai, ten_tep, duong_dan, mime, kich_thuoc) values ($1, 'Bằng cấp', 'a', $2, $3, $4)`, [NV, dd, mime, kt]);
    await them("application/pdf", 1000, "p1");
    expect(await loiMa(them("application/zip", 1000, "p2"))).toBe("23514");
    expect(await loiMa(them("image/png", 10485761, "p3"))).toBe("23514");
    const b = (await db.query<{ public: boolean; file_size_limit: string }>(`select public, file_size_limit from storage.buckets where id = 'ho-so-nhan-vien'`)).rows[0];
    expect(b.public).toBe(false);
    expect(Number(b.file_size_limit)).toBe(10485760);
  });

  it("nhật ký thao tác chỉ ghi mã bản ghi, không chép CCCD/số tài khoản", async () => {
    await db.query(`insert into public.ho_so_ca_nhan (nhan_vien_id, cccd, so_tai_khoan) values ($1, '001234567890', '9704123456')`, [NV]);
    await db.query(`update public.ho_so_ca_nhan set cccd = '001234567891' where nhan_vien_id = $1`, [NV]);
    const nk = (await db.query<{ ban_ghi: string; truoc: unknown; sau: unknown }>(`select ban_ghi, truoc, sau from public.nhat_ky where bang = 'ho_so_ca_nhan'`)).rows;
    expect(nk.length).toBe(2);
    for (const d of nk) { expect(d.ban_ghi).toBe(NV); expect(d.truoc).toBeNull(); expect(d.sau).toBeNull(); }
  });
});
