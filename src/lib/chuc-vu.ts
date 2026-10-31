/** Chức vụ chọn sẵn trong biểu mẫu nhân viên, từ cao xuống thấp. Lưu vào cột `chuc_danh`. */
export const CHUC_VU = [
  "Giám đốc",
  "Phó giám đốc",
  "Trưởng bộ phận",
  "Leader",
  "Chuyên viên",
  "Nhân viên",
  "Thực tập sinh",
] as const;

/** Tách chuỗi vị trí của khối ("A, B; C") thành danh sách, bỏ trống và trùng. */
export function tachViTri(moTa: string | null | undefined): string[] {
  return hopViTri((moTa ?? "").split(/[,;\n]/));
}
/** Gộp nhiều danh sách vị trí, bỏ trống và trùng (không phân biệt hoa thường). */
export function hopViTri(...ds: (string | null | undefined)[][]): string[] {
  const thay = new Set<string>();
  const ra: string[] = [];
  for (const d of ds) for (const v of d) {
    const t = (v ?? "").trim();
    if (t && !thay.has(t.toLowerCase())) { thay.add(t.toLowerCase()); ra.push(t); }
  }
  return ra;
}
