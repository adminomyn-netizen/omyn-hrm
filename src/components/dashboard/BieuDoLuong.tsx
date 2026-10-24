import { MucTrang } from "@/components/ui/MucTrang";
import { layThongKeLuong } from "@/lib/thong-ke-luong";
import { tienVN, trieuVN } from "@/lib/dinh-dang";

/** Biểu đồ lương ở Tổng quan (chỉ Quản trị và Kỹ thuật): chi phí 6 kỳ gần nhất, cơ cấu chi phí kỳ mới nhất, quỹ lương theo khối. */
export async function BieuDoLuong() {
  const d = await layThongKeLuong();
  if (d.ky.length === 0) {
    return (
      <MucTrang tieuDe="Lương, thuế và bảo hiểm">
        <p className="text-[14px] text-muc-3">Chưa có kỳ lương nào nên chưa có biểu đồ. Biểu đồ sẽ hiện sau khi lập bảng lương kỳ đầu tiên ở mục Bảng lương.</p>
      </MucTrang>
    );
  }
  const moi = d.ky[d.ky.length - 1];
  const lon = Math.max(1, ...d.ky.map((k) => k.tongThuNhap));
  const phan = [
    { nhan: "Thực lĩnh", so: moi.thucLinh, mau: "var(--nhan)" },
    { nhan: "Bảo hiểm người lao động", so: moi.bhNld, mau: "var(--vang-sang)" },
    { nhan: "Thuế TNCN", so: moi.thue, mau: "var(--canh-bao)" },
  ];
  const tongPhan = Math.max(1, phan.reduce((t, p) => t + p.so, 0));
  return (
    <section aria-labelledby="bieu-do-luong" className="space-y-8">
      <div className="border-b border-vien pb-2.5">
        <h2 id="bieu-do-luong" className="text-[18px] font-semibold text-muc">Lương, thuế và bảo hiểm</h2>
        <p className="mt-0.5 text-[13px] text-muc-3">Chỉ Quản trị và Kỹ thuật thấy mục này. Cộng theo các dòng lương đã lập của từng kỳ.</p>
      </div>

      <div className="grid gap-x-12 gap-y-10 lg:grid-cols-2">
        <MucTrang tieuDe={`Tổng thu nhập ${d.ky.length} kỳ gần nhất`}>
          <div className="flex h-[150px] items-end gap-3" role="img" aria-label="Tổng thu nhập mỗi kỳ lương">
            {d.ky.map((k) => (
              <div key={k.id} className="flex flex-1 flex-col items-center gap-1.5">
                <span className="text-[12px] tabular-nums text-muc-3">{trieuVN(k.tongThuNhap)}</span>
                <span className="w-full max-w-[72px]" style={{ height: Math.max(4, Math.round((k.tongThuNhap / lon) * 100)), borderRadius: 3, background: k.id === moi.id ? "var(--gradient-vang)" : "var(--giay-tram)", border: k.id === moi.id ? undefined : "1px solid var(--vien)" }} />
                <span className="text-[11px] text-muc-3">{k.thang}/{String(k.nam).slice(2)}</span>
              </div>
            ))}
          </div>
        </MucTrang>

        <MucTrang tieuDe={`Cơ cấu chi phí · ${moi.ten}`}>
          <div className="flex h-3 overflow-hidden" style={{ borderRadius: 3 }} role="img" aria-label="Cơ cấu thực lĩnh, bảo hiểm và thuế của kỳ mới nhất">
            {phan.map((p) => <span key={p.nhan} style={{ width: `${(p.so / tongPhan) * 100}%`, background: p.mau }} />)}
          </div>
          <ul className="mt-4 space-y-2 text-[14px]">
            {phan.map((p) => (
              <li key={p.nhan} className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-muc-2"><span aria-hidden className="h-2.5 w-2.5" style={{ background: p.mau, borderRadius: 2 }} />{p.nhan}</span>
                <span className="tabular-nums text-muc">{tienVN(p.so)}</span>
              </li>
            ))}
            <li className="flex items-center justify-between gap-3 border-t border-vien pt-2 text-muc-3"><span>Công ty đóng thêm bảo hiểm</span><span className="tabular-nums">{tienVN(moi.bhCty)}</span></li>
            <li className="flex items-center justify-between gap-3 text-muc-3"><span>Trong đó tăng ca (đã gồm trong thu nhập)</span><span className="tabular-nums">{tienVN(moi.tienOt)}</span></li>
          </ul>
        </MucTrang>
      </div>

      {d.theoKhoi.length > 0 && (
        <MucTrang tieuDe={`Quỹ lương theo khối · ${moi.ten}`}>
          <div className="max-w-xl">
            <ul className="space-y-4">
              {(() => {
                const m = Math.max(1, ...d.theoKhoi.map((x) => x.so));
                return d.theoKhoi.map((x) => (
                  <li key={x.nhan}>
                    <div className="flex justify-between text-[14px]"><span className="font-medium text-muc">{x.nhan}</span><span className="tabular-nums text-muc-3">{tienVN(x.so)}</span></div>
                    <div className="mt-1.5 h-1.5 bg-giay-tram" style={{ borderRadius: 2 }}><div className="h-1.5" style={{ width: `${Math.round((x.so / m) * 100)}%`, background: "var(--gradient-vang)", borderRadius: 2 }} /></div>
                  </li>
                ));
              })()}
            </ul>
          </div>
        </MucTrang>
      )}
    </section>
  );
}
