export const dynamic = "force-dynamic";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { yeuCauVaiTro } from "@/lib/auth";
import { chiTieuTheoNgay, khoangNgay } from "@/lib/quang-cao";
import { bangQuangCao, type NenTang } from "@/lib/quang-cao-data";
import { homNayHcm } from "@/lib/kpi-data";

const TIEN = (n: number | null) => (n === null ? "—" : `${n.toLocaleString("vi-VN", { maximumFractionDigits: 0 })} đ`);
const SO = (n: number | null, du = 0) => (n === null ? "—" : n.toLocaleString("vi-VN", { maximumFractionDigits: du }));
const TEN_NT = { facebook: "Facebook", tiktok: "TikTok" } as const;

/** Quảng cáo Facebook + TikTok: số kéo về mỗi ngày, xem theo chiến dịch → nhóm → quảng cáo. Quản trị/Kỹ thuật. */
export default async function TrangQuangCao({ searchParams }: { searchParams: Promise<{ nt?: string; k?: string; cd?: string; nhom?: string }> }) {
  await yeuCauVaiTro(["admin", "ky_thuat"]);
  const sp = await searchParams;
  const nt: NenTang = sp.nt === "tiktok" ? "tiktok" : "facebook";
  const homNay = homNayHcm();
  const cacKhoang = khoangNgay(homNay);
  const kh = cacKhoang.find((x) => x.ma === sp.k) ?? cacKhoang[1];
  const lienKet = (o: { nt?: NenTang; k?: string; cd?: string | null; nhom?: string | null }) => {
    const q = new URLSearchParams({ nt: o.nt ?? nt, k: o.k ?? kh.ma });
    if (o.cd) q.set("cd", o.cd);
    if (o.nhom) q.set("nhom", o.nhom);
    return `/quang-cao?${q}`;
  };
  const b = await bangQuangCao(nt, kh.tu, kh.den, { chienDich: sp.cd, nhom: sp.nhom });
  const ngay = chiTieuTheoNgay(b.soLieu, kh.tu, kh.den);
  const max = Math.max(1, ...ngay.map((x) => x.chiTieu));
  const coKhoa = nt === "facebook" ? b.khoa.facebook : b.khoa.tiktok;
  const tieuDeCap = sp.nhom ? "Quảng cáo trong nhóm" : sp.cd ? "Nhóm quảng cáo trong chiến dịch" : "Chiến dịch";
  const the = [
    ["Chi tiêu", TIEN(b.tong.chiTieu)], ["Hiển thị", SO(b.tong.hienThi)], ["Lượt nhấp", SO(b.tong.nhap)],
    ["CTR", b.tong.ctr === null ? "—" : `${SO(b.tong.ctr, 2)}%`], ["CPC", TIEN(b.tong.cpc)], ["CPM", TIEN(b.tong.cpm)],
    ...(nt === "tiktok" ? [["Kết quả", SO(b.tong.ketQua)], ["Chi phí/kết quả", TIEN(b.tong.chiPhiKetQua)]] : []),
  ];
  return (
    <>
      <TieuDeTrang tieuDe="Quảng cáo" phu={`${TEN_NT[nt]} · ${kh.tu.split("-").reverse().join("/")} đến ${kh.den.split("-").reverse().join("/")}`} />
      <nav aria-label="Nền tảng và kỳ" className="mb-5 flex flex-wrap gap-2">
        {(["facebook", "tiktok"] as const).map((n) => <Link key={n} href={lienKet({ nt: n })} aria-current={n === nt ? "page" : undefined} className={`rounded-tag px-3 py-1.5 text-[13px] font-medium ${n === nt ? "nut-vang" : "border border-vien-dam text-muc-2 hover:bg-giay-tram"}`}>{TEN_NT[n]}</Link>)}
        <span className="mx-1 w-px bg-vien-dam" aria-hidden />
        {cacKhoang.map((x) => <Link key={x.ma} href={lienKet({ k: x.ma })} aria-current={x.ma === kh.ma ? "page" : undefined} className={`rounded-tag px-3 py-1.5 text-[13px] font-medium ${x.ma === kh.ma ? "nut-vang" : "border border-vien-dam text-muc-2 hover:bg-giay-tram"}`}>{x.nhan}</Link>)}
      </nav>

      {!coKhoa && <p role="status" className="mb-5 rounded-nho border border-vien bg-canh-bao-nen p-3.5 text-[14px] text-canh-bao">Chưa nối khoá {TEN_NT[nt]}. Khung kéo số đã sẵn sàng; có khoá (khai ở biến môi trường, không lưu trong cơ sở dữ liệu) là số tự về mỗi đêm.</p>}
      {b.lanCuoi && <p className="mb-5 text-[13px] text-muc-3">Lần kéo số gần nhất: <NhanTrangThai kieu={b.lanCuoi.trang_thai === "Thành công" ? "tot" : b.lanCuoi.trang_thai === "Lỗi" ? "loi" : "tram"}>{b.lanCuoi.trang_thai}</NhanTrangThai> {new Date(b.lanCuoi.bat_dau).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })} · {b.lanCuoi.so_dong} dòng{b.lanCuoi.ghi_chu ? ` · ${b.lanCuoi.ghi_chu}` : ""}</p>}

      <ul className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {the.map(([n, v]) => <li key={n} className="the-noi rounded-nho border border-vien bg-giay-sang p-3.5"><div className="text-[12px] text-muc-3">{n}</div><div className="chu-tieu-de mt-1 text-[22px] leading-tight text-nhan-dam">{v}</div></li>)}
      </ul>

      <section aria-label="Chi tiêu theo ngày" className="mb-8">
        <h2 className="mb-3 text-[13px] font-medium uppercase tracking-[0.08em] text-muc-3">Chi tiêu theo ngày</h2>
        <div className="flex h-28 items-end gap-[3px] rounded-nho border border-vien bg-giay-sang p-3" role="img" aria-label={`Biểu đồ chi tiêu ${ngay.length} ngày, cao nhất ${TIEN(max)}`}>
          {ngay.map((x) => <div key={x.ngay} title={`${x.ngay.split("-").reverse().join("/")}: ${TIEN(x.chiTieu)}`} className="min-w-[2px] flex-1 rounded-t-tag bg-nhan" style={{ height: `${Math.max(2, (x.chiTieu / max) * 100)}%`, opacity: x.chiTieu ? 1 : 0.2 }} />)}
        </div>
      </section>

      <section aria-label={tieuDeCap}>
        <h2 className="mb-3 flex flex-wrap items-center gap-1.5 text-[13px] font-medium uppercase tracking-[0.08em] text-muc-3">
          <Link href={lienKet({})} className="hover:underline">Chiến dịch</Link>
          {sp.cd && <><ChevronRight className="h-3.5 w-3.5" aria-hidden /><Link href={lienKet({ cd: sp.cd })} className="hover:underline">Nhóm</Link></>}
          {sp.nhom && <><ChevronRight className="h-3.5 w-3.5" aria-hidden />Quảng cáo</>}
        </h2>
        {b.danhSach.length === 0 ? <p className="rounded-nho border border-vien bg-giay-sang p-4 text-[14px] text-muc-3">Chưa có dữ liệu {TEN_NT[nt]} trong kỳ này.</p> : (
          <ul className="divide-y divide-vien rounded-nho border border-vien bg-giay-sang">
            {b.danhSach.map((d) => {
              const noi = sp.nhom ? null : sp.cd ? lienKet({ cd: sp.cd, nhom: d.id }) : lienKet({ cd: d.id });
              const noiDung = (
                <>
                  <span className="min-w-0 flex-1"><span className="block truncate text-[14px] font-medium text-muc">{d.ten}</span>{d.trangThai && <span className="text-[12px] text-muc-3">{d.trangThai}</span>}</span>
                  <span className="hidden w-24 shrink-0 text-right text-[13px] text-muc-2 sm:block">{SO(d.tong.hienThi)}<span className="block text-[11px] text-muc-3">hiển thị</span></span>
                  <span className="hidden w-20 shrink-0 text-right text-[13px] text-muc-2 sm:block">{d.tong.ctr === null ? "—" : `${SO(d.tong.ctr, 2)}%`}<span className="block text-[11px] text-muc-3">CTR</span></span>
                  <span className="w-28 shrink-0 text-right text-[14px] font-semibold text-nhan-dam">{TIEN(d.tong.chiTieu)}</span>
                </>
              );
              return <li key={d.id}>{noi ? <Link href={noi} className="flex items-center gap-3 px-3.5 py-3 hover:bg-giay-tram">{noiDung}<ChevronRight className="h-4 w-4 shrink-0 text-muc-3" aria-hidden /></Link> : <div className="flex items-center gap-3 px-3.5 py-3">{noiDung}</div>}</li>;
            })}
          </ul>
        )}
      </section>
    </>
  );
}
