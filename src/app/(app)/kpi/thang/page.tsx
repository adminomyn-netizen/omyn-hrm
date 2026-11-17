export const dynamic = "force-dynamic";

import Link from "next/link";
import { FormKpiThang, type NguoiThangForm } from "@/components/kpi/FormKpiThang";
import { TabHieuSuat } from "@/components/hieu-suat/TabHieuSuat";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { chuanChucDanh, diemThangCacNguoi, thangGanDay, thangNhapHopLe } from "@/lib/kpi";
import { docChiTieuThang, docKetQuaThang, homNayHcm, nguoiNhapDuoc, taiNen } from "@/lib/kpi-data";

/** KPI theo vị trí, theo tháng. Mục tiêu đặt theo chức danh (Thiết lập → Chỉ tiêu KPI theo tháng); nhân viên nhập của mình, trưởng phòng nhập cho cấp dưới trực tiếp, Quản trị/HCNS nhập cho mọi người. */
export default async function TrangKpiThang({ searchParams }: { searchParams: Promise<{ thang?: string }> }) {
  const sp = await searchParams;
  const homNay = homNayHcm();
  const thang = sp.thang && thangNhapHopLe(sp.thang, homNay) ? sp.thang : homNay.slice(0, 7);
  const nen = await taiNen();
  const [cts, kq] = await Promise.all([docChiTieuThang(), docKetQuaThang(thang)]);
  const duoc = nguoiNhapDuoc(nen).map((n) => ({ id: n.id, hoTen: n.hoTen, khoiId: n.khoiId, chucDanh: n.chucDanh }));
  const diem = diemThangCacNguoi(duoc, cts, kq);
  const gia = new Map(kq.map((r) => [`${r.nhanVienId}|${r.chiTieuId}`, String(r.thucTe)]));
  const nguoi: NguoiThangForm[] = duoc.flatMap((n) => {
    const d = diem.get(n.id);
    if (!d) return [];
    return [{
      id: n.id, ten: n.hoTen, chucDanh: (n.chucDanh ?? "").trim(), diem: d.diem, daBao: d.daBao, tong: d.tong,
      chiTieu: d.chiTiet.map((c) => ({ id: c.chiTieuId, ten: c.ten, donVi: c.donVi, muc: c.mucTieu, chieu: c.chieu, gia: gia.get(`${n.id}|${c.chiTieuId}`) ?? "", phanTram: c.phanTram })),
    }];
  });
  const coKhopNguoi = new Set(nen.nguoi.map((n) => chuanChucDanh(n.chucDanh)));
  const chucDanhMoGoi = [...new Set(cts.map((c) => c.chucDanh))].filter((cd) => !coKhopNguoi.has(chuanChucDanh(cd)));
  return (
    <>
      <TabHieuSuat dang="kpi" />
      <TieuDeTrang
        tieuDe="KPI theo vị trí (tháng)"
        phu={<><Link href="/kpi" className="text-nhan-dam hover:underline">← Thi đua KPI</Link><span className="mx-2 text-vien-dam">·</span>Tháng {thang.slice(5)}/{thang.slice(0, 4)} · điểm = trung bình có trọng số % đạt (tối đa 120%)</>}
      />
      <nav aria-label="Chọn tháng" className="mb-4 flex flex-wrap gap-2">
        {thangGanDay(homNay).map((t) => (
          <Link key={t.ma} href={`/kpi/thang?thang=${t.ma}`} aria-current={t.ma === thang ? "page" : undefined}
            className={`rounded-tag px-3 py-1.5 text-[13px] font-medium ${t.ma === thang ? "nut-vang" : "border border-vien-dam text-muc-2 hover:bg-giay-tram"}`}>
            {t.nhan}
          </Link>
        ))}
      </nav>
      {nen.toi.xemToanCongTy && chucDanhMoGoi.length > 0 && (
        <p className="mb-4 rounded-nho border border-vien bg-giay-sang p-4 text-[14px] text-muc-2">
          Chưa có ai mang chức danh: {chucDanhMoGoi.join(", ")}. Kiểm tra chức danh trong hồ sơ nhân sự có trùng với chỉ tiêu không.
        </p>
      )}
      {nguoi.length === 0 ? (
        <p className="rounded-nho border border-vien bg-giay-sang p-4 text-[14px] text-muc-2">
          {cts.length === 0
            ? <>Chưa có chỉ tiêu nào theo vị trí.{nen.toi.xemToanCongTy ? <> Thêm ở <Link href="/hr/kpi-chi-tieu-thang" className="text-nhan-dam underline-offset-4 hover:underline">Chỉ tiêu KPI theo tháng</Link> (chọn chức danh, mục tiêu tháng).</> : " Quản trị sẽ thêm chỉ tiêu cho vị trí của bạn."}</>
            : "Chưa có chỉ tiêu nào áp cho chức danh của người bạn được nhập."}
        </p>
      ) : (
        <FormKpiThang key={thang} thang={thang} nguoi={nguoi} />
      )}
    </>
  );
}
