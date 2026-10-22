const KIEU = {
  tot: "bg-nhan-nhat text-nhan-dam",
  cho: "bg-canh-bao-nen text-canh-bao",
  loi: "bg-loi-nen text-loi",
  tram: "bg-giay-tram text-muc-2",
} as const;

/** Nhãn trạng thái: chữ nhỏ trên nền nhạt cùng sắc — không viền, không bo tròn lớn. */
export function NhanTrangThai({ kieu = "tram", children }: { kieu?: keyof typeof KIEU; children: React.ReactNode }) {
  return (
    <span className={`inline-block rounded-tag px-2 py-0.5 text-[12px] font-medium ${KIEU[kieu]}`}>{children}</span>
  );
}
