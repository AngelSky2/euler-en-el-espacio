# 🚀 Euler en el espacio: traer a John Glenn de vuelta

Desafío individual de **Métodos Numéricos** (UMSA), en el contexto de la película *Talentos ocultos* (*Hidden Figures*, 2016).
Continúa el trabajo [“Vuelo oscuro”](https://github.com/AngelSky2/euler-asteroide) sobre la caída de un asteroide.

**Página interactiva:** https://angelsky2.github.io/euler-en-el-espacio/
**Documento de respuestas:** [RESPUESTAS.md](RESPUESTAS.md)

## Contenido
1. Contexto histórico: Katherine Johnson, Friendship 7 (1962) y la escena del método de Euler
2. Desafío: ¿qué paso h necesita Euler para un error de amerizaje menor a 10 km?
3. Modelo: gravedad newtoniana más arrastre cuadrático con atmósfera exponencial (4 EDO)
4. Método de Euler vectorial, con el primer paso calculado
5. **Parte A:** validación con órbita circular (solución analítica). Euler gana energía y la órbita se abre en espiral.
6. **Parte B:** reentrada. Alcance, duración, pico de g y error vs h para Euler, Heun y RK4; sensibilidad
7. **Parte C:** conexión con el asteroide (velocidad terminal local)
8. Preguntas y respuestas, conclusiones y referencias

**Resultado principal:** Euler necesita **h ≤ 0.02 s** (≈ 58 600 pasos). Con h = 1 s se equivoca en ≈ 209 km. RK4 logra < 10 km con h = 10 s.

## Estructura
```
index.html          página
js/orbit.js         modelo, Euler/Heun/RK4 vectoriales, órbita circular, reentrada (sin DOM)
js/app.js           interfaz y gráficos
js/charts.js        gráficos SVG
tests/run-tests.mjs pruebas en Node
```

## Ejecutar
```bash
python3 -m http.server 8080   # http://localhost:8080
npm test
```

> Los parámetros son aproximados (cápsula Mercury, órbita circular de 200 km) y no reproducen los datos oficiales del vuelo.
