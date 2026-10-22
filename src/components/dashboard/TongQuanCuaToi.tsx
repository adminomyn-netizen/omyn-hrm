import Link from "next/link";
import { MucTrang } from "@/components/ui/MucTrang";
import { HangChiSo } from "@/components/ui/HangChiSo";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { LoiChaoDongHo } from "@/components/dashboard/LoiChaoDongHo";
import { NUT_CHINH, NUT_PHU } from "@/components/ui/dinh-dang";
import { layTongQuanCuaToi } from "@/lib/data";
import { gioMayChu, ngayVN } from "@/lib/dinh-dang";

const kieuDon = (t: string) => (t === "Đã duyệt" ? "tot" : t === "Từ chối" ? "loi" : "cho");
const gio = (g: string | null | undefined) => (g ? g.slice(0, 5) : "--:--");

/** Tổng quan của NHÂN VIÊN: mọi con số và danh sách chỉ thuộc về chính họ. */
export async function TongQuanCuaToi({ userId, hoTen }: { userId: string; hoTen: string }) {
  const d = await layTongQuanCuaToi(userId);
  const ten = hoTen.trim().replace(/\s+/g, " ");

  if (!d) {
    return (
      <div className="space-y-8">
        <LoiChaoDongHo ten={ten} batDau={gioMayChu()} phu="Tài khoản của bạn chưa gắn với hồ sơ nhân sự nào. Báo bộ phận Nhân sự để được gắn hồ sơ." />
      </div>
    );
  }
  const daChamVao = !!d.homNay?.gio_vao;

  return (
    <div className="space-y-10">
      <LoiChaoDongHo
        ten={ten}
        batDau={gioMayChu()}
        phu={daChamVao ? <>Hôm nay bạn đã chấm công vào lúc <strong className="text-muc">{gio(d.homNay?.gio_vao)}</strong>{d.homNay?.gio_ra ? <>, ra lúc <strong className="text-muc">{gio(d.homNay.gio_ra)}</strong></> : ""}.</> : "Hôm nay bạn chưa chấm công."}
      >
        <Link href="/don-tu" className={`${NUT_PHU} inline-flex items-center`}>Nộp đơn</Link>
        <Link href="/cham-cong" className={`${NUT_CHINH} inline-flex items-center`}>{daChamVao && !d.homNay?.gio_ra ? "Chấm công ra" : "Chấm công"}</Link>
      </LoiChaoDongHo>

      <HangChiSo
        muc={[
          { nhan: `Ngày công tháng ${d.thang.thang}`, so: String(d.thang.ngayCong) },
          { nhan: "Đi muộn trong tháng", so: String(d.thang.diMuon) },
          { nhan: "Đơn đang chờ duyệt", so: String(d.donCho) },
          { nhan: "Phiếu lương mới nhất", so: d.phieuMoiNhat ? d.phieuMoiNhat.tenKy : "—" },
        ]}
      />

      <section className="grid gap-10 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-7">
          <MucTrang tieuDe="Đơn của tôi" phai={<Link href="/don-tu" className="text-[13px] font-medium text-nhan-dam underline-offset-4 hover:underline">Xem hết</Link>}>
            {d.don.length === 0 ? (
              <p className="py-8 text-[14px] text-muc-3">Bạn chưa nộp đơn nào. Nghỉ phép, đi muộn hay làm thêm giờ đều nộp ở mục Đơn từ.</p>
            ) : (
              <ul className="divide-y divide-vien">
                {d.don.map((x) => (
                  <li key={x.id} className="flex items-center justify-between gap-4 py-3">
                    <div className="min-w-0">
                      <div className="text-[14px] font-medium text-muc">{x.loai}</div>
                      <div className="text-[13px] text-muc-3">{ngayVN(x.tu_ngay)}{x.den_ngay && x.den_ngay !== x.tu_ngay ? ` – ${ngayVN(x.den_ngay)}` : ""}</div>
                    </div>
                    <NhanTrangThai kieu={kieuDon(x.trang_thai)}>{x.trang_thai}</NhanTrangThai>
                  </li>
                ))}
              </ul>
            )}
          </MucTrang>
        </div>
        <div className="min-w-0 lg:col-span-5">
          <MucTrang tieuDe="Hồ sơ của tôi">
            <dl className="divide-y divide-vien text-[14px]">
              {[
                ["Họ và tên", d.hoSo.hoTen],
                ["Chức vụ", d.hoSo.chucDanh || "—"],
                ["Phòng ban", d.hoSo.khoi || "—"],
                ["Ngày vào làm", ngayVN(d.hoSo.ngayVaoLam)],
              ].map(([nhan, v]) => (
                <div key={nhan} className="flex justify-between gap-4 py-2.5">
                  <dt className="text-muc-3">{nhan}</dt>
                  <dd className="text-right font-medium text-muc">{v}</dd>
                </div>
              ))}
            </dl>
          </MucTrang>
        </div>
      </section>
    </div>
  );
}
