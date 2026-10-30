export const dynamic = "force-dynamic";

import Link from "next/link";
import {
  ArrowRight,
  ClipboardList,
  Handshake,
  Megaphone,
  UserCheck,
  Wallet,
  CalendarClock,
  FileCheck2,
  Target,
  Trophy,
  Gauge,
  Award,
  FileSignature,
  ClipboardCheck,
} from "lucide-react";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { yeuCauVaiTro } from "@/lib/auth";
import { dbHr } from "@/lib/hr-db";
import { HR_MUC } from "@/lib/hr-module";
import { menuChinh } from "@/lib/nav";

const ICON: Record<string, typeof Target> = {
  "muc-tieu-tuyen-dung": Target,
  "ngan-sach-tuyen-dung": Wallet,
  "kenh-tuyen-dung": Megaphone,
  "lich-phong-van": CalendarClock,
  "offer-tuyen-dung": Handshake,
  "de-xuat-phe-duyet": FileCheck2,
  "hop-dong-lao-dong": FileSignature,
  "danh-gia-tai-ky": ClipboardCheck,
  "kpi-chi-tieu": Gauge,
  "kpi-thuong": Award,
};

/** Trung tâm vận hành HCNS: đi theo thứ tự công việc thật, từ kế hoạch tuyển dụng tới hết 60 ngày thử việc. */
export default async function TrangHr() {
  await yeuCauVaiTro(["admin", "ky_thuat"]);
  const db = dbHr();
  const dem = async (bang: string) =>
    (await db.from(bang).select("id", { count: "exact", head: true })).count ??
    0;
  const homNay = new Date().toLocaleDateString("sv-SE", {
    timeZone: "Asia/Ho_Chi_Minh",
  });
  const [soMuc, onb, pv, offerCho, dxCho] = await Promise.all([
    Promise.all(HR_MUC.map((m) => dem(m.bang))),
    db
      .from("theo_doi_onboarding")
      .select("id", { count: "exact", head: true })
      .in("tinh_trang", ["Chuẩn bị", "Đang thử việc"]),
    db
      .from("lich_phong_van")
      .select("id", { count: "exact", head: true })
      .gte("thoi_gian", `${homNay}T00:00:00+07:00`)
      .eq("ket_qua", "Chờ"),
    db
      .from("offer_tuyen_dung")
      .select("id", { count: "exact", head: true })
      .in("trang_thai", ["Chờ duyệt", "Đã gửi", "Thương lượng"]),
    db
      .from("de_xuat_phe_duyet")
      .select("id", { count: "exact", head: true })
      .eq("trang_thai", "Chờ duyệt"),
  ]);
  const can = [
    {
      n: pv.count ?? 0,
      nhan: "buổi phỏng vấn sắp tới",
      href: "/hr/lich-phong-van",
    },
    {
      n: offerCho.count ?? 0,
      nhan: "offer đang chờ",
      href: "/hr/offer-tuyen-dung",
    },
    {
      n: dxCho.count ?? 0,
      nhan: "đề xuất chờ duyệt",
      href: "/hr/de-xuat-phe-duyet",
    },
    {
      n: onb.count ?? 0,
      nhan: "người đang onboarding",
      href: "/hr/onboarding",
    },
  ];
  return (
    <>
      <TieuDeTrang
        tieuDe="Vận hành HCNS"
        phu="Sổ riêng của phòng HCNS: tuyển dụng, phỏng vấn, offer, onboarding, hạn báo cáo nhà nước. KPI, BSC, công việc và công lương ở màn riêng."
      />
      <ul className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {can.map((c) => (
          <li key={c.nhan}>
            <Link
              href={c.href}
              className="the-noi block rounded-nho border border-vien bg-giay-sang p-4 transition-shadow hover:[box-shadow:var(--bong-2)]"
            >
              <div className="chu-tieu-de text-[32px] leading-none text-nhan-dam">
                {c.n}
              </div>
              <div className="mt-1.5 text-[13px] text-muc-2">{c.nhan}</div>
            </Link>
          </li>
        ))}
      </ul>
      <section aria-label="Tuyển dụng">
        <h2 className="mb-3 text-[13px] font-medium uppercase tracking-[0.08em] text-muc-3">
          1 · Tuyển dụng
        </h2>
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          <Muc
            href="/tuyen-dung"
            Icon={ClipboardList}
            ten="Tin tuyển dụng & ứng viên"
            moTa="Đăng tin theo kênh, theo dõi ứng viên qua từng vòng."
          />
          {HR_MUC.map((m, i) =>
            m.nhom !== "Tuyển dụng" || coMucMenu(m.ma) ? null : (
              <Muc
                key={m.ma}
                href={`/hr/${m.ma}`}
                Icon={ICON[m.ma] ?? Target}
                ten={m.ten}
                moTa={m.moTa}
                so={soMuc[i]}
              />
            ),
          )}
        </ul>
      </section>
      <section aria-label="Onboarding" className="mt-8">
        <h2 className="mb-3 text-[13px] font-medium uppercase tracking-[0.08em] text-muc-3">
          2 · Onboarding & thử việc 60 ngày
        </h2>
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          <Muc
            href="/hr/onboarding"
            Icon={UserCheck}
            ten="Onboarding & thử việc"
            moTa="Lộ trình 4 giai đoạn, hồ sơ, đánh giá mentor 30/60 ngày, quyết định lên chính thức."
            so={onb.count ?? 0}
          />
        </ul>
      </section>
      <section aria-label="Hợp đồng" className="mt-8">
        <h2 className="mb-3 text-[13px] font-medium uppercase tracking-[0.08em] text-muc-3">
          4 · Hợp đồng & thăng tiến
        </h2>
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {HR_MUC.map((m, i) =>
            m.nhom !== "Hợp đồng & thăng tiến" || coMucMenu(m.ma) ? null : (
              <Muc
                key={m.ma}
                href={`/hr/${m.ma}`}
                Icon={ICON[m.ma] ?? Target}
                ten={m.ten}
                moTa={m.moTa}
                so={soMuc[i]}
              />
            ),
          )}
        </ul>
      </section>
      {NHOM_KHAC.map((nhom, k) => (
        <section key={nhom} aria-label={nhom} className="mt-8">
          <h2 className="mb-3 text-[13px] font-medium uppercase tracking-[0.08em] text-muc-3">
            {5 + k} · {nhom}
          </h2>
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {(LIEN_KET_THEM[nhom] ?? []).map((l) => (
              <Muc
                key={l.href}
                href={l.href}
                Icon={l.Icon}
                ten={l.ten}
                moTa={l.moTa}
              />
            ))}
            {HR_MUC.map((m, i) =>
              m.nhom !== nhom || coMucMenu(m.ma) ? null : (
                <Muc
                  key={m.ma}
                  href={`/hr/${m.ma}`}
                  Icon={ICON[m.ma] ?? Target}
                  ten={m.ten}
                  moTa={m.moTa}
                  so={soMuc[i]}
                />
              ),
            )}
          </ul>
        </section>
      ))}
    </>
  );
}

/** Màn đã có chỗ riêng trong menu Nhân sự thì không nhắc lại ở đây (mỗi mục chỉ một chỗ). */
const coMucMenu = (ma: string) =>
  menuChinh.some((m) => m.duong_dan === `/hr/${ma}`);
const NHOM_DA_CO = [
  "Tuyển dụng",
  "Hợp đồng & thăng tiến",
  "KPI & thi đua",
  "BSC & mục tiêu",
  "Công, lương & bảo hiểm",
  "Hồ sơ & hợp đồng",
];
const NHOM_KHAC = [...new Set(HR_MUC.map((m) => m.nhom))].filter(
  (n) => !NHOM_DA_CO.includes(n),
);
const LIEN_KET_THEM: Record<
  string,
  { href: string; Icon: typeof Target; ten: string; moTa: string }[]
> = {
  "Hồ sơ & hợp đồng": [
    {
      href: "/nhan-su",
      Icon: UserCheck,
      ten: "Hồ sơ nhân sự",
      moTa: "Sơ yếu lý lịch, giấy tờ bắt buộc theo luật, cảnh báo thiếu giấy tờ, hợp đồng và tài sản của từng người.",
    },
  ],
  "Công, lương & bảo hiểm": [
    {
      href: "/bang-cong",
      Icon: CalendarClock,
      ten: "Bảng công tháng",
      moTa: "Chấm công cả tháng theo mã công và ngày lễ.",
    },
    {
      href: "/luong",
      Icon: Wallet,
      ten: "Bảng lương",
      moTa: "Kỳ lương, thỏa thuận lương, tham số (bảo hiểm, thuế, giới hạn tăng ca).",
    },
  ],
};

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
        className="the-noi group flex h-full items-start gap-3.5 rounded-nho border border-vien bg-giay-sang p-4 transition-shadow hover:[box-shadow:var(--bong-2)]"
      >
        <span className="nut-vang flex h-10 w-10 shrink-0 items-center justify-center rounded-nho">
          <Icon strokeWidth={1.7} className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2 text-[15px] font-semibold text-muc">
            {ten}
            {so !== undefined && (
              <span className="rounded-tag bg-giay-tram px-2 py-0.5 text-[12px] font-medium text-muc-2">
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
