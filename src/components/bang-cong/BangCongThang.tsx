"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Chon } from "@/components/ui/Chon";
import { Hop } from "@/components/ui/Hop";
import { NgayChon } from "@/components/ui/NgayChon";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { NHAN_O, NUT_CHINH, NUT_CHU_NGUY, NUT_PHU, O_NHAP } from "@/components/ui/dinh-dang";
import { themNgayLe, xoaNgayLe } from "@/app/(app)/bang-cong/actions";
import { CHU_THICH_CONG, ngayIso, type MaCong } from "@/lib/cong";
import type { DongBangCong, NgayLe } from "@/lib/bang-cong";

const THANG = Array.from({ length: 12 }, (_, i) => ({ gia_tri: String(i + 1), nhan: `Tháng ${i + 1}` }));
const THU = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

/** Màu ô theo mã công (chỉ dùng token của hệ thiết kế; chữ cái mã vẫn là dấu hiệu chính, màu chỉ phụ trợ). */
const MAU: Record<Exclude<MaCong, "">, string> = {
  X: "bg-nhan-nhat text-nhan-dam",
  CT: "bg-nhan-nhat text-nhan-dam font-semibold",
  N: "bg-canh-bao-nen text-canh-bao",
  P: "bg-canh-bao-nen text-canh-bao font-semibold",
  L: "bg-loi-nen text-loi",
  O: "bg-loi-nen text-loi",
  KP: "bg-loi-nen text-loi",
  "CĐ": "bg-loi-nen text-loi",
  V: "border border-loi text-loi font-semibold",
};
const so = (n: number) => (n === 0 ? "" : String(Math.round(n * 10) / 10).replace(".", ","));
const ngayVN = (iso: string) => iso.split("-").reverse().join("/");
const TONG_COT = ["X", "N", "CT", "P", "L", "O", "KP", "CĐ", "V"] as const;

/** Bảng chấm công tháng: mỗi nhân viên một dòng, mỗi ngày một ô mã công (X, N, CT, P, L, O, KP, CĐ, V), cột tổng và công hưởng lương. */
export function BangCongThang({ nam, thang, hienTai, dong, ngayLe, soNgay, homNay }: { nam: number; thang: number; hienTai: { nam: number; thang: number }; dong: DongBangCong[]; ngayLe: NgayLe[]; soNgay: number; homNay: string }) {
  const router = useRouter();
  const [hop, setHop] = useState(false);
  const [loi, setLoi] = useState<string | undefined>();
  const [ngayMoi, setNgayMoi] = useState("");
  const [tenMoi, setTenMoi] = useState("");
  const [dangXuLy, startXuLy] = useTransition();

  const sang = (n: number, t: number) => {
    const d = new Date(n, t - 1, 1);
    router.push(`/bang-cong?nam=${d.getFullYear()}&thang=${d.getMonth() + 1}`);
  };
  const namLuaChon = Array.from({ length: 7 }, (_, i) => String(hienTai.nam - 3 + i)).map((n) => ({ gia_tri: n, nhan: n }));
  const dauThang = `${nam}-${String(thang).padStart(2, "0")}`;
  const leTrongThang = new Set(ngayLe.filter((l) => l.ngay.startsWith(dauThang)).map((l) => l.ngay));
  const ngay = Array.from({ length: soNgay }, (_, i) => {
    const iso = ngayIso(nam, thang, i + 1);
    return { so: i + 1, iso, thu: new Date(`${iso}T00:00:00Z`).getUTCDay() };
  });
  const dongHop = () => {
    setHop(false);
    setLoi(undefined);
  };

  const them = () => {
    const fd = new FormData();
    fd.set("ngay", ngayMoi);
    fd.set("ten", tenMoi);
    startXuLy(async () => {
      const kq = await themNgayLe(fd);
      if (kq.loi) return setLoi(kq.loi);
      setLoi(undefined);
      setNgayMoi("");
      setTenMoi("");
      router.refresh();
    });
  };
  const xoa = (n: string) => {
    const fd = new FormData();
    fd.set("ngay", n);
    startXuLy(async () => {
      const kq = await xoaNgayLe(fd);
      if (kq.loi) setLoi(kq.loi);
      else {
        setLoi(undefined);
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-6">
      <TieuDeTrang tieuDe="Bảng công tháng" phu={`Tháng ${thang}/${nam} · ${dong.length} nhân viên · mã công từng ngày và công hưởng lương`}>
        <a href={`/api/xuat/bang-cong?nam=${nam}&thang=${thang}`} download className={`${NUT_PHU} inline-flex items-center`}>Xuất Excel</a>
        <button type="button" className={NUT_PHU} onClick={() => setHop(true)}>Ngày lễ</button>
      </TieuDeTrang>

      <div className="flex flex-wrap items-center gap-2.5">
        <button type="button" aria-label="Tháng trước" onClick={() => sang(nam, thang - 1)} className="flex h-10 w-10 items-center justify-center rounded-nho border border-vien-dam text-muc-2 hover:bg-giay-tram"><ChevronLeft className="h-4 w-4" /></button>
        <Chon nho ariaLabel="Tháng" giaTri={String(thang)} onDoi={(v) => sang(nam, Number(v))} className="w-32" luaChon={THANG} />
        <Chon nho ariaLabel="Năm" giaTri={String(nam)} onDoi={(v) => sang(Number(v), thang)} className="w-24" luaChon={namLuaChon} />
        <button type="button" aria-label="Tháng sau" onClick={() => sang(nam, thang + 1)} className="flex h-10 w-10 items-center justify-center rounded-nho border border-vien-dam text-muc-2 hover:bg-giay-tram"><ChevronRight className="h-4 w-4" /></button>
        {(nam !== hienTai.nam || thang !== hienTai.thang) && <button type="button" className={NUT_PHU} onClick={() => sang(hienTai.nam, hienTai.thang)}>Tháng này</button>}
      </div>

      <details className="the-noi the-noi-thap px-4 py-3 text-[14px]">
        <summary className="cursor-pointer font-medium text-muc">Chú thích mã công và cách tính lương</summary>
        <ul className="mt-3 grid gap-x-8 gap-y-2 sm:grid-cols-2">
          {CHU_THICH_CONG.map((c) => (
            <li key={c.ma} className="flex items-start gap-2.5">
              <span className={`mt-0.5 inline-flex h-6 min-w-8 shrink-0 items-center justify-center rounded-tag px-1.5 text-[12px] ${MAU[c.ma]}`}>{c.ma}</span>
              <span className="text-muc-2"><span className="text-muc">{c.ten}.</span> {c.coLuong}.</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[13px] text-muc-3">Chủ nhật không tính (công ty làm thứ Hai đến thứ Bảy). Người miễn chấm công (Giám đốc và người được giữ quyền giám đốc) mặc định đủ công các ngày làm việc đã qua. Cùng bộ quy tắc này được dùng khi lập bảng lương.</p>
      </details>

      <div className="overflow-x-auto rounded-the border border-vien">
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr className="bg-giay-tram text-muc-2">
              <th className="sticky left-0 z-10 min-w-[180px] bg-giay-tram px-3 py-2 text-left text-[12px] font-medium">Nhân viên</th>
              {ngay.map((n) => (
                <th key={n.iso} className={`h-11 min-w-[28px] px-0 text-center font-medium ${leTrongThang.has(n.iso) ? "bg-loi-nen text-loi" : n.thu === 0 ? "text-muc-3" : ""} ${n.iso === homNay ? "outline outline-2 -outline-offset-2 outline-nhan" : ""}`} title={leTrongThang.has(n.iso) ? ngayLe.find((l) => l.ngay === n.iso)?.ten : undefined}>
                  <div>{n.so}</div>
                  <div className="text-[10px] font-normal opacity-80">{THU[n.thu]}</div>
                </th>
              ))}
              {TONG_COT.map((c, i) => <th key={c} className={`min-w-[30px] border-l px-1 text-center font-medium ${i === 0 ? "border-l-2 border-vien-dam" : "border-vien"}`} title={CHU_THICH_CONG.find((x) => x.ma === c)?.ten}>{c}</th>)}
              <th className="sticky right-0 z-10 min-w-[72px] border-l border-vien-dam bg-nhan-nhat px-2 text-center font-semibold text-nhan-dam">Công hưởng</th>
            </tr>
          </thead>
          <tbody>
            {dong.map((d) => (
              <tr key={d.nhanVienId} className="border-t border-vien hover:bg-giay-tram/50">
                <td className="sticky left-0 z-10 bg-giay-sang px-3 py-1.5">
                  <div className="font-medium text-muc">{d.hoTen}</div>
                  <div className="text-[11px] text-muc-3">{[d.maNhanVien, d.khoi].filter(Boolean).join(" · ") || d.chucDanh}{d.mienChamCong ? " · miễn chấm công" : ""}</div>
                </td>
                {d.o.map((o, i) => (
                  <td key={i} className={`p-0.5 text-center ${ngay[i].thu === 0 ? "bg-giay-tram/70" : ""}`} title={o.ghiChu}>
                    {o.ma && <span className={`flex h-7 items-center justify-center rounded-[4px] text-[11px] ${MAU[o.ma]}`}>{o.ma}</span>}
                  </td>
                ))}
                {TONG_COT.map((c, i) => <td key={c} className={`border-l px-1 text-center tabular-nums text-muc-2 ${i === 0 ? "border-l-2 border-vien-dam" : "border-vien"}`}>{so(d.tong[c])}</td>)}
                <td className="sticky right-0 z-10 border-l border-vien-dam bg-nhan-nhat px-2 text-center text-[13px] font-semibold tabular-nums text-nhan-dam">{so(d.tong.congHuong) || "0"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {dong.length === 0 && <p className="chu-tieu-de py-12 text-center text-[22px] text-muc-3">Chưa có nhân viên nào đang làm.</p>}
      </div>

      <Hop mo={hop} dong={dongHop} tieuDe="Ngày nghỉ lễ" moTa="Ngày lễ ghi mã L và được tính đủ công. Tết Nguyên đán, Giỗ Tổ và ngày nghỉ bù cần nhập theo thông báo của Nhà nước.">
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-[170px_1fr]">
            <div>
              <label htmlFor="le-ngay" className={NHAN_O}>Ngày</label>
              <NgayChon id="le-ngay" giaTri={ngayMoi} onDoi={setNgayMoi} tuNam={2024} denNam={2100} />
            </div>
            <div>
              <label htmlFor="le-ten" className={NHAN_O}>Tên ngày lễ</label>
              <input id="le-ten" value={tenMoi} onChange={(e) => setTenMoi(e.target.value)} placeholder="Ví dụ: Giỗ Tổ Hùng Vương" className={O_NHAP} />
            </div>
          </div>
          <div className="nhan-muc">Ngày lễ đã có</div>
          <ul className="max-h-64 divide-y divide-vien overflow-y-auto rounded-nho border border-vien text-[14px]">
            {ngayLe.length === 0 && <li className="px-3 py-3 text-muc-3">Chưa có ngày lễ nào.</li>}
            {ngayLe.map((l) => (
              <li key={l.ngay} className="flex items-center justify-between gap-3 px-3 py-2">
                <span><span className="font-medium tabular-nums text-muc">{ngayVN(l.ngay)}</span> <span className="text-muc-2">{l.ten}</span></span>
                <button type="button" className={NUT_CHU_NGUY} disabled={dangXuLy} onClick={() => xoa(l.ngay)}>Xoá</button>
              </li>
            ))}
          </ul>
          {loi && <div role="alert" className="rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi">{loi}</div>}
          <div className="flex justify-end gap-2 border-t border-vien pt-4">
            <button type="button" className={NUT_PHU} onClick={dongHop}>Đóng</button>
            <button type="button" className={NUT_CHINH} disabled={dangXuLy} onClick={them}>{dangXuLy ? "Đang lưu" : "Thêm ngày lễ"}</button>
          </div>
        </div>
      </Hop>
    </div>
  );
}
