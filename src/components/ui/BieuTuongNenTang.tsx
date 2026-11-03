import { Globe, Link2, Users, Building2 } from "lucide-react";

type Kieu = { nen: string; chu?: string; chuVe?: string; tron?: boolean; bieuTuong?: "web" | "nguoi" | "noi-bo" | "khac" };

/** Màu thương hiệu của từng nền tảng (cố định, không đổi theo giao diện sáng/tối để nhận ra ngay). */
const KIEU: Record<string, Kieu> = {
  Facebook: { nen: "#1877f2", chuVe: "f", tron: true },
  TopCV: { nen: "#00b14f", chuVe: "T" },
  Zalo: { nen: "#0068ff", chuVe: "Zalo" },
  LinkedIn: { nen: "#0a66c2", chuVe: "in" },
  VietnamWorks: { nen: "#f58220", chuVe: "VW" },
  "Website OMYN": { nen: "var(--nhan)", bieuTuong: "web", tron: true },
  "Người quen giới thiệu": { nen: "var(--sac-tim-1)", bieuTuong: "nguoi" },
  "Nội bộ": { nen: "var(--sac-luc-1)", bieuTuong: "noi-bo" },
};
const MAC_DINH: Kieu = { nen: "var(--vien-dam)", bieuTuong: "khac" };

/** Biểu tượng tròn/vuông bo nhỏ của nền tảng đăng tin hoặc nguồn ứng viên. */
export function BieuTuongNenTang({ ten, kich = 18 }: { ten: string; kich?: number }) {
  const k = KIEU[ten] ?? MAC_DINH;
  const cd = k.chuVe ? Math.round(kich * (k.chuVe.length > 2 ? 0.34 : k.chuVe.length === 2 ? 0.5 : 0.62)) : 0;
  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center font-bold leading-none text-white"
      style={{ width: kich, height: kich, background: k.nen, borderRadius: k.tron ? 9999 : Math.round(kich * 0.24), fontSize: cd, letterSpacing: k.chuVe === "Zalo" ? "-0.02em" : undefined }}
    >
      {k.chuVe ?? (
        k.bieuTuong === "web" ? <Globe strokeWidth={2} style={{ width: kich * 0.66, height: kich * 0.66 }} /> :
        k.bieuTuong === "nguoi" ? <Users strokeWidth={2} style={{ width: kich * 0.62, height: kich * 0.62 }} /> :
        k.bieuTuong === "noi-bo" ? <Building2 strokeWidth={2} style={{ width: kich * 0.62, height: kich * 0.62 }} /> :
        <Link2 strokeWidth={2} style={{ width: kich * 0.62, height: kich * 0.62 }} />
      )}
    </span>
  );
}

/** Nhãn nền tảng: biểu tượng + tên, nền nhạt. */
export function NhanNenTang({ ten, nho }: { ten: string; nho?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-tag bg-giay-tram font-medium text-muc ${nho ? "py-px pl-1 pr-2 text-[11px]" : "py-0.5 pl-1 pr-2 text-[12px]"}`}>
      <BieuTuongNenTang ten={ten} kich={nho ? 14 : 16} />
      {ten}
    </span>
  );
}
