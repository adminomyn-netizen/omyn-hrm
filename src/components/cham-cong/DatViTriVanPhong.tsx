"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MapPin } from "lucide-react";
import { datViTriChamCong, khoangCachToiVanPhong, tatKhoaViTri } from "@/app/(app)/cham-cong/actions";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { layToaDo } from "./layToaDo";
import type { ToaDo } from "@/lib/dinh-vi";

const NUT = "inline-flex h-10 items-center rounded-nho border border-vien-dam px-4 text-[14px] font-medium text-muc hover:bg-giay-tram disabled:opacity-60";
const NUT_CHINH = "nut-vang inline-flex h-10 items-center rounded-nho px-4 text-[14px] disabled:opacity-60";

/** Dành cho Quản trị/Kỹ thuật: đứng tại văn phòng bấm để chốt toạ độ thật; bán kính chỉ 100 m nên toạ độ ước lượng theo tên khu là chưa đủ. */
export function DatViTriVanPhong({ ten, diaChi, banKinhM, daXacNhan }: { ten: string; diaChi: string; banKinhM: number; daXacNhan: boolean }) {
  const router = useRouter();
  const [dang, batDau] = useTransition();
  const [cho, setCho] = useState<{ toaDo: ToaDo; met: number | null } | null>(null);
  const [loi, setLoi] = useState("");

  const layViTri = () => {
    setLoi(""); setCho(null);
    batDau(async () => {
      const gps = await layToaDo();
      if ("loi" in gps) return setLoi(gps.loi);
      const kc = daXacNhan ? await khoangCachToiVanPhong(gps.toaDo) : null;
      setCho({ toaDo: gps.toaDo, met: kc?.met ?? null });
    });
  };
  const luu = () => {
    if (!cho) return;
    batDau(async () => {
      const kq = await datViTriChamCong(cho.toaDo);
      if (kq.loi) setLoi(kq.loi);
      else { setCho(null); router.refresh(); }
    });
  };
  const tat = () => batDau(async () => { const kq = await tatKhoaViTri(); if (kq.loi) setLoi(kq.loi); else router.refresh(); });

  return (
    <div className="max-w-2xl">
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-medium text-muc">{ten}</span>
        <NhanTrangThai kieu={daXacNhan ? "tot" : "cho"}>{daXacNhan ? `Đang khoá trong ${banKinhM} m` : "Chưa khoá vị trí"}</NhanTrangThai>
      </div>
      <p className="mt-1 text-[14px] text-muc-3">{diaChi}</p>
      <p className="mt-3 text-[14px] text-muc-2">
        {daXacNhan
          ? `Nhân viên chỉ chấm công vào/ra được khi đang ở trong phạm vi ${banKinhM} m quanh điểm đã đặt. Ngoài phạm vi phải nộp phiếu "Chấm công ngoài công ty".`
          : "Chưa có toạ độ chính xác của văn phòng nên hiện CHƯA chặn ai. Người đang đứng tại văn phòng bấm nút dưới đây để chốt vị trí; từ đó mới áp dụng khoá."}
      </p>
      {cho ? (
        <div className="mt-4 rounded-nho border border-vien bg-giay-tram px-4 py-3 text-[14px]">
          <p>
            Vị trí vừa lấy sai lệch khoảng ±{Math.round(cho.toaDo.doChinhXac ?? 0)} m.
            {cho.met !== null && ` Cách điểm văn phòng đang lưu ${cho.met} m${cho.met > banKinhM ? ` (xa hơn ${banKinhM} m, nhân viên ở điểm cũ sẽ không chấm được nữa).` : "."}`}
          </p>
          <p className="mt-1 text-muc-3">Chỉ lưu nếu bạn đang đứng đúng tại văn phòng.</p>
          <div className="mt-3 flex gap-2.5">
            <button type="button" className={NUT_CHINH} disabled={dang} onClick={luu}>{dang ? "Đang lưu" : "Lưu làm vị trí văn phòng"}</button>
            <button type="button" className={NUT} disabled={dang} onClick={() => setCho(null)}>Huỷ</button>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2.5">
          <button type="button" className={NUT_CHINH} disabled={dang} onClick={layViTri}><MapPin strokeWidth={1.7} className="mr-2 h-4 w-4" aria-hidden />{dang ? "Đang lấy vị trí" : "Đặt vị trí = chỗ tôi đang đứng"}</button>
          {daXacNhan && <button type="button" className={NUT} disabled={dang} onClick={tat}>Tạm tắt khoá vị trí</button>}
        </div>
      )}
      {loi && <p role="alert" className="mt-3 rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi">{loi}</p>}
    </div>
  );
}
