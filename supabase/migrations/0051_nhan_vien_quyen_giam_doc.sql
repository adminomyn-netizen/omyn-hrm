-- 0051 — Cờ giữ quyền giám đốc theo TỪNG NGƯỜI (chị Lâm chốt 31/10/2026: bỏ chữ Tổng giám đốc; Chu Diệu Linh = Giám đốc, Phạm Tùng Lâm = Phó giám đốc,
-- quyền giữ nguyên). Trước đây quyền "giám đốc" (miễn chấm công, sửa KPI/thưởng thi đua, vai giám đốc trong luồng duyệt) suy từ chữ chức danh;
-- đổi chữ thành Phó giám đốc sẽ làm mất quyền của chị Lâm, nên ghi cờ riêng cho đúng người đang có quyền đó. Không thêm quyền cho ai khác.
alter table public.nhan_vien add column if not exists quyen_giam_doc boolean not null default false;
update public.nhan_vien set quyen_giam_doc = true where id = '3de00504-7a4e-458f-8764-ae057b802b75';
