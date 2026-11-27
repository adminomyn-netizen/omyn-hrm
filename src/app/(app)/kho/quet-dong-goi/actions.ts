"use server";

import { revalidatePath } from "next/cache";
import { layNguoiDungHienTai } from "@/lib/auth";
import { quyenTrenSo } from "@/lib/quyen-nghiep-vu";
import { dbHr } from "@/lib/hr-db";
import { ghiLichSuNhanSu } from "@/lib/nhan-su-lich-su";
import { ngayHomNayHCM } from "@/lib/data";
import { chuanMaQuet, quyetDinhDongGoi, quyetDinhHangHoan, type DongKho, type DonSo } from "@/lib/quet-dong-goi";

export type KetQuaQuet = {
  /** tot = đã ghi; canhBao = không ghi gì, cần xem; loi = lỗi hệ thống hoặc thiếu quyền. */
  muc: "tot" | "canhBao" | "loi";
  thongBao: string;
  /** true = mã chưa có ở đâu cả; màn hình hỏi có ghi đơn mới không (gọi lại với taoMoi). */
  canTao?: boolean;
  ma?: string;
};
const KENH_KHO = ["Sàn", "Sỉ và đại lý", "Livestream", "Khác"];
const NHOM = "Tài chính & Kho";
const thoat = (s: string) => s.replace(/[\\%_]/g, "\\$&");

type QuyenQuet = { loi: string } | { loi?: undefined; nd: NonNullable<Awaited<ReturnType<typeof layNguoiDungHienTai>>>; nhanVienId: string | null };
async function kiemQuyen(): Promise<QuyenQuet> {
  const nd = await layNguoiDungHienTai();
  if (!nd || nd.phaiDoiMatKhau) return { loi: "Bạn không có quyền thực hiện thao tác này." };
  if (nd.vaiTro !== "admin" && nd.vaiTro !== "ky_thuat") {
    if (nd.vaiTro !== "nhan_vien") return { loi: "Bạn không có quyền thực hiện thao tác này." };
    if ((await quyenTrenSo(nd, NHOM)).muc !== "nhap") return { loi: "Bạn không có quyền nhập ở mục Tài chính và Kho." };
  }
  const { data } = await dbHr().from("nhan_vien").select("id").eq("user_id", nd.id).maybeSingle();
  return { nd, nhanVienId: (data?.id as string | undefined) ?? null };
}

const gioVN = (iso: string | null) => (iso ? new Date(iso).toLocaleTimeString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit" }) : null);

/**
 * Quét một mã khi đóng gói. Khớp theo mã đơn (hoặc mã vận đơn) trong sổ Đóng gói và giao hàng, rồi Sổ đơn lẻ.
 * Chờ đóng → Đã đóng (ghi người quét, giờ quét). Quét lại thì chỉ báo, không ghi. Đơn huỷ, hoàn trả, đã giao thì chặn.
 * Mã chưa có ở đâu: chỉ ghi đơn mới khi người dùng bấm xác nhận (taoMoi) và chọn kênh.
 */
export async function quetDongGoi(maQuet: string, maVanDonQuet: string, taoMoi: boolean, kenhMoi: string): Promise<KetQuaQuet> {
  const q = await kiemQuyen();
  if (q.loi !== undefined) return { muc: "loi", thongBao: q.loi };
  const ma = chuanMaQuet(maQuet), vd = chuanMaQuet(maVanDonQuet);
  if (!ma) return { muc: "canhBao", thongBao: "Chưa có mã. Quét hoặc gõ mã đơn rồi nhấn Enter." };
  if (ma.length > 100 || vd.length > 100) return { muc: "canhBao", thongBao: "Mã quá dài, quét lại." };
  const db = dbHr();
  const COT = "id, ma_don, kenh, trang_thai, ma_van_don, dong_goi_luc";
  type Hang = { id: string; ma_don: string; kenh: string; trang_thai: string; ma_van_don: string | null; dong_goi_luc: string | null };
  let rows = ((await db.from("kho_dong_goi_giao").select(COT).eq("ma_don", ma)).data ?? []) as Hang[];
  if (rows.length === 0) rows = ((await db.from("kho_dong_goi_giao").select(COT).ilike("ma_van_don", thoat(ma))).data ?? []) as Hang[];
  const maDon = rows[0]?.ma_don ?? ma;
  const so = ((await db.from("kd_don_le").select("id, kenh, trang_thai").eq("ma_don", maDon)).data ?? []) as { id: string; kenh: string; trang_thai: string }[];
  const dongKho: DongKho[] = rows.map((r) => ({ id: r.id, kenh: r.kenh, trangThai: r.trang_thai, maVanDon: r.ma_van_don, dongGoiLuc: r.dong_goi_luc }));
  const donSo: DonSo[] = so.map((r) => ({ id: r.id, kenh: r.kenh, trangThai: r.trang_thai }));
  const qd = quyetDinhDongGoi(dongKho, donSo);
  const nguoi = { id: q.nd.id, hoTen: q.nd.hoTen };
  const bay = new Date().toISOString();

  // Gắn mã vận đơn nếu có quét kèm và chưa dùng cho đơn khác.
  let canhBaoVanDon = "";
  let vanDonGhi: string | null = null;
  if (vd && (qd.loai === "dong" || qd.loai === "tao" || (qd.loai === "khongThay" && taoMoi))) {
    const trung = ((await db.from("kho_dong_goi_giao").select("id").ilike("ma_van_don", thoat(vd)).limit(1)).data ?? []).length > 0;
    if (trung) canhBaoVanDon = ` Mã vận đơn ${vd} đã gắn cho đơn khác nên chưa ghi.`;
    else vanDonGhi = vd;
  }

  switch (qd.loai) {
    case "trung": return { muc: "canhBao", thongBao: qd.ly, ma: maDon };
    case "chan": return { muc: "canhBao", thongBao: `${maDon}: ${qd.ly}`, ma: maDon };
    case "daDong": return { muc: "canhBao", thongBao: `${maDon}: đã quét đóng gói trước đó${qd.luc ? ` lúc ${gioVN(qd.luc)}` : ""}. Không ghi thêm.`, ma: maDon };
    case "dong": {
      const sau: Record<string, unknown> = { trang_thai: "Đã đóng", dong_goi_luc: bay };
      if (q.nhanVienId) sau.nguoi_dong_goi_id = q.nhanVienId;
      if (vanDonGhi) sau.ma_van_don = vanDonGhi;
      const { data, error } = await db.from("kho_dong_goi_giao").update(sau).eq("id", qd.id).eq("trang_thai", "Chờ đóng").select("id");
      if (error) return { muc: "loi", thongBao: "Chưa ghi được, quét lại sau.", ma: maDon };
      if (!data?.length) return { muc: "canhBao", thongBao: `${maDon}: đơn vừa được người khác cập nhật, không ghi thêm.`, ma: maDon };
      await ghiLichSuNhanSu({ nhanVienId: null, doiTuong: "Đóng gói và giao hàng", doiTuongId: qd.id, hanhDong: "Sửa", moTa: `Quét đóng gói đơn ${maDon}: Chờ đóng → Đã đóng`, truoc: { trang_thai: "Chờ đóng" }, sau, nguoi });
      revalidatePath("/kho/quet-dong-goi");
      return { muc: "tot", thongBao: `${maDon}: đã đóng gói.${canhBaoVanDon}`, ma: maDon };
    }
    case "tao":
    case "khongThay": {
      let kenhKho: string;
      if (qd.loai === "tao") kenhKho = qd.kenhKho;
      else {
        if (!taoMoi) return { muc: "canhBao", canTao: true, thongBao: `${maDon}: chưa có trong Sổ đơn lẻ hay sổ đóng gói. Chọn kênh rồi bấm ghi đơn mới nếu đúng là đơn này.`, ma: maDon };
        if (!KENH_KHO.includes(kenhMoi)) return { muc: "canhBao", thongBao: "Chọn kênh cho đơn mới.", ma: maDon };
        kenhKho = kenhMoi;
      }
      const moi = { ngay: ngayHomNayHCM(), ma_don: maDon, kenh: kenhKho, trang_thai: "Đã đóng", dong_goi_luc: bay, nguoi_dong_goi_id: q.nhanVienId, ma_van_don: vanDonGhi, ghi_chu: qd.loai === "tao" ? "Tạo khi quét đóng gói, theo Sổ đơn lẻ" : "Tạo khi quét đóng gói, chưa có trong Sổ đơn lẻ" };
      const { data, error } = await db.from("kho_dong_goi_giao").insert(moi).select("id").single();
      if (error || !data) return { muc: "loi", thongBao: "Chưa ghi được, quét lại sau.", ma: maDon };
      await ghiLichSuNhanSu({ nhanVienId: null, doiTuong: "Đóng gói và giao hàng", doiTuongId: data.id as string, hanhDong: "Thêm", moTa: `Quét đóng gói đơn ${maDon} (đơn mới, kênh ${kenhKho})`, truoc: null, sau: moi, nguoi });
      revalidatePath("/kho/quet-dong-goi");
      return { muc: "tot", thongBao: `${maDon}: đã ghi đơn mới và đóng gói (kênh ${kenhKho}).${canhBaoVanDon}`, ma: maDon };
    }
  }
}

/**
 * Quét hàng hoàn về kho. Khớp theo mã vận đơn hoàn, hoặc mã đơn, trong Đơn hoàn. Chỉ đổi "Chờ hàng về" thành "Đã nhận đủ".
 * Hàng thiếu hoặc hỏng thì mở màn Đơn hoàn sửa tay. Không đổi tồn kho.
 */
export async function quetHangHoan(maQuet: string): Promise<KetQuaQuet> {
  const q = await kiemQuyen();
  if (q.loi !== undefined) return { muc: "loi", thongBao: q.loi };
  const ma = chuanMaQuet(maQuet);
  if (!ma) return { muc: "canhBao", thongBao: "Chưa có mã. Quét hoặc gõ mã vận đơn hoàn hoặc mã đơn." };
  if (ma.length > 100) return { muc: "canhBao", thongBao: "Mã quá dài, quét lại." };
  const db = dbHr();
  type Hoan = { id: string; tinh_trang_hang: string; don_le_id: string };
  const COT = "id, tinh_trang_hang, don_le_id";
  let rows = ((await db.from("kd_don_hoan").select(COT).ilike("ma_van_don_hoan", thoat(ma))).data ?? []) as Hoan[];
  const don = ((await db.from("kd_don_le").select("id").eq("ma_don", ma)).data ?? []) as { id: string }[];
  if (rows.length === 0 && don.length > 0) rows = ((await db.from("kd_don_hoan").select(COT).in("don_le_id", don.map((d) => d.id))).data ?? []) as Hoan[];
  const qd = quyetDinhHangHoan(rows.map((r) => ({ id: r.id, tinhTrang: r.tinh_trang_hang })), don.length > 0);
  switch (qd.loai) {
    case "khongThay": return { muc: "canhBao", thongBao: `${ma}: không thấy trong Đơn hoàn hay Sổ đơn lẻ.`, ma };
    case "chuaGhi": return { muc: "canhBao", thongBao: `${ma}: đơn có trong sổ nhưng chưa ghi chi tiết hoàn. Mở Đơn hoàn để ghi trước rồi quét lại.`, ma };
    case "nhieu": return { muc: "canhBao", thongBao: `${ma}: có nhiều lần hoàn đang chờ hàng về. Mở Đơn hoàn để chọn đúng dòng.`, ma };
    case "daGhi": return { muc: "canhBao", thongBao: `${ma}: đơn hoàn này đã ghi "${qd.tinhTrang}". Không ghi thêm.`, ma };
    case "nhan": {
      const { data, error } = await db.from("kd_don_hoan").update({ tinh_trang_hang: "Đã nhận đủ" }).eq("id", qd.id).eq("tinh_trang_hang", "Chờ hàng về").select("id");
      if (error) return { muc: "loi", thongBao: "Chưa ghi được, quét lại sau.", ma };
      if (!data?.length) return { muc: "canhBao", thongBao: `${ma}: đơn hoàn vừa được người khác cập nhật, không ghi thêm.`, ma };
      await ghiLichSuNhanSu({ nhanVienId: null, doiTuong: "Đơn hoàn", doiTuongId: qd.id, hanhDong: "Sửa", moTa: `Quét hàng hoàn về ${ma}: Chờ hàng về → Đã nhận đủ`, truoc: { tinh_trang_hang: "Chờ hàng về" }, sau: { tinh_trang_hang: "Đã nhận đủ" }, nguoi: { id: q.nd.id, hoTen: q.nd.hoTen } });
      revalidatePath("/kinh-doanh/hang-hoan");
      return { muc: "tot", thongBao: `${ma}: đã ghi hàng hoàn về, đủ. Nếu thiếu hoặc hỏng, mở Đơn hoàn sửa lại.`, ma };
    }
  }
}
