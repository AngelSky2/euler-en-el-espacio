import { exact, exactHeight, integrate, reference, validate, analyticParams } from "./launch.js";
import { lineChart } from "./charts.js";

const STUDENT = { nombre: "Alejandro Angel Cruz Chacón", materia: "Métodos Numéricos", repo: "https://github.com/AngelSky2/euler-en-el-espacio" };
const $ = (s) => document.querySelector(s);
const ids = ["E", "m", "q", "k", "g", "T", "h", "h2"];
const fmt = (v, p = 6) => (v === null || !Number.isFinite(v) ? "—" : v === 0 ? "0" : Math.abs(v) < 1e-4 ? v.toExponential(2) : (+v.toPrecision(p)).toString());
const kpi = (l, v, s = "", c = "") => `<div class="kpi ${c}"><div class="kpi-l">${l}</div><div class="kpi-v">${v}</div><div class="kpi-s">${s}</div></div>`;
const PRESETS = {
  modelo: { E: 100, m: 5, q: 0, k: 0.05, g: 9.81, T: 20, h: 1, h2: 0.1 },
  ej42: { E: 0, m: 5, q: 0, k: 0.05, g: 9.81, T: 15, h: 1, h2: 0.1 },
  redstone: { E: 350000, m: 28000, q: 0, k: 0.75, g: 9.81, T: 60, h: 5, h2: 1 },
  gordo: { E: 100, m: 5, q: 0, k: 0.05, g: 9.81, T: 20, h: 2, h2: 0.5 },
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
  $("#massTable").innerHTML = `<table class="tbl"><thead><tr><th>h (s)</th><th>v(20) Euler</th><th>E<sub>máx</sub> (m/s)</th><th>E<sub>rel</sub> máx</th></tr></thead><tbody>
    ${rows.map((s) => `<tr><td>${s.h}</td><td class="mono">${s.rows.at(-1).vE.toFixed(4)}</td><td class="mono">${fmt(s.max, 4)}</td><td class="mono">${fmt(s.maxRel, 3)} %</td></tr>`).join("")}
    <tr><td>Referencia</td><td class="mono">${refV.v(20).toFixed(4)}</td><td colspan="2" class="muted" style="text-align:left">RK4, h = 0,001 s</td></tr></tbody></table>
    <p class="muted">Con masa variable el comportamiento del error es el mismo: orden 1, máximo cerca de t ≈ 3 s. Euler sigue funcionando aunque ya no haya fórmula.</p>`;
  const tt = Array.from({ length: 301 }, (_, i) => (i * 20) / 300);
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
    ["1. ¿Qué velocidad tiene el cohete durante los 20 s? ¿Existe una velocidad máxima?",
      `La velocidad sube rápido al principio: ${fmt(ex(1), 4)} m/s en 1 s, ${fmt(ex(3), 4)} m/s en 3 s y ${fmt(ex(5), 4)} m/s en 5 s. Al final, v(20) = 31,9218·tanh(0,3192·20) = <b>${fmt(ex(20), 6)} m/s</b>. Sí: la velocidad <b>límite</b> es v<sub>L</sub> = √((E − mg)/k) = <b>${fmt(ap.a, 5)} m/s</b> (≈ ${fmt(ap.a * 3.6, 4)} km/h). Se alcanza cuando el empuje equilibra al peso más el arrastre. A los 20 s el cohete va al ${fmt((100 * ex(20)) / ap.a, 6)} % de ese valor.`],
    ["2. ¿Qué altura alcanza en 20 s?",
      `y(t) = (a/b)·ln cosh(bt) ⇒ <b>y(20) ≈ ${fmt(yEx(20), 5)} m</b>. Euler con h = 1 da ${fmt(integrate(p, 1).ys.at(-1), 5)} m y con h = 0,1 da ${fmt(integrate(p, 0.1).ys.at(-1), 5)} m. Los primeros segundos acelera casi a 1 g y después sube a velocidad casi constante, ≈ 32 m por segundo.`],
    ["3. ¿Qué paso h garantiza un error menor al 1 % con Euler?",
      `Con h = 1 s el error máximo es ${fmt(s1.max, 4)} m/s (${fmt(s1.maxRel, 3)} %) en t ≈ ${fmt(s1.tMax, 2)} s, y con h = 0,1 s es ${fmt(s01.max, 3)} m/s (${fmt(s01.maxRel, 3)} %). Se necesita <b>h ≤ ${ok1 ? ok1.h : "—"} s</b>, es decir ${ok1 ? ok1.rows.length - 1 : "—"} pasos para 20 s. Es mucho trabajo a mano, y por eso hacían falta equipos de computadoras humanas y después las máquinas IBM.`],
    ["4. ¿Por qué Euler sobreestima la velocidad al inicio?",
      `Porque usa la aceleración del inicio de cada paso, cuando el cohete va más lento y el arrastre es menor. Así supone más aceleración de la real. Cuando el cohete se acerca a la velocidad límite la aceleración tiende a 0 y Euler y la solución exacta coinciden.`],
    ["5. ¿Cómo se comprueba que la solución analítica es correcta?",
      `Por sustitución: m·dv/dt = m·a·b·sech²(bt) = (E − mg)·sech²(bt), y (E − mg) − kv² = (E − mg)(1 − tanh²(bt)) = (E − mg)·sech²(bt) ✔. Además v(0) = 0 ✔. El simulador muestra que Euler converge a ella al reducir h.`],
    ["6. ¿Qué relación tiene con el ejercicio 42 (asteroide)?",
      `Es la misma ecuación con una fuerza más. Con E = 0 queda m dv/dt = −mg − k|v|v, cuya solución es v = −${fmt(e42.a, 5)}·tanh(${fmt(e42.b, 5)}·t): exactamente el ejercicio 42. El cohete sube hasta su velocidad límite y el fragmento de asteroide cae hasta su velocidad terminal. Los dos los limita el aire.`],
    ["7. ¿Por qué Katherine Johnson necesitó Euler y no una fórmula?",
      `Porque en un lanzamiento real <b>la masa cambia</b> (el cohete quema toneladas de combustible), la densidad del aire baja con la altura y la trayectoria se curva. La ecuación deja de tener solución analítica (sección 7). Euler solo necesita poder evaluar la derivada, así que funciona igual: con masa variable da v(20) = ${fmt(mass.rows[2].rows.at(-1).vE, 5)} m/s (h = 0,1) frente a ${fmt(mass.refV.v(20), 5)} m/s de referencia.`],
    ["8. ¿Qué enseña la película sobre los métodos numéricos?",
      `(a) Un método sencillo y bien entendido resuelve problemas reales. (b) <b>Hay que verificar</b> los resultados: Glenn pidió que Katherine revisara los cálculos de la IBM, igual que aquí verificamos Euler contra la solución exacta. (c) Conocer el error y elegir bien el paso h es tan importante como el resultado.`],
  ];
  $("#answers").innerHTML = Q.map(([q, r]) => `<div class="answer"><h4>${q}</h4><p>${r}</p></div>`).join("");
  $("#concl").innerHTML = `<ul>
    <li>La ecuación del lanzamiento con masa constante tiene solución analítica <b>v(t) = 31,92·tanh(0,3192 t)</b>. El cohete se acerca a una velocidad límite de 31,92 m/s y sube ≈ 569 m en 20 s.</li>
    <li>Euler reproduce la solución, pero con h = 1 s sobreestima la velocidad hasta ${fmt(s1.maxRel, 3)} %. Para un error menor al 1 % hace falta <b>h ≤ ${ok1 ? ok1.h : "—"} s</b>. El error es proporcional a h (orden 1).</li>
    <li>Es el mismo problema del asteroide con un motor agregado: con E = 0 se recupera el ejercicio 42.</li>
    <li>Cuando el cohete pierde masa la fórmula desaparece y Euler sigue funcionando. Esa es la idea que la película atribuye a Katherine Johnson.</li>
    <li>Limitaciones: ascenso vertical, densidad y g constantes, masa constante en el modelo base y parámetros hipotéticos.</li>
  </ul>`;
  return { ok1, s1 };
}


function renderSteps() {
  const p = BASE, h = 1, ex = exact(p), yx = exactHeight(p), wt = p.m * p.g;
  let v = 0, y = 0;
  const rows = [];
  for (let n = 0; n <= 20; n++) {
    const drag = p.k * v * v, a = p.E / p.m - p.g - (p.k / p.m) * v * v;
    rows.push({ n, t: n * h, v, a, drag, net: p.m * a, y, vx: ex(n * h), yx: yx(n * h) });
    y = y + h * v; v = v + h * a;
  }
  const phase = (r) => r.n === 0 ? "Despegue: el aire no frena (v = 0); sobran 50,95 N → a ≈ 1,04 g"
    : r.n <= 3 ? "Aceleración fuerte: el arrastre crece con v² y le quita fuerza al empuje"
    : r.n <= 6 ? "Transición: el arrastre se acerca a E − mg = 50,95 N; la aceleración cae rápido"
    : "Velocidad límite: empuje = peso + arrastre; a ≈ 0 y la altura crece ≈ 31,9 m cada segundo";
  $("#stepTable").innerHTML = `<table class="tbl"><thead><tr><th>n</th><th>t (s)</th><th>vₙ Euler (m/s)</th><th>aₙ (m/s²)</th><th>arrastre kvₙ² (N)</th><th>F neta (N)</th><th>yₙ Euler (m)</th><th>v exacta</th><th>y exacta</th><th style="text-align:left">Qué pasa físicamente</th></tr></thead><tbody>
    ${rows.map((r) => `<tr><td>${r.n}</td><td>${r.t}</td><td class="mono">${r.v.toFixed(6)}</td><td class="mono">${r.a.toFixed(6)}</td><td class="mono">${r.drag.toFixed(4)}</td><td class="mono">${r.net.toFixed(4)}</td><td class="mono">${r.y.toFixed(4)}</td><td class="mono">${r.vx.toFixed(6)}</td><td class="mono">${r.yx.toFixed(4)}</td><td style="text-align:left;font-size:13px">${phase(r)}</td></tr>`).join("")}</tbody></table>`;
  const R = (n) => rows[n];
  $("#stepPhases").innerHTML = `
  <div class="answer"><h4>Paso 0 → 1 (t = 0 a 1 s): el despegue</h4>
    Con v₀ = 0 no hay arrastre. Las fuerzas son empuje 100 N y peso ${wt.toFixed(2)} N, así que sobran 50,95 N y a₀ = 50,95/5 = <b>10,19 m/s²</b> (≈ 1,04 g).
    Euler calcula v₁ = 0 + 1·10,19 = <b>10,19 m/s</b> y y₁ = 0 + 1·v₀ = <b>0 m</b>: la altura no cambia en el primer paso porque Euler usa la velocidad del <i>inicio</i> del intervalo, que era 0. En realidad el cohete ya subió ${R(1).yx.toFixed(2)} m.</div>
  <div class="answer"><h4>Pasos 1 → 3 (t = 1 a 3 s): aceleración fuerte</h4>
    A 10,19 m/s el aire ya empuja ${R(1).drag.toFixed(2)} N hacia abajo y la aceleración baja a ${R(1).a.toFixed(2)} m/s². Euler da v₂ = 10,19 + 9,15 = ${R(2).v.toFixed(2)} m/s y y₂ = 0 + 10,19 = ${R(2).y.toFixed(2)} m.
    En t = 2 s el arrastre es ${R(2).drag.toFixed(1)} N y en t = 3 s ${R(3).drag.toFixed(1)} N: como depende de <b>v²</b>, duplicar la velocidad cuadruplica el freno. Aquí está el <b>mayor error</b> de Euler (${(R(3).v - R(3).vx).toFixed(2)} m/s en t = 3 s), porque la aceleración cambia muy rápido y Euler la mantiene fija todo el segundo.</div>
  <div class="answer"><h4>Pasos 3 → 7 (t = 3 a 7 s): transición</h4>
    El arrastre se acerca a los 50,95 N que sobran del empuje. La aceleración cae de ${R(3).a.toFixed(2)} a ${R(6).a.toFixed(3)} m/s² y la velocidad pasa de ${R(3).v.toFixed(1)} a ${R(7).v.toFixed(1)} m/s. La altura ya crece casi 30 m por segundo (y₇ = ${R(7).y.toFixed(1)} m).</div>
  <div class="answer"><h4>Pasos 7 → 20 (t = 7 a 20 s): velocidad límite (crucero)</h4>
    Empuje ≈ peso + arrastre, así que F<sub>neta</sub> ≈ 0 y a ≈ 0. La velocidad se estabiliza en <b>≈ 31,92 m/s</b> (v<sub>L</sub> = √((E − mg)/k)) y cada paso suma ≈ 31,9 m de altura: y₂₀(Euler) = <b>${R(20).y.toFixed(2)} m</b> frente a y(20) exacta = <b>${R(20).yx.toFixed(2)} m</b>. En velocidad, Euler y la solución exacta coinciden: v₂₀ = ${R(20).v.toFixed(4)} frente a ${R(20).vx.toFixed(4)} m/s.</div>
  <div class="note"><b>Balance del error de Euler:</b>
    <ul>
      <li><b>Velocidad:</b> Euler la <b>sobreestima</b> en los primeros segundos (usa la aceleración del inicio del paso, mayor que la promedio). El error llega a ${(R(3).v - R(3).vx).toFixed(2)} m/s y desaparece cuando a → 0.</li>
      <li><b>Altura:</b> Euler la <b>subestima</b> (y₂₀ queda ${(R(20).yx - R(20).y).toFixed(2)} m por debajo, ${(100 * (R(20).yx - R(20).y) / R(20).yx).toFixed(2)} %), porque usa la velocidad del inicio de cada paso, menor que la promedio mientras el cohete acelera. Ese déficit de los primeros segundos ya no se recupera.</li>
      <li>Con h = 0,1 s los errores bajan unas 10 veces (y₂₀ = ${integrate(p, 0.1).ys.at(-1).toFixed(2)} m). Euler es de orden 1.</li>
    </ul></div>`;
}

ids.forEach((k) => $("#" + k).addEventListener("input", run));
document.querySelectorAll("[data-preset]").forEach((b) => b.addEventListener("click", () => { const pr = PRESETS[b.dataset.preset]; ids.forEach((k) => ($("#" + k).value = pr[k])); run(); }));
$("#studentLine").textContent = `${STUDENT.nombre} · ${STUDENT.materia} · Carrera de Informática, UMSA`;
$("#footer").innerHTML = `${STUDENT.nombre} · Euler en el espacio · ${STUDENT.materia} · <a href="${STUDENT.repo}">Repositorio</a>`;
run();
renderSteps();
const mass = renderMass();
const ans = renderAnswers(mass);
const apB = analyticParams(BASE);
$("#heroKpis").innerHTML = kpi("Velocidad límite", `${apB.a.toFixed(2)} m/s`, "√((E − mg)/k)") + kpi("Solución analítica", "v = 31,92·tanh(0,3192 t)", "m/s") + kpi("v(20 s)", `${exact(BASE)(20).toFixed(3)} m/s`, `altura ≈ ${exactHeight(BASE)(20).toFixed(0)} m`) + kpi("Paso de Euler para < 1 %", `h ≤ ${ans.ok1 ? ans.ok1.h : "—"} s`, "", "good");
