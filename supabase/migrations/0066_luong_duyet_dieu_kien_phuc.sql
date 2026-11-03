-- Luồng duyệt chép từ Lark có nhánh lồng nhau (đơn vị → số tiền → ...), so sánh số tiền, "hoặc", "nhánh còn lại".
-- Điều kiện đơn giản cũ (dieu_kien_truong = dieu_kien_gia_tri) giữ nguyên; cột mới là cây điều kiện, hai bên cùng đúng mới áp dụng hàng.
alter table public.pd_luong_duyet add column dieu_kien jsonb;
alter table public.pd_luong_duyet add constraint pd_luong_duyet_dieu_kien_dang check (dieu_kien is null or jsonb_typeof(dieu_kien) = 'object');
comment on column public.pd_luong_duyet.dieu_kien is 'Cây điều kiện: {t,s,v[]} | {and:[…]} | {or:[…]} | {khong:{…}}; s = la|khac|>=|>|<|<=';

-- Hai kiểu người duyệt mới của Lark: "Requester" (người nộp, thường nhận bản sao) và "Contacts in the form" (người được chọn trong ô nhân sự của phiếu; chuc_danh = mã ô).
alter table public.pd_luong_duyet drop constraint if exists pd_luong_duyet_loai_nguoi_check;
alter table public.pd_luong_duyet add constraint pd_luong_duyet_loai_nguoi_check
  check (loai_nguoi in ('Quản lý trực tiếp', 'Quản lý cấp trên', 'Chức danh', 'Nhân viên', 'Giám đốc', 'Kỹ thuật', 'Người nộp', 'Người trong phiếu', 'Tự từ chối'));
alter table public.pd_luong_duyet add constraint pd_luong_duyet_nguoi_trong_phieu_ck
  check (loai_nguoi <> 'Người trong phiếu' or length(btrim(coalesce(chuc_danh, ''))) > 0);

-- 'Tự từ chối' = nhánh Lark "Auto-reject": phiếu rơi vào nhánh này bị từ chối ngay lúc nộp (ten_buoc là lời giải thích cho người nộp).
