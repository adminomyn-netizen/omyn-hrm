import { NextResponse, type NextRequest } from "next/server";
import { layNguoiDungHienTai } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { layDongLuongCuaKy } from "@/lib/data";
import { dinhDangDuLieu, dinhDangTieuDe, traXlsx } from "@/lib/xuat-excel";

export const dynamic = "force-dynamic";

/** Xuất bảng lương của một kỳ ra Excel — lương là dữ liệu nhạy cảm: chỉ Quản trị và Kỹ thuật. */
export async function GET(req: NextRequest) {
  const nd = await layNguoiDungHienTai();
  if (!nd || (nd.vaiTro !== "admin" && nd.vaiTro !== "ky_thuat")) return NextResponse.json({ loi: "Không có quyền." }, { status: 403 });
  const kyId = req.nextUrl.searchParams.get("ky") ?? "";
  if (!/^[0-9a-f-]{36}$/i.test(kyId)) return NextResponse.json({ loi: "Thiếu kỳ lương." }, { status: 400 });
  const { data: ky } = await createAdminClient().from("ky_luong").select("ten_ky, thang, nam, trang_thai").eq("id", kyId).maybeSingle();
  if (!ky) return NextResponse.json({ loi: "Không tìm thấy kỳ lương." }, { status: 404 });
  const dong = await layDongLuongCuaKy(kyId);

  const COT: { t: string; w: number; f: (d: (typeof dong)[number]) => string | number }[] = [
    { t: "Họ và tên", w: 26, f: (d) => d.ho_ten },
    { t: "Chức vụ", w: 18, f: (d) => d.chuc_danh },
    { t: "Khối", w: 20, f: (d) => d.khoi_ten },
    { t: "Công chuẩn", w: 11, f: (d) => Number(d.cong_chuan) },
    { t: "Công hưởng", w: 11, f: (d) => Number(d.cong_huong) },
    { t: "Lương chức danh / thử việc", w: 18, f: (d) => Number(d.luong_chuc_danh) },
    { t: "Lương KPI", w: 14, f: (d) => Number(d.luong_kpi) },
    { t: "Phụ cấp", w: 13, f: (d) => Number(d.phu_cap_thuc) },
    { t: "Tiền ăn", w: 13, f: (d) => Number(d.tien_an) },
    { t: "Tăng ca", w: 13, f: (d) => Number(d.tien_ot) },
    { t: "Hoa hồng", w: 13, f: (d) => Number(d.hoa_hong) },
    { t: "Thưởng khác", w: 13, f: (d) => Number(d.thuong_khac) },
    { t: "Tổng thu nhập", w: 16, f: (d) => Number(d.tong_thu_nhap) },
    { t: "BHXH", w: 13, f: (d) => Number(d.bh_xh) },
    { t: "BHYT", w: 12, f: (d) => Number(d.bh_yt) },
    { t: "BHTN", w: 12, f: (d) => Number(d.bh_tn) },
    { t: "Giảm trừ gia cảnh", w: 16, f: (d) => Number(d.giam_tru) },
    { t: "Thu nhập tính thuế", w: 17, f: (d) => Number(d.thu_nhap_tinh_thue) },
    { t: "Thuế TNCN", w: 13, f: (d) => Number(d.thue_tncn) },
    { t: "Khấu trừ khác", w: 13, f: (d) => Number(d.khau_tru_khac) },
    { t: "Thực lĩnh", w: 16, f: (d) => Number(d.thuc_linh) },
    { t: "BH công ty đóng", w: 15, f: (d) => Number(d.bh_cty) },
  ];
  const ten = ky.nam && ky.thang ? `${ky.nam}-${String(ky.thang).padStart(2, "0")}` : "ky";
  return traXlsx(`bang-luong-${ten}.xlsx`, ky.ten_ky, (ws) => {
    ws.addRow(["STT", ...COT.map((c) => c.t)]);
    dong.forEach((d, i) => ws.addRow([i + 1, ...COT.map((c) => c.f(d))]));
    const cuoi = dong.length + 2;
    // dòng tổng: cộng các cột tiền (từ "Lương chức danh" trở đi), bỏ cột chữ và cột công
    ws.addRow(["", "Tổng cộng", "", "", "", "", ...COT.slice(5).map((c) => dong.reduce((t, d) => t + Number(c.f(d)), 0))]);
    ws.getColumn(1).width = 5;
    COT.forEach((c, i) => {
      const col = ws.getColumn(i + 2);
      col.width = c.w;
      if (i >= 3) col.numFmt = i <= 4 ? "0.0" : "#,##0";
    });
    dinhDangTieuDe(ws);
    dinhDangDuLieu(ws, 2, cuoi, true);
    ws.views = [{ state: "frozen", xSplit: 3, ySplit: 1 }];
  });
}
