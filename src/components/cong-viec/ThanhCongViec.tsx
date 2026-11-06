import Link from "next/link";

/** Hai màn của mục Công việc: việc của tôi, và (chỉ Giám đốc / Phó giám đốc / Kỹ thuật) tổng quan báo cáo của mọi người. */
export function ThanhCongViec({ dang, coTongQuan }: { dang: "viec" | "tong-quan"; coTongQuan: boolean }) {
  if (!coTongQuan) return null;
  const T = [{ ma: "viec", ten: "Việc của tôi", href: "/cong-viec" }, { ma: "tong-quan", ten: "Tổng quan báo cáo", href: "/cong-viec/tong-quan" }] as const;
  return (
    <nav aria-label="Công việc" className="mb-5 flex gap-2">
      {T.map((t) => (
        <Link key={t.ma} href={t.href} aria-current={t.ma === dang ? "page" : undefined}
          className={`rounded-tag border px-3 py-1.5 text-[13px] font-medium transition-colors ${t.ma === dang ? "border-transparent nut-vang" : "border-vien text-muc-2 hover:bg-giay-tram"}`}>{t.ten}</Link>
      ))}
    </nav>
  );
}
