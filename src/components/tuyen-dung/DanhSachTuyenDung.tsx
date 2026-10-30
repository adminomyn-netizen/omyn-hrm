"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Hop } from "@/components/ui/Hop";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { NUT_CHINH, NUT_CHU, NUT_CHU_NGUY, NUT_PHU } from "@/components/ui/dinh-dang";
import { FormTin, type KhoiLuaChon, type TinCoSan } from "./FormTin";
import { FormUngVien, type UngVien } from "./FormUngVien";
import { KenhDangTin } from "./KenhDangTin";
import type { KenhDang } from "@/lib/data-tuyen-dung";
import { doiBuocUngVien, xoaTin, xoaUngVien } from "@/app/(app)/tuyen-dung/actions";
import { BUOC_UNG_VIEN } from "@/lib/tuyen-dung";
import { ngayVN } from "@/lib/dinh-dang";

export type Tin = TinCoSan & { khoi_ten: string };

const DANG_PV = ["Hẹn phỏng vấn", "Vòng 1", "Vòng 2", "Đề nghị"];
const MAU_PHAU = ["#E6D8DA", "#D9A7B0", "#B8475A", "#8B2635", "#C9826F", "#6B1A27", "#96797E"];
const kieuTin = (t: string) => (t === "Đang tuyển" ? "tot" : t === "Đang phỏng vấn" ? "cho" : "tram");

type Hop =
  | { k: "tin"; tin?: Tin }
  | { k: "xoa-tin"; tin: Tin }
  | { k: "uv"; man: "them" | { sua: UngVien } | { xoa: UngVien } };

/** Tuyển dụng dạng bảng theo bước: chọn tin ở trên, các cột là từng bước, KÉO thẻ sang cột khác để đổi bước (hoặc bấm thẻ → sửa). */
export function DanhSachTuyenDung({
  tin,
  ungVien,
  kenh,
  khoi,
  tinBanDau,
  moDangTuyen,
}: {
  tin: Tin[];
  ungVien: UngVien[];
  kenh: KenhDang[];
  khoi: KhoiLuaChon[];
  tinBanDau?: string;
  moDangTuyen?: boolean;
}) {
  const router = useRouter();
  const sapXep = useMemo(() => [...tin].sort((a, b) => Number(a.trang_thai === "Đã đóng") - Number(b.trang_thai === "Đã đóng")), [tin]);
  const [chonId, setChonId] = useState(tinBanDau && tin.some((t) => t.id === tinBanDau) ? tinBanDau : (sapXep[0]?.id ?? ""));
  const [hop, setHop] = useState<Hop | null>(moDangTuyen ? { k: "tin" } : null);
  const [nhacTin, setNhacTin] = useState(false);
  const [ghiDe, setGhiDe] = useState<Record<string, string>>({});
  const [dangKeo, setDangKeo] = useState<string | null>(null);
  const [cotDich, setCotDich] = useState<string | null>(null);
  const [loi, setLoi] = useState<string | undefined>();
  const [dangXuLy, startXuLy] = useTransition();

  const tinChon = tin.find((t) => t.id === chonId);
  const dsUv = useMemo(
    () => ungVien.filter((u) => u.tin_tuyen_dung_id === chonId).map((u) => ({ ...u, trang_thai: ghiDe[u.id] ?? u.trang_thai })),
    [ungVien, chonId, ghiDe],
  );
  const tong = ungVien.length;
  const dangPv = ungVien.filter((u) => DANG_PV.includes(ghiDe[u.id] ?? u.trang_thai)).length;
  const soMo = tin.filter((t) => t.trang_thai !== "Đã đóng").length;
  const demTheoTin = (id: string) => ungVien.filter((u) => u.tin_tuyen_dung_id === id).length;

  const dong = () => {
    setHop(null);
    setLoi(undefined);
  };
  const lamMoi = () => router.refresh();

  const chuyenBuoc = (id: string, buoc: string) => {
    const hienTai = ghiDe[id] ?? ungVien.find((u) => u.id === id)?.trang_thai;
    if (!hienTai || hienTai === buoc) return;
    setLoi(undefined);
    setGhiDe((g) => ({ ...g, [id]: buoc }));
    const fd = new FormData();
    fd.set("id", id);
    fd.set("trang_thai", buoc);
    startXuLy(async () => {
      const kq = await doiBuocUngVien(fd);
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

  const chay = (fn: (fd: FormData) => Promise<{ loi?: string }>, id: string, sau: () => void) => {
    const fd = new FormData();
    fd.set("id", id);
    startXuLy(async () => {
      const kq = await fn(fd);
      if (kq.loi) setLoi(kq.loi);
      else {
        setLoi(undefined);
        sau();
        router.refresh();
      }
    });
  };

  const phau = BUOC_UNG_VIEN.map((b) => ({ b, so: dsUv.filter((u) => u.trang_thai === b).length }));

  return (
    <>
      <TieuDeTrang tieuDe="Tuyển dụng" phu={`${soMo} tin đang mở · ${tong} ứng viên · ${dangPv} đang phỏng vấn`}>
        <button type="button" className={NUT_PHU} onClick={() => (tinChon ? setHop({ k: "uv", man: "them" }) : setNhacTin(true))}>+ Thêm ứng viên</button>
        <button type="button" className={NUT_CHINH} onClick={() => setHop({ k: "tin" })}>Đăng tuyển</button>
      </TieuDeTrang>

      {tin.length === 0 ? (
        <div className="mx-auto max-w-[620px] py-16 text-center">
          <p className="chu-tieu-de text-[28px] text-muc-3">Chưa có tin tuyển dụng nào.</p>
          {nhacTin && (
            <div role="alert" className="mt-4 rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi">
              Mỗi ứng viên thuộc một vị trí đang tuyển. Bấm &ldquo;Đăng tuyển&rdquo; tạo vị trí trước, rồi thêm ứng viên vào đó.
              <button type="button" className={`${NUT_CHINH} mt-3`} onClick={() => { setNhacTin(false); setHop({ k: "tin" }); }}>Tạo vị trí tuyển dụng</button>
            </div>
          )}
          <p className="mt-3 text-[14px] leading-relaxed text-muc-3">
            Tin được tạo từ một yêu cầu tuyển dụng đã tiếp nhận (tab &ldquo;Yêu cầu&rdquo;), hoặc bấm &ldquo;Đăng tuyển&rdquo; để tạo tin trực tiếp.
            Ứng viên không tự nộp vào app này: HCNS nhận CV từ TopCV, Facebook, Zalo… rồi bấm &ldquo;+ Thêm ứng viên&rdquo; để theo dõi từng bước.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* chọn tin */}
          <div className="flex flex-wrap gap-2.5" role="tablist" aria-label="Chọn tin tuyển dụng">
            {sapXep.map((t) => {
              const dangChon = t.id === chonId;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={dangChon}
                  onClick={() => setChonId(t.id)}
                  className={`flex flex-col items-start rounded-[10px] border px-4 py-2.5 text-left transition-colors ${
                    dangChon ? "border-nhan bg-nhan-nhat" : "border-vien bg-giay-sang hover:border-vien-dam"
                  } ${t.trang_thai === "Đã đóng" ? "opacity-70" : ""}`}
                >
                  <span className="text-[14px] font-semibold text-muc">{t.vi_tri}</span>
                  <span className="text-[12px] text-muc-3">
                    Cần {t.so_luong_can} · {demTheoTin(t.id)} ứng viên{t.trang_thai === "Đã đóng" ? " · đã đóng" : ""}
                  </span>
                </button>
              );
            })}
          </div>

          {tinChon && (
            <div className="flex flex-wrap items-center justify-between gap-3 text-[13px] text-muc-3">
              <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <NhanTrangThai kieu={kieuTin(tinChon.trang_thai)}>{tinChon.trang_thai}</NhanTrangThai>
                <span>{tinChon.khoi_ten}</span>
                {tinChon.han_nop && <span>Hạn nộp {ngayVN(tinChon.han_nop)}</span>}
              </span>
              <span className="flex gap-4">
                <button type="button" className={NUT_CHU} onClick={() => setHop({ k: "tin", tin: tinChon })}>Sửa tin</button>
                <button type="button" className={NUT_CHU_NGUY} onClick={() => setHop({ k: "xoa-tin", tin: tinChon })}>Xoá tin</button>
              </span>
            </div>
          )}

          {tinChon && (
            <KenhDangTin
              key={tinChon.id}
              tin={{ id: tinChon.id, vi_tri: tinChon.vi_tri, so_luong_can: tinChon.so_luong_can, khoi_ten: tinChon.khoi_ten, han_nop: tinChon.han_nop, mo_ta: tinChon.mo_ta }}
              kenh={kenh.filter((k) => k.tin_tuyen_dung_id === tinChon.id)}
            />
          )}

          {/* phễu */}
          <div className="flex h-2.5 overflow-hidden" style={{ borderRadius: 10 }} role="img" aria-label={phau.map((p) => `${p.b} ${p.so}`).join(", ")}>
            {phau.map((p, i) => (
              <span key={p.b} style={{ flex: Math.max(p.so, 0.35), background: MAU_PHAU[i] }} />
            ))}
          </div>

          {loi && <div role="alert" className="rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi">{loi}</div>}

          {/* bảng theo bước */}
          <div className="-mx-1 overflow-x-auto px-1 pb-2">
            <div className="grid min-w-[1500px] grid-cols-7 items-start gap-3.5">
              {BUOC_UNG_VIEN.map((b) => {
                const the = dsUv.filter((u) => u.trang_thai === b);
                const dich = cotDich === b && dangKeo !== null;
                return (
                  <section
                    key={b}
                    aria-label={`${b}, ${the.length} ứng viên`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setCotDich(b);
                    }}
                    onDragLeave={() => setCotDich((c) => (c === b ? null : c))}
                    onDrop={(e) => {
                      e.preventDefault();
                      const id = e.dataTransfer.getData("text/plain") || dangKeo;
                      setCotDich(null);
                      setDangKeo(null);
                      if (id) chuyenBuoc(id, b);
                    }}
                    className={`flex min-h-[420px] flex-col gap-2.5 rounded-[12px] p-3 transition-colors ${b === "Không đạt" ? "bg-giay-tram/60" : "bg-giay-tram"} ${dich ? "outline outline-2 -outline-offset-2 outline-[var(--nhan)]" : ""}`}
                  >
                    <div className="flex items-center justify-between px-1 pb-1">
                      <h3 className="text-[13px] font-semibold text-muc">{b}</h3>
                      <span className="flex h-[22px] min-w-[22px] items-center justify-center rounded-[11px] bg-giay-sang px-1.5 text-[12px] font-semibold tabular-nums text-muc-2">{the.length}</span>
                    </div>
                    {the.map((u) => (
                      <article
                        key={u.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/plain", u.id);
                          e.dataTransfer.effectAllowed = "move";
                          setDangKeo(u.id);
                        }}
                        onDragEnd={() => {
                          setDangKeo(null);
                          setCotDich(null);
                        }}
                        className={`cursor-grab the-noi the-noi-thap p-3.5 active:cursor-grabbing ${dangKeo === u.id ? "opacity-40" : ""}`}
                      >
                        <button type="button" onClick={() => setHop({ k: "uv", man: { sua: u } })} className="flex w-full items-center gap-2.5 text-left">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-nhan-nhat text-[12px] font-semibold text-nhan-dam" style={{ borderRadius: 9999 }}>
                            {u.ho_ten.trim().split(/\s+/).pop()?.charAt(0).toUpperCase()}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-[14px] font-semibold text-muc">{u.ho_ten}</span>
                            <span className="block truncate text-[12px] text-muc-3">{[u.nam_sinh, u.dien_thoai].filter(Boolean).join(" · ") || "Chưa có liên hệ"}</span>
                          </span>
                        </button>
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {u.nguon && <span className="rounded-tag bg-nhan-nhat px-2 py-px text-[11px] font-medium text-nhan-dam">{u.nguon}</span>}
                          {u.link_cv && (
                            <a href={u.link_cv} target="_blank" rel="noopener noreferrer" draggable={false} className="rounded-tag bg-giay-tram px-2 py-px text-[11px] font-medium text-muc-2 hover:text-muc">Xem CV</a>
                          )}
                        </div>
                        <div className="mt-2.5 text-[12px] text-muc-3">
                          {u.ngay_phong_van ? `Phỏng vấn ${ngayVN(u.ngay_phong_van)}` : `Nộp ${ngayVN(u.ngay_nhan_ho_so)}`}
                        </div>
                      </article>
                    ))}
                    {the.length === 0 && <p className="px-1 py-6 text-center text-[12px] text-muc-3">{dangKeo ? "Thả vào đây" : "Chưa có ai"}</p>}
                  </section>
                );
              })}
            </div>
          </div>
          <p className="text-[12px] text-muc-3">Kéo thẻ sang cột khác để đổi bước. Trên điện thoại, bấm thẻ rồi chọn bước mới.</p>
        </div>
      )}

      {/* đăng / sửa tin */}
      <Hop mo={hop?.k === "tin"} dong={dong} tieuDe={hop?.k === "tin" && hop.tin ? "Sửa tin tuyển dụng" : "Đăng tuyển"} moTa="Tin sẽ hiện ở bảng để HCNS nhận và theo dõi hồ sơ.">
        {hop?.k === "tin" && <FormTin key={hop.tin?.id ?? "moi"} khoi={khoi} coSan={hop.tin} xong={() => { dong(); lamMoi(); }} huy={dong} />}
      </Hop>

      {/* xoá tin */}
      <Hop mo={hop?.k === "xoa-tin"} dong={dong} tieuDe="Xoá tin tuyển dụng">
        {hop?.k === "xoa-tin" && (
          <div className="space-y-4">
            <p className="text-[15px] text-muc-2">
              Xoá tin <strong className="font-semibold text-muc">{hop.tin.vi_tri}</strong>? Tin đã có ứng viên thì không xoá được; khi đó hãy chuyển sang &ldquo;Đã đóng&rdquo; để giữ lại hồ sơ.
            </p>
            {loi && <div role="alert" className="rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi">{loi}</div>}
            <div className="flex justify-end gap-2 border-t border-vien pt-4">
              <button type="button" className={NUT_PHU} onClick={dong} disabled={dangXuLy}>Huỷ</button>
              <button type="button" disabled={dangXuLy} onClick={() => chay(xoaTin, hop.tin.id, () => { dong(); setChonId(sapXep.find((t) => t.id !== hop.tin.id)?.id ?? ""); })} className="h-10 rounded-nho bg-loi px-4 text-[14px] font-medium text-white hover:opacity-90 disabled:opacity-60">
                Xoá tin
              </button>
            </div>
          </div>
        )}
      </Hop>

      {/* ứng viên: thêm / sửa / xoá */}
      <Hop
        mo={hop?.k === "uv"}
        dong={dong}
        tieuDe={hop?.k === "uv" ? (hop.man === "them" ? "Thêm ứng viên" : "sua" in hop.man ? "Ứng viên" : "Xoá ứng viên") : ""}
        moTa={tinChon ? `${tinChon.vi_tri} · ${tinChon.khoi_ten}` : undefined}
      >
        {hop?.k === "uv" && tinChon && (
          <>
            {hop.man === "them" && <FormUngVien tinId={tinChon.id} xong={() => { dong(); lamMoi(); }} huy={dong} />}
            {typeof hop.man === "object" && "sua" in hop.man && (
              <div className="space-y-3">
                <FormUngVien key={hop.man.sua.id} tinId={tinChon.id} coSan={hop.man.sua} xong={() => { dong(); lamMoi(); }} huy={dong} />
                <div className="text-right">
                  <button type="button" className={NUT_CHU_NGUY} onClick={() => { if (typeof hop.man === "object" && "sua" in hop.man) setHop({ k: "uv", man: { xoa: hop.man.sua } }); }}>Xoá ứng viên này</button>
                </div>
              </div>
            )}
            {typeof hop.man === "object" && "xoa" in hop.man && (
              <div className="space-y-4">
                <p className="text-[15px] text-muc-2">
                  Xoá hồ sơ của <strong className="font-semibold text-muc">{hop.man.xoa.ho_ten}</strong>? Không hoàn tác được. Nếu chỉ không phù hợp, hãy chuyển bước sang &ldquo;Không đạt&rdquo; để giữ lại.
                </p>
                {loi && <div role="alert" className="rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi">{loi}</div>}
                <div className="flex justify-end gap-2 border-t border-vien pt-4">
                  <button type="button" className={NUT_PHU} onClick={dong} disabled={dangXuLy}>Huỷ</button>
                  <button type="button" disabled={dangXuLy} onClick={() => chay(xoaUngVien, hop.man && typeof hop.man === "object" && "xoa" in hop.man ? hop.man.xoa.id : "", () => { dong(); })} className="h-10 rounded-nho bg-loi px-4 text-[14px] font-medium text-white hover:opacity-90 disabled:opacity-60">
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
