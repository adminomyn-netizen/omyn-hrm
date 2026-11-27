export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { DanhSachHr } from "@/components/hr/DanhSachHr";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { yeuCauQuyenSo } from "@/lib/quyen-nghiep-vu";
import { coTepDinhKem, timMucHr } from "@/lib/hr-module";
import { dbHr, docTatCa, laGiamDocTaiKhoan } from "@/lib/hr-db";
import { quyenTep } from "@/lib/tep-dinh-kem-data";

/** Link "← …" đầu trang theo nhóm của mục (mục có quayVe riêng thì dùng cái đó). */
const GOC_NHOM: Record<string, { href: string; nhan: string }> = {
  "Tuyển dụng": { href: "/hr", nhan: "Sổ tuyển dụng" },
  "Kinh doanh": { href: "/hr/gian-hang-san", nhan: "Gian hàng sàn" },
  "Sản phẩm & Giá": { href: "/hr/san-pham", nhan: "Danh mục sản phẩm" },
  "Pháp lý & Hồ sơ": { href: "/hr/ho-so-san-pham", nhan: "Hồ sơ theo sản phẩm" },
  "Tài chính & Kho": { href: "/ton-kho", nhan: "Tồn kho" },
  "Chiến lược": { href: "/hr/nghien-cuu-thi-truong", nhan: "Nghiên cứu thị trường" },
};

/** Trang chung cho các mục vận hành HCNS khai trong hr-module.ts (Quản trị/Kỹ thuật). */
export default async function TrangMucHr({
  params,
}: {
  params: Promise<{ ma: string }>;
}) {
  const { ma } = await params;
  const muc = timMucHr(ma);
  if (!muc) notFound();
  const { nd, chiXem: chiXemTheoKhoi, xoa } = await yeuCauQuyenSo(muc.nhom);
  const goc = muc.quayVe ?? (ma === "pd-danh-muc" ? { href: "/phe-duyet/lua-chon", nhan: "Lựa chọn trong phiếu" } : GOC_NHOM[muc.nhom]) ?? { href: "/trang-chu-nhan-su", nhan: "Trang chủ Nhân sự" };
  const chiXem = chiXemTheoKhoi || (!!muc.chiGiamDocSua && !(await laGiamDocTaiKhoan(nd.id)));
  const db = dbHr();
  const [dong, nv, khoi] = await Promise.all([
    db
      .from(muc.bang)
      .select("*")
      .order(muc.sapXep.cot, { ascending: !muc.sapXep.giam })
      .limit(500),
    db
      .from("nhan_vien")
      .select("id, ho_ten, ma_nhan_vien")
      .neq("trang_thai", "Đã nghỉ")
      .order("ho_ten"),
    db.from("khoi").select("id, ten").order("ten"),
  ]);
  const bangTc = [
    ...new Set(
      muc.cot.flatMap((c) => (c.kieu === "tc" && c.bangTc ? [c.bangTc] : [])),
    ),
  ];
  const tc: Record<string, { id: string; ten: string }[]> = {};
  await Promise.all(
    bangTc.map(async (b) => {
      // Bảng không có cột "ten" thì lấy cột gọi tên của nó làm nhãn, mới nhất lên đầu (đơn lẻ gọi bằng mã đơn, phiên live bằng chủ đề).
      const cotTen = b === "kd_don_le" ? "ma_don" : b === "kd_phien_live" ? "chu_de" : "ten";
      const moiNhatTruoc = cotTen !== "ten";
      tc[b] = ((await db.from(b).select(cotTen === "ten" ? "id, ten" : `id, ten:${cotTen}`).order(moiNhatTruoc ? "ngay" : "ten", { ascending: !moiNhatTruoc }).limit(1000))
        .data ?? []) as unknown as { id: string; ten: string }[];
    }),
  );
  const coTep = coTepDinhKem(muc) && !!(await quyenTep(nd, muc.ma)).muc;
  const soTep: Record<string, number> = {};
  if (coTep) for (const t of await docTatCa<{ dong_id: string }>("tep_dinh_kem", "id, dong_id", (q) => q.eq("man", muc.ma))) soTep[t.dong_id] = (soTep[t.dong_id] ?? 0) + 1;
  return (
    <>
      <TieuDeTrang
        tieuDe={muc.ten}
        phu={
          <>
            <Link href={goc.href} className="text-nhan-dam hover:underline">
              ← {goc.nhan}
            </Link>
            <span className="mx-2 text-vien-dam">·</span>
            {muc.moTa}
          </>
        }
      />
      <DanhSachHr
        muc={muc}
        dong={(dong.data ?? []) as never}
        nv={(nv.data ?? []).map((x) => ({
          id: x.id,
          ten: x.ma_nhan_vien ? `${x.ho_ten} (${x.ma_nhan_vien})` : x.ho_ten,
        }))}
        khoi={(khoi.data ?? []).map((x) => ({ id: x.id, ten: x.ten }))}
        tc={tc}
        chiXem={chiXem}
        khongXoa={!xoa}
        coTep={coTep}
        soTep={soTep}
      />
    </>
  );
}
