"use client";

import { Chon } from "@/components/ui/Chon";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Hop } from "@/components/ui/Hop";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NUT_CHINH, NUT_CHU, NUT_CHU_NGUY, NUT_PHU } from "@/components/ui/dinh-dang";
import { FormTin, type KhoiLuaChon, type TinCoSan } from "./FormTin";
import { FormUngVien, type UngVien } from "./FormUngVien";
import { doiBuocUngVien, xoaTin, xoaUngVien } from "@/app/(app)/tuyen-dung/actions";
import { BUOC_UNG_VIEN } from "@/lib/tuyen-dung";

export type Tin = TinCoSan & { khoi_ten: string };

const DANG_PV = ["Hẹn phỏng vấn", "Vòng 1", "Vòng 2", "Đề nghị"];
const kieuTin = (t: string) => (t === "Đang tuyển" ? "tot" : t === "Đang phỏng vấn" ? "cho" : "tram");
const kieuBuoc = (b: string) => (b === "Nhận việc" ? "tot" : b === "Không đạt" ? "loi" : b === "Mới nộp" ? "tram" : "cho");
const ngayVN = (d: string | null) => (d ? d.split("-").reverse().join("/") : "");

type Hop =
  | { k: "tin"; tin?: Tin }
  | { k: "xoa-tin"; tin: Tin }
  | { k: "ung-vien"; tin: Tin; man: "ds" | "them" | { sua: UngVien } | { xoa: UngVien } };

export function DanhSachTuyenDung({ tin, ungVien, khoi }: { tin: Tin[]; ungVien: UngVien[]; khoi: KhoiLuaChon[] }) {
  const router = useRouter();
  const [hop, setHop] = useState<Hop | null>(null);
  const [loi, setLoi] = useState<string | undefined>();
  const [dangXuLy, startXuLy] = useTransition();
  const [loc, setLoc] = useState("");

  const theoTin = useMemo(() => {
    const m = new Map<string, UngVien[]>();
    for (const u of ungVien) m.set(u.tin_tuyen_dung_id, [...(m.get(u.tin_tuyen_dung_id) ?? []), u]);
    return m;
  }, [ungVien]);

  const thongKe = [
    { nhan: "Tin đang mở", so: tin.filter((t) => t.trang_thai !== "Đã đóng").length },
    { nhan: "Ứng viên", so: ungVien.length },
    { nhan: "Đang phỏng vấn", so: ungVien.filter((u) => DANG_PV.includes(u.trang_thai)).length },
    { nhan: "Đã nhận việc", so: ungVien.filter((u) => u.trang_thai === "Nhận việc").length },
  ];

  const hienTin = tin.filter((t) => !loc || t.trang_thai === loc);

  const dong = () => {
    setHop(null);
    setLoi(undefined);
  };
  const xongLuu = () => {
    setLoi(undefined);
    router.refresh();
  };
  const chay = (fn: (fd: FormData) => Promise<{ loi?: string }>, id: string, sau?: () => void, truong = "id", them?: Record<string, string>) => {
    const fd = new FormData();
    fd.set(truong, id);
    for (const [k, v] of Object.entries(them ?? {})) fd.set(k, v);
    startXuLy(async () => {
      const kq = await fn(fd);
      if (kq.loi) setLoi(kq.loi);
      else {
        setLoi(undefined);
        sau?.();
        router.refresh();
      }
    });
  };

  const tinMo = hop?.k === "ung-vien" ? hop.tin : null;
  const dsUv = tinMo ? (theoTin.get(tinMo.id) ?? []) : [];

  return (
    <>
      {/* Hàng chỉ số: số lớn ngăn bằng đường kẻ dọc, không thẻ */}
      <dl className="grid grid-cols-2 gap-y-6 border-y border-vien py-5 sm:grid-cols-4">
        {thongKe.map((s, i) => (
          <div key={s.nhan} className={`px-1 sm:px-6 ${i > 0 ? "sm:border-l sm:border-vien" : ""} ${i === 2 ? "border-l border-vien sm:border-l" : ""} ${i === 1 ? "border-l border-vien sm:border-l" : ""}`}>
            <dd className="text-[32px] font-medium leading-none tabular-nums text-muc">{s.so}</dd>
            <dt className="mt-2 text-[13px] text-muc-3">{s.nhan}</dt>
          </div>
        ))}
      </dl>

      <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
        <h2 className="chu-tieu-de text-[28px] text-muc">Tin tuyển dụng</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Chon nho ariaLabel="Lọc trạng thái tin" giaTri={loc} onDoi={setLoc} className="w-48" luaChon={[{ gia_tri: "", nhan: "Mọi trạng thái" }, { gia_tri: "Đang tuyển", nhan: "Đang tuyển" }, { gia_tri: "Đang phỏng vấn", nhan: "Đang phỏng vấn" }, { gia_tri: "Đã đóng", nhan: "Đã đóng" }]} />
          <button type="button" onClick={() => setHop({ k: "tin" })} className={NUT_CHINH}>Đăng tuyển</button>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[780px] text-left text-[14px]">
          <thead>
            <tr className="nhan-muc border-b border-vien">
              <th className="py-3 pr-4 font-medium">Vị trí</th>
              <th className="py-3 pr-4 font-medium">Khối</th>
              <th className="py-3 pr-4 font-medium">Cần</th>
              <th className="py-3 pr-4 font-medium">Ứng viên</th>
              <th className="py-3 pr-4 font-medium">Hạn nộp</th>
              <th className="py-3 pr-4 font-medium">Trạng thái</th>
              <th className="py-3" />
            </tr>
          </thead>
          <tbody>
            {hienTin.map((t) => {
              const ds = theoTin.get(t.id) ?? [];
              return (
                <tr key={t.id} className="h-[60px] border-b border-vien hover:bg-giay-tram/60">
                  <td className="py-2 pr-4 font-medium text-muc">{t.vi_tri}</td>
                  <td className="py-2 pr-4 text-muc-2">{t.khoi_ten}</td>
                  <td className="py-2 pr-4 tabular-nums text-muc-2">{t.so_luong_can}</td>
                  <td className="py-2 pr-4">
                    <button type="button" className={`${NUT_CHU} tabular-nums`} onClick={() => setHop({ k: "ung-vien", tin: t, man: "ds" })}>
                      {ds.length} ứng viên
                    </button>
                  </td>
                  <td className="py-2 pr-4 tabular-nums text-muc-2">{ngayVN(t.han_nop)}</td>
                  <td className="py-2 pr-4"><NhanTrangThai kieu={kieuTin(t.trang_thai)}>{t.trang_thai}</NhanTrangThai></td>
                  <td className="py-2 text-right">
                    <div className="flex justify-end gap-4">
                      <button type="button" className={NUT_CHU} onClick={() => setHop({ k: "tin", tin: t })}>Sửa</button>
                      <button type="button" className={NUT_CHU_NGUY} onClick={() => setHop({ k: "xoa-tin", tin: t })}>Xoá</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {hienTin.length === 0 && (
          <p className="chu-tieu-de py-14 text-center text-[24px] italic text-muc-3">
            {tin.length === 0 ? "Chưa có tin tuyển dụng nào. Đăng tin đầu tiên để nhận hồ sơ." : "Không có tin nào ở trạng thái này."}
          </p>
        )}
      </div>

      {/* Đăng / sửa tin */}
      <Hop mo={hop?.k === "tin"} dong={dong} tieuDe={hop?.k === "tin" && hop.tin ? "Sửa tin tuyển dụng" : "Đăng tuyển"} moTa="Tin sẽ hiện trong danh sách để HCNS nhận và theo dõi hồ sơ.">
        {hop?.k === "tin" && <FormTin key={hop.tin?.id ?? "moi"} khoi={khoi} coSan={hop.tin} xong={() => { dong(); router.refresh(); }} huy={dong} />}
      </Hop>

      {/* Xoá tin */}
      <Hop mo={hop?.k === "xoa-tin"} dong={dong} tieuDe="Xoá tin tuyển dụng">
        {hop?.k === "xoa-tin" && (
          <div className="space-y-4">
            <p className="text-[15px] text-muc-2">
              Xoá tin <strong className="font-semibold text-muc">{hop.tin.vi_tri}</strong>? Tin đã có ứng viên thì không xoá được; khi đó hãy chuyển sang &ldquo;Đã đóng&rdquo; để giữ lại hồ sơ.
            </p>
            {loi && <div role="alert" className="rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi">{loi}</div>}
            <div className="flex justify-end gap-2 border-t border-vien pt-4">
              <button type="button" className={NUT_PHU} onClick={dong} disabled={dangXuLy}>Huỷ</button>
              <button type="button" disabled={dangXuLy} onClick={() => chay(xoaTin, hop.tin.id, dong)} className="h-10 rounded-nho bg-loi px-4 text-[14px] font-medium text-white hover:opacity-90 disabled:opacity-60">
                Xoá tin
              </button>
            </div>
          </div>
        )}
      </Hop>

      {/* Ứng viên của một tin */}
      <Hop
        mo={hop?.k === "ung-vien"}
        dong={dong}
        rong="rong"
        tieuDe={
          hop?.k === "ung-vien"
            ? hop.man === "ds"
              ? `Ứng viên · ${hop.tin.vi_tri}`
              : typeof hop.man === "object" && "sua" in hop.man
                ? "Sửa ứng viên"
                : typeof hop.man === "object" && "xoa" in hop.man
                  ? "Xoá ứng viên"
                  : "Thêm ứng viên"
            : ""
        }
        moTa={hop?.k === "ung-vien" && hop.man === "ds" ? `${hop.tin.khoi_ten} · cần ${hop.tin.so_luong_can} người` : undefined}
      >
        {hop?.k === "ung-vien" && tinMo && (
          <>
            {hop.man === "ds" && (
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-[13px] text-muc-3">
                    {BUOC_UNG_VIEN.map((b) => `${b} ${dsUv.filter((u) => u.trang_thai === b).length}`).join("  ·  ")}
                  </p>
                  <button type="button" className={NUT_CHINH} onClick={() => setHop({ k: "ung-vien", tin: tinMo, man: "them" })}>
                    Thêm ứng viên
                  </button>
                </div>
                {loi && <div role="alert" className="mt-3 rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi">{loi}</div>}
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-[14px]">
                    <thead>
                      <tr className="nhan-muc border-b border-vien">
                        <th className="py-2.5 pr-3 font-medium">Ứng viên</th>
                        <th className="py-2.5 pr-3 font-medium">Nguồn</th>
                        <th className="py-2.5 pr-3 font-medium">Phỏng vấn</th>
                        <th className="py-2.5 pr-3 font-medium">Bước</th>
                        <th className="py-2.5" />
                      </tr>
                    </thead>
                    <tbody>
                      {dsUv.map((u) => (
                        <tr key={u.id} className="border-b border-vien align-top">
                          <td className="py-3 pr-3">
                            <div className="font-medium text-muc">{u.ho_ten}</div>
                            <div className="text-[13px] text-muc-3">{[u.dien_thoai, u.email].filter(Boolean).join(" · ")}</div>
                            {u.link_cv && (
                              <a href={u.link_cv} target="_blank" rel="noopener noreferrer" className={`${NUT_CHU} text-[12px]`}>Xem CV</a>
                            )}
                          </td>
                          <td className="py-3 pr-3 text-muc-2">{u.nguon}</td>
                          <td className="py-3 pr-3 tabular-nums text-muc-2">{ngayVN(u.ngay_phong_van)}</td>
                          <td className="py-3 pr-3">
                            <Chon nho ariaLabel={`Bước của ${u.ho_ten}`} giaTri={u.trang_thai} voHieu={dangXuLy} className="w-40" onDoi={(v) => chay(doiBuocUngVien, u.id, undefined, "id", { trang_thai: v })} luaChon={BUOC_UNG_VIEN.map((b) => ({ gia_tri: b, nhan: b }))} />
                            <div className="mt-1"><NhanTrangThai kieu={kieuBuoc(u.trang_thai)}>{u.trang_thai}</NhanTrangThai></div>
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex justify-end gap-4">
                              <button type="button" className={NUT_CHU} onClick={() => setHop({ k: "ung-vien", tin: tinMo, man: { sua: u } })}>Sửa</button>
                              <button type="button" className={NUT_CHU_NGUY} onClick={() => setHop({ k: "ung-vien", tin: tinMo, man: { xoa: u } })}>Xoá</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {dsUv.length === 0 && (
                    <p className="chu-tieu-de py-10 text-center text-[22px] italic text-muc-3">Chưa có ứng viên nào cho vị trí này.</p>
                  )}
                </div>
              </div>
            )}
            {hop.man === "them" && (
              <FormUngVien tinId={tinMo.id} xong={() => { xongLuu(); setHop({ k: "ung-vien", tin: tinMo, man: "ds" }); }} huy={() => setHop({ k: "ung-vien", tin: tinMo, man: "ds" })} />
            )}
            {typeof hop.man === "object" && "sua" in hop.man && (
              <FormUngVien key={hop.man.sua.id} tinId={tinMo.id} coSan={hop.man.sua} xong={() => { xongLuu(); setHop({ k: "ung-vien", tin: tinMo, man: "ds" }); }} huy={() => setHop({ k: "ung-vien", tin: tinMo, man: "ds" })} />
            )}
            {typeof hop.man === "object" && "xoa" in hop.man && (
              <div className="space-y-4">
                <p className="text-[15px] text-muc-2">
                  Xoá hồ sơ của <strong className="font-semibold text-muc">{hop.man.xoa.ho_ten}</strong>? Không hoàn tác được. Nếu chỉ không phù hợp, hãy chuyển bước sang &ldquo;Không đạt&rdquo; để giữ lại.
                </p>
                {loi && <div role="alert" className="rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi">{loi}</div>}
                <div className="flex justify-end gap-2 border-t border-vien pt-4">
                  <button type="button" className={NUT_PHU} onClick={() => setHop({ k: "ung-vien", tin: tinMo, man: "ds" })} disabled={dangXuLy}>Huỷ</button>
                  <button type="button" disabled={dangXuLy} onClick={() => chay(xoaUngVien, hop.man && typeof hop.man === "object" && "xoa" in hop.man ? hop.man.xoa.id : "", () => setHop({ k: "ung-vien", tin: tinMo, man: "ds" }))} className="h-10 rounded-nho bg-loi px-4 text-[14px] font-medium text-white hover:opacity-90 disabled:opacity-60">
                    Xoá ứng viên
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </Hop>
    </>
  );
}
