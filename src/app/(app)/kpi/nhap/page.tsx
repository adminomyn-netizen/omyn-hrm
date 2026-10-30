export const dynamic = "force-dynamic";

import Link from "next/link";
import { FormNhapKpi } from "@/components/kpi/FormNhapKpi";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { chiTieuApCho, docKy, kyGanDay, ngayNhapHopLe } from "@/lib/kpi";
import { docKetQua, homNayHcm, nguoiNhapDuoc, taiNen } from "@/lib/kpi-data";

/** Nhập kết quả KPI một ngày. Nhân viên nhập của mình; trưởng phòng nhập cho cấp dưới trực tiếp; Quản trị/HCNS nhập cho mọi người. */
export default async function TrangNhapKpi({
  searchParams,
}: {
  searchParams: Promise<{ ngay?: string; phong?: string }>;
}) {
  const sp = await searchParams;
  const homNay = homNayHcm();
  const ngay = sp.ngay && ngayNhapHopLe(sp.ngay, homNay) ? sp.ngay : homNay;
  const nen = await taiNen();
  const duoc = nguoiNhapDuoc(nen).filter(
    (n) => !sp.phong || n.khoiId === sp.phong,
  );
  const kq = await docKetQua(ngay, ngay);
  const gia = new Map(
    kq.map((r) => [`${r.nhanVienId}|${r.chiTieuId}`, String(r.thucTe)]),
  );
  const nguoi = duoc.flatMap((n) => {
    const cts = chiTieuApCho(nen.chiTieu, n.khoiId);
    return cts.length
      ? [
          {
            id: n.id,
            ten: n.hoTen,
            chiTieu: cts.map((c) => ({
              id: c.id,
              ten: c.ten,
              donVi: c.donVi,
              muc: c.mucTieuNgay,
              chieu: c.chieu,
              gia: gia.get(`${n.id}|${c.id}`) ?? "",
            })),
          },
        ]
      : [];
  });
  const chips = kyGanDay(homNay).filter((k) => docKy(k.ma)?.loai === "ngay");
  const phongCoNguoi = [
    ...new Set(
      nguoiNhapDuoc(nen)
        .map((n) => n.khoiId)
        .filter((x): x is string => !!x),
    ),
  ];
  return (
    <>
      <TieuDeTrang
        tieuDe="Nhập kết quả KPI"
        phu={
          <>
            <Link href="/kpi" className="text-nhan-dam hover:underline">
              ← Thi đua KPI
            </Link>
            <span className="mx-2 text-vien-dam">·</span>Ngày{" "}
            {docKy(ngay)?.nhan}
          </>
        }
      />
      <nav aria-label="Chọn ngày" className="mb-4 flex flex-wrap gap-2">
        {chips.map((k) => (
          <Link
            key={k.ma}
            href={`/kpi/nhap?ngay=${k.ma}${sp.phong ? `&phong=${sp.phong}` : ""}`}
            aria-current={k.ma === ngay ? "page" : undefined}
            className={`rounded-tag px-3 py-1.5 text-[13px] font-medium ${k.ma === ngay ? "nut-vang" : "border border-vien-dam text-muc-2 hover:bg-giay-tram"}`}
          >
            {k.nhan}
          </Link>
        ))}
      </nav>
      {nen.toi.xemToanCongTy && phongCoNguoi.length > 1 && (
        <nav aria-label="Lọc phòng" className="mb-4 flex flex-wrap gap-2">
          <Link
            href={`/kpi/nhap?ngay=${ngay}`}
            className={`rounded-tag px-3 py-1.5 text-[13px] font-medium ${!sp.phong ? "nut-vang" : "border border-vien-dam text-muc-2 hover:bg-giay-tram"}`}
          >
            Tất cả
          </Link>
          {phongCoNguoi.map((p) => (
            <Link
              key={p}
              href={`/kpi/nhap?ngay=${ngay}&phong=${p}`}
              className={`rounded-tag px-3 py-1.5 text-[13px] font-medium ${sp.phong === p ? "nut-vang" : "border border-vien-dam text-muc-2 hover:bg-giay-tram"}`}
            >
              {nen.khoi.get(p)}
            </Link>
          ))}
        </nav>
      )}
      {nguoi.length === 0 ? (
        <p className="rounded-nho border border-vien bg-giay-sang p-4 text-[14px] text-muc-2">
          Chưa có chỉ tiêu nào áp cho người bạn được nhập. Nhờ Quản trị thêm ở
          “Chỉ tiêu KPI”.
        </p>
      ) : (
        <FormNhapKpi
          key={`${ngay}|${sp.phong ?? ""}`}
          ngay={ngay}
          nguoi={nguoi}
        />
      )}
    </>
  );
}
