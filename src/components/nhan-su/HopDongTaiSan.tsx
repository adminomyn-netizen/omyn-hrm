import Link from "next/link";
import { MucTrang } from "@/components/ui/MucTrang";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { dbHr } from "@/lib/hr-db";
import { CHO_XAC_NHAN, canhBaoHopDong, type HopDong } from "@/lib/hop-dong";
import { truongThieuTheoLuat } from "@/lib/ho-so";

const dMY = (s: string | null) => (s ? s.split("-").reverse().join("/") : "—");

/** Dưới hồ sơ nhân viên: hợp đồng + cảnh báo luật, phụ lục, tài sản đang giữ, thông tin còn thiếu theo luật, lịch sử thay đổi. Chỉ Quản trị/Kỹ thuật thấy (trang đã chặn). */
export async function HopDongTaiSan({ nhanVienId, hoSo, dangLam }: { nhanVienId: string; hoSo: Record<string, unknown> | null; dangLam: boolean }) {
  const db = dbHr();
  const [hd, pl, ts, ls] = await Promise.all([
    db.from("hop_dong_lao_dong").select("id, loai, so_hop_dong, lan, tu_ngay, den_ngay, trang_thai, nhan_vien_id").eq("nhan_vien_id", nhanVienId).order("tu_ngay", { ascending: false }),
    db.from("hop_dong_phu_luc").select("id, so_hop_dong, so_phu_luc, loai_thay_doi, ngay_hieu_luc, den_ngay_moi, trang_thai").eq("nhan_vien_id", nhanVienId).order("ngay_hieu_luc", { ascending: false }),
    db.from("tai_san_cap_phat").select("id, ten_tai_san, ma_tai_san, so_luong, ngay_cap, ngay_tra, tinh_trang").eq("nhan_vien_id", nhanVienId).order("ngay_cap", { ascending: false }),
    db.from("nhan_su_lich_su").select("id, doi_tuong, hanh_dong, mo_ta, ten_nguoi, luc").eq("nhan_vien_id", nhanVienId).order("luc", { ascending: false }).limit(15),
  ]);
  const homNay = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" });
  const dsHd = (hd.data ?? []) as (HopDong & { id: string; so_hop_dong: string | null; lan: number })[];
  const canh = dangLam ? canhBaoHopDong(dsHd, [nhanVienId], homNay) : [];
  const thieuTruong = truongThieuTheoLuat(hoSo);
  const gio = (iso: string) => new Date(iso).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  return (
    <div className="mt-6 grid gap-5 lg:grid-cols-2">
      <MucTrang tieuDe="Hợp đồng lao động" phai={<Link href="/hr/hop-dong-lao-dong" className="font-medium text-nhan-dam underline-offset-4 hover:underline">Quản lý hợp đồng</Link>}>
        {(canh.length > 0 || thieuTruong.length > 0) && (
          <ul className="mb-4 space-y-1.5">
            {thieuTruong.length > 0 && <li className="text-[13px] text-canh-bao">Thiếu thông tin bắt buộc theo luật: {thieuTruong.join(", ")}.</li>}
            {canh.map((c, i) => <li key={i} className={`text-[13px] ${c.muc === "loi" ? "text-loi" : "text-canh-bao"}`}>{c.noiDung}</li>)}
            {canh.length > 0 && <li className="text-[12px] text-muc-3">Mốc thời hạn và số lần ký theo Bộ luật Lao động 2019, {CHO_XAC_NHAN}.</li>}
          </ul>
        )}
        {dsHd.length === 0 ? <p className="text-[14px] text-muc-3">Chưa có hợp đồng.</p> : (
          <ul className="divide-y divide-vien">
            {dsHd.map((h) => (
              <li key={h.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 text-[14px]">
                <span className="min-w-0 flex-1"><span className="text-muc">{h.loai}</span> <span className="text-muc-3">· lần {h.lan}{h.so_hop_dong ? ` · số ${h.so_hop_dong}` : ""}</span><span className="block text-[13px] text-muc-3">{dMY(h.tu_ngay)} → {h.den_ngay ? dMY(h.den_ngay) : "không thời hạn"}</span></span>
                <NhanTrangThai kieu={h.trang_thai === "Đang hiệu lực" ? "tot" : h.trang_thai === "Chờ ký" ? "cho" : "tram"}>{h.trang_thai}</NhanTrangThai>
              </li>
            ))}
          </ul>
        )}
        {(pl.data ?? []).length > 0 && (
          <div className="mt-4 border-t border-vien pt-3">
            <div className="mb-1.5 text-[12px] font-medium text-muc-3">Phụ lục</div>
            <ul className="space-y-1.5">
              {(pl.data as { id: string; so_phu_luc: string | null; loai_thay_doi: string; ngay_hieu_luc: string; den_ngay_moi: string | null; trang_thai: string }[]).map((p) => (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 text-[14px]"><span className="text-muc">{p.loai_thay_doi}{p.so_phu_luc ? ` · ${p.so_phu_luc}` : ""} <span className="text-muc-3">từ {dMY(p.ngay_hieu_luc)}{p.den_ngay_moi ? `, hết hạn mới ${dMY(p.den_ngay_moi)}` : ""}</span></span><NhanTrangThai kieu={p.trang_thai === "Đã ký" ? "tot" : "cho"}>{p.trang_thai}</NhanTrangThai></li>
              ))}
            </ul>
          </div>
        )}
      </MucTrang>

      <MucTrang tieuDe="Tài sản cấp phát" phai={<Link href="/hr/tai-san-cap-phat" className="font-medium text-nhan-dam underline-offset-4 hover:underline">Quản lý tài sản</Link>}>
        {(ts.data ?? []).length === 0 ? <p className="text-[14px] text-muc-3">Chưa cấp tài sản nào.</p> : (
          <ul className="divide-y divide-vien">
            {(ts.data as { id: string; ten_tai_san: string; ma_tai_san: string | null; so_luong: number; ngay_cap: string; ngay_tra: string | null; tinh_trang: string }[]).map((t) => (
              <li key={t.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 text-[14px]">
                <span className="min-w-0 flex-1"><span className="text-muc">{t.ten_tai_san}{t.so_luong > 1 ? ` ×${t.so_luong}` : ""}</span>{t.ma_tai_san && <span className="text-muc-3"> · {t.ma_tai_san}</span>}<span className="block text-[13px] text-muc-3">Cấp {dMY(t.ngay_cap)}{t.ngay_tra ? ` · trả ${dMY(t.ngay_tra)}` : ""}</span></span>
                <NhanTrangThai kieu={t.tinh_trang === "Đang giữ" ? "cho" : t.tinh_trang === "Đã trả" ? "tot" : "loi"}>{t.tinh_trang}</NhanTrangThai>
              </li>
            ))}
          </ul>
        )}
      </MucTrang>

      <div className="lg:col-span-2">
        <MucTrang tieuDe="Lịch sử thay đổi">
          {(ls.data ?? []).length === 0 ? <p className="text-[14px] text-muc-3">Chưa có thay đổi nào được ghi lại.</p> : (
            <ol className="space-y-2.5">
              {(ls.data as { id: string; doi_tuong: string; hanh_dong: string; mo_ta: string; ten_nguoi: string | null; luc: string }[]).map((l) => (
                <li key={l.id} className="text-[14px]"><span className="rounded-tag bg-giay-tram px-2 py-0.5 text-[12px] font-medium text-muc-2">{l.hanh_dong}</span> <span className="text-muc">{l.mo_ta}</span><span className="block text-[12px] text-muc-3">{l.ten_nguoi ?? "—"} · {gio(l.luc)}</span></li>
              ))}
            </ol>
          )}
        </MucTrang>
      </div>
    </div>
  );
}
