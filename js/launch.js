// =====================================================================
// launch.js — Lanzamiento vertical de un cohete (sin DOM)
//   m(t) dv/dt = E − m(t) g − k |v| v ,   v(0) = 0 ,   m(t) = m0 − q t
// Con q = 0 (masa constante) tiene solución analítica:
//   v(t) = s · a · tanh(b t),  s = signo(E − m g),
//   a = √(|E − m g| / k),  b = √(k |E − m g|) / m
// E = 0 reproduce el ejercicio 42 (caída libre con arrastre).
// =====================================================================
export const mass = (p, t) => Math.max(p.m - (p.q || 0) * t, 1e-9);
export const F = (p) => (t, v) => p.E / mass(p, t) - p.g - (p.k / mass(p, t)) * Math.abs(v) * v;

export function analyticParams(p) {
  const net = p.E - p.m * p.g, s = Math.sign(net) || 0;
  const a = Math.sqrt(Math.abs(net) / p.k), b = Math.sqrt(p.k * Math.abs(net)) / p.m;
  return { s, a, b, net };
}
/** Solución exacta (solo masa constante y v0 = 0); null si no aplica */
export function exact(p) {
  if (p.q) return null;
  const { s, a, b } = analyticParams(p);
  return (t) => s * a * Math.tanh(b * t);
}
/** Altura exacta con masa constante: y = s (a/b) ln cosh(b t) */
export function exactHeight(p) {
  if (p.q) return null;
  const { s, a, b } = analyticParams(p);
  return (t) => (s * a / b) * Math.log(Math.cosh(b * t));
}

const stepEuler = (f, t, v, h) => v + h * f(t, v);
const stepRK4 = (f, t, v, h) => {
  const k1 = f(t, v), k2 = f(t + h / 2, v + (h / 2) * k1), k3 = f(t + h / 2, v + (h / 2) * k2), k4 = f(t + h, v + h * k3);
  return v + (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
};

export function integrate(p, h, method = "euler") {
  const f = F(p), step = method === "rk4" ? stepRK4 : stepEuler;
  const ts = [0], vs = [0], ys = [0];
  let t = 0;
  while (t < p.T - 1e-12) {
    const hh = Math.min(h, p.T - t), v = vs.at(-1), vn = step(f, t, v, hh);
    ys.push(ys.at(-1) + hh * (method === "rk4" ? (v + vn) / 2 : v));
    vs.push(vn); t = +(t + hh).toFixed(12); ts.push(t);
  }
  return { ts, vs, ys };
}

/** Referencia: exacta si existe; si no, RK4 con paso muy fino */
export function reference(p) {
  const ex = exact(p);
  if (ex) return { kind: "analítica", v: ex };
  const hRef = Math.min(1e-3, p.T / 20000), R = integrate(p, hRef, "rk4");
  return { kind: "RK4 (h fino)", v: (t) => { const i = Math.min(R.ts.length - 1, Math.round(t / hRef)); return R.vs[i]; } };
}

export function validate(p) {
  const e = [], ok = (v) => typeof v === "number" && Number.isFinite(v);
  if (!ok(p.E) || p.E < 0) e.push("El empuje E debe ser ≥ 0 N.");
  if (!ok(p.m) || p.m <= 0) e.push("La masa m debe ser > 0 kg.");
  if (!ok(p.q) || p.q < 0) e.push("El consumo q debe ser ≥ 0 kg/s.");
  if (!ok(p.k) || p.k <= 0) e.push("k debe ser > 0 kg/m.");
  if (!ok(p.g) || p.g <= 0) e.push("g debe ser > 0 m/s².");
  if (!ok(p.T) || p.T <= 0 || p.T > 1000) e.push("T debe estar entre 0 y 1000 s.");
  if (ok(p.q) && ok(p.m) && ok(p.T) && p.q * p.T >= p.m) e.push("Con ese consumo q el cohete se queda sin masa antes de T (q·T debe ser < m).");
  for (const key of ["h", "h2"]) if (!ok(p[key]) || p[key] <= 0 || (ok(p.T) && (p[key] > p.T || p.T / p[key] > 100000))) e.push(`${key === "h" ? "h" : "h₂"} debe cumplir 0 < h ≤ T (máx. 100 000 pasos).`);
  return e;
}
