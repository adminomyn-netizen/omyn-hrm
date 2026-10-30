export const dynamic = "force-dynamic";

import { yeuCauVaiTro } from "@/lib/auth";
import { dbHr } from "@/lib/hr-db";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { MANG } from "@/lib/quyen-mang";
import { FormQuyen } from "./FormQuyen";

const MAU: Record<string, number> = { marketing: 5, "kinh-doanh": 1, "san-pham": 3, "phap-ly": 9, "tai-chinh-kho": 7, "chien-luoc": 2 };
const MO_TA: Record<string, string> = {
  marketing: "Lịch nội dung, duyệt nội dung quảng cáo, KOL/KOC, ngân sách quảng cáo.",
  "kinh-doanh": "Gian hàng sàn, đối soát, đại lý và khách sỉ, công nợ đại lý, livestream, khiếu nại, chỉ tiêu doanh số.",
  "san-pham": "Danh mục sản phẩm, bảng giá, kiểm lô nhập, phát triển sản phẩm mới, duyệt bao bì.",
  "phap-ly": "Hồ sơ sản phẩm, sổ công bố, sổ hợp đồng, nhãn hiệu, đồng ý dữ liệu khách.",
  "tai-chinh-kho": "Nhập xuất kho, tồn kho, đóng gói giao hàng, chứng từ xuất nhập khẩu, công nợ nhà cung cấp, kế hoạch tài chính.",
  "chien-luoc": "Nghiên cứu thị trường, khảo sát khách.",
};

/** Phân quyền màn nghiệp vụ: khối nào được xem hay nhập từng mảng. Quản trị/Kỹ thuật luôn đủ quyền; Hành chính nhân sự và Ban điều hành đã là Quản trị theo chức vụ. */
export default async function TrangPhanQuyen() {
  await yeuCauVaiTro(["admin", "ky_thuat"]);
  const db = dbHr();
  const [{ data: khoi }, { data: q }] = await Promise.all([
    db.from("khoi").select("id, ten, mo_ta").order("ten"),
    db.from("quyen_man_nghiep_vu").select("mang, khoi_id, quyen"),
  ]);
  const quyen = Object.fromEntries(((q ?? []) as { mang: string; khoi_id: string; quyen: string }[]).map((r) => [`${r.mang}:${r.khoi_id}`, r.quyen]));
  return (
    <>
      <TieuDeTrang
        tieuDe="Phân quyền màn nghiệp vụ"
        phu="Chọn khối nào được xem hoặc nhập từng mảng. Thực tập sinh luôn chỉ xem; chỉ Trưởng bộ phận trở lên được xoá bản ghi. Mỗi lần đổi đều ghi vào lịch sử."
      />
      <FormQuyen
        mang={MANG.map((m) => ({ ...m, mau: MAU[m.ma] ?? 9, moTa: MO_TA[m.ma] ?? "" }))}
        khoi={((khoi ?? []) as { id: string; ten: string; mo_ta: string | null }[]).map((k) => ({ id: k.id, ten: k.ten, viTri: k.mo_ta ?? "" }))}
        quyen={quyen}
      />
    </>
  );
}
