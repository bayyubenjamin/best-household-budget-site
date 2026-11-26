// The Linden Ledger — chart builders.
//
// Every chart is hand-built SVG, drawn from the numbers passed in.
// No chart library, no framework, no network. Each builder returns
// an SVG string the page renderers drop into the page.

const CHART_COLORS = [
  "#1e4d2e", "#c8912a", "#2e6b41", "#8a5a1f", "#5b8c5a",
  "#d4a017", "#3d7a52", "#b07d2b", "#6a9b6e", "#e0b45c",
  "#274e36", "#a86f1c", "#7ba05b"
];

function money(n) {
  return "$" + Math.round(n).toLocaleString("en-US");
}

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Spending donut. `slices` is [{ label, value, color }] in display
// order; a slice without its own colour falls back to the palette.
// Returns a donut with a centre total plus a legend list beside it.
function donutChart(slices, total, size) {
  const w = size || 210;
  const cx = w / 2;
  const cy = w / 2;
  const r = w / 2 - 8;
  const inner = r - 30;
  const shown = slices.filter(function (s) { return s.value > 0; });
  const sum = shown.reduce(function (a, s) { return a + s.value; }, 0) || 1;
  let angle = -Math.PI / 2;
  const paths = shown.map(function (s, i) {
    const frac = s.value / sum;
    const a0 = angle;
    const a1 = angle + frac * Math.PI * 2;
    angle = a1;
    const large = frac > 0.5 ? 1 : 0;
    const x0 = cx + r * Math.cos(a0);
    const y0 = cy + r * Math.sin(a0);
    const x1 = cx + r * Math.cos(a1);
    const y1 = cy + r * Math.sin(a1);
    const x2 = cx + inner * Math.cos(a1);
    const y2 = cy + inner * Math.sin(a1);
    const x3 = cx + inner * Math.cos(a0);
    const y3 = cy + inner * Math.sin(a0);
    const color = s.color || CHART_COLORS[i % CHART_COLORS.length];
    return '<path d="M ' + x0.toFixed(1) + ' ' + y0.toFixed(1) +
      ' A ' + r + ' ' + r + ' 0 ' + large + ' 1 ' + x1.toFixed(1) + ' ' + y1.toFixed(1) +
      ' L ' + x2.toFixed(1) + ' ' + y2.toFixed(1) +
      ' A ' + inner + ' ' + inner + ' 0 ' + large + ' 0 ' + x3.toFixed(1) + ' ' + y3.toFixed(1) +
      ' Z" fill="' + color + '"><title>' + esc(s.label) + ' ' + money(s.value) + '</title></path>';
  }).join("");
  const legend = shown.map(function (s, i) {
    const pct = Math.round((s.value / sum) * 100);
    const color = s.color || CHART_COLORS[i % CHART_COLORS.length];
    return '<li><span class="swatch" style="background:' + color + '"></span>' +
      '<span class="lname">' + esc(s.label) + '</span>' +
      '<span class="lamt">' + money(s.value) + '</span>' +
      '<span class="lpct">' + pct + '%</span></li>';
  }).join("");
  const svg = '<svg width="' + w + '" height="' + w + '" viewBox="0 0 ' + w + ' ' + w +
    '" role="img" aria-label="Donut chart of November spending by category">' +
    paths +
    '<text x="' + cx + '" y="' + (cy - 4) + '" text-anchor="middle" class="donut-total">' + money(total) + '</text>' +
    '<text x="' + cx + '" y="' + (cy + 15) + '" text-anchor="middle" class="donut-total-sub">spent in November</text>' +
    '</svg>';
  return '<div class="donut-wrap">' + svg + '<ul class="legend">' + legend + '</ul></div>';
}

// Horizontal bars for the reports page. `rows` is
// [{ label, value, color }], sorted largest first by the caller.
function hbarChart(rows) {
  const max = rows.reduce(function (m, r) { return Math.max(m, r.value); }, 1);
  return rows.map(function (r, i) {
    const pct = Math.max(2, Math.round((r.value / max) * 100));
    const color = r.color || CHART_COLORS[i % CHART_COLORS.length];
    return '<div class="hbar-row"><span class="hbar-name">' + esc(r.label) + '</span>' +
      '<span class="bar-track"><span class="bar-fill" style="display:block;width:' + pct + '%;background:' + color + '"></span></span>' +
      '<span class="hbar-amt">' + money(r.value) + '</span></div>';
  }).join("");
}

// Six-month income vs spending bars. `months` is
// [{ month, income, spending }]. Income bars are green, spending gold.
function trendChart(months) {
  const w = 640;
  const h = 260;
  const padL = 44;
  const padB = 28;
  const padT = 12;
  const maxV = months.reduce(function (m, d) { return Math.max(m, d.income, d.spending); }, 1) * 1.08;
  const chartW = w - padL - 12;
  const chartH = h - padT - padB;
  const groupW = chartW / months.length;
  const barW = Math.min(30, (groupW - 18) / 2);
  let bars = "";
  months.forEach(function (d, i) {
    const gx = padL + i * groupW + (groupW - barW * 2 - 6) / 2;
    const ih = (d.income / maxV) * chartH;
    const sh = (d.spending / maxV) * chartH;
    const yI = padT + chartH - ih;
    const yS = padT + chartH - sh;
    const cx = gx + barW + 3 + barW / 2;
    bars += '<rect x="' + gx.toFixed(1) + '" y="' + yI.toFixed(1) + '" width="' + barW + '" height="' + ih.toFixed(1) + '" rx="3" fill="#1e4d2e"><title>' + esc(d.label) + ' income ' + money(d.income) + '</title></rect>';
    bars += '<rect x="' + (gx + barW + 6).toFixed(1) + '" y="' + yS.toFixed(1) + '" width="' + barW + '" height="' + sh.toFixed(1) + '" rx="3" fill="#c8912a"><title>' + esc(d.label) + ' spending ' + money(d.spending) + '</title></rect>';
    bars += '<text x="' + cx.toFixed(1) + '" y="' + (h - 8) + '" text-anchor="middle" font-size="12" fill="#6b6f60">' + esc(d.month) + '</text>';
  });
  const grid = [0.25, 0.5, 0.75, 1].map(function (f) {
    const y = padT + chartH - chartH * f;
    const val = Math.round(maxV * f);
    return '<line x1="' + padL + '" y1="' + y.toFixed(1) + '" x2="' + (w - 12) + '" y2="' + y.toFixed(1) + '" stroke="#e3dcc8" stroke-width="1"/>' +
      '<text x="' + (padL - 6) + '" y="' + (y + 4).toFixed(1) + '" text-anchor="end" font-size="11" fill="#6b6f60">' + money(val) + '</text>';
  }).join("");
  const legend = '<g font-size="12" fill="#22291f">' +
    '<rect x="' + padL + '" y="0" width="12" height="12" rx="2" fill="#1e4d2e"/>' +
    '<text x="' + (padL + 17) + '" y="11">Income</text>' +
    '<rect x="' + (padL + 82) + '" y="0" width="12" height="12" rx="2" fill="#c8912a"/>' +
    '<text x="' + (padL + 99) + '" y="11">Spending</text></g>';
  return '<svg viewBox="0 0 ' + w + ' ' + h + '" width="100%" role="img" aria-label="Bar chart of monthly income and spending, June to November 2026">' +
    legend + grid + bars +
    '<line x1="' + padL + '" y1="' + (padT + chartH) + '" x2="' + (w - 12) + '" y2="' + (padT + chartH) + '" stroke="#cfc6a8" stroke-width="1"/></svg>';
}
