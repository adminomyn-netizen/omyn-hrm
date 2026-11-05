"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Hop } from "@/components/ui/Hop";
import { Chon } from "@/components/ui/Chon";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NHAN_O, NUT_CHINH, NUT_CHU, NUT_CHU_NGUY, NUT_PHU } from "@/components/ui/dinh-dang";
import { ChiTietDongLuong, type DongLuongView } from "./ChiTietDongLuong";
import { chuyenKyLuong, lapBangLuong, taoKyLuong, tinhLaiKy, xoaKyLuong } from "@/app/(app)/luong/actions";
import type { ThamSo } from "@/lib/luong/tinh-luong";
import { tienVN, trieuVN } from "@/lib/dinh-dang";

export type KyView = { id: string; ten_ky: string; thang: number | null; nam: number | null; trang_thai: string; soNguoi: number; thucLinh: number; tongThuNhap: number };

const BUOC = [
  { k: "mo", nhan: "Mở" },
  { k: "da_lap", nhan: "Đã lập" },
  { k: "da_kiem", nhan: "Đã kiểm" },
  { k: "da_duyet", nhan: "Đã duyệt" },
  { k: "da_chi", nhan: "Đã chi" },
] as const;
const TIEP: Record<string, { nhan: string; hint: string } | undefined> = {
  mo: { nhan: "Lập bảng lương", hint: "Tạo dòng lương cho mọi nhân viên đã có thỏa thuận" },
  da_lap: { nhan: "Chuyển sang Đã kiểm", hint: "Khoá số liệu để kiểm tra" },
  da_kiem: { nhan: "Duyệt bảng lương", hint: "Cần mọi tham số đã được xác nhận" },
  da_duyet: { nhan: "Đánh dấu Đã chi", hint: "Sau khi chuyển khoản xong" },
};

export function BangLuongKy({ ky, chon, dong, thamSo }: { ky: KyView[]; chon: string; dong: DongLuongView[]; thamSo: ThamSo }) {
  const router = useRouter();
  const [hop, setHop] = useState<{ k: "tao" } | { k: "dong"; d: DongLuongView } | { k: "xoa" } | null>(null);
  const [loi, setLoi] = useState<string | undefined>();
  const [tb, setTb] = useState<string | undefined>();
  const [dangXuLy, startXuLy] = useTransition();
  const [thang, setThang] = useState(String(new Date().getMonth() + 1));
  const [nam, setNam] = useState(String(new Date().getFullYear()));

  const kyChon = ky.find((k) => k.id === chon);
  const suaDuoc = !!kyChon && ["mo", "da_lap"].includes(kyChon.trang_thai);
  const dem = (f: (d: DongLuongView) => number) => dong.reduce((t, d) => t + f(d), 0);

  const chayKy = (fn: (fd: FormData) => Promise<{ loi?: string; thongBao?: string }>, sau?: () => void) => {
    if (!kyChon) return;
    const fd = new FormData();
    fd.set("ky_id", kyChon.id);
    setLoi(undefined);
    setTb(undefined);
    startXuLy(async () => {
      const r = await fn(fd);
      if (r.loi) setLoi(r.loi);
      else {
        setTb(r.thongBao);
        sau?.();
        router.refresh();
      }
    });
  };
  const taoKy = () => {
    const fd = new FormData();
    fd.set("thang", thang);
    fd.set("nam", nam);
    setLoi(undefined);
    startXuLy(async () => {
      const r = await taoKyLuong(fd);
      if (r.loi) setLoi(r.loi);
      else {
        setHop(null);
        router.refresh();
      }
    });
  };
  const chuyen = (kyId: string) => router.push(`/luong?ky=${kyId}`);

  return (
    <>
      <div className="flex flex-wrap items-center gap-2.5">
        {ky.map((k) => (
          <button key={k.id} type="button" onClick={() => chuyen(k.id)} className={`flex flex-col items-start rounded-[10px] border px-4 py-2.5 text-left ${k.id === chon ? "border-nhan bg-nhan-nhat" : "border-vien bg-giay-sang hover:border-vien-dam"}`}>
            <span className="text-[14px] font-semibold text-muc">{k.ten_ky}</span>
            <span className="text-[12px] text-muc-3">{BUOC.find((b) => b.k === k.trang_thai)?.nhan} · {k.soNguoi} người</span>
          </button>
        ))}
        <button type="button" onClick={() => setHop({ k: "tao" })} className={NUT_PHU}>+ Tạo kỳ lương</button>
      </div>

      {!kyChon ? (
        <p className="chu-tieu-de py-16 text-center text-[26px] text-muc-3">Chưa có kỳ lương nào. Tạo kỳ lương đầu tiên, rồi nhập thỏa thuận lương cho từng người.</p>
      ) : (
        <div className="mt-7 space-y-7">
          {/* các bước của kỳ */}
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-2" aria-label="Các bước của kỳ lương">
            {BUOC.map((b, i) => {
              const hienTai = BUOC.findIndex((x) => x.k === kyChon.trang_thai);
              const xong = i < hienTai;
              const dang = i === hienTai;
              return (
                <li key={b.k} className="flex items-center gap-2">
                  <span className={`flex h-6 min-w-6 items-center justify-center px-1.5 text-[12px] font-semibold ${dang ? "text-[var(--chu-tren-vang)]" : xong ? "bg-nhan-nhat text-nhan-dam" : "border border-vien text-muc-3"}`} style={{ borderRadius: 9999, ...(dang ? { background: "var(--gradient-vang)" } : {}) }}>{i + 1}</span>
                  <span className={`text-[13px] ${dang ? "font-semibold text-muc" : "text-muc-3"}`}>{b.nhan}</span>
                  {i < BUOC.length - 1 && <span aria-hidden className="mx-1 h-px w-6 bg-vien" />}
                </li>
              );
            })}
          </ol>

          <dl className="grid grid-cols-2 border-y border-vien lg:grid-cols-4">
            {[
              ["Tổng thu nhập", trieuVN(dem((d) => d.tong_thu_nhap))],
              ["Thực lĩnh", trieuVN(dem((d) => d.thuc_linh))],
              ["Thuế TNCN", trieuVN(dem((d) => d.thue_tncn))],
              ["Bảo hiểm công ty chi", trieuVN(dem((d) => d.bh_cty))],
            ].map(([nhan, s], i) => (
              <div key={nhan} className={`px-5 py-5 lg:px-6 ${i % 2 === 1 ? "border-l border-vien" : ""} ${i >= 2 ? "border-t border-vien lg:border-t-0" : ""} ${i > 0 ? "lg:border-l lg:border-vien" : ""}`}>
                <dd className="text-[28px] font-medium leading-none tabular-nums text-muc">{s}</dd>
                <dt className="mt-2 text-[13px] text-muc-3">{nhan}</dt>
              </div>
            ))}
          </dl>

          {(loi || tb) && <div role={loi ? "alert" : "status"} className={`rounded-nho px-3 py-2.5 text-[14px] ${loi ? "bg-loi-nen text-loi" : "bg-nhan-nhat text-nhan-dam"}`}>{loi ?? tb}</div>}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[15px] font-semibold text-muc">Chi tiết · {kyChon.ten_ky}</h2>
            <div className="flex flex-wrap items-center gap-3">
              {dong.length > 0 && <a href={`/api/xuat/bang-luong?ky=${kyChon.id}`} className={NUT_CHU} download>Xuất Excel</a>}
              {suaDuoc && kyChon.trang_thai === "da_lap" && (
                <>
                  <button type="button" className={NUT_CHU} disabled={dangXuLy} onClick={() => chayKy(lapBangLuong)}>Lập thêm cho người mới</button>
                  <button type="button" className={NUT_CHU} disabled={dangXuLy} onClick={() => chayKy(tinhLaiKy)}>Cập nhật và tính lại cả kỳ</button>
                </>
              )}
              {kyChon.trang_thai === "mo" && dong.length === 0 && <button type="button" className={NUT_CHU_NGUY} onClick={() => setHop({ k: "xoa" })}>Xoá kỳ</button>}
              {TIEP[kyChon.trang_thai] && (
                <button type="button" className={NUT_CHINH} disabled={dangXuLy} title={TIEP[kyChon.trang_thai]!.hint} onClick={() => chayKy(kyChon.trang_thai === "mo" ? lapBangLuong : chuyenKyLuong)}>
                  {dangXuLy ? "Đang xử lý" : TIEP[kyChon.trang_thai]!.nhan}
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-[14px]">
              <thead>
                <tr className="nhan-muc border-b border-vien">
                  <th className="py-3 pr-4 font-medium">Nhân viên</th>
                  <th className="py-3 pr-4 text-right font-medium">Công</th>
                  <th className="py-3 pr-4 text-right font-medium">Tổng thu nhập</th>
                  <th className="py-3 pr-4 text-right font-medium">Bảo hiểm</th>
                  <th className="py-3 pr-4 text-right font-medium">Thuế</th>
                  <th className="py-3 pr-4 text-right font-medium">Thực lĩnh</th>
                  <th className="py-3" />
                </tr>
              </thead>
              <tbody>
                {dong.map((d) => (
                  <tr key={d.id} className="h-[60px] border-b border-vien hover:bg-giay-tram/60">
                    <td className="py-2 pr-4">
                      <div className="font-medium text-muc">{d.ho_ten} {d.thu_viec && <NhanTrangThai kieu="cho">Thử việc</NhanTrangThai>}</div>
                      <div className="text-[13px] text-muc-3">{[d.chuc_danh, d.khoi_ten].filter(Boolean).join(" · ")}</div>
                    </td>
                    <td className="py-2 pr-4 text-right tabular-nums text-muc-2">{d.cong_huong}/{d.cong_chuan}</td>
                    <td className="py-2 pr-4 text-right tabular-nums text-muc-2">{tienVN(d.tong_thu_nhap)}</td>
                    <td className="py-2 pr-4 text-right tabular-nums text-muc-2">{tienVN(d.bh_xh + d.bh_yt + d.bh_tn)}</td>
                    <td className="py-2 pr-4 text-right tabular-nums text-muc-2">{tienVN(d.thue_tncn)}</td>
                    <td className="py-2 pr-4 text-right font-semibold tabular-nums text-muc">{tienVN(d.thuc_linh)}</td>
                    <td className="py-2 text-right"><button type="button" className={NUT_CHU} onClick={() => setHop({ k: "dong", d })}>{suaDuoc ? "Sửa" : "Xem"}</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {dong.length === 0 && <p className="chu-tieu-de py-12 text-center text-[24px] text-muc-3">Chưa có dòng lương. Bấm &ldquo;Lập bảng lương&rdquo; sau khi đã nhập thỏa thuận lương cho nhân viên.</p>}
          </div>
        </div>
      )}

      <Hop mo={hop?.k === "tao"} dong={() => { setHop(null); setLoi(undefined); }} tieuDe="Tạo kỳ lương" moTa="Mỗi tháng một kỳ. Kỳ đi lần lượt: Mở → Đã lập → Đã kiểm → Đã duyệt → Đã chi.">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className={NHAN_O}>Tháng</label><Chon giaTri={thang} onDoi={setThang} luaChon={Array.from({ length: 12 }, (_, i) => ({ gia_tri: String(i + 1), nhan: `Tháng ${i + 1}` }))} /></div>
            <div><label className={NHAN_O}>Năm</label><Chon giaTri={nam} onDoi={setNam} luaChon={[2025, 2026, 2027, 2028].map((n) => ({ gia_tri: String(n), nhan: String(n) }))} /></div>
          </div>
          {loi && <div role="alert" className="rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi">{loi}</div>}
          <div className="flex justify-end gap-2 border-t border-vien pt-4">
            <button type="button" className={NUT_PHU} onClick={() => setHop(null)} disabled={dangXuLy}>Huỷ</button>
            <button type="button" className={NUT_CHINH} onClick={taoKy} disabled={dangXuLy}>Tạo kỳ lương</button>
          </div>
        </div>
      </Hop>

      <Hop mo={hop?.k === "dong"} dong={() => { setHop(null); setLoi(undefined); }} tieuDe="Dòng lương" rong="rong">
        {hop?.k === "dong" && <ChiTietDongLuong key={hop.d.id} dong={hop.d} thamSo={thamSo} suaDuoc={suaDuoc} xong={() => setHop(null)} huy={() => setHop(null)} />}
      </Hop>

      <Hop mo={hop?.k === "xoa"} dong={() => setHop(null)} tieuDe="Xoá kỳ lương">
        <div className="space-y-4">
          <p className="text-[15px] text-muc-2">Xoá <strong className="font-semibold text-muc">{kyChon?.ten_ky}</strong>? Kỳ chưa có dòng lương nào nên xoá được.</p>
          <div className="flex justify-end gap-2 border-t border-vien pt-4">
            <button type="button" className={NUT_PHU} onClick={() => setHop(null)} disabled={dangXuLy}>Huỷ</button>
            <button type="button" disabled={dangXuLy} onClick={() => chayKy(xoaKyLuong, () => { setHop(null); router.push("/luong"); })} className="h-10 rounded-nho bg-loi px-4 text-[14px] font-medium text-white hover:opacity-90 disabled:opacity-60">Xoá kỳ</button>
          </div>
        </div>
      </Hop>
    </>
  );
}
