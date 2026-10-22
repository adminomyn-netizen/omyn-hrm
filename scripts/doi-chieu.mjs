// Đối chiếu tương phản WCAG của bảng màu (globals.css). Chạy: npm run doi-chieu
import { readFileSync } from "node:fs";

const css = readFileSync("src/app/globals.css", "utf8");
const tok = Object.fromEntries([...css.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)].map((m) => [m[1], m[2]]));

const lum = (hex) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const tuongPhan = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

// [chữ, nền, ngưỡng, mô tả]
const CAP = [
  ["muc", "giay", 4.5, "chữ chính"],
  ["muc", "giay-tram", 4.5, "chữ chính trên vùng lõm"],
  ["muc-2", "giay", 4.5, "chữ phụ"],
  ["muc-2", "giay-tram", 4.5, "chữ phụ trên vùng lõm"],
  ["muc-3", "giay", 4.5, "chữ gợi ý/nhãn"],
  ["muc-3", "giay-tram", 4.5, "chữ gợi ý trên vùng lõm"],
  ["nhan", "giay", 4.5, "liên kết/focus trên nền"],
  ["nhan-dam", "giay-tram", 4.5, "chữ nhấn trên vùng lõm (dùng nhan-dam, không dùng nhan)"],
  ["nhan-dam", "nhan-nhat", 4.5, "chữ trên nhãn nhấn"],
  ["muc", "vang", 4.5, "chữ nâu trên nút vàng (điểm giữa dải)"],
  ["muc", "vang-sang", 4.5, "chữ nâu trên nút vàng (đầu sáng)"],
  ["muc", "vang-tram", 4.5, "chữ nâu trên nút vàng (cuối đậm)"],
  ["loi", "loi-nen", 4.5, "lỗi"],
  ["canh-bao", "canh-bao-nen", 4.5, "cảnh báo"],
  ["vien-dam", "giay", 3, "viền ô nhập (≥ 3:1)"],
];

let hong = 0;
for (const [a, b, nguong, mt] of CAP) {
  if (!tok[a] || !tok[b]) {
    console.log(`THIẾU token ${a} hoặc ${b}`);
    hong++;
    continue;
  }
  const r = tuongPhan(tok[a], tok[b]);
  const ok = r >= nguong;
  if (!ok) hong++;
  console.log(`${ok ? "ĐẠT " : "TRƯỢT"} ${r.toFixed(2)} : 1 (≥ ${nguong})  ${a} ${tok[a]} trên ${b} ${tok[b]} — ${mt}`);
}
process.exit(hong ? 1 : 0);
