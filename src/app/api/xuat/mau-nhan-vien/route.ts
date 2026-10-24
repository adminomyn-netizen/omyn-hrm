import { NextResponse } from "next/server";
import { layNguoiDungHienTai } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { CHUC_VU } from "@/lib/chuc-vu";
import { dinhDangTieuDe, traXlsx } from "@/lib/xuat-excel";

export const dynamic = "force-dynamic";

/** Tệp mẫu để nhập nhân viên hàng loạt: dòng 1 tiêu đề, một dòng ví dụ, và trang "Danh mục" liệt kê khối, chức vụ, trạng thái hợp lệ. */
export async function GET() {
  const nd = await layNguoiDungHienTai();
  if (!nd || (nd.vaiTro !== "admin" && nd.vaiTro !== "ky_thuat")) return NextResponse.json({ loi: "Không có quyền." }, { status: 403 });
  const { data: khoi } = await createAdminClient().from("khoi").select("ten").order("ten");
  return traXlsx("mau-nhap-nhan-vien.xlsx", "Nhân viên", (ws) => {
    ws.addRow(["Họ và tên", "Mã nhân viên", "Chức vụ", "Khối", "Email", "Ngày vào làm", "Trạng thái"]);
    ws.addRow(["Nguyễn Văn A", "NV101", "Nhân viên", khoi?.[0]?.ten ?? "Tên khối", "a@congty.vn", "05/10/2026", "Đang làm"]);
    [26, 14, 20, 24, 28, 16, 14].forEach((w, i) => (ws.getColumn(i + 1).width = w));
    ws.getColumn(6).numFmt = "@";
    dinhDangTieuDe(ws);
    const dm = ws.workbook.addWorksheet("Danh mục");
    dm.addRow(["Khối (cột Khối)", "Chức vụ gợi ý (cột Chức vụ)", "Trạng thái (cột Trạng thái)"]);
    const n = Math.max(khoi?.length ?? 0, CHUC_VU.length, 3);
    for (let i = 0; i < n; i++) dm.addRow([khoi?.[i]?.ten ?? "", CHUC_VU[i] ?? "", ["Đang làm", "Thử việc", "Đã nghỉ"][i] ?? ""]);
    [28, 30, 26].forEach((w, i) => (dm.getColumn(i + 1).width = w));
    dinhDangTieuDe(dm);
  });
}
