/** Báo cáo phiên livestream trong tháng. Hàm thuần, không chạm DB. Thiếu số thì để null, không đoán. */
export type PhienLive = {
  id: string; ngay: string; nenTang: string; chuDe: string; hostId: string | null; trangThai: string;
  doanhThuGhiTay: number | null; soDonGhiTay: number | null; mucTieu: number | null; chiPhiQuangCao: number | null;
  gioBatDau: string | null; gioKetThuc: string | null; luotXem: number | null;
};
export type DonLienKet = { phienId: string; giaTri: number; trangThai: string };

export type DongPhienLive = {
  id: string; ngay: string; nenTang: string; chuDe: string; hostId: string | null; trangThai: string;
  /** Doanh thu và số đơn lấy từ đơn đã gắn vào phiên (trừ huỷ, hoàn trả); không có đơn gắn thì dùng số ghi tay. */
  doanhThu: number | null; soDon: number | null; nguon: "đơn gắn" | "ghi tay" | null;
  soDonHoanHuy: number;
  mucTieu: number | null; phanTramMucTieu: number | null;
  chiPhiQuangCao: number | null;
  /** Doanh thu ÷ chi phí quảng cáo; chỉ tính khi có cả hai và chi phí > 0. */
  doanhThuTrenChiPhi: number | null;
  soGio: number | null;
};
export type TongHopLive = {
  phien: DongPhienLive[];
  soPhienDaLive: number; soPhienKeHoach: number;
  doanhThu: number; soDon: number; chiPhiQuangCao: number; soPhienThieuDoanhThu: number;
  theoHost: { hostId: string | null; soPhien: number; doanhThu: number }[];
};

const KHONG_TINH = new Set(["Huỷ", "Hoàn trả"]);
const lam1 = (n: number) => Math.round(n * 10) / 10;

export function tongHopPhienLive(phien: readonly PhienLive[], don: readonly DonLienKet[]): TongHopLive {
  const theoPhien = new Map<string, DonLienKet[]>();
  for (const d of don) theoPhien.set(d.phienId, [...(theoPhien.get(d.phienId) ?? []), d]);
  const dong: DongPhienLive[] = phien.map((p) => {
    const ds = theoPhien.get(p.id) ?? [];
    const tinh = ds.filter((d) => !KHONG_TINH.has(d.trangThai));
    let doanhThu: number | null = null, soDon: number | null = null, nguon: DongPhienLive["nguon"] = null;
    if (ds.length > 0) { doanhThu = tinh.reduce((a, d) => a + d.giaTri, 0); soDon = tinh.length; nguon = "đơn gắn"; }
    else if (p.doanhThuGhiTay !== null) { doanhThu = p.doanhThuGhiTay; soDon = p.soDonGhiTay; nguon = "ghi tay"; }
    const ms = p.gioBatDau && p.gioKetThuc ? Date.parse(p.gioKetThuc) - Date.parse(p.gioBatDau) : NaN;
    return {
      id: p.id, ngay: p.ngay, nenTang: p.nenTang, chuDe: p.chuDe, hostId: p.hostId, trangThai: p.trangThai,
      doanhThu, soDon, nguon, soDonHoanHuy: ds.length - tinh.length,
      mucTieu: p.mucTieu, phanTramMucTieu: doanhThu !== null && p.mucTieu && p.mucTieu > 0 ? lam1((doanhThu / p.mucTieu) * 100) : null,
      chiPhiQuangCao: p.chiPhiQuangCao,
      doanhThuTrenChiPhi: doanhThu !== null && p.chiPhiQuangCao && p.chiPhiQuangCao > 0 ? lam1(doanhThu / p.chiPhiQuangCao) : null,
      soGio: Number.isFinite(ms) && ms > 0 ? lam1(ms / 3_600_000) : null,
    };
  });
  const daLive = dong.filter((d) => d.trangThai === "Đã live");
  const host = new Map<string | null, { soPhien: number; doanhThu: number }>();
  for (const d of daLive) { const h = host.get(d.hostId) ?? { soPhien: 0, doanhThu: 0 }; h.soPhien++; h.doanhThu += d.doanhThu ?? 0; host.set(d.hostId, h); }
  return {
    phien: dong,
    soPhienDaLive: daLive.length, soPhienKeHoach: dong.filter((d) => d.trangThai === "Lên kế hoạch").length,
    doanhThu: daLive.reduce((a, d) => a + (d.doanhThu ?? 0), 0), soDon: daLive.reduce((a, d) => a + (d.soDon ?? 0), 0),
    chiPhiQuangCao: daLive.reduce((a, d) => a + (d.chiPhiQuangCao ?? 0), 0),
    soPhienThieuDoanhThu: daLive.filter((d) => d.doanhThu === null).length,
    theoHost: [...host].map(([hostId, v]) => ({ hostId, ...v })).sort((a, b) => b.doanhThu - a.doanhThu),
  };
}
