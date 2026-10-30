export const dynamic = "force-dynamic";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { yeuCauVaiTro } from "@/lib/auth";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { docDuLieuLich } from "@/lib/lich-nhan-su-data";
import { TEN_LOAI, suKienThang, type LoaiSuKien } from "@/lib/lich-nhan-su";

const MAU: Record<LoaiSuKien, "tot" | "cho" | "loi" | "tram"> = { "hop-dong": "cho", "thu-viec": "cho", "sinh-nhat": "tot", "nghi-phep": "tram", "danh-gia": "tram", "bao-cao": "loi", bhxh: "loi" };
const THU = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"];
const dm = (s: string) => `${s.slice(8)}/${s.slice(5, 7)}`;

/** Lịch nhân sự theo tháng: hợp đồng sắp hết hạn, hết thử việc, sinh nhật, nghỉ phép, đánh giá, hạn báo cáo nhà nước, hạn báo BHXH. Chỉ Quản trị/Kỹ thuật (có sinh nhật và nghỉ phép của mọi người). */
export default async function TrangLichNhanSu({ searchParams }: { searchParams: Promise<{ thang?: string; loai?: string }> }) {
  await yeuCauVaiTro(["admin", "ky_thuat"]);
  const sp = await searchParams;
  const homNay = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" });
  const m = /^(20\d{2})-(0[1-9]|1[0-2])$/.exec(sp.thang ?? "") ?? /^(\d{4})-(\d{2})/.exec(homNay)!;
  const nam = Number(m[1]), thang = Number(m[2]);
  const loaiLoc = (Object.keys(TEN_LOAI) as LoaiSuKien[]).find((k) => k === sp.loai);
  const tatCa = suKienThang(await docDuLieuLich(nam, thang), nam, thang);
  const ds = loaiLoc ? tatCa.filter((s) => s.loai === loaiLoc) : tatCa;
  const truoc = thang === 1 ? `${nam - 1}-12` : `${nam}-${String(thang - 1).padStart(2, "0")}`;
  const sau = thang === 12 ? `${nam + 1}-01` : `${nam}-${String(thang + 1).padStart(2, "0")}`;
  const theoNgay = new Map<string, typeof ds>();
  for (const s of ds) theoNgay.set(s.ngay, [...(theoNgay.get(s.ngay) ?? []), s]);
  const lk = (t: string, loai?: string) => `/lich-nhan-su?thang=${t}${loai ? `&loai=${loai}` : ""}`;
  return (
    <>
      <TieuDeTrang tieuDe={`Lịch nhân sự · tháng ${thang}/${nam}`} phu="Mọi mốc cần nhớ trong tháng. Hạn BHXH và báo cáo nhà nước ghi “chờ kế toán/luật sư xác nhận”.">
        <Link href={lk(truoc, loaiLoc)} aria-label="Tháng trước" className="rounded-nho p-2 text-muc-2 hover:bg-giay-tram"><ChevronLeft className="h-5 w-5" strokeWidth={1.6} /></Link>
        <Link href={lk(homNay.slice(0, 7), loaiLoc)} className="text-[13px] font-medium text-nhan-dam underline-offset-4 hover:underline">Tháng này</Link>
        <Link href={lk(sau, loaiLoc)} aria-label="Tháng sau" className="rounded-nho p-2 text-muc-2 hover:bg-giay-tram"><ChevronRight className="h-5 w-5" strokeWidth={1.6} /></Link>
      </TieuDeTrang>
      <nav className="mb-5 flex flex-wrap gap-1.5" aria-label="Lọc theo loại">
        <Link href={lk(`${nam}-${String(thang).padStart(2, "0")}`)} className={`rounded-nho px-3 py-1.5 text-[13px] ${!loaiLoc ? "bg-giay-tram font-semibold text-muc" : "text-muc-2 hover:bg-giay-tram"}`}>Tất cả ({tatCa.length})</Link>
        {(Object.keys(TEN_LOAI) as LoaiSuKien[]).map((k) => (
          <Link key={k} href={lk(`${nam}-${String(thang).padStart(2, "0")}`, k)} className={`rounded-nho px-3 py-1.5 text-[13px] ${loaiLoc === k ? "bg-giay-tram font-semibold text-muc" : "text-muc-2 hover:bg-giay-tram"}`}>{TEN_LOAI[k]} ({tatCa.filter((s) => s.loai === k).length})</Link>
        ))}
      </nav>
      {theoNgay.size === 0 ? <p className="the-noi the-noi-thap px-5 py-12 text-center text-[14px] text-muc-3">Không có mốc nào trong tháng này.</p> : (
        <div className="the-noi the-noi-thap divide-y divide-vien">
          {[...theoNgay.entries()].map(([ngay, ss]) => (
            <section key={ngay} className="flex gap-4 px-4 py-3.5">
              <div className={`w-20 shrink-0 ${ngay === homNay ? "text-nhan-dam" : "text-muc-2"}`}><div className="text-[18px] font-semibold tabular-nums">{dm(ngay)}</div><div className="text-[12px]">{THU[new Date(`${ngay}T00:00:00Z`).getUTCDay()]}{ngay === homNay ? " · hôm nay" : ""}</div></div>
              <ul className="min-w-0 flex-1 space-y-2">
                {ss.map((s, i) => (
                  <li key={i} className="flex flex-wrap items-start gap-x-3 gap-y-1 text-[14px]">
                    <NhanTrangThai kieu={MAU[s.loai]}>{TEN_LOAI[s.loai]}</NhanTrangThai>
                    <span className="min-w-0 flex-1">{s.href ? <Link href={s.href} className="text-muc hover:underline">{s.tieuDe}</Link> : <span className="text-muc">{s.tieuDe}</span>}{s.phu && <span className="block text-[13px] text-muc-3">{s.phu}</span>}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
      <p className="mt-4 text-[13px] text-muc-3">Hạn báo cáo cơ quan nhà nước: nhập mốc ở <Link href="/hr/han-bao-cao-nha-nuoc" className="text-nhan-dam underline-offset-4 hover:underline">Hạn báo cáo nhà nước</Link> (chưa nhập thì không hiện và không nhắc).</p>
    </>
  );
}
