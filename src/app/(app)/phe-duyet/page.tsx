export const dynamic = "force-dynamic";

import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { yeuCauDangNhapDaDuyet } from "@/lib/phe-duyet-quyen";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NUT_CHINH } from "@/components/ui/dinh-dang";
import { dbHr } from "@/lib/hr-db";
import { COT_PHIEU, nhanVienCuaTaiKhoan, type PhieuTho } from "@/lib/phe-duyet-data";
import { mauTheoMa } from "@/lib/phe-duyet-mau";
import type { TrangThaiPhieu } from "@/lib/phe-duyet";

const TAB = [
  { ma: "cho-toi", ten: "Chờ tôi duyệt" },
  { ma: "cua-toi", ten: "Tôi đã nộp" },
  { ma: "ban-sao", ten: "Bản sao gửi tôi" },
  { ma: "tat-ca", ten: "Tất cả", quanLy: true },
] as const;
const MAU_TT: Record<TrangThaiPhieu, "tot" | "cho" | "loi" | "tram"> = { "Chờ duyệt": "cho", "Cần bổ sung": "cho", "Đã duyệt": "tot", "Từ chối": "loi", "Đã huỷ": "tram" };
const dMY = (iso: string) => new Date(iso).toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });

/** Phê duyệt: phiếu chờ tôi duyệt, phiếu tôi nộp, bản sao gửi tôi; Quản trị/Kỹ thuật xem tất cả. Tìm theo mã phiếu (HR-2610-0001), loại phiếu hoặc người nộp. */
export default async function TrangPheDuyet({ searchParams }: { searchParams: Promise<{ tab?: string; q?: string; nhom?: string }> }) {
  const nd = await yeuCauDangNhapDaDuyet();
  const sp = await searchParams;
  const laQuanLy = nd.vaiTro === "admin" || nd.vaiTro === "ky_thuat";
  const tabs = TAB.filter((t) => !("quanLy" in t) || laQuanLy);
  const tab = tabs.find((t) => t.ma === sp.tab)?.ma ?? tabs[0].ma;
  const q = (sp.q ?? "").trim().slice(0, 60);
  const nhomLoc = /^[A-Z]{2,6}$/.test(sp.nhom ?? "") ? sp.nhom! : "";
  const db = dbHr();
  const nv = await nhanVienCuaTaiKhoan(nd.id);

  let ids: string[] | null = null;
  if (tab === "cho-toi" || tab === "ban-sao") {
    const { data } = await db.from("pd_buoc").select("phieu_id, kieu, buoc").eq("user_id", nd.id).eq("trang_thai", tab === "ban-sao" ? "Đã xem" : "Chờ");
    ids = [...new Set(((data ?? []) as { phieu_id: string; kieu: string }[]).filter((x) => (tab === "ban-sao") === (x.kieu === "CC")).map((x) => x.phieu_id))];
  }
  let ds: PhieuTho[] = [];
  if (tab === "cua-toi" ? !!nv : ids === null || ids.length > 0) {
    let truyVan = db.from("pd_phieu").select(COT_PHIEU).order("tao_luc", { ascending: false }).limit(300);
    if (tab === "cua-toi") truyVan = truyVan.eq("nguoi_nop_id", nv!.id);
    else if (ids) truyVan = truyVan.in("id", ids);
    if (tab === "cho-toi") truyVan = truyVan.eq("trang_thai", "Chờ duyệt");
    if (nhomLoc) truyVan = truyVan.eq("nhom_ma", nhomLoc);
    ds = ((await truyVan).data ?? []) as unknown as PhieuTho[];
  }
  if (q) {
    const k = q.toLowerCase();
    ds = ds.filter((p) => p.so_phieu.toLowerCase().includes(k) || (mauTheoMa(p.ma_phieu)?.ten ?? "").toLowerCase().includes(k) || (p.nguoi_nop?.ho_ten ?? "").toLowerCase().includes(k));
  }
  const dem = ids?.length;
  const lienKet = (t: string, extra: Record<string, string> = {}) => `/phe-duyet?${new URLSearchParams({ tab: t, ...(q ? { q } : {}), ...(nhomLoc ? { nhom: nhomLoc } : {}), ...extra })}`;

  return (
    <>
      <TieuDeTrang tieuDe="Phê duyệt" phu="Phiếu đề nghị, đề xuất, xin phép — duyệt nhiều bước, có lịch sử và tệp đính kèm.">
        <Link href="/phe-duyet/moi" className={`${NUT_CHINH} inline-flex items-center gap-2 leading-10`}><Plus className="h-4 w-4" strokeWidth={1.8} />Tạo phiếu</Link>
      </TieuDeTrang>

      <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-3">
        <nav className="flex flex-wrap gap-1" aria-label="Danh sách phiếu">
          {tabs.map((t) => (
            <Link key={t.ma} href={lienKet(t.ma)} aria-current={t.ma === tab ? "page" : undefined} className={`rounded-nho px-3 py-1.5 text-[14px] ${t.ma === tab ? "bg-giay-tram font-semibold text-muc" : "text-muc-2 hover:bg-giay-tram"}`}>
              {t.ten}{t.ma === "cho-toi" && dem ? <span className="nut-vang ml-1.5 rounded-[10px] px-1.5 py-px text-[11px]">{dem}</span> : null}
            </Link>
          ))}
        </nav>
        <form action="/phe-duyet" className="relative ml-auto w-full sm:w-72" role="search">
          <input type="hidden" name="tab" value={tab} />
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muc-3" strokeWidth={1.6} />
          <input name="q" defaultValue={q} placeholder="Tìm mã phiếu, loại phiếu, người nộp" aria-label="Tìm phiếu" className="h-10 w-full rounded-nho border border-vien-dam bg-giay-sang pl-9 pr-3 text-[14px] outline-none placeholder:text-muc-3 focus:border-nhan" />
        </form>
      </div>

      {ds.length === 0 ? (
        <p className="the-noi the-noi-thap px-5 py-12 text-center text-[14px] text-muc-3">
          {q ? "Không có phiếu khớp." : tab === "cho-toi" ? "Không có phiếu nào đang chờ bạn duyệt." : tab === "cua-toi" ? "Bạn chưa nộp phiếu nào. Bấm “Tạo phiếu” để bắt đầu." : tab === "ban-sao" ? "Chưa có bản sao nào gửi bạn." : "Chưa có phiếu nào."}
        </p>
      ) : (
        <ul className="the-noi the-noi-thap divide-y divide-vien">
          {ds.map((p) => (
            <li key={p.id}>
              <Link href={`/phe-duyet/${p.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3.5 hover:bg-giay-tram/60">
                <span className="w-[118px] shrink-0 font-mono text-[13px] font-medium text-nhan-dam">{p.so_phieu}</span>
                <span className="min-w-0 flex-1 basis-48">
                  <span className="block truncate text-[15px] font-medium text-muc">{mauTheoMa(p.ma_phieu)?.ten ?? p.ma_phieu}</span>
                  <span className="block truncate text-[13px] text-muc-3">{p.nguoi_nop?.ho_ten ?? "—"} · {dMY(p.tao_luc)}</span>
                </span>
                <NhanTrangThai kieu={MAU_TT[p.trang_thai]}>{p.trang_thai === "Chờ duyệt" && p.buoc_hien_tai > 0 ? `Chờ duyệt · bước ${p.buoc_hien_tai}` : p.trang_thai}</NhanTrangThai>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
