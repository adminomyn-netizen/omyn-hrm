export const dynamic = "force-dynamic";

import { yeuCauVaiTro } from "@/lib/auth";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { dbHr } from "@/lib/hr-db";
import { soNgayNghi } from "@/lib/don-tu";
import { GHI_CHU_QUY_PHEP, namLamViecDen, phepNamDuoc } from "@/lib/quy-phep";

/** Quỹ phép năm của từng người: được hưởng (12 ngày + thâm niên), đã dùng + đang chờ duyệt, còn lại. Chỉ Quản trị/Kỹ thuật. */
export default async function TrangQuyPhep({ searchParams }: { searchParams: Promise<{ nam?: string }> }) {
  await yeuCauVaiTro(["admin", "ky_thuat"]);
  const sp = await searchParams;
  const namNay = Number(new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" }).slice(0, 4));
  const nam = /^20\d{2}$/.test(sp.nam ?? "") ? Number(sp.nam) : namNay;
  const db = dbHr();
  const [nv, don] = await Promise.all([
    db.from("nhan_vien").select("id, ho_ten, chuc_danh, ngay_vao_lam, khoi(ten)").neq("trang_thai", "Đã nghỉ").order("ho_ten"),
    db.from("don_tu").select("nhan_vien_id, tu_ngay, den_ngay, gio_tu, gio_den, trang_thai").eq("loai", "Nghỉ phép năm").in("trang_thai", ["Chờ duyệt", "Đã duyệt"]).gte("tu_ngay", `${nam}-01-01`).lte("tu_ngay", `${nam}-12-31`),
  ]);
  const dung = new Map<string, { da: number; cho: number }>();
  for (const d of (don.data ?? []) as { nhan_vien_id: string; tu_ngay: string; den_ngay: string; gio_tu: string | null; gio_den: string | null; trang_thai: string }[]) {
    const c = dung.get(d.nhan_vien_id) ?? { da: 0, cho: 0 };
    const n = soNgayNghi(d.tu_ngay, d.den_ngay, d.gio_tu, d.gio_den);
    if (d.trang_thai === "Đã duyệt") c.da += n; else c.cho += n;
    dung.set(d.nhan_vien_id, c);
  }
  const dong = ((nv.data ?? []) as unknown as { id: string; ho_ten: string; chuc_danh: string | null; ngay_vao_lam: string | null; khoi: { ten: string } | null }[]).map((n) => {
    const duoc = phepNamDuoc(n.ngay_vao_lam, nam), c = dung.get(n.id) ?? { da: 0, cho: 0 };
    return { ...n, duoc, da: c.da, cho: c.cho, con: duoc - c.da - c.cho, namLam: namLamViecDen(n.ngay_vao_lam, nam) };
  });
  return (
    <>
      <TieuDeTrang tieuDe="Quỹ phép năm" phu={`Năm ${nam}. ${GHI_CHU_QUY_PHEP}`}>
        <a href={`/quy-phep?nam=${nam - 1}`} className="text-[13px] font-medium text-nhan-dam underline-offset-4 hover:underline">Năm {nam - 1}</a>
        {nam < namNay && <a href={`/quy-phep?nam=${nam + 1}`} className="text-[13px] font-medium text-nhan-dam underline-offset-4 hover:underline">Năm {nam + 1}</a>}
      </TieuDeTrang>
      <div className="the-noi the-noi-thap overflow-x-auto">
        <table className="w-full min-w-[640px] text-[14px]">
          <thead><tr className="text-left text-[12px] font-medium text-muc-3"><th className="px-4 py-3">Nhân sự</th><th className="px-4 py-3">Phòng ban</th><th className="px-4 py-3 text-right">Được hưởng</th><th className="px-4 py-3 text-right">Đã nghỉ</th><th className="px-4 py-3 text-right">Chờ duyệt</th><th className="px-4 py-3 text-right">Còn lại</th></tr></thead>
          <tbody>
            {dong.map((d) => (
              <tr key={d.id} className="border-t border-vien">
                <td className="px-4 py-2.5"><span className="text-muc">{d.ho_ten}</span><span className="block text-[12px] text-muc-3">{d.chuc_danh ?? "—"}{d.namLam >= 5 ? ` · ${d.namLam} năm` : ""}</span></td>
                <td className="px-4 py-2.5 text-muc-2">{d.khoi?.ten ?? "—"}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{d.duoc}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{d.da}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{d.cho}</td>
                <td className="px-4 py-2.5 text-right"><NhanTrangThai kieu={d.con < 0 ? "loi" : d.con <= 2 ? "cho" : "tot"}>{d.con} ngày</NhanTrangThai></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
