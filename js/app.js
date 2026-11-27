import { DEFAULTS, RE, MU, circularOrbit, reentry, deriv, terminalV, density, METHOD_NAMES } from "./orbit.js";
import { lineChart } from "./charts.js";

const STUDENT = { nombre: "Angel (completar apellidos)", materia: "Métodos Numéricos", repo: "https://github.com/AngelSky2/euler-en-el-espacio" };
const $ = (s) => document.querySelector(s);
const num = (id) => { const r = $("#" + id).value.trim().replace(",", "."); return r === "" ? NaN : Number(r); };
const fmt = (v, p = 5) => (!Number.isFinite(v) ? "—" : v === 0 ? "0" : Math.abs(v) < 1e-3 || Math.abs(v) >= 1e7 ? v.toExponential(2) : (+v.toPrecision(p)).toLocaleString("es-BO"));
const km = (m, d = 1) => `${(m / 1e3).toLocaleString("es-BO", { maximumFractionDigits: d, minimumFractionDigits: d })} km`;
const kpi = (l, v, s = "", c = "") => `<div class="kpi ${c}"><div class="kpi-l">${l}</div><div class="kpi-v">${v}</div><div class="kpi-s">${s}</div></div>`;
const NS = "http://www.w3.org/2000/svg";
const debounce = (fn, ms = 200) => { let t; return () => { clearTimeout(t); t = setTimeout(fn, ms); }; };

function check(fields, box) {
  const errs = [];
  for (const [id, name, lo, hi] of fields) {
    const v = num(id), bad = !Number.isFinite(v) || v < lo || v > hi;
    $("#" + id).classList.toggle("invalid", bad);
    if (bad) errs.push(`${name} debe estar entre ${lo} y ${hi}.`);
  }
  $(box).className = errs.length ? "alert error" : "alert ok";
  $(box).innerHTML = errs.length ? `<b>Revise los datos:</b><ul>${errs.map((e) => `<li>${e}</li>`).join("")}</ul>` : "✔ Entradas válidas";
  return errs.length === 0;
}

// ---------------------------------------------------------------- Primer paso
function renderFirstStep() {
  const p = DEFAULTS, r0 = RE + p.alt0 * 1e3, v0 = Math.sqrt(MU / r0);
  const Y = [r0, 0, 0, v0 - p.dv], F = deriv(p, true)(0, Y), h = 1;
  const Y1 = Y.map((v, i) => v + h * F[i]);
  const rho = density(p, p.alt0 * 1e3);
  $("#firstStep").innerHTML = `<pre>Y₀ = (x, y, vx, vy) = (${fmt(Y[0], 8)} m, 0, 0, ${fmt(Y[3], 7)} m/s)
g(r₀) = μ/r₀² = ${fmt(MU / r0 ** 2, 5)} m/s²     ρ(200 km) = ${rho.toExponential(2)} kg/m³ (≈ 0)
ax = −μ x/r³ − arrastre = ${fmt(F[2], 6)} m/s²
ay = ${fmt(F[3], 3)} m/s²

x₁  = x₀  + h·vx₀ = ${fmt(Y1[0], 8)} m
y₁  = y₀  + h·vy₀ = ${fmt(Y1[1], 7)} m
vx₁ = vx₀ + h·ax  = ${fmt(Y1[2], 6)} m/s
vy₁ = vy₀ + h·ay  = ${fmt(Y1[3], 7)} m/s</pre>
  <p class="muted">En 1 s la cápsula avanza ${fmt(Y1[1] / 1e3, 4)} km y empieza a “caer” hacia la Tierra (v<sub>x</sub> &lt; 0). Una reentrada completa exige ≈ ${fmt(1170 / h, 4)} pasos como este. A mano es muchísimo trabajo, y por eso se pedía verificar solo los puntos clave.</p>`;
}

// ---------------------------------------------------------------- Parte A
function renderOrbit() {
  if (!check([["aAlt", "La altitud", 100, 2000], ["aH", "El paso h", 0.1, 120], ["aN", "El número de vueltas", 1, 5]], "#aVal")) return;
  const p = { ...DEFAULTS, alt0: num("aAlt") }, h = num("aH"), n = Math.round(num("aN"));
  const res = Object.fromEntries(["euler", "heun", "rk4"].map((m) => [m, circularOrbit(p, m, h, n)]));
  // gráfico de órbita (aspecto 1:1)
  const E = res.euler, W = 520, c = W / 2;
  const maxR = Math.max(E.r0, ...E.out.map((o) => Math.hypot(o.Y[0], o.Y[1]))) * 1.04;
  const s = (W / 2 - 10) / maxR, P = (x, y) => `${(c + x * s).toFixed(1)},${(c - y * s).toFixed(1)}`;
  const step = Math.max(1, Math.floor(E.out.length / 1500));
  const path = E.out.filter((_, i) => i % step === 0 || i === E.out.length - 1).map((o, i) => `${i ? "L" : "M"}${P(o.Y[0], o.Y[1])}`).join("");
  const H = res.heun.out.filter((_, i) => i % step === 0).map((o, i) => `${i ? "L" : "M"}${P(o.Y[0], o.Y[1])}`).join("");
  const last = E.out.at(-1).Y, [ex, ey] = E.exact(E.out.at(-1).t);
  $("#orbitChart").innerHTML = `<svg viewBox="0 0 ${W} ${W}" class="chart" role="img" aria-label="Órbita">
    <circle cx="${c}" cy="${c}" r="${RE * s}" fill="color-mix(in srgb, var(--c3) 22%, transparent)" stroke="var(--c3)"/>
    <text x="${c}" y="${c + 4}" text-anchor="middle" style="fill:var(--ink)">Tierra</text>
    <circle cx="${c}" cy="${c}" r="${E.r0 * s}" fill="none" stroke="var(--c1)" stroke-width="2"/>
    <path d="${H}" fill="none" stroke="var(--good)" stroke-width="1.5" stroke-dasharray="4 3"/>
    <path d="${path}" fill="none" stroke="var(--c2)" stroke-width="2"/>
    <circle cx="${c + last[0] * s}" cy="${c - last[1] * s}" r="5" fill="var(--c2)"/>
    <circle cx="${c + ex * s}" cy="${c - ey * s}" r="5" fill="var(--c1)"/>
  </svg><div class="legend"><span><i style="background:var(--c1)"></i>Analítica (círculo)</span><span><i style="background:var(--c2)"></i>Euler h = ${h} s</span><span><i style="background:var(--good)"></i>Heun h = ${h} s</span></div>`;
  $("#aTable").innerHTML = `<table class="tbl"><thead><tr><th>Método (h = ${h} s)</th><th>Error de posición</th><th>Error de altitud</th><th>ΔE/|E|</th></tr></thead><tbody>
    ${Object.entries(res).map(([m, r]) => `<tr><td>${METHOD_NAMES[m]}</td><td class="mono">${km(r.posErr, 3)}</td><td class="mono">${km(r.altErr, 3)}</td><td class="mono">${r.dE.toExponential(2)}</td></tr>`).join("")}</tbody></table>
    <p class="muted">Periodo orbital T = ${fmt(E.period / 60, 4)} min · v₀ = ${fmt(E.v0, 5)} m/s · tras ${n} vuelta(s) (${E.out.length - 1} pasos)</p>`;
  const errs1 = [10, 5, 1].map((hh) => circularOrbit(p, "euler", hh, 1).posErr);
  $("#aInterp").innerHTML = `<b>Interpretación:</b> Euler hace que la cápsula <b>gane energía en cada paso</b>, porque usa la velocidad del inicio del paso, que es tangente al círculo, y siempre se “sale” un poco. La órbita se convierte en una espiral hacia afuera. Con h = 10 s el error tras una vuelta es ${km(errs1[0], 0)}, con 5 s es ${km(errs1[1], 0)} y con 1 s es ${km(errs1[2], 0)}: aproximadamente proporcional a h (orden 1). Heun y RK4 con el mismo h tienen errores de metros. Esto explica por qué hacía falta un paso muy pequeño, o verificar los cálculos, antes de confiar la vida de un astronauta a Euler.`;
}

// ---------------------------------------------------------------- Parte B
let refCache = { key: "", ref: null };
function getRef(p) {
  const key = JSON.stringify(p);
  if (refCache.key !== key) refCache = { key, ref: reentry(p, "rk4", 0.05) };
  return refCache.ref;
}

function renderReentry() {
  if (!check([["bAlt", "La altitud", 120, 500], ["bDv", "Δv", 60, 400], ["bH", "El paso h", 0.02, 15], ["bM", "La masa", 100, 100000], ["bCdA", "Cd·A", 0.1, 100]], "#bVal")) return;
  const cda = num("bCdA");
  const p = { ...DEFAULTS, alt0: num("bAlt"), dv: num("bDv"), m: num("bM"), Cd: 1.5, A: cda / 1.5 };
  const h = num("bH");
  const ref = getRef(p);
  if (!ref.ok) {
    $("#bKpis").innerHTML = kpi("Resultado", "No reingresa", "Con este Δv la cápsula sigue en órbita durante la simulación (aumente Δv).", "bad");
    ["#chartAltRange", "#chartG", "#bTable", "#bAnswer", "#bSens", "#cTable", "#cChart"].forEach((s) => ($(s).innerHTML = ""));
    return;
  }
  const eu = reentry(p, "euler", h);
  const dRange = eu.ok ? eu.final.range - ref.final.range : NaN;
  $("#bKpis").innerHTML =
    kpi("Alcance (referencia)", km(ref.final.range, 0), "desde el retrofrenado hasta el paracaídas") +
    kpi("Duración", `${fmt(ref.final.t / 60, 3)} min`, `velocidad final ${fmt(ref.final.v, 3)} m/s`) +
    kpi("Desaceleración máx.", `${fmt(ref.maxG, 3)} g`, `en t = ${fmt(ref.tMaxG / 60, 3)} min`, ref.maxG > 12 ? "bad" : "") +
    kpi(`Error Euler (h = ${h} s)`, eu.ok ? km(Math.abs(dRange), 1) : "diverge", eu.ok ? (dRange > 0 ? "cae más lejos" : "cae más cerca") : "paso demasiado grande", eu.ok && Math.abs(dRange) < 10e3 ? "good" : "bad");
  const thin = (arr, n = 700) => arr.filter((_, i) => i % Math.max(1, Math.floor(arr.length / n)) === 0 || i === arr.length - 1);
  const R = thin(ref.out), U = eu.ok ? thin(eu.out) : [];
  lineChart($("#chartAltRange"), [
    { name: "Referencia RK4", x: R.map((o) => o.range / 1e3), y: R.map((o) => o.alt / 1e3), color: "var(--c1)" },
    ...(eu.ok ? [{ name: `Euler h = ${h} s`, x: U.map((o) => o.range / 1e3), y: U.map((o) => o.alt / 1e3), color: "var(--c2)", dash: "6 4" }] : []),
  ], { xLabel: "distancia sobre la superficie (km)", yLabel: "altitud (km)" });
  lineChart($("#chartG"), [
    { name: "Desaceleración (g)", x: R.map((o) => o.t / 60), y: R.map((o) => o.g), color: "var(--bad)" },
    { name: "Velocidad (km/s)", x: R.map((o) => o.t / 60), y: R.map((o) => o.v / 1e3), color: "var(--c3)" },
  ], { xLabel: "t (min)", yLabel: "g  ·  km/s" });

  // tabla de pasos
  const hs = [10, 5, 2, 1, 0.5, 0.2, 0.1, 0.05, 0.02];
  const rows = hs.map((hh) => {
    const r = Object.fromEntries(["euler", "heun", "rk4"].map((m) => [m, reentry(p, m, hh, { store: false })]));
    return { hh, r };
  });
  const cell = (r) => (r.ok ? km(Math.abs(r.final.range - ref.final.range), 2) : "diverge");
  $("#bTable").innerHTML = `<table class="tbl"><thead><tr><th>h (s)</th><th>Error Euler</th><th>Error Heun</th><th>Error RK4</th><th>g máx Euler</th></tr></thead><tbody>
    ${rows.map(({ hh, r }) => `<tr><td>${hh}</td><td class="mono ${r.euler.ok && Math.abs(r.euler.final.range - ref.final.range) < 1e4 ? "good" : ""}">${cell(r.euler)}</td><td class="mono">${cell(r.heun)}</td><td class="mono">${cell(r.rk4)}</td><td class="mono">${r.euler.ok ? fmt(r.euler.maxG, 3) : "—"}</td></tr>`).join("")}</tbody></table>`;
  const okE = rows.find(({ r }) => r.euler.ok && Math.abs(r.euler.final.range - ref.final.range) < 1e4);
  const okH = rows.find(({ r }) => r.heun.ok && Math.abs(r.heun.final.range - ref.final.range) < 1e4);
  const okR = rows.find(({ r }) => r.rk4.ok && Math.abs(r.rk4.final.range - ref.final.range) < 1e4);
  const nSteps = (hh) => Math.round(ref.final.t / hh);
  state.answer = { okE, okH, okR, ref, nSteps, rows };
  $("#bAnswer").innerHTML = `<div class="answer"><h4>Respuesta a la pregunta del desafío</h4>
    Para un error de amerizaje &lt; 10 km, <b>Euler necesita h ≤ ${okE ? okE.hh : "0,02 (o menos)"} s</b> (≈ ${okE ? fmt(nSteps(okE.hh), 5) : "—"} pasos). Heun lo logra con h ≤ ${okH ? okH.hh : "—"} s (≈ ${okH ? fmt(nSteps(okH.hh), 4) : "—"} pasos) y RK4 con h ≤ ${okR ? okR.hh : "—"} s (≈ ${okR ? fmt(nSteps(okR.hh), 4) : "—"} pasos).
    <br><br>Con h = 1 s, un paso que ya parece fino, Euler deja la cápsula a ${rows[3].r.euler.ok ? km(Math.abs(rows[3].r.euler.final.range - ref.final.range), 0) : "—"} del punto correcto: los barcos no la encontrarían. El error de Euler es proporcional a h, así que reducirlo 10 veces exige 10 veces más pasos.</div>`;
  // sensibilidad
  const sens = [-5, -1, 1, 5].map((d) => { const r = reentry({ ...p, dv: p.dv + d }, "rk4", 0.5, { store: false }); return { d, delta: r.ok ? r.final.range - ref.final.range : NaN }; });
  const v0 = Math.sqrt(MU / (RE + p.alt0 * 1e3));
  $("#bSens").innerHTML = `<table class="tbl"><thead><tr><th>Error en Δv</th>${sens.map((s) => `<th>${s.d > 0 ? "+" : ""}${s.d} m/s</th>`).join("")}<th>Encender 1 s tarde</th></tr></thead><tbody>
    <tr><td>Desplazamiento del amerizaje</td>${sens.map((s) => `<td class="mono">${s.delta > 0 ? "+" : ""}${km(s.delta, 1)}</td>`).join("")}<td class="mono">+${km(v0 * 1 * (RE / (RE + p.alt0 * 1e3)), 1)}</td></tr></tbody></table>
    <p class="muted">Un error de solo 1 m/s en el retrofrenado (0,7 % de Δv) mueve el amerizaje ≈ ${km(Math.abs(sens[1].delta), 0)}, y encender 1 s tarde lo mueve ≈ ${km(v0 * (RE / (RE + p.alt0 * 1e3)), 1)}. Por eso los cálculos debían ser exactos al segundo. En el vuelo real la Friendship 7 cayó a unos 60 km del punto previsto.</p>`;
  renderTerminal(p, ref);
  renderAnswers(p);
}

// ---------------------------------------------------------------- Parte C
function renderTerminal(p, ref) {
  const hk = [0, 3, 10, 20, 30];
  $("#cTable").innerHTML = `<table class="tbl"><thead><tr><th>Altura</th><th>ρ (kg/m³)</th><th>k = ½ρC<sub>d</sub>A (kg/m)</th><th>v<sub>T</sub> (m/s)</th></tr></thead><tbody>
    ${hk.map((h) => `<tr><td>${h} km</td><td class="mono">${density(p, h * 1e3).toExponential(3)}</td><td class="mono">${fmt(0.5 * density(p, h * 1e3) * p.Cd * p.A, 4)}</td><td class="mono">${fmt(terminalV(p, h), 4)}</td></tr>`).join("")}
    <tr><td colspan="4" class="muted" style="text-align:left">Fragmento de asteroide (5 kg, k = 0,05): v<sub>T</sub> = 31,3 m/s. La cápsula (1 355 kg) llegaría a ≈ ${fmt(terminalV(p, 0), 3)} m/s al nivel del mar <b>sin paracaídas</b>.</td></tr></tbody></table>`;
  const low = ref.out.filter((o) => o.alt < 40e3);
  const th = low.filter((_, i) => i % Math.max(1, Math.floor(low.length / 400)) === 0);
  lineChart($("#cChart"), [
    { name: "Velocidad simulada", x: th.map((o) => o.alt / 1e3), y: th.map((o) => o.v), color: "var(--c3)" },
    { name: "v_T(h) local", x: th.map((o) => o.alt / 1e3), y: th.map((o) => terminalV(p, o.alt / 1e3)), color: "var(--c2)", dash: "6 4" },
  ], { xLabel: "altitud (km) — la cápsula se mueve de derecha a izquierda", yLabel: "velocidad (m/s)" });
}

// ---------------------------------------------------------------- Preguntas
const state = { answer: null };
function renderAnswers(p) {
  const a = state.answer; if (!a) return;
  const eu10 = circularOrbit(DEFAULTS, "euler", 10, 1), eu1 = circularOrbit(DEFAULTS, "euler", 1, 1);
  const Q = [
    ["1. ¿Por qué la NASA no podía usar una fórmula y necesitó el método de Euler?",
      `Una órbita sin atmósfera tiene solución exacta (cónicas de Kepler). Pero la reentrada combina la gravedad, que cambia con la distancia, con un arrastre que depende de la velocidad al cuadrado y de una densidad que crece exponencialmente al bajar. Ese sistema de EDO <b>no tiene solución analítica</b>. En la película, Katherine Johnson lo dice así: si no hay fórmula, se puede <b>avanzar paso a paso</b> con la pendiente conocida, que es exactamente el método de Euler.`],
    ["2. ¿Cómo funciona el método de Euler en este problema?",
      `Se conoce el estado actual Y = (posición, velocidad). Las leyes de Newton dan la derivada F(Y) = (velocidad, aceleración), y se estima Y<sub>n+1</sub> = Y<sub>n</sub> + h·F(Y<sub>n</sub>). Es lo mismo que en el problema del asteroide, pero con 4 ecuaciones en vez de 1. En la sección 4 está el primer paso calculado numéricamente.`],
    ["3. ¿Cómo se verifica que Euler está bien implementado?",
      `Se compara con un caso que sí tiene solución analítica: la órbita circular sin atmósfera (parte A). Tras una vuelta Euler se desvía ${km(eu10.posErr, 0)} con h = 10 s y ${km(eu1.posErr, 0)} con h = 1 s. El error es proporcional a h, lo que confirma que el método es de orden 1. Además Euler hace que la energía crezca y la órbita se convierta en espiral, un defecto conocido del método.`],
    ["4. ¿Qué paso h hace falta para que el error de amerizaje sea menor a 10 km?",
      `Con Euler, <b>h ≤ ${a.okE ? a.okE.hh : "0,05"} s</b>, es decir, ≈ ${a.okE ? fmt(a.nSteps(a.okE.hh), 5) : "—"} pasos para unos ${fmt(a.ref.final.t / 60, 3)} minutos de reentrada. RK4 consigue la misma precisión con h ≤ ${a.okR ? a.okR.hh : "—"} s (≈ ${a.okR ? fmt(a.nSteps(a.okR.hh), 4) : "—"} pasos). Esto muestra por qué hacían falta computadoras, humanas o electrónicas, y por qué los métodos de mayor orden reemplazaron a Euler.`],
    ["5. ¿Qué tan sensible es el resultado a errores en los datos?",
      `Mucho. Encender los retrocohetes 1 s tarde desplaza el amerizaje ≈ 7,6 km, y un error de 1 m/s en Δv lo desplaza decenas de km (tabla de sensibilidad). La precisión del método numérico debe ser mejor que la de los datos. Si no, el error de cálculo domina.`],
    ["6. ¿Qué relación tiene con la caída del asteroide del trabajo anterior?",
      `Es la misma ecuación m dv/dt = −mg + kv², generalizada. En los últimos kilómetros la cápsula cae a su <b>velocidad terminal</b> v<sub>T</sub> = √(2mg/ρC<sub>d</sub>A) ≈ ${fmt(terminalV(p, 3), 3)} m/s a 3 km de altura, igual que el fragmento del asteroide caía a 31 m/s. La diferencia es que la cápsula abre un paracaídas, y además tiene un escudo térmico para sobrevivir a la fase de bola de fuego que destruye a los asteroides pequeños.`],
    ["7. ¿Qué enseña la película sobre el uso de métodos numéricos?",
      `Tres lecciones. (a) Un método simple bien entendido, como Euler, resuelve problemas que parecen imposibles. (b) <b>Hay que verificar</b>: Glenn pidió que una persona confirmara los resultados de la IBM, igual que aquí verificamos Euler contra una solución exacta y contra RK4. (c) Conocer el error y su dependencia de h es tan importante como el resultado: un cálculo sin cota de error no sirve para una decisión de vida o muerte.`],
  ];
  $("#answers").innerHTML = Q.map(([q, r]) => `<div class="answer"><h4>${q}</h4><p>${r}</p></div>`).join("") +
    `<p class="muted">Las preguntas siguen las sugeridas para el desafío. Si su docente entregó una lista específica, agréguela en <code>js/app.js</code> (función <code>renderAnswers</code>).</p>`;
  $("#concl").innerHTML = `<ul>
    <li>El método de Euler resuelve el sistema de reentrada, pero su error de orden 1 exige pasos muy pequeños: <b>h ≤ ${a.okE ? a.okE.hh : "0,05"} s</b> para un error de amerizaje menor a 10 km.</li>
    <li>La validación con la órbita circular, que tiene solución analítica, muestra el defecto típico de Euler: gana energía y la órbita se abre en espiral.</li>
    <li>Con los parámetros aproximados de la cápsula Mercury, la reentrada dura ≈ ${fmt(a.ref.final.t / 60, 3)} min y recorre ≈ ${km(a.ref.final.range, 0)}, con un pico de ≈ ${fmt(a.ref.maxG, 3)} g. Es del mismo orden que los ≈ 8 g que soportó Glenn.</li>
    <li>La física es la del asteroide: gravedad más arrastre cuadrático. La atmósfera lleva cualquier objeto a su velocidad terminal, y el paracaídas sirve para reducirla.</li>
    <li>Como en <i>Talentos ocultos</i>, la confianza en un resultado numérico viene de <b>verificarlo</b>: comparar con soluciones exactas, refinar h y contrastar métodos.</li>
  </ul>`;
}

// ---------------------------------------------------------------- init
["aAlt", "aH", "aN"].forEach((id) => $("#" + id).addEventListener("input", debounce(renderOrbit)));
["bAlt", "bDv", "bH", "bM", "bCdA"].forEach((id) => $("#" + id).addEventListener("input", debounce(renderReentry, 300)));
$("#studentLine").textContent = `${STUDENT.nombre} · ${STUDENT.materia} · UMSA`;
$("#footer").innerHTML = `${STUDENT.nombre} · Euler en el espacio · ${STUDENT.materia} · <a href="${STUDENT.repo}">Repositorio</a>`;
renderFirstStep();
renderOrbit();
renderReentry();
const r = state.answer;
$("#heroKpis").innerHTML = kpi("Reentrada (referencia)", `${fmt(r.ref.final.t / 60, 3)} min`, `alcance ${km(r.ref.final.range, 0)}`) +
  kpi("Pico de desaceleración", `${fmt(r.ref.maxG, 3)} g`, "Glenn soportó ≈ 8 g") +
  kpi("Paso de Euler necesario", `h ≤ ${r.okE ? r.okE.hh : "0,05"} s`, "para un error < 10 km", "good");
