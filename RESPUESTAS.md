# Desafío “Euler en el espacio”: documento de respuestas

**Estudiante:** Alejandro Angel Cruz Chacón · **Materia:** Métodos Numéricos · UMSA

**Contexto:** en *Talentos ocultos* (*Hidden Figures*, 2016) la NASA se prepara para enviar astronautas al espacio y después a la Luna. Para calcular trayectorias sin fórmula, Katherine Johnson usa el **método de Euler**.
Este desafío aplica la ecuación del ejercicio 42 al **lanzamiento de un cohete**.

## Planteamiento
Modelo a escala de cohete: m = 5 kg, empuje E = 100 N, k = 0.05 kg/m, g = 9.81 m/s², v(0) = 0, 0 ≤ t ≤ 20 s.

    m dv/dt = E − m g − k v²    ⇒    dv/dt = 10.19 − 0.01 v²

## Solución analítica

    v(t) = a·tanh(b t),   a = √((E − mg)/k) = √1019 = 31.9218 m/s,   b = √(k(E − mg))/m = 0.319218 s⁻¹
    y(t) = (a/b)·ln cosh(b t)

**Verificación:** m·v' = m·a·b·sech²(bt) = (E − mg)·sech²(bt), y (E − mg) − k·a²·tanh² = (E − mg)·sech² ✔. Además v(0) = 0 ✔.

## Método de Euler (h = 1 s)
| n | t | v Euler | v exacta | E abs | E rel % |
|---|---|---|---|---|---|
| 1 | 1 | 10.190000 | 9.857429 | 0.3326 | 3.37 |
| 2 | 2 | 19.341639 | 17.998566 | 1.3431 | 7.46 |
| 3 | 3 | 25.790649 | 23.725171 | 2.0655 | 8.71 |
| 4 | 4 | 29.329073 | 27.313840 | 2.0152 | 7.38 |
| 15 | 15 | 31.921739 | 31.917353 | 0.0044 | 0.01 |
| 20 | 20 | 31.921779 | 31.921598 | 0.0002 | 0.00 |

| h (s) | Error máximo | Error relativo máximo |
|---|---|---|
| 1 | 2.065 m/s | 8.71 % |
| 0.5 | 0.991 m/s | 3.85 % |
| 0.1 | 0.189 m/s | 0.75 % |

## Euler paso a paso: velocidad y altura durante los 20 s (h = 1 s)

En cada paso: **aₙ = 10.19 − 0.01·vₙ²**, luego **vₙ₊₁ = vₙ + h·aₙ** y **yₙ₊₁ = yₙ + h·vₙ**.

| n | t | vₙ (m/s) | aₙ (m/s²) | arrastre kv² (N) | F neta (N) | yₙ (m) | v exacta | y exacta |
|---|---|---|---|---|---|---|---|---|
| 0 | 0 | 0.000000 | 10.190000 | 0.0000 | 50.9500 | 0.0000 | 0.000000 | 0.0000 |
| 1 | 1 | 10.190000 | 9.151639 | 5.1918 | 45.7582 | 0.0000 | 9.857429 | 5.0108 |
| 2 | 2 | 19.341639 | 6.449010 | 18.7049 | 32.2451 | 10.1900 | 17.998566 | 19.1295 |
| 3 | 3 | 25.790649 | 3.538424 | 33.2579 | 17.6921 | 29.5316 | 23.725171 | 40.1915 |
| 4 | 4 | 29.329073 | 1.588055 | 43.0097 | 7.9403 | 55.3223 | 27.313840 | 65.8637 |
| 5 | 5 | 30.917128 | 0.631312 | 47.7934 | 3.1566 | 84.6514 | 29.402440 | 94.3203 |
| 6 | 6 | 31.548440 | 0.236959 | 49.7652 | 1.1848 | 115.5685 | 30.566025 | 124.3624 |
| 7 | 7 | 31.785399 | 0.086884 | 50.5156 | 0.4344 | 147.1169 | 31.198534 | 155.2770 |
| 8 | 8 | 31.872283 | 0.031576 | 50.7921 | 0.1579 | 178.9023 | 31.537768 | 186.6628 |
| 10 | 10 | 31.915297 | 0.004138 | 50.9293 | 0.0207 | 242.6785 | 31.814209 | 250.0717 |
| 12 | 12 | 31.920932 | 0.000541 | 50.9473 | 0.0027 | 306.5132 | 31.891740 | 313.7937 |
| 15 | 15 | 31.921739 | 0.000026 | 50.9499 | 0.0001 | 402.2773 | 31.917353 | 409.5189 |
| 20 | 20 | 31.921779 | 0.000000 | 50.9500 | 0.0000 | 561.8861 | 31.921598 | 569.1212 |

**Interpretación física de cada etapa:**
- **t = 0 → 1 s (despegue):** v = 0, así que no hay arrastre. Del empuje (100 N) menos el peso (49.05 N) sobran 50.95 N, y a₀ = 10.19 m/s² (≈ 1.04 g). Euler da v₁ = 10.19 m/s y **y₁ = 0**, porque usa la velocidad del inicio del paso (0). En realidad el cohete ya subió 5.01 m.
- **t = 1 → 3 s (aceleración fuerte):** el arrastre crece con v² (5.2 N → 18.7 N → 33.3 N) y la aceleración baja de 9.15 a 3.54 m/s². Aquí está el **mayor error de Euler** (2.07 m/s en t = 3 s): la aceleración cambia muy rápido y Euler la mantiene fija durante todo el segundo.
- **t = 3 → 7 s (transición):** el arrastre se acerca a los 50.95 N que sobran del empuje. La aceleración cae a casi 0 y la velocidad pasa de 25.8 a 31.8 m/s.
- **t = 7 → 20 s (velocidad límite):** empuje = peso + arrastre, así que F neta ≈ 0. La velocidad se mantiene en ≈ 31.92 m/s y la altura crece ≈ 31.9 m cada segundo hasta y₂₀ = 561.9 m (exacta: 569.1 m).

**Balance:** Euler **sobreestima la velocidad** al inicio, porque toma la aceleración del comienzo del paso, mayor que la promedio. En cambio **subestima la altura** (−7.2 m, 1.3 % a los 20 s), porque toma la velocidad del comienzo del paso, menor que la promedio. Con h = 0.1 s los errores bajan ≈ 10 veces (y₂₀ = 568.5 m).

## Respuestas
1. **v(20) = 31.9216 m/s** (v(1) = 9.86, v(3) = 23.73, v(5) = 29.40 m/s). Existe una velocidad límite de 31.92 m/s (≈ 115 km/h), cuando el empuje equilibra al peso más el arrastre.
2. **y(20) ≈ 569.1 m** (y(15) ≈ 409.5 m). Euler con h = 1 da 561.9 m.
3. Para un error < 1 % Euler necesita **h ≤ 0.1 s** (200 pasos en 20 s). El error es proporcional a h (orden 1).
4. Euler **sobreestima** la velocidad al inicio porque usa la aceleración del comienzo de cada paso, cuando el arrastre es menor.
5. **Relación con el asteroide:** con E = 0 se obtiene v = −31.32·tanh(0.3132 t), exactamente el ejercicio 42. El cohete tiene velocidad límite hacia arriba y el fragmento, velocidad terminal hacia abajo.
6. **Por qué Euler en la película:** un cohete real pierde masa, el aire cambia con la altura y la trayectoria se curva, así que no hay fórmula. Euler solo necesita evaluar la derivada. Con masa variable (q = 0.15 kg/s) Euler sigue funcionando y se acerca a la referencia RK4 al reducir h.
7. **Lección:** un método simple bien entendido resuelve problemas reales, pero hay que **verificarlo** (Glenn pidió que Katherine revisara los cálculos de la IBM) y controlar el error con el paso h.

## Ampliación (reentrada orbital)
El regreso de la cápsula se modela con gravedad newtoniana y arrastre con densidad exponencial (4 EDO). Euler necesita h ≤ 0.02 s para un error de amerizaje menor a 10 km. Con h = 1 s se equivoca en ≈ 209 km. Los detalles están en la página.
