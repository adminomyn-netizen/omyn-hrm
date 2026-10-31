/** Gom dòng của một sổ thành cụm 2 tầng (vd đối tác → lô hàng) cho màn danh sách. Hàm thuần, không chạm DB. */
export type Cum<T> = { ten: string; so: number; sapHet: number; dong: T[]; con: Cum<T>[] };

export const NHAN_CHUA_PHAN = "Chưa phân nhóm";

/** `sapHet(d)` cho biết dòng sắp hết hạn. Trong mỗi cụm dòng sắp hết hạn xếp trước (giữ nguyên thứ tự gốc trong từng phần); cụm nào có nhiều dòng sắp hết hạn hơn xếp trước, sau đó theo tên; "Chưa phân nhóm" luôn cuối. */
export function nhomDong<T extends Record<string, unknown>>(dong: readonly T[], khoa: readonly string[], sapHet: (d: T) => boolean): Cum<T>[] {
  const gom = (ds: readonly T[], tang: number): Cum<T>[] => {
    if (tang >= khoa.length) return [];
    const m = new Map<string, T[]>();
    for (const d of ds) {
      const v = String(d[khoa[tang]] ?? "").trim() || NHAN_CHUA_PHAN;
      m.set(v, [...(m.get(v) ?? []), d]);
    }
    return [...m]
      .map(([ten, g]) => {
        const sap = g.filter(sapHet);
        const uuTien = [...sap, ...g.filter((d) => !sapHet(d))];
        return { ten, so: g.length, sapHet: sap.length, dong: tang === khoa.length - 1 ? uuTien : [], con: gom(uuTien, tang + 1) };
      })
      .sort((a, b) => Number(a.ten === NHAN_CHUA_PHAN) - Number(b.ten === NHAN_CHUA_PHAN) || b.sapHet - a.sapHet || a.ten.localeCompare(b.ten, "vi"));
  };
  return gom(dong, 0);
}
