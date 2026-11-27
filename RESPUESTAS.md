# Desafío “Euler en el espacio”: documento de respuestas

**Contexto:** película *Talentos ocultos* (*Hidden Figures*, 2016). La NASA prepara el vuelo orbital de John Glenn (Friendship 7, 20/02/1962), años antes del Apolo 11. Katherine Johnson usa el **método de Euler** para calcular la transición de la órbita a la trayectoria de caída.
Este desafío **continúa** el problema del asteroide (`m dv/dt = −mg + kv²`).

## Planteamiento del desafío
> Si se calcula la reentrada de la cápsula con el método de Euler, ¿qué tamaño de paso h hace falta para que el punto de amerizaje tenga un error menor a 10 km?

**Modelo (4 EDO de primer orden):**

    dr/dt = v
    dv/dt = −μ r/|r|³ − (ρ(h)·Cd·A / 2m)·|v|·v ,   ρ(h) = ρ₀ e^(−h/H)

Parámetros aproximados: órbita circular de 200 km (v₀ ≈ 7 788 m/s), retrofrenado Δv = 150 m/s, m = 1 355 kg, Cd·A = 4.2 m², ρ₀ = 1.225 kg/m³, H = 7.2 km. La simulación termina al abrir el paracaídas a 3 km.

**Euler:** `Y_{n+1} = Y_n + h·F(t_n, Y_n)`, con Y = (x, y, vx, vy).

## Resultados
| Cantidad | Valor (referencia RK4, h = 0.05 s) |
|---|---|
| Duración de la reentrada | ≈ 19.5 min |
| Alcance desde el retrofrenado | ≈ 7 444 km |
| Desaceleración máxima | ≈ 8.95 g (Glenn soportó ≈ 8 g) |
| Velocidad terminal a 3 km | ≈ 88.5 m/s (sin paracaídas) |

| h (s) | Error de amerizaje: Euler | Heun | RK4 |
|---|---|---|---|
| 10 | 3 835 km | 16.2 km | 0.02 km |
| 5 | 1 261 km | 4.0 km | < 0.01 km |
| 1 | 209 km | 0.16 km | < 0.01 km |
| 0.1 | 20.2 km | < 0.01 km | < 0.01 km |
| 0.05 | 10.1 km | — | — |
| 0.02 | **4.0 km** | — | — |

**Respuesta:** Euler necesita **h ≤ 0.02 s** (≈ 58 600 pasos) para un error menor a 10 km. RK4 lo logra con h = 10 s (≈ 117 pasos).

**Validación analítica (órbita circular sin atmósfera):** tras una vuelta Euler se desvía 4 217 km con h = 10 s, 2 230 km con h = 5 s y 466 km con h = 1 s. El error es de orden 1 y la energía crece, así que la órbita se abre en espiral.

## Preguntas y respuestas

**1. ¿Por qué la NASA no podía usar una fórmula y necesitó Euler?**
La gravedad que varía con r, el arrastre cuadrático y la densidad exponencial forman un sistema sin solución analítica. Euler permite avanzar paso a paso con la pendiente conocida.

**2. ¿Cómo funciona Euler aquí?**
Con la posición y la velocidad actuales, Newton da la aceleración, y se estima el estado h segundos después: Y_{n+1} = Y_n + h·F(Y_n). Es lo mismo que en el problema del asteroide, pero con 4 ecuaciones.

**3. ¿Cómo se verifica?**
Comparando con la órbita circular, que tiene solución exacta, y con RK4 de paso fino. Se comprueba el orden 1 (al dividir h entre 2, el error se divide entre ≈ 2) y la deriva de energía típica de Euler.

**4. ¿Qué paso hace falta?**
h ≤ 0.02 s con Euler. Con h = 1 s el error es de 209 km y los barcos no encontrarían la cápsula.

**5. ¿Qué tan sensible es a errores en los datos?**
Encender 1 s tarde desplaza el amerizaje ≈ 7.6 km, y un error de 1 m/s en Δv lo desplaza ≈ 27 km. La precisión del cálculo debe ser mejor que la de los datos.

**6. ¿Relación con el asteroide?**
Es la misma ecuación m dv/dt = −mg + kv², con k = ½ρ(h)CdA variable. Abajo, la cápsula cae a su velocidad terminal (≈ 72–90 m/s), igual que el fragmento caía a 31 m/s. El paracaídas aumenta k para reducir v_T.

**7. ¿Qué enseña la película?**
Que un método simple y bien entendido resuelve problemas reales; que **hay que verificar** los resultados (Glenn pidió que Katherine revisara los de la IBM 7090); y que conocer el error y su dependencia de h es indispensable cuando hay vidas en juego.

> Nota: si el docente entregó un documento con preguntas específicas, se pueden agregar aquí y en la sección “Preguntas” de la página (`js/app.js`, función `renderAnswers`).
