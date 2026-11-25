export const dynamic = "force-dynamic";

import Link from "next/link";
import { FormChamThang, type NguoiChamForm } from "@/components/kpi/FormChamThang";
import { TepDinhKem } from "@/components/hr/TepDinhKem";
import { TabHieuSuat } from "@/components/hieu-suat/TabHieuSuat";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { chuanChucDanh, coCheCuaNguoi, diemThangCuaNguoi, thangGanDay, thangNhapHopLe, tongTyTrong } from "@/lib/kpi";
import { docChamThang, docCoChe, homNayHcm, nguoiChamDuoc, taiNen } from "@/lib/kpi-data";

const SO = (n: number) => n.toLocaleString("vi-VN");

/** Cơ chế KPI theo vị trí và điểm chấm theo tháng (mẫu chị Phượng 17/11). Cơ chế (mô tả, mục đích, nhóm công việc + tỷ trọng, nguyên tắc, quy trình, tệp) thiết lập ở Thiết lập → Cơ chế KPI theo vị trí.
 * Ban lãnh đạo (Quản trị/Kỹ thuật, HCNS) chấm cho mọi người, trưởng phòng chấm cho cấp dưới trực tiếp; nhân viên xem cơ chế và điểm của chính mình. */
export default async function TrangKpiThang({ searchParams }: { searchParams: Promise<{ thang?: string }> }) {
  const sp = await searchParams;
  const homNay = homNayHcm();
  const thang = sp.thang && thangNhapHopLe(sp.thang, homNay) ? sp.thang : homNay.slice(0, 7);
  const nen = await taiNen();
  const [coChe, cham] = await Promise.all([docCoChe(), docChamThang(thang)]);
  const admin = nen.toi.xemToanCongTy;
  const toiRow = nen.nguoi.find((n) => n.id === nen.toi.nhanVienId);
  const duocCham = nguoiChamDuoc(nen);
  const chamCua = (nvId: string) => cham.filter((c) => c.nhanVienId === nvId);

  const tenNguoi = new Map(nen.nguoi.map((n) => [n.id, n.hoTen]));
  const khoi = coChe.map((c) => {
    const nguoiCham = duocCham.filter((n) => coCheCuaNguoi(coChe, n)?.id === c.id && c.nhom.length > 0);
    const cuaToi = !!toiRow && coCheCuaNguoi(coChe, toiRow)?.id === c.id;
    return { c, nguoiCham, cuaToi };
  }).filter((x) => admin || x.nguoiCham.length > 0 || x.cuaToi);

  const coNguoi = new Set(nen.nguoi.map((n) => chuanChucDanh(n.chucDanh)));
  const viTriChuaCoNguoi = admin ? coChe.filter((c) => !c.nhanVienId && !coNguoi.has(chuanChucDanh(c.ten))).map((c) => c.ten) : [];
  const coCheRiengNguoiLa = admin ? coChe.filter((c) => c.nhanVienId && !tenNguoi.has(c.nhanVienId)).map((c) => c.ten) : [];
  const lechTyTrong = admin ? coChe.filter((c) => c.nhom.length > 0 && tongTyTrong(c.nhom) !== 100).map((c) => `${c.ten} (${SO(tongTyTrong(c.nhom))}%)`) : [];

  return (
    <>
      <TabHieuSuat dang="kpi" />
      <TieuDeTrang
        tieuDe="KPI theo vị trí (tháng)"
        phu={<><Link href="/kpi" className="text-nhan-dam hover:underline">← Thi đua KPI</Link><span className="mx-2 text-vien-dam">·</span>Tháng {thang.slice(5)}/{thang.slice(0, 4)} · điểm tối đa 100 = Σ (% hoàn thành × tỷ trọng)</>}
      >
        {admin && <Link href="/hr/kpi-co-che" className="h-10 rounded-nho border border-vien-dam px-4 text-[14px] font-medium leading-10 text-muc-2 hover:bg-giay-tram">Thiết lập cơ chế</Link>}
      </TieuDeTrang>
      <nav aria-label="Chọn tháng" className="mb-4 flex flex-wrap gap-2">
        {thangGanDay(homNay).map((t) => (
          <Link key={t.ma} href={`/kpi/thang?thang=${t.ma}`} aria-current={t.ma === thang ? "page" : undefined}
            className={`rounded-tag px-3 py-1.5 text-[13px] font-medium ${t.ma === thang ? "nut-vang" : "border border-vien-dam text-muc-2 hover:bg-giay-tram"}`}>
            {t.nhan}
          </Link>
        ))}
      </nav>
      {viTriChuaCoNguoi.length > 0 && <p className="mb-3 rounded-nho border border-vien bg-giay-sang p-4 text-[14px] text-muc-2">Chưa có ai mang chức danh: {viTriChuaCoNguoi.join(", ")}. Tên vị trí phải trùng chức danh trong hồ sơ nhân sự thì mới chấm được.</p>}
      {coCheRiengNguoiLa.length > 0 && <p className="mb-3 rounded-nho border border-vien bg-giay-sang p-4 text-[14px] text-muc-2">Cơ chế riêng này gắn với người không còn trong danh sách đang làm: {coCheRiengNguoiLa.join(", ")}.</p>}
      {lechTyTrong.length > 0 && <p className="mb-3 rounded-nho border border-vien bg-giay-sang p-4 text-[14px] text-muc-2">Tổng tỷ trọng chưa bằng 100%: {lechTyTrong.join(", ")}.</p>}

      {khoi.length === 0 ? (
        <p className="rounded-nho border border-vien bg-giay-sang p-4 text-[14px] text-muc-2">
          {coChe.length === 0
            ? <>Chưa có cơ chế KPI nào.{admin ? <> Thêm ở <Link href="/hr/kpi-co-che" className="text-nhan-dam underline-offset-4 hover:underline">Cơ chế KPI theo vị trí</Link>: tên vị trí, mô tả, mục đích, nguyên tắc, quy trình, tải file; rồi thêm các nhóm công việc và tỷ trọng ở <Link href="/hr/kpi-co-che-nhom" className="text-nhan-dam underline-offset-4 hover:underline">Nhóm công việc & tỷ trọng</Link>.</> : " Quản trị sẽ thiết lập cho vị trí của bạn."}</>
            : "Chưa có cơ chế KPI nào áp cho vị trí của bạn."}
        </p>
      ) : (
        <div className="space-y-10">
          {khoi.map(({ c, nguoiCham, cuaToi }) => {
            const form: NguoiChamForm[] = nguoiCham.map((n) => ({ id: n.id, ten: n.hoTen, cuaViTri: c.ten, nhom: c.nhom.map((h) => ({ id: h.id, ten: h.ten, tyTrong: h.tyTrong })), gia: Object.fromEntries(chamCua(n.id).map((x) => [x.nhomId, String(x.tyLe)])) }));
            const diemToi = cuaToi && toiRow ? diemThangCuaNguoi(chamCua(toiRow.id), c.nhom.length) : null;
            return (
              <section key={c.id} aria-label={c.ten} className="space-y-4">
                <div>
                  <h2 className="chu-tieu-de text-[22px] text-muc">{c.ten}</h2>
                  <p className="mt-1 text-[13px] text-muc-3">{c.nhanVienId ? <>Cơ chế riêng của <strong className="font-semibold text-muc-2">{tenNguoi.get(c.nhanVienId) ?? "nhân sự đã chọn"}</strong>.</> : <>Áp cho mọi người có chức danh “{c.ten}” chưa có cơ chế riêng.</>}</p>
                </div>
                <details className="the-noi rounded-nho border border-vien bg-giay-sang p-4">
                  <summary className="cursor-pointer text-[14px] font-medium text-nhan-dam">Xem cơ chế KPI của vị trí này</summary>
                  <div className="mt-4 space-y-4 text-[14px] text-muc-2">
                    {c.moTa && <div><h3 className="font-semibold text-muc">Mô tả công việc chính</h3><p className="mt-1 whitespace-pre-line">{c.moTa}</p></div>}
                    {c.mucDich && <div><h3 className="font-semibold text-muc">Mục đích đánh giá</h3><p className="mt-1 whitespace-pre-line">{c.mucDich}</p></div>}
                    <div>
                      <h3 className="font-semibold text-muc">Nhóm công việc và tỷ trọng</h3>
                      {c.nhom.length === 0 ? <p className="mt-1 text-muc-3">Chưa có nhóm công việc.</p> : (
                        <ul className="mt-2 divide-y divide-vien rounded-nho border border-vien">
                          {c.nhom.map((h, i) => (
                            <li key={h.id} className="flex items-start justify-between gap-4 px-3 py-2.5">
                              <div className="min-w-0"><p className="font-medium text-muc">{i + 1}. {h.ten}</p>{h.noiDung && <p className="mt-0.5 whitespace-pre-line">{h.noiDung}</p>}</div>
                              <span className="shrink-0 font-semibold text-muc">{SO(h.tyTrong)}%</span>
                            </li>
                          ))}
                          <li className="flex justify-between px-3 py-2.5 font-semibold text-muc"><span>Tổng</span><span>{SO(tongTyTrong(c.nhom))}%</span></li>
                        </ul>
                      )}
                    </div>
                    {c.nguyenTac && <div><h3 className="font-semibold text-muc">Trách nhiệm và nguyên tắc đánh giá</h3><p className="mt-1 whitespace-pre-line">{c.nguyenTac}</p></div>}
                    {c.quyTrinh && <div><h3 className="font-semibold text-muc">Quy trình đánh giá</h3><p className="mt-1 whitespace-pre-line">{c.quyTrinh}</p></div>}
                    {admin && <TepDinhKem man="kpi-co-che" dongId={c.id} tieuDe="Tệp cơ chế (Word, PDF…)" />}
                  </div>
                </details>
                {diemToi && (
                  <div className="rounded-nho border border-vien bg-giay-sang p-4">
                    <p className="text-[15px] font-semibold text-muc">Điểm của bạn tháng {thang.slice(5)}/{thang.slice(0, 4)}: {diemToi.diem === null ? "chưa chấm" : `${SO(diemToi.diem)}/100`}</p>
                    <ul className="mt-2 space-y-1 text-[14px] text-muc-2">
                      {c.nhom.map((h) => { const x = chamCua(toiRow!.id).find((y) => y.nhomId === h.id); return <li key={h.id}>{h.ten} ({SO(h.tyTrong)}%): {x ? `${SO(x.tyLe)}% hoàn thành` : "chưa chấm"}</li>; })}
                    </ul>
                  </div>
                )}
                {form.length > 0 && <FormChamThang key={`${c.id}-${thang}`} thang={thang} nguoi={form} />}
                {admin && form.length === 0 && c.nhom.length > 0 && <p className="text-[14px] text-muc-3">{c.nhanVienId ? "Người này chưa có trong danh sách đang làm nên chưa chấm được." : `Chưa có ai mang chức danh “${c.ten}” để chấm.`}</p>}
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}
