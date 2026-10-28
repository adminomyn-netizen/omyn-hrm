import "server-only";
import ExcelJS from "exceljs";
import { createAdminClient } from "@/lib/supabase/admin";
import { vaiTroCuaNguoi, type VaiTro } from "@/lib/auth";
import { ngayHomNayHCM } from "@/lib/data";
import { locMenuTheoVaiTro } from "@/lib/nav";

export const KHO_CHAT = "chat-agent";
export type NguoiHoi = { userId: string; hoTen: string; vaiTro: VaiTro };
const QUAN_LY: VaiTro[] = ["admin", "ky_thuat"];

/** Người hỏi do SERVER dựng từ mã thông hành của tin chat (không bao giờ do mô hình hay trình duyệt khai). Thiếu/hết hạn/tin đã xong → null. */
export async function nguoiTuThongHanh(mang: string): Promise<{ nd: NguoiHoi; tinId: string; cuocId: string } | null> {
  if (!/^[0-9a-f]{48}$/.test(mang)) return null;
  const db = createAdminClient();
  const { data: tin } = await db.from("chat_tin").select("id, cuoc_id, user_id, trang_thai, han_thong_hanh").eq("thong_hanh", mang).maybeSingle();
  if (!tin || !["cho", "dang_xu_ly"].includes(tin.trang_thai) || !tin.han_thong_hanh || new Date(tin.han_thong_hanh).getTime() < Date.now()) return null;
  const v = await vaiTroCuaNguoi(tin.user_id);
  if (!v || v.vaiTro === "cho_duyet") return null;
  return { nd: { userId: tin.user_id, hoTen: v.hoTen, vaiTro: v.vaiTro }, tinId: tin.id, cuocId: tin.cuoc_id };
}

const TU_CHOI = (viec: string) => JSON.stringify({ tu_choi: true, ly_do: `Người đang hỏi không có quyền ${viec}. Hãy từ chối lịch sự, không đoán và không gợi ý cách lách.` });
const cat = (o: unknown, gioiHan = 12000) => { const s = JSON.stringify(o); return s.length > gioiHan ? s.slice(0, gioiHan) + "…(đã cắt bớt, hãy hỏi hẹp hơn)" : s; };
const sach = (q: string) => q.replace(/[%,()*\\]/g, " ").trim().slice(0, 60);

export const CONG_CU: Record<string, string> = {
  huong_dan: "Danh sách mục menu và chức năng người đang hỏi dùng được trong ứng dụng. Không tham số.",
  tim_nhan_vien: 'Tìm nhân viên theo tên, mã hoặc chức danh. Tham số: {"q": "chuỗi"}. Chỉ Quản trị và Kỹ thuật.',
  cham_cong_hom_nay: "Chấm công hôm nay của toàn công ty: ai đã chấm, ai chưa. Không tham số. Chỉ Quản trị và Kỹ thuật.",
  cham_cong_cua_toi: 'Chấm công của chính người đang hỏi. Tham số: {"tu": "yyyy-mm-dd", "den": "yyyy-mm-dd"} (bỏ trống là từ đầu tháng đến nay).',
  don_tu_cho_duyet: "Đơn từ đang chờ duyệt của công ty (nghỉ, giải trình công...). Không tham số. Chỉ Quản trị và Kỹ thuật.",
  xuat_file: 'Tạo tệp Excel để người hỏi tải về. Tham số: {"ten": "tên-tệp", "cot": ["Cột A","Cột B"], "dong": [["a",1],["b",2]]}. Chỉ đưa vào dữ liệu đã lấy được từ các công cụ khác. Tối đa 3000 dòng, 20 cột.',
};

export async function chayCongCu(ctx: { nd: NguoiHoi; tinId: string; cuocId: string }, ten: string, tham: Record<string, unknown>): Promise<string> {
  const { nd } = ctx, db = createAdminClient(), laQuanLy = QUAN_LY.includes(nd.vaiTro);
  switch (ten) {
    case "huong_dan":
      return cat({ vai_tro: nd.vaiTro, menu: locMenuTheoVaiTro(nd.vaiTro).map((m) => ({ ten: m.ten, duong_dan: m.duong_dan, mo_ta: m.moTa })) });
    case "tim_nhan_vien": {
      if (!laQuanLy) return TU_CHOI("xem hồ sơ nhân sự");
      const q = sach(String(tham.q ?? ""));
      if (q.length < 2) return JSON.stringify({ loi: "Cần ít nhất 2 ký tự để tìm." });
      const { data } = await db.from("nhan_vien").select("ma_nhan_vien, ho_ten, chuc_danh, trang_thai").or(`ho_ten.ilike.%${q}%,ma_nhan_vien.ilike.%${q}%,chuc_danh.ilike.%${q}%`).limit(15);
      return cat({ so_luong: data?.length ?? 0, nhan_vien: data ?? [] });
    }
    case "cham_cong_hom_nay": {
      if (!laQuanLy) return TU_CHOI("xem chấm công toàn công ty");
      const hom = ngayHomNayHCM();
      const [{ data: nv }, { data: cc }] = await Promise.all([
        db.from("nhan_vien").select("id, ho_ten").eq("tai_khoan_hoat_dong", true).neq("trang_thai", "Đã nghỉ").limit(500),
        db.from("cham_cong").select("nhan_vien_id, gio_vao, gio_ra, trang_thai").eq("ngay", hom).limit(500),
      ]);
      const co = new Map((cc ?? []).map((c) => [c.nhan_vien_id, c]));
      return cat({ ngay: hom, dang_lam: nv?.length ?? 0, da_cham_cong: (nv ?? []).filter((n) => co.has(n.id)).length, chua_cham_cong: (nv ?? []).filter((n) => !co.has(n.id)).map((n) => n.ho_ten).slice(0, 60), chi_tiet: (nv ?? []).filter((n) => co.has(n.id)).map((n) => ({ ten: n.ho_ten, vao: co.get(n.id)?.gio_vao, ra: co.get(n.id)?.gio_ra, trang_thai: co.get(n.id)?.trang_thai })).slice(0, 80) });
    }
    case "cham_cong_cua_toi": {
      const { data: me } = await db.from("nhan_vien").select("id").eq("user_id", nd.userId).maybeSingle();
      if (!me) return JSON.stringify({ loi: "Tài khoản này chưa gắn hồ sơ nhân viên nên chưa có dữ liệu chấm công." });
      const NGAY = /^\d{4}-\d{2}-\d{2}$/, den = NGAY.test(String(tham.den ?? "")) ? String(tham.den) : ngayHomNayHCM();
      const tu = NGAY.test(String(tham.tu ?? "")) ? String(tham.tu) : den.slice(0, 8) + "01";
      if (new Date(den).getTime() - new Date(tu).getTime() > 366 * 86_400_000) return JSON.stringify({ loi: "Khoảng thời gian tối đa 366 ngày." });
      const { data } = await db.from("cham_cong").select("ngay, gio_vao, gio_ra, trang_thai").eq("nhan_vien_id", me.id).gte("ngay", tu).lte("ngay", den).order("ngay").limit(400);
      return cat({ tu, den, so_ngay: data?.length ?? 0, cham_cong: data ?? [] });
    }
    case "don_tu_cho_duyet": {
      if (!laQuanLy) return TU_CHOI("xem đơn từ chờ duyệt của công ty");
      const { data } = await db.from("don_tu").select("loai, tu_ngay, den_ngay, nhan_vien_id, ly_do").eq("trang_thai", "Chờ duyệt").order("created_at", { ascending: false }).limit(30);
      const ids = [...new Set((data ?? []).map((d) => d.nhan_vien_id))];
      const { data: nv } = ids.length ? await db.from("nhan_vien").select("id, ho_ten").in("id", ids) : { data: [] as { id: string; ho_ten: string }[] };
      const t = new Map((nv ?? []).map((n) => [n.id, n.ho_ten]));
      return cat({ cho_duyet: data?.length ?? 0, don: (data ?? []).map((d) => ({ nhan_vien: t.get(d.nhan_vien_id) ?? "", loai: d.loai, tu: d.tu_ngay, den: d.den_ngay, ly_do: (d.ly_do ?? "").slice(0, 120) })) });
    }
    case "xuat_file": {
      const cot = Array.isArray(tham.cot) ? (tham.cot as unknown[]).slice(0, 20).map((c) => String(c).slice(0, 80)) : [];
      const dong = Array.isArray(tham.dong) ? (tham.dong as unknown[]).slice(0, 3000) : [];
      if (!cot.length || !dong.length) return JSON.stringify({ loi: "Cần có cột và ít nhất một dòng dữ liệu." });
      const wb = new ExcelJS.Workbook(), ws = wb.addWorksheet("Dữ liệu");
      ws.addRow(cot).font = { bold: true };
      // Ô bắt đầu bằng = + - @ bị Excel hiểu là công thức: đệm dấu nháy để không chạy công thức lạ.
      const an = (v: unknown) => (typeof v === "number" ? v : v == null ? "" : /^[=+\-@]/.test(String(v)) ? `'${String(v)}` : String(v).slice(0, 2000));
      for (const d of dong) ws.addRow((Array.isArray(d) ? d : [d]).slice(0, cot.length).map(an));
      ws.columns.forEach((c) => { c.width = 22; });
      const tenTep = (String(tham.ten ?? "du-lieu").replace(/[^\p{L}\p{N}_-]+/gu, "-").slice(0, 40) || "du-lieu") + ".xlsx";
      const duongDan = `${ctx.cuocId}/${ctx.tinId}.xlsx`;
      const buf = Buffer.from(await wb.xlsx.writeBuffer());
      const { error } = await db.storage.from(KHO_CHAT).upload(duongDan, buf, { upsert: true, contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      if (error) return JSON.stringify({ loi: "Chưa tạo được tệp, thử lại sau." });
      await db.from("chat_tin").update({ tep_duong_dan: duongDan, tep_ten: tenTep }).eq("id", ctx.tinId);
      return JSON.stringify({ ok: true, ghi_chu: `Đã tạo tệp ${tenTep} (${dong.length} dòng) và đính kèm vào câu trả lời; hãy nhắn người hỏi bấm vào tệp để tải.` });
    }
    default:
      return JSON.stringify({ loi: "Công cụ này không tồn tại trong ứng dụng này." });
  }
}
