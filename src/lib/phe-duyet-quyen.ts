import "server-only";
import { redirect } from "next/navigation";
import { layNguoiDungHienTai } from "@/lib/auth";

/** Mọi tài khoản đã được duyệt (nhân viên, Quản trị, Kỹ thuật) dùng được bộ phê duyệt; tài khoản chờ duyệt thì không. */
export async function yeuCauDangNhapDaDuyet() {
  const nd = await layNguoiDungHienTai();
  if (!nd) redirect("/dang-nhap");
  if (nd.vaiTro === "cho_duyet") redirect("/cho-duyet");
  return nd;
}
