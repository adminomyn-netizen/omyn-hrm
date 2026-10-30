export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { yeuCauVaiTro } from "@/lib/auth";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { MucTrang } from "@/components/ui/MucTrang";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { HoSoNghiViec, type MucView } from "@/components/nghi-viec/HoSoNghiViec";
import { dbHr } from "@/lib/hr-db";
import { CHO_XAC_NHAN, baoTruocThieu, ngayBaoTruoc } from "@/lib/nghi-viec";

const dMY = (s: string | null) => (s ? s.split("-").reverse().join("/") : "—");

export default async function TrangHoSoNghiViec({ params }: { params: Promise<{ id: string }> }) {
  await yeuCauVaiTro(["admin", "ky_thuat"]);
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const db = dbHr();
  const { data } = await db.from("nghi_viec").select("*, nhan_vien(ho_ten, chuc_danh)").eq("id", id).maybeSingle();
  if (!data) notFound();
  const h = data as Record<string, string | boolean | null> & { nhan_vien: { ho_ten: string; chuc_danh: string | null } | null };
  const nvId = h.nhan_vien_id as string;
  const [muc, ts, hd, nhanSu] = await Promise.all([
    db.from("nghi_viec_muc").select("id, nhom, ten, bat_buoc, xong, xong_luc, xong_boi_ten, ghi_chu").eq("nghi_viec_id", id).order("thu_tu").order("tao_luc"),
    db.from("tai_san_cap_phat").select("id, ten_tai_san, ma_tai_san, so_luong, ngay_cap, tinh_trang").eq("nhan_vien_id", nvId).eq("tinh_trang", "Đang giữ"),
    db.from("hop_dong_lao_dong").select("loai, tu_ngay, den_ngay").eq("nhan_vien_id", nvId).eq("trang_thai", "Đang hiệu lực").order("tu_ngay", { ascending: false }).limit(1),
    db.from("nhan_vien").select("id, ho_ten, chuc_danh").neq("trang_thai", "Đã nghỉ").order("ho_ten"),
  ]);
  const hdNow = ((hd.data ?? []) as { loai: string; tu_ngay: string; den_ngay: string | null }[])[0];
  const can = ngayBaoTruoc(hdNow?.loai, hdNow?.tu_ngay, hdNow?.den_ngay);
  const thieuNgay = h.loai === "Trước hạn" || can ? baoTruocThieu(h.ngay_nop as string, h.ngay_lam_viec_cuoi as string, can) : null;
  const dsTs = (ts.data ?? []) as { id: string; ten_tai_san: string; ma_tai_san: string | null; so_luong: number; ngay_cap: string }[];
  const mo = h.trang_thai === "Đang bàn giao";
  return (
    <>
      <TieuDeTrang tieuDe={`Nghỉ việc: ${h.nhan_vien?.ho_ten ?? "—"}`} phu={<><Link href="/nghi-viec" className="text-nhan-dam hover:underline">← Danh sách</Link> · {h.nhan_vien?.chuc_danh ?? "—"} · nộp đơn {dMY(h.ngay_nop as string)} · làm việc đến {dMY(h.ngay_lam_viec_cuoi as string)}</>}>
        <NhanTrangThai kieu={h.trang_thai === "Đã đóng" ? "tot" : h.trang_thai === "Huỷ" ? "tram" : "cho"}>{h.trang_thai as string}</NhanTrangThai>
      </TieuDeTrang>
      {h.ly_do && <p className="mb-4 text-[14px] text-muc-2">Lý do: {h.ly_do as string}</p>}
      {thieuNgay !== null && (
        <p className="mb-5 rounded-nho bg-canh-bao-nen px-4 py-3 text-[14px] text-canh-bao">Báo trước thiếu {thieuNgay} ngày so với quy định {can} ngày của hợp đồng {hdNow?.loai.toLowerCase()} ({CHO_XAC_NHAN}).</p>
      )}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <HoSoNghiViec
          h={{ id, mo, trang_thai: h.trang_thai as string, pvTrangThai: h.pv_trang_thai as string, pvNgay: (h.pv_ngay as string) ?? "", pvNguoiId: (h.pv_nguoi_id as string) ?? "", pvLyDoThat: (h.pv_ly_do_that as string) ?? "", pvGhiChu: (h.pv_ghi_chu as string) ?? "", pvQuayLai: h.pv_co_the_quay_lai === true ? "Có" : h.pv_co_the_quay_lai === false ? "Không" : "" }}
          muc={(muc.data ?? []) as MucView[]}
          nhanSu={((nhanSu.data ?? []) as { id: string; ho_ten: string; chuc_danh: string | null }[]).map((n) => ({ id: n.id, ten: n.chuc_danh ? `${n.ho_ten} · ${n.chuc_danh}` : n.ho_ten }))}
        />
        <div className="space-y-5">
          <MucTrang tieuDe="Tài sản đang giữ" phai={<Link href="/hr/tai-san-cap-phat" className="font-medium text-nhan-dam underline-offset-4 hover:underline">Quản lý</Link>}>
            {dsTs.length === 0 ? <p className="text-[14px] text-nhan-dam">Không còn tài sản nào đang giữ.</p> : (
              <ul className="space-y-2">{dsTs.map((t) => <li key={t.id} className="text-[14px] text-muc">{t.ten_tai_san}{t.so_luong > 1 ? ` ×${t.so_luong}` : ""}{t.ma_tai_san && <span className="text-muc-3"> · {t.ma_tai_san}</span>}<span className="block text-[12px] text-muc-3">Cấp {dMY(t.ngay_cap)} — chưa trả</span></li>)}</ul>
            )}
            <p className="mt-3 text-[12px] text-muc-3">Đổi tình trạng sang “Đã trả” ở mục Tài sản cấp phát; còn “Đang giữ” là chưa đóng được hồ sơ.</p>
          </MucTrang>
          {hdNow && <MucTrang tieuDe="Hợp đồng hiện tại"><p className="text-[14px] text-muc">{hdNow.loai}<span className="block text-[13px] text-muc-3">{dMY(hdNow.tu_ngay)} → {hdNow.den_ngay ? dMY(hdNow.den_ngay) : "không thời hạn"}</span></p></MucTrang>}
        </div>
      </div>
    </>
  );
}
