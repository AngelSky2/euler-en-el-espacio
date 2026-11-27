# 🚀 Euler en el espacio: lanzamiento de un cohete con el método de Euler

Desafío individual de **Métodos Numéricos** (UMSA). Estudiante: **Alejandro Angel Cruz Chacón**.
Contexto: película *Talentos ocultos* (*Hidden Figures*, 2016), cuando la NASA se preparaba para ir al espacio y a la Luna y Katherine Johnson usó el **método de Euler**.
Es la continuación del ejercicio 42 ([caída del asteroide](https://github.com/AngelSky2/euler-asteroide)).

**Página interactiva:** https://angelsky2.github.io/euler-en-el-espacio/
**Documento de respuestas:** [RESPUESTAS.md](RESPUESTAS.md)

## Desafío

Se prueba un modelo a escala de cohete con m = 5 kg, empuje E = 100 N y k = 0.05 kg/m (los mismos m y k del ejercicio 42).

```
m dv/dt = E − m g − k v² ,   v(0) = 0 ,   0 ≤ t ≤ 15 s
```

1. ¿Qué velocidad tiene a los 15 s? ¿Hay una velocidad máxima?
2. ¿Qué altura alcanza?
3. Con Euler, ¿qué paso h garantiza un error menor al 1 %?

## Solución

- **Analítica:** `v(t) = a·tanh(b t)` con `a = √((E−mg)/k) = 31.9218 m/s` y `b = √(k(E−mg))/m = 0.319218 s⁻¹`.
  - v(15) = 31.9174 m/s (velocidad límite: 31.92 m/s).
  - y(15) = (a/b)·ln cosh(15b) ≈ 409.5 m.
- **Euler:** `v_{n+1} = v_n + h(10.19 − 0.01 v_n²)`.
  - Con h = 1 s: error máximo 2.07 m/s (8.7 %).
  - Con h = 0.1 s: 0.19 m/s (0.75 %).
  - **Respuesta: h ≤ 0.1 s.** Euler es de orden 1.
- **E = 0** reproduce el ejercicio 42: v = −31.32·tanh(0.3132 t).
- **Masa variable** (q = 0.15 kg/s): ya no hay fórmula, y Euler con h = 0.1 da v(15) = 37.9215 m/s frente a 37.9212 m/s de la referencia RK4.

**Ampliación:** reentrada orbital de la cápsula de John Glenn (4 EDO). Euler necesita h ≤ 0.02 s para un error de amerizaje menor a 10 km.

## Estructura
```
index.html            página
js/launch.js          modelo del lanzamiento, solución analítica, Euler, RK4 (sin DOM)
js/launch-app.js      interfaz del desafío principal
js/orbit.js           ampliación: órbita y reentrada (Euler/Heun/RK4 vectoriales)
js/reentry-app.js     interfaz de la ampliación
js/charts.js          gráficos SVG
tests/run-tests.mjs   pruebas (npm test)
```

## Ejecutar
```bash
python3 -m http.server 8080   # http://localhost:8080
npm test
```
> Parámetros hipotéticos o aproximados, con fines académicos.
