import { MucTrang } from "@/components/ui/MucTrang";
import { ThanhTyLe } from "@/components/ui/ThanhTyLe";
import { layToanCanhKyThuat } from "@/lib/toan-canh";
import { ngayVN } from "@/lib/dinh-dang";

/** Toàn cảnh số liệu cho tài khoản Kỹ thuật: mọi chỉ số của nhân sự, tài khoản, chấm công, đơn từ, tuyển dụng, lương, đánh giá, hệ thống. */
export async function ToanCanhKyThuat() {
  const d = await layToanCanhKyThuat();
  const lon = Math.max(1, ...d.chamCong7Ngay.map((x) => x.so));
  return (
    <section aria-labelledby="toan-canh" className="space-y-10">
      <div className="border-b border-vien pb-2.5">
        <h2 id="toan-canh" className="text-[18px] font-semibold text-muc">Toàn cảnh số liệu</h2>
        <p className="mt-0.5 text-[13px] text-muc-3">Chỉ tài khoản Kỹ thuật thấy mục này: mọi chỉ số của toàn công ty, kể cả lương.</p>
      </div>

      {d.nhom.map((n) => (
        <MucTrang key={n.ten} tieuDe={n.ten}>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
            {n.chiSo.map((c) => (
              <div key={c.nhan} className="min-w-0">
                <dd className="truncate text-[24px] font-medium leading-none tabular-nums text-muc" title={c.so}>{c.so}</dd>
                <dt className="mt-1.5 text-[13px] text-muc-3">{c.nhan}</dt>
                {c.phu && <dd className="mt-0.5 text-[12px] text-muc-3">{c.phu}</dd>}
              </div>
            ))}
          </dl>
        </MucTrang>
      ))}

      <MucTrang tieuDe="Lượt chấm công 7 ngày qua">
        <div className="flex h-[88px] items-end gap-3" role="img" aria-label="Số lượt chấm công mỗi ngày trong 7 ngày gần nhất">
          {d.chamCong7Ngay.map((x) => (
            <div key={x.ngay} className="flex flex-1 flex-col items-center gap-1.5">
              <span className="text-[12px] tabular-nums text-muc-3">{x.so}</span>
              <span className="w-full" style={{ height: Math.max(4, Math.round((x.so / lon) * 56)), borderRadius: 3, background: x.so === lon && x.so > 0 ? "var(--gradient-vang)" : "var(--giay-tram)" }} />
              <span className="text-[11px] text-muc-3">{ngayVN(x.ngay).slice(0, 5)}</span>
            </div>
          ))}
        </div>
      </MucTrang>

      <div className="grid gap-x-12 gap-y-10 lg:grid-cols-2">
        {d.phanBo.map((p) => (
          <MucTrang key={p.ten} tieuDe={p.ten}>
            <ThanhTyLe donVi={p.donVi} dong={p.dong} />
          </MucTrang>
        ))}
      </div>
    </section>
  );
}
