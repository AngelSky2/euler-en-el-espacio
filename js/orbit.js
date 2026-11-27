// =====================================================================
// orbit.js — Mecánica orbital plana + reentrada atmosférica (sin DOM)
// Estado Y = [x, y, vx, vy] (m, m/s), Tierra en el origen, sin rotación.
//   r'' = −μ r/|r|³ − (ρ(h) C_d A / 2m) |v| v
// =====================================================================
export const MU = 3.986004418e14;   // m³/s²  (G·M Tierra)
export const RE = 6371e3;           // m      radio medio terrestre
export const G0 = 9.80665;

export const DEFAULTS = {
  alt0: 200,      // km   altitud de la órbita circular inicial
  dv: 150,        // m/s  impulso de los retrocohetes (opuesto a la velocidad)
  m: 1355,        // kg   masa de la cápsula Mercury
  A: 2.8,         // m²   área frontal (diámetro 1,89 m)
  Cd: 1.5,        // —    coeficiente de arrastre del escudo
  rho0: 1.225,    // kg/m³ densidad al nivel del mar
  H: 7.2,         // km   altura de escala de la atmósfera
  hChute: 3,      // km   apertura del paracaídas principal (fin de la simulación)
};

export const density = (p, h) => (h > 300e3 ? 0 : p.rho0 * Math.exp(-h / (p.H * 1e3)));

export function deriv(p, drag = true) {
  const kd = (p.Cd * p.A) / (2 * p.m);
  return (t, [x, y, vx, vy]) => {
    const r = Math.hypot(x, y), r3 = r * r * r;
    let ax = (-MU * x) / r3, ay = (-MU * y) / r3;
    if (drag) {
      const v = Math.hypot(vx, vy), c = kd * density(p, r - RE) * v;
      ax -= c * vx; ay -= c * vy;
    }
    return [vx, vy, ax, ay];
  };
}

const addS = (Y, h, K) => Y.map((v, i) => v + h * K[i]);
export const STEPPERS = {
  euler: (f, t, Y, h) => addS(Y, h, f(t, Y)),
  heun: (f, t, Y, h) => { const k1 = f(t, Y), k2 = f(t + h, addS(Y, h, k1)); return Y.map((v, i) => v + (h / 2) * (k1[i] + k2[i])); },
  rk4: (f, t, Y, h) => {
    const k1 = f(t, Y), k2 = f(t + h / 2, addS(Y, h / 2, k1)), k3 = f(t + h / 2, addS(Y, h / 2, k2)), k4 = f(t + h, addS(Y, h, k3));
    return Y.map((v, i) => v + (h / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
  },
};
export const METHOD_NAMES = { euler: "Euler", heun: "Heun (Euler mejorado)", rk4: "Runge-Kutta 4" };

export const energy = ([x, y, vx, vy]) => 0.5 * (vx * vx + vy * vy) - MU / Math.hypot(x, y);

/** Parte A: órbita circular sin atmósfera. Solución analítica conocida. */
export function circularOrbit(p, method, h, nOrbits = 1) {
  const r0 = RE + p.alt0 * 1e3, v0 = Math.sqrt(MU / r0), w = v0 / r0, Tp = (2 * Math.PI) / w;
  const f = deriv(p, false), step = STEPPERS[method];
  let Y = [r0, 0, 0, v0], t = 0;
  const tEnd = nOrbits * Tp, out = [{ t, Y }];
  while (t < tEnd - 1e-9) { const hh = Math.min(h, tEnd - t); Y = step(f, t, Y, hh); t += hh; out.push({ t, Y }); }
  const exact = (tt) => [r0 * Math.cos(w * tt), r0 * Math.sin(w * tt)];
  const [ex, ey] = exact(t);
  const posErr = Math.hypot(Y[0] - ex, Y[1] - ey);
  const E0 = energy(out[0].Y), E1 = energy(Y);
  return { out, r0, v0, period: Tp, posErr, altErr: Math.hypot(Y[0], Y[1]) - r0, dE: (E1 - E0) / Math.abs(E0), exact };
}

/** Parte B: retrofrenado + reentrada. Termina al llegar a hChute. */
export function reentry(p, method, h, { tMax = 6000, store = true } = {}) {
  const r0 = RE + p.alt0 * 1e3, v0 = Math.sqrt(MU / r0);
  const f = deriv(p, true), step = STEPPERS[method];
  let Y = [r0, 0, 0, v0 - p.dv], t = 0;
  const hEnd = p.hChute * 1e3;
  const out = store ? [] : null;
  let maxG = 0, tMaxG = 0, maxQ = 0, prev = null;
  const rec = (t, Y) => {
    const r = Math.hypot(Y[0], Y[1]), alt = r - RE, v = Math.hypot(Y[2], Y[3]);
    const rho = density(p, alt), dragAcc = (rho * v * v * p.Cd * p.A) / (2 * p.m);
    if (dragAcc / G0 > maxG) { maxG = dragAcc / G0; tMaxG = t; }
    maxQ = Math.max(maxQ, 0.5 * rho * v * v);
    const ang = Math.atan2(Y[1], Y[0]);
    const rec = { t, alt, v, g: dragAcc / G0, range: (ang < 0 ? ang + 2 * Math.PI : ang) * RE, x: Y[0], y: Y[1] };
    if (store) out.push(rec);
    return rec;
  };
  prev = rec(t, Y);
  while (t < tMax) {
    const Yn = step(f, t, Y, h), tn = t + h;
    const altN = Math.hypot(Yn[0], Yn[1]) - RE;
    if (!Number.isFinite(altN)) break;
    if (altN <= hEnd) {               // interpolar el cruce con hChute
      const s = (prev.alt - hEnd) / (prev.alt - altN);
      const Yc = Y.map((v, i) => v + s * (Yn[i] - v));
      const last = rec(t + s * h, Yc);
      return { ok: true, out, final: last, maxG, tMaxG, maxQ, steps: Math.round(t / h) + 1 };
    }
    Y = Yn; t = tn; prev = rec(t, Y);
  }
  return { ok: false, out, final: prev, maxG, tMaxG, maxQ, steps: Math.round(t / h) };
}

/** Velocidad terminal a altura h (conexión con el problema del asteroide) */
export const terminalV = (p, hKm = 0) => Math.sqrt((2 * p.m * G0) / (density(p, hKm * 1e3) * p.Cd * p.A));
