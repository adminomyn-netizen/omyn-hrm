export const dynamic = "force-dynamic";

import { yeuCauVaiTro } from "@/lib/auth";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { layBienDong } from "@/lib/bien-dong-data";

const nhanThang = (t: string) => `${t.slice(5)}/${t.slice(0, 4)}`;

/** Biến động nhân sự 12 tháng gần nhất: đầu kỳ, vào, ra, cuối kỳ. Số "ra" lấy từ hồ sơ nghỉ việc đã đóng. Chỉ Quản trị/Kỹ thuật. */
export default async function TrangBienDong() {
  await yeuCauVaiTro(["admin", "ky_thuat"]);
  const kq = await layBienDong();
  return (
    <>
      <TieuDeTrang tieuDe="Biến động nhân sự" phu={`12 tháng gần nhất: vào ${kq.tongVao}, ra ${kq.tongRa}. Số người ra tính theo hồ sơ nghỉ việc đã đóng.`} />
      {kq.thieuNgayNghi > 0 && (
        <p role="status" className="mb-4 rounded-nho bg-giay-tram px-3 py-2.5 text-[13px] text-muc-2">
          {kq.thieuNgayNghi} người đã nghỉ nhưng chưa có hồ sơ nghỉ việc đã đóng nên chưa tính vào bảng. Mở &ldquo;Nghỉ việc và bàn giao&rdquo; để đóng hồ sơ.
        </p>
      )}
      <div className="the-noi the-noi-thap overflow-x-auto">
        <table className="w-full min-w-[560px] text-[14px]">
          <thead><tr className="text-left text-[12px] font-medium text-muc-3"><th className="px-4 py-3">Tháng</th><th className="px-4 py-3 text-right">Đầu kỳ</th><th className="px-4 py-3 text-right">Vào</th><th className="px-4 py-3 text-right">Ra</th><th className="px-4 py-3 text-right">Cuối kỳ</th></tr></thead>
          <tbody>
            {[...kq.thang].reverse().map((d) => (
              <tr key={d.thang} className="border-t border-vien">
                <td className="px-4 py-3 font-medium text-muc">{nhanThang(d.thang)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{d.dauKy}</td>
                <td className="px-4 py-3 text-right tabular-nums">{d.vao}</td>
                <td className="px-4 py-3 text-right tabular-nums">{d.ra}</td>
                <td className="px-4 py-3 text-right tabular-nums font-medium">{d.cuoiKy}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
