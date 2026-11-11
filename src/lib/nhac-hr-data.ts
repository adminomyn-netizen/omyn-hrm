import "server-only";
import { dbHr } from "@/lib/hr-db";
import { chiTieuApCho, docKy } from "@/lib/kpi";
import { docKetQua, docNen, tinhBang } from "@/lib/kpi-data";
import { congNgay, danhGiaCanNhac, hopDongCanNhac, kyCanBaoXepHang, nhanHan, offerCanNhac, phutToiPhongVan, tinXepHang, tomTatHcns, type TinHr } from "@/lib/nhac-hr";
import { ngayLamViecTruoc } from "@/lib/nhac-cong";
import { tinLichHomNay } from "@/lib/lich-nhan-su";
import { suKienDeNhac } from "@/lib/lich-nhan-su-data";

type Gui = (userId: string, khung: string, tin: Omit<TinHr, "khung">) => Promise<void>;
export type NgCanh = { hom: string; phut: number; nowMs: number; gui: Gui; layQuanLy: () => Promise<string[]> };

const gio = (iso: string) => new Date(iso).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Ho_Chi_Minh" });
const ngayLe = async (hom: string) => !!(await dbHr().from("ngay_le").select("ngay").eq("ngay", hom).maybeSingle()).data;
const laChuNhat = (hom: string) => new Date(`${hom}T00:00:00Z`).getUTCDay() === 0;

/** Nhắc việc HCNS & KPI, gọi mỗi 5 phút từ cron nhắc việc. `gui` đã chặn gửi trùng theo (người, ngày, khung).
 *  · Người phỏng vấn: trong 65 phút trước buổi phỏng vấn.
 *  · 08:00–10:00: quản lý HCNS một bản tóm tắt (phỏng vấn hôm nay, offer cần chốt, đánh giá thử việc đến hạn, đề xuất chờ); mentor nhận nhắc đánh giá 30/60 ngày của mình.
 *  · 08:30–10:00: xếp hạng KPI của ngày làm việc trước (ngày 1: thêm tháng/quý vừa qua) cho từng người có điểm.
 *  · 16:30–17:30: người chưa có KPI hôm nay được nhắc nhập; 17:30–18:30: trưởng phòng được nhắc về cấp dưới còn thiếu. Chủ nhật và ngày lễ không nhắc. */
export async function nhacHr(c: NgCanh): Promise<number> {
  const db = dbHr();
  let dem = 0;
  const gui: Gui = async (u, k, t) => { dem++; await c.gui(u, k, t); };
  const userCua = async (ids: (string | null)[]) => {
    const co = [...new Set(ids.filter((x): x is string => !!x))];
    if (!co.length) return new Map<string, string>();
    const { data } = await db.from("nhan_vien").select("id, user_id").in("id", co).not("user_id", "is", null);
    return new Map<string, string>((data ?? []).map((x) => [x.id, x.user_id]));
  };

  // 1. Phỏng vấn sắp tới → người phỏng vấn
  const { data: pvTho } = await db.from("lich_phong_van").select("id, ten_ung_vien, vi_tri, vong, thoi_gian, hinh_thuc, dia_diem, nguoi_phong_van_id, nguoi_phong_van_ids")
    .eq("ket_qua", "Chờ").gte("thoi_gian", new Date(c.nowMs).toISOString()).lte("thoi_gian", new Date(c.nowMs + 65 * 60_000).toISOString());
  // Nhiều người phỏng vấn mỗi lịch; dữ liệu cũ chỉ có cột một người.
  const pv = (pvTho ?? []).map((p) => ({ ...p, ds: (Array.isArray(p.nguoi_phong_van_ids) && p.nguoi_phong_van_ids.length ? p.nguoi_phong_van_ids : p.nguoi_phong_van_id ? [p.nguoi_phong_van_id] : []) as string[] })).filter((p) => p.ds.length > 0);
  const uPv = await userCua(pv.flatMap((p) => p.ds));
  for (const p of pv) {
    const ph = phutToiPhongVan(Date.parse(p.thoi_gian), c.nowMs);
    if (!ph) continue;
    for (const nvId of p.ds) {
      const u = uPv.get(nvId);
      if (u) await gui(u, `pv1h_${p.id}`, { tieuDe: `Phỏng vấn lúc ${gio(p.thoi_gian)}`, noiDung: `${p.ten_ung_vien ?? "Ứng viên"}${p.vi_tri ? ` (${p.vi_tri})` : ""} · ${p.vong} · ${p.hinh_thuc}${p.dia_diem ? ` · ${p.dia_diem}` : ""}`, url: "/hr/lich-phong-van" });
    }
  }

  // 2. Tóm tắt sáng cho HCNS + nhắc mentor
  if (c.phut >= 8 * 60 && c.phut < 10 * 60) {
    const [pvHom, offers, onb, dg, dx, hd] = await Promise.all([
      db.from("lich_phong_van").select("id", { count: "exact", head: true }).eq("ket_qua", "Chờ").gte("thoi_gian", `${c.hom}T00:00:00+07:00`).lte("thoi_gian", `${c.hom}T23:59:59+07:00`),
      db.from("offer_tuyen_dung").select("ten_ung_vien, han_tra_loi, trang_thai").in("trang_thai", ["Đã gửi", "Thương lượng"]).not("han_tra_loi", "is", null),
      db.from("theo_doi_onboarding").select("id, ho_ten, mentor_id, ngay_bat_dau, so_ngay_thu_viec").eq("tinh_trang", "Đang thử việc").limit(500),
      db.from("danh_gia_thu_viec").select("onb_id, moc").limit(2000),
      db.from("de_xuat_phe_duyet").select("id", { count: "exact", head: true }).eq("trang_thai", "Chờ duyệt"),
      db.from("hop_dong_lao_dong").select("id, nhan_vien_id, den_ngay, trang_thai").eq("trang_thai", "Đang hiệu lực").not("den_ngay", "is", null).gte("den_ngay", congNgay(c.hom, -3)).lte("den_ngay", congNgay(c.hom, 45)).limit(500),
    ]);
    const hdNhac = (hd.data ?? []).filter((h) => hopDongCanNhac(h.den_ngay, h.trang_thai, c.hom) !== null);
    const offerNhac = (offers.data ?? []).filter((o) => offerCanNhac(o.han_tra_loi, o.trang_thai, c.hom) !== null);
    const daCo = new Map<string, string[]>();
    for (const d of dg.data ?? []) daCo.set(d.onb_id, [...(daCo.get(d.onb_id) ?? []), d.moc]);
    const dgNhac = (onb.data ?? []).flatMap((o) => danhGiaCanNhac(o.ngay_bat_dau, c.hom, daCo.get(o.id) ?? [], o.so_ngay_thu_viec).map((d) => ({ ...d, onbId: o.id, ten: o.ho_ten, mentorId: o.mentor_id as string | null })));
    const tt = tomTatHcns({ phongVanHomNay: pvHom.count ?? 0, offerCanNhac: offerNhac.length, danhGiaCanNhac: dgNhac.length, deXuatCho: dx.count ?? 0, hopDongSapHan: hdNhac.length });
    if (tt) for (const u of await c.layQuanLy()) await gui(u, tt.khung, { tieuDe: tt.tieuDe, noiDung: tt.noiDung, url: tt.url });
    const lich = tinLichHomNay(await suKienDeNhac(c.hom), c.hom);
    if (lich) for (const u of await c.layQuanLy()) await gui(u, lich.khung, { tieuDe: lich.tieuDe, noiDung: lich.noiDung, url: lich.url });
    const uMentor = await userCua(dgNhac.map((d) => d.mentorId));
    for (const d of dgNhac) {
      const u = d.mentorId ? uMentor.get(d.mentorId) : undefined;
      if (u) await gui(u, `dg_${d.onbId}_${d.moc.slice(0, 2)}`, { tieuDe: `Đánh giá ${d.moc}: ${d.ten}`, noiDung: `Đánh giá thử việc mốc ${d.moc} ${nhanHan(d.con)}. Mở ra chấm điểm giúp nhé.`, url: `/hr/onboarding/${d.onbId}` });
    }
  }

  // 3. Xếp hạng KPI
  if (c.phut >= 8 * 60 + 30 && c.phut < 10 * 60) {
    const nen = await docNen();
    if (nen.chiTieu.length) {
      // Chủ nhật/ngày lễ không báo hạng ngày (tránh báo trùng ngày làm việc trước hai lần); hạng tháng/quý vẫn báo.
      const nghi = laChuNhat(c.hom) || (await ngayLe(c.hom));
      const cacKy = kyCanBaoXepHang(c.hom, await ngayLamViecTruoc(c.hom));
      for (const ma of nghi ? cacKy.slice(1) : cacKy) {
        const ky = docKy(ma);
        if (!ky) continue;
        const b = await tinhBang(nen, ky);
        if (!b.toanCongTy.length) continue;
        for (const n of nen.nguoi) {
          const dong = b.toanCongTy.find((x) => x.id === n.id);
          if (!dong || !n.userId) continue;
          const ph = n.khoiId ? b.hangPhong.find((p) => p.id === n.khoiId) : undefined;
          const t = tinXepHang({ kyNhan: ky.nhan, kyMa: ky.ma, hangCaNhan: dong.hang, tongNguoi: b.toanCongTy.length, diem: dong.diem, phong: ph ? { ten: ph.ten, hang: ph.hang, tong: b.hangPhong.length } : undefined, top: b.toanCongTy[0].ten });
          await gui(n.userId, t.khung, { tieuDe: t.tieuDe, noiDung: t.noiDung, url: t.url });
        }
      }
    }
  }

  // 4. Chưa nhập KPI hôm nay
  if (c.phut >= 16 * 60 + 30 && c.phut < 18 * 60 + 30 && !laChuNhat(c.hom) && !(await ngayLe(c.hom))) {
    const nen = await docNen();
    if (nen.chiTieu.length) {
      const daBao = new Set((await docKetQua(c.hom, c.hom)).map((r) => r.nhanVienId));
      const thieu = nen.nguoi.filter((n) => chiTieuApCho(nen.chiTieu, n.khoiId).length > 0 && !daBao.has(n.id));
      if (c.phut < 17 * 60 + 30) {
        for (const n of thieu) if (n.userId) await gui(n.userId, "kpi_nhap", { tieuDe: "Chưa nhập KPI hôm nay", noiDung: "Nhập kết quả KPI của bạn hôm nay để vào bảng xếp hạng thi đua.", url: "/kpi/nhap" });
      } else {
        const theoQuanLy = new Map<string, number>();
        for (const n of thieu) if (n.quanLyId) theoQuanLy.set(n.quanLyId, (theoQuanLy.get(n.quanLyId) ?? 0) + 1);
        const uQl = await userCua([...theoQuanLy.keys()]);
        for (const [ql, soNguoi] of theoQuanLy) { const u = uQl.get(ql); if (u) await gui(u, "kpi_nhap_lead", { tieuDe: "Cấp dưới chưa có KPI hôm nay", noiDung: `${soNguoi} người trong nhóm bạn chưa có kết quả KPI hôm nay. Nhập giúp hoặc nhắc họ.`, url: "/kpi/nhap" }); }
      }
    }
  }
  return dem;
}
