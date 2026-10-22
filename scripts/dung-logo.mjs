// Dựng bộ logo OMYN bằng mã (Phụ lục F của plan). Chạy lại được:
//   node scripts/dung-logo.mjs
// Cần scripts/phong/CormorantGaramond-600.ttf (bản tĩnh wght=600 tách từ phông biến
// của Google Fonts, giấy phép OFL). Đầu ra: public/brand/*.svg — chỉ <path>/<circle>,
// không <text>, không gradient, không bộ lọc.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import opentype from "opentype.js";

const GOC = join(dirname(fileURLToPath(import.meta.url)), "..");
const RA = join(GOC, "public", "brand");
mkdirSync(RA, { recursive: true });

const MUC = "#2A2218"; // nâu espresso
const NHAN = "#B08A35"; // hạt vàng

const buf = readFileSync(join(GOC, "scripts/phong/CormorantGaramond-600.ttf"));
const phong = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));

const lamTron = (n) => Math.round(n * 100) / 100;

// "O" vẽ riêng trên lưới 120×120: vòng ngoài (60,60) r48, vòng trong lệch tâm (63,57) r35.
// Nét mỏng ≈ 8,8 ở góc trên-phải, dày ≈ 17,2 ở góc dưới-trái (như nét bút).
function duongO() {
  const vong = (cx, cy, r) =>
    `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
  return vong(60, 60, 48) + vong(63, 57, 35);
}
// Hạt "ngọc": tâm trên đường giữa nét, góc −45°, r 5,5.
const HAT = { cx: lamTron((60 + 48 * Math.SQRT1_2 + 63 + 35 * Math.SQRT1_2) / 2), cy: lamTron((60 - 48 * Math.SQRT1_2 + 57 - 35 * Math.SQRT1_2) / 2), r: 6.5 };

function bieuTuongSvg({ mauO, mauHat, coHat = true, vien = 0, nen = null }) {
  const kt = 120 + vien * 2;
  const t = vien ? `translate(${vien} ${vien})` : "";
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${kt} ${kt}" role="img" aria-label="OMYN">` +
    (nen ? `<rect width="${kt}" height="${kt}" fill="${nen}"/>` : "") +
    `<g${t ? ` transform="${t}"` : ""}>` +
    `<path d="${duongO()}" fill="${mauO}" fill-rule="evenodd"/>` +
    (coHat ? `<circle cx="${HAT.cx}" cy="${HAT.cy}" r="${HAT.r}" fill="${mauHat}"/>` : "") +
    `</g></svg>\n`
  );
}

// Logotype: O vẽ riêng + M, Y, N lấy từ phông, giãn chữ 0,22 em.
function logotype({ mauChu, mauO, mauHat, coHat = true }) {
  const dv = phong.unitsPerEm;
  const capH = (phong.tables.os2.sCapHeight || 0.63 * dv) / dv; // theo em
  const coChu = 100; // px cho 1 em
  const capPx = capH * coChu;
  const s = (capPx * 1.02) / 96; // 96 = chiều cao vòng ngoài trên lưới 120
  const giaiChu = 0.22 * coChu;
  const duong = [];
  let x = 0;
  const yCoSo = 60 * s + 48 * s; // đáy chữ = đáy vòng O
  // O
  const gO = `translate(${lamTron(x - 12 * s)} ${lamTron(yCoSo - 108 * s)}) scale(${lamTron(s * 1000) / 1000})`;
  const hat = coHat
    ? `<circle cx="${HAT.cx}" cy="${HAT.cy}" r="${HAT.r}" fill="${mauHat}"/>`
    : "";
  const oSvg = `<g transform="${gO}"><path d="${duongO()}" fill="${mauO}" fill-rule="evenodd"/>${hat}</g>`;
  x += 96 * s + giaiChu;
  let phai = x;
  for (const ch of "MYN") {
    const g = phong.charToGlyph(ch);
    const p = g.getPath(x, yCoSo, coChu);
    const bb = p.getBoundingBox();
    // đặt mép trái nét đầu tại x (bỏ lề trái của glyph)
    const dich = x - bb.x1;
    const p2 = g.getPath(x + dich, yCoSo, coChu);
    duong.push(`<path d="${p2.toPathData(2)}" fill="${mauChu}"/>`);
    const bb2 = p2.getBoundingBox();
    x = bb2.x2 + giaiChu;
    phai = bb2.x2;
  }
  const trai = 0;
  const tren = yCoSo - 96 * s * 1.0;
  const dai = lamTron(phai - trai);
  const cao = lamTron(96 * s);
  return { oSvg, chu: duong.join(""), dai, cao, tren: lamTron(tren), s, yCoSo };
}

function ngangSvg(m, nen = null, le = 12) {
  const L = logotype(m);
  const W = L.dai + le * 2;
  const H = L.cao + le * 2;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${lamTron(W)} ${lamTron(H)}" role="img" aria-label="OMYN">` +
    (nen ? `<rect width="${lamTron(W)}" height="${lamTron(H)}" fill="${nen}"/>` : "") +
    `<g transform="translate(${le} ${lamTron(le - L.tren)})">${L.oSvg}${L.chu}</g></svg>\n`
  );
}

function dungSvg(m, nen = null) {
  const L = logotype(m);
  // Biểu tượng (O) trên, chữ dưới; khoảng cách = 0,5 chiều cao chữ O.
  const khoang = 0.5 * 96;
  const heSo = (L.dai * 0.62) / 96; // O nhỏ hơn bề ngang chữ
  const W = L.dai + 48;
  const oX = (W - 96 * heSo) / 2 - 12 * heSo;
  const chuX = 24;
  const tren = 24;
  const oY = tren;
  const chuY = tren + 96 * heSo + khoang * heSo * 0.9;
  const H = chuY + L.cao + 24;
  const hat = m.coHat
    ? `<circle cx="${HAT.cx}" cy="${HAT.cy}" r="${HAT.r}" fill="${m.mauHat}"/>`
    : "";
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${lamTron(W)} ${lamTron(H)}" role="img" aria-label="OMYN">` +
    (nen ? `<rect width="${lamTron(W)}" height="${lamTron(H)}" fill="${nen}"/>` : "") +
    `<g transform="translate(${lamTron(oX)} ${lamTron(oY - 12 * heSo)}) scale(${lamTron(heSo * 1000) / 1000})">` +
    `<path d="${duongO()}" fill="${m.mauO}" fill-rule="evenodd"/>${hat}</g>` +
    `<g transform="translate(${chuX} ${lamTron(chuY - L.tren)})">${L.chu}<g>${L.oSvg.replace(/<g /, "<g ")}</g></g></svg>\n`
  );
}

const bo = { mauChu: MUC, mauO: MUC, mauHat: NHAN, coHat: true };
const den = { mauChu: "#000000", mauO: "#000000", mauHat: "#000000", coHat: true };
const nenToi = { mauChu: "#F6EBD0", mauO: "#F6EBD0", mauHat: "#E2BE66", coHat: true };
const trang = { mauChu: "#FFFFFF", mauO: "#FFFFFF", mauHat: "#FFFFFF", coHat: true };

const tep = {
  "logo-ngang.svg": ngangSvg(bo),
  "logo-dung.svg": dungSvg(bo),
  "bieu-tuong.svg": bieuTuongSvg({ mauO: MUC, mauHat: NHAN }),
  "logo-don-sac-den.svg": ngangSvg(den),
  "logo-don-sac-trang.svg": ngangSvg(trang),
  "logo-tren-nen-toi.svg": ngangSvg(nenToi),
  // Ở 16 px chấm hạt gây rối ⇒ favicon bỏ chấm (ghi lý do trong nhật ký giai đoạn).
  "bieu-tuong-sang.svg": bieuTuongSvg({ mauO: "#F6EBD0", mauHat: "#E2BE66" }),
  "favicon.svg": bieuTuongSvg({ mauO: MUC, mauHat: NHAN, coHat: false, vien: 6, nen: "#FBF7EE" }),
};
for (const [ten, nd] of Object.entries(tep)) {
  writeFileSync(join(RA, ten), nd);
  console.log("đã ghi", ten, nd.length, "byte");
}
