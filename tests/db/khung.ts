// Khung kiểm thử RLS (V-G0-12): PGlite = Postgres thật chạy trong tiến trình, không cần Docker.
// Giả lập đúng phần Supabase mà chính sách của ta dựa vào: role anon/authenticated/service_role,
// schema `auth` với auth.uid()/auth.jwt() đọc từ `request.jwt.claims` — cùng cách PostgREST làm.
import { PGlite } from "@electric-sql/pglite";

export type Dong = Record<string, unknown>;

export async function taoDb() {
  const db = new PGlite();
  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create role service_role nologin bypassrls;
    create schema auth;
    create function auth.jwt() returns jsonb language sql stable as
      $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(auth.jwt() ->> 'sub', '')::uuid $$;
    grant usage on schema auth to anon, authenticated, service_role;
    grant execute on all functions in schema auth to anon, authenticated, service_role;
    grant usage on schema public to anon, authenticated, service_role;
  `);
  return db;
}

/** Chạy SQL với tư cách một người dùng đã đăng nhập (role authenticated + claims JWT). */
export async function chayVoiTu<T extends Dong = Dong>(
  db: PGlite,
  claims: { sub: string } & Record<string, unknown>,
  sql: string,
) {
  await db.exec(`select set_config('request.jwt.claims', '${JSON.stringify(claims)}', false); set role authenticated;`);
  try {
    return await db.query<T>(sql);
  } finally {
    await db.exec(`reset role; select set_config('request.jwt.claims', '', false);`);
  }
}

/** Chạy SQL với tư cách khách chưa đăng nhập (role anon, không claims). */
export async function chayVoiKhach<T extends Dong = Dong>(db: PGlite, sql: string) {
  await db.exec(`select set_config('request.jwt.claims', '', false); set role anon;`);
  try {
    return await db.query<T>(sql);
  } finally {
    await db.exec(`reset role;`);
  }
}
