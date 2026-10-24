import "server-only";
import ExcelJS from "exceljs";
import { NextResponse } from "next/server";

const XANH_DAM = "FF00453D";
const XANH_NHAT = "FFD6F2E8";
const VIEN = { style: "thin" as const, color: { argb: "FFD7E3E1" } };

/** Dựng tệp Excel (.xlsx) từ một hàm điền sheet; trả về Response tải về. Không cache vì có dữ liệu cá nhân. */
export async function traXlsx(tenTep: string, tenSheet: string, dien: (ws: ExcelJS.Worksheet) => void) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "OMYN HRM";
  wb.created = new Date();
  const ws = wb.addWorksheet(tenSheet.replace(/[*?:\\/\[\]]/g, "-").slice(0, 31), { views: [{ state: "frozen", xSplit: 0, ySplit: 1 }] });
  dien(ws);
  const buf = await wb.xlsx.writeBuffer();
  return new NextResponse(buf as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${tenTep}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

/** Định dạng dòng tiêu đề: nền lục đậm, chữ trắng, đậm, căn giữa. */
export function dinhDangTieuDe(ws: ExcelJS.Worksheet, dong = 1) {
  const r = ws.getRow(dong);
  r.height = 34;
  r.eachCell((c) => {
    c.font = { bold: true, color: { argb: "FFFFFFFF" }, name: "Calibri", size: 11 };
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: XANH_DAM } };
    c.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    c.border = { top: VIEN, left: VIEN, bottom: VIEN, right: VIEN };
  });
}

/** Kẻ viền mảnh cho các dòng dữ liệu; dòng cuối (nếu `tong`) tô nhạt, in đậm. */
export function dinhDangDuLieu(ws: ExcelJS.Worksheet, tuDong: number, denDong: number, tong = false) {
  for (let i = tuDong; i <= denDong; i++) {
    ws.getRow(i).eachCell({ includeEmpty: true }, (c) => {
      c.border = { top: VIEN, left: VIEN, bottom: VIEN, right: VIEN };
      c.font = { name: "Calibri", size: 11, bold: tong && i === denDong };
      if (tong && i === denDong) c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: XANH_NHAT } };
    });
  }
}
