export const dynamic = "force-dynamic";

import Link from "next/link";
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
          <section key={g.so} className="the-noi the-noi-thap p-4 sm:p-5">
            <h2 className="mb-3 flex items-baseline gap-2 text-[15px] font-semibold text-muc">
              <span className="tabular-nums text-muc-3">{g.so}</span>
              {g.ten}
            </h2>
            <ul className="space-y-1">
              {g.muc.map((m) => (
                <li key={m.duong_dan}>
                  <Link
                    href={m.duong_dan}
                    className="group flex items-start gap-3 rounded-nho px-2 py-2 hover:bg-giay-tram"
                  >
                    <m.icon
                      strokeWidth={1.6}
                      className="mt-0.5 h-[18px] w-[18px] shrink-0 text-nhan"
                    />
                    <span className="min-w-0">
                      <span className="block text-[14px] font-medium text-muc group-hover:underline">
                        {m.ten}
                      </span>
                      <span className="block text-[12.5px] leading-snug text-muc-3">
                        {m.moTa}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
              {g.sapCo.map((ten) => (
                <li
                  key={ten}
                  className="flex items-center gap-3 px-2 py-2 text-[14px] text-muc-3"
                >
                  <span className="h-[18px] w-[18px] shrink-0" aria-hidden />
                  <span className="flex-1">{ten}</span>
                  <span className="rounded-tag bg-giay-tram px-1.5 py-0.5 text-[11px] text-muc-2">
                    Sắp có
                  </span>
                </li>
              ))}
              {g.muc.length === 0 && g.sapCo.length === 0 && (
                <li className="px-2 py-2 text-[13px] text-muc-3">
                  Chưa có mục nào dành cho vai trò của bạn.
                </li>
              )}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
