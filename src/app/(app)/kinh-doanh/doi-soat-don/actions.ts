"use server";

import { revalidatePath } from "next/cache";
import { layNguoiDungHienTai } from "@/lib/auth";
import { quyenTrenSo } from "@/lib/quyen-nghiep-vu";
import { dbHr, docTatCa } from "@/lib/hr-db";
import { ghiLichSuNhanSu } from "@/lib/nhan-su-lich-su";
import { docBangDoiSoat, NGUYEN_NHAN_LECH, phanLoaiDoiSoat, tomTatDoiSoat, type KetQuaDoiSoat, type TomTat } from "@/lib/doi-soat-don";
import type { LoiDong } from "@/lib/nhap-don-le";

export type KetQuaDoiSoatNhap = {
  loi?: string; thieuCot?: string[];
  /** true = mới kiểm, chưa ghi gì. */
  chiKiem?: boolean;
  moi?: number; daDoiSoat?: number; tomTat?: TomTat; loiDong?: LoiDong[]; canhBao?: LoiDong[]; phienId?: string;
};
const TOI_DA = 3000;
const NGAY = /^\d{4}-\d{2}-\d{2}$/;

async function kiemQuyenNhap() {
  const nd = await layNguoiDungHienTai();
  if (!nd || nd.phaiDoiMatKhau) return { loi: "Bạn không có quyền thực hiện thao tác này." } as const;
  if (nd.vaiTro !== "admin" && nd.vaiTro !== "ky_thuat") {
    if (nd.vaiTro !== "nhan_vien") return { loi: "Bạn không có quyền thực hiện thao tác này." } as const;
    if ((await quyenTrenSo(nd, "Kinh doanh")).muc !== "nhap") return { loi: "Bạn không có quyền nhập ở mục Kinh doanh." } as const;
  }
  return { nd } as const;
}

/**
 * Đối soát tiền sàn theo từng đơn từ bảng quyết toán dán/CSV. "Kiểm trước" chỉ so, không ghi gì.
 * "Nhập" tạo một phiên + các dòng; đơn đã đối soát ở gian hàng này (cùng mã đơn) thì bỏ qua nên nhập lại cùng file không bị trùng.
 * So với Sổ đơn lẻ theo kênh của gian hàng + mã đơn.
 */
export async function doiSoatTuBang(text: string, gianHangId: string, tuNgay: string, denNgay: string, chiKiem: boolean): Promise<KetQuaDoiSoatNhap> {
  const q = await kiemQuyenNhap();
  if ("loi" in q) return { loi: q.loi };
  if (!NGAY.test(tuNgay) || !NGAY.test(denNgay)) return { loi: "Chọn khoảng ngày đối soát." };
  if (denNgay < tuNgay) return { loi: "Đến ngày phải sau hoặc bằng Từ ngày." };
  if (text.length > 3_000_000) return { loi: "Dữ liệu quá lớn, chia nhỏ file rồi nhập từng phần." };
  const db = dbHr();
  const { data: gh } = await db.from("kd_gian_hang").select("id, ten, nen_tang").eq("id", gianHangId).maybeSingle();
  if (!gh) return { loi: "Chọn gian hàng của file đối soát." };
  const r = docBangDoiSoat(text);
  if (r.thieuCot.length) return { loi: r.thieuCot[0] === "file trống" ? "Chưa có dữ liệu để đối soát." : `Thiếu cột bắt buộc: ${r.thieuCot.join(", ")}. Dòng đầu phải là tiêu đề cột.`, thieuCot: r.thieuCot };
  if (r.dong.length + r.loi.length > TOI_DA) return { loi: `Tối đa ${TOI_DA} dòng mỗi lần, hãy chia nhỏ file.` };

  const daCo = new Set((await docTatCa<{ ma_don: string }>("kd_doi_soat_dong", "ma_don", (x) => x.eq("gian_hang_id", gianHangId))).map((d) => d.ma_don));
  const can = r.dong.filter((d) => !daCo.has(d.maDon));
  const donTheoMa = new Map<string, { id: string; gia_tri: number; trang_thai: string }>();
  const maCan = can.map((d) => d.maDon);
  for (let i = 0; i < maCan.length; i += 200) {
    const { data } = await db.from("kd_don_le").select("id, ma_don, gia_tri, trang_thai").eq("kenh", gh.nen_tang as string).in("ma_don", maCan.slice(i, i + 200));
    for (const x of data ?? []) donTheoMa.set(x.ma_don as string, { id: x.id as string, gia_tri: Number(x.gia_tri), trang_thai: x.trang_thai as string });
  }
  const phanLoai = can.map((d) => {
    const don = donTheoMa.get(d.maDon);
    return { d, don, ...phanLoaiDoiSoat(d, don ? { giaTri: don.gia_tri, trangThai: don.trang_thai } : undefined) };
  });
  const tomTat = tomTatDoiSoat(phanLoai.map((p) => ({ ...p.d, ketQua: p.ketQua })));
  const tong = { moi: can.length, daDoiSoat: r.dong.length - can.length, tomTat, loiDong: r.loi, canhBao: r.canhBao.slice(0, 50) };
  if (chiKiem) return { ...tong, chiKiem: true };
  if (!can.length) return { ...tong };

  const { data: phien, error: e1 } = await db.from("kd_doi_soat_phien").insert({ gian_hang_id: gianHangId, tu_ngay: tuNgay, den_ngay: denNgay }).select("id").single();
  if (e1 || !phien) return { loi: "Chưa tạo được phiên đối soát, không có dòng nào được ghi. Thử lại sau." };
  const dong = phanLoai.map(({ d, don, ketQua, giaTriDon, canhBao }) => ({
    phien_id: phien.id, gian_hang_id: gianHangId, ma_don: d.maDon, ngay_nhan_tien: d.ngayNhanTien, khach_tra: d.khachTra,
    phi_hoa_hong: d.phiHoaHong, phi_giao_dich: d.phiGiaoDich, phi_van_chuyen: d.phiVanChuyen, phi_dich_vu: d.phiDichVu, phi_affiliate: d.phiAffiliate,
    thue: d.thue, phi_khac: d.phiKhac, hoan_tien: d.hoanTien, thuc_nhan: d.thucNhan, don_le_id: don?.id ?? null, gia_tri_don: giaTriDon,
    ket_qua: ketQua satisfies KetQuaDoiSoat, ghi_chu: canhBao,
  }));
  for (let i = 0; i < dong.length; i += 500) {
    const { error } = await db.from("kd_doi_soat_dong").insert(dong.slice(i, i + 500));
    if (error) {
      await db.from("kd_doi_soat_phien").delete().eq("id", phien.id); // xoá phiên + dòng đã ghi (cascade) để nhập lại sạch
      return { loi: "Gặp lỗi khi ghi các dòng, đã huỷ cả phiên này, chưa có gì được lưu. Bấm Kiểm trước rồi nhập lại." };
    }
  }
  await ghiLichSuNhanSu({
    nhanVienId: null, doiTuong: "Đối soát tiền sàn theo đơn", doiTuongId: phien.id as string, hanhDong: "Thêm",
    moTa: `Đối soát ${gh.ten as string} ${tuNgay} đến ${denNgay}: ${can.length} đơn (khớp ${tomTat.theoKetQua["Khớp"]}, lệch giá trị ${tomTat.theoKetQua["Lệch giá trị"]}, lệch trạng thái ${tomTat.theoKetQua["Lệch trạng thái"]}, thiếu trong Omyn ${tomTat.theoKetQua["Thiếu trong Omyn"]}), bỏ qua ${tong.daDoiSoat} đơn đã đối soát và ${r.loi.length} dòng lỗi`,
    truoc: null, sau: { phien_id: phien.id, don: can.length }, nguoi: { id: q.nd.id, hoTen: q.nd.hoTen },
  });
  revalidatePath("/kinh-doanh/doi-soat-don");
  return { ...tong, phienId: phien.id as string };
}

/** Ghi nguyên nhân lệch, đánh dấu đã xử lý và ghi chú cho một dòng đối soát. */
export async function capNhatDongDoiSoat(id: string, nguyenNhan: string, daXuLy: boolean, ghiChu: string): Promise<{ loi?: string; ok?: true }> {
  const q = await kiemQuyenNhap();
  if ("loi" in q) return { loi: q.loi };
  if (nguyenNhan && !NGUYEN_NHAN_LECH.includes(nguyenNhan)) return { loi: "Nguyên nhân không hợp lệ." };
  if (ghiChu.length > 500) return { loi: "Ghi chú tối đa 500 chữ." };
  const db = dbHr();
  const { data: truoc } = await db.from("kd_doi_soat_dong").select("ma_don, nguyen_nhan, da_xu_ly, ghi_chu").eq("id", id).maybeSingle();
  if (!truoc) return { loi: "Không tìm thấy dòng đối soát." };
  const sau = { nguyen_nhan: nguyenNhan || null, da_xu_ly: daXuLy, ghi_chu: ghiChu.trim() || null };
  const { error } = await db.from("kd_doi_soat_dong").update(sau).eq("id", id);
  if (error) return { loi: "Chưa lưu được, thử lại sau." };
  await ghiLichSuNhanSu({
    nhanVienId: null, doiTuong: "Đối soát tiền sàn theo đơn", doiTuongId: id, hanhDong: "Sửa",
    moTa: `Cập nhật đơn ${truoc.ma_don as string}: ${daXuLy ? "đã xử lý" : "chưa xử lý"}${nguyenNhan ? `, nguyên nhân: ${nguyenNhan}` : ""}`,
    truoc, sau, nguoi: { id: q.nd.id, hoTen: q.nd.hoTen },
  });
  revalidatePath("/kinh-doanh/doi-soat-don");
  return { ok: true };
}
