"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Hop } from "@/components/ui/Hop";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { NUT_CHINH, NUT_CHU, NUT_CHU_NGUY, NUT_PHU, O_NHAP } from "@/components/ui/dinh-dang";
import { FormNhanVien, type Khoi, type NhanVienCoSan } from "./FormNhanVien";
import { choNghiViec, xoaNhanVien } from "@/lib/actions";

export type DongNhanVien = NhanVienCoSan & { khoi_ten: string };

const LOC = ["Tất cả", "Đang làm", "Thử việc", "Đã nghỉ"] as const;
const kieu = (t: string) => (t === "Đang làm" ? "tot" : t === "Thử việc" ? "cho" : "tram");
const ngayVN = (d: string | null) => (d ? d.split("-").reverse().join("/") : "");

export function DanhSachNhanSu({ nhanVien, khoi, moBanDau, timBanDau = "" }: { nhanVien: DongNhanVien[]; khoi: Khoi[]; moBanDau?: boolean; timBanDau?: string }) {
  const router = useRouter();
  const [loc, setLoc] = useState<(typeof LOC)[number]>("Tất cả");
  const [tim, setTim] = useState(timBanDau);
  const [hop, setHop] = useState<{ kieu: "them" } | { kieu: "sua"; nv: DongNhanVien } | { kieu: "xoa"; nv: DongNhanVien } | null>(moBanDau ? { kieu: "them" } : null);
  const [loi, setLoi] = useState<string | undefined>();
  const [dangXuLy, startXuLy] = useTransition();

  const dem = useMemo(() => {
    const d: Record<string, number> = { "Tất cả": nhanVien.length };
    for (const n of nhanVien) d[n.trang_thai] = (d[n.trang_thai] ?? 0) + 1;
    return d;
  }, [nhanVien]);

  const hien = useMemo(() => {
    const t = tim.trim().toLowerCase();
    return nhanVien.filter(
      (n) =>
        (loc === "Tất cả" || n.trang_thai === loc) &&
        (!t || [n.ho_ten, n.ma_nhan_vien, n.chuc_danh, n.email, n.khoi_ten].some((x) => (x ?? "").toLowerCase().includes(t))),
    );
  }, [nhanVien, loc, tim]);

  const dong = () => {
    setHop(null);
    setLoi(undefined);
  };
  const xongLuu = () => {
    dong();
    router.refresh();
  };
  const chayXoa = (nv: DongNhanVien, hanhDong: typeof choNghiViec) => {
    const fd = new FormData();
    fd.set("id", nv.id);
    startXuLy(async () => {
      const kq = await hanhDong(fd);
      if (kq?.loi) setLoi(kq.loi);
      else xongLuu();
    });
  };

  return (
    <>
      <TieuDeTrang tieuDe="Hồ sơ nhân sự" phu={`${nhanVien.length} người · ${dem["Đang làm"] ?? 0} đang làm · ${dem["Thử việc"] ?? 0} thử việc`}>
        <button type="button" onClick={() => setHop({ kieu: "them" })} className={NUT_CHINH}>
          + Thêm nhân viên
        </button>
      </TieuDeTrang>
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-vien">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2" role="tablist" aria-label="Lọc theo trạng thái">
          {LOC.map((l) => (
            <button
              key={l}
              type="button"
              role="tab"
              aria-selected={loc === l}
              onClick={() => setLoc(l)}
              className={`-mb-px border-b-2 pb-2.5 text-[14px] transition-colors ${
                loc === l ? "border-nhan font-semibold text-muc" : "border-transparent text-muc-2 hover:text-muc"
              }`}
            >
              {l} <span className="text-muc-3">{dem[l] ?? 0}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3 pb-2">
          <div className="relative">
            <Search strokeWidth={1.5} className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muc-3" />
            <input
              value={tim}
              onChange={(e) => setTim(e.target.value)}
              placeholder="Tìm theo tên, mã, chức danh"
              aria-label="Tìm nhân viên"
              className={`${O_NHAP} h-10 w-64 pl-9`}
            />
          </div>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-[14px]">
          <thead>
            <tr className="nhan-muc border-b border-vien">
              <th className="py-3 pr-4 font-medium">Nhân viên</th>
              <th className="py-3 pr-4 font-medium">Chức danh</th>
              <th className="py-3 pr-4 font-medium">Khối</th>
              <th className="py-3 pr-4 font-medium">Ngày vào làm</th>
              <th className="py-3 pr-4 font-medium">Trạng thái</th>
              <th className="py-3" />
            </tr>
          </thead>
          <tbody>
            {hien.map((n) => (
              <tr key={n.id} className="h-[64px] border-b border-vien transition-colors hover:bg-giay-tram/60">
                <td className="py-2 pr-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-nhan-nhat text-[13px] font-semibold text-nhan-dam" style={{ borderRadius: 9999 }}>
                      {n.ho_ten.trim().split(/\s+/).pop()?.charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate font-medium text-muc">{n.ho_ten}</div>
                      <div className="truncate text-[13px] text-muc-3">{[n.ma_nhan_vien, n.email].filter(Boolean).join(" · ")}</div>
                    </div>
                  </div>
                </td>
                <td className="py-2 pr-4 text-muc-2">{n.chuc_danh}</td>
                <td className="py-2 pr-4 text-muc-2">{n.khoi_ten}</td>
                <td className="py-2 pr-4 tabular-nums text-muc-2">{ngayVN(n.ngay_vao_lam)}</td>
                <td className="py-2 pr-4"><NhanTrangThai kieu={kieu(n.trang_thai)}>{n.trang_thai}</NhanTrangThai></td>
                <td className="py-2 text-right">
                  <div className="flex justify-end gap-4">
                    <button type="button" className={NUT_CHU} onClick={() => setHop({ kieu: "sua", nv: n })}>Sửa</button>
                    <button type="button" className={NUT_CHU_NGUY} onClick={() => setHop({ kieu: "xoa", nv: n })}>Xoá</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {hien.length === 0 && (
          <p className="chu-tieu-de py-14 text-center text-[24px] text-muc-3">
            {nhanVien.length === 0 ? "Chưa có nhân viên nào. Thêm người đầu tiên để bắt đầu." : "Không có ai khớp với bộ lọc này."}
          </p>
        )}
      </div>

      <Hop mo={hop?.kieu === "them"} dong={dong} tieuDe="Thêm nhân viên" moTa="Hồ sơ cơ bản. Có thể bổ sung chi tiết sau.">
        <FormNhanVien khoi={khoi} xong={xongLuu} huy={dong} />
      </Hop>
      <Hop mo={hop?.kieu === "sua"} dong={dong} tieuDe="Sửa thông tin nhân viên">
        {hop?.kieu === "sua" && <FormNhanVien key={hop.nv.id} khoi={khoi} coSan={hop.nv} xong={xongLuu} huy={dong} />}
      </Hop>
      <Hop mo={hop?.kieu === "xoa"} dong={dong} tieuDe="Xoá nhân viên">
        {hop?.kieu === "xoa" && (
          <div className="space-y-4">
            <p className="text-[15px] text-muc-2">
              <strong className="font-semibold text-muc">{hop.nv.ho_ten}</strong> sẽ bị xoá khỏi danh sách. Nếu người này
              đã nghỉ việc, nên chọn <em>Cho nghỉ việc</em> để giữ lại chấm công và lương cũ.
            </p>
            {loi && <div role="alert" className="rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi">{loi}</div>}
            <div className="flex flex-wrap justify-end gap-2 border-t border-vien pt-4">
              <button type="button" className={NUT_PHU} onClick={dong} disabled={dangXuLy}>Huỷ</button>
              <button type="button" className={NUT_PHU} disabled={dangXuLy} onClick={() => chayXoa(hop.nv, choNghiViec)}>Cho nghỉ việc</button>
              <button
                type="button"
                disabled={dangXuLy}
                onClick={() => chayXoa(hop.nv, xoaNhanVien)}
                className="h-10 rounded-nho bg-loi px-4 text-[14px] font-medium text-white hover:opacity-90 disabled:opacity-60"
              >
                Xoá hẳn
              </button>
            </div>
          </div>
        )}
      </Hop>
    </>
  );
}
