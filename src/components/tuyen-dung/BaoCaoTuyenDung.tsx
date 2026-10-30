import { tienVN } from "@/lib/dinh-dang";
import type { tinhBaoCaoTuyenDung } from "@/lib/tuyen-dung";

type BaoCao = ReturnType<typeof tinhBaoCaoTuyenDung>;
const MAU = ["#E6D8DA", "#D9A7B0", "#B8475A", "#8B2635", "#C9826F", "#6B1A27", "#96797E"];

function The({ nhan, so, phu }: { nhan: string; so: string; phu?: string }) {
  return (
    <div className="the-noi the-noi-thap p-4">
      <div className="nhan-muc">{nhan}</div>
      <div className="chu-tieu-de mt-1 text-[30px] leading-none text-muc tabular-nums">{so}</div>
      {phu && <div className="mt-1.5 text-[12px] text-muc-3">{phu}</div>}
    </div>
  );
}

/** Báo cáo tuyển dụng: số liệu lấy thẳng từ yêu cầu, tin, kênh đăng và ứng viên (không nhập tay). */
export function BaoCaoTuyenDung({ bc }: { bc: BaoCao }) {
  const tongUv = bc.phau.reduce((s, p) => s + p.so, 0);
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <The nhan="Ứng viên" so={String(tongUv)} phu={`${bc.soNhanViec} đã nhận việc`} />
        <The nhan="Tổng chi phí tuyển" so={tienVN(bc.tongChiPhi)} phu="cộng chi phí các kênh đã đăng" />
        <The nhan="Chi phí mỗi người nhận việc" so={bc.chiPhiMoiNguoi === null ? "Chưa có" : tienVN(bc.chiPhiMoiNguoi)} phu={bc.chiPhiMoiNguoi === null ? "chưa ai nhận việc" : undefined} />
        <The nhan="Thời gian lấp đầy" so={bc.ngayLapDayTb === null ? "Chưa có" : `${bc.ngayLapDayTb} ngày`} phu="từ lúc gửi yêu cầu đến khi có người nhận việc" />
      </div>

      <section>
        <h3 className="mb-3 text-[15px] font-semibold text-muc">Ứng viên theo bước</h3>
        <div className="flex h-2.5 overflow-hidden" style={{ borderRadius: 10 }} role="img" aria-label={bc.phau.map((p) => `${p.buoc} ${p.so}`).join(", ")}>
          {bc.phau.map((p, i) => <span key={p.buoc} style={{ flex: Math.max(p.so, 0.35), background: MAU[i] }} />)}
        </div>
        <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-muc-2">
          {bc.phau.map((p, i) => <li key={p.buoc} className="flex items-center gap-1.5"><span aria-hidden className="inline-block h-2 w-2" style={{ background: MAU[i], borderRadius: 2 }} />{p.buoc} <strong className="font-semibold tabular-nums text-muc">{p.so}</strong></li>)}
        </ul>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h3 className="mb-3 text-[15px] font-semibold text-muc">Nguồn ứng viên</h3>
          {bc.theoNguon.length === 0 ? <p className="text-[13px] text-muc-3">Chưa có ứng viên.</p> : (
            <table className="w-full text-left text-[13px]"><thead><tr className="nhan-muc border-b border-vien"><th className="py-2 font-medium">Nguồn</th><th className="py-2 text-right font-medium">Ứng viên</th><th className="py-2 text-right font-medium">Nhận việc</th></tr></thead>
              <tbody>{bc.theoNguon.map((n) => <tr key={n.nguon} className="border-b border-vien"><td className="py-2 text-muc-2">{n.nguon}</td><td className="py-2 text-right tabular-nums">{n.so}</td><td className="py-2 text-right tabular-nums">{n.nhanViec}</td></tr>)}</tbody></table>
          )}
        </section>
        <section>
          <h3 className="mb-3 text-[15px] font-semibold text-muc">Chi phí theo kênh</h3>
          {bc.theoKenh.length === 0 ? <p className="text-[13px] text-muc-3">Chưa ghi lần đăng nào.</p> : (
            <table className="w-full text-left text-[13px]"><thead><tr className="nhan-muc border-b border-vien"><th className="py-2 font-medium">Kênh</th><th className="py-2 text-right font-medium">Số bài</th><th className="py-2 text-right font-medium">Chi phí</th></tr></thead>
              <tbody>{bc.theoKenh.map((k) => <tr key={k.kenh} className="border-b border-vien"><td className="py-2 text-muc-2">{k.kenh}</td><td className="py-2 text-right tabular-nums">{k.soBai}</td><td className="py-2 text-right tabular-nums">{tienVN(k.chiPhi)}</td></tr>)}</tbody></table>
          )}
        </section>
      </div>

      <section>
        <h3 className="mb-3 text-[15px] font-semibold text-muc">Kết quả từng tin</h3>
        {bc.theoTin.length === 0 ? <p className="text-[13px] text-muc-3">Chưa có tin tuyển dụng.</p> : (
          <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left text-[13px]"><thead><tr className="nhan-muc border-b border-vien"><th className="py-2 font-medium">Vị trí</th><th className="py-2 text-right font-medium">Cần</th><th className="py-2 text-right font-medium">Ứng viên</th><th className="py-2 text-right font-medium">Đã nhận việc</th><th className="py-2 text-right font-medium">Còn thiếu</th><th className="py-2 text-right font-medium">Chi phí</th></tr></thead>
            <tbody>{bc.theoTin.map((t) => <tr key={t.id} className="border-b border-vien"><td className="py-2 font-medium text-muc">{t.viTri}</td><td className="py-2 text-right tabular-nums">{t.canTuyen}</td><td className="py-2 text-right tabular-nums">{t.ungVien}</td><td className="py-2 text-right tabular-nums">{t.nhanViec}</td><td className="py-2 text-right tabular-nums">{t.conThieu}</td><td className="py-2 text-right tabular-nums">{tienVN(t.chiPhi)}</td></tr>)}</tbody></table></div>
        )}
      </section>

      <section>
        <h3 className="mb-3 text-[15px] font-semibold text-muc">Yêu cầu tuyển dụng theo trạng thái</h3>
        <ul className="flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-muc-2">{bc.yeuCauTheoTrangThai.map((y) => <li key={y.tt}>{y.tt} <strong className="font-semibold tabular-nums text-muc">{y.so}</strong></li>)}</ul>
      </section>
    </div>
  );
}
