export const dynamic = "force-dynamic";

import Link from "next/link";
import { yeuCauVaiTro } from "@/lib/auth";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { layChiSoHr } from "@/lib/chi-so-hr-data";
import type { ChiSo } from "@/lib/chi-so-hr";

function TheChiSo({ c }: { c: ChiSo }) {
  const trong = c.giaTri === null;
  return (
    <article id={c.ma} className="mau-vien rounded-nho border bg-giay p-4">
      <h3 className="text-[14px] font-medium text-muc-2">{c.ten}</h3>
      {trong ? (
        <p className="mt-2 text-[22px] font-semibold text-muc-3">—</p>
      ) : (
        <p className="mau-chu mt-2 text-[22px] font-semibold tabular-nums">{c.giaTri}</p>
      )}
      {c.phu && <p className="mt-1 text-[13px] text-muc-3">{c.phu}</p>}
      {c.canNhap && (
        <p role="status" className="mt-2 rounded-nho bg-giay-tram px-3 py-2 text-[13px] text-muc-2">
          {trong ? "Cần nhập: " : "Lưu ý: "}
          {c.canNhap}
        </p>
      )}
      {c.bang && (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-left text-[12px] font-medium text-muc-3">
                {c.bang.cot.map((h, i) => <th key={h} className={`py-1.5 pr-3 ${i > 0 && c.bang!.cot.length > 2 ? "text-right" : ""}`}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {c.bang.dong.map((r, i) => (
                <tr key={i} className="border-t border-vien">
                  {r.map((o, j) => <td key={j} className={`py-1.5 pr-3 tabular-nums ${j > 0 && r.length > 2 ? "text-right" : ""}`}>{o}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {c.href && (
        <Link href={c.href} className="mau-chu mt-3 inline-block text-[13px] font-medium underline-offset-2 hover:underline">
          {c.hrefNhan ?? "Mở màn liên quan"}
        </Link>
      )}
    </article>
  );
}

/** Báo cáo riêng của HR: 10 nhóm, 29 chỉ số, tên tiếng Việt. Chỉ số chưa có dữ liệu để trống và ghi rõ cần nhập gì. Chỉ Quản trị/Kỹ thuật. */
export default async function TrangBaoCaoHr() {
  await yeuCauVaiTro(["admin", "ky_thuat"]);
  const nhom = await layChiSoHr();
  const tong = nhom.reduce((a, n) => a + n.chiSo.length, 0);
  const coSo = nhom.reduce((a, n) => a + n.chiSo.filter((c) => c.giaTri !== null).length, 0);
  return (
    <>
      <TieuDeTrang tieuDe="Báo cáo HR" phu={`${tong} chỉ số trong 10 nhóm. Đã có số ${coSo}, còn ${tong - coSo} chỉ số chờ nhập dữ liệu. Mọi số lấy từ sổ đã có, không nhập tay ở đây.`} />
      <nav aria-label="Các nhóm chỉ số" className="mb-5 flex flex-wrap gap-2">
        {nhom.map((n) => (
          <a key={n.so} href={`#nhom-${n.so}`} data-m={n.so} className="mau-nhom mau-chip inline-flex items-center gap-1.5 rounded-nho px-2.5 py-1.5 text-[13px] font-medium">
            <span className="tabular-nums">{n.so}</span>
            {n.ten}
          </a>
        ))}
      </nav>
      <div className="space-y-6">
        {nhom.map((n) => (
          <section key={n.so} id={`nhom-${n.so}`} data-m={n.so} className="mau-nhom scroll-mt-20">
            <h2 className="mau-chu mb-3 flex items-center gap-2 text-[17px] font-semibold">
              <span className="mau-chip inline-flex h-6 min-w-6 items-center justify-center rounded-nho px-1.5 text-[13px] tabular-nums">{n.so}</span>
              {n.ten}
            </h2>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {n.chiSo.map((c) => <TheChiSo key={c.ma} c={c} />)}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
