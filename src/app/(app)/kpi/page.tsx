export const dynamic = "force-dynamic";

import Link from "next/link";
import { PencilLine } from "lucide-react";
import { BucVinhDanh, DanhSachHang } from "@/components/kpi/BucVinhDanh";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { TabHieuSuat } from "@/components/hieu-suat/TabHieuSuat";
import { docKy, kyChua, kyGanDay } from "@/lib/kpi";
import {
  bangXepHang,
  docThuong,
  homNayHcm,
  nguoiNhapDuoc,
  type Thuong,
} from "@/lib/kpi-data";
import { NUT_PHU } from "@/components/ui/dinh-dang";

const TIEN = (n: number) => `${n.toLocaleString("vi-VN")} đ`;

/** Bảng xếp hạng thi đua. Quản trị/Kỹ thuật/HCNS: cả công ty, chọn phòng để xem chi tiết. Trưởng phòng và nhân viên: các phòng thi đua + phòng mình + toàn công ty. */
export default async function TrangKpi({
  searchParams,
}: {
  searchParams: Promise<{ ky?: string; phong?: string }>;
}) {
  const sp = await searchParams;
  const homNay = homNayHcm();
  const ky = docKy(sp.ky ?? "") ?? docKy(kyChua(homNay, "thang"))!;
  const b = await bangXepHang(ky);
  const { toi, khoi, chiTieu } = b.nen;
  const thuong = ky.loai === "ngay" ? [] : await docThuong();
  const tienThuong = (phamVi: Thuong["phamVi"]) => (hang: number) => {
    const t = thuong.find(
      (x) =>
        x.kyLoai === (ky.loai === "thang" ? "Tháng" : "Quý") &&
        x.phamVi === phamVi &&
        x.hang === hang,
    );
    return t && t.soTien > 0 ? `Thưởng ${TIEN(t.soTien)}` : (t?.moTa ?? null);
  };
  const phongXem = toi.xemToanCongTy
    ? sp.phong && b.trongPhong.has(sp.phong)
      ? sp.phong
      : null
    : toi.khoiId;
  const dsPhong = phongXem ? (b.trongPhong.get(phongXem) ?? []) : [];
  const nhapDuoc = nguoiNhapDuoc(b.nen);
  const thieuHomNay =
    ky.loai === "ngay" && ky.ma === homNay
      ? nhapDuoc.filter(
          (n) =>
            b.nen.chiTieu.some(
              (c) => c.khoiId === null || c.khoiId === n.khoiId,
            ) && !b.daBaoHomNay(n.id, homNay),
        ).length
      : 0;
  const topCongTy = b.toanCongTy.filter(
    (x) => x.hang <= 10 || x.id === toi.nhanVienId,
  );
  const href = (o: { ky?: string; phong?: string | null }) =>
    `/kpi?ky=${o.ky ?? ky.ma}${o.phong ? `&phong=${o.phong}` : ""}`;

  return (
    <>
      <TabHieuSuat dang="kpi" />
      <TieuDeTrang
        tieuDe="Thi đua KPI"
        phu={`${ky.nhan} · điểm = trung bình % đạt chỉ tiêu (tối đa 120%)`}
      >
        <Link
          href={`/kpi/nhap?ngay=${homNay}`}
          className={`${NUT_PHU} inline-flex items-center gap-2`}
        >
          <PencilLine strokeWidth={1.7} className="h-4 w-4" aria-hidden />
          Nhập kết quả
        </Link>
      </TieuDeTrang>

      <nav aria-label="Chọn kỳ" className="mb-6 flex flex-wrap gap-2">
        {kyGanDay(homNay).map((k) => (
          <Link
            key={k.ma}
            href={href({ ky: k.ma })}
            aria-current={k.ma === ky.ma ? "page" : undefined}
            className={`rounded-tag px-3 py-1.5 text-[13px] font-medium ${k.ma === ky.ma ? "nut-vang" : "border border-vien-dam text-muc-2 hover:bg-giay-tram"}`}
          >
            {k.nhan}
          </Link>
        ))}
      </nav>

      {chiTieu.length === 0 && (
        <p className="mb-6 rounded-nho border border-vien bg-giay-sang p-4 text-[14px] text-muc-2">
          Chưa có chỉ tiêu nào.
          {toi.xemToanCongTy ? (
            <>
              {" "}
              Thêm ở{" "}
              <Link
                href="/hr/kpi-chi-tieu"
                className="text-nhan-dam underline-offset-4 hover:underline"
              >
                Chỉ tiêu KPI
              </Link>{" "}
              để bắt đầu thi đua.
            </>
          ) : (
            " Quản trị sẽ thêm chỉ tiêu cho phòng của bạn."
          )}
        </p>
      )}
      {thieuHomNay > 0 && (
        <p
          role="status"
          className="mb-6 rounded-nho border border-vien bg-canh-bao-nen p-3.5 text-[14px] text-canh-bao"
        >
          Hôm nay còn {thieuHomNay} người chưa có kết quả.{" "}
          <Link
            href={`/kpi/nhap?ngay=${homNay}`}
            className="font-medium underline underline-offset-4"
          >
            Nhập ngay
          </Link>
        </p>
      )}

      <section aria-label="Xếp hạng phòng" className="mb-8">
        <h2 className="mb-3 text-[13px] font-medium uppercase tracking-[0.08em] text-muc-3">
          Các phòng
        </h2>
        <BucVinhDanh
          ds={b.hangPhong.map((x) => ({ ...x, phu: `${x.soNguoi} người` }))}
          thuong={tienThuong("Phòng")}
          nhanMinh={toi.khoiId ?? undefined}
        />
        <div className="mt-4">
          <DanhSachHang
            ds={b.hangPhong.map((x) => ({ ...x, phu: `${x.soNguoi} người` }))}
            minh={toi.khoiId}
          />
        </div>
      </section>

      <section aria-label="Xếp hạng trong phòng" className="mb-8">
        <h2 className="mb-3 text-[13px] font-medium uppercase tracking-[0.08em] text-muc-3">
          {phongXem ? `Trong phòng ${khoi.get(phongXem) ?? ""}` : "Trong phòng"}
        </h2>
        {toi.xemToanCongTy && (
          <div className="mb-3 flex flex-wrap gap-2">
            {b.hangPhong.map((p) => (
              <Link
                key={p.id}
                href={href({ phong: p.id })}
                className={`rounded-tag px-3 py-1.5 text-[13px] font-medium ${p.id === phongXem ? "nut-vang" : "border border-vien-dam text-muc-2 hover:bg-giay-tram"}`}
              >
                {p.ten}
              </Link>
            ))}
          </div>
        )}
        {phongXem ? (
          dsPhong.length ? (
            <>
              <BucVinhDanh
                ds={dsPhong}
                thuong={tienThuong("Cá nhân trong phòng")}
                nhanMinh={toi.nhanVienId ?? undefined}
              />
              <div className="mt-4">
                <DanhSachHang ds={dsPhong} minh={toi.nhanVienId} />
              </div>
            </>
          ) : (
            <p className="text-[14px] text-muc-3">
              Phòng này chưa có ai có kết quả trong kỳ.
            </p>
          )
        ) : (
          <p className="text-[14px] text-muc-3">
            Chọn một phòng để xem từng người.
          </p>
        )}
      </section>

      <section aria-label="Xếp hạng toàn công ty" className="mb-8">
        <h2 className="mb-3 text-[13px] font-medium uppercase tracking-[0.08em] text-muc-3">
          Toàn công ty
        </h2>
        <BucVinhDanh
          ds={b.toanCongTy.map((x) => ({
            ...x,
            phu: x.khoiId ? khoi.get(x.khoiId) : undefined,
          }))}
          thuong={tienThuong("Cá nhân toàn công ty")}
          nhanMinh={toi.nhanVienId ?? undefined}
        />
        <div className="mt-4">
          <DanhSachHang
            ds={topCongTy.map((x) => ({
              ...x,
              phu: x.khoiId ? khoi.get(x.khoiId) : undefined,
            }))}
            minh={toi.nhanVienId}
          />
        </div>
      </section>

      {toi.nhanVienId && b.chiTiet.get(toi.nhanVienId) && (
        <section aria-label="Điểm của tôi" className="mb-8">
          <h2 className="mb-3 text-[13px] font-medium uppercase tracking-[0.08em] text-muc-3">
            Điểm của bạn theo chỉ tiêu
          </h2>
          <ul className="divide-y divide-vien rounded-nho border border-vien bg-giay-sang">
            {b.chiTiet.get(toi.nhanVienId)!.map((c) => (
              <li
                key={c.chiTieuId}
                className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-[14px]"
              >
                <span className="text-muc">
                  {c.ten}
                  <span className="ml-2 text-[12px] text-muc-3">
                    {c.soNgay} ngày có báo
                  </span>
                </span>
                <span className="font-semibold text-nhan-dam">
                  {c.diem.toLocaleString("vi-VN", { maximumFractionDigits: 1 })}
                  %
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
