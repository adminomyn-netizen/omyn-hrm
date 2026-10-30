"use client";

import { useState, useTransition } from "react";
import { luuQuyenNghiepVu } from "./actions";
import { Chon } from "@/components/ui/Chon";
import { NUT_CHINH } from "@/components/ui/dinh-dang";

const LUA_CHON = [
  { gia_tri: "khong", nhan: "Không vào được" },
  { gia_tri: "xem", nhan: "Chỉ xem" },
  { gia_tri: "nhap", nhan: "Xem và nhập" },
];

type Khoi = { id: string; ten: string; viTri: string };
type Mang = { ma: string; ten: string; mau: number; moTa: string };

/** Bảng chọn: mỗi mảng một khối thẻ, trong đó mỗi khối nhân sự một ô chọn Không / Xem / Nhập. */
export function FormQuyen({ mang, khoi, quyen }: { mang: Mang[]; khoi: Khoi[]; quyen: Record<string, string> }) {
  const [dang, bat] = useTransition();
  const [tb, setTb] = useState<{ loai: "ok" | "loi"; chu: string } | null>(null);
  return (
    <form
      action={(fd) =>
        bat(async () => {
          const kq = await luuQuyenNghiepVu(fd);
          setTb(kq.loi ? { loai: "loi", chu: kq.loi } : { loai: "ok", chu: kq.doi ? `Đã lưu, ${kq.doi} ô thay đổi (đã ghi vào lịch sử).` : "Không có gì thay đổi." });
        })
      }
    >
      <div className="space-y-7">
        {mang.map((m) => (
          <section key={m.ma} data-m={m.mau} className="mau-nhom">
            <h2 className="mau-chu mb-1 text-[17px] font-semibold">{m.ten}</h2>
            <p className="mb-3 text-[13px] text-muc-3">{m.moTa}</p>
            <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {khoi.map((k) => (
                <li key={k.id} className="the-noi mau-vach rounded-nho border border-vien bg-giay-sang p-4">
                  <label htmlFor={`q-${m.ma}-${k.id}`} className="block text-[15px] font-semibold text-muc">{k.ten}</label>
                  <span className="mb-2 block text-[12.5px] text-muc-3">{k.viTri}</span>
                  <Chon id={`q-${m.ma}-${k.id}`} ten={`q:${m.ma}:${k.id}`} giaTriMacDinh={quyen[`${m.ma}:${k.id}`] ?? "khong"} luaChon={LUA_CHON} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <div className="sticky bottom-0 -mx-4 mt-8 flex flex-wrap items-center gap-3 border-t border-vien bg-giay px-4 py-3 lg:-mx-10 lg:px-10">
        <button type="submit" disabled={dang} className={NUT_CHINH}>{dang ? "Đang lưu…" : "Lưu phân quyền"}</button>
        {tb && <span role="status" className={`text-[13px] ${tb.loai === "loi" ? "text-loi" : "text-muc-2"}`}>{tb.chu}</span>}
      </div>
    </form>
  );
}
