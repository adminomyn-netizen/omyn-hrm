export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { PencilLine, Settings2 } from "lucide-react";
import { ThanhDiem, dinhDangDiem } from "@/components/bsc/ThanhDiem";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { NUT_PHU } from "@/components/ui/dinh-dang";
import { layNguoiDungDaDuyet } from "@/lib/auth";
import { dbHr } from "@/lib/hr-db";
import { docNamThang, taiBsc } from "@/lib/bsc-data";

const SO = (n: number | null) => (n === null ? "—" : n.toLocaleString("vi-VN", { maximumFractionDigits: 2 }));

/** Bản đồ chiến lược BSC theo 4 góc nhìn: điểm đạt từng mục tiêu và chỉ số đến hết tháng chọn. Quản trị/Kỹ thuật và trưởng phòng; nhân viên xem "Mục tiêu của tôi". */
export default async function TrangBsc({ searchParams }: { searchParams: Promise<{ nam?: string; thang?: string }> }) {
  const nd = await layNguoiDungDaDuyet();
  const quanTri = nd.vaiTro === "admin" || nd.vaiTro === "ky_thuat";
  if (!quanTri) {
    const { data: toi } = await dbHr().from("nhan_vien").select("id").eq("user_id", nd.id).maybeSingle();
    const { count } = toi ? await dbHr().from("nhan_vien").select("id", { count: "exact", head: true }).eq("quan_ly_id", toi.id) : { count: 0 };
    if (!count) redirect("/bsc/cua-toi");
  }
  const sp = await searchParams;
  const { nam, thang } = docNamThang(sp.nam, sp.thang);
  const b = await taiBsc(nam, thang);
  const lk = (n: number, t: number) => `/bsc?nam=${n}&thang=${t}`;
  return (
    <>
      <TieuDeTrang tieuDe="Mục tiêu BSC" phu={`Năm ${nam} · đến hết tháng ${thang}${b.khoa.has(thang) ? " · đã khoá" : ""}`}>
        <Link href="/bsc/cua-toi" className={NUT_PHU}>Mục tiêu của tôi</Link>
        {quanTri && <><Link href={`/bsc/so-lieu?nam=${nam}&thang=${thang}`} className={`${NUT_PHU} inline-flex items-center gap-2`}><PencilLine strokeWidth={1.7} className="h-4 w-4" aria-hidden />Nhập số liệu</Link><Link href="/hr/bsc-muc-tieu" className={`${NUT_PHU} inline-flex items-center gap-2`}><Settings2 strokeWidth={1.7} className="h-4 w-4" aria-hidden />Cấu hình</Link></>}
      </TieuDeTrang>
      <nav aria-label="Chọn kỳ" className="mb-6 flex flex-wrap items-center gap-2">
        <Link href={lk(nam - 1, thang)} className="rounded-tag border border-vien-dam px-3 py-1.5 text-[13px] font-medium text-muc-2 hover:bg-giay-tram">{nam - 1}</Link>
        <span className="nut-vang rounded-tag px-3 py-1.5 text-[13px] font-medium">{nam}</span>
        <Link href={lk(nam + 1, thang)} className="rounded-tag border border-vien-dam px-3 py-1.5 text-[13px] font-medium text-muc-2 hover:bg-giay-tram">{nam + 1}</Link>
        <span className="mx-1 w-px self-stretch bg-vien-dam" aria-hidden />
        {Array.from({ length: 12 }, (_, i) => i + 1).map((t) => <Link key={t} href={lk(nam, t)} aria-current={t === thang ? "page" : undefined} className={`rounded-tag px-2.5 py-1.5 text-[13px] font-medium ${t === thang ? "nut-vang" : "border border-vien-dam text-muc-2 hover:bg-giay-tram"}`}>T{t}</Link>)}
      </nav>

      {!b.coMucTieu ? (
        <p className="rounded-nho border border-vien bg-giay-sang p-5 text-[14px] text-muc-2">Chưa có mục tiêu BSC nào. {quanTri ? <>Thêm ở <Link href="/hr/bsc-muc-tieu" className="text-nhan-dam underline-offset-4 hover:underline">Mục tiêu chiến lược</Link>, rồi thêm chỉ số ở <Link href="/hr/bsc-chi-so" className="text-nhan-dam underline-offset-4 hover:underline">Chỉ số BSC</Link>.</> : "Quản trị sẽ thêm mục tiêu."}</p>
      ) : (
        <>
          <section aria-label="Điểm tổng" className="the-noi mb-8 rounded-nho border border-vien bg-giay-sang p-5">
            <div className="text-[13px] text-muc-3">Điểm BSC toàn công ty</div>
            <div className="chu-tieu-de mt-1 text-[40px] leading-none text-nhan-dam">{dinhDangDiem(b.cay.tong)}</div>
            <div className="mt-3 max-w-md"><ThanhDiem diem={b.cay.tong} /></div>
          </section>
          <div className="space-y-8">
            {b.cay.goc.map((g) => (
              <section key={g.id} aria-label={g.ten}>
                <div className="mb-3 flex flex-wrap items-center gap-3">
                  <h2 className="text-[13px] font-medium uppercase tracking-[0.08em] text-muc-3">{g.ten}</h2>
                  <NhanTrangThai kieu="tram">{dinhDangDiem(g.diem)}</NhanTrangThai>
                  {g.canhBao && <NhanTrangThai kieu="cho">Trọng số các mục tiêu chưa đủ 100%</NhanTrangThai>}
                </div>
                {g.mucTieu.length === 0 ? <p className="rounded-nho border border-vien bg-giay-sang p-4 text-[14px] text-muc-3">Góc nhìn này chưa có mục tiêu.</p> : (
                  <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                    {g.mucTieu.map((m) => (
                      <li key={m.id} className="the-noi rounded-nho border border-vien bg-giay-sang p-4">
                        <div className="text-[15px] font-semibold text-muc">{m.ten}</div>
                        {m.moTa && <p className="mt-0.5 text-[13px] text-muc-3">{m.moTa}</p>}
                        <div className="mt-3"><ThanhDiem diem={m.diem} /></div>
                        {m.canhBao && <p className="mt-2 text-[12px] text-canh-bao">Trọng số các chỉ số cộng lại {m.tongTrongSo.toLocaleString("vi-VN")}% (nên đủ 100%).</p>}
                        {m.chiSo.length > 0 ? (
                          <ul className="mt-3 divide-y divide-vien border-t border-vien">
                            {m.chiSo.map((c) => (
                              <li key={c.id} className="py-2.5">
                                <div className="flex items-baseline justify-between gap-3"><span className="min-w-0 truncate text-[14px] text-muc">{c.ten}</span><span className="shrink-0 text-[12px] text-muc-3">tỷ trọng {c.trongSo.toLocaleString("vi-VN")}%</span></div>
                                <div className="mt-1.5"><ThanhDiem diem={c.diem} nho /></div>
                                <div className="mt-1 text-[12px] text-muc-3">Tháng {thang}: kế hoạch {SO(c.keThang)} · thực tế {SO(c.thucThang)}{c.donVi ? ` ${c.donVi}` : ""}</div>
                              </li>
                            ))}
                          </ul>
                        ) : <p className="mt-3 text-[13px] text-muc-3">Chưa có chỉ số cho năm {nam}.</p>}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>
        </>
      )}
    </>
  );
}
