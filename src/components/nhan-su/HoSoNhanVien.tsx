"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Hop } from "@/components/ui/Hop";
import { Chon } from "@/components/ui/Chon";
import { NgayChon } from "@/components/ui/NgayChon";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NHAN_O, NUT_CHINH, NUT_CHU, NUT_CHU_NGUY, NUT_PHU, O_NHAP, O_NHIEU_DONG } from "@/components/ui/dinh-dang";
import { createClient } from "@/lib/supabase/client";
import { doiTrangThaiTaiLieu, goTaiLieu, luuHoSoCaNhan, themThanNhan, xacNhanTaiLen, xinLinkTaiLen, xoaThanNhan } from "@/app/(app)/nhan-su/ho-so-actions";
import { GIAY_TO_BAT_BUOC, KICH_THUOC_TOI_DA, LOAI_TAI_LIEU, MIME_CHO_PHEP, giayToConThieu, kiemTraTep, tyLeDienHoSo } from "@/lib/ho-so";
import { ngayVN } from "@/lib/dinh-dang";
import type { HoSoDayDu } from "@/lib/data-ho-so";

const KHO = "ho-so-nhan-vien";
const kb = (n: number) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
const kieuTl = (t: string) => (t === "Đã xác nhận" ? "tot" : t === "Cần bổ sung" ? "loi" : "cho");
const QUAN_HE = ["Vợ", "Chồng", "Con", "Cha", "Mẹ", "Anh chị em", "Người giám hộ"];

type HopMo = { k: "than-nhan" } | { k: "ly-do"; id: string; kieu: "bo-sung" | "go"; ten: string };

/** Hồ sơ nhân viên: sơ yếu lý lịch, người thân, giấy tờ scan. Quản trị/Kỹ thuật sửa và xác nhận mọi hồ sơ; nhân viên tự điền và tải giấy tờ của mình (chờ HCNS xác nhận). */
export function HoSoNhanVien({ du, quanTri }: { du: HoSoDayDu; quanTri: boolean }) {
  const router = useRouter();
  const nvId = du.nhanVien.id;
  const hs = du.hoSo;
  const [loi, setLoi] = useState<string | undefined>();
  const [thongBao, setThongBao] = useState<string | undefined>();
  const [hop, setHop] = useState<HopMo | null>(null);
  const [lyDo, setLyDo] = useState("");
  const [loaiTep, setLoaiTep] = useState<string>("CCCD mặt trước");
  const [dang, bat] = useTransition();
  const [dangTai, setDangTai] = useState(false);
  const formHs = useRef<HTMLFormElement>(null);
  const formTn = useRef<HTMLFormElement>(null);
  const inputTep = useRef<HTMLInputElement>(null);
  const thieu = giayToConThieu(du.taiLieu);
  const tyLe = tyLeDienHoSo(hs);

  const dong = () => { setHop(null); setLoi(undefined); setLyDo(""); };
  const chay = (fn: (fd: FormData) => Promise<{ loi?: string }>, fd: FormData, sau?: () => void) =>
    bat(async () => {
      const kq = await fn(fd);
      if (kq.loi) setLoi(kq.loi);
      else { setLoi(undefined); sau?.(); router.refresh(); }
    });

  const luuHs = () => {
    if (!formHs.current?.reportValidity()) return;
    setThongBao(undefined);
    chay(luuHoSoCaNhan, new FormData(formHs.current), () => setThongBao("Đã lưu hồ sơ."));
  };
  const luuTn = () => { if (formTn.current?.reportValidity()) chay(themThanNhan, new FormData(formTn.current), dong); };

  const taiLen = async () => {
    const tep = inputTep.current?.files?.[0];
    setLoi(undefined); setThongBao(undefined);
    if (!tep) return setLoi("Chọn tệp cần tải (PDF, JPG hoặc PNG, tối đa 10 MB).");
    const sai = kiemTraTep(tep.type, tep.size);
    if (sai) return setLoi(sai);
    setDangTai(true);
    try {
      const fd = new FormData();
      fd.set("nhan_vien_id", nvId); fd.set("loai", loaiTep); fd.set("mime", tep.type); fd.set("kich_thuoc", String(tep.size));
      const b1 = await xinLinkTaiLen(fd);
      if (b1.loi || !b1.duongDan || !b1.token) return setLoi(b1.loi ?? "Chưa mở được kho tệp.");
      const { error } = await createClient().storage.from(KHO).uploadToSignedUrl(b1.duongDan, b1.token, tep, { contentType: tep.type });
      if (error) return setLoi("Tải tệp lên chưa được. Kiểm tra mạng rồi thử lại.");
      const f2 = new FormData();
      f2.set("nhan_vien_id", nvId); f2.set("duong_dan", b1.duongDan); f2.set("loai", loaiTep); f2.set("ten_tep", tep.name);
      const b2 = await xacNhanTaiLen(f2);
      if (b2.loi) return setLoi(b2.loi);
      if (inputTep.current) inputTep.current.value = "";
      setThongBao("Đã tải lên. HCNS sẽ xác nhận giấy tờ.");
      router.refresh();
    } finally { setDangTai(false); }
  };

  const xacNhan = (id: string) => { const fd = new FormData(); fd.set("id", id); fd.set("den", "Đã xác nhận"); chay(doiTrangThaiTaiLieu, fd); };
  const gui = () => {
    if (hop?.k !== "ly-do") return;
    const fd = new FormData(); fd.set("id", hop.id);
    if (hop.kieu === "bo-sung") { fd.set("den", "Cần bổ sung"); fd.set("ghi_chu", lyDo); chay(doiTrangThaiTaiLieu, fd, dong); }
    else { fd.set("ly_do", lyDo); chay(goTaiLieu, fd, dong); }
  };

  const o = (k: string) => String((hs as Record<string, unknown> | null)?.[k] ?? "");
  const oChu = (k: string, nhan: string, rong = false, goiY?: string) => (
    <div className={rong ? "sm:col-span-2" : ""}><label htmlFor={`h-${k}`} className={NHAN_O}>{nhan}</label><input id={`h-${k}`} name={k} defaultValue={o(k)} placeholder={goiY} className={O_NHAP} /></div>
  );

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-muc-3">
        <span>{[du.nhanVien.ma_nhan_vien, du.nhanVien.chuc_danh, du.nhanVien.khoi?.ten].filter(Boolean).join(" · ") || "Chưa có mã và chức danh"}</span>
        <span>Thông tin đã điền <strong className="font-semibold text-muc tabular-nums">{tyLe}%</strong></span>
        {thieu.length > 0 ? <NhanTrangThai kieu="cho">Thiếu {thieu.length} giấy tờ bắt buộc</NhanTrangThai> : <NhanTrangThai kieu="tot">Đủ giấy tờ bắt buộc</NhanTrangThai>}
      </div>
      {loi && !hop && <div role="alert" className="rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi">{loi}</div>}
      {thongBao && <div role="status" className="rounded-nho bg-nhan-nhat px-3 py-2.5 text-[14px] text-nhan-dam">{thongBao}</div>}

      <section aria-label="Sơ yếu lý lịch">
        <h2 className="mb-4 text-[17px] font-semibold text-muc">Sơ yếu lý lịch</h2>
        <form ref={formHs} className="space-y-6" onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLElement).tagName !== "TEXTAREA" && e.preventDefault()}>
          <input type="hidden" name="nhan_vien_id" value={nvId} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div><label htmlFor="h-gt" className={NHAN_O}>Giới tính</label><Chon id="h-gt" ten="gioi_tinh" trong="Chưa chọn" giaTriMacDinh={o("gioi_tinh")} luaChon={[{ gia_tri: "", nhan: "Chưa chọn" }, { gia_tri: "Nam", nhan: "Nam" }, { gia_tri: "Nữ", nhan: "Nữ" }]} /></div>
            <div><label htmlFor="h-ns" className={NHAN_O}>Ngày sinh</label><NgayChon id="h-ns" ten="ngay_sinh" giaTriMacDinh={o("ngay_sinh")} tuNam={1950} denNam={2012} /></div>
            <div><label htmlFor="h-hn" className={NHAN_O}>Tình trạng hôn nhân</label><Chon id="h-hn" ten="tinh_trang_hon_nhan" trong="Chưa chọn" giaTriMacDinh={o("tinh_trang_hon_nhan")} luaChon={[{ gia_tri: "", nhan: "Chưa chọn" }, ...["Độc thân", "Đã lập gia đình", "Đã lập gia đình, có con", "Khác"].map((x) => ({ gia_tri: x, nhan: x }))]} /></div>
            {oChu("dan_toc", "Dân tộc")}
            {oChu("ton_giao", "Tôn giáo")}
            {oChu("dien_thoai", "Số điện thoại")}
            {oChu("cccd", "Số CCCD", false, "12 chữ số")}
            <div><label htmlFor="h-ncc" className={NHAN_O}>Ngày cấp CCCD</label><NgayChon id="h-ncc" ten="ngay_cap_cccd" giaTriMacDinh={o("ngay_cap_cccd")} tuNam={1990} denNam={2100} /></div>
            {oChu("noi_cap_cccd", "Nơi cấp")}
            {oChu("dia_chi_thuong_tru", "Địa chỉ thường trú", true)}
            {oChu("dia_chi_hien_tai", "Địa chỉ hiện tại", true)}
            {oChu("trinh_do", "Trình độ")}
            {oChu("truong", "Trường")}
            {oChu("nganh", "Ngành học")}
            {oChu("ma_so_thue", "Mã số thuế TNCN")}
            {oChu("so_bhxh", "Số sổ BHXH")}
            {oChu("ngan_hang", "Ngân hàng")}
            {oChu("so_tai_khoan", "Số tài khoản")}
          </div>
          <div>
            <h3 className="mb-3 text-[14px] font-semibold text-muc">Người liên hệ khẩn cấp</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {oChu("nguoi_than_ten", "Họ tên")}
              {oChu("nguoi_than_quan_he", "Quan hệ")}
              {oChu("nguoi_than_dien_thoai", "Số điện thoại")}
            </div>
          </div>
          <div className="flex justify-end"><button type="button" className={NUT_CHINH} disabled={dang} onClick={luuHs}>{dang ? "Đang lưu" : "Lưu hồ sơ"}</button></div>
        </form>
      </section>

      <section aria-label="Người thân">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-[17px] font-semibold text-muc">Người thân và người phụ thuộc</h2>
          <button type="button" className={NUT_PHU} onClick={() => setHop({ k: "than-nhan" })}>+ Thêm người thân</button>
        </div>
        {du.thanNhan.length === 0 ? <p className="text-[13px] text-muc-3">Chưa khai người thân nào. Người phụ thuộc cần khai để giảm trừ gia cảnh khi tính thuế TNCN.</p> : (
          <ul className="the-noi the-noi-thap divide-y divide-vien overflow-hidden">
            {du.thanNhan.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-[13px]">
                <span><strong className="font-semibold text-muc">{t.ho_ten}</strong> · {t.quan_he}{t.ngay_sinh ? ` · ${ngayVN(t.ngay_sinh)}` : ""} {t.phu_thuoc && <NhanTrangThai kieu="tot">Người phụ thuộc</NhanTrangThai>}</span>
                <button type="button" disabled={dang} className={NUT_CHU_NGUY} onClick={() => { const fd = new FormData(); fd.set("id", t.id); fd.set("nhan_vien_id", nvId); chay(xoaThanNhan, fd); }}>Xoá</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-label="Giấy tờ">
        <h2 className="mb-1 text-[17px] font-semibold text-muc">Giấy tờ đính kèm</h2>
        <p className="mb-4 text-[13px] text-muc-3">PDF, JPG hoặc PNG, tối đa {KICH_THUOC_TOI_DA / 1024 / 1024} MB. Giấy tờ lưu trong kho riêng tư; chỉ HCNS và chính chủ mở được, mỗi lần mở đều được ghi lại.</p>
        <ul className="mb-5 flex flex-wrap gap-2">
          {GIAY_TO_BAT_BUOC.map((l) => <li key={l}><NhanTrangThai kieu={thieu.includes(l) ? "cho" : "tot"}>{thieu.includes(l) ? `Thiếu: ${l}` : `Có: ${l}`}</NhanTrangThai></li>)}
        </ul>
        <div className="mb-5 flex flex-wrap items-end gap-3 the-noi the-noi-thap p-4">
          <div className="min-w-[220px]"><label htmlFor="h-loai" className={NHAN_O}>Loại giấy tờ</label><Chon id="h-loai" giaTri={loaiTep} onDoi={setLoaiTep} luaChon={LOAI_TAI_LIEU.map((l) => ({ gia_tri: l, nhan: l }))} /></div>
          <div className="min-w-[220px] flex-1"><label htmlFor="h-tep" className={NHAN_O}>Tệp</label><input ref={inputTep} id="h-tep" type="file" accept={MIME_CHO_PHEP.join(",")} className="block h-11 w-full rounded-nho border border-vien-dam bg-giay-sang px-3 py-2 text-[14px] text-muc-2" /></div>
          <button type="button" className={NUT_CHINH} disabled={dangTai} onClick={taiLen}>{dangTai ? "Đang tải lên" : "Tải lên"}</button>
        </div>
        {du.taiLieu.length === 0 ? <p className="text-[13px] text-muc-3">Chưa có giấy tờ nào.</p> : (
          <ul className="the-noi the-noi-thap divide-y divide-vien overflow-hidden">
            {du.taiLieu.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3 text-[13px]">
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-2"><strong className="font-semibold text-muc">{t.loai}</strong><NhanTrangThai kieu={kieuTl(t.trang_thai)}>{t.trang_thai}</NhanTrangThai></span>
                  <span className="mt-0.5 block truncate text-muc-3">{t.ten_tep} · {kb(t.kich_thuoc)} · {ngayVN(t.tao_luc.slice(0, 10))}</span>
                  {t.ghi_chu && <span className="mt-0.5 block text-loi">{t.ghi_chu}</span>}
                </span>
                <span className="flex flex-wrap items-center gap-4">
                  <a href={`/api/tai-lieu/${t.id}`} target="_blank" rel="noopener noreferrer" className={NUT_CHU}>Xem</a>
                  {quanTri && t.trang_thai !== "Đã xác nhận" && <button type="button" disabled={dang} className={NUT_CHU} onClick={() => xacNhan(t.id)}>Xác nhận</button>}
                  {quanTri && t.trang_thai !== "Cần bổ sung" && <button type="button" className={NUT_CHU} onClick={() => setHop({ k: "ly-do", id: t.id, kieu: "bo-sung", ten: t.loai })}>Yêu cầu bổ sung</button>}
                  {(quanTri || t.trang_thai !== "Đã xác nhận") && <button type="button" className={NUT_CHU_NGUY} onClick={() => setHop({ k: "ly-do", id: t.id, kieu: "go", ten: t.loai })}>Gỡ</button>}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Hop mo={hop?.k === "than-nhan"} dong={dong} tieuDe="Thêm người thân">
        {hop?.k === "than-nhan" && (
          <form ref={formTn} className="space-y-4" onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}>
            <input type="hidden" name="nhan_vien_id" value={nvId} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div><label htmlFor="tn-ten" className={NHAN_O}>Họ tên *</label><input id="tn-ten" name="ho_ten" required className={O_NHAP} /></div>
              <div><label htmlFor="tn-qh" className={NHAN_O}>Quan hệ *</label><Chon id="tn-qh" ten="quan_he" batBuoc trong="Chọn quan hệ" luaChon={QUAN_HE.map((q) => ({ gia_tri: q, nhan: q }))} /></div>
              <div><label htmlFor="tn-ns" className={NHAN_O}>Ngày sinh</label><NgayChon id="tn-ns" ten="ngay_sinh" tuNam={1930} denNam={2100} /></div>
              <div><label htmlFor="tn-cccd" className={NHAN_O}>Số CCCD</label><input id="tn-cccd" name="cccd" className={O_NHAP} /></div>
              <label className="flex items-center gap-2 text-[14px] text-muc-2 sm:col-span-2"><input type="checkbox" name="phu_thuoc" value="1" /> Đăng ký là người phụ thuộc (giảm trừ gia cảnh)</label>
            </div>
            {loi && <div role="alert" className="rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi">{loi}</div>}
            <div className="flex justify-end gap-2 border-t border-vien pt-4"><button type="button" className={NUT_PHU} onClick={dong}>Đóng</button><button type="button" className={NUT_CHINH} disabled={dang} onClick={luuTn}>Lưu</button></div>
          </form>
        )}
      </Hop>

      <Hop mo={hop?.k === "ly-do"} dong={dong} tieuDe={hop?.k === "ly-do" ? (hop.kieu === "go" ? "Gỡ giấy tờ" : "Yêu cầu bổ sung") : ""} moTa={hop?.k === "ly-do" ? hop.ten : undefined}>
        {hop?.k === "ly-do" && (
          <div className="space-y-4">
            <div><label htmlFor="h-ly-do" className={NHAN_O}>{hop.kieu === "go" ? "Lý do gỡ *" : "Cần bổ sung gì? *"}</label><textarea id="h-ly-do" value={lyDo} onChange={(e) => setLyDo(e.target.value)} className={O_NHIEU_DONG} /></div>
            {hop.kieu === "go" && <p className="text-[12px] text-muc-3">Giấy tờ chỉ được gỡ khỏi hồ sơ, tệp vẫn được giữ trong kho để truy vết.</p>}
            {loi && <div role="alert" className="rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi">{loi}</div>}
            <div className="flex justify-end gap-2 border-t border-vien pt-4"><button type="button" className={NUT_PHU} onClick={dong}>Đóng</button><button type="button" className={NUT_CHINH} disabled={dang} onClick={gui}>Xong</button></div>
          </div>
        )}
      </Hop>
    </div>
  );
}
