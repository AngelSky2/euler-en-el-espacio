import { exact, exactHeight, integrate, reference, validate, analyticParams } from "./launch.js";
import { lineChart } from "./charts.js";

const STUDENT = { nombre: "Alejandro Angel Cruz Chacón", materia: "Métodos Numéricos", repo: "https://github.com/AngelSky2/euler-en-el-espacio" };
const $ = (s) => document.querySelector(s);
const ids = ["E", "m", "q", "k", "g", "T", "h", "h2"];
const fmt = (v, p = 6) => (v === null || !Number.isFinite(v) ? "—" : v === 0 ? "0" : Math.abs(v) < 1e-4 ? v.toExponential(2) : (+v.toPrecision(p)).toString());
const kpi = (l, v, s = "", c = "") => `<div class="kpi ${c}"><div class="kpi-l">${l}</div><div class="kpi-v">${v}</div><div class="kpi-s">${s}</div></div>`;
const PRESETS = {
  modelo: { E: 100, m: 5, q: 0, k: 0.05, g: 9.81, T: 15, h: 1, h2: 0.1 },
  ej42: { E: 0, m: 5, q: 0, k: 0.05, g: 9.81, T: 15, h: 1, h2: 0.1 },
  redstone: { E: 350000, m: 28000, q: 0, k: 0.75, g: 9.81, T: 60, h: 5, h2: 1 },
  gordo: { E: 100, m: 5, q: 0, k: 0.05, g: 9.81, T: 15, h: 2, h2: 0.5 },
};
const BASE = PRESETS.modelo;

function read() {
  const p = {};
  ids.forEach((k) => { const r = $("#" + k).value.trim().replace(",", "."); p[k] = r === "" ? NaN : Number(r); });
  return p;
}

/** Euler con paso h comparado con la referencia (analítica o RK4 fino) */
export function study(p, h, ref = reference(p)) {
  const s = integrate(p, h, "euler");
  const rows = s.ts.map((t, i) => {
    const vr = ref.v(t), ea = Math.abs(vr - s.vs[i]);
    return { i, t, vE: s.vs[i], vr, ea, er: vr !== 0 ? (ea / Math.abs(vr)) * 100 : null, yE: s.ys[i] };
  });
  let max = 0, tMax = 0, maxRel = 0;
  rows.forEach((r) => { if (r.ea > max) { max = r.ea; tMax = r.t; } if (r.er !== null) maxRel = Math.max(maxRel, r.er); });
  return { h, rows, max, tMax, maxRel, ref };
}

function run() {
  const p = read(), errs = validate(p), box = $("#valBox");
  ids.forEach((k) => $("#" + k).classList.toggle("invalid", !Number.isFinite(p[k])));
  if (errs.length) { box.className = "alert error"; box.innerHTML = `<b>Revise los datos:</b><ul>${errs.map((e) => `<li>${e}</li>`).join("")}</ul>`; return; }
  const ref = reference(p), ap = analyticParams(p);
  const A = study(p, p.h, ref), B = study(p, p.h2, ref);
  box.className = "alert ok";
  box.innerHTML = `✔ f(t, v) = E/m − g − (k/m)v² ${p.q ? `con m(t) = ${p.m} − ${p.q}·t` : `= ${fmt(p.E / p.m - p.g, 5)} − ${fmt(p.k / p.m, 4)}·v²`} · referencia: <b>${ref.kind}</b>${p.q ? "" : ` · v(t) = ${ap.s < 0 ? "−" : ""}${fmt(ap.a, 6)}·tanh(${fmt(ap.b, 6)}·t)`}`;
  if (p.E > 0 && p.E < p.m * p.g) box.innerHTML += `<br><span class="bad">El empuje es menor que el peso (E &lt; mg): el cohete no despega y el modelo describe una caída.</span>`;
  const vT = ref.v(p.T), yEx = exactHeight(p);
  $("#kpis").innerHTML =
    kpi(p.E >= p.m * p.g ? "Velocidad límite" : "Velocidad terminal", p.q ? "variable" : `${fmt(ap.a, 5)} m/s`, p.q ? "cambia al bajar la masa" : `√(|E − mg|/k)`) +
    kpi(`v(${p.T}) ${ref.kind}`, fmt(vT, 6), "m/s") +
    kpi(`v(${p.T}) Euler h = ${p.h}`, fmt(A.rows.at(-1).vE, 6), "m/s") +
    kpi("Error máx. Euler", fmt(A.max, 4), `${fmt(A.maxRel, 3)} % en t = ${fmt(A.tMax, 3)} s`, A.maxRel < 1 ? "good" : "bad") +
    kpi(`Altura en ${p.T} s`, yEx ? `${fmt(yEx(p.T), 5)} m` : `${fmt(integrate(p, Math.min(0.001, p.T / 20000), "rk4").ys.at(-1), 5)} m`, yEx ? "exacta (a/b)·ln cosh(bt)" : "RK4 fino");
  const tt = Array.from({ length: 301 }, (_, i) => (i * p.T) / 300);
  lineChart($("#chartV"), [
    { name: ref.kind === "analítica" ? "Analítica" : "Referencia RK4", x: tt, y: tt.map(ref.v), color: "var(--c1)" },
    { name: `Euler h = ${p.h}`, x: A.rows.map((r) => r.t), y: A.rows.map((r) => r.vE), color: "var(--c2)", dash: "6 4", markers: true },
    { name: `Euler h₂ = ${p.h2}`, x: B.rows.map((r) => r.t), y: B.rows.map((r) => r.vE), color: "var(--c3)", dash: "2 3" },
  ], { xLabel: "t (s)", yLabel: "v (m/s)", hlines: p.q ? [] : [{ y: ap.s * ap.a, label: `${ap.s < 0 ? "−" : ""}v límite = ${fmt(ap.s * ap.a, 5)} m/s`, color: "var(--bad)" }] });
  const pos = (a) => a.map((v) => (v > 0 ? v : NaN));
  lineChart($("#chartE"), [
    { name: `h = ${p.h}`, x: A.rows.map((r) => r.t), y: pos(A.rows.map((r) => r.ea)), color: "var(--c2)", markers: true },
    { name: `h₂ = ${p.h2}`, x: B.rows.map((r) => r.t), y: pos(B.rows.map((r) => r.ea)), color: "var(--c3)" },
  ], { xLabel: "t (s)", yLabel: "|v_ref − v_Euler| (m/s)", logY: true });
  const hs = [2, 1, 0.5, 0.25, 0.1, 0.05, 0.02].filter((h) => h <= p.T);
  const sims = hs.map((h) => study(p, h, ref));
  const ok1 = sims.find((s) => s.maxRel < 1);
  $("#cmp").innerHTML = `<table class="tbl"><thead><tr><th>h (s)</th><th>pasos</th><th>E<sub>máx</sub> (m/s)</th><th>E<sub>rel</sub> máx</th><th>E(h)/E(h/2)</th></tr></thead><tbody>
    ${sims.map((s, i) => `<tr><td>${s.h}</td><td>${s.rows.length - 1}</td><td class="mono">${fmt(s.max, 4)}</td><td class="mono ${s.maxRel < 1 ? "good" : ""}">${fmt(s.maxRel, 3)} %</td><td>${i && hs[i - 1] === 2 * s.h ? fmt(sims[i - 1].max / s.max, 3) : "—"}</td></tr>`).join("")}</tbody></table>
    <p>${ok1 ? `Para un error relativo máximo &lt; 1 % Euler necesita <b>h ≤ ${ok1.h} s</b> (${ok1.rows.length - 1} pasos).` : "Ningún paso de la lista logra un error menor al 1 %."} Euler es de orden 1: al dividir h entre 2, el error se divide ≈ entre 2.</p>`;
  $("#table").innerHTML = `<table class="tbl"><thead><tr><th>n</th><th>t (s)</th><th>v Euler</th><th>v ${ref.kind === "analítica" ? "exacta" : "referencia"}</th><th>E abs</th><th>E rel %</th><th>altura Euler (m)</th></tr></thead><tbody>
    ${A.rows.map((r) => `<tr><td>${r.i}</td><td>${fmt(r.t)}</td><td class="mono">${r.vE.toFixed(6)}</td><td class="mono">${(r.vr + 0).toFixed(6)}</td><td class="mono">${r.ea.toFixed(6)}</td><td class="mono">${r.er === null ? "no def." : r.er.toFixed(4)}</td><td class="mono">${r.yE.toFixed(3)}</td></tr>`).join("")}</tbody></table>`;
}

function renderMass() {
  const pc = { ...BASE }, pv = { ...BASE, q: 0.15 };
  const refV = reference(pv), exC = exact(pc);
  const rows = [1, 0.5, 0.1].map((h) => study(pv, h, refV));
  $("#massTable").innerHTML = `<table class="tbl"><thead><tr><th>h (s)</th><th>v(15) Euler</th><th>E<sub>máx</sub> (m/s)</th><th>E<sub>rel</sub> máx</th></tr></thead><tbody>
    ${rows.map((s) => `<tr><td>${s.h}</td><td class="mono">${s.rows.at(-1).vE.toFixed(4)}</td><td class="mono">${fmt(s.max, 4)}</td><td class="mono">${fmt(s.maxRel, 3)} %</td></tr>`).join("")}
    <tr><td>Referencia</td><td class="mono">${refV.v(15).toFixed(4)}</td><td colspan="2" class="muted" style="text-align:left">RK4, h = 0,001 s</td></tr></tbody></table>
    <p class="muted">Con masa variable el comportamiento del error es el mismo: orden 1, máximo cerca de t ≈ 3 s. Euler sigue funcionando aunque ya no haya fórmula.</p>`;
  const tt = Array.from({ length: 301 }, (_, i) => (i * 15) / 300);
  const e1 = integrate(pv, 1);
  lineChart($("#massChart"), [
    { name: "Masa constante (analítica)", x: tt, y: tt.map(exC), color: "var(--c1)" },
    { name: "Masa variable (referencia RK4)", x: tt, y: tt.map(refV.v), color: "var(--c4)" },
    { name: "Masa variable · Euler h = 1", x: e1.ts, y: e1.vs, color: "var(--c2)", dash: "6 4", markers: true },
  ], { xLabel: "t (s)", yLabel: "v (m/s)" });
  return { refV, rows };
}

function renderAnswers(mass) {
  const p = BASE, ap = analyticParams(p), ex = exact(p), yEx = exactHeight(p), ref = reference(p);
  const s1 = study(p, 1, ref), s01 = study(p, 0.1, ref);
  const hs = [2, 1, 0.5, 0.25, 0.1, 0.05, 0.02], ok1 = hs.map((h) => study(p, h, ref)).find((s) => s.maxRel < 1);
  const e42 = analyticParams(PRESETS.ej42);
  const Q = [
    ["1. ¿Qué velocidad tiene el cohete a los 15 s? ¿Existe una velocidad máxima?",
      `v(15) = 31,9218·tanh(0,3192·15) = <b>${fmt(ex(15), 6)} m/s</b>. Sí: la velocidad <b>límite</b> es v<sub>L</sub> = √((E − mg)/k) = <b>${fmt(ap.a, 5)} m/s</b> (≈ ${fmt(ap.a * 3.6, 4)} km/h). Se alcanza cuando el empuje equilibra al peso más el arrastre. A los 15 s el cohete ya va al ${fmt((100 * ex(15)) / ap.a, 5)} % de ese valor.`],
    ["2. ¿Qué altura alcanza en 15 s?",
      `y(t) = (a/b)·ln cosh(bt) ⇒ <b>y(15) ≈ ${fmt(yEx(15), 5)} m</b>. Los primeros segundos acelera casi a 1 g y después sube a velocidad casi constante, ≈ 32 m por segundo.`],
    ["3. ¿Qué paso h garantiza un error menor al 1 % con Euler?",
      `Con h = 1 s el error máximo es ${fmt(s1.max, 4)} m/s (${fmt(s1.maxRel, 3)} %) en t ≈ ${fmt(s1.tMax, 2)} s, y con h = 0,1 s es ${fmt(s01.max, 3)} m/s (${fmt(s01.maxRel, 3)} %). Se necesita <b>h ≤ ${ok1 ? ok1.h : "—"} s</b>, es decir ${ok1 ? ok1.rows.length - 1 : "—"} pasos para 15 s. Es mucho trabajo a mano, y por eso hacían falta equipos de computadoras humanas y después las máquinas IBM.`],
    ["4. ¿Por qué Euler sobreestima la velocidad al inicio?",
      `Porque usa la aceleración del inicio de cada paso, cuando el cohete va más lento y el arrastre es menor. Así supone más aceleración de la real. Cuando el cohete se acerca a la velocidad límite la aceleración tiende a 0 y Euler y la solución exacta coinciden.`],
    ["5. ¿Cómo se comprueba que la solución analítica es correcta?",
      `Por sustitución: m·dv/dt = m·a·b·sech²(bt) = (E − mg)·sech²(bt), y (E − mg) − kv² = (E − mg)(1 − tanh²(bt)) = (E − mg)·sech²(bt) ✔. Además v(0) = 0 ✔. El simulador muestra que Euler converge a ella al reducir h.`],
    ["6. ¿Qué relación tiene con el ejercicio 42 (asteroide)?",
      `Es la misma ecuación con una fuerza más. Con E = 0 queda m dv/dt = −mg − k|v|v, cuya solución es v = −${fmt(e42.a, 5)}·tanh(${fmt(e42.b, 5)}·t): exactamente el ejercicio 42. El cohete sube hasta su velocidad límite y el fragmento de asteroide cae hasta su velocidad terminal. Los dos los limita el aire.`],
    ["7. ¿Por qué Katherine Johnson necesitó Euler y no una fórmula?",
      `Porque en un lanzamiento real <b>la masa cambia</b> (el cohete quema toneladas de combustible), la densidad del aire baja con la altura y la trayectoria se curva. La ecuación deja de tener solución analítica (sección 7). Euler solo necesita poder evaluar la derivada, así que funciona igual: con masa variable da v(15) = ${fmt(mass.rows[2].rows.at(-1).vE, 5)} m/s (h = 0,1) frente a ${fmt(mass.refV.v(15), 5)} m/s de referencia.`],
    ["8. ¿Qué enseña la película sobre los métodos numéricos?",
      `(a) Un método sencillo y bien entendido resuelve problemas reales. (b) <b>Hay que verificar</b> los resultados: Glenn pidió que Katherine revisara los cálculos de la IBM, igual que aquí verificamos Euler contra la solución exacta. (c) Conocer el error y elegir bien el paso h es tan importante como el resultado.`],
  ];
  $("#answers").innerHTML = Q.map(([q, r]) => `<div class="answer"><h4>${q}</h4><p>${r}</p></div>`).join("");
  $("#concl").innerHTML = `<ul>
    <li>La ecuación del lanzamiento con masa constante tiene solución analítica <b>v(t) = 31,92·tanh(0,3192 t)</b>. El cohete se acerca a una velocidad límite de 31,92 m/s y sube ≈ 410 m en 15 s.</li>
    <li>Euler reproduce la solución, pero con h = 1 s sobreestima la velocidad hasta ${fmt(s1.maxRel, 3)} %. Para un error menor al 1 % hace falta <b>h ≤ ${ok1 ? ok1.h : "—"} s</b>. El error es proporcional a h (orden 1).</li>
    <li>Es el mismo problema del asteroide con un motor agregado: con E = 0 se recupera el ejercicio 42.</li>
    <li>Cuando el cohete pierde masa la fórmula desaparece y Euler sigue funcionando. Esa es la idea que la película atribuye a Katherine Johnson.</li>
    <li>Limitaciones: ascenso vertical, densidad y g constantes, masa constante en el modelo base y parámetros hipotéticos.</li>
  </ul>`;
  return { ok1, s1 };
}

ids.forEach((k) => $("#" + k).addEventListener("input", run));
document.querySelectorAll("[data-preset]").forEach((b) => b.addEventListener("click", () => { const pr = PRESETS[b.dataset.preset]; ids.forEach((k) => ($("#" + k).value = pr[k])); run(); }));
$("#studentLine").textContent = `${STUDENT.nombre} · ${STUDENT.materia} · Carrera de Informática, UMSA`;
$("#footer").innerHTML = `${STUDENT.nombre} · Euler en el espacio · ${STUDENT.materia} · <a href="${STUDENT.repo}">Repositorio</a>`;
run();
const mass = renderMass();
const ans = renderAnswers(mass);
const apB = analyticParams(BASE);
$("#heroKpis").innerHTML = kpi("Velocidad límite", `${apB.a.toFixed(2)} m/s`, "√((E − mg)/k)") + kpi("Solución analítica", "v = 31,92·tanh(0,3192 t)", "m/s") + kpi("v(15 s)", `${exact(BASE)(15).toFixed(3)} m/s`, `altura ≈ ${exactHeight(BASE)(15).toFixed(0)} m`) + kpi("Paso de Euler para < 1 %", `h ≤ ${ans.ok1 ? ans.ok1.h : "—"} s`, "", "good");
