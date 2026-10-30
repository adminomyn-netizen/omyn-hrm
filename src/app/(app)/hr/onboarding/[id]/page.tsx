export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { OnboardingChiTiet } from "@/components/hr/OnboardingChiTiet";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { yeuCauVaiTro } from "@/lib/auth";
import { dbHr } from "@/lib/hr-db";
import { homNayVN, ngayThuViec } from "@/lib/onboarding";

export default async function TrangOnboardingChiTiet({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await yeuCauVaiTro(["admin", "ky_thuat"]);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const db = dbHr();
  const { data: o } = await db.from("theo_doi_onboarding").select("*").eq("id", id).maybeSingle();
  if (!o) notFound();
  const [nvu, dg, nv] = await Promise.all([
    db.from("onb_nhiem_vu").select("*").eq("onb_id", id).order("thu_tu"),
    db.from("danh_gia_thu_viec").select("*").eq("onb_id", id).order("tao_luc", { ascending: false }),
    db.from("nhan_vien").select("id, ho_ten, ma_nhan_vien").neq("trang_thai", "Đã nghỉ").order("ho_ten"),
  ]);
  return (
    <>
      <TieuDeTrang tieuDe={o.ho_ten} phu={<Link href="/hr/onboarding" className="text-nhan-dam hover:underline">← Onboarding & thử việc</Link>} />
      <OnboardingChiTiet
        onb={{ id: o.id, hoTen: o.ho_ten, viTri: o.vi_tri, email: o.email, dienThoai: o.dien_thoai, batDau: o.ngay_bat_dau, soNgay: o.so_ngay_thu_viec, ngayThu: ngayThuViec(o.ngay_bat_dau, homNayVN()), tinhTrang: o.tinh_trang, hoSo: o.trang_thai_ho_so, conThieu: o.thong_tin_con_thieu, tkLark: o.tk_lark_da_tao, gioiThieu: o.da_gioi_thieu_cong_ty, mentorId: o.mentor_id, quanLyId: o.quan_ly_id, ghiChu: o.ghi_chu }}
        nhiemVu={(nvu.data ?? []).map((n) => ({ id: n.id, giaiDoan: n.giai_doan, noiDung: n.noi_dung, han: n.han, xong: n.xong }))}
        danhGia={(dg.data ?? []).map((d) => ({ id: d.id, moc: d.moc, ai: d.nguoi_danh_gia, diem: d.diem, ketQua: d.ket_qua, manh: d.diem_manh, caiThien: d.can_cai_thien, ngay: d.ngay }))}
        nv={(nv.data ?? []).map((x) => ({ id: x.id, ten: x.ma_nhan_vien ? `${x.ho_ten} (${x.ma_nhan_vien})` : x.ho_ten }))}
      />
    </>
  );
}
