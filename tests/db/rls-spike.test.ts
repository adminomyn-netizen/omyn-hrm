import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { chayVoiKhach, chayVoiTu, taoDb } from "./khung";

const A = "11111111-1111-1111-1111-111111111111";
const B = "22222222-2222-2222-2222-222222222222";

describe("Spike khung RLS (V-G0-12)", () => {
  let db: PGlite;

  beforeAll(async () => {
    db = await taoDb();
    await db.exec(`
      -- bảng đúng: bật + ép RLS, chỉ chủ dòng thấy
      create table public.ho_so (id serial primary key, chu uuid not null, noi_dung text);
      alter table public.ho_so enable row level security;
      alter table public.ho_so force row level security;
      create policy chu_doc on public.ho_so for select to authenticated using (chu = auth.uid());
      create policy chu_sua on public.ho_so for update to authenticated using (chu = auth.uid()) with check (chu = auth.uid());
      grant select, update on public.ho_so to authenticated;
      -- bảng bật RLS nhưng quên policy (giống 9 bảng thật hôm nay)
      create table public.quen_policy (id serial primary key, chu uuid);
      alter table public.quen_policy enable row level security;
      grant select on public.quen_policy to authenticated, anon;
      -- CHIM HOÀNG YẾN: bảng cố ý rò (using true). Nếu bộ test không bắt được nó thì "xanh giả".
      create table public.chim_hoang_yen (id serial primary key, chu uuid);
      alter table public.chim_hoang_yen enable row level security;
      create policy ro_ri on public.chim_hoang_yen for select to authenticated using (true);
      grant select on public.chim_hoang_yen to authenticated;
      insert into public.ho_so (chu, noi_dung) values ('${A}', 'của A'), ('${B}', 'của B');
      insert into public.quen_policy (chu) values ('${A}');
      insert into public.chim_hoang_yen (chu) values ('${A}'), ('${B}');
    `);
  });

  it("người dùng chỉ thấy dòng của mình", async () => {
    const r = await chayVoiTu(db, { sub: A }, "select noi_dung from public.ho_so");
    expect(r.rows).toEqual([{ noi_dung: "của A" }]);
  });

  it("không sửa được dòng của người khác (0 dòng bị ảnh hưởng)", async () => {
    const r = await chayVoiTu(db, { sub: A }, "update public.ho_so set noi_dung='bị sửa' where chu='" + B + "' returning id");
    expect(r.rows).toHaveLength(0);
    const sauDo = await db.query("select noi_dung from public.ho_so where chu='" + B + "'");
    expect(sauDo.rows).toEqual([{ noi_dung: "của B" }]);
  });

  it("khách chưa đăng nhập không có quyền gì trên bảng", async () => {
    await expect(chayVoiKhach(db, "select * from public.ho_so")).rejects.toThrow(/permission denied/);
  });

  it("bảng bật RLS mà thiếu policy trả 0 dòng (mặc định từ chối)", async () => {
    const r = await chayVoiTu(db, { sub: A }, "select * from public.quen_policy");
    expect(r.rows).toHaveLength(0);
    const k = await chayVoiKhach(db, "select * from public.quen_policy");
    expect(k.rows).toHaveLength(0);
  });

  it("K0 chim hoàng yến: bộ test PHÁT HIỆN được bảng rò", async () => {
    const r = await chayVoiTu(db, { sub: A }, "select chu from public.chim_hoang_yen");
    const thayDongCuaNguoiKhac = r.rows.some((x) => x.chu === B);
    // Rò thật ⇒ phép kiểm "chỉ thấy dòng của mình" PHẢI đỏ trên bảng này.
    expect(thayDongCuaNguoiKhac).toBe(true);
  });

  it("claims giả (sub rỗng) không thấy gì", async () => {
    await db.exec(`select set_config('request.jwt.claims', '{"sub":""}', false); set role authenticated;`);
    try {
      const r = await db.query("select * from public.ho_so");
      expect(r.rows).toHaveLength(0);
    } finally {
      await db.exec("reset role");
    }
  });
});
