import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { chayVoiKhach, chayVoiTu, taoDbVoiMigration } from "./khung";

const u = (n: number) => `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
const loiMa = async (p: Promise<unknown>) => { try { await p; return null; } catch (e) { return (e as { code?: string }).code ?? "?"; } };

describe("Migration 0020: phê duyệt", () => {
  let db: PGlite;
  beforeAll(async () => { db = await taoDbVoiMigration(); await db.exec(`insert into auth.users (id) values ('${u(1)}')`); });

  it("trình duyệt và khách không đọc được mọi bảng", async () => {
    for (const b of ["pd_danh_muc", "pd_cau_hinh_phieu", "pd_luong_duyet", "pd_dem_so", "pd_phieu", "pd_buoc", "pd_lich_su", "pd_tep", "thong_bao_app"]) {
      expect(await loiMa(chayVoiTu(db, { sub: u(1) }, `select * from public.${b}`)), b).toBe("42501");
      expect(await loiMa(chayVoiKhach(db, `select * from public.${b}`)), b).toBe("42501");
    }
  });
  it("khởi tạo: 19 phiếu có nhóm mã đúng đề xuất, mỗi phiếu 2 bước mặc định", async () => {
    const r = (await db.query<{ nhom_ma: string; n: number }>(`select nhom_ma, count(*)::int n from public.pd_cau_hinh_phieu group by 1 order by 1`)).rows;
    expect(r).toEqual([{ nhom_ma: "ADM", n: 1 }, { nhom_ma: "FIN", n: 6 }, { nhom_ma: "HR", n: 11 }, { nhom_ma: "MKT", n: 1 }]);
    expect((await db.query(`select 1 from public.pd_luong_duyet`)).rows).toHaveLength(38);
  });
  it("số phiếu chạy tăng theo nhóm/tháng, không trùng, tháng mới đếm lại; người ngoài không gọi được", async () => {
    const cap = async (n: string, t: string) => (await db.query<{ s: number }>(`select public.pd_cap_so('${n}', '${t}') s`)).rows[0].s;
    expect([await cap("HR", "2610"), await cap("HR", "2610"), await cap("FIN", "2610"), await cap("HR", "2611")]).toEqual([1, 2, 1, 1]);
    const song = await Promise.all(Array.from({ length: 10 }, () => cap("MKT", "2610")));
    expect(new Set(song).size).toBe(10);
    expect(await loiMa(chayVoiTu(db, { sub: u(1) }, `select public.pd_cap_so('HR','2610')`))).toBe("42501");
  });
  it("ràng buộc: nhóm mã viết hoa 2-6 chữ, bước 1-30, loại người duyệt cần dữ liệu đi kèm, điều kiện đủ cặp, số phiếu duy nhất", async () => {
    expect(await loiMa(db.query(`update public.pd_cau_hinh_phieu set nhom_ma = 'hr' where ma_phieu = 'xin-nghi-viec'`))).toBe("23514");
    expect(await loiMa(db.query(`insert into public.pd_luong_duyet (ma_phieu, buoc, loai_nguoi) values ('x', 31, 'Giám đốc')`))).toBe("23514");
    expect(await loiMa(db.query(`insert into public.pd_luong_duyet (ma_phieu, buoc, loai_nguoi) values ('x', 1, 'Chức danh')`))).toBe("23514");
    expect(await loiMa(db.query(`insert into public.pd_luong_duyet (ma_phieu, buoc, loai_nguoi) values ('x', 1, 'Nhân viên')`))).toBe("23514");
    expect(await loiMa(db.query(`insert into public.pd_luong_duyet (ma_phieu, buoc, dieu_kien_truong) values ('x', 1, 'don_vi')`))).toBe("23514");
    await db.query(`insert into public.pd_phieu (so_phieu, ma_phieu, nhom_ma) values ('HR-2610-0001', 'xin-nghi-viec', 'HR')`);
    expect(await loiMa(db.query(`insert into public.pd_phieu (so_phieu, ma_phieu, nhom_ma) values ('HR-2610-0001', 'xin-nghi-viec', 'HR')`))).toBe("23505");
    expect(await loiMa(db.query(`insert into public.pd_phieu (so_phieu, ma_phieu, nhom_ma, trang_thai) values ('HR-2610-0002', 'x', 'HR', 'Lạ')`))).toBe("23514");
  });
  it("xoá phiếu xoá luôn ô duyệt, lịch sử, tệp", async () => {
    const id = (await db.query<{ id: string }>(`select id from public.pd_phieu where so_phieu = 'HR-2610-0001'`)).rows[0].id;
    await db.query(`insert into public.pd_buoc (phieu_id, buoc, kieu) values ($1, 1, 'AND')`, [id]);
    await db.query(`insert into public.pd_lich_su (phieu_id, hanh_dong) values ($1, 'Nộp')`, [id]);
    await db.query(`insert into public.pd_tep (phieu_id, truong, ten_tep, duong_dan) values ($1, 'a', 'b', 'c')`, [id]);
    await db.query(`delete from public.pd_phieu where id = $1`, [id]);
    for (const b of ["pd_buoc", "pd_lich_su", "pd_tep"]) expect((await db.query(`select 1 from public.${b}`)).rows, b).toHaveLength(0);
  });
});
