export const dynamic = "force-dynamic";

import Link from "next/link";
import { CalendarClock, Check, Inbox } from "lucide-react";
import { MucTrang } from "@/components/ui/MucTrang";
import { ThanhTyLe } from "@/components/ui/ThanhTyLe";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { DuyetTaiKhoan } from "@/components/dashboard/DuyetTaiKhoan";
import { VongChamCong } from "@/components/dashboard/VongChamCong";
import { DuongXuHuong } from "@/components/dashboard/DuongXuHuong";
import { layDuLieuTongQuan, layHoSoChuaGanTaiKhoan, layTaiKhoanChoDuyet } from "@/lib/data";
import { layNguoiDungDaDuyet } from "@/lib/auth";
import { ToanCanhKyThuat } from "@/components/dashboard/ToanCanhKyThuat";
import { ToanCanhDieuHanh } from "@/components/dashboard/ToanCanhDieuHanh";
import { BieuDoLuong } from "@/components/dashboard/BieuDoLuong";
import { TongQuanCuaToi } from "@/components/dashboard/TongQuanCuaToi";
import { gioMayChu, ngayVN, trieuVN } from "@/lib/dinh-dang";
import { LoiChaoDongHo } from "@/components/dashboard/LoiChaoDongHo";
import { NUT_CHINH, NUT_PHU } from "@/components/ui/dinh-dang";

const IC = { tk: Check, don: Inbox, pv: CalendarClock } as const;

export default async function TrangTongQuan() {
  // Ai cũng vào được Tổng quan; nội dung theo từng tài khoản: nhân viên chỉ thấy việc của mình.
  const nguoiGoi = await layNguoiDungDaDuyet();
  if (nguoiGoi.vaiTro !== "admin" && nguoiGoi.vaiTro !== "ky_thuat") return <TongQuanCuaToi userId={nguoiGoi.id} hoTen={nguoiGoi.hoTen} />;
  const laKyThuat = nguoiGoi.vaiTro === "ky_thuat";
  // Duyệt tài khoản chỉ Kỹ thuật làm: người khác không đọc danh sách chờ duyệt.
  const [d, taiKhoanChoDuyet, hoSoTrong] = await Promise.all([layDuLieuTongQuan(nguoiGoi.vaiTro), laKyThuat ? layTaiKhoanChoDuyet() : Promise.resolve([]), laKyThuat ? layHoSoChuaGanTaiKhoan() : Promise.resolve([])]);

  const ten = nguoiGoi.hoTen.trim().replace(/\s+/g, " ");
  const soViec = d.viec.length;
  const cc = d.chamCong;
  const lonNhat = Math.max(1, ...cc.o);

  const chiSo = [
    { nhan: "Nhân viên đang làm", so: String(d.dangLam), phu: d.moiVao30 ? `+${d.moiVao30} vào làm 30 ngày qua` : `Tổng ${d.tongHoSo} hồ sơ`, mau: "text-nhan-dam", diem: d.xuHuongNv },
    { nhan: "Đơn chờ duyệt", so: String(d.donCho), phu: d.donCho ? "Cần xử lý" : "Không có đơn tồn", mau: d.donCho ? "text-canh-bao" : "text-muc-3", diem: d.xuHuongDon },
    { nhan: "Ứng viên mới 7 ngày", so: String(d.uvMoi), phu: `${d.dangPv} đang trong vòng phỏng vấn`, mau: "text-muc-3", diem: d.xuHuongUv },
    { nhan: d.luong ? `Quỹ lương ${d.luong.ky}` : "Quỹ lương", so: d.luong ? trieuVN(d.luong.tongQuyLuong) : "—", phu: d.luong ? (d.luong.daThanhToan ? "Đã thanh toán" : "Chưa thanh toán") : "Chưa có kỳ lương", mau: "text-muc-3", diem: [0, 0] },
  ];

  return (
    <div className="space-y-10">
      <div id="tai-khoan" className="scroll-mt-20">
        <DuyetTaiKhoan taiKhoan={taiKhoanChoDuyet} hoSo={hoSoTrong} nguoiGoi={nguoiGoi.vaiTro} />
      </div>

      {/* chào + đồng hồ realtime + hành động nhanh */}
      <LoiChaoDongHo
        ten={ten ?? ""}
        batDau={gioMayChu()}
        phu={
          <>
            {soViec > 0 ? (
              <>
                Hôm nay có <strong className="text-muc">{soViec} việc</strong> đang chờ bạn
              </>
            ) : (
              "Hôm nay chưa có việc nào đang chờ bạn"
            )}{" "}
            và <strong className="text-muc">{cc.da} trên {cc.tong}</strong> người đã chấm công.
          </>
        }
      >
        <Link href="/tuyen-dung?dang=1" className={`${NUT_PHU} inline-flex items-center`}>Đăng tuyển</Link>
        <Link href="/nhan-su?them=1" className={`${NUT_CHINH} inline-flex items-center`}>+ Thêm nhân viên</Link>
      </LoiChaoDongHo>

      {/* hàng chính */}
      <section className="grid gap-5 lg:grid-cols-12">
        <div className="nen-toi flex min-h-[250px] flex-wrap items-center gap-7 min-w-0 rounded-[14px] px-7 py-7 text-[#E3F2EF] lg:col-span-7">
          <VongChamCong da={cc.da} tong={cc.tong} />
          <div className="min-w-0 flex-1 basis-56">
            <div className="text-[12px] font-medium uppercase tracking-[0.12em] text-[#B5CDC9]">Chấm công hôm nay</div>
            <div className="mt-3.5 flex flex-wrap gap-7">
              {[
                [cc.dungGio, "Đúng giờ"],
                [cc.diMuon, "Đi muộn"],
                [cc.chua, "Chưa chấm"],
              ].map(([so, nhan]) => (
                <div key={nhan}>
                  <div className="text-[28px] font-medium leading-none tabular-nums">{so}</div>
                  <div className="mt-1 text-[12px] text-[#B5CDC9]">{nhan}</div>
                </div>
              ))}
            </div>
            <div className="mt-5 flex h-[46px] items-end gap-[5px]" role="img" aria-label="Số người chấm công theo từng nửa giờ, từ 07:00">
              {cc.o.map((so, i) => (
                <span
                  key={i}
                  className="flex-1"
                  style={{
                    height: Math.max(4, Math.round((so / lonNhat) * 46)),
                    borderRadius: 3,
                    background: so === lonNhat && so > 0 ? "linear-gradient(180deg,#7FE3D2,#14938A)" : "rgba(227,242,239,.22)",
                  }}
                />
              ))}
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-[#8FB5AE]">
              <span>07:00</span>
              <span>09:30</span>
              <span>12:00</span>
            </div>
          </div>
        </div>

        <div className="min-w-0 lg:col-span-5">
          <MucTrang tieuDe="Việc cần bạn" phai={<Link href="/don-tu" className="font-medium text-nhan-dam underline-offset-4 hover:underline">Xem đơn</Link>}>
            {d.viec.length === 0 ? (
              <p className="py-6 text-[14px] text-muc-3">Không có việc nào đang chờ bạn. Khi có đơn, tài khoản mới hoặc lịch phỏng vấn, chúng sẽ hiện ở đây.</p>
            ) : (
              <ul className="-mt-1">
                {d.viec.map((v, i) => {
                  const Icon = IC[v.loai];
                  return (
                    <li key={i} className="flex items-center gap-3.5 border-b border-vien py-3.5 last:border-b-0">
                      <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px] bg-nhan-nhat text-nhan-dam">
                        <Icon strokeWidth={1.6} className="h-[19px] w-[19px]" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[14px] font-medium text-muc">{v.tieuDe}</div>
                        <div className="truncate text-[13px] text-muc-3">{v.phu}</div>
                      </div>
                      <Link href={v.href} className="h-[34px] shrink-0 rounded-nho border border-vien-dam px-3.5 text-[13px] font-medium leading-[32px] text-muc hover:bg-giay-tram">
                        {v.nut}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </MucTrang>
        </div>
      </section>

      {/* chỉ số + xu hướng */}
      <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {chiSo.map((k, i) => {
          const mau = ["luc", "cam", "tim", "xanh"][i % 4];
          return (
            <div key={k.nhan} className="min-w-0 rounded-nho border border-vien px-5 py-5" style={{ borderTop: `4px solid var(--sac-${mau}-mau)`, background: `linear-gradient(180deg, var(--sac-${mau}-nen), var(--giay-sang))` }}>
              <div className="text-[13px] text-muc-2">{k.nhan}</div>
              <div className="mt-2 flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[32px] font-semibold leading-none tabular-nums text-muc">{k.so}</div>
                  <div className={`mt-1.5 text-[12px] ${k.mau}`}>{k.phu}</div>
                </div>
                <DuongXuHuong diem={k.diem} />
              </div>
            </div>
          );
        })}
      </section>

      {/* khối + tuyển dụng */}
      <section className="grid gap-x-12 gap-y-10 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-7">
          <MucTrang tieuDe="Nhân sự theo khối">
            <ThanhTyLe donVi="người" dong={d.khoi.map((k) => ({ nhan: k.ten, so: k.so }))} />
          </MucTrang>
        </div>
        <div className="min-w-0 lg:col-span-5">
          <MucTrang tieuDe="Đang tuyển" phai={<Link href="/tuyen-dung" className="font-medium text-nhan-dam underline-offset-4 hover:underline">Mở bảng ứng viên</Link>}>
            {d.tinMo.length === 0 ? (
              <p className="text-[14px] text-muc-3">Chưa có tin tuyển dụng nào đang mở.</p>
            ) : (
              <ul className="-mt-1">
                {d.tinMo.slice(0, 4).map((t) => (
                  <li key={t.id} className="border-b border-vien py-4 last:border-b-0">
                    <div className="flex items-center justify-between gap-3">
                      <Link href={`/tuyen-dung?tin=${t.id}`} className="truncate font-medium text-muc hover:underline">{t.viTri}</Link>
                      <NhanTrangThai kieu={t.trangThai === "Đang phỏng vấn" ? "cho" : "tot"}>{t.trangThai}</NhanTrangThai>
                    </div>
                    <div className="mt-0.5 text-[13px] text-muc-3">
                      Cần {t.can} người{t.hanNop ? ` · hạn nộp ${ngayVN(t.hanNop)}` : ""} · {t.soUv ? `${t.soUv} ứng viên` : "chưa có hồ sơ"}
                    </div>
                    <div className="mt-2.5 flex gap-1" aria-hidden>
                      {Array.from({ length: 6 }, (_, i) => (
                        <span key={i} className="h-1 flex-1" style={{ borderRadius: 2, background: i < t.buoc ? "linear-gradient(90deg,#7FE3D2,#14938A)" : "var(--giay-tram)" }} />
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </MucTrang>
        </div>
      </section>

      <ToanCanhDieuHanh />

      <BieuDoLuong />

      {laKyThuat && <ToanCanhKyThuat />}
    </div>
  );
}
