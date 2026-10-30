export const dynamic = "force-dynamic";

import Link from "next/link";
import {
  MucTieuCuaToi,
  type ChiSoCaNhan,
  type ViecBsc,
} from "@/components/bsc/MucTieuCuaToi";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { diemChiSo, trangThaiViec, type CachGop } from "@/lib/bsc";
import { docNamThang } from "@/lib/bsc-data";
import { layNguoiDungDaDuyet } from "@/lib/auth";
import { dbHr } from "@/lib/hr-db";
import { homNayHcm } from "@/lib/kpi-data";
import { quyenMucTieuCaNhan } from "@/lib/bsc-quyen";
import { ChonNguoiBsc } from "@/components/bsc/ChonNguoiBsc";

/** Mục tiêu BSC cá nhân + việc cần làm. Nhân viên xem của mình; trưởng phòng chọn cấp dưới; Quản trị/Kỹ thuật chọn bất kỳ ai. */
export default async function TrangMucTieuCuaToi({
  searchParams,
}: {
  searchParams: Promise<{ nam?: string; thang?: string; nv?: string }>;
}) {
  const nd = await layNguoiDungDaDuyet();
  const sp = await searchParams;
  const { nam, thang } = docNamThang(sp.nam, sp.thang);
  const db = dbHr();
  const { data: toi } = await db
    .from("nhan_vien")
    .select("id, ho_ten")
    .eq("user_id", nd.id)
    .maybeSingle();
  const quanTri = nd.vaiTro === "admin" || nd.vaiTro === "ky_thuat";
  const { data: ds } = quanTri
    ? await db
        .from("nhan_vien")
        .select("id, ho_ten")
        .neq("trang_thai", "Đã nghỉ")
        .order("ho_ten")
        .limit(2000)
    : toi
      ? await db
          .from("nhan_vien")
          .select("id, ho_ten")
          .eq("quan_ly_id", toi.id)
          .neq("trang_thai", "Đã nghỉ")
          .order("ho_ten")
      : { data: [] };
  const chon = [
    ...(toi && !quanTri
      ? [{ id: toi.id as string, ho_ten: `${toi.ho_ten} (tôi)` }]
      : []),
    ...(ds ?? []).map((x) => ({
      id: x.id as string,
      ho_ten: x.ho_ten as string,
    })),
  ];
  const nvId = (
    sp.nv && (await quyenMucTieuCaNhan(sp.nv)) ? sp.nv : toi?.id
  ) as string | undefined;
  if (!nvId)
    return (
      <>
        <TieuDeTrang tieuDe="Mục tiêu của tôi" />
        <p className="rounded-nho border border-vien bg-giay-sang p-5 text-[14px] text-muc-2">
          Tài khoản của bạn chưa gắn với hồ sơ nhân sự nên chưa có mục tiêu. Nhờ
          HCNS gắn hồ sơ.
        </p>
      </>
    );
  const q = (await quyenMucTieuCaNhan(nvId))!;
  const { data: gan } = await db
    .from("bsc_chi_so_nguoi")
    .select("chi_so_id, bsc_chi_so!inner(id, ten, don_vi, cach_gop, nam)")
    .eq("nhan_vien_id", nvId)
    .eq("bsc_chi_so.nam", nam)
    .limit(500);
  const ids = (gan ?? []).map((g) => g.chi_so_id as string);
  const [nt, khoa, hd] = await Promise.all([
    ids.length
      ? db
          .from("bsc_nguoi_thang")
          .select("chi_so_id, thang, loai, gia_tri")
          .eq("nhan_vien_id", nvId)
          .in("chi_so_id", ids)
          .limit(10000)
      : { data: [] },
    db
      .from("bsc_khoa_thang")
      .select("id")
      .eq("nam", nam)
      .eq("thang", thang)
      .maybeSingle(),
    db
      .from("bsc_ke_hoach_hanh_dong")
      .select(
        "id, ten, chi_so_id, ket_thuc, bat_dau, tien_do, uu_tien, bsc_chi_so(ten)",
      )
      .eq("nguoi_thuc_hien_id", nvId)
      .order("ket_thuc")
      .limit(200),
  ]);
  const chiSo: ChiSoCaNhan[] = (gan ?? []).map((g) => {
    const c = (
      Array.isArray(g.bsc_chi_so) ? g.bsc_chi_so[0] : g.bsc_chi_so
    ) as { id: string; ten: string; don_vi: string | null; cach_gop: string };
    const dong = (nt.data ?? []).filter((x) => x.chi_so_id === c.id);
    const thangs = Array.from({ length: 12 }, (_, i) => i + 1)
      .map((t) => ({
        thang: t,
        keHoach:
          dong.find((x) => x.thang === t && x.loai === "Kế hoạch")?.gia_tri ??
          null,
        thucTe:
          dong.find((x) => x.thang === t && x.loai === "Thực tế")?.gia_tri ??
          null,
      }))
      .map((x) => ({
        ...x,
        keHoach: x.keHoach === null ? null : Number(x.keHoach),
        thucTe: x.thucTe === null ? null : Number(x.thucTe),
      }));
    const mo = (loai: string) =>
      dong.find((x) => x.thang === thang && x.loai === loai)?.gia_tri;
    return {
      id: c.id,
      ten: c.ten,
      donVi: c.don_vi ?? "",
      diem: diemChiSo(thangs, thang, c.cach_gop as CachGop),
      ke: mo("Kế hoạch")?.toString() ?? "",
      thuc: mo("Thực tế")?.toString() ?? "",
    };
  });
  const homNay = homNayHcm();
  const viec: ViecBsc[] = (hd.data ?? []).map((v) => ({
    id: v.id,
    ten: v.ten,
    chiSo:
      (
        (Array.isArray(v.bsc_chi_so) ? v.bsc_chi_so[0] : v.bsc_chi_so) as {
          ten?: string;
        } | null
      )?.ten ?? "",
    han: v.ket_thuc,
    tienDo: v.tien_do,
    uuTien: v.uu_tien,
    trangThai: trangThaiViec(
      { tienDo: v.tien_do, batDau: v.bat_dau, ketThuc: v.ket_thuc },
      homNay,
    ),
  }));
  const ten = chon.find((x) => x.id === nvId)?.ho_ten ?? toi?.ho_ten ?? "";
  const lk = (t: number) =>
    `/bsc/cua-toi?nam=${nam}&thang=${t}${nvId !== toi?.id ? `&nv=${nvId}` : ""}`;
  return (
    <>
      <TieuDeTrang tieuDe="Mục tiêu của tôi" phu={`${ten} · năm ${nam}`} />
      {chon.length > 1 && (
        <div className="mb-4 max-w-sm">
          <ChonNguoiBsc
            nvId={nvId}
            nam={nam}
            thang={thang}
            ds={chon.map((x) => ({ id: x.id, ten: x.ho_ten }))}
          />
        </div>
      )}
      <nav aria-label="Chọn tháng" className="mb-5 flex flex-wrap gap-2">
        {Array.from({ length: 12 }, (_, i) => i + 1).map((t) => (
          <Link
            key={t}
            href={lk(t)}
            aria-current={t === thang ? "page" : undefined}
            className={`rounded-tag px-2.5 py-1.5 text-[13px] font-medium ${t === thang ? "nut-vang" : "border border-vien-dam text-muc-2 hover:bg-giay-tram"}`}
          >
            T{t}
          </Link>
        ))}
      </nav>
      <MucTieuCuaToi
        key={`${nvId}-${nam}-${thang}`}
        nv={nvId}
        nam={nam}
        thang={thang}
        chiSo={chiSo}
        viec={viec}
        suaKeHoach={q.quanLy}
        khoa={!!khoa.data}
      />
    </>
  );
}
