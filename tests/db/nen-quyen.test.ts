import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { chayVoiKhach, chayVoiTu, taoDbVoiMigration } from "./khung";

// Người và quan hệ quản lý (UUID cố định để đọc kết quả dễ):
//   tgd(ban_dieu_hanh) ── tp_mkt(truong_bo_phan) ── content, video
//   pho_tgd(ban_dieu_hanh+duyet_luong) · hcns · ke_toan · kho(không quản lý ai) · qt(chỉ tài khoản, không hồ sơ)
const u = (n: number) => `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
const U = { tgd: u(1), pho: u(2), hcns: u(3), kt: u(4), tp: u(5), content: u(6), video: u(7), kho: u(8), qt: u(9), nghi: u(10), ngung: u(11), cho: u(12) };
const NV = { tgd: u(101), pho: u(102), hcns: u(103), kt: u(104), tp: u(105), content: u(106), video: u(107), kho: u(108), nghi: u(110), ngung: u(111) };

const aal1 = (sub: string) => ({ sub, aal: "aal1" });
const aal2 = (sub: string) => ({ sub, aal: "aal2" });

describe("Nền phân quyền 0004 (K-G1)", () => {
  let db: PGlite;
  const q = (claims: { sub: string } & Record<string, unknown>, sql: string) => chayVoiTu(db, claims, sql);
  const dem = async (claims: { sub: string } & Record<string, unknown>, sql: string) => (await q(claims, sql)).rows.length;

  beforeAll(async () => {
    db = await taoDbVoiMigration();
    await db.exec(`
      insert into auth.users (id) select unnest(array['${Object.values(U).join("','")}']::uuid[]);
      insert into public.khoi (id, ten) values ('${u(900)}', 'Marketing'), ('${u(901)}', 'Vận hành');
      insert into public.nhan_vien (id, ho_ten, chuc_danh, khoi_id, user_id, quan_ly_id, trang_thai, tai_khoan_hoat_dong) values
        ('${NV.tgd}', 'TGĐ Thử', 'Tổng giám đốc', '${u(900)}', '${U.tgd}', null, 'Đang làm', true),
        ('${NV.pho}', 'Phó Thử', 'Phó Tổng giám đốc', '${u(900)}', '${U.pho}', null, 'Đang làm', true),
        ('${NV.hcns}', 'HCNS Thử', 'HCNS - Tuyển dụng', '${u(901)}', '${U.hcns}', '${NV.pho}', 'Đang làm', true),
        ('${NV.kt}', 'Kế toán Thử', 'Kế toán tổng hợp', '${u(901)}', '${U.kt}', '${NV.pho}', 'Đang làm', true),
        ('${NV.tp}', 'TP Mkt Thử', 'Trưởng phòng Marketing', '${u(900)}', '${U.tp}', '${NV.tgd}', 'Đang làm', true),
        ('${NV.content}', 'Content Thử', 'Content Marketing', '${u(900)}', '${U.content}', '${NV.tp}', 'Đang làm', true),
        ('${NV.video}', 'Video Thử', 'Video Editor', '${u(900)}', '${U.video}', '${NV.tp}', 'Đang làm', true),
        ('${NV.kho}', 'Kho Thử', 'Kho + đóng hàng', '${u(901)}', '${U.kho}', '${NV.kt}', 'Đang làm', true),
        ('${NV.nghi}', 'Nghỉ Thử', 'Content Marketing', '${u(900)}', '${U.nghi}', '${NV.tp}', 'Đã nghỉ', true),
        ('${NV.ngung}', 'Ngưng Thử', 'Video Editor', '${u(900)}', '${U.ngung}', '${NV.tp}', 'Đang làm', false);
      insert into public.gan_vai_tro (user_id, vai_tro) values
        ('${U.tgd}', 'ban_dieu_hanh'), ('${U.pho}', 'ban_dieu_hanh'), ('${U.pho}', 'duyet_luong'),
        ('${U.hcns}', 'hcns'), ('${U.kt}', 'ke_toan_luong'), ('${U.qt}', 'quan_tri_he_thong');
      insert into public.cham_cong (nhan_vien_id, ngay, gio_vao) values
        ('${NV.content}', '2026-11-02', '08:20'), ('${NV.video}', '2026-11-02', '08:25'),
        ('${NV.kho}', '2026-11-02', '08:00'), ('${NV.tp}', '2026-11-02', '08:10');
      insert into public.don_tu (nhan_vien_id, loai, tu_ngay, den_ngay) values
        ('${NV.content}', 'Nghỉ phép năm', '2026-11-05', '2026-11-05'),
        ('${NV.tp}', 'Nghỉ ốm', '2026-11-06', '2026-11-06'),
        ('${NV.kho}', 'Nghỉ ốm', '2026-11-07', '2026-11-07');
      insert into public.ky_luong (id, ten_ky) values ('${u(950)}', 'Tháng 11/2026');
      insert into public.bang_luong (ky_luong_id, nhan_vien_id, thuc_linh) values
        ('${u(950)}', '${NV.content}', 10000000), ('${u(950)}', '${NV.kho}', 9000000),
        ('${u(950)}', '${NV.tgd}', 90000000), ('${u(950)}', '${NV.pho}', 80000000);
    `);
  });

  // ── Cổng cấu trúc (mỗi migration phải qua; K-G7-2 bản đầu) ──
  describe("cổng cấu trúc", () => {
    it("mọi bảng public bật RLS + FORCE RLS và có policy", async () => {
      const r = await db.query<{ ten: string; rls: boolean; ep: boolean; so_policy: number }>(`
        select c.relname as ten, c.relrowsecurity as rls, c.relforcerowsecurity as ep,
               (select count(*) from pg_policies p where p.schemaname='public' and p.tablename=c.relname)::int as so_policy
          from pg_class c join pg_namespace n on n.oid=c.relnamespace
         where n.nspname='public' and c.relkind='r'`);
      expect(r.rows.length).toBeGreaterThanOrEqual(14);
      const hong = r.rows.filter((x) => !x.rls || !x.ep || x.so_policy === 0).map((x) => x.ten);
      expect(hong).toEqual([]);
    });

    it("anon không có quyền gì trên bất kỳ bảng/hàm nào", async () => {
      const b = await db.query(`select 1 from information_schema.role_table_grants where grantee='anon' and table_schema in ('public','private','api')`);
      expect(b.rows).toHaveLength(0);
      const h = await db.query(`select 1 from information_schema.role_routine_grants where grantee in ('anon','PUBLIC') and routine_schema in ('public','private','api')`);
      expect(h.rows).toHaveLength(0);
      await expect(chayVoiKhach(db, "select * from public.nhan_vien")).rejects.toThrow(/permission denied/);
    });

    it("authenticated không xoá/cắt bảng nào ngoài tuyển dụng; không có TRUNCATE ở đâu", async () => {
      const r = await db.query<{ table_name: string; privilege_type: string }>(
        `select table_name, privilege_type from information_schema.role_table_grants
          where grantee='authenticated' and table_schema='public' and privilege_type in ('DELETE','TRUNCATE','TRIGGER','REFERENCES')`);
      const xoa = r.rows.filter((x) => x.privilege_type === 'DELETE').map((x) => x.table_name).sort();
      expect(xoa).toEqual(["tin_tuyen_dung", "ung_vien"]);
      expect(r.rows.filter((x) => x.privilege_type !== 'DELETE')).toHaveLength(0);
    });

    it("không ai (authenticated) đọc được cột user_id của nhan_vien", async () => {
      await expect(q(aal1(U.hcns), "select user_id from public.nhan_vien")).rejects.toThrow(/permission denied/);
      await expect(q(aal1(U.hcns), "select * from public.nhan_vien")).rejects.toThrow(/permission denied/);
    });

    it("hàm private không gọi được từ anon; authenticated chỉ gọi được hàm được cấp", async () => {
      await expect(chayVoiKhach(db, "select private.nv_hien_tai()")).rejects.toThrow(/permission denied/);
      await expect(q(aal1(U.kho), "select private.ghi_nhat_ky()")).rejects.toThrow(/permission denied/);
    });
  });

  // ── Phạm vi dữ liệu (K-G1-2/3) ──
  describe("phạm vi dữ liệu", () => {
    it("danh bạ: ai đang làm cũng thấy toàn công ty đang có hồ sơ; người chưa có hồ sơ/vai trò thấy 0", async () => {
      expect(await dem(aal1(U.kho), "select id from public.nhan_vien")).toBe(10);
      expect(await dem(aal1(U.cho), "select id from public.nhan_vien")).toBe(0);
    });

    it("chấm công: nhân viên chỉ thấy của mình", async () => {
      const r = await q(aal1(U.content), "select nhan_vien_id from public.cham_cong");
      expect(r.rows).toEqual([{ nhan_vien_id: NV.content }]);
    });

    it("chấm công: trưởng bộ phận thấy cả nhánh (mình + 2 cấp dưới), không thấy Kho", async () => {
      const r = await q(aal1(U.tp), "select nhan_vien_id from public.cham_cong order by 1");
      expect(r.rows.map((x) => x.nhan_vien_id).sort()).toEqual([NV.tp, NV.content, NV.video].sort());
    });

    it("chấm công: HCNS/kế toán/BĐH thấy cả công ty; quản trị hệ thống thấy 0", async () => {
      expect(await dem(aal2(U.hcns), "select 1 from public.cham_cong")).toBe(4);
      expect(await dem(aal2(U.kt), "select 1 from public.cham_cong")).toBe(4);
      expect(await dem(aal2(U.tgd), "select 1 from public.cham_cong")).toBe(4);
      expect(await dem(aal2(U.qt), "select 1 from public.cham_cong")).toBe(0);
    });

    it("tài khoản đã nghỉ việc hoặc bị ngưng: không thấy gì", async () => {
      expect(await dem(aal1(U.nghi), "select 1 from public.nhan_vien")).toBe(0);
      expect(await dem(aal1(U.ngung), "select 1 from public.nhan_vien")).toBe(0);
      expect(await dem(aal1(U.nghi), "select 1 from public.cham_cong")).toBe(0);
    });
  });

  // ── aal2 (H.2) ──
  describe("aal2 cho vai trò nhạy cảm và bảng lương", () => {
    it("bảng lương: aal1 ⇒ 0 dòng với MỌI người", async () => {
      for (const id of [U.content, U.hcns, U.kt, U.tgd, U.pho, U.qt]) {
        expect(await dem(aal1(id), "select 1 from public.bang_luong")).toBe(0);
      }
    });

    it("bảng lương aal2: nhân viên thấy đúng dòng của mình", async () => {
      const r = await q(aal2(U.content), "select nhan_vien_id from public.bang_luong");
      expect(r.rows).toEqual([{ nhan_vien_id: NV.content }]);
    });

    it("bảng lương aal2: HCNS thấy toàn công ty NHƯNG KHÔNG thấy lương Ban điều hành (H.18)", async () => {
      const r = await q(aal2(U.hcns), "select nhan_vien_id from public.bang_luong");
      expect(r.rows.map((x) => x.nhan_vien_id).sort()).toEqual([NV.content, NV.kho].sort());
    });

    it("bảng lương aal2: kế toán và BĐH thấy cả Ban điều hành; quản trị hệ thống và trưởng bộ phận (chỉ vai trò suy ra) không thấy lương người khác", async () => {
      expect(await dem(aal2(U.kt), "select 1 from public.bang_luong")).toBe(4);
      expect(await dem(aal2(U.tgd), "select 1 from public.bang_luong")).toBe(4);
      expect(await dem(aal2(U.qt), "select 1 from public.bang_luong")).toBe(0);
      const tp = await q(aal2(U.tp), "select nhan_vien_id from public.bang_luong");
      expect(tp.rows.every((x) => x.nhan_vien_id === NV.tp)).toBe(true);
    });

    it("vai trò nhạy cảm ở aal1 rơi về quyền nhân viên: HCNS aal1 không tạo được hồ sơ, aal2 thì được", async () => {
      const sql = `insert into public.nhan_vien (ho_ten, chuc_danh, khoi_id, ngay_vao_lam) values ('Người Mới', 'Host live', '${u(900)}', '2026-11-02') returning id`;
      await expect(q(aal1(U.hcns), sql)).rejects.toThrow(/row-level security/);
      const r = await q(aal2(U.hcns), sql);
      expect(r.rows).toHaveLength(1);
    });
  });

  // ── Đơn từ: nộp và duyệt (K-G1-15, mass assignment) ──
  describe("đơn từ", () => {
    it("nhân viên chỉ nộp đơn cho chính mình, trạng thái do mặc định", async () => {
      const ok = await q(aal1(U.content), `insert into public.don_tu (nhan_vien_id, loai, tu_ngay, den_ngay) values ('${NV.content}','Nghỉ ốm','2026-11-09','2026-11-09') returning trang_thai`);
      expect(ok.rows).toEqual([{ trang_thai: "Chờ duyệt" }]);
      await expect(q(aal1(U.content), `insert into public.don_tu (nhan_vien_id, loai, tu_ngay, den_ngay) values ('${NV.video}','Nghỉ ốm','2026-11-09','2026-11-09')`)).rejects.toThrow(/row-level security/);
    });

    it("không ghi được cột cấm: tự đặt trạng thái 'Đã duyệt' bị từ chối ở quyền cột", async () => {
      await expect(q(aal1(U.content), `insert into public.don_tu (nhan_vien_id, loai, tu_ngay, den_ngay, trang_thai) values ('${NV.content}','Nghỉ ốm','2026-11-10','2026-11-10','Đã duyệt')`)).rejects.toThrow(/permission denied/);
    });

    it("nhân viên không tự duyệt đơn của mình", async () => {
      const r = await q(aal1(U.content), `update public.don_tu set trang_thai='Đã duyệt', nguoi_duyet_id='${NV.content}' where nhan_vien_id='${NV.content}' returning id`).catch(() => ({ rows: [] }));
      expect(r.rows).toHaveLength(0);
    });

    it("trưởng bộ phận duyệt được đơn cấp dưới trực tiếp, không duyệt đơn của chính mình hay của người khác nhánh", async () => {
      const own = await q(aal1(U.tp), `update public.don_tu set trang_thai='Đã duyệt', nguoi_duyet_id='${NV.tp}' where nhan_vien_id='${NV.tp}' returning id`);
      expect(own.rows).toHaveLength(0);
      const kho = await q(aal1(U.tp), `update public.don_tu set trang_thai='Đã duyệt', nguoi_duyet_id='${NV.tp}' where nhan_vien_id='${NV.kho}' returning id`);
      expect(kho.rows).toHaveLength(0);
      const ok = await q(aal1(U.tp), `update public.don_tu set trang_thai='Đã duyệt', nguoi_duyet_id='${NV.tp}' where nhan_vien_id='${NV.content}' and tu_ngay='2026-11-05' returning id`);
      expect(ok.rows).toHaveLength(1);
    });

    it("đơn đã quyết định thì không lật lại được", async () => {
      const r = await q(aal1(U.tp), `update public.don_tu set trang_thai='Từ chối', nguoi_duyet_id='${NV.tp}' where nhan_vien_id='${NV.content}' and tu_ngay='2026-11-05' returning id`);
      expect(r.rows).toHaveLength(0);
    });

    it("không giả danh người duyệt: nguoi_duyet_id phải là chính mình", async () => {
      const r = await q(aal1(U.tp), `update public.don_tu set trang_thai='Đã duyệt', nguoi_duyet_id='${NV.tgd}' where nhan_vien_id='${NV.video}' returning id`).catch(() => ({ rows: [] }));
      expect(r.rows).toHaveLength(0);
    });

    it("BĐH duyệt được đơn toàn công ty (aal2), trừ đơn của chính mình", async () => {
      const ok = await q(aal2(U.tgd), `update public.don_tu set trang_thai='Từ chối', nguoi_duyet_id='${NV.tgd}' where nhan_vien_id='${NV.kho}' returning id`);
      expect(ok.rows).toHaveLength(1);
    });
  });

  // ── Hồ sơ: ghi cột (mass assignment) ──
  describe("hồ sơ nhân viên", () => {
    it("nhân viên không sửa được hồ sơ ai, kể cả của mình (chưa có cột tự sửa)", async () => {
      const r = await q(aal1(U.content), `update public.nhan_vien set chuc_danh='Tổng giám đốc' where id='${NV.content}' returning id`);
      expect(r.rows).toHaveLength(0);
    });

    it("HCNS (aal2) sửa được hồ sơ người khác nhưng KHÔNG đụng được user_id/tai_khoan_hoat_dong", async () => {
      const ok = await q(aal2(U.hcns), `update public.nhan_vien set chuc_danh='Content Senior' where id='${NV.content}' returning id`);
      expect(ok.rows).toHaveLength(1);
      await expect(q(aal2(U.hcns), `update public.nhan_vien set user_id='${U.cho}' where id='${NV.content}'`)).rejects.toThrow(/permission denied/);
      await expect(q(aal2(U.hcns), `update public.nhan_vien set tai_khoan_hoat_dong=false where id='${NV.content}'`)).rejects.toThrow(/permission denied/);
    });

    it("HCNS không tự sửa hồ sơ của chính mình", async () => {
      const r = await q(aal2(U.hcns), `update public.nhan_vien set chuc_danh='Giám đốc' where id='${NV.hcns}' returning id`);
      expect(r.rows).toHaveLength(0);
    });

    it("không ai xoá được nhân viên bằng API (chỉ chuyển 'Đã nghỉ')", async () => {
      await expect(q(aal2(U.hcns), `delete from public.nhan_vien where id='${NV.video}'`)).rejects.toThrow(/permission denied/);
    });
  });

  // ── Phân quyền: trần quyền, gán vai trò, nhật ký ──
  describe("trần quyền, gán vai trò, nhật ký", () => {
    it("K-G1-14: dòng quyền vượt trần bị trigger từ chối (kể cả khi SQL chạy bằng chủ DB)", async () => {
      await expect(db.exec(`update public.quyen_vai_tro set pham_vi='a' where vai_tro='nhan_vien' and module='cham_cong' and hanh_dong='xem'`)).rejects.toThrow(/vượt trần/);
      await expect(db.exec(`insert into public.quyen_vai_tro values ('quan_tri_he_thong','bang_luong','xem','a')`)).rejects.toThrow(/không có trần/);
    });

    it("K-G1-16: vai trò mới tự thêm (không có trần) không nhận được quyền nào — mặc định từ chối", async () => {
      await db.exec(`insert into public.vai_tro (ma, ten) values ('vai_tro_la', 'Vai trò lạ')`);
      await expect(db.exec(`insert into public.quyen_vai_tro values ('vai_tro_la','cham_cong','xem','a')`)).rejects.toThrow(/không có trần/);
    });

    it("ứng dụng (authenticated) không ghi được vai trò/quyền/trần", async () => {
      for (const sql of [
        `insert into public.quyen_vai_tro values ('hcns','don_tu','xoa','a')`,
        `update public.quyen_vai_tro set pham_vi='m'`,
        `insert into public.gan_vai_tro (user_id, vai_tro) values ('${U.cho}','hcns')`,
        `insert into public.gioi_han_cung values ('nhan_vien','bang_luong','xem','a')`,
      ]) {
        await expect(q(aal2(U.hcns), sql)).rejects.toThrow(/permission denied/);
      }
    });

    it("không gán tay vai trò nền/suy ra", async () => {
      await expect(db.exec(`insert into public.gan_vai_tro (user_id, vai_tro) values ('${U.cho}','truong_bo_phan')`)).rejects.toThrow(/nền\/suy ra/);
      await expect(db.exec(`insert into public.gan_vai_tro (user_id, vai_tro) values ('${U.cho}','nhan_vien')`)).rejects.toThrow(/nền\/suy ra/);
    });

    it("nhật ký ghi lại thao tác duyệt đơn, không ai ghi/sửa/xoá được, người xem có quyền thì thấy", async () => {
      const n = await db.query<{ c: number }>(`select count(*)::int c from public.nhat_ky where bang='don_tu' and hanh_dong='UPDATE'`);
      expect(n.rows[0].c).toBeGreaterThanOrEqual(1);
      await expect(q(aal2(U.hcns), `delete from public.nhat_ky`)).rejects.toThrow(/permission denied/);
      await expect(q(aal2(U.hcns), `update public.nhat_ky set bang='x'`)).rejects.toThrow(/permission denied/);
      expect(await dem(aal2(U.hcns), "select 1 from public.nhat_ky")).toBeGreaterThan(0);
      expect(await dem(aal1(U.content), "select 1 from public.nhat_ky")).toBe(0);
    });

    it("nhật ký bảng lương KHÔNG chứa số tiền", async () => {
      const r = await db.query<{ sau: Record<string, unknown> }>(`select sau from public.nhat_ky where bang='bang_luong' and hanh_dong='INSERT' limit 1`);
      expect(Object.keys(r.rows[0].sau)).toEqual(["id"]);
    });

    it("vai trò gán hết hạn thì mất hiệu lực", async () => {
      await db.exec(`insert into public.gan_vai_tro (user_id, vai_tro, hieu_luc_tu, hieu_luc_den) values ('${U.video}','hcns','2020-01-01','2020-12-31')`);
      const r = await q(aal2(U.video), `select 1 from public.nhan_vien where id='${NV.content}'`);
      expect(r.rows).toHaveLength(1); // vẫn xem được danh bạ (quyền nhân viên)
      await expect(q(aal2(U.video), `insert into public.nhan_vien (ho_ten) values ('X')`)).rejects.toThrow(/row-level security/);
    });
  });

  // ── Tuyển dụng mở rộng (0005) ──
  describe("tuyển dụng mở rộng", () => {
    it("HCNS aal2 thêm ứng viên với trường mới; bước không hợp lệ bị từ chối", async () => {
      const tin = await q(aal2(U.hcns), `insert into public.tin_tuyen_dung (vi_tri, mo_ta, han_nop) values ('Kho','mô tả','2026-12-31') returning id`);
      const id = tin.rows[0].id;
      const ok = await q(aal2(U.hcns), `insert into public.ung_vien (tin_tuyen_dung_id, ho_ten, nguon, link_cv, ghi_chu, nam_sinh) values ('${id}','Ứng Viên A','TopCV','https://x.vn/cv','ghi',1999) returning trang_thai, ngay_nhan_ho_so is not null as co_ngay`);
      expect(ok.rows).toEqual([{ trang_thai: "Mới nộp", co_ngay: true }]);
      await expect(q(aal2(U.hcns), `update public.ung_vien set trang_thai='Tùy ý' where ho_ten='Ứng Viên A'`)).rejects.toThrow(/check constraint|violates/);
      const up = await q(aal2(U.hcns), `update public.ung_vien set trang_thai='Hẹn phỏng vấn', ngay_phong_van='2026-11-10' where ho_ten='Ứng Viên A' returning id`);
      expect(up.rows).toHaveLength(1);
    });

    it("nhân viên thường không đọc/ghi được ứng viên; không đổi được ngày nhận hồ sơ sau khi tạo", async () => {
      expect(await dem(aal1(U.content), "select 1 from public.ung_vien")).toBe(0);
      await expect(q(aal2(U.hcns), `update public.ung_vien set ngay_nhan_ho_so='2020-01-01'`)).rejects.toThrow(/permission denied/);
    });
  });

  // ── Tuyển dụng (module không gắn nhân viên) ──
  describe("tuyển dụng", () => {
    it("nhân viên thường không thấy; HCNS aal2 tạo/xoá được; aal1 thì không", async () => {
      await db.exec(`insert into public.tin_tuyen_dung (vi_tri) values ('Host live')`);
      expect(await dem(aal1(U.content), "select 1 from public.tin_tuyen_dung")).toBe(0);
      expect(await dem(aal1(U.hcns), "select 1 from public.tin_tuyen_dung")).toBe(0);
      expect(await dem(aal2(U.hcns), "select 1 from public.tin_tuyen_dung")).toBeGreaterThanOrEqual(1);
      const r = await q(aal2(U.hcns), `insert into public.tin_tuyen_dung (vi_tri) values ('Streamer') returning id`);
      expect(r.rows).toHaveLength(1);
    });
  });
});
