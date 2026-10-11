// QR code for the booking link: drawn on screen as SVG, and saved as a PNG poster
// that the practice can print and put on the wall or the reception desk.
import qrcode from 'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/+esm';
import { escapeHtml } from './format.js';

const INK = '#141413';
const QUIET = 2; // empty modules around the code, so phones can find its edges

function makeQr(text) {
  const qr = qrcode(0, 'M'); // type 0 = smallest size that fits; M = medium error correction
  qr.addData(text);
  qr.make();
  return qr;
}

/** SVG markup of the QR code (dark on white, scales to its container). */
export function qrSvg(text, label = 'QR code') {
  const qr = makeQr(text);
  const size = qr.getModuleCount();
  let path = '';
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (qr.isDark(row, col)) path += `M${col + QUIET} ${row + QUIET}h1v1h-1z`;
    }
  }
  const box = size + QUIET * 2;
  return `<svg viewBox="0 0 ${box} ${box}" role="img" aria-label="${escapeHtml(label)}" shape-rendering="crispEdges">
    <rect width="${box}" height="${box}" fill="#fff"/><path d="${path}" fill="${INK}"/></svg>`;
}

/** Save a printable PNG: practice name, "Scan untuk booking", the QR code and the link. */
export async function downloadQrPoster(text, { title, fileName = 'qr-booking.png' }) {
  await document.fonts?.ready;
  const qr = makeQr(text);
  const size = qr.getModuleCount();
  const width = 1080;
  const height = 1440;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, width, height);
  ctx.textAlign = 'center';
  ctx.fillStyle = INK;

  let y = 150;
  ctx.font = '700 60px Inter, system-ui, sans-serif';
  for (const line of wrap(ctx, title, width - 160).slice(0, 2)) {
    ctx.fillText(line, width / 2, y);
    y += 74;
  }
  ctx.font = '500 40px Inter, system-ui, sans-serif';
  ctx.fillStyle = '#c96442';
  ctx.fillText('Scan untuk booking online', width / 2, y + 10);

  // Whole-pixel squares: fractional sizes leave thin seams that confuse phone cameras.
  const cell = Math.floor(760 / (size + QUIET * 2));
  const qrSize = cell * (size + QUIET * 2);
  const left = Math.round((width - qrSize) / 2);
  const top = Math.round(y + 60);
  ctx.fillStyle = INK;
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (qr.isDark(row, col)) ctx.fillRect(left + (col + QUIET) * cell, top + (row + QUIET) * cell, cell, cell);
    }
  }

  ctx.font = '400 28px Inter, system-ui, sans-serif';
  ctx.fillStyle = '#73726c';
  let linkY = top + qrSize + 70;
  for (const line of wrap(ctx, text, width - 160)) {
    ctx.fillText(line, width / 2, linkY);
    linkY += 38;
  }
  ctx.font = '600 30px Inter, system-ui, sans-serif';
  ctx.fillText('Dibuat dengan NAKESA', width / 2, height - 60);

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

/** Split text into lines that fit `maxWidth` (long words such as links are split by character). */
function wrap(ctx, text, maxWidth) {
  const lines = [];
  let line = '';
  for (const word of String(text).split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidth) {
      line = next;
      continue;
    }
    if (line) lines.push(line);
    line = '';
    for (const char of word) {
      if (ctx.measureText(line + char).width > maxWidth) {
        lines.push(line);
        line = '';
      }
      line += char;
    }
  }
  if (line) lines.push(line);
  return lines;
}
