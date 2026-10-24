import { Activity, BarChart3, Clock, Inbox, KeyRound, Sparkles, UserPlus, Users, Wallet, type LucideIcon } from "lucide-react";
import { layToanCanhKyThuat, type ChiSo } from "@/lib/toan-canh";
import { ngayVN } from "@/lib/dinh-dang";

type Sac = "luc" | "xanh" | "tim" | "cam" | "hong";
const v = (k: Sac, h: "" | "-nen" | "-mau" | "-1" | "-2") => `var(--sac-${k}${h})`;
const dai = (k: Sac) => `linear-gradient(135deg, ${v(k, "-1")} 0%, ${v(k, "-2")} 100%)`;
const VONG: Sac[] = ["luc", "xanh", "tim", "cam", "hong"];

/** Mỗi nhóm một màu và một biểu tượng riêng, để nhìn là biết đang ở mảng nào. */
const NHOM: Record<string, { sac: Sac; Icon: LucideIcon }> = {
  "Nhân sự": { sac: "luc", Icon: Users },
  "Tài khoản và đăng nhập": { sac: "xanh", Icon: KeyRound },
  "Chấm công": { sac: "tim", Icon: Clock },
  "Đơn từ": { sac: "cam", Icon: Inbox },
  "Tuyển dụng": { sac: "hong", Icon: UserPlus },
  "Lương": { sac: "luc", Icon: Wallet },
  "Đánh giá hiệu suất": { sac: "xanh", Icon: BarChart3 },
  "Hệ thống": { sac: "tim", Icon: Activity },
};

/** Chỉ số cần chú ý: có số khác 0 thì đổi sang màu cảnh báo (cam) hoặc xấu (hồng) để mắt bắt được ngay. */
const CANH_BAO: Record<string, Sac> = {
  "Chờ duyệt": "cam", "Từ chối": "hong", "Đi muộn hôm nay": "cam", "Vào nhưng chưa ra": "cam", "Đi muộn tháng này": "cam", "Vắng mặt tháng này": "hong",
  "Chưa từng đăng nhập": "cam", "Hồ sơ chưa gắn tài khoản": "cam", "Tham số lương chưa xác nhận": "cam", "Cần cải thiện": "hong", "Đã nghỉ": "hong",
};
const khacKhong = (so: string) => parseFloat(so.replace(/[^\d.,-]/g, "").replace(",", ".")) > 0;

function Vong({ phanTram, mau, nen, kich = 52, chu }: { phanTram: number; mau: string; nen: string; kich?: number; chu?: string }) {
  const r = (kich - 8) / 2;
  const chuVi = 2 * Math.PI * r;
  return (
    <svg width={kich} height={kich} viewBox={`0 0 ${kich} ${kich}`} role="img" aria-label={`${phanTram}%`} className="shrink-0">
      <circle cx={kich / 2} cy={kich / 2} r={r} fill="none" stroke={nen} strokeWidth="6" />
      <circle cx={kich / 2} cy={kich / 2} r={r} fill="none" stroke={mau} strokeWidth="6" strokeLinecap="round" strokeDasharray={`${(chuVi * phanTram) / 100} ${chuVi}`} transform={`rotate(-90 ${kich / 2} ${kich / 2})`} />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" fontSize={kich > 56 ? 14 : 12} fontWeight="600" fill={chu ?? mau}>{phanTram}%</text>
    </svg>
  );
}

function The({ c, sac }: { c: ChiSo; sac: Sac }) {
  const bao = CANH_BAO[c.nhan.replace(/ \d{4} đã dùng\/chờ/, "")] ?? CANH_BAO[c.nhan];
  const k: Sac = bao && khacKhong(c.so) ? bao : sac;
  return (
    <div className="relative min-w-0 overflow-hidden p-4" style={{ background: v(k, "-nen"), borderRadius: 12, border: `1px solid color-mix(in srgb, ${v(k, "-mau")} 28%, transparent)` }}>
      <span aria-hidden className="absolute inset-y-0 left-0 w-1" style={{ background: v(k, "-mau") }} />
      <div className="flex items-start justify-between gap-3 pl-1.5">
        <div className="min-w-0">
          <div className="truncate text-[28px] font-semibold leading-none tabular-nums" style={{ color: v(k, "") }} title={c.so}>{c.so}</div>
          <div className="mt-2 text-[13px] font-medium text-muc-2">{c.nhan}</div>
          {c.phu && <div className="mt-0.5 text-[12px] text-muc-3">{c.phu}</div>}
        </div>
        {c.tyLe !== undefined && <Vong phanTram={c.tyLe} mau={v(k, "-mau")} nen={`color-mix(in srgb, ${v(k, "-mau")} 22%, transparent)`} chu={v(k, "")} />}
      </div>
    </div>
  );
}

/** Toàn cảnh số liệu cho tài khoản Kỹ thuật: mọi chỉ số của nhân sự, tài khoản, chấm công, đơn từ, tuyển dụng, lương, đánh giá, hệ thống. */
export async function ToanCanhKyThuat() {
  const d = await layToanCanhKyThuat();
  const lay = (nhom: string, nhan: string) => d.nhom.find((n) => n.ten === nhom)?.chiSo.find((c) => c.nhan === nhan);
  const NOI_BAT: { c?: ChiSo; sac: Sac; Icon: LucideIcon; nhan: string }[] = [
    { c: lay("Nhân sự", "Đang làm"), sac: "luc", Icon: Users, nhan: "Nhân viên đang làm" },
    { c: lay("Chấm công", "Đã chấm công hôm nay"), sac: "xanh", Icon: Clock, nhan: "Đã chấm công hôm nay" },
    { c: lay("Đơn từ", "Chờ duyệt"), sac: "cam", Icon: Inbox, nhan: "Đơn chờ duyệt" },
    { c: lay("Lương", "Tổng thực lĩnh (mọi kỳ)"), sac: "hong", Icon: Wallet, nhan: "Tổng thực lĩnh các kỳ" },
  ];
  const lon = Math.max(1, ...d.chamCong7Ngay.map((x) => x.so));
  return (
    <section aria-labelledby="toan-canh" className="space-y-10">
      <div className="flex items-center gap-3 border-b border-vien pb-3">
        <span className="flex h-10 w-10 items-center justify-center text-[var(--chu-tren-vang)]" style={{ background: dai("tim"), borderRadius: 10 }}><Sparkles className="h-5 w-5" strokeWidth={1.8} /></span>
        <div>
          <h2 id="toan-canh" className="text-[20px] font-semibold text-muc">Toàn cảnh số liệu</h2>
          <p className="text-[13px] text-muc-3">Chỉ tài khoản Kỹ thuật thấy mục này: mọi chỉ số của toàn công ty, kể cả lương.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {NOI_BAT.map(({ c, sac, Icon, nhan }) =>
          c ? (
            <div key={nhan} className="relative overflow-hidden p-5 text-[var(--chu-tren-vang)]" style={{ background: dai(sac), borderRadius: 14 }}>
              <span aria-hidden className="absolute -right-6 -top-6 h-28 w-28" style={{ background: "rgba(255,255,255,0.12)", borderRadius: 9999 }} />
              <span aria-hidden className="absolute -bottom-10 right-8 h-24 w-24" style={{ background: "rgba(255,255,255,0.08)", borderRadius: 9999 }} />
              <div className="relative flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[13px] font-medium opacity-90">{nhan}</div>
                  <div className="mt-2 truncate text-[32px] font-semibold leading-none tabular-nums" title={c.so}>{c.so}</div>
                  {c.phu && <div className="mt-1.5 text-[12px] opacity-85">{c.phu}</div>}
                </div>
                {c.tyLe !== undefined ? <Vong phanTram={c.tyLe} mau="#ffffff" nen="rgba(255,255,255,0.28)" kich={60} chu="#ffffff" /> : <span className="flex h-11 w-11 shrink-0 items-center justify-center" style={{ background: "rgba(255,255,255,0.2)", borderRadius: 9999 }}><Icon className="h-5 w-5" strokeWidth={1.8} /></span>}
              </div>
            </div>
          ) : null,
        )}
      </div>

      {d.nhom.map((n) => {
        const g = NHOM[n.ten] ?? { sac: "luc" as Sac, Icon: Activity };
        return (
          <div key={n.ten} className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center text-[var(--chu-tren-vang)]" style={{ background: dai(g.sac), borderRadius: 10 }}><g.Icon className="h-[18px] w-[18px]" strokeWidth={1.8} /></span>
              <h3 className="text-[16px] font-semibold text-muc">{n.ten}</h3>
              <span className="h-px flex-1" style={{ background: `linear-gradient(90deg, color-mix(in srgb, ${v(g.sac, "-mau")} 45%, transparent), transparent)` }} />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {n.chiSo.map((c) => <The key={c.nhan} c={c} sac={g.sac} />)}
            </div>
          </div>
        );
      })}

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center text-[var(--chu-tren-vang)]" style={{ background: dai("xanh"), borderRadius: 10 }}><Clock className="h-[18px] w-[18px]" strokeWidth={1.8} /></span>
          <h3 className="text-[16px] font-semibold text-muc">Lượt chấm công 7 ngày qua</h3>
        </div>
        <div className="p-5" style={{ background: v("xanh", "-nen"), borderRadius: 14, border: `1px solid color-mix(in srgb, ${v("xanh", "-mau")} 25%, transparent)` }}>
          <div className="flex h-[150px] items-end gap-3" role="img" aria-label="Số lượt chấm công mỗi ngày trong 7 ngày gần nhất">
            {d.chamCong7Ngay.map((x, i) => {
              const k = VONG[i % VONG.length];
              const cao = x.so === lon && x.so > 0;
              return (
                <div key={x.ngay} className="flex flex-1 flex-col items-center justify-end gap-1.5">
                  <span className="text-[13px] font-semibold tabular-nums" style={{ color: cao ? v("cam", "") : v("xanh", "") }}>{x.so}</span>
                  <span className="w-full max-w-[56px]" style={{ height: Math.max(6, Math.round((x.so / lon) * 96)), borderRadius: 6, background: cao ? dai("cam") : dai(k === "cam" ? "xanh" : k) }} />
                  <span className="text-[11px] text-muc-2">{ngayVN(x.ngay).slice(0, 5)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {d.phanBo.map((p, pi) => {
          const tong = Math.max(1, p.dong.reduce((t, x) => t + x.so, 0));
          const lonNhat = Math.max(1, ...p.dong.map((x) => x.so));
          const sac0 = VONG[pi % VONG.length];
          return (
            <div key={p.ten} className="p-5" style={{ background: v(sac0, "-nen"), borderRadius: 14, border: `1px solid color-mix(in srgb, ${v(sac0, "-mau")} 25%, transparent)` }}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-[15px] font-semibold text-muc">{p.ten}</h3>
                <span className="text-[12px] text-muc-2">{tong.toLocaleString("vi-VN")} {p.donVi}</span>
              </div>
              <ul className="space-y-3.5">
                {p.dong.map((x, i) => {
                  const k = VONG[(pi + i) % VONG.length];
                  return (
                    <li key={x.nhan}>
                      <div className="flex items-center justify-between gap-3 text-[14px]">
                        <span className="flex min-w-0 items-center gap-2 font-medium text-muc"><span aria-hidden className="h-2.5 w-2.5 shrink-0" style={{ background: v(k, "-mau"), borderRadius: 3 }} /><span className="truncate">{x.nhan}</span></span>
                        <span className="shrink-0 tabular-nums text-muc-2">{x.so.toLocaleString("vi-VN")} <span className="text-[12px]" style={{ color: v(sac0, "") }}>· {Math.round((x.so / tong) * 100)}%</span></span>
                      </div>
                      <div className="mt-1.5 h-2" style={{ background: `color-mix(in srgb, ${v(k, "-mau")} 18%, transparent)`, borderRadius: 4 }}>
                        <div className="h-2" style={{ width: `${Math.max(4, Math.round((x.so / lonNhat) * 100))}%`, background: dai(k), borderRadius: 4 }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
