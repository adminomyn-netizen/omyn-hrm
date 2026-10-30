export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { yeuCauVaiTro } from "@/lib/auth";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { CauHinhLuong, type DuLieuCauHinh } from "@/components/phe-duyet/CauHinhLuong";
import { dbHr } from "@/lib/hr-db";
import { MAU_PHIEU, mauTheoMa } from "@/lib/phe-duyet-mau";
import { docDanhMuc, docNhomMa, taiDanhSachNhanSu } from "@/lib/phe-duyet-data";

/** Setup luồng phiếu — chỉ Kỹ thuật: chọn loại phiếu rồi chỉnh bước duyệt, ô nhập, thông báo, nhóm mã; mọi thay đổi ghi lịch sử. */
export default async function TrangSetupLuongPhieu({ searchParams }: { searchParams: Promise<{ ma?: string }> }) {
  await yeuCauVaiTro(["ky_thuat"]);
  const sp = await searchParams;
  const ma = sp.ma ?? MAU_PHIEU[0].ma;
  const mau = mauTheoMa(ma);
  if (!mau) notFound();
  const db = dbHr();
  const [nhom, danhMuc, nhanSu, buoc, soBuocTatCa, ghide, tb, ls] = await Promise.all([
    docNhomMa(), docDanhMuc(), taiDanhSachNhanSu(),
    db.from("pd_luong_duyet").select("id, buoc, ten_buoc, kieu, loai_nguoi, chuc_danh, nhan_vien_id, dieu_kien_truong, dieu_kien_gia_tri").eq("ma_phieu", ma).order("buoc").order("tao_luc"),
    db.from("pd_luong_duyet").select("ma_phieu, buoc"),
    db.from("pd_o_cau_hinh").select("truong, bat_buoc, che_do_hien, hien_truong, hien_gia_tri").eq("ma_phieu", ma),
    db.from("pd_thong_bao_cau_hinh").select("id, su_kien, loai_nguoi, chuc_danh, nhan_vien_id, dang_bat").eq("ma_phieu", ma).order("tao_luc"),
    db.from("pd_cau_hinh_lich_su").select("id, doi_tuong, hanh_dong, mo_ta, ten_nguoi, luc").eq("ma_phieu", ma).order("luc", { ascending: false }).limit(100),
  ]);
  const soBuoc = new Map<string, Set<number>>();
  for (const r of (soBuocTatCa.data ?? []) as { ma_phieu: string; buoc: number }[]) (soBuoc.get(r.ma_phieu) ?? soBuoc.set(r.ma_phieu, new Set()).get(r.ma_phieu)!).add(r.buoc);
  const du: DuLieuCauHinh = {
    ma, ten: mau.ten, larkBuoc: mau.lark.buoc, nhomMacDinh: mau.nhomMacDinh,
    truong: mau.truong.map((t) => ({ ma: t.ma, ten: t.ten, kieu: t.kieu, batBuoc: !!t.batBuoc, hien: t.hien ?? null, luaChon: t.luaChon ? [...t.luaChon] : null, danhMuc: t.danhMuc ?? null })),
    nhom: nhom[ma]?.nhom ?? mau.nhomMacDinh, dangDung: nhom[ma]?.dung ?? true,
    buoc: (buoc.data ?? []) as DuLieuCauHinh["buoc"],
    ghide: (ghide.data ?? []) as DuLieuCauHinh["ghide"],
    tb: (tb.data ?? []) as DuLieuCauHinh["tb"],
    ls: (ls.data ?? []) as DuLieuCauHinh["ls"],
    nhanSu, danhMuc,
  };
  return (
    <>
      <TieuDeTrang tieuDe="Setup luồng phiếu" phu="Chỉnh bước duyệt, người duyệt/nhận bản sao, điều kiện hiện ô, nhóm mã và thông báo của từng loại phiếu. Mọi thay đổi đều ghi lại ai sửa, lúc nào." />
      <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
        <nav aria-label="Loại phiếu" className="the-noi the-noi-thap self-start p-2">
          <ul className="max-h-[70vh] space-y-0.5 overflow-y-auto cuon-an-thanh">
            {MAU_PHIEU.map((m) => (
              <li key={m.ma}>
                <Link href={`/ky-thuat/luong-phieu?ma=${m.ma}`} aria-current={m.ma === ma ? "page" : undefined} className={`flex items-center justify-between gap-2 rounded-nho px-3 py-2 text-[14px] ${m.ma === ma ? "bg-giay-tram font-semibold text-muc" : "text-muc-2 hover:bg-giay-tram"}`}>
                  <span className="min-w-0 truncate">{m.ten}</span>
                  <span className="shrink-0 text-[11px] text-muc-3">{nhom[m.ma]?.nhom ?? m.nhomMacDinh} · {soBuoc.get(m.ma)?.size ?? 0} bước</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <CauHinhLuong d={du} />
      </div>
    </>
  );
}
