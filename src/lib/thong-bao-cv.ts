import "server-only";
import { dbHr } from "@/lib/hr-db";
import { guiChoNguoiDung } from "@/lib/push";

type Tin = Parameters<typeof guiChoNguoiDung>[1];

/** Thông báo công việc: GHI VÀO CHUÔNG TRONG APP (bảng thong_bao_app, luôn thấy khi mở app) rồi mới đẩy ra điện thoại.
 *  Thông báo đẩy chỉ tới máy đã cài app và cho phép thông báo, nên chuông trong app là đường chắc chắn. Không ném lỗi: thông báo hỏng không được làm hỏng nghiệp vụ. */
export async function guiThongBaoCongViec(userIds: string[], tin: Tin): Promise<void> {
  const ids = [...new Set(userIds.filter(Boolean))];
  if (ids.length === 0) return;
  try {
    await dbHr().from("thong_bao_app").insert(ids.map((user_id) => ({ user_id, tieu_de: tin.tieuDe, noi_dung: tin.noiDung, url: tin.url })));
  } catch (e) {
    console.error("[thong_bao_app] lỗi", (e as Error).message);
  }
  await guiChoNguoiDung(ids, tin);
}
