/** Biến động nhân sự theo tháng: đầu kỳ, vào, ra, cuối kỳ và tỷ lệ nghỉ việc. Hàm thuần, không chạm DB. */

export type NguoiBienDong = { id: string; ngayVao: string | null; khoi: string | null; daNghi: boolean };
export type LuotNghi = { nhanVienId: string; ngayCuoi: string };

export type DongThang = { thang: string; dauKy: number; vao: number; ra: number; cuoiKy: number; tyLe: number | null };
export type KetQuaBienDong = {
  thang: DongThang[];
  tongVao: number;
  tongRa: number;
  tyLeNam: number | null;
  theoKhoi: { khoi: string; dangLam: number; raTrongKy: number; tyLe: number | null }[];
  /** Đã nghỉ nhưng chưa có hồ sơ nghỉ việc đã đóng nên không biết ngày nghỉ: không tính vào số liệu. */
  thieuNgayNghi: number;
};

const ngayDau = (thang: string) => `${thang}-01`;
const cong1Thang = (thang: string) => {
  const [y, m] = thang.split("-").map(Number);
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
};
/** Danh sách `so` tháng kết thúc ở `den`, cũ → mới. */
export function cacThang(den: string, so: number): string[] {
  const [y, m] = den.split("-").map(Number);
  const kq: string[] = [];
  for (let i = so - 1; i >= 0; i--) {
    const t = y * 12 + (m - 1) - i;
    kq.push(`${Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, "0")}`);
  }
  return kq;
}
const tyLe = (ra: number, dau: number, cuoi: number) => {
  const tb = (dau + cuoi) / 2;
  return tb > 0 ? Math.round((ra / tb) * 1000) / 10 : null;
};

export function tinhBienDong(nguoi: NguoiBienDong[], nghi: LuotNghi[], denThang: string, soThang = 12): KetQuaBienDong {
  const ngayNghi = new Map<string, string>();
  for (const n of nghi) {
    const cu = ngayNghi.get(n.nhanVienId);
    if (!cu || n.ngayCuoi > cu) ngayNghi.set(n.nhanVienId, n.ngayCuoi);
  }
  const thieuNgayNghi = nguoi.filter((n) => n.daNghi && !ngayNghi.has(n.id)).length;
  // Người đã nghỉ mà không biết ngày nghỉ thì bỏ ra ngoài, tránh đếm sai cả đầu lẫn cuối kỳ.
  const dung = nguoi.filter((n) => n.ngayVao && (!n.daNghi || ngayNghi.has(n.id)));
  const conLamTruoc = (n: NguoiBienDong, ngay: string) => n.ngayVao! < ngay && !(ngayNghi.get(n.id) && ngayNghi.get(n.id)! < ngay);

  const thang = cacThang(denThang, soThang).map((t): DongThang => {
    const dau = ngayDau(t), cuoiKyNgay = ngayDau(cong1Thang(t));
    const dauKy = dung.filter((n) => conLamTruoc(n, dau)).length;
    const vao = dung.filter((n) => n.ngayVao! >= dau && n.ngayVao! < cuoiKyNgay).length;
    const ra = dung.filter((n) => { const g = ngayNghi.get(n.id); return !!g && g >= dau && g < cuoiKyNgay; }).length;
    const cuoiKy = dauKy + vao - ra;
    return { thang: t, dauKy, vao, ra, cuoiKy, tyLe: tyLe(ra, dauKy, cuoiKy) };
  });
  const tongVao = thang.reduce((a, d) => a + d.vao, 0), tongRa = thang.reduce((a, d) => a + d.ra, 0);
  const dauNam = thang[0]?.dauKy ?? 0, cuoiNam = thang[thang.length - 1]?.cuoiKy ?? 0;

  const dauCua = ngayDau(thang[0]?.thang ?? denThang);
  const tenKhoi = [...new Set(dung.map((n) => n.khoi ?? "Chưa gán khối"))].sort();
  const theoKhoi = tenKhoi.map((k) => {
    const nk = dung.filter((n) => (n.khoi ?? "Chưa gán khối") === k);
    const dangLam = nk.filter((n) => !ngayNghi.has(n.id)).length;
    const raTrongKy = nk.filter((n) => { const g = ngayNghi.get(n.id); return !!g && g >= dauCua; }).length;
    return { khoi: k, dangLam, raTrongKy, tyLe: tyLe(raTrongKy, dangLam + raTrongKy, dangLam) };
  });
  return { thang, tongVao, tongRa, tyLeNam: tyLe(tongRa, dauNam, cuoiNam), theoKhoi, thieuNgayNghi };
}
