// Định dạng hiển thị dùng chung (an toàn cho cả máy chủ và trình duyệt).
export const ngayVN = (d: string | null | undefined) => (d ? d.split("-").reverse().join("/") : "");
export const tienVN = (so: number) => `${so.toLocaleString("vi-VN")} đ`;
export const trieuVN = (so: number) => `${(so / 1_000_000).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} triệu`;

/** Mốc giờ hiện tại (ms) của máy chủ — để truyền xuống đồng hồ ở trình duyệt làm giá trị khởi đầu. */
export const gioMayChu = () => Date.now();
