export const dynamic = "force-dynamic";

import Link from "next/link";
import {
  ArrowRight,
  ClipboardList,
  Handshake,
  Megaphone,
  CalendarClock,
  Target,
  Wallet,
} from "lucide-react";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { yeuCauVaiTro } from "@/lib/auth";
import { dbHr } from "@/lib/hr-db";
import { HR_MUC } from "@/lib/hr-module";

const ICON: Record<string, typeof Target> = {
  "muc-tieu-tuyen-dung": Target,
  "ngan-sach-tuyen-dung": Wallet,
  "kenh-tuyen-dung": Megaphone,
  "lich-phong-van": CalendarClock,
  "offer-tuyen-dung": Handshake,
};

/** Sổ tuyển dụng: các sổ đi kèm màn Tuyển dụng (mục tiêu, ngân sách, kênh, phỏng vấn, offer). Sổ HR khác đã chuyển về đúng nhóm trong menu Nhân sự. */
export default async function TrangHr() {
  await yeuCauVaiTro(["admin", "ky_thuat"]);
  const db = dbHr();
  const dem = async (bang: string) => (await db.from(bang).select("id", { count: "exact", head: true })).count ?? 0;
  const homNay = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" });
  const [soMuc, pv, offerCho] = await Promise.all([
    Promise.all(HR_MUC.map((m) => dem(m.bang))),
    db.from("lich_phong_van").select("id", { count: "exact", head: true }).gte("thoi_gian", `${homNay}T00:00:00+07:00`).eq("ket_qua", "Chờ"),
    db.from("offer_tuyen_dung").select("id", { count: "exact", head: true }).in("trang_thai", ["Chờ duyệt", "Đã gửi", "Thương lượng"]),
  ]);
  const can = [
    { n: pv.count ?? 0, nhan: "buổi phỏng vấn sắp tới", href: "/hr/lich-phong-van", m: 1 },
    { n: offerCho.count ?? 0, nhan: "offer đang chờ", href: "/hr/offer-tuyen-dung", m: 3 },
  ];
  return (
    <>
      <TieuDeTrang tieuDe="Sổ tuyển dụng" phu="Kế hoạch và mục tiêu, ngân sách, kênh đăng tin, lịch phỏng vấn, offer. Tin tuyển dụng và ứng viên ở màn Tuyển dụng." />
      <ul className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {can.map((c) => (
          <li key={c.nhan} data-m={c.m} className="mau-nhom">
            <Link href={c.href} className="the-noi mau-vach mau-nen block rounded-nho p-4 transition-shadow hover:[box-shadow:var(--bong-2)]">
              <div className="chu-tieu-de mau-chu text-[32px] leading-none">{c.n}</div>
              <div className="mt-1.5 text-[13px] text-muc-2">{c.nhan}</div>
            </Link>
          </li>
        ))}
      </ul>
      <section aria-label="Tuyển dụng" data-m="1" className="mau-nhom">
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          <Muc href="/tuyen-dung" Icon={ClipboardList} ten="Tin tuyển dụng và ứng viên" moTa="Đăng tin theo kênh, theo dõi ứng viên qua từng vòng." />
          {HR_MUC.map((m, i) =>
            m.nhom !== "Tuyển dụng" ? null : <Muc key={m.ma} href={`/hr/${m.ma}`} Icon={ICON[m.ma] ?? Target} ten={m.ten} moTa={m.moTa} so={soMuc[i]} />,
          )}
        </ul>
      </section>
    </>
  );
}

function Muc({
  href,
  Icon,
  ten,
  moTa,
  so,
}: {
  href: string;
  Icon: typeof Target;
  ten: string;
  moTa: string;
  so?: number;
}) {
  return (
    <li>
      <Link
        href={href}
        className="the-noi mau-hover group flex h-full items-start gap-3.5 rounded-nho border border-vien bg-giay-sang p-4 transition-shadow hover:[box-shadow:var(--bong-2)]"
      >
        <span className="mau-chip flex h-10 w-10 shrink-0 items-center justify-center rounded-nho">
          <Icon strokeWidth={1.7} className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2 text-[15px] font-semibold text-muc">
            {ten}
            {so !== undefined && (
              <span className="mau-chip rounded-tag px-2 py-0.5 text-[12px] font-medium">
                {so}
              </span>
            )}
          </span>
          <span className="mt-1 block text-[13px] leading-snug text-muc-3">
            {moTa}
          </span>
        </span>
        <ArrowRight
          strokeWidth={1.6}
          className="mt-1 h-4 w-4 shrink-0 text-muc-3 transition-transform group-hover:translate-x-0.5"
        />
      </Link>
    </li>
  );
}
