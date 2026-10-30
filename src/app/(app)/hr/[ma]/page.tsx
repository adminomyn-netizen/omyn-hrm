export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { DanhSachHr } from "@/components/hr/DanhSachHr";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { yeuCauVaiTro } from "@/lib/auth";
import { timMucHr } from "@/lib/hr-module";
import { dbHr } from "@/lib/hr-db";

/** Trang chung cho các mục vận hành HCNS khai trong hr-module.ts (Quản trị/Kỹ thuật). */
export default async function TrangMucHr({ params }: { params: Promise<{ ma: string }> }) {
  const { ma } = await params;
  const muc = timMucHr(ma);
  if (!muc) notFound();
  await yeuCauVaiTro(["admin", "ky_thuat"]);
  const db = dbHr();
  const [dong, nv, khoi] = await Promise.all([
    db.from(muc.bang).select("*").order(muc.sapXep.cot, { ascending: !muc.sapXep.giam }).limit(500),
    db.from("nhan_vien").select("id, ho_ten, ma_nhan_vien").neq("trang_thai", "Đã nghỉ").order("ho_ten"),
    db.from("khoi").select("id, ten").order("ten"),
  ]);
  return (
    <>
      <TieuDeTrang tieuDe={muc.ten} phu={<><Link href="/hr" className="text-nhan-dam hover:underline">← Vận hành HCNS</Link><span className="mx-2 text-vien-dam">·</span>{muc.moTa}</>} />
      <DanhSachHr muc={muc} dong={(dong.data ?? []) as never} nv={(nv.data ?? []).map((x) => ({ id: x.id, ten: x.ma_nhan_vien ? `${x.ho_ten} (${x.ma_nhan_vien})` : x.ho_ten }))} khoi={(khoi.data ?? []).map((x) => ({ id: x.id, ten: x.ten }))} />
    </>
  );
}
