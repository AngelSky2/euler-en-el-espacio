// charts.js — gráfico de líneas SVG genérico (sin dependencias)
const NS = "http://www.w3.org/2000/svg";
const el = (tag, attrs = {}, text) => {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (text !== undefined) e.textContent = text;
  return e;
};
function ticks(lo, hi, count = 6) {
  const raw = (hi - lo) / count, mag = 10 ** Math.floor(Math.log10(raw || 1));
  const step = [1, 2, 2.5, 5, 10].map((f) => f * mag).find((s) => s >= raw) || raw;
  const out = [];
  for (let t = Math.ceil(lo / step) * step; t <= hi + step * 1e-9; t += step) out.push(+t.toPrecision(10));
  return out;
}
/**
 * series: [{ name, x:[], y:[], color, dash, markers, width }]
 * opts: { xLabel, yLabel, logY, hlines:[{y,label,color}] }
 */
export function lineChart(container, series, opts = {}) {
  const W = 760, H = 360, m = { l: 66, r: 18, t: 18, b: 46 };
  const tr = (v) => (opts.logY ? Math.log10(Math.max(v, 1e-300)) : v);
  const xs = series.flatMap((s) => s.x), ys = series.flatMap((s) => s.y.filter((v) => Number.isFinite(v) && (!opts.logY || v > 0)).map(tr));
  (opts.hlines || []).forEach((h) => ys.push(tr(h.y)));
  let x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  if (opts.logY) { y0 = Math.floor(y0); y1 = Math.ceil(y1); if (y1 === y0) y1 = y0 + 1; }
  else { const p = (y1 - y0 || Math.abs(y1) || 1) * 0.06; y0 -= p; y1 += p; if (opts.yMin !== undefined) y0 = Math.min(y0, opts.yMin); }
  if (x1 === x0) x1 = x0 + 1;
  const X = (v) => m.l + ((v - x0) / (x1 - x0)) * (W - m.l - m.r);
  const Y = (v) => m.t + ((y1 - tr(v)) / (y1 - y0)) * (H - m.t - m.b);
  const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, class: "chart", role: "img", "aria-label": opts.title || "gráfico" });
  const g = el("g", { class: "axis" });
  const yt = opts.logY ? Array.from({ length: y1 - y0 + 1 }, (_, i) => y0 + i).filter((_, i, a) => a.length < 10 || i % 2 === 0) : ticks(y0, y1);
  for (const t of yt) {
    const yy = opts.logY ? m.t + ((y1 - t) / (y1 - y0)) * (H - m.t - m.b) : Y(t);
    g.append(el("line", { x1: m.l, x2: W - m.r, y1: yy, y2: yy, class: "grid" }));
    g.append(el("text", { x: m.l - 6, y: yy + 4, "text-anchor": "end" }, opts.logY ? `1e${t}` : (+t.toPrecision(6)).toString()));
  }
  for (const t of ticks(x0, x1, 8)) {
    g.append(el("line", { x1: X(t), x2: X(t), y1: m.t, y2: H - m.b, class: "grid v" }));
    g.append(el("text", { x: X(t), y: H - m.b + 16, "text-anchor": "middle" }, (+t.toPrecision(6)).toString()));
  }
  if (opts.xLabel) g.append(el("text", { x: (W + m.l) / 2, y: H - 6, "text-anchor": "middle", class: "axis-title" }, opts.xLabel));
  if (opts.yLabel) g.append(el("text", { x: 14, y: H / 2, transform: `rotate(-90 14 ${H / 2})`, "text-anchor": "middle", class: "axis-title" }, opts.yLabel));
  svg.append(g);
  for (const h of opts.hlines || []) {
    svg.append(el("line", { x1: m.l, x2: W - m.r, y1: Y(h.y), y2: Y(h.y), stroke: h.color || "currentColor", "stroke-dasharray": "5 4", "stroke-width": 1.5 }));
    svg.append(el("text", { x: W - m.r - 4, y: Y(h.y) - 5, "text-anchor": "end", fill: h.color || "currentColor", "font-size": 12 }, h.label));
  }
  for (const s of series) {
    const pts = s.x.map((x, i) => [x, s.y[i]]).filter(([, y]) => Number.isFinite(y) && (!opts.logY || y > 0));
    if (!pts.length) continue;
    svg.append(el("path", { d: pts.map(([x, y], i) => `${i ? "L" : "M"}${X(x).toFixed(1)},${Y(y).toFixed(1)}`).join(""), fill: "none", stroke: s.color, "stroke-width": s.width || 2.4, "stroke-dasharray": s.dash || "", "stroke-linejoin": "round" }));
    if (s.markers && pts.length <= 80) for (const [x, y] of pts) {
      const c = el("circle", { cx: X(x), cy: Y(y), r: 3.4, fill: s.color });
      c.append(el("title", {}, `${s.name}: t=${(+x.toPrecision(6))}, ${(+y.toPrecision(8))}`));
      svg.append(c);
    }
  }
  const leg = document.createElement("div");
  leg.className = "legend";
  leg.innerHTML = series.map((s) => `<span><i style="background:${s.color}"></i>${s.name}</span>`).join("");
  container.replaceChildren(svg, leg);
}
