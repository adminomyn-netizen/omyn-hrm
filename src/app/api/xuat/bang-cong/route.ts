import { NextResponse, type NextRequest } from "next/server";
import { layNguoiDungHienTai } from "@/lib/auth";
import { layBangCongThang } from "@/lib/bang-cong";
import { ngayIso } from "@/lib/cong";
import { dinhDangDuLieu, dinhDangTieuDe, traXlsx } from "@/lib/xuat-excel";

export const dynamic = "force-dynamic";

const THU = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const MA = ["X", "N", "CT", "P", "L", "O", "KP", "CĐ", "V"] as const;

/** Xuất bảng công tháng ra Excel — chỉ Quản trị và Kỹ thuật. */
export async function GET(req: NextRequest) {
  const nd = await layNguoiDungHienTai();
  if (!nd || (nd.vaiTro !== "admin" && nd.vaiTro !== "ky_thuat")) return NextResponse.json({ loi: "Không có quyền." }, { status: 403 });
  const nam = Number(req.nextUrl.searchParams.get("nam"));
  const thang = Number(req.nextUrl.searchParams.get("thang"));
  if (!Number.isInteger(nam) || nam < 2024 || nam > 2100 || !Number.isInteger(thang) || thang < 1 || thang > 12) return NextResponse.json({ loi: "Tháng không hợp lệ." }, { status: 400 });

  const { dong, soNgay } = await layBangCongThang(nam, thang);
  return traXlsx(`bang-cong-${nam}-${String(thang).padStart(2, "0")}.xlsx`, `Công ${thang}-${nam}`, (ws) => {
    const dau = ["STT", "Mã NV", "Họ và tên", "Khối"];
    for (let d = 1; d <= soNgay; d++) dau.push(`${d}\n${THU[new Date(`${ngayIso(nam, thang, d)}T00:00:00Z`).getUTCDay()]}`);
    dau.push(...MA, "Công hưởng");
    ws.addRow(dau);
    dong.forEach((d, i) => ws.addRow([i + 1, d.maNhanVien ?? "", d.hoTen, d.khoi, ...d.o.map((o) => o.ma), ...MA.map((m) => d.tong[m] || ""), d.tong.congHuong]));
    ws.getColumn(1).width = 5;
    ws.getColumn(2).width = 10;
    ws.getColumn(3).width = 26;
    ws.getColumn(4).width = 20;
    for (let c = 5; c < 5 + soNgay + MA.length; c++) ws.getColumn(c).width = 5;
    ws.getColumn(5 + soNgay + MA.length).width = 12;
    ws.views = [{ state: "frozen", xSplit: 4, ySplit: 1 }];
    dinhDangTieuDe(ws);
    dinhDangDuLieu(ws, 2, dong.length + 1);
    ws.eachRow((r, i) => i > 1 && r.eachCell((c, col) => (c.alignment = { horizontal: col <= 4 && col !== 1 ? "left" : "center", vertical: "middle" })));
  });
}
