export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { redirect } from "next/navigation";
import { layNguoiDungHienTai } from "@/lib/auth";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { chiaNhomNhanSu, locMenuTheoVaiTro } from "@/lib/nav";

/** Trang chủ Nhân sự: toàn bộ mục xếp đúng 10 nhóm (mẫu chị Lâm 30/10/2026), mỗi màn chỉ một chỗ; màn chưa làm có nhãn “Sắp có”. Mỗi vai trò chỉ thấy mục mình được dùng. */
export default async function TrangChuNhanSu() {
  const nd = await layNguoiDungHienTai();
  if (!nd) redirect("/dang-nhap");
  if (nd.vaiTro === "cho_duyet") redirect("/cho-duyet");
  const { nhom } = chiaNhomNhanSu(locMenuTheoVaiTro(nd.vaiTro));
  return (
    <>
      <TieuDeTrang
        tieuDe="Nhân sự"
        phu="Mười nhóm việc nhân sự, mỗi màn nằm đúng một nhóm."
      />
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {nhom.map((g) => (
          <section key={g.so} data-m={g.so} className="mau-nhom the-noi the-noi-thap mau-vach overflow-hidden">
            <header className="mau-nen flex items-center gap-3 px-4 py-3 sm:px-5">
              <span className="mau-chip flex h-9 w-9 shrink-0 items-center justify-center rounded-nho border mau-vien bg-giay-sang text-[16px] font-semibold tabular-nums text-[var(--m-chu)]">{g.so}</span>
              <h2 className="mau-chu min-w-0 flex-1 text-[16px] font-semibold">{g.ten}</h2>
              <span className="rounded-tag bg-giay-sang px-2 py-0.5 text-[12px] font-medium text-muc-2">{g.muc.length} màn{g.sapCo.length > 0 ? ` · ${g.sapCo.length} sắp có` : ""}</span>
            </header>
            <ul className="space-y-0.5 p-2 sm:p-3">
              {g.muc.map((m) => (
                <li key={m.duong_dan}>
                  <Link href={m.duong_dan} className="mau-hover group flex items-center gap-3 rounded-nho px-2 py-2.5">
                    <span className="mau-chip flex h-10 w-10 shrink-0 items-center justify-center rounded-nho"><m.icon strokeWidth={1.7} className="h-5 w-5" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[14.5px] font-semibold text-muc group-hover:underline">{m.ten}</span>
                      <span className="line-clamp-2 block text-[12.5px] leading-snug text-muc-3">{m.moTa}</span>
                    </span>
                    <ArrowRight strokeWidth={1.7} className="mau-chu h-4 w-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                </li>
              ))}
              {g.sapCo.map((ten) => (
                <li key={ten} className="flex items-center gap-3 rounded-nho px-2 py-2">
                  <span className="mau-vien flex h-10 w-10 shrink-0 items-center justify-center rounded-nho border border-dashed text-muc-3"><Clock strokeWidth={1.6} className="h-[18px] w-[18px]" /></span>
                  <span className="min-w-0 flex-1 text-[14px] text-muc-3">{ten}</span>
                  <span className="mau-chip rounded-tag px-2 py-0.5 text-[11.5px] font-medium">Sắp có</span>
                </li>
              ))}
              {g.muc.length === 0 && g.sapCo.length === 0 && <li className="px-2 py-3 text-[13px] text-muc-3">Chưa có mục nào dành cho vai trò của bạn.</li>}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
