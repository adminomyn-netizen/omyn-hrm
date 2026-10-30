import "server-only";
import { dbHr } from "@/lib/hr-db";
import { GIO_COI_LA_DI_MUON } from "@/lib/don-tu";
import { lenKeHoachDo } from "@/lib/phe-duyet-ap-dung";
import { GIOI_HAN_MAC_DINH, tachTangCa, viPhamGioiHan, type GioDaCo } from "@/lib/tang-ca";
import { ghiLichSuNhanSu, type NguoiSua } from "@/lib/nhan-su-lich-su";
import { moHoSoNghiViec, tickBanGiaoTuPhieu } from "@/lib/nghi-viec-data";
import type { DuLieu } from "@/lib/phe-duyet";

async function docNgayLe(): Promise<Set<string>> {
  const { data } = await dbHr().from("ngay_le").select("ngay");
  return new Set(((data ?? []) as { ngay: string }[]).map((r) => r.ngay));
}

/** Trước khi nộp phiếu làm thêm giờ: giờ mới cộng giờ đã có trong tháng/năm có vượt giới hạn không (giới hạn ở tham số lương, chờ xác nhận). */
export async function kiemTangCaTruocNop(nhanVienId: string, du: DuLieu): Promise<string | null> {
  const doan = tachTangCa(String(du.tu ?? ""), String(du.den ?? ""), await docNgayLe());
  if (doan.length === 0) return "Thời gian làm thêm không hợp lệ.";
  const db = dbHr();
  const nam = doan[0].ngay.slice(0, 4);
  const [{ data: ts }, { data: tc }] = await Promise.all([
    db.from("tham_so_luong").select("khoa, gia_tri").in("khoa", ["ot_gioi_han_thang", "ot_gioi_han_nam", "ot_gioi_han_ngay_tong"]),
    db.from("tang_ca").select("ngay, so_gio").eq("nhan_vien_id", nhanVienId).gte("ngay", `${nam}-01-01`).lte("ngay", `${nam}-12-31`),
  ]);
  const p = new Map(((ts ?? []) as { khoa: string; gia_tri: string }[]).map((r) => [r.khoa, Number(r.gia_tri)]));
  const co: GioDaCo = { thang: {}, nam: 0, theoNgay: {} };
  const thang: Record<string, number> = {}, theoNgay: Record<string, number> = {};
  let tongNam = 0;
  for (const r of (tc ?? []) as { ngay: string; so_gio: number | string }[]) {
    const g = Number(r.so_gio);
    thang[r.ngay.slice(0, 7)] = (thang[r.ngay.slice(0, 7)] ?? 0) + g;
    theoNgay[r.ngay] = (theoNgay[r.ngay] ?? 0) + g;
    tongNam += g;
  }
  const loi = viPhamGioiHan(doan, { ...co, thang, nam: tongNam, theoNgay }, {
    thang: p.get("ot_gioi_han_thang") ?? GIOI_HAN_MAC_DINH.thang, nam: p.get("ot_gioi_han_nam") ?? GIOI_HAN_MAC_DINH.nam, ngayTong: p.get("ot_gioi_han_ngay_tong") ?? GIOI_HAN_MAC_DINH.ngayTong,
  });
  return loi.length ? `${loi.join(" ")} (Giới hạn theo Bộ luật Lao động 2019, chờ kế toán/luật sư xác nhận.)` : null;
}

/** Đổ một phiếu vừa duyệt xong vào hồ sơ. Chỉ chạy một lần mỗi phiếu (sổ pd_ap_dung); không bao giờ làm hỏng việc duyệt. */
export async function apDungPhieuDaDuyet(phieuId: string, nguoi: NguoiSua): Promise<void> {
  const db = dbHr();
  try {
    const { data: daCo } = await db.from("pd_ap_dung").select("phieu_id").eq("phieu_id", phieuId).maybeSingle();
    if (daCo) return;
    const { data } = await db.from("pd_phieu").select("id, so_phieu, ma_phieu, nguoi_nop_id, du_lieu").eq("id", phieuId).maybeSingle();
    const p = data as { id: string; so_phieu: string; ma_phieu: string; nguoi_nop_id: string | null; du_lieu: DuLieu } | null;
    if (!p) return;
    const viec = lenKeHoachDo(p.ma_phieu, p.du_lieu, await docNgayLe());
    if (viec.length === 0) return;
    const nv = p.nguoi_nop_id;
    const ghi: string[] = [];
    const ls = (doiTuong: string, moTa: string, sau: unknown) => ghiLichSuNhanSu({ nhanVienId: nv, doiTuong, doiTuongId: p.id, hanhDong: "Sửa", moTa: `${moTa} (từ phiếu ${p.so_phieu})`, sau, nguoi: nguoi });
    for (const v of viec) {
      if (!nv) { ghi.push("phiếu không gắn nhân sự nên chưa đổ được"); break; }
      if (v.kieu === "tang_ca") {
        const { error } = await db.from("tang_ca").insert(v.doan.map((d) => ({ nhan_vien_id: nv, ngay: d.ngay, so_gio: d.soGio, loai_ngay: d.loaiNgay, ly_do: v.lyDo || null, phieu_id: p.id })));
        ghi.push(error ? "chưa ghi được giờ tăng ca" : `ghi ${v.doan.reduce((t, d) => t + d.soGio, 0)} giờ tăng ca`);
        if (!error) await ls("Tăng ca", `Thêm ${v.doan.length} đoạn tăng ca`, v.doan);
      } else if (v.kieu === "cham_cong") {
        const { data: cu } = await db.from("cham_cong").select("id, gio_vao, gio_ra").eq("nhan_vien_id", nv).eq("ngay", v.ngay).maybeSingle();
        const gio = `${v.gio}:00`;
        const dong: Record<string, string> = { [v.cot]: gio };
        if (v.cot === "gio_vao") dong.trang_thai = gio > GIO_COI_LA_DI_MUON ? "Đi muộn" : "Đúng giờ";
        const { error } = cu ? await db.from("cham_cong").update(dong).eq("id", (cu as { id: string }).id) : await db.from("cham_cong").insert({ nhan_vien_id: nv, ngay: v.ngay, ...dong });
        ghi.push(error ? "chưa sửa được chấm công" : `sửa ${v.cot === "gio_vao" ? "giờ vào" : "giờ ra"} ngày ${v.ngay} thành ${v.gio}`);
        if (!error) await ls("Chấm công", `Sửa ${v.cot === "gio_vao" ? "giờ vào" : "giờ ra"} ngày ${v.ngay}`, { truoc: cu, sau: dong });
      } else if (v.kieu === "luong") {
        const { data: cu } = await db.from("luong_thoa_thuan").select("luong_thoa_thuan").eq("nhan_vien_id", nv).maybeSingle();
        if (!cu) { ghi.push("chưa có thỏa thuận lương nên chưa đổ lương mới (cần tạo thỏa thuận trước)"); continue; }
        const { error } = await db.from("luong_thoa_thuan").update({ luong_thoa_thuan: v.luongMoi, cap_nhat_luc: new Date().toISOString() }).eq("nhan_vien_id", nv);
        ghi.push(error ? "chưa đổi được lương" : "đổi lương thỏa thuận theo phiếu");
        if (!error) await ls("Lương thỏa thuận", "Điều chỉnh lương", { truoc: cu, sau: { luong_thoa_thuan: v.luongMoi } });
      } else if (v.kieu === "nghi_viec") {
        const r = await moHoSoNghiViec({ nhanVienId: nv, phieuId: p.id, loai: v.loai, ngayNop: v.ngayNop, ngayCuoi: v.ngayCuoi, lyDo: v.lyDo }, nguoi);
        ghi.push(r.id ? "mở hồ sơ nghỉ việc kèm checklist bàn giao" : (r.loi ?? "chưa mở được hồ sơ nghỉ việc"));
      } else if (v.kieu === "ban_giao") {
        ghi.push(await tickBanGiaoTuPhieu(nv, v.nhom, p.so_phieu, nguoi));
      } else {
        const dong: Record<string, string | null> = {};
        if (v.chucVu) dong.chuc_danh = v.chucVu;
        if (v.phongBan) {
          const { data: k } = await db.from("khoi").select("id").eq("ten", v.phongBan).maybeSingle();
          if (k) dong.khoi_id = (k as { id: string }).id; else ghi.push(`không có phòng ban “${v.phongBan}” trong danh sách Khối nên chưa đổi phòng ban`);
        }
        if (Object.keys(dong).length === 0) continue;
        const { data: cu } = await db.from("nhan_vien").select("chuc_danh, khoi_id").eq("id", nv).maybeSingle();
        const { error } = await db.from("nhan_vien").update(dong).eq("id", nv);
        ghi.push(error ? "chưa đổi được chức danh/phòng ban" : `cập nhật ${[dong.chuc_danh && `chức danh → ${dong.chuc_danh}`, dong.khoi_id && `phòng ban → ${v.phongBan}`].filter(Boolean).join(", ")}`);
        if (!error) await ls("Hồ sơ nhân sự", "Luân chuyển/thăng chức", { truoc: cu, sau: dong });
      }
    }
    const ketQua = ghi.join("; ") || "không có gì cần đổ";
    await db.from("pd_ap_dung").insert({ phieu_id: p.id, ket_qua: ketQua.slice(0, 500) });
    await db.from("pd_lich_su").insert({ phieu_id: p.id, user_id: nguoi.id, ten_nguoi: "Hệ thống", hanh_dong: "Ghi chú", ghi_chu: `Đã tự đổ vào hồ sơ: ${ketQua}`.slice(0, 500) });
  } catch (e) {
    console.error("[pd] đổ phiếu vào hồ sơ lỗi", e);
  }
}
