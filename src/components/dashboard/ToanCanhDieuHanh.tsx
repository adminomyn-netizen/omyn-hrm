import Link from "next/link";
import { BucVinhDanh, DanhSachHang } from "@/components/kpi/BucVinhDanh";
import { ThanhDiem, dinhDangDiem } from "@/components/bsc/ThanhDiem";
import { MucTrang } from "@/components/ui/MucTrang";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { dbHr } from "@/lib/hr-db";
import { chiTieuTheoNgay, tiLeChiPhi, tongNenTang } from "@/lib/quang-cao";
import { chiTieuNgayTatCa, tongQuanNenTang } from "@/lib/quang-cao-data";
import { docKy, kyChua } from "@/lib/kpi";
import { bangXepHang, homNayHcm } from "@/lib/kpi-data";
import { taiBsc } from "@/lib/bsc-data";
import { hrCanChuY, thongKeCongViec } from "@/lib/dieu-hanh-data";
import { congNgay } from "@/lib/nhac-hr";

const TIEN = (n: number) => `${n.toLocaleString("vi-VN", { maximumFractionDigits: 0 })} đ`;
const TRIEU = (n: number) => (n >= 1e9 ? `${(n / 1e9).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} tỷ` : n >= 1e6 ? `${(n / 1e6).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} tr` : TIEN(n));
const thu = async <T,>(f: () => Promise<T>): Promise<T | null> => { try { return await f(); } catch { return null; } };
const Loi = ({ ten }: { ten: string }) => <p className="text-[14px] text-muc-3">Chưa tải được {ten}. Làm mới trang để thử lại.</p>;
const Xem = ({ href, nhan = "Xem chi tiết" }: { href: string; nhan?: string }) => <Link href={href} className="font-medium text-nhan-dam underline-offset-4 hover:underline">{nhan}</Link>;

/** Toàn cảnh điều hành cho Giám đốc/Quản trị/Kỹ thuật: thi đua KPI, BSC, quảng cáo + doanh thu, công việc, việc nhân sự cần chú ý — mỗi khối tự lỗi riêng, không kéo sập cả trang. */
export async function ToanCanhDieuHanh() {
  const homNay = homNayHcm();
  const thang = kyChua(homNay, "thang");
  const nam = Number(homNay.slice(0, 4)), th = Number(homNay.slice(5, 7));
  const tu30 = congNgay(homNay, -29);
  const [kpi, bsc, qc, qcNgay, cv, hr, sl] = await Promise.all([
    thu(() => bangXepHang(docKy(thang)!)),
    thu(() => taiBsc(nam, th)),
    thu(() => tongQuanNenTang(tu30, homNay)),
    thu(() => chiTieuNgayTatCa(tu30, homNay)),
    thu(() => thongKeCongViec(homNay)),
    thu(() => hrCanChuY(homNay)),
    thu(async () => (await dbHr().from("nhan_vien").select("id", { count: "exact", head: true }).neq("trang_thai", "Đã nghỉ")).count ?? 0),
  ]);
  const tongQc = qc ? tongNenTang([{ ten: "FB", ...qc.facebook }, { ten: "TT", ...qc.tiktok }, { ten: "SP", ...qc.shopee }]) : null;
  const ngay = chiTieuTheoNgay(qcNgay ?? [], tu30, homNay);
  const lon = Math.max(1, ...ngay.map((x) => x.chiTieu));

  const the = [
    { nhan: "Điểm KPI cao nhất", so: kpi?.toanCongTy[0] ? dinhDangDiem(kpi.toanCongTy[0].diem) : "—", phu: kpi?.toanCongTy[0]?.ten ?? "Chưa có kết quả", href: "/kpi" },
    { nhan: "Điểm BSC", so: dinhDangDiem(bsc?.cay.tong ?? null), phu: `Đến hết tháng ${th}`, href: "/bsc" },
    { nhan: "Chi phí QC / doanh thu", so: tongQc?.tiLe == null ? "—" : `${tongQc.tiLe.toLocaleString("vi-VN", { maximumFractionDigits: 1 })}%`, phu: tongQc ? `Chi ${TRIEU(tongQc.chiTieu)} · 30 ngày` : "Chưa có số", href: "/quang-cao" },
    { nhan: "Việc quá hạn", so: String(cv?.quaHan ?? "—"), phu: cv ? `${cv.dangMo} việc đang mở` : "", href: "/cong-viec" },
    { nhan: "Hợp đồng sắp hết hạn", so: String(hr?.hopDong.length ?? "—"), phu: "Trong 45 ngày", href: "/hr/hop-dong-lao-dong" },
    { nhan: "Nhân sự đang làm", so: String(sl ?? "—"), phu: hr ? `${hr.dangThuViec} đang thử việc` : "", href: "/nhan-su" },
  ];

  return (
    <section aria-label="Toàn cảnh điều hành" className="space-y-8">
      <h2 className="chu-tieu-de text-[26px] leading-tight text-muc">Toàn cảnh điều hành</h2>
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {the.map((t) => (
          <li key={t.nhan}><Link href={t.href} className="the-noi block h-full rounded-nho border border-vien bg-giay-sang p-4 hover:[box-shadow:var(--bong-2)]"><div className="text-[12px] text-muc-3">{t.nhan}</div><div className="chu-tieu-de mt-1 text-[26px] leading-tight text-nhan-dam">{t.so}</div><div className="mt-0.5 truncate text-[12px] text-muc-3">{t.phu}</div></Link></li>
        ))}
      </ul>

      <div className="grid gap-x-12 gap-y-10 lg:grid-cols-2">
        <MucTrang tieuDe={`Thi đua KPI · ${docKy(thang)?.nhan ?? ""}`} phai={<Xem href="/kpi" nhan="Bảng xếp hạng" />}>
          {!kpi ? <Loi ten="xếp hạng KPI" /> : (
            <div className="space-y-5">
              <BucVinhDanh ds={kpi.hangPhong.map((x) => ({ ...x, phu: `${x.soNguoi} người` }))} />
              {kpi.toanCongTy.length > 0 && <DanhSachHang ds={kpi.toanCongTy.filter((x) => x.hang <= 5).map((x) => ({ ...x, phu: x.khoiId ? kpi.nen.khoi.get(x.khoiId) : undefined }))} />}
            </div>
          )}
        </MucTrang>

        <MucTrang tieuDe={`BSC · năm ${nam}`} phai={<Xem href="/bsc" nhan="Bản đồ chiến lược" />}>
          {!bsc ? <Loi ten="BSC" /> : !bsc.coMucTieu ? <p className="text-[14px] text-muc-3">Chưa có mục tiêu BSC. <Xem href="/hr/bsc-muc-tieu" nhan="Thêm mục tiêu" /></p> : (
            <div className="space-y-4">
              <div><div className="chu-tieu-de text-[34px] leading-none text-nhan-dam">{dinhDangDiem(bsc.cay.tong)}</div><div className="mb-1 mt-0.5 text-[12px] text-muc-3">điểm toàn công ty đến hết tháng {th}</div><ThanhDiem diem={bsc.cay.tong} /></div>
              <ul className="space-y-3 border-t border-vien pt-4">
                {bsc.cay.goc.map((g) => <li key={g.id}><div className="mb-1 text-[13px] text-muc-2">{g.ten}</div><ThanhDiem diem={g.diem} nho /></li>)}
              </ul>
            </div>
          )}
        </MucTrang>
      </div>

      <div className="grid gap-x-12 gap-y-10 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-7">
          <MucTrang tieuDe="Quảng cáo & doanh thu · 30 ngày" phai={<Xem href="/quang-cao" />}>
            {!qc ? <Loi ten="quảng cáo" /> : (
              <div className="space-y-5">
                <div className="flex h-24 items-end gap-[3px] rounded-nho border border-vien bg-giay-sang p-3" role="img" aria-label={`Chi tiêu quảng cáo 30 ngày, cao nhất ${TIEN(lon)}`}>
                  {ngay.map((x) => <div key={x.ngay} title={`${x.ngay.split("-").reverse().join("/")}: ${TIEN(x.chiTieu)}`} className="min-w-[2px] flex-1 rounded-t-tag bg-nhan" style={{ height: `${Math.max(2, (x.chiTieu / lon) * 100)}%`, opacity: x.chiTieu ? 1 : 0.2 }} />)}
                </div>
                <ul className="grid grid-cols-3 gap-3">
                  {([["Facebook", qc.facebook, qc.khoa.facebook], ["TikTok", qc.tiktok, qc.khoa.tiktok], ["Shopee", qc.shopee, qc.khoa.shopee]] as const).map(([ten, d, co]) => (
                    <li key={ten} className="rounded-nho border border-vien bg-giay-sang p-3"><div className="flex items-center justify-between text-[13px] text-muc-2">{ten}{!co && <NhanTrangThai kieu="cho">Chưa nối</NhanTrangThai>}</div><div className="chu-tieu-de mt-1 text-[18px] text-nhan-dam">{TRIEU(d.doanhThu)}</div><div className="text-[11px] text-muc-3">chi {TRIEU(d.chiTieu)} · {tiLeChiPhi(d.chiTieu, d.doanhThu) === null ? "—" : `${tiLeChiPhi(d.chiTieu, d.doanhThu)}%`}</div></li>
                  ))}
                </ul>
              </div>
            )}
          </MucTrang>
        </div>
        <div className="min-w-0 lg:col-span-5">
          <MucTrang tieuDe="Công việc" phai={<Xem href="/cong-viec" />}>
            {!cv ? <Loi ten="công việc" /> : (
              <div className="space-y-4">
                <ul className="grid grid-cols-2 gap-3">
                  {([["Quá hạn", cv.quaHan, "text-loi"], ["Hôm nay", cv.homNay, "text-canh-bao"], ["Đang mở", cv.dangMo, "text-muc"], ["Xong 7 ngày", cv.xong7Ngay, "text-nhan-dam"]] as const).map(([n, v, m]) => <li key={n} className="rounded-nho border border-vien bg-giay-sang p-3"><div className="text-[12px] text-muc-3">{n}</div><div className={`chu-tieu-de text-[24px] ${m}`}>{v}</div></li>)}
                </ul>
                {cv.nhieuQuaHan.length > 0 && <div><div className="mb-1.5 text-[12px] text-muc-3">Nhiều việc quá hạn nhất</div><ul className="divide-y divide-vien rounded-nho border border-vien bg-giay-sang">{cv.nhieuQuaHan.map((x) => <li key={x.ten} className="flex justify-between px-3 py-2 text-[14px]"><span className="truncate text-muc">{x.ten}</span><span className="font-semibold text-loi">{x.so}</span></li>)}</ul></div>}
              </div>
            )}
          </MucTrang>
        </div>
      </div>

      <MucTrang tieuDe="Nhân sự cần chú ý" phai={<Xem href="/hr" nhan="Vận hành HCNS" />}>
        {!hr ? <Loi ten="việc nhân sự" /> : (
          <div className="grid gap-x-12 gap-y-6 lg:grid-cols-2">
            <div>
              <div className="mb-2 text-[13px] text-muc-2">Hợp đồng sắp hết hạn (45 ngày)</div>
              {hr.hopDong.length === 0 ? <p className="text-[14px] text-muc-3">Không có hợp đồng nào sắp hết hạn.</p> : (
                <ul className="divide-y divide-vien rounded-nho border border-vien bg-giay-sang">
                  {hr.hopDong.slice(0, 6).map((h) => <li key={h.id} className="flex items-center justify-between gap-3 px-3 py-2.5 text-[14px]"><span className="truncate text-muc">{h.ten}</span><NhanTrangThai kieu={h.con <= 7 ? "loi" : h.con <= 30 ? "cho" : "tram"}>{h.con < 0 ? `trễ ${-h.con} ngày` : h.con === 0 ? "hôm nay" : `còn ${h.con} ngày`}</NhanTrangThai></li>)}
                </ul>
              )}
            </div>
            <ul className="grid grid-cols-3 gap-3 self-start">
              {([["Phỏng vấn 7 ngày tới", hr.phongVanTuan, "/hr/lich-phong-van"], ["Offer đang chờ", hr.offerCho, "/hr/offer-tuyen-dung"], ["Đang thử việc", hr.dangThuViec, "/hr/onboarding"]] as const).map(([n, v, h]) => <li key={n}><Link href={h} className="block rounded-nho border border-vien bg-giay-sang p-3 hover:[box-shadow:var(--bong-2)]"><div className="text-[12px] text-muc-3">{n}</div><div className="chu-tieu-de text-[24px] text-nhan-dam">{v}</div></Link></li>)}
            </ul>
          </div>
        )}
      </MucTrang>
    </section>
  );
}
