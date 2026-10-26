"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { LogIn, LogOut, Check, MapPin } from "lucide-react";
import { chamCongVao, chamCongRa } from "@/app/(app)/cham-cong/actions";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { layToaDo } from "./layToaDo";

/** Chấm công của chính mình: một nút tròn lớn (vàng khi chưa vào; xám ngà khi đã vào, bấm để ra). Giờ hiện NGAY khi bấm (lạc quan), lỗi thì hoàn lại.
 * Mỗi lần bấm lấy GPS của thiết bị rồi gửi lên máy chủ; máy chủ so với bán kính quanh văn phòng (xem lib/dinh-vi.ts) và là bên quyết định. */
export function NutChamCong({ gioVao, gioRa, trangThai, banKinhM, khoaViTri }: { gioVao: string | null; gioRa: string | null; trangThai: string | null; banKinhM: number; khoaViTri: boolean }) {
  const [tam, setTam] = useState<{ vao?: string; ra?: string }>({});
  const [loi, setLoi] = useState<{ chu: string; ngoaiVung: boolean } | null>(null);
  const [dangLayViTri, setDangLayViTri] = useState(false);
  const [dang, batDau] = useTransition();
  const bayGio = () => new Date().toLocaleTimeString("en-GB", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit" });

  const cham = (loai: "vao" | "ra") => {
    setLoi(null);
    batDau(async () => {
      // Chưa khoá vị trí thì không hỏi quyền định vị của trình duyệt (khỏi làm phiền).
      let gps: Awaited<ReturnType<typeof layToaDo>> = { loi: "" };
      if (khoaViTri) {
        setDangLayViTri(true);
        gps = await layToaDo();
        setDangLayViTri(false);
      }
      setTam((t) => ({ ...t, [loai]: bayGio() }));
      // Lấy GPS không được vẫn gửi (null): máy chủ quyết định có cần vị trí hay không; nếu cần sẽ trả lỗi, ta ưu tiên nêu đúng lý do GPS.
      const kq = await (loai === "vao" ? chamCongVao : chamCongRa)("toaDo" in gps ? gps.toaDo : null);
      if (kq?.loi) {
        setTam((t) => ({ ...t, [loai]: undefined }));
        setLoi({ chu: "loi" in gps && !kq.ngoaiVung ? gps.loi : kq.loi, ngoaiVung: !!kq.ngoaiVung });
      }
    });
  };
  const vao = gioVao ?? tam.vao ?? null;
  const ra = gioRa ?? tam.ra ?? null;
  const xong = !!vao && !!ra;

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col items-center text-center">
      <div className="relative mt-2 flex h-[236px] w-[236px] items-center justify-center">
        <span aria-hidden className="absolute inset-0 border border-vien" style={{ borderRadius: 9999 }} />
        <span aria-hidden className="absolute inset-4 border border-vien opacity-70" style={{ borderRadius: 9999 }} />
        <div>
          <button
            type="button"
            onClick={() => cham(vao && !ra ? "ra" : "vao")}
            disabled={xong || dang}
            aria-label={xong ? "Đã hoàn tất chấm công hôm nay" : vao ? "Chấm công ra" : "Chấm công vào"}
            className="relative flex h-[184px] w-[184px] flex-col items-center justify-center gap-1.5 text-[18px] font-semibold text-[var(--chu-tren-vang)] disabled:cursor-default"
            style={{
              borderRadius: 9999,
              background: vao ? "linear-gradient(135deg,#d7e3e1,#a9c1bd)" : "var(--gradient-vang)",
              boxShadow: "inset 0 2px 0 rgba(255,255,255,.5), 0 14px 30px rgba(15,118,110,.38)",
              opacity: xong ? 0.8 : 1,
            }}
          >
            {xong ? <Check strokeWidth={1.8} className="h-8 w-8" /> : vao ? <LogOut strokeWidth={1.7} className="h-8 w-8" /> : <LogIn strokeWidth={1.7} className="h-8 w-8" />}
            <span>{xong ? "Đã xong hôm nay" : dangLayViTri ? "Đang lấy vị trí" : dang ? "Đang chấm" : vao ? "Chấm công ra" : "Chấm công vào"}</span>
          </button>
        </div>
      </div>

      <dl className="mt-6 grid w-full grid-cols-2 border-y border-vien py-4">
        <div className="px-2">
          <dt className="text-[12px] text-muc-3">Giờ vào</dt>
          <dd className="mt-0.5 text-[28px] font-medium leading-none tabular-nums text-muc">{vao ?? "--:--"}</dd>
        </div>
        <div className="border-l border-vien px-2">
          <dt className="text-[12px] text-muc-3">Giờ ra</dt>
          <dd className="mt-0.5 text-[28px] font-medium leading-none tabular-nums text-muc">{ra ?? "--:--"}</dd>
        </div>
      </dl>

      {khoaViTri && !loi && (
        <p className="mt-3 flex items-center justify-center gap-1.5 text-[12px] text-muc-3"><MapPin strokeWidth={1.7} className="h-3.5 w-3.5" aria-hidden />Chỉ chấm công được trong phạm vi {banKinhM} m quanh văn phòng (cần bật định vị).</p>
      )}
      {loi && (
        <div role="alert" className="mt-3 w-full rounded-nho bg-loi-nen px-3 py-2.5 text-left text-[14px] text-loi">
          {loi.chu}
          {loi.ngoaiVung && <Link href="/don-tu" className="mt-1.5 block font-medium underline">Nộp phiếu chấm công ngoài công ty</Link>}
        </div>
      )}
      {trangThai && (
        <p className="mt-3 text-[13px] text-muc-3">
          Hôm nay: <NhanTrangThai kieu={trangThai === "Đúng giờ" ? "tot" : trangThai === "Đi muộn" ? "cho" : "loi"}>{trangThai}</NhanTrangThai>
        </p>
      )}
    </div>
  );
}
