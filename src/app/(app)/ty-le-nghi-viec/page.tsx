export const dynamic = "force-dynamic";

import { yeuCauVaiTro } from "@/lib/auth";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { layBienDong } from "@/lib/bien-dong-data";

const phanTram = (v: number | null) => (v === null ? "—" : `${v.toLocaleString("vi-VN")}%`);
const nhanThang = (t: string) => `${t.slice(5)}/${t.slice(0, 4)}`;

/** Tỷ lệ nghỉ việc = số người ra ÷ nhân sự bình quân (đầu kỳ + cuối kỳ) ÷ 2. Theo tháng, theo năm và theo khối. Chỉ Quản trị/Kỹ thuật. */
export default async function TrangTyLeNghiViec() {
  await yeuCauVaiTro(["admin", "ky_thuat"]);
  const kq = await layBienDong();
  return (
    <>
      <TieuDeTrang tieuDe="Tỷ lệ nghỉ việc" phu={`12 tháng gần nhất: ${phanTram(kq.tyLeNam)} (${kq.tongRa} người ra). Tính theo nhân sự bình quân đầu kỳ và cuối kỳ.`} />
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="the-noi the-noi-thap overflow-x-auto">
          <h2 className="px-4 pt-4 text-[15px] font-semibold text-muc">Theo tháng</h2>
          <table className="w-full text-[14px]">
            <thead><tr className="text-left text-[12px] font-medium text-muc-3"><th className="px-4 py-3">Tháng</th><th className="px-4 py-3 text-right">Ra</th><th className="px-4 py-3 text-right">Tỷ lệ</th></tr></thead>
            <tbody>
              {[...kq.thang].reverse().map((d) => (
                <tr key={d.thang} className="border-t border-vien"><td className="px-4 py-2.5">{nhanThang(d.thang)}</td><td className="px-4 py-2.5 text-right tabular-nums">{d.ra}</td><td className="px-4 py-2.5 text-right tabular-nums">{phanTram(d.tyLe)}</td></tr>
              ))}
            </tbody>
          </table>
        </section>
        <section className="the-noi the-noi-thap overflow-x-auto self-start">
          <h2 className="px-4 pt-4 text-[15px] font-semibold text-muc">Theo khối (12 tháng)</h2>
          <table className="w-full text-[14px]">
            <thead><tr className="text-left text-[12px] font-medium text-muc-3"><th className="px-4 py-3">Khối</th><th className="px-4 py-3 text-right">Đang làm</th><th className="px-4 py-3 text-right">Ra</th><th className="px-4 py-3 text-right">Tỷ lệ</th></tr></thead>
            <tbody>
              {kq.theoKhoi.map((k) => (
                <tr key={k.khoi} className="border-t border-vien"><td className="px-4 py-2.5">{k.khoi}</td><td className="px-4 py-2.5 text-right tabular-nums">{k.dangLam}</td><td className="px-4 py-2.5 text-right tabular-nums">{k.raTrongKy}</td><td className="px-4 py-2.5 text-right tabular-nums">{phanTram(k.tyLe)}</td></tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
      {kq.thieuNgayNghi > 0 && <p role="status" className="mt-4 text-[13px] text-muc-3">{kq.thieuNgayNghi} người đã nghỉ nhưng chưa có hồ sơ nghỉ việc đã đóng nên chưa được tính.</p>}
    </>
  );
}
