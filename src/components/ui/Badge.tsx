import { NhanTrangThai } from "./NhanTrangThai";

const ANH_XA = { xanh: "tot", vang: "cho", do: "loi", xam: "tram" } as const;

/** Giữ tên cũ cho các nơi còn dùng; thực chất là NhanTrangThai (nền nhạt cùng sắc, bo 4 px). */
export function Badge({ children, mau = "xam" }: { children: React.ReactNode; mau?: keyof typeof ANH_XA }) {
  return <NhanTrangThai kieu={ANH_XA[mau]}>{children}</NhanTrangThai>;
}
