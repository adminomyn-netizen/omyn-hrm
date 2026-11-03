"use server";

import { revalidatePath } from "next/cache";
import { layNguoiDungHienTai } from "@/lib/auth";
import { quyenTrenSo } from "@/lib/quyen-nghiep-vu";
import { dbHr, docTatCa } from "@/lib/hr-db";
import { layDongDiemGop } from "@/lib/kinh-doanh-db";
import { ngayHomNayHCM } from "@/lib/data";
import { tinhDiemKhach } from "@/lib/kinh-doanh";
import { lapHangDoi } from "@/lib/tin-nhan";
import { ghiLichSuNhanSu } from "@/lib/nhan-su-lich-su";

export type KetQuaLap = { loi?: string; ok?: boolean; them?: number };

/** Lập hàng đợi hôm nay. CHỈ ghi vào hàng đợi (Chờ gửi), không gửi gì ra ngoài. */
export async function lapHangDoiHomNay(): Promise<KetQuaLap> {
  const nd = await layNguoiDungHienTai();
  if (!nd || nd.phaiDoiMatKhau) return { loi: "Bạn không có quyền thực hiện thao tác này." };
  if (nd.vaiTro !== "admin" && nd.vaiTro !== "ky_thuat") {
    if (nd.vaiTro !== "nhan_vien") return { loi: "Bạn không có quyền thực hiện thao tác này." };
    const q = await quyenTrenSo(nd, "Kinh doanh");
    if (q.muc !== "nhap") return { loi: "Bạn không có quyền thực hiện thao tác này." };
  }
  const homNay = ngayHomNayHCM();
  const [kh, dong, hg, chd, kb, mt, co] = await Promise.all([
    docTatCa<{ id: string; ten: string; kenh: string; dien_thoai: string | null; ngay_sinh: string | null; dong_y_nhan_tin: boolean }>("kd_khach_le", "id, ten, kenh, dien_thoai, ngay_sinh, dong_y_nhan_tin"),
    layDongDiemGop(),
    docTatCa<{ ten: string; mua_toi_thieu: number; he_so_tich_pt: number }>("kd_hang_khach", "id, ten, mua_toi_thieu, he_so_tich_pt"),
    docTatCa<{ dong_moi_diem: number; dong_giam_moi_diem: number; het_han_thang: number; cua_so_hang_thang: number }>("kd_diem_cau_hinh", "id, dong_moi_diem, dong_giam_moi_diem, het_han_thang, cua_so_hang_thang"),
    docTatCa<{ id: string; su_kien: string; so_ngay: number; mau_tin_id: string; bat: boolean }>("tn_kich_ban", "id, su_kien, so_ngay, mau_tin_id, bat"),
    docTatCa<{ id: string; kenh: "SMS" | "Zalo"; noi_dung: string; dang_dung: boolean }>("tn_mau_tin", "id, kenh, noi_dung, dang_dung"),
    docTatCa<{ khach_le_id: string; kich_ban_id: string | null; ngay_du_kien: string }>("tn_hang_doi", "id, khach_le_id, kich_ban_id, ngay_du_kien"),
  ]);
  const c = chd[0];
  const diem = c
    ? tinhDiemKhach(
        kh.map((k) => ({ id: k.id, ten: k.ten, kenh: k.kenh, dongYNhanTin: k.dong_y_nhan_tin })),
        dong,
        hg.map((h) => ({ ten: h.ten, muaToiThieu: h.mua_toi_thieu, heSoPt: h.he_so_tich_pt })),
        { dongMoiDiem: c.dong_moi_diem, dongGiamMoiDiem: c.dong_giam_moi_diem, hetHanThang: c.het_han_thang, cuaSoHangThang: c.cua_so_hang_thang },
        homNay,
      )
    : [];
  const muc = lapHangDoi(
    kh.map((k) => ({ id: k.id, ten: k.ten, dienThoai: k.dien_thoai, ngaySinh: k.ngay_sinh, dongYNhanTin: k.dong_y_nhan_tin })),
    diem,
    dong,
    kb.map((k) => ({ id: k.id, suKien: k.su_kien, soNgay: k.so_ngay, mauTinId: k.mau_tin_id, bat: k.bat })),
    mt.map((m) => ({ id: m.id, kenh: m.kenh, noiDung: m.noi_dung, dangDung: m.dang_dung })),
    co.map((x) => ({ khachId: x.khach_le_id, kichBanId: x.kich_ban_id, ngay: x.ngay_du_kien })),
    homNay,
  );
  if (muc.length === 0) return { ok: true, them: 0 };
  const { error } = await dbHr().from("tn_hang_doi").insert(
    muc.map((m) => ({ khach_le_id: m.khachId, kich_ban_id: m.kichBanId, kenh: m.kenh, noi_dung: m.noiDung, ngay_du_kien: m.ngayDuKien })),
  );
  if (error) return { loi: "Chưa lập được hàng đợi, thử lại sau." };
  await ghiLichSuNhanSu({
    nhanVienId: null, doiTuong: "Hàng đợi gửi tin", doiTuongId: null, hanhDong: "Thêm",
    moTa: `Lập hàng đợi tin ngày ${homNay}: thêm ${muc.length} tin (chưa gửi, cổng gửi tắt)`, truoc: null, sau: { ngay: homNay, so_tin: muc.length },
    nguoi: { id: nd.id, hoTen: nd.hoTen },
  });
  revalidatePath("/kinh-doanh/tin-nhan");
  revalidatePath("/hr/hang-doi-tin");
  return { ok: true, them: muc.length };
}
