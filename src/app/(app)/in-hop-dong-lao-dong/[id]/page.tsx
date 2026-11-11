export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { NutIn } from "@/components/luong/NutIn";
import { yeuCauVaiTro } from "@/lib/auth";
import { dbHr } from "@/lib/hr-db";
import { ngayVN, tienVN } from "@/lib/dinh-dang";
import { thoiHanHopDong, tieuDeHopDong } from "@/lib/hop-dong-in";

type Hd = {
  id: string; nhan_vien_id: string | null; ten_nguoi_ky: string | null; loai: string; so_hop_dong: string | null; tu_ngay: string; den_ngay: string | null;
  chuc_danh: string | null; cong_viec: string | null; dia_diem_lam_viec: string | null; muc_luong: number | null; hinh_thuc_tra_luong: string | null; thoi_han_tra_luong: string | null;
  phu_cap: string | null; thoi_gio_lam_viec: string | null; dieu_khoan_khac: string | null; nguoi_dai_dien: string | null; chuc_danh_dai_dien: string | null; pham_vi: string | null;
};
type HoSo = { gioi_tinh: string | null; ngay_sinh: string | null; cccd: string | null; ngay_cap_cccd: string | null; noi_cap_cccd: string | null; dia_chi_thuong_tru: string | null; dia_chi_hien_tai: string | null; dien_thoai: string | null };

const CHO = "……………………";

const Dong = ({ nhan, v }: { nhan: string; v: string }) => (
  <p className="mt-1"><span className="text-muc-2">{nhan}: </span><span className="font-medium">{v}</span></p>
);
const Dieu = ({ so, tieu, children }: { so: number; tieu: string; children: React.ReactNode }) => (
  <section className="mt-5">
    <h2 className="text-[15px] font-semibold">Điều {so}. {tieu}</h2>
    <div className="mt-1 text-muc-2">{children}</div>
  </section>
);

/** Bản in hợp đồng lao động dựng từ dòng sổ hợp đồng + hồ sơ cá nhân. Chỉ dùng dữ liệu đã nhập, thiếu thì chừa chỗ điền tay. Là bản nháp cần rà pháp lý trước khi ký. */
export default async function TrangInHopDong({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await yeuCauVaiTro(["admin", "ky_thuat"]);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const db = dbHr();
  const { data } = await db.from("hop_dong_lao_dong").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const h = data as Hd;
  const [nvRes, hsRes] = await Promise.all([
    h.nhan_vien_id ? db.from("nhan_vien").select("ho_ten, chuc_danh").eq("id", h.nhan_vien_id).maybeSingle() : Promise.resolve({ data: null }),
    h.nhan_vien_id ? db.from("ho_so_ca_nhan").select("gioi_tinh, ngay_sinh, cccd, ngay_cap_cccd, noi_cap_cccd, dia_chi_thuong_tru, dia_chi_hien_tai, dien_thoai").eq("nhan_vien_id", h.nhan_vien_id).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const nv = nvRes.data as { ho_ten: string; chuc_danh: string | null } | null;
  const hs = (hsRes.data ?? {}) as Partial<HoSo>;
  const ten = nv?.ho_ten || h.ten_nguoi_ky || "";
  const chucDanh = h.chuc_danh || nv?.chuc_danh || "";
  const c = (v: string | null | undefined) => v || CHO;
  return (
    <div className="mx-auto max-w-[780px]">
      <div className="khong-in mb-4 flex flex-wrap items-center justify-between gap-2">
        <Link href="/hr/hop-dong-lao-dong" className="text-[14px] text-nhan-dam hover:underline">← Sổ hợp đồng lao động</Link>
        <NutIn />
      </div>
      <p className="khong-in mb-4 rounded-nho bg-canh-bao-nen px-3 py-2.5 text-[13px] text-canh-bao">
        Bản nháp dựng từ dữ liệu đã nhập; chỗ còn dấu chấm là chưa có dữ liệu, điền tay hoặc bổ sung ở sổ hợp đồng và hồ sơ cá nhân. Nội dung điều khoản cần người am hiểu pháp lý và có thẩm quyền của công ty rà soát trước khi ký.
      </p>
      <article className="the-noi p-8 text-[15px] leading-relaxed text-muc">
        <div className="text-center">
          <div className="text-[13px] font-medium uppercase tracking-[0.12em] text-muc-2">Cộng hòa xã hội chủ nghĩa Việt Nam</div>
          <div className="text-[13px] text-muc-2">Độc lập - Tự do - Hạnh phúc</div>
          <h1 className="chu-tieu-de mt-5 text-[22px] font-semibold">{tieuDeHopDong(h.loai)}</h1>
          <p className="mt-1 text-muc-2">Số: {c(h.so_hop_dong)}</p>
        </div>
        <p className="mt-5 text-muc-2">Căn cứ Bộ luật Lao động và các quy định pháp luật hiện hành, hai bên gồm:</p>

        <section className="mt-4">
          <h2 className="text-[15px] font-semibold">Bên A: Người sử dụng lao động</h2>
          <Dong nhan="Công ty" v={"Công ty Cổ phần OMYN Cosmetics"} />
          <Dong nhan="Địa chỉ" v={CHO} />
          <Dong nhan="Đại diện" v={`${c(h.nguoi_dai_dien)}${h.chuc_danh_dai_dien ? `, ${h.chuc_danh_dai_dien}` : `, chức danh ${CHO}`}`} />
        </section>
        <section className="mt-4">
          <h2 className="text-[15px] font-semibold">Bên B: Người lao động</h2>
          <Dong nhan="Họ và tên" v={c(ten)} />
          <Dong nhan="Giới tính" v={c(hs.gioi_tinh)} />
          <Dong nhan="Ngày sinh" v={hs.ngay_sinh ? ngayVN(hs.ngay_sinh) : CHO} />
          <Dong nhan="Căn cước công dân" v={`${c(hs.cccd)}, cấp ngày ${hs.ngay_cap_cccd ? ngayVN(hs.ngay_cap_cccd) : CHO}, nơi cấp ${c(hs.noi_cap_cccd)}`} />
          <Dong nhan="Nơi cư trú" v={c(hs.dia_chi_thuong_tru || hs.dia_chi_hien_tai)} />
          <Dong nhan="Điện thoại" v={c(hs.dien_thoai)} />
        </section>
        <p className="mt-4 text-muc-2">Hai bên thỏa thuận ký hợp đồng và cam kết thực hiện đúng các điều khoản sau:</p>

        <Dieu so={1} tieu="Thời hạn và công việc">
          <p>Loại hợp đồng: {h.loai}.</p>
          <p>Thời hạn: {thoiHanHopDong(h.loai, h.tu_ngay, h.den_ngay)}</p>
          <p>Chức danh: {c(chucDanh)}.</p>
          <p className="whitespace-pre-line">Công việc phải làm: {c(h.cong_viec || h.pham_vi)}</p>
          <p>Địa điểm làm việc: {c(h.dia_diem_lam_viec)}.</p>
        </Dieu>
        <Dieu so={2} tieu="Tiền lương, phụ cấp">
          <p>Mức lương: {h.muc_luong != null ? `${tienVN(Number(h.muc_luong))}/tháng` : `${CHO} đồng/tháng`}.</p>
          <p>Hình thức trả lương: {c(h.hinh_thuc_tra_luong)}. Thời hạn trả lương: {c(h.thoi_han_tra_luong)}.</p>
          <p className="whitespace-pre-line">Phụ cấp và các khoản bổ sung khác: {c(h.phu_cap)}</p>
        </Dieu>
        <Dieu so={3} tieu="Thời giờ làm việc, thời giờ nghỉ ngơi">
          <p className="whitespace-pre-line">{c(h.thoi_gio_lam_viec)}</p>
        </Dieu>
        <Dieu so={4} tieu="Bảo hiểm xã hội, bảo hiểm y tế, bảo hiểm thất nghiệp">
          <p>Thực hiện theo quy định của pháp luật hiện hành.</p>
        </Dieu>
        <Dieu so={5} tieu="Quyền và nghĩa vụ của hai bên">
          <p>Hai bên thực hiện quyền và nghĩa vụ theo Bộ luật Lao động, nội quy lao động và quy chế của công ty.</p>
        </Dieu>
        {h.dieu_khoan_khac && (
          <Dieu so={6} tieu="Điều khoản khác">
            <p className="whitespace-pre-line">{h.dieu_khoan_khac}</p>
          </Dieu>
        )}
        <Dieu so={h.dieu_khoan_khac ? 7 : 6} tieu="Điều khoản thi hành">
          <p>Hợp đồng lập thành hai bản có giá trị như nhau, mỗi bên giữ một bản, có hiệu lực từ ngày {h.tu_ngay ? ngayVN(h.tu_ngay) : CHO}.</p>
        </Dieu>

        <div className="mt-8 grid grid-cols-2 gap-6 text-center">
          <div>
            <div className="font-medium">Người lao động</div>
            <div className="mt-1 text-[13px] text-muc-3">(Ký, ghi rõ họ tên)</div>
            <div className="mt-14">{ten || CHO}</div>
          </div>
          <div>
            <div className="font-medium">Đại diện công ty</div>
            <div className="mt-1 text-[13px] text-muc-3">(Ký, ghi rõ họ tên, đóng dấu)</div>
            <div className="mt-14">{c(h.nguoi_dai_dien)}</div>
          </div>
        </div>
      </article>
    </div>
  );
}
