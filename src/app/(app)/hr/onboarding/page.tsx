export const dynamic = "force-dynamic";

import Link from "next/link";
import {
  OnboardingDanhSach,
  type OnbThe,
} from "@/components/hr/OnboardingDanhSach";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { yeuCauVaiTro } from "@/lib/auth";
import { dbHr } from "@/lib/hr-db";
import { homNayVN, ngayThuViec } from "@/lib/onboarding";

/** Người mới đang onboarding / thử việc: tiến độ lộ trình 60 ngày, hồ sơ, đánh giá mentor 30/60 ngày. */
export default async function TrangOnboarding() {
  await yeuCauVaiTro(["admin", "ky_thuat"]);
  const db = dbHr();
  const [onb, nvu, dg, nv, khoi] = await Promise.all([
    db
      .from("theo_doi_onboarding")
      .select("*")
      .order("ngay_bat_dau", { ascending: false })
      .limit(300),
    db.from("onb_nhiem_vu").select("onb_id, xong").limit(10000),
    db.from("danh_gia_thu_viec").select("onb_id, moc, ket_qua").limit(2000),
    db
      .from("nhan_vien")
      .select("id, ho_ten, ma_nhan_vien")
      .neq("trang_thai", "Đã nghỉ")
      .order("ho_ten"),
    db.from("khoi").select("id, ten").order("ten"),
  ]);
  const tenNv = new Map(
    (nv.data ?? []).map((x) => [x.id as string, x.ho_ten as string]),
  );
  const hn = homNayVN();
  const the: OnbThe[] = (onb.data ?? []).map((o) => {
    const v = (nvu.data ?? []).filter((x) => x.onb_id === o.id);
    const g = (moc: string) =>
      (dg.data ?? []).filter((x) => x.onb_id === o.id && x.moc === moc).at(-1)
        ?.ket_qua ?? null;
    return {
      id: o.id,
      hoTen: o.ho_ten,
      viTri: o.vi_tri,
      batDau: o.ngay_bat_dau,
      soNgay: o.so_ngay_thu_viec,
      ngayThu: ngayThuViec(o.ngay_bat_dau, hn),
      tinhTrang: o.tinh_trang,
      hoSo: o.trang_thai_ho_so,
      xong: v.filter((x) => x.xong).length,
      tong: v.length,
      dg30: g("30 ngày"),
      dg60: g("60 ngày"),
      mentor: o.mentor_id ? (tenNv.get(o.mentor_id) ?? null) : null,
    };
  });
  return (
    <>
      <TieuDeTrang
        tieuDe="Onboarding & thử việc"
        phu={
          <>
            <Link href="/hr" className="text-nhan-dam hover:underline">
              ← Vận hành HCNS
            </Link>
            <span className="mx-2 text-vien-dam">·</span>Từ ngày nhận offer tới
            hết 60 ngày thử việc
          </>
        }
      />
      <OnboardingDanhSach
        the={the}
        nv={(nv.data ?? []).map((x) => ({
          id: x.id,
          ten: x.ma_nhan_vien ? `${x.ho_ten} (${x.ma_nhan_vien})` : x.ho_ten,
        }))}
        khoi={(khoi.data ?? []).map((x) => ({ id: x.id, ten: x.ten }))}
      />
    </>
  );
}
