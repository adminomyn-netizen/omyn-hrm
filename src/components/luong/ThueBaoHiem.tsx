"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Hop } from "@/components/ui/Hop";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NUT_CHU, NUT_PHU } from "@/components/ui/dinh-dang";
import { chiTietBacThue, type ThamSo } from "@/lib/luong/tinh-luong";
import { tienVN, trieuVN } from "@/lib/dinh-dang";
import type { DongLuongView } from "./ChiTietDongLuong";
import type { KyView } from "./BangLuongKy";

const pt = (n: number) => `${String(n).replace(".", ",")}%`;

/** Thuế TNCN và bảo hiểm của kỳ đang chọn, theo từng người; bấm "Chi tiết" xem cách ra số (bảo hiểm, giảm trừ, 5 bậc thuế). */
export function ThueBaoHiem({ ky, chon, dong, thamSo }: { ky: KyView[]; chon: string; dong: DongLuongView[]; thamSo: ThamSo }) {
  const router = useRouter();
  const [xem, setXem] = useState<DongLuongView | null>(null);
  const kyChon = ky.find((k) => k.id === chon);
  const tong = (f: (d: DongLuongView) => number) => dong.reduce((t, d) => t + f(d), 0);

  if (!kyChon) return <p className="chu-tieu-de py-14 text-center text-[24px] text-muc-3">Chưa có kỳ lương nào. Tạo kỳ ở tab Bảng lương trước.</p>;
  const bacCuaXem = xem && !xem.thu_viec ? chiTietBacThue(xem.thu_nhap_tinh_thue, thamSo) : [];
  const bhNld = (d: DongLuongView) => d.bh_xh + d.bh_yt + d.bh_tn;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2.5">
        {ky.map((k) => (
          <button key={k.id} type="button" onClick={() => router.push(`/luong?ky=${k.id}`)} className={`rounded-nho border px-3.5 py-2 text-[13px] ${k.id === chon ? "border-nhan bg-nhan-nhat font-semibold text-nhan-dam" : "border-vien bg-giay-sang text-muc-2 hover:border-vien-dam"}`}>{k.ten_ky}</button>
        ))}
      </div>

      <dl className="grid grid-cols-2 border-y border-vien lg:grid-cols-4">
        {[
          ["Bảo hiểm người lao động đóng", trieuVN(tong(bhNld))],
          ["Bảo hiểm công ty đóng", trieuVN(tong((d) => d.bh_cty))],
          ["Thuế TNCN phải khấu trừ", trieuVN(tong((d) => d.thue_tncn))],
          ["Thu nhập tính thuế", trieuVN(tong((d) => d.thu_nhap_tinh_thue))],
        ].map(([nhan, s], i) => (
          <div key={nhan} className={`px-5 py-5 lg:px-6 ${i % 2 === 1 ? "border-l border-vien" : ""} ${i >= 2 ? "border-t border-vien lg:border-t-0" : ""} ${i > 0 ? "lg:border-l lg:border-vien" : ""}`}>
            <dd className="text-[28px] font-medium leading-none tabular-nums text-muc">{s}</dd>
            <dt className="mt-2 text-[13px] text-muc-3">{nhan}</dt>
          </div>
        ))}
      </dl>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-[14px]">
          <thead>
            <tr className="nhan-muc border-b border-vien">
              <th className="py-3 pr-4 font-medium">Nhân viên</th>
              <th className="py-3 pr-4 text-right font-medium">BHXH</th>
              <th className="py-3 pr-4 text-right font-medium">BHYT</th>
              <th className="py-3 pr-4 text-right font-medium">BHTN</th>
              <th className="py-3 pr-4 text-right font-medium">Công ty đóng</th>
              <th className="py-3 pr-4 text-right font-medium">Giảm trừ</th>
              <th className="py-3 pr-4 text-right font-medium">TN tính thuế</th>
              <th className="py-3 pr-4 text-right font-medium">Thuế TNCN</th>
              <th className="py-3" />
            </tr>
          </thead>
          <tbody>
            {dong.map((d) => (
              <tr key={d.id} className="h-[56px] border-b border-vien hover:bg-giay-tram/60">
                <td className="py-2 pr-4"><div className="font-medium text-muc">{d.ho_ten} {d.thu_viec && <NhanTrangThai kieu="cho">Thử việc</NhanTrangThai>}</div><div className="text-[13px] text-muc-3">{d.so_nguoi_phu_thuoc > 0 ? `${d.so_nguoi_phu_thuoc} người phụ thuộc` : "Không có người phụ thuộc"}{!d.dong_bh ? " · không đóng BH" : ""}</div></td>
                <td className="py-2 pr-4 text-right tabular-nums text-muc-2">{tienVN(d.bh_xh)}</td>
                <td className="py-2 pr-4 text-right tabular-nums text-muc-2">{tienVN(d.bh_yt)}</td>
                <td className="py-2 pr-4 text-right tabular-nums text-muc-2">{tienVN(d.bh_tn)}</td>
                <td className="py-2 pr-4 text-right tabular-nums text-muc-2">{tienVN(d.bh_cty)}</td>
                <td className="py-2 pr-4 text-right tabular-nums text-muc-2">{tienVN(d.giam_tru)}</td>
                <td className="py-2 pr-4 text-right tabular-nums text-muc-2">{tienVN(d.thu_nhap_tinh_thue)}</td>
                <td className="py-2 pr-4 text-right font-semibold tabular-nums text-muc">{tienVN(d.thue_tncn)}</td>
                <td className="py-2 text-right"><button type="button" className={NUT_CHU} onClick={() => setXem(d)}>Chi tiết</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {dong.length === 0 && <p className="chu-tieu-de py-12 text-center text-[24px] text-muc-3">Kỳ này chưa có dòng lương. Lập bảng lương ở tab Bảng lương.</p>}
      </div>
      <p className="text-[13px] text-muc-3">Mức đóng và biểu thuế lấy từ tab Tham số. Lương thử việc không đóng bảo hiểm và bị khấu trừ thuế theo mức cố định; các tham số chưa xác nhận cần HCNS/kế toán kiểm trước khi chi lương thật.</p>

      <Hop mo={!!xem} dong={() => setXem(null)} tieuDe={xem ? `Thuế và bảo hiểm · ${xem.ho_ten}` : ""} moTa={kyChon.ten_ky} rong="rong">
        {xem && (
          <div className="space-y-5 text-[14px]">
            <section>
              <div className="nhan-muc mb-1.5">Bảo hiểm người lao động đóng</div>
              <dl className="divide-y divide-vien border-y border-vien">
                {[["Bảo hiểm xã hội", thamSo.bhxh_nld, xem.bh_xh], ["Bảo hiểm y tế", thamSo.bhyt_nld, xem.bh_yt], ["Bảo hiểm thất nghiệp", thamSo.bhtn_nld, xem.bh_tn]].map(([n, r, v]) => (
                  <div key={String(n)} className="flex justify-between py-2"><dt className="text-muc-2">{n} <span className="text-muc-3">({pt(Number(r))})</span></dt><dd className="tabular-nums">{tienVN(Number(v))}</dd></div>
                ))}
                <div className="flex justify-between py-2 font-semibold text-muc"><dt>Cộng</dt><dd className="tabular-nums">{tienVN(bhNld(xem))}</dd></div>
              </dl>
              <p className="mt-1.5 text-[13px] text-muc-3">{xem.thu_viec ? "Đang thử việc nên chưa đóng bảo hiểm." : !xem.dong_bh ? "Thỏa thuận lương ghi không đóng bảo hiểm." : `Tính trên lương chức danh, có trần: BHXH/BHYT ${tienVN(thamSo.tran_dong_bhxh_bhyt)}, BHTN ${tienVN(thamSo.tran_dong_bhtn)}. Công ty đóng thêm ${tienVN(xem.bh_cty)}.`}</p>
            </section>
            <section>
              <div className="nhan-muc mb-1.5">Giảm trừ và thu nhập tính thuế</div>
              <dl className="divide-y divide-vien border-y border-vien">
                {xem.thu_viec ? (
                  <div className="flex justify-between py-2"><dt className="text-muc-2">Thử việc: khấu trừ {pt(thamSo.khau_tru_vang_lai_ty_le)} khi thu nhập từ {tienVN(thamSo.khau_tru_vang_lai_nguong)}, không giảm trừ</dt><dd className="tabular-nums">{tienVN(xem.thu_nhap_tinh_thue)}</dd></div>
                ) : (
                  <>
                    <div className="flex justify-between py-2"><dt className="text-muc-2">Giảm trừ bản thân</dt><dd className="tabular-nums">{tienVN(thamSo.giam_tru_ban_than)}</dd></div>
                    <div className="flex justify-between py-2"><dt className="text-muc-2">Người phụ thuộc ({xem.so_nguoi_phu_thuoc} × {tienVN(thamSo.giam_tru_phu_thuoc)})</dt><dd className="tabular-nums">{tienVN(xem.so_nguoi_phu_thuoc * thamSo.giam_tru_phu_thuoc)}</dd></div>
                    <div className="flex justify-between py-2 font-semibold text-muc"><dt>Thu nhập tính thuế (sau khi trừ bảo hiểm và giảm trừ)</dt><dd className="tabular-nums">{tienVN(xem.thu_nhap_tinh_thue)}</dd></div>
                  </>
                )}
              </dl>
            </section>
            {!xem.thu_viec && (
              <section>
                <div className="nhan-muc mb-1.5">Thuế lũy tiến 5 bậc</div>
                {bacCuaXem.length === 0 ? <p className="text-muc-3">Thu nhập tính thuế bằng 0 nên không phải nộp thuế.</p> : (
                  <table className="w-full text-left">
                    <thead><tr className="nhan-muc border-b border-vien"><th className="py-2 font-medium">Bậc</th><th className="py-2 text-right font-medium">Thu nhập trong bậc</th><th className="py-2 text-right font-medium">Thuế suất</th><th className="py-2 text-right font-medium">Thuế</th></tr></thead>
                    <tbody>
                      {bacCuaXem.map((b) => (
                        <tr key={b.bac} className="border-b border-vien"><td className="py-2 text-muc-2">Bậc {b.bac} <span className="text-muc-3">({b.den ? `đến ${trieuVN(b.den)}` : `trên ${trieuVN(b.tu)}`})</span></td><td className="py-2 text-right tabular-nums">{tienVN(b.phan)}</td><td className="py-2 text-right tabular-nums">{pt(b.suat)}</td><td className="py-2 text-right tabular-nums">{tienVN(b.thue)}</td></tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </section>
            )}
            <div className="flex items-center justify-between border-t border-vien pt-4">
              <div className="text-[15px] font-semibold text-muc">Thuế TNCN: {tienVN(xem.thue_tncn)}</div>
              <button type="button" className={NUT_PHU} onClick={() => setXem(null)}>Đóng</button>
            </div>
          </div>
        )}
      </Hop>
    </div>
  );
}
