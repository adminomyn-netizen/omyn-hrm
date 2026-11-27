export const dynamic = "force-dynamic";

import { Fragment } from "react";
import Link from "next/link";
import { yeuCauQuyenSo } from "@/lib/quyen-nghiep-vu";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { Badge } from "@/components/ui/Badge";
import { DoiSoatDon } from "@/components/kinh-doanh/DoiSoatDon";
import { DongDoiSoatSua } from "@/components/kinh-doanh/DongDoiSoatSua";
import { docTatCa } from "@/lib/hr-db";
import { ngayVN, tienVN } from "@/lib/dinh-dang";
import { KET_QUA_DOI_SOAT, tomTatDoiSoat, tongPhi, type KetQuaDoiSoat } from "@/lib/doi-soat-don";

type Phien = { id: string; gian_hang_id: string; tu_ngay: string; den_ngay: string; tao_luc: string };
type Dong = {
  id: string; phien_id: string; ma_don: string; ngay_nhan_tien: string | null; khach_tra: number | null; phi_hoa_hong: number; phi_giao_dich: number; phi_van_chuyen: number;
  phi_dich_vu: number; phi_affiliate: number; thue: number; phi_khac: number; hoan_tien: number; thuc_nhan: number; gia_tri_don: number | null; ket_qua: KetQuaDoiSoat;
  nguyen_nhan: string | null; da_xu_ly: boolean; ghi_chu: string | null;
};
const MAU: Record<KetQuaDoiSoat, "xanh" | "vang" | "do"> = { "Khớp": "xanh", "Lệch giá trị": "vang", "Lệch trạng thái": "vang", "Thiếu trong Omyn": "do" };
const TOI_DA_HIEN = 200;

/** Đối soát tiền sàn theo từng đơn: nhập bảng quyết toán của sàn, so với Sổ đơn lẻ, xử lý đơn lệch. */
export default async function TrangDoiSoatDon({ searchParams }: { searchParams: Promise<{ phien?: string; kq?: string }> }) {
  const { chiXem } = await yeuCauQuyenSo("Kinh doanh");
  const { phien: phienId, kq: kqLoc } = await searchParams;
  const [gianHang, cacPhien, tatCaDong] = await Promise.all([
    docTatCa<{ id: string; ten: string; nen_tang: string }>("kd_gian_hang", "id, ten, nen_tang", (q) => q.neq("trang_thai", "Đóng")),
    docTatCa<Phien>("kd_doi_soat_phien", "id, gian_hang_id, tu_ngay, den_ngay, tao_luc"),
    docTatCa<{ phien_id: string; ket_qua: KetQuaDoiSoat; da_xu_ly: boolean }>("kd_doi_soat_dong", "id, phien_id, ket_qua, da_xu_ly"),
  ]);
  const ten = new Map(gianHang.map((g) => [g.id, g.ten]));
  const dem = new Map<string, { tong: number; canXuLy: number }>();
  for (const d of tatCaDong) {
    const c = dem.get(d.phien_id) ?? { tong: 0, canXuLy: 0 };
    c.tong++; if (d.ket_qua !== "Khớp" && !d.da_xu_ly) c.canXuLy++;
    dem.set(d.phien_id, c);
  }
  const ds = [...cacPhien].sort((a, b) => b.tao_luc.localeCompare(a.tao_luc)).slice(0, 30);
  const phien = phienId ? cacPhien.find((p) => p.id === phienId) : undefined;

  let chiTiet: React.ReactNode = null;
  if (phien) {
    const gh = gianHang.find((g) => g.id === phien.gian_hang_id);
    const dong = await docTatCa<Dong>("kd_doi_soat_dong", "id, phien_id, ma_don, ngay_nhan_tien, khach_tra, phi_hoa_hong, phi_giao_dich, phi_van_chuyen, phi_dich_vu, phi_affiliate, thue, phi_khac, hoan_tien, thuc_nhan, gia_tri_don, ket_qua, nguyen_nhan, da_xu_ly, ghi_chu", (q) => q.eq("phien_id", phien.id), ["ma_don"]);
    const t = tomTatDoiSoat(dong.map((d) => ({ khachTra: d.khach_tra, thucNhan: d.thuc_nhan, hoanTien: d.hoan_tien, phiHoaHong: d.phi_hoa_hong, phiGiaoDich: d.phi_giao_dich, phiVanChuyen: d.phi_van_chuyen, phiDichVu: d.phi_dich_vu, phiAffiliate: d.phi_affiliate, thue: d.thue, phiKhac: d.phi_khac, ketQua: d.ket_qua })));
    const loc = KET_QUA_DOI_SOAT.find((k) => k === kqLoc);
    const hien = (loc ? dong.filter((d) => d.ket_qua === loc) : dong).slice(0, TOI_DA_HIEN);
    const phi = (k: keyof Dong) => dong.reduce((a, d) => a + (d[k] as number), 0);
    // Đơn Omyn đã giao, cùng kênh, ngày đặt trong kỳ, chưa có trong đối soát của gian hàng này.
    let chuaThay: { ma_don: string; ngay: string; gia_tri: number }[] = [];
    if (gh) {
      const daDoi = new Set((await docTatCa<{ ma_don: string }>("kd_doi_soat_dong", "id, ma_don", (q) => q.eq("gian_hang_id", gh.id))).map((d) => d.ma_don));
      const don = await docTatCa<{ ma_don: string; ngay: string; gia_tri: number }>("kd_don_le", "id, ma_don, ngay, gia_tri", (q) => q.eq("kenh", gh.nen_tang).eq("trang_thai", "Đã giao").gte("ngay", phien.tu_ngay).lte("ngay", phien.den_ngay), ["ngay", "id"]);
      chuaThay = don.filter((d) => !daDoi.has(d.ma_don));
    }
    chiTiet = (
      <section className="mt-8 space-y-4" aria-label="Chi tiết phiên đối soát">
        <h2 className="chu-tieu-de text-[20px]">{ten.get(phien.gian_hang_id) ?? "Gian hàng"} · {ngayVN(phien.tu_ngay)} đến {ngayVN(phien.den_ngay)}</h2>
        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { v: String(t.soDon), n: "đơn trong phiên", m: 7 },
            { v: tienVN(t.khachTra), n: "khách trả (theo file)", m: 7 },
            { v: tienVN(t.tongPhi), n: "tổng phí sàn", m: t.tongPhi > 0 ? 3 : 1 },
            { v: tienVN(t.thucNhan), n: "thực nhận", m: 7 },
          ].map((o) => (
            <li key={o.n} data-m={o.m} className="mau-nhom the-noi mau-vach mau-nen rounded-nho p-4"><div className="chu-tieu-de mau-chu text-[22px] leading-none">{o.v}</div><div className="mt-1.5 text-[13px] text-muc-2">{o.n}</div></li>
          ))}
        </ul>
        <p className="text-[13px] text-muc-2">
          Phí: hoa hồng {tienVN(phi("phi_hoa_hong"))} · giao dịch {tienVN(phi("phi_giao_dich"))} · vận chuyển {tienVN(phi("phi_van_chuyen"))} · dịch vụ {tienVN(phi("phi_dich_vu"))} · liên kết {tienVN(phi("phi_affiliate"))} · thuế {tienVN(phi("thue"))} · khác {tienVN(phi("phi_khac"))}{t.hoanTien > 0 ? ` · tiền hoàn ${tienVN(t.hoanTien)}` : ""}.
        </p>
        <nav className="flex flex-wrap gap-2 text-[13px]" aria-label="Lọc kết quả">
          <Link href={`/kinh-doanh/doi-soat-don?phien=${phien.id}`} className={`rounded-nho border border-vien px-3 py-1.5 ${!loc ? "font-semibold text-muc" : "text-muc-2"}`}>Tất cả ({t.soDon})</Link>
          {KET_QUA_DOI_SOAT.map((k) => (
            <Link key={k} href={`/kinh-doanh/doi-soat-don?phien=${phien.id}&kq=${encodeURIComponent(k)}`} className={`rounded-nho border border-vien px-3 py-1.5 ${loc === k ? "font-semibold text-muc" : "text-muc-2"}`}>{k} ({t.theoKetQua[k]})</Link>
          ))}
        </nav>
        <div data-m="7" className="mau-nhom the-noi the-noi-thap mau-vach overflow-x-auto">
          {hien.length === 0 ? <p className="px-4 py-6 text-[14px] text-muc-3">Không có đơn nào.</p> : (
            <table className="w-full min-w-[860px] text-[14px]">
              <thead><tr className="text-left text-[12px] font-medium text-muc-3"><th className="px-4 py-3">Mã đơn</th><th className="px-4 py-3">Kết quả</th><th className="px-4 py-3 text-right">Khách trả</th><th className="px-4 py-3 text-right">Omyn ghi</th><th className="px-4 py-3 text-right">Phí sàn</th><th className="px-4 py-3 text-right">Thực nhận</th><th className="px-4 py-3">Nhận tiền</th></tr></thead>
              <tbody>
                {hien.map((d) => (
                  <Fragment key={d.id}>
                    <tr className="border-t border-vien">
                      <td className="px-4 py-3 font-medium text-muc">{d.ma_don}</td>
                      <td className="px-4 py-3"><Badge mau={MAU[d.ket_qua]}>{d.ket_qua}</Badge>{d.ket_qua !== "Khớp" && d.da_xu_ly ? <span className="ml-2 text-[12px] text-muc-3">đã xử lý</span> : null}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{d.khach_tra === null ? "—" : tienVN(d.khach_tra)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{d.gia_tri_don === null ? "—" : tienVN(d.gia_tri_don)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{tienVN(tongPhi({ phiHoaHong: d.phi_hoa_hong, phiGiaoDich: d.phi_giao_dich, phiVanChuyen: d.phi_van_chuyen, phiDichVu: d.phi_dich_vu, phiAffiliate: d.phi_affiliate, thue: d.thue, phiKhac: d.phi_khac }))}</td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums">{tienVN(d.thuc_nhan)}</td>
                      <td className="px-4 py-3 text-muc-3">{ngayVN(d.ngay_nhan_tien) || "—"}</td>
                    </tr>
                    {d.ket_qua !== "Khớp" && (
                      <tr key={`${d.id}-x`}><td colSpan={7} className="px-4 pb-3">
                        {d.ghi_chu && !d.nguyen_nhan ? <p className="mb-1.5 text-[13px] text-canh-bao">{d.ghi_chu}</p> : null}
                        <DongDoiSoatSua id={d.id} nguyenNhan={d.nguyen_nhan} daXuLy={d.da_xu_ly} ghiChu={d.ghi_chu} chiXem={chiXem} />
                      </td></tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {(loc ? t.theoKetQua[loc] : t.soDon) > TOI_DA_HIEN && <p className="text-[13px] text-muc-3">Đang hiện {TOI_DA_HIEN} đơn đầu. Chọn bộ lọc kết quả để xem nhóm cần xử lý.</p>}
        <div className="rounded-nho border border-vien px-4 py-3 text-[14px] text-muc-2">
          <p className="font-medium text-muc">Đơn Omyn đã giao, cùng kênh {gh?.nen_tang ?? ""}, ngày đặt trong kỳ, chưa thấy trong đối soát: {chuaThay.length}</p>
          {chuaThay.length > 0 ? (
            <p className="mt-1 text-[13px]">{chuaThay.slice(0, 30).map((d) => `${d.ma_don} (${tienVN(d.gia_tri)})`).join(" · ")}{chuaThay.length > 30 ? " …" : ""}. Tiền sàn có thể về sau kỳ này; đơn nào quá lâu chưa về thì hỏi sàn.</p>
          ) : <p className="mt-1 text-[13px]">Không có.</p>}
          <p className="mt-1 text-[12px] text-muc-3">Sổ đơn lẻ chỉ ghi kênh, không ghi gian hàng, nên nếu có hai gian hàng cùng kênh thì danh sách này gồm đơn của cả hai.</p>
        </div>
      </section>
    );
  }

  return (
    <>
      <TieuDeTrang tieuDe="Đối soát tiền sàn theo đơn" phu="Dán bảng quyết toán của sàn, so từng đơn với Sổ đơn lẻ: tiền khách trả, phí sàn từng loại, thực nhận. Đơn lệch ghi nguyên nhân và đánh dấu đã xử lý.">
        <Link href="/hr/doi-soat-san" className="nut-vang rounded-nho px-3.5 py-2 text-[14px] font-medium">Đối soát theo tháng</Link>
      </TieuDeTrang>
      {chiXem ? <p className="text-[14px] text-muc-3">Bạn chỉ có quyền xem mục Kinh doanh nên không nhập được.</p> : <DoiSoatDon gianHang={gianHang.map((g) => ({ id: g.id, ten: g.ten }))} />}
      <section className="mt-8" aria-label="Các phiên đối soát">
        <h2 className="chu-tieu-de mb-3 text-[18px]">Các phiên đã nhập</h2>
        <div data-m="7" className="mau-nhom the-noi the-noi-thap mau-vach overflow-x-auto">
          {ds.length === 0 ? <p className="px-4 py-6 text-[14px] text-muc-3">Chưa có phiên đối soát nào.</p> : (
            <table className="w-full min-w-[560px] text-[14px]">
              <thead><tr className="text-left text-[12px] font-medium text-muc-3"><th className="px-4 py-3">Gian hàng</th><th className="px-4 py-3">Kỳ</th><th className="px-4 py-3 text-right">Số đơn</th><th className="px-4 py-3 text-right">Cần xử lý</th><th className="px-4 py-3"></th></tr></thead>
              <tbody>
                {ds.map((p) => {
                  const c = dem.get(p.id) ?? { tong: 0, canXuLy: 0 };
                  return (
                    <tr key={p.id} className={`border-t border-vien ${p.id === phienId ? "bg-giay-tram" : ""}`}>
                      <td className="px-4 py-3 font-medium text-muc">{ten.get(p.gian_hang_id) ?? "Gian hàng"}</td>
                      <td className="px-4 py-3 text-muc-2">{ngayVN(p.tu_ngay)} đến {ngayVN(p.den_ngay)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{c.tong}</td>
                      <td className={`px-4 py-3 text-right tabular-nums ${c.canXuLy > 0 ? "text-canh-bao" : "text-muc-3"}`}>{c.canXuLy > 0 ? c.canXuLy : "—"}</td>
                      <td className="px-4 py-3 text-right"><Link href={`/kinh-doanh/doi-soat-don?phien=${p.id}`} className="text-[13px] font-medium underline-offset-4 hover:underline">Xem</Link></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>
      {chiTiet}
      <div className="mt-6 rounded-nho border border-vien px-4 py-3 text-[13px] text-muc-2">
        <p className="font-medium text-muc">Cột nhận được (tên cột tiếng Việt hoặc tiếng Anh; sàn đặt tên khác thì đổi tên cột trong Excel cho khớp rồi dán lại):</p>
        <ul className="mt-1 list-disc space-y-0.5 pl-5">
          <li>Bắt buộc: <strong>Mã đơn</strong> (Mã đơn hàng, Order ID) và <strong>Thực nhận</strong> (Tổng tiền quyết toán, Settlement Amount).</li>
          <li>Tuỳ chọn: Ngày nhận tiền, Tiền khách trả (có cột này mới so được giá trị với đơn), Phí hoa hồng, Phí giao dịch, Phí vận chuyển, Phí dịch vụ, Hoa hồng liên kết, Thuế, Phí khác, Tiền hoàn.</li>
        </ul>
        <p className="mt-2">Phí ghi âm hay dương đều được lấy là số dương. Một mã đơn nhiều dòng thì cộng gộp. Đơn đã đối soát ở gian hàng này thì bỏ qua khi nhập lại. Kết quả: Khớp, Lệch giá trị (khách trả khác số trong Sổ đơn lẻ), Lệch trạng thái (Omyn ghi Huỷ hoặc Hoàn trả nhưng sàn vẫn trả tiền), Thiếu trong Omyn (chưa có đơn trong Sổ đơn lẻ, nên nhập đơn từ file trước).</p>
      </div>
    </>
  );
}
