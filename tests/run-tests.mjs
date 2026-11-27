import { DEFAULTS as p, circularOrbit, reentry } from "../js/orbit.js";
import { exact, exactHeight, integrate, reference, analyticParams } from "../js/launch.js";
let ok = 0, n = 0;
const check = (name, c, info = "") => { n++; if (c) ok++; console.log(`${c ? "✔" : "✘"} ${name} ${info}`); };
// --- Lanzamiento (desafío principal)
const L = { E: 100, m: 5, q: 0, k: 0.05, g: 9.81, T: 15 };
const ap = analyticParams(L), ex = exact(L);
check("Velocidad límite √1019", Math.abs(ap.a - Math.sqrt(1019)) < 1e-12, ap.a.toFixed(4));
check("v(0) = 0", ex(0) === 0);
const dt = 1e-6, t = 4, res = Math.abs((ex(t + dt) - ex(t - dt)) / (2 * dt) - (L.E / L.m - L.g - (L.k / L.m) * ex(t) ** 2));
check("La analítica cumple la EDO", res < 1e-6, res.toExponential(2));
const e1 = integrate(L, 1);
check("Euler h=1 paso 1 = 10.19", Math.abs(e1.vs[1] - 10.19) < 1e-12);
check("Euler h=1 paso 2 = 19.341639", Math.abs(e1.vs[2] - 19.341639) < 1e-6, e1.vs[2].toFixed(6));
check("Euler h=1 paso 3 = 25.790649", Math.abs(e1.vs[3] - 25.790649) < 1e-6, e1.vs[3].toFixed(6));
const maxErr = (h) => { const s = integrate(L, h); return Math.max(...s.ts.map((t, i) => Math.abs(ex(t) - s.vs[i]))); };
check("Euler orden 1 (E(0.2)/E(0.1) ≈ 2)", Math.abs(maxErr(0.2) / maxErr(0.1) - 2) < 0.15, (maxErr(0.2) / maxErr(0.1)).toFixed(3));
check("Altura y(15) ≈ 409.5 m", Math.abs(exactHeight(L)(15) - 409.52) < 0.01);
const e42 = exact({ ...L, E: 0 });
check("E = 0 reproduce el ejercicio 42", Math.abs(e42(15) + 31.315719) < 1e-5, e42(15).toFixed(6));
const LV = { ...L, q: 0.15 }, rv = reference(LV), ev = integrate(LV, 0.1);
check("Masa variable: Euler h=0.1 cerca de RK4", Math.abs(ev.vs.at(-1) - rv.v(15)) < 0.01, `${ev.vs.at(-1).toFixed(4)} vs ${rv.v(15).toFixed(4)}`);
// --- Ampliación: reentrada
const e10 = circularOrbit(p, "euler", 10), e5 = circularOrbit(p, "euler", 5);
check("Órbita: Euler orden 1", Math.abs(e10.posErr / e5.posErr - 2) < 0.3, (e10.posErr / e5.posErr).toFixed(2));
const ref = reentry(p, "rk4", 0.05, { store: false }), eu = reentry(p, "euler", 0.02, { store: false });
check("Reentrada: Euler h=0.02 error < 10 km", Math.abs(eu.final.range - ref.final.range) < 1e4);
console.log(`\n${ok}/${n} pruebas superadas`); process.exit(ok === n ? 0 : 1);
