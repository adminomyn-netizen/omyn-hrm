export const dynamic = "force-dynamic";

import Link from "next/link";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { yeuCauVaiTro } from "@/lib/auth";
import { layTongHop } from "@/lib/data-tong-hop";
import { ngayVN } from "@/lib/dinh-dang";

/** Tổng hợp vận hành theo cụm + việc gấp hôm nay cho Quản trị/Kỹ thuật. */
export default async function TrangTongHop() {
  const nd = await yeuCauVaiTro(["admin", "ky_thuat"]);
  const { viec, cum, homNay } = await layTongHop(nd.vaiTro === "ky_thuat");
  return (
    <>
      <TieuDeTrang tieuDe="Tổng hợp" phu={`Hôm nay ${ngayVN(homNay)}. Việc cần xử lý trước, rồi số liệu từng cụm vận hành.`} />
      <section aria-label="Việc gấp hôm nay" className="mb-10">
        <h2 className="mb-3 text-[17px] font-semibold text-muc">Việc cần xử lý hôm nay</h2>
        {viec.length === 0 ? (
          <p className="the-noi the-noi-thap px-4 py-5 text-[14px] text-muc-2">Không có việc nào đang chờ. Đơn từ, yêu cầu tuyển dụng, phỏng vấn và giấy tờ đều đã xử lý xong.</p>
        ) : (
          <ul className="the-noi the-noi-thap divide-y divide-vien overflow-hidden">
            {viec.map((v) => (
              <li key={v.ma}>
                <Link href={v.href} className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-giay-tram/60">
                  <span className="flex items-center gap-3 text-[14px] text-muc-2">
                    <span className={`flex h-8 min-w-8 items-center justify-center px-2 text-[14px] font-semibold tabular-nums ${v.muc === "gap" ? "bg-canh-bao-nen text-canh-bao" : "bg-giay-tram text-muc-2"}`} style={{ borderRadius: 8 }}>{v.so}</span>
                    {v.nhan}
                  </span>
                  <span className="text-[13px] text-nhan-dam">Xử lý</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
      <div className="grid gap-5 lg:grid-cols-3">
        {cum.map((c) => (
          <section key={c.ten} aria-label={c.ten} className="the-noi the-noi-thap p-5">
            <h2 className="chu-tieu-de text-[22px] text-muc">{c.ten}</h2>
            <p className="mb-3 text-[13px] text-muc-3">{c.moTa}</p>
            <ul className="divide-y divide-vien">
              {c.muc.map((m) => (
                <li key={m.nhan}>
                  <Link href={m.href} className="flex items-center justify-between gap-3 py-2.5 text-[14px] hover:text-nhan-dam">
                    <span className="text-muc-2">{m.nhan}</span>
                    <strong className={`tabular-nums ${m.canhBao ? "text-canh-bao" : "text-muc"}`}>{m.so}</strong>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
