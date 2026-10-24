"use server";

import { revalidatePath } from "next/cache";
import ExcelJS from "exceljs";
import { Readable } from "node:stream";
import { layNguoiDungHienTai } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { chuanHoa, COT_NHAN_VIEN, kiemTraDongNhap, type DongNhap, type LoiDong } from "@/lib/nhap-nhan-vien";

export type KetQuaNhap = { loi?: string; ok?: boolean; tongDong?: number; hopLe?: number; loiDong?: LoiDong[]; daNhap?: number };
const TOI_DA_BYTE = 1_000_000;
const TOI_DA_DONG = 500;

/** Giá trị chữ/số/ngày của một ô Excel (bỏ định dạng, công thức lấy kết quả). */
function giaTriO(v: ExcelJS.CellValue): unknown {
  if (v == null) return "";
  if (v instanceof Date || typeof v === "number") return v;
  if (typeof v === "object") {
    if ("richText" in v) return v.richText.map((r) => r.text).join("");
    if ("result" in v) return (v.result as unknown) ?? "";
    if ("text" in v) return String(v.text);
    return "";
  }
  return String(v);
}

/** Đọc tệp .xlsx hoặc .csv thành các dòng theo tên cột (cột lạ bị bỏ qua). */
async function docTep(file: File): Promise<{ dong?: DongNhap[]; loi?: string }> {
  if (file.size === 0) return { loi: "Tệp trống." };
  if (file.size > TOI_DA_BYTE) return { loi: "Tệp quá lớn (tối đa 1 MB). Tách thành nhiều tệp nhỏ hơn." };
  const ten = file.name.toLowerCase();
  const buf = Buffer.from(await file.arrayBuffer());
  const wb = new ExcelJS.Workbook();
  try {
    if (ten.endsWith(".csv")) await wb.csv.read(Readable.from(buf));
    else if (ten.endsWith(".xlsx")) await wb.xlsx.load(buf as unknown as ArrayBuffer);
    else return { loi: "Chỉ nhận tệp .xlsx hoặc .csv. Bấm Tải mẫu để lấy tệp đúng dạng." };
  } catch {
    return { loi: "Không đọc được tệp. Hãy dùng tệp mẫu (.xlsx) hoặc lưu lại dưới dạng .xlsx." };
  }
  const ws = wb.worksheets[0];
  if (!ws) return { loi: "Tệp không có trang tính nào." };
  const cot = new Map<number, keyof DongNhap>();
  ws.getRow(1).eachCell((c, i) => {
    const k = COT_NHAN_VIEN[chuanHoa(giaTriO(c.value))];
    if (k) cot.set(i, k);
  });
  const thieu = (["hoTen", "khoiTen", "ngayVaoLam"] as const).filter((k) => ![...cot.values()].includes(k));
  if (thieu.length) return { loi: `Dòng 1 phải là tiêu đề cột và có đủ: Họ và tên, Khối, Ngày vào làm. Thiếu: ${thieu.map((k) => ({ hoTen: "Họ và tên", khoiTen: "Khối", ngayVaoLam: "Ngày vào làm" })[k]).join(", ")}.` };
  const dong: DongNhap[] = [];
  for (let r = 2; r <= ws.rowCount; r++) {
    const d: DongNhap = { maNhanVien: "", hoTen: "", chucDanh: "", khoiTen: "", email: "", ngayVaoLam: "", trangThai: "" };
    let coGiaTri = false;
    for (const [i, k] of cot) {
      const v = giaTriO(ws.getRow(r).getCell(i).value);
      if (String(v).trim() !== "") coGiaTri = true;
      (d as Record<string, unknown>)[k] = k === "ngayVaoLam" ? v : String(v).trim();
    }
    if (coGiaTri) dong.push(d);
  }
  if (dong.length === 0) return { loi: "Tệp chưa có dòng nhân viên nào (từ dòng 2 trở đi)." };
  if (dong.length > TOI_DA_DONG) return { loi: `Tối đa ${TOI_DA_DONG} dòng mỗi lần nhập; tệp có ${dong.length} dòng.` };
  return { dong };
}

/** Nhập nhân viên từ Excel. `che_do` = "xem": chỉ kiểm tra, không ghi. `nhap`: ghi MỘT LẦN tất cả dòng, và chỉ khi không dòng nào lỗi (tránh nhập dở dang). */
export async function nhapNhanVienTuTep(fd: FormData): Promise<KetQuaNhap> {
  const nd = await layNguoiDungHienTai();
  if (!nd || (nd.vaiTro !== "admin" && nd.vaiTro !== "ky_thuat")) return { loi: "Bạn không có quyền thực hiện thao tác này." };
  const file = fd.get("tep");
  if (!(file instanceof File)) return { loi: "Chọn một tệp Excel trước." };
  const doc = await docTep(file);
  if (!doc.dong) return { loi: doc.loi };

  const db = createAdminClient();
  const [khoi, co] = await Promise.all([db.from("khoi").select("id, ten"), db.from("nhan_vien").select("ma_nhan_vien, email")]);
  if (khoi.error || co.error) return { loi: "Chưa đọc được dữ liệu hiện có. Thử lại sau." };
  const daCo = {
    ma: new Set((co.data ?? []).map((x) => x.ma_nhan_vien?.toLowerCase()).filter((x): x is string => !!x)),
    email: new Set((co.data ?? []).map((x) => x.email?.toLowerCase()).filter((x): x is string => !!x)),
  };
  const { hopLe, loi } = kiemTraDongNhap(doc.dong, khoi.data ?? [], daCo, nd.vaiTro === "ky_thuat");
  const kq: KetQuaNhap = { tongDong: doc.dong.length, hopLe: hopLe.length, loiDong: loi.slice(0, 40) };
  if (String(fd.get("che_do")) !== "nhap") return { ...kq, ok: true };
  if (loi.length > 0) return { ...kq, loi: "Còn dòng lỗi nên chưa nhập gì cả. Sửa tệp rồi kiểm tra lại." };

  const { error } = await db.from("nhan_vien").insert(hopLe);
  if (error) return { ...kq, loi: error.message.includes("duplicate") ? "Mã nhân viên hoặc email bị trùng với dữ liệu vừa có. Kiểm tra lại." : "Chưa nhập được. Thử lại sau." };
  revalidatePath("/nhan-su");
  revalidatePath("/dashboard");
  return { ...kq, ok: true, daNhap: hopLe.length };
}
