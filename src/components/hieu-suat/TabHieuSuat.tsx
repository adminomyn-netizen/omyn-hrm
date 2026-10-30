import Link from "next/link";
import { layNguoiDungHienTai } from "@/lib/auth";

export type MaTabHieuSuat = "bsc" | "cong-viec" | "kpi" | "danh-gia";

const TAB: {
  ma: MaTabHieuSuat;
  ten: string;
  href: string;
  quanLy?: boolean;
}[] = [
  { ma: "bsc", ten: "1 · Mục tiêu (BSC)", href: "/bsc" },
  { ma: "cong-viec", ten: "2 · Công việc", href: "/cong-viec" },
  { ma: "kpi", ten: "3 · KPI và xếp hạng", href: "/kpi" },
  { ma: "danh-gia", ten: "4 · Đánh giá kỳ", href: "/danh-gia", quanLy: true },
];

const THIET_LAP = [
  { ten: "Chỉ tiêu KPI", href: "/hr/kpi-chi-tieu" },
  { ten: "Mức khen thưởng", href: "/hr/kpi-thuong" },
  { ten: "BSC: góc nhìn", href: "/hr/bsc-goc-nhin" },
  { ten: "BSC: mục tiêu", href: "/hr/bsc-muc-tieu" },
  { ten: "BSC: chỉ số", href: "/hr/bsc-chi-so" },
  { ten: "BSC: giao chỉ số", href: "/hr/bsc-giao-chi-so" },
];

/** Chuỗi hiệu suất không chồng: Mục tiêu kỳ (BSC) → Công việc hằng ngày → chấm KPI/xếp hạng (thi đua) → Đánh giá kỳ. Hiện ở đầu cả bốn màn để người dùng thấy đây là MỘT quy trình; thiết lập (cho Quản trị/Kỹ thuật) gom ở dòng dưới thay vì nằm trong “Vận hành HCNS”. */
export async function TabHieuSuat({ dang }: { dang: MaTabHieuSuat }) {
  const nd = await layNguoiDungHienTai();
  const quanLy = nd?.vaiTro === "admin" || nd?.vaiTro === "ky_thuat";
  return (
    <div className="mb-6">
      <nav
        aria-label="Hiệu suất"
        className="flex flex-wrap gap-1 border-b border-vien"
      >
        {TAB.filter((t) => !t.quanLy || quanLy).map((t) => (
          <Link
            key={t.ma}
            href={t.href}
            aria-current={t.ma === dang ? "page" : undefined}
            className={`-mb-px border-b-2 px-4 py-2.5 text-[14px] ${t.ma === dang ? "border-nhan font-semibold text-muc" : "border-transparent text-muc-2 hover:text-muc"}`}
          >
            {t.ten}
          </Link>
        ))}
      </nav>
      {quanLy && (
        <p className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-muc-3">
          <span>Thiết lập:</span>
          {THIET_LAP.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-nhan-dam underline-offset-4 hover:underline"
            >
              {l.ten}
            </Link>
          ))}
        </p>
      )}
    </div>
  );
}
