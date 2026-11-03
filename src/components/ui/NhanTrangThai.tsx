import { mauSac, sacTuTrangThai, type Sac } from "@/lib/mau-trang-thai";

const KIEU = {
  tot: "bg-nhan-nhat text-nhan-dam",
  cho: "bg-canh-bao-nen text-canh-bao",
  loi: "bg-loi-nen text-loi",
  tram: "bg-giay-tram text-muc-2",
} as const;

/** Nhãn trạng thái: chữ nhỏ trên nền nhạt cùng sắc, không viền, bo nhỏ.
 *  `sac` chọn thẳng một sắc (xanh, tim, luc, cam, hong, la, xam…). Không chọn mà để `tram` thì tự đoán sắc theo chữ (Đã duyệt xanh lá, Chờ duyệt vàng, Từ chối đỏ…). */
export function NhanTrangThai({ kieu = "tram", sac, children }: { kieu?: keyof typeof KIEU; sac?: Sac; children: React.ReactNode }) {
  const tuDoan = !sac && kieu === "tram" && typeof children === "string" ? sacTuTrangThai(children) : null;
  const chon = sac ?? tuDoan;
  if (chon) {
    const m = mauSac(chon);
    return (
      <span className="inline-block rounded-tag px-2 py-0.5 text-[12px] font-medium" style={{ background: m.nen, color: m.chu }}>{children}</span>
    );
  }
  return (
    <span className={`inline-block rounded-tag px-2 py-0.5 text-[12px] font-medium ${KIEU[kieu]}`}>{children}</span>
  );
}
