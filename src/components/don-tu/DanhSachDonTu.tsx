"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Hop } from "@/components/ui/Hop";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { NUT_CHINH, NUT_CHU, NUT_CHU_NGUY } from "@/components/ui/dinh-dang";
import { duyetDonTu } from "@/app/(app)/don-tu/actions";
import { FormDonTu } from "./FormDonTu";
import { ngayVN } from "@/lib/dinh-dang";

export type DongDon = { id: string; loai: string; tu_ngay: string; den_ngay: string; ly_do: string | null; trang_thai: string; nhan_vien_ho_ten?: string };
const kieu = (t: string) => (t === "Đã duyệt" ? "tot" : t === "Từ chối" ? "loi" : "cho");

/** Danh sách đơn. Duyệt/từ chối đổi trạng thái NGAY trên màn hình rồi mới gửi lên máy chủ; lỗi thì tự hoàn lại. */
export type ThongTinNop = { loaiChoPhep: string[]; phepNam: { daDung: number; moiNam: number; nam: number }; nhanVienChon?: { gia_tri: string; nhan: string }[]; macDinhNopCho?: string };

export function DanhSachDonTu({ che, don, nopDon: thongTinNop }: { che: "quan-ly" | "ca-nhan"; don: DongDon[]; nopDon?: ThongTinNop }) {
  const router = useRouter();
  const [loc, setLoc] = useState<"cho" | "tat-ca">(che === "quan-ly" ? "cho" : "tat-ca");
  const [ghiDe, setGhiDe] = useState<Record<string, string>>({});
  const [loi, setLoi] = useState<string | undefined>();
  const [nop, setNop] = useState(false);
  const [, startXuLy] = useTransition();

  const hien = useMemo(() => don.map((d) => ({ ...d, trang_thai: ghiDe[d.id] ?? d.trang_thai })), [don, ghiDe]);
  const soCho = hien.filter((d) => d.trang_thai === "Chờ duyệt").length;
  const ds = loc === "cho" ? hien.filter((d) => d.trang_thai === "Chờ duyệt") : hien;

  const quyet = (id: string, hanhDong: "duyet" | "tu_choi") => {
    setLoi(undefined);
    setGhiDe((g) => ({ ...g, [id]: hanhDong === "duyet" ? "Đã duyệt" : "Từ chối" }));
    const fd = new FormData();
    fd.set("id", id);
    fd.set("hanh_dong", hanhDong);
    startXuLy(async () => {
      const kq = await duyetDonTu(fd);
      if (kq.loi) {
        setGhiDe((g) => {
          const { [id]: _bo, ...con } = g;
          void _bo;
          return con;
        });
        setLoi(kq.loi);
      }
      router.refresh();
    });
  };

  return (
    <>
      <TieuDeTrang tieuDe="Đơn từ và phê duyệt" phu={che === "quan-ly" ? `${soCho} đơn chờ duyệt · ${hien.length} đơn tất cả` : `${hien.length} đơn của bạn`}>
        {thongTinNop && <button type="button" className={NUT_CHINH} onClick={() => setNop(true)}>Nộp đơn mới</button>}
      </TieuDeTrang>
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-vien">
        {che === "quan-ly" ? (
          <div className="flex items-center gap-6" role="tablist" aria-label="Lọc đơn">
            {([["cho", `Chờ duyệt ${soCho}`], ["tat-ca", `Tất cả ${hien.length}`]] as const).map(([k, nhan]) => (
              <button key={k} type="button" role="tab" aria-selected={loc === k} onClick={() => setLoc(k)} className={`-mb-px border-b-2 pb-2.5 text-[14px] ${loc === k ? "border-nhan font-semibold text-muc" : "border-transparent text-muc-2 hover:text-muc"}`}>
                {nhan}
              </button>
            ))}
          </div>
        ) : (
          <h2 className="pb-2.5 text-[14px] font-semibold text-muc">Đơn của tôi</h2>
        )}
      </div>

      {loi && <div role="alert" className="mt-4 rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi">{loi}</div>}

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-[14px]">
          <thead>
            <tr className="nhan-muc border-b border-vien">
              {che === "quan-ly" && <th className="py-3 pr-4 font-medium">Nhân viên</th>}
              <th className="py-3 pr-4 font-medium">Loại đơn</th>
              <th className="py-3 pr-4 font-medium">Thời gian</th>
              <th className="py-3 pr-4 font-medium">Lý do</th>
              <th className="py-3 pr-4 font-medium">Trạng thái</th>
              {che === "quan-ly" && <th className="py-3" />}
            </tr>
          </thead>
          <tbody>
            {ds.map((d) => (
              <tr key={d.id} className="h-[56px] border-b border-vien hover:bg-giay-tram/60">
                {che === "quan-ly" && <td className="py-2 pr-4 font-medium text-muc">{d.nhan_vien_ho_ten}</td>}
                <td className="py-2 pr-4 text-muc">{d.loai}</td>
                <td className="py-2 pr-4 tabular-nums text-muc-2">
                  {ngayVN(d.tu_ngay)}
                  {d.den_ngay !== d.tu_ngay ? ` – ${ngayVN(d.den_ngay)}` : ""}
                </td>
                <td className="max-w-[260px] truncate py-2 pr-4 text-muc-2" title={d.ly_do ?? undefined}>{d.ly_do}</td>
                <td className="py-2 pr-4"><NhanTrangThai kieu={kieu(d.trang_thai)}>{d.trang_thai}</NhanTrangThai></td>
                {che === "quan-ly" && (
                  <td className="py-2 text-right">
                    {d.trang_thai === "Chờ duyệt" && (
                      <div className="flex justify-end gap-4">
                        <button type="button" className={NUT_CHU} onClick={() => quyet(d.id, "duyet")}>Duyệt</button>
                        <button type="button" className={NUT_CHU_NGUY} onClick={() => quyet(d.id, "tu_choi")}>Từ chối</button>
                      </div>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {ds.length === 0 && (
          <p className="chu-tieu-de py-14 text-center text-[24px] text-muc-3">
            {che === "quan-ly" ? (loc === "cho" ? "Không có đơn nào đang chờ bạn duyệt." : "Chưa có đơn nào.") : "Bạn chưa nộp đơn nào."}
          </p>
        )}
      </div>

      <Hop mo={nop} dong={() => setNop(false)} tieuDe="Nộp đơn mới" moTa="Đơn sẽ gửi tới người duyệt. Bạn theo dõi kết quả ngay tại đây.">
        {nop && thongTinNop && <FormDonTu loaiChoPhep={thongTinNop.loaiChoPhep} phepNam={thongTinNop.phepNam} nhanVienChon={thongTinNop.nhanVienChon} macDinhNopCho={thongTinNop.macDinhNopCho} huy={() => setNop(false)} xong={() => { setNop(false); router.refresh(); }} />}
      </Hop>
    </>
  );
}
