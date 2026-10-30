import "server-only";
import { dbHr } from "@/lib/hr-db";
import { kyShopee, trangThaiKhoa } from "@/lib/quang-cao";
import * as ax from "@/lib/quang-cao-anh-xa";

type Obj = Record<string, unknown>;
const BASE_META = () => `${process.env.META_ADS_BASE_URL ?? "https://graph.facebook.com"}/${process.env.META_ADS_API_VERSION ?? "v21.0"}`;
const BASE_TT = () => `${process.env.TIKTOK_ADS_BASE_URL ?? "https://business-api.tiktok.com/open_api"}/${process.env.TIKTOK_ADS_API_VERSION ?? "v1.3"}`;
const lui = (n: number) => new Date(Date.now() + 7 * 3600e3 - n * 864e5).toISOString().slice(0, 10);

async function upsert(bang: string, dong: Obj[], conflict: string) {
  const db = dbHr();
  for (let i = 0; i < dong.length; i += 500) {
    const { error } = await db.from(bang).upsert(dong.slice(i, i + 500), { onConflict: conflict });
    if (error) throw new Error(`${bang}: ${error.message.slice(0, 160)}`);
  }
  return dong.length;
}

/** Đọc mọi trang của Graph API (con trỏ `paging.next`). Khoá nằm trong URL chỉ ở bộ nhớ, không ghi log. */
async function* trangMeta(url: string): AsyncGenerator<Obj[]> {
  let tiep: string | null = url;
  for (let i = 0; tiep && i < 200; i++) {
    const r: Response = await fetch(tiep, { cache: "no-store" });
    const j = (await r.json()) as { data?: Obj[]; paging?: { next?: string }; error?: { message?: string } };
    if (!r.ok || j.error) throw new Error(`Meta: ${(j.error?.message ?? r.statusText).slice(0, 160)}`);
    yield j.data ?? [];
    tiep = j.paging?.next ?? null;
  }
}

export async function dongBoMeta(soNgay = 30): Promise<number> {
  const tk = process.env.META_ADS_ACCESS_TOKEN!, base = BASE_META();
  const q = (path: string, p: Record<string, string>) => `${base}/${path}?${new URLSearchParams({ ...p, access_token: tk, limit: "200" })}`;
  let dem = 0;
  const taiKhoan: Obj[] = [];
  for await (const t of trangMeta(q("me/adaccounts", { fields: "account_id,name,currency" }))) taiKhoan.push(...t);
  dem += await upsert("qc_meta_tai_khoan", taiKhoan.map(ax.anhXaMetaTaiKhoan), "id");
  for (const a of taiKhoan) {
    const id = ax.anhXaMetaTaiKhoan(a).id, act = `act_${id}`;
    const lay = async (path: string, fields: string, extra: Record<string, string> = {}) => { const ra: Obj[] = []; for await (const t of trangMeta(q(`${act}/${path}`, { fields, ...extra }))) ra.push(...t); return ra; };
    const cd = await lay("campaigns", "id,name,objective,status,effective_status,daily_budget,lifetime_budget,start_time,stop_time");
    dem += await upsert("qc_meta_chien_dich", cd.map((c) => ax.anhXaMetaChienDich(c, id)), "id");
    dem += await upsert("qc_meta_nhom", (await lay("adsets", "id,campaign_id,name,status,effective_status,daily_budget")).map(ax.anhXaMetaNhom), "id");
    const qc = await lay("ads", "id,adset_id,campaign_id,name,status,effective_status,creative{id}");
    dem += await upsert("qc_meta_quang_cao", qc.map(ax.anhXaMetaQuangCao), "id");
    const co = new Set(qc.map((x) => String(x.id)));
    const sl = await lay("insights", "ad_id,spend,impressions,clicks,reach,actions,action_values", { level: "ad", time_increment: "1", time_range: JSON.stringify({ since: lui(soNgay), until: lui(0) }) });
    dem += await upsert("qc_meta_so_lieu", sl.filter((r) => co.has(String(r.ad_id))).map(ax.anhXaMetaSoLieuDayDu), "quang_cao_id,ngay");
    await dbHr().from("qc_meta_tai_khoan").update({ dong_bo_luc: new Date().toISOString() }).eq("id", id);
  }
  return dem;
}

async function tikTok(path: string, p: Record<string, string>): Promise<Obj[]> {
  const ra: Obj[] = [];
  for (let trang = 1; trang <= 200; trang++) {
    const r = await fetch(`${BASE_TT()}/${path}?${new URLSearchParams({ ...p, page: String(trang), page_size: "1000" })}`, { headers: { "Access-Token": process.env.TIKTOK_ADS_ACCESS_TOKEN! }, cache: "no-store" });
    const j = (await r.json()) as { code?: number; message?: string; data?: { list?: Obj[]; page_info?: { total_page?: number } } };
    if (!r.ok || j.code !== 0) throw new Error(`TikTok: ${(j.message ?? r.statusText).slice(0, 160)}`);
    ra.push(...(j.data?.list ?? []));
    if (trang >= (j.data?.page_info?.total_page ?? 1)) break;
  }
  return ra;
}

export async function dongBoTikTok(soNgay = 30): Promise<number> {
  const r = await fetch(`${BASE_TT()}/oauth2/advertiser/get/?${new URLSearchParams({ app_id: process.env.TIKTOK_ADS_APP_ID!, secret: process.env.TIKTOK_ADS_APP_SECRET!, access_token: process.env.TIKTOK_ADS_ACCESS_TOKEN! })}`, { cache: "no-store" });
  const j = (await r.json()) as { code?: number; message?: string; data?: { list?: Obj[] } };
  if (!r.ok || j.code !== 0) throw new Error(`TikTok: ${(j.message ?? r.statusText).slice(0, 160)}`);
  const tk = j.data?.list ?? [];
  let dem = await upsert("qc_tiktok_tai_khoan", tk.map(ax.anhXaTikTokTaiKhoan), "id");
  for (const a of tk) {
    const id = String(a.advertiser_id), adv = { advertiser_id: id };
    dem += await upsert("qc_tiktok_chien_dich", (await tikTok("campaign/get/", adv)).map((c) => ax.anhXaTikTokChienDich(c, id)), "id");
    dem += await upsert("qc_tiktok_nhom", (await tikTok("adgroup/get/", adv)).map(ax.anhXaTikTokNhom), "id");
    const qc = await tikTok("ad/get/", adv);
    dem += await upsert("qc_tiktok_quang_cao", qc.map(ax.anhXaTikTokQuangCao), "id");
    const co = new Set(qc.map((x) => String(x.ad_id)));
    const bc = await tikTok("report/integrated/get/", { ...adv, report_type: "BASIC", data_level: "AUCTION_AD", dimensions: JSON.stringify(["ad_id", "stat_time_day"]), metrics: JSON.stringify(["spend", "impressions", "clicks", "reach", "conversion", "result"]), start_date: lui(soNgay), end_date: lui(0) });
    dem += await upsert("qc_tiktok_so_lieu", bc.map((x) => ax.anhXaTikTokSoLieu(x as { dimensions?: Obj; metrics?: Obj })).filter((x) => co.has(x.quang_cao_id)), "quang_cao_id,ngay");
  }
  return dem;
}

// ---- Shopee Open Platform v2 (API cấp shop). Access token Shopee chỉ sống ~4 giờ: khi có khoá thật cần thêm bước làm mới token (refresh_token) trước khi kéo; chưa có khoá nên chưa dựng. ----
const BASE_SP = () => process.env.SHOPEE_BASE_URL ?? "https://partner.shopeemobile.com";
const homNayVN = () => new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
const ddmmyyyy = (iso: string) => iso.split("-").reverse().join("-");

async function goiShopee(duongDan: string, tham: Record<string, string>): Promise<Obj> {
  const doiTacId = process.env.SHOPEE_PARTNER_ID!, shopId = process.env.SHOPEE_SHOP_ID!, accessToken = process.env.SHOPEE_ACCESS_TOKEN!;
  const thoiGian = Math.floor(Date.now() / 1000);
  const sign = await kyShopee(process.env.SHOPEE_PARTNER_KEY!, { doiTacId, duongDan, thoiGian, accessToken, shopId });
  const r = await fetch(`${BASE_SP()}${duongDan}?${new URLSearchParams({ partner_id: doiTacId, timestamp: String(thoiGian), access_token: accessToken, shop_id: shopId, sign, ...tham })}`, { cache: "no-store" });
  const j = (await r.json()) as Obj;
  if (!r.ok || j.error) throw new Error(`Shopee: ${String(j.message ?? j.error ?? r.statusText).slice(0, 160)}`);
  return (j.response as Obj | undefined) ?? {};
}

export async function dongBoShopee(soNgay = 30): Promise<number> {
  const shopId = process.env.SHOPEE_SHOP_ID!;
  const info = await goiShopee("/api/v2/shop/get_shop_info", {});
  let dem = await upsert("qc_shopee_gian_hang", [{ id: shopId, ten: String(info.shop_name ?? `Shop ${shopId}`), khu_vuc: info.region ? String(info.region) : null }], "id");
  const den = Math.floor(Date.now() / 1000), tu = den - soNgay * 86400;
  const maDon: string[] = [];
  for (let a = tu; a < den; a += 14 * 86400) {          // Shopee giới hạn mỗi lần hỏi tối đa 15 ngày
    let cursor = "";
    for (let i = 0; i < 100; i++) {
      const r = await goiShopee("/api/v2/order/get_order_list", { time_range_field: "create_time", time_from: String(a), time_to: String(Math.min(a + 14 * 86400, den)), page_size: "100", ...(cursor ? { cursor } : {}) });
      for (const o of (r.order_list as Obj[] | undefined) ?? []) maDon.push(String(o.order_sn));
      if (!r.more) break;
      cursor = String(r.next_cursor ?? "");
    }
  }
  const dons: ReturnType<typeof ax.anhXaShopeeDon>[] = [];
  for (let i = 0; i < maDon.length; i += 50) {
    const r = await goiShopee("/api/v2/order/get_order_detail", { order_sn_list: maDon.slice(i, i + 50).join(","), response_optional_fields: "item_list,total_amount,actual_shipping_fee" });
    for (const o of (r.order_list as Obj[] | undefined) ?? []) dons.push(ax.anhXaShopeeDon(o, shopId));
  }
  dem += await upsert("qc_shopee_don_hang", dons, "ma_don");
  dem += await upsert("qc_shopee_so_lieu_ngay", ax.gopDonTheoNgay(dons).map((x) => ({ gian_hang_id: shopId, ...x })), "gian_hang_id,ngay");
  const qc = await goiShopee("/api/v2/ads/get_all_cpc_ads_daily_performance", { start_date: ddmmyyyy(lui(soNgay)), end_date: ddmmyyyy(homNayVN()) });
  const dong = (Array.isArray(qc) ? qc : ((qc.response as Obj[] | undefined) ?? [])) as Obj[];
  dem += await upsert("qc_shopee_so_lieu_ngay", dong.map((x) => ax.anhXaShopeeQuangCaoNgay(x, shopId)), "gian_hang_id,ngay");
  await dbHr().from("qc_shopee_gian_hang").update({ dong_bo_luc: new Date().toISOString() }).eq("id", shopId);
  return dem;
}

/** Chạy một nền tảng, ghi nhật ký. Chưa có khoá thì ghi "Bỏ qua" (không phải lỗi). Không bao giờ ném lỗi ra ngoài. */
export async function chayDongBo(nt: "Facebook" | "TikTok" | "Shopee"): Promise<{ trangThai: string; soDong: number; ghiChu?: string }> {
  const db = dbHr();
  const khoa = trangThaiKhoa(process.env);
  if (!(nt === "Facebook" ? khoa.facebook : nt === "TikTok" ? khoa.tiktok : khoa.shopee)) {
    const ghiChu = "Chưa khai khoá API";
    await db.from("qc_nhat_ky_dong_bo").insert({ nen_tang: nt, trang_thai: "Bỏ qua", ket_thuc: new Date().toISOString(), ghi_chu: ghiChu });
    return { trangThai: "Bỏ qua", soDong: 0, ghiChu };
  }
  const { data: nk } = await db.from("qc_nhat_ky_dong_bo").insert({ nen_tang: nt }).select("id").single();
  try {
    const so = await (nt === "Facebook" ? dongBoMeta() : nt === "TikTok" ? dongBoTikTok() : dongBoShopee());
    await db.from("qc_nhat_ky_dong_bo").update({ trang_thai: "Thành công", ket_thuc: new Date().toISOString(), so_dong: so }).eq("id", nk?.id);
    return { trangThai: "Thành công", soDong: so };
  } catch (e) {
    const ghiChu = (e as Error).message.slice(0, 300);
    await db.from("qc_nhat_ky_dong_bo").update({ trang_thai: "Lỗi", ket_thuc: new Date().toISOString(), ghi_chu: ghiChu }).eq("id", nk?.id);
    return { trangThai: "Lỗi", soDong: 0, ghiChu };
  }
}
