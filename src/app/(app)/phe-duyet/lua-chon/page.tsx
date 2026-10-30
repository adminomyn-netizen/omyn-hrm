export const dynamic = "force-dynamic";

import Link from "next/link";
import { yeuCauVaiTro } from "@/lib/auth";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { MAU_PHIEU } from "@/lib/phe-duyet-mau";
import { docDanhMuc, docNhomMa } from "@/lib/phe-duyet-data";

const TEN_NHOM: Record<string, string> = { HR: "Nhân sự", FIN: "Tài chính", MKT: "Marketing", ADM: "Hành chính" };
const MAU_NHOM: Record<string, number> = { HR: 1, FIN: 7, MKT: 5, ADM: 3 };
const THU_TU_NHOM = ["HR", "FIN", "ADM", "MKT"];

/** Lựa chọn trong phiếu: mỗi loại phiếu một khối, cho thấy ô nào của phiếu lấy danh sách nào. Sửa danh sách ở màn "Sửa danh sách lựa chọn". Chỉ Quản trị/Kỹ thuật. */
export default async function TrangLuaChonPhieu() {
  await yeuCauVaiTro(["admin", "ky_thuat"]);
  const [dm, nhomMa] = await Promise.all([docDanhMuc(), docNhomMa()]);
  const phieu = MAU_PHIEU.map((p) => ({
    ma: p.ma,
    ten: p.ten,
    nhom: nhomMa[p.ma]?.nhom ?? p.nhomMacDinh,
    dung: nhomMa[p.ma]?.dung ?? true,
    o: p.truong.filter((t) => t.kieu === "dm").map((t) => ({ ten: t.ten, loai: t.danhMuc ?? "" })),
  })).filter((p) => p.o.length > 0);
  const dungBoi = (loai: string) => phieu.filter((p) => p.o.some((x) => x.loai === loai));
  const giongHet = (loai: string) => Object.keys(dm).filter((k) => k !== loai && dm[k].length > 0 && dm[loai]?.length === dm[k].length && [...dm[loai]].sort().join("|") === [...dm[k]].sort().join("|"));
  const nhomCo = [...new Set(phieu.map((p) => p.nhom))].sort((a, b) => (THU_TU_NHOM.indexOf(a) + 1 || 99) - (THU_TU_NHOM.indexOf(b) + 1 || 99));
  const trong = [...new Set(phieu.flatMap((p) => p.o.map((x) => x.loai)))].filter((l) => !dm[l]?.length);
  return (
    <>
      <TieuDeTrang tieuDe="Lựa chọn trong phiếu" phu="Khi nộp phiếu, một số ô hiện danh sách để chọn (đơn vị, phòng ban, khoản chi…). Mỗi khối dưới đây là một loại phiếu và các ô chọn của nó.">
        <Link href="/hr/pd-danh-muc" className="nut-vang rounded-nho px-3.5 py-2 text-[14px] font-medium">Sửa danh sách lựa chọn</Link>
      </TieuDeTrang>
      {trong.length > 0 && (
        <p role="status" className="mb-5 rounded-nho bg-giay-tram px-3 py-2.5 text-[13px] text-muc-2">
          Chưa có lựa chọn nào cho: {trong.join(", ")}. Phiếu có các ô này đang cho nhập chữ tự do cho tới khi thêm danh sách.
        </p>
      )}
      <div className="space-y-7">
        {nhomCo.map((k) => (
          <section key={k} data-m={MAU_NHOM[k] ?? 9} className="mau-nhom">
            <h2 className="mau-nen mau-chu mb-3 inline-flex items-center rounded-nho px-3 py-1.5 text-[13px] font-semibold uppercase tracking-[0.1em]">{TEN_NHOM[k] ?? k}</h2>
            <div className="grid gap-3 lg:grid-cols-2">
              {phieu.filter((p) => p.nhom === k).map((p) => (
                <article key={p.ma} className="mau-vach the-noi the-noi-thap p-4">
                  <h3 className="mau-chu text-[15px] font-semibold">
                    {p.ten}
                    {!p.dung && <span className="ml-2 rounded-tag bg-giay-tram px-2 py-0.5 text-[12px] font-medium text-muc-3">Phiếu đang tắt</span>}
                  </h3>
                  <ul className="mt-3 space-y-3">
                    {p.o.map((x) => {
                      const ds = dm[x.loai] ?? [];
                      const chung = dungBoi(x.loai).filter((y) => y.ma !== p.ma);
                      const giong = giongHet(x.loai);
                      return (
                        <li key={`${x.ten}-${x.loai}`}>
                          <p className="text-[14px] font-medium text-muc">
                            {x.ten}
                            {x.ten !== x.loai && <span className="font-normal text-muc-3"> · danh sách “{x.loai}”</span>}
                          </p>
                          {ds.length ? (
                            <p className="mt-1 flex flex-wrap gap-1.5">
                              {ds.map((v) => <span key={v} className="mau-chip rounded-tag px-2 py-0.5 text-[12.5px]">{v}</span>)}
                            </p>
                          ) : (
                            <p className="mt-1 text-[13px] text-muc-3">Chưa có lựa chọn, ô này đang nhập chữ tự do.</p>
                          )}
                          {(chung.length > 0 || giong.length > 0) && (
                            <p className="mt-1 text-[12.5px] text-muc-3">
                              {chung.length > 0 && <>Dùng chung với: {chung.map((y) => y.ten).join(", ")}. Sửa một nơi, các phiếu này đổi theo. </>}
                              {giong.length > 0 && <>Nội dung giống hệt danh sách “{giong.join("”, “")}”.</>}
                            </p>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
