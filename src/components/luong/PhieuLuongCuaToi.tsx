import { tienVN } from "@/lib/dinh-dang";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";

export type PhieuView = {
  id: string; ten_ky: string; trang_thai: string; cong_chuan: number; cong_huong: number;
  thu_viec?: boolean; luong_chuc_danh: number; luong_kpi: number; phu_cap_thuc: number; tien_an: number; tien_ot: number; hoa_hong: number; thuong_khac: number; tong_thu_nhap: number;
  bh_xh: number; bh_yt: number; bh_tn: number; thue_tncn: number; khau_tru_khac: number; thuc_linh: number;
};

/** Phiếu lương của chính mình — chỉ kỳ đã duyệt hoặc đã chi. */
export function PhieuLuongCuaToi({ ds }: { ds: PhieuView[] }) {
  if (ds.length === 0) return <p className="chu-tieu-de py-16 text-center text-[24px] text-muc-3">Chưa có phiếu lương nào được duyệt. Khi kỳ lương được duyệt, phiếu của bạn sẽ hiện ở đây.</p>;
  return (
    <div className="space-y-10">
      {ds.map((p) => {
        const dong: [string, number, boolean?][] = [
          [p.thu_viec ? "Lương thử việc" : "Lương chức danh", p.luong_chuc_danh], ["Lương KPI", p.luong_kpi], ["Phụ cấp", p.phu_cap_thuc], ["Tiền ăn", p.tien_an], ["Tăng ca", p.tien_ot], ["Hoa hồng", p.hoa_hong], ["Thưởng khác", p.thuong_khac],
          ["Tổng thu nhập", p.tong_thu_nhap, true],
          ["Bảo hiểm xã hội", -p.bh_xh], ["Bảo hiểm y tế", -p.bh_yt], ["Bảo hiểm thất nghiệp", -p.bh_tn], ["Thuế TNCN", -p.thue_tncn], ["Khấu trừ khác", -p.khau_tru_khac],
        ];
        return (
          <section key={p.id} className="max-w-xl">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-[17px] font-semibold text-muc">{p.ten_ky}</h2>
              <div className="flex items-center gap-3">
                <a href={`/phieu-luong/${p.id}`} target="_blank" rel="noopener" className="text-[13px] font-medium text-nhan-dam underline-offset-4 hover:underline">In phiếu</a>
                <NhanTrangThai kieu={p.trang_thai === "da_chi" ? "tot" : "cho"}>{p.trang_thai === "da_chi" ? "Đã chi" : "Đã duyệt"}</NhanTrangThai>
              </div>
            </div>
            <div className="mb-2 text-[13px] text-muc-3">Công hưởng {p.cong_huong}/{p.cong_chuan}</div>
            <dl className="divide-y divide-vien border-y border-vien">
              {dong.filter(([, v, nhan]) => v !== 0 || nhan).map(([nhan, v, dam]) => (
                <div key={nhan} className={`flex items-center justify-between py-2.5 text-[14px] ${dam ? "font-semibold text-muc" : "text-muc-2"}`}>
                  <dt>{nhan}</dt>
                  <dd className="tabular-nums">{v < 0 ? `− ${tienVN(-v)}` : tienVN(v)}</dd>
                </div>
              ))}
              <div className="flex items-center justify-between py-3.5 text-[16px] font-semibold text-muc">
                <dt>Thực lĩnh</dt>
                <dd className="tabular-nums">{tienVN(p.thuc_linh)}</dd>
              </div>
            </dl>
          </section>
        );
      })}
    </div>
  );
}
