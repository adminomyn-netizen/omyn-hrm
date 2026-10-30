export const dynamic = "force-dynamic";

import Link from "next/link";
import { Plus } from "lucide-react";
import { yeuCauVaiTro } from "@/lib/auth";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NUT_CHINH } from "@/components/ui/dinh-dang";
import { dbHr } from "@/lib/hr-db";

type Dong = { id: string; nhan_vien_id: string; loai: string; ngay_lam_viec_cuoi: string; trang_thai: string; nhan_vien: { ho_ten: string; chuc_danh: string | null } | null; nghi_viec_muc: { xong: boolean; bat_buoc: boolean }[] };
const dMY = (s: string) => s.split("-").reverse().join("/");

/** Nghỉ việc & bàn giao: các hồ sơ đang bàn giao (tiến độ checklist, ngày làm việc cuối) và đã đóng. Chỉ Quản trị/Kỹ thuật. */
export default async function TrangNghiViec({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  await yeuCauVaiTro(["admin", "ky_thuat"]);
  const tab = (await searchParams).tab === "da-dong" ? "da-dong" : "dang";
  const { data } = await dbHr().from("nghi_viec").select("id, nhan_vien_id, loai, ngay_lam_viec_cuoi, trang_thai, nhan_vien(ho_ten, chuc_danh), nghi_viec_muc(xong, bat_buoc)").in("trang_thai", tab === "dang" ? ["Đang bàn giao"] : ["Đã đóng", "Huỷ"]).order("ngay_lam_viec_cuoi", { ascending: tab === "dang" }).limit(200);
  const ds = (data ?? []) as unknown as Dong[];
  const homNay = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" });
  return (
    <>
      <TieuDeTrang tieuDe="Nghỉ việc và bàn giao" phu="Mỗi người nghỉ có một hồ sơ: bàn giao, chốt công-lương-BHXH, phỏng vấn thôi việc. Chưa chốt đủ thì chưa đóng được.">
        <Link href="/nghi-viec/moi" className={`${NUT_CHINH} inline-flex items-center gap-2 leading-10`}><Plus className="h-4 w-4" strokeWidth={1.8} />Mở hồ sơ</Link>
      </TieuDeTrang>
      <nav className="mb-4 flex gap-1" aria-label="Danh sách hồ sơ">
        {[["dang", "Đang bàn giao"], ["da-dong", "Đã đóng / huỷ"]].map(([k, t]) => (
          <Link key={k} href={`/nghi-viec?tab=${k}`} aria-current={tab === k ? "page" : undefined} className={`rounded-nho px-3 py-1.5 text-[14px] ${tab === k ? "bg-giay-tram font-semibold text-muc" : "text-muc-2 hover:bg-giay-tram"}`}>{t}</Link>
        ))}
      </nav>
      {ds.length === 0 ? <p className="the-noi the-noi-thap px-5 py-12 text-center text-[14px] text-muc-3">{tab === "dang" ? "Chưa có hồ sơ nghỉ việc nào đang mở." : "Chưa có hồ sơ nào đã đóng."}</p> : (
        <ul className="the-noi the-noi-thap divide-y divide-vien">
          {ds.map((d) => {
            const bb = d.nghi_viec_muc.filter((m) => m.bat_buoc), xong = bb.filter((m) => m.xong).length;
            const con = Math.round((Date.parse(`${d.ngay_lam_viec_cuoi}T00:00:00Z`) - Date.parse(`${homNay}T00:00:00Z`)) / 86_400_000);
            return (
              <li key={d.id}>
                <Link href={`/nghi-viec/${d.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3.5 hover:bg-giay-tram/60">
                  <span className="min-w-0 flex-1 basis-48"><span className="block truncate text-[15px] font-medium text-muc">{d.nhan_vien?.ho_ten ?? "—"}</span><span className="block truncate text-[13px] text-muc-3">{d.nhan_vien?.chuc_danh ?? "—"} · {d.loai} · làm việc đến {dMY(d.ngay_lam_viec_cuoi)}</span></span>
                  {d.trang_thai === "Đang bàn giao" ? (
                    <>
                      <span className="text-[13px] text-muc-2">{xong}/{bb.length} mục bắt buộc</span>
                      <NhanTrangThai kieu={con < 0 ? "loi" : con <= 7 ? "cho" : "tram"}>{con < 0 ? `Quá ${-con} ngày` : con === 0 ? "Hôm nay là ngày cuối" : `Còn ${con} ngày`}</NhanTrangThai>
                    </>
                  ) : <NhanTrangThai kieu={d.trang_thai === "Đã đóng" ? "tot" : "tram"}>{d.trang_thai}</NhanTrangThai>}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
