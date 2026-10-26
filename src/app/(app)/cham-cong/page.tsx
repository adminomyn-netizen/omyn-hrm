export const dynamic = "force-dynamic";

import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { HangChiSo } from "@/components/ui/HangChiSo";
import { MucTrang } from "@/components/ui/MucTrang";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { Bang, type Cot } from "@/components/ui/Table";
import {
  layChamCongHomNay,
  layChamCongHomNayCuaToi,
  layChamCongThang,
  layChamCongKhoang,
  layHoSoChamCong,
  layViTriChamCong,
  thangHienTaiHCM,
} from "@/lib/data";
import { layNguoiDungDaDuyet } from "@/lib/auth";
import { DongHoHCM } from "@/components/cham-cong/DongHoHCM";
import { LichChamCongTre } from "@/components/cham-cong/LichChamCongTre";
import { NutChamCong } from "@/components/cham-cong/NutChamCong";
import { DatViTriVanPhong } from "@/components/cham-cong/DatViTriVanPhong";
import { BoLocThoiGian } from "@/components/cham-cong/BoLocThoiGian";

type SuKienCC = { id: string; ngay: string; hoTen: string; khoiTen: string; gioVao: string | null; gioRa: string | null; trangThai: string };
const dMY = (iso: string) => iso.split("-").reverse().join("/");
const laNgay = (s?: string) => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
/** Khoảng ngày hợp lệ: đủ hai đầu, đầu ≤ cuối, tối đa 93 ngày. */
const khoangHopLe = (tu?: string, den?: string) => laNgay(tu) && laNgay(den) && tu! <= den! && (Date.parse(den!) - Date.parse(tu!)) / 864e5 <= 92;

const cotKhoang: Cot<SuKienCC>[] = [
  { nhan: "Ngày", hienThi: (d) => dMY(d.ngay) },
  { nhan: "Nhân viên", hienThi: (d) => <span className="font-medium text-muc">{d.hoTen}</span> },
  { nhan: "Bộ phận", hienThi: (d) => d.khoiTen || "—" },
  { nhan: "Giờ vào", phai: true, hienThi: (d) => d.gioVao?.slice(0, 5) ?? "--:--" },
  { nhan: "Giờ ra", phai: true, hienThi: (d) => d.gioRa?.slice(0, 5) ?? "--:--" },
  { nhan: "Trạng thái", hienThi: (d) => <NhanTrangThai kieu={kieu(d.trangThai)}>{d.trangThai}</NhanTrangThai> },
];

/** Thanh chọn thời gian + lịch tháng, hoặc bảng theo khoảng ngày khi người dùng chọn tuỳ chỉnh. */
function KhuVucLich({ tieuDe, nam, thang, tu, den, suKien, homNay }: { tieuDe: string; nam: number; thang: number; tu?: string; den?: string; suKien: SuKienCC[]; homNay: { nam: number; thang: number } }) {
  const khoang = khoangHopLe(tu, den);
  return (
    <MucTrang tieuDe={khoang ? `${tieuDe} · ${dMY(tu!)} – ${dMY(den!)}` : `${tieuDe} · Tháng ${thang}/${nam}`}>
      <BoLocThoiGian nam={nam} thang={thang} tu={khoang ? tu : undefined} den={khoang ? den : undefined} homNay={homNay} />
      {khoang ? <Bang cot={cotKhoang} duLieu={suKien} khoa={(d) => d.id} trong="Không có dữ liệu chấm công trong khoảng này." /> : <LichChamCongTre suKien={suKien} nam={nam} thang={thang} />}
      <p className="mt-4 text-[13px] text-muc-3">Giờ hiển thị là giờ bấm chấm công thực tế. Công và lương vẫn tính theo ca đã định (ca hành chính 08:00 – 17:00), không tính theo giờ bấm.</p>
    </MucTrang>
  );
}

type DongChamCong = Awaited<ReturnType<typeof layChamCongHomNay>>["chiTiet"][number];
/** Dải 7 ngày của tuần này: ngày đã chấm công có nền nhạt, hôm nay có nền vàng. */
function TuanNay({ suKien }: { suKien: { ngay: string }[] }) {
  const homNay = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });
  const [y, m, d] = homNay.split("-").map(Number);
  const thu = (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
  const co = new Set(suKien.map((s) => s.ngay));
  const ngay = Array.from({ length: 7 }, (_, i) => {
    const dt = new Date(Date.UTC(y, m - 1, d - thu + i));
    return { iso: dt.toISOString().slice(0, 10), so: dt.getUTCDate(), ten: ["T2", "T3", "T4", "T5", "T6", "T7", "CN"][i] };
  });
  return (
    <div className="mx-auto flex max-w-sm justify-between" aria-label="Tuần này">
      {ngay.map((n) => {
        const laHomNay = n.iso === homNay;
        const daCham = co.has(n.iso);
        return (
          <div key={n.iso} className="flex flex-col items-center gap-1.5 text-[11px] text-muc-3">
            <span>{n.ten}</span>
            <span
              className={`flex h-9 w-9 items-center justify-center text-[13px] font-medium ${laHomNay ? "text-[var(--chu-tren-vang)]" : daCham ? "bg-nhan-nhat text-nhan-dam" : "border border-vien text-muc-3"}`}
              style={{ borderRadius: 9999, ...(laHomNay ? { background: "var(--gradient-vang)" } : {}) }}
              aria-label={`${n.so}: ${daCham ? "đã chấm công" : laHomNay ? "hôm nay" : "chưa có"}`}
            >
              {n.so}
            </span>
          </div>
        );
      })}
    </div>
  );
}

const kieu = (t: string) => (t === "Đúng giờ" ? "tot" : t === "Đi muộn" ? "cho" : "loi");

const cot: Cot<DongChamCong>[] = [
  { nhan: "Nhân viên", hienThi: (d) => <span className="font-medium text-muc">{d.nhan_vien_ho_ten}</span> },
  { nhan: "Khối", hienThi: (d) => d.khoi_ten },
  { nhan: "Giờ vào", phai: true, hienThi: (d) => d.gio_vao ?? "--:--" },
  { nhan: "Giờ ra", phai: true, hienThi: (d) => d.gio_ra ?? "--:--" },
  { nhan: "Trạng thái", hienThi: (d) => <NhanTrangThai kieu={kieu(d.trang_thai)}>{d.trang_thai}</NhanTrangThai> },
];

export default async function TrangChamCong({ searchParams }: { searchParams: Promise<{ nam?: string; thang?: string; tu?: string; den?: string }> }) {
  const macDinh = thangHienTaiHCM();
  const { nam: namThamSo, thang: thangThamSo, tu, den } = await searchParams;
  const khoang = khoangHopLe(tu, den);
  const nam = Number(namThamSo) || macDinh.nam;
  const thang = Number(thangThamSo) || macDinh.thang;

  const nguoiDung = await layNguoiDungDaDuyet();
  const { nhanVienId, canChamCong } = await layHoSoChamCong(nguoiDung.id, nguoiDung.vaiTro);
  const viTri = await layViTriChamCong();

  // Nhân viên chỉ thấy chấm công/lịch của CHÍNH MÌNH (chị Lâm chốt 12/10/2026).
  if (nguoiDung.vaiTro === "nhan_vien") {
    const [homNay, suKien] = await Promise.all([
      nhanVienId && canChamCong ? layChamCongHomNayCuaToi(nhanVienId) : null,
      nhanVienId ? (khoang ? layChamCongKhoang(tu!, den!, nhanVienId) : layChamCongThang(nam, thang, nhanVienId)) : Promise.resolve([]),
    ]);
    return (
      <div className="space-y-10">
        <TieuDeTrang tieuDe="Chấm công" phu={canChamCong ? "Chấm công vào, ra và xem lịch công của bạn" : "Xem lịch công của bạn"} />
        {canChamCong ? (
          <section className="grid items-start gap-x-16 gap-y-10 lg:grid-cols-2">
            <DongHoHCM canGiua />
            <NutChamCong gioVao={homNay?.gio_vao ?? null} gioRa={homNay?.gio_ra ?? null} trangThai={homNay?.trang_thai ?? null} banKinhM={viTri.banKinhM} khoaViTri={viTri.daXacNhan} />
          </section>
        ) : (
          <p className="text-[14px] text-muc-3">Chức vụ của bạn không phải chấm công.</p>
        )}
        <TuanNay suKien={suKien} />
        {!nhanVienId && (
          <div role="status" className="rounded-nho bg-canh-bao-nen px-4 py-3 text-[14px] text-canh-bao">
            Tài khoản của bạn chưa gắn với hồ sơ nhân sự nào. Báo bộ phận Nhân sự để được gắn hồ sơ trước khi chấm công.
          </div>
        )}
        <KhuVucLich tieuDe="Lịch chấm công của tôi" nam={nam} thang={thang} tu={tu} den={den} suKien={suKien} homNay={macDinh} />
      </div>
    );
  }

  // Quản trị (kể cả Hành chính nhân sự) có hồ sơ và không thuộc nhóm miễn chấm công thì cũng phải chấm công như mọi người.
  const chamCuaMinh = canChamCong && !!nhanVienId;
  const [chamCong, suKien, homNayCuaToi, suKienCuaToi] = await Promise.all([
    layChamCongHomNay(),
    khoang ? layChamCongKhoang(tu!, den!) : layChamCongThang(nam, thang),
    chamCuaMinh ? layChamCongHomNayCuaToi(nhanVienId!) : null,
    chamCuaMinh ? layChamCongThang(macDinh.nam, macDinh.thang, nhanVienId!) : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-10">
      <TieuDeTrang tieuDe="Chấm công" phu={chamCuaMinh ? "Chấm công của bạn và theo dõi chấm công cả công ty" : "Theo dõi chấm công của cả công ty trong ngày và trong tháng"} />
      {chamCuaMinh ? (
        <>
          <section className="grid items-start gap-x-16 gap-y-10 lg:grid-cols-2">
            <DongHoHCM canGiua />
            <NutChamCong gioVao={homNayCuaToi?.gio_vao ?? null} gioRa={homNayCuaToi?.gio_ra ?? null} trangThai={homNayCuaToi?.trang_thai ?? null} banKinhM={viTri.banKinhM} khoaViTri={viTri.daXacNhan} />
          </section>
          <TuanNay suKien={suKienCuaToi} />
        </>
      ) : (
        <DongHoHCM />
      )}
      <HangChiSo
        muc={[
          { nhan: "Đã chấm công hôm nay", so: `${chamCong.daChamCong}/${chamCong.tongNhanVien}` },
          { nhan: "Đi muộn", so: String(chamCong.diMuon) },
          { nhan: "Vắng mặt", so: String(chamCong.vangMat) },
        ]}
      />
      <MucTrang tieuDe="Vị trí chấm công">
        <DatViTriVanPhong ten={viTri.ten} diaChi={viTri.diaChi} banKinhM={viTri.banKinhM} daXacNhan={viTri.daXacNhan} />
      </MucTrang>
      <KhuVucLich tieuDe="Lịch chấm công" nam={nam} thang={thang} tu={tu} den={den} suKien={suKien} homNay={macDinh} />
      <MucTrang tieuDe="Chấm công hôm nay">
        <Bang cot={cot} duLieu={chamCong.chiTiet} khoa={(d) => d.nhan_vien_ho_ten} trong="Hôm nay chưa ai chấm công." />
      </MucTrang>
    </div>
  );
}
