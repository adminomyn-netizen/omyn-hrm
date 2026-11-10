"use client";

import { useState } from "react";
import { BangLuongKy, type KyView } from "./BangLuongKy";
import { ThueBaoHiem } from "./ThueBaoHiem";
import { ThoaThuanLuong, type ThoaThuanView } from "./ThoaThuanLuong";
import { ThamSoLuong, type ThamSoView } from "./ThamSoLuong";
import type { DongLuongView } from "./ChiTietDongLuong";
import type { ThamSo } from "@/lib/luong/tinh-luong";

const TAB = [["bang", "Bảng lương"], ["thue-bh", "Thuế và bảo hiểm"], ["thoa-thuan", "Thỏa thuận lương"], ["tham-so", "Tham số"]] as const;

export function QuanLyLuong({ ky, chon, dong, thamSo, thoaThuan, thamSoDs, duocDuyet }: { ky: KyView[]; chon: string; dong: DongLuongView[]; thamSo: ThamSo; thoaThuan: ThoaThuanView[]; thamSoDs: ThamSoView[]; duocDuyet: boolean }) {
  const [tab, setTab] = useState<(typeof TAB)[number][0]>("bang");
  const chua = thamSoDs.filter((t) => !t.xac_nhan_luc).length;
  return (
    <div className="space-y-7">
      <div role="tablist" className="flex gap-6 border-b border-vien">
        {TAB.map(([k, nhan]) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`-mb-px border-b-2 pb-3 text-[14px] font-medium ${tab === k ? "border-nhan text-muc" : "border-transparent text-muc-3 hover:text-muc"}`}>
            {nhan}{k === "tham-so" && chua > 0 && <span className="ml-1.5 rounded-tag bg-canh-bao-nen px-1.5 py-0.5 text-[11px] text-canh-bao">{chua}</span>}
          </button>
        ))}
      </div>
      {tab === "bang" && <BangLuongKy ky={ky} chon={chon} dong={dong} thamSo={thamSo} duocDuyet={duocDuyet} />}
      {tab === "thue-bh" && <ThueBaoHiem ky={ky} chon={chon} dong={dong} thamSo={thamSo} />}
      {tab === "thoa-thuan" && <ThoaThuanLuong ds={thoaThuan} tienAnNgay={thamSo.tien_an_ngay} duocSuaKhauTru10={duocDuyet} />}
      {tab === "tham-so" && <ThamSoLuong ds={thamSoDs} />}
    </div>
  );
}
