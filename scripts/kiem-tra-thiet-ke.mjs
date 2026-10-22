// Quét dấu hiệu "AI hoá" trong giao diện (Phụ lục E.8). Chạy: npm run kiem-tra-thiet-ke
// Ngoại lệ theo TỆP nằm ở .kiem-tra-thiet-ke-cho-phep.json (mỗi tệp có lý do); tệp mới không được có ngoại lệ.
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, relative } from "node:path";

const GOC = process.cwd();
const QUY_TAC = [
  { ma: "bo-lon", re: /\brounded-(2xl|3xl|full)\b/, vi: "bo góc lớn / tròn đồng loạt" },
  { ma: "bong-nang", re: /\bshadow-(lg|xl|2xl)\b|backdrop-blur|\bblur-/, vi: "bóng nặng / mờ kính" },
  { ma: "emoji", re: /\p{Extended_Pictographic}/u, vi: "emoji" },
  { ma: "phong-cam", re: /\b(Inter|Roboto|Arial|Poppins)\b/, vi: "phông mặc định bị cấm" },
  { ma: "tim-xanh", re: /\b(from|via|to)-(violet|purple|indigo|fuchsia|blue|sky|cyan|teal|emerald|green|lime|pink|rose)-/, vi: "dải màu ngoài tông vàng (tím/xanh/lục)" },
  { ma: "van-phong", re: /Chào mừng bạn đến với|Oops|Lorem ipsum|John Doe|Acme|Đã xảy ra lỗi!?["'`<]/, vi: "văn phong cấm (E.7)" },
  { ma: "dark", re: /\bdark:/, vi: "lớp dark: (không có chế độ tối)" },
];

function duyet(thuMuc, ra = []) {
  for (const t of readdirSync(thuMuc)) {
    const d = join(thuMuc, t);
    if (statSync(d).isDirectory()) duyet(d, ra);
    else if (/\.(tsx?|css)$/.test(t)) ra.push(d);
  }
  return ra;
}

const choPhepTep = join(GOC, ".kiem-tra-thiet-ke-cho-phep.json");
const choPhep = existsSync(choPhepTep) ? JSON.parse(readFileSync(choPhepTep, "utf8")) : {};
const loi = [];
const demNgoaiLe = {};

for (const tep of duyet(join(GOC, "src"))) {
  const ten = relative(GOC, tep);
  const dong = readFileSync(tep, "utf8").split("\n");
  dong.forEach((nd, i) => {
    for (const q of QUY_TAC) {
      if (!q.re.test(nd)) continue;
      const ngoaiLe = choPhep[ten];
      if (ngoaiLe && (ngoaiLe.ma.includes("*") || ngoaiLe.ma.includes(q.ma))) {
        demNgoaiLe[ten] = (demNgoaiLe[ten] ?? 0) + 1;
        continue;
      }
      loi.push(`${ten}:${i + 1}  [${q.ma}] ${q.vi}`);
    }
  });
}

const soNgoaiLe = Object.values(demNgoaiLe).reduce((a, b) => a + b, 0);
if (loi.length) {
  console.error(loi.join("\n"));
  console.error(`\nkiem-tra-thiet-ke: ${loi.length} vi phạm mới (ngoài danh sách cho phép).`);
  process.exit(1);
}
console.log(`kiem-tra-thiet-ke: sạch. Còn ${soNgoaiLe} dòng ngoại lệ ở ${Object.keys(demNgoaiLe).length} tệp cũ (xem .kiem-tra-thiet-ke-cho-phep.json).`);
