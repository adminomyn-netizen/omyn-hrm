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

describe("Migration 0021: cấu hình luồng phiếu", () => {
  let db: PGlite;
  beforeAll(async () => { db = await taoDbVoiMigration(); await db.exec(`insert into auth.users (id) values ('${u(1)}')`); });
  it("trình duyệt và khách không đọc được", async () => {
    for (const b of ["pd_o_cau_hinh", "pd_thong_bao_cau_hinh", "pd_cau_hinh_lich_su"]) {
      expect(await loiMa(chayVoiTu(db, { sub: u(1) }, `select * from public.${b}`)), b).toBe("42501");
      expect(await loiMa(chayVoiKhach(db, `select * from public.${b}`)), b).toBe("42501");
    }
  });
  it("ghi đè ô: điều kiện phải đủ cặp ô + giá trị; mỗi ô một dòng; giá trị lạ bị chặn", async () => {
    await db.query(`insert into public.pd_o_cau_hinh (ma_phieu, truong, che_do_hien, hien_truong, hien_gia_tri) values ('x','a','Theo điều kiện','b','{ADL}')`);
    expect(await loiMa(db.query(`insert into public.pd_o_cau_hinh (ma_phieu, truong) values ('x','a')`))).toBe("23505");
    expect(await loiMa(db.query(`insert into public.pd_o_cau_hinh (ma_phieu, truong, che_do_hien) values ('x','c','Theo điều kiện')`))).toBe("23514");
    expect(await loiMa(db.query(`insert into public.pd_o_cau_hinh (ma_phieu, truong, hien_truong, hien_gia_tri) values ('x','d','b','{ADL}')`))).toBe("23514");
    expect(await loiMa(db.query(`insert into public.pd_o_cau_hinh (ma_phieu, truong, bat_buoc) values ('x','e','Có')`))).toBe("23514");
  });
  it("thông báo: sự kiện/loại người hợp lệ, chức danh/nhân viên đi kèm; xoá nhân sự xoá luôn dòng", async () => {
    expect(await loiMa(db.query(`insert into public.pd_thong_bao_cau_hinh (ma_phieu, su_kien, loai_nguoi) values ('x','Lạ','Giám đốc')`))).toBe("23514");
    expect(await loiMa(db.query(`insert into public.pd_thong_bao_cau_hinh (ma_phieu, su_kien, loai_nguoi) values ('x','Nộp phiếu','Chức danh')`))).toBe("23514");
    await db.query(`insert into public.nhan_vien (id, ho_ten) values ('${u(7)}','A')`);
    await db.query(`insert into public.pd_thong_bao_cau_hinh (ma_phieu, su_kien, loai_nguoi, nhan_vien_id) values ('x','Duyệt xong','Nhân viên','${u(7)}')`);
    await db.query(`delete from public.nhan_vien where id = '${u(7)}'`);
    expect((await db.query(`select 1 from public.pd_thong_bao_cau_hinh`)).rows).toHaveLength(0);
  });
  it("lịch sử cấu hình: đối tượng và hành động hợp lệ", async () => {
    await db.query(`insert into public.pd_cau_hinh_lich_su (ma_phieu, doi_tuong, hanh_dong, mo_ta) values ('x','Bước duyệt','Thêm','t')`);
    expect(await loiMa(db.query(`insert into public.pd_cau_hinh_lich_su (ma_phieu, doi_tuong, hanh_dong, mo_ta) values ('x','Lạ','Thêm','t')`))).toBe("23514");
  });
});

describe("Migration 0022: hồ sơ + hợp đồng", () => {
  let db: PGlite;
  const NV = u(501);
  beforeAll(async () => { db = await taoDbVoiMigration(); await db.exec(`insert into auth.users (id) values ('${u(1)}'); insert into public.nhan_vien (id, ho_ten) values ('${NV}','A')`); });
  it("trình duyệt và khách không đọc được", async () => {
    for (const b of ["hop_dong_phu_luc", "tai_san_cap_phat", "nhan_su_lich_su"]) {
      expect(await loiMa(chayVoiTu(db, { sub: u(1) }, `select * from public.${b}`)), b).toBe("42501");
      expect(await loiMa(chayVoiKhach(db, `select * from public.${b}`)), b).toBe("42501");
    }
  });
  it("phụ lục: loại/nội dung/ngày hợp lệ; tài sản: số lượng > 0, ngày trả không trước ngày cấp; xoá nhân sự xoá cả hai nhưng giữ lịch sử", async () => {
    await db.query(`insert into public.hop_dong_phu_luc (nhan_vien_id, loai_thay_doi, ngay_hieu_luc, noi_dung) values ($1,'Gia hạn','2026-11-01','x')`, [NV]);
    expect(await loiMa(db.query(`insert into public.hop_dong_phu_luc (nhan_vien_id, loai_thay_doi, ngay_hieu_luc, noi_dung) values ($1,'Lạ','2026-11-01','x')`, [NV]))).toBe("23514");
    expect(await loiMa(db.query(`insert into public.hop_dong_phu_luc (nhan_vien_id, ngay_hieu_luc, noi_dung) values ($1,'2026-11-01','  ')`, [NV]))).toBe("23514");
    expect(await loiMa(db.query(`insert into public.hop_dong_phu_luc (nhan_vien_id, ngay_hieu_luc, den_ngay_moi, noi_dung) values ($1,'2026-11-01','2026-10-01','x')`, [NV]))).toBe("23514");
    await db.query(`insert into public.tai_san_cap_phat (nhan_vien_id, ten_tai_san, ngay_cap) values ($1,'Laptop','2026-10-01')`, [NV]);
    expect(await loiMa(db.query(`insert into public.tai_san_cap_phat (nhan_vien_id, ten_tai_san, ngay_cap, so_luong) values ($1,'x','2026-10-01',0)`, [NV]))).toBe("23514");
    expect(await loiMa(db.query(`insert into public.tai_san_cap_phat (nhan_vien_id, ten_tai_san, ngay_cap, ngay_tra) values ($1,'x','2026-10-10','2026-10-01')`, [NV]))).toBe("23514");
    await db.query(`insert into public.nhan_su_lich_su (nhan_vien_id, doi_tuong, hanh_dong, mo_ta) values ($1,'Tài sản cấp phát','Thêm','t')`, [NV]);
    await db.query(`delete from public.nhan_vien where id = $1`, [NV]);
    for (const b of ["hop_dong_phu_luc", "tai_san_cap_phat"]) expect((await db.query(`select 1 from public.${b}`)).rows, b).toHaveLength(0);
    expect((await db.query(`select 1 from public.nhan_su_lich_su`)).rows).toHaveLength(1);
  });
});
