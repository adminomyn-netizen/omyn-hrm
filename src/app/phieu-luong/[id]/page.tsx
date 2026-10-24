export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { layNguoiDungDaDuyet } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { tienVN } from "@/lib/dinh-dang";
import { NutIn } from "@/components/luong/NutIn";

function Dong({ nhan, v, dam }: { nhan: string; v: number; dam?: boolean }) {
  return (
    <tr className={dam ? "font-semibold" : ""}>
      <td className="border-b border-vien py-2 pr-4">{nhan}</td>
      <td className="border-b border-vien py-2 text-right tabular-nums">{tienVN(Number(v))}</td>
    </tr>
  );
}

/** Phiếu lương một người, trình bày để in. Quản trị/Kỹ thuật xem được mọi phiếu; nhân viên CHỈ phiếu của mình và chỉ khi kỳ đã duyệt hoặc đã chi. */
export default async function TrangPhieuLuong({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const nd = await layNguoiDungDaDuyet();
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { data: p } = await createAdminClient()
    .from("bang_luong")
    .select("*, ky:ky_luong_id(ten_ky, thang, nam, trang_thai), nhan_vien(ho_ten, ma_nhan_vien, chuc_danh, user_id, khoi(ten))")
    .eq("id", id)
    .maybeSingle();
  if (!p || !p.ky || !p.nhan_vien) notFound();
  const quanLy = nd.vaiTro === "admin" || nd.vaiTro === "ky_thuat";
  if (!quanLy && !(nd.vaiTro === "nhan_vien" && p.nhan_vien.user_id === nd.id && ["da_duyet", "da_chi"].includes(p.ky.trang_thai))) notFound();

  const thu: [string, number][] = [
    ["Lương chức danh", p.luong_chuc_danh], ["Lương KPI", p.luong_kpi], ["Phụ cấp", p.phu_cap_thuc], ["Tiền ăn", p.tien_an], ["Tăng ca", p.tien_ot], ["Hoa hồng", p.hoa_hong], ["Thưởng khác", p.thuong_khac],
  ];
  const tru: [string, number][] = [
    ["Bảo hiểm xã hội (người lao động)", p.bh_xh], ["Bảo hiểm y tế", p.bh_yt], ["Bảo hiểm thất nghiệp", p.bh_tn], ["Thuế thu nhập cá nhân", p.thue_tncn], ["Khấu trừ khác", p.khau_tru_khac],
  ];
  return (
    <main className="mx-auto max-w-2xl bg-giay-sang px-8 py-8 text-[14px] text-muc print:max-w-none print:p-0">
      <div className="khong-in mb-6 flex items-center justify-between gap-3">
        <span className="text-[13px] text-muc-3">Bản xem trước để in</span>
        <NutIn />
      </div>
      <header className="border-b-2 border-muc pb-4 text-center">
        <div className="text-[13px] font-medium uppercase tracking-[0.14em] text-muc-2">Công ty Cổ phần OMYN Cosmetics</div>
        <h1 className="mt-1 text-[24px] font-semibold">PHIẾU LƯƠNG</h1>
        <div className="text-[15px]">{p.ky.ten_ky}</div>
      </header>
      <dl className="grid grid-cols-2 gap-x-8 gap-y-1.5 border-b border-vien py-4">
        <div><dt className="inline text-muc-3">Họ và tên: </dt><dd className="inline font-medium">{p.nhan_vien.ho_ten}</dd></div>
        <div><dt className="inline text-muc-3">Mã nhân viên: </dt><dd className="inline font-medium">{p.nhan_vien.ma_nhan_vien ?? "—"}</dd></div>
        <div><dt className="inline text-muc-3">Chức vụ: </dt><dd className="inline font-medium">{p.nhan_vien.chuc_danh ?? "—"}</dd></div>
        <div><dt className="inline text-muc-3">Bộ phận: </dt><dd className="inline font-medium">{p.nhan_vien.khoi?.ten ?? "—"}</dd></div>
        <div><dt className="inline text-muc-3">Công chuẩn: </dt><dd className="inline font-medium">{Number(p.cong_chuan)}</dd></div>
        <div><dt className="inline text-muc-3">Công hưởng lương: </dt><dd className="inline font-medium">{Number(p.cong_huong)}</dd></div>
      </dl>
      <table className="mt-4 w-full border-collapse">
        <tbody>
          <tr><td colSpan={2} className="nhan-muc pb-1 pt-2">Thu nhập</td></tr>
          {thu.filter(([, v]) => Number(v) !== 0).map(([n, v]) => <Dong key={n} nhan={n} v={v} />)}
          <Dong nhan="Tổng thu nhập" v={p.tong_thu_nhap} dam />
          <tr><td colSpan={2} className="nhan-muc pb-1 pt-5">Các khoản trừ</td></tr>
          {tru.filter(([, v]) => Number(v) !== 0).map(([n, v]) => <Dong key={n} nhan={n} v={-Number(v)} />)}
          {p.giam_tru > 0 && <tr><td colSpan={2} className="py-2 text-[12px] text-muc-3">Giảm trừ gia cảnh {tienVN(Number(p.giam_tru))}; thu nhập tính thuế {tienVN(Number(p.thu_nhap_tinh_thue))}.</td></tr>}
          <tr className="text-[17px] font-semibold">
            <td className="border-t-2 border-muc pt-3">THỰC LĨNH</td>
            <td className="border-t-2 border-muc pt-3 text-right tabular-nums">{tienVN(Number(p.thuc_linh))}</td>
          </tr>
        </tbody>
      </table>
      <div className="mt-12 grid grid-cols-2 text-center text-[13px]">
        <div><div className="font-medium">Người lao động</div><div className="text-muc-3">(Ký, ghi rõ họ tên)</div></div>
        <div><div className="font-medium">Hành chính nhân sự</div><div className="text-muc-3">(Ký, ghi rõ họ tên)</div></div>
      </div>
    </main>
  );
}
