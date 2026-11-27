# Desafío “Euler en el espacio”: documento de respuestas

**Estudiante:** Alejandro Angel Cruz Chacón · **Materia:** Métodos Numéricos · UMSA

**Contexto:** en *Talentos ocultos* (*Hidden Figures*, 2016) la NASA se prepara para enviar astronautas al espacio y después a la Luna. Para calcular trayectorias sin fórmula, Katherine Johnson usa el **método de Euler**.
Este desafío aplica la ecuación del ejercicio 42 al **lanzamiento de un cohete**.

## Planteamiento
Modelo a escala de cohete: m = 5 kg, empuje E = 100 N, k = 0.05 kg/m, g = 9.81 m/s², v(0) = 0, 0 ≤ t ≤ 15 s.

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
| 15 | 15 | 31.921671 | 31.917392 | 0.0043 | 0.01 |

| h (s) | Error máximo | Error relativo máximo |
|---|---|---|
| 1 | 2.065 m/s | 8.71 % |
| 0.5 | 0.991 m/s | 3.85 % |
| 0.1 | 0.189 m/s | 0.75 % |

## Respuestas
1. **v(15) = 31.917 m/s.** Existe una velocidad límite de 31.92 m/s (≈ 115 km/h), cuando el empuje equilibra al peso más el arrastre.
2. **y(15) ≈ 409.5 m.**
3. Para un error < 1 % Euler necesita **h ≤ 0.1 s** (150 pasos). El error es proporcional a h (orden 1).
4. Euler **sobreestima** la velocidad al inicio porque usa la aceleración del comienzo de cada paso, cuando el arrastre es menor.
5. **Relación con el asteroide:** con E = 0 se obtiene v = −31.32·tanh(0.3132 t), exactamente el ejercicio 42. El cohete tiene velocidad límite hacia arriba y el fragmento, velocidad terminal hacia abajo.
6. **Por qué Euler en la película:** un cohete real pierde masa, el aire cambia con la altura y la trayectoria se curva, así que no hay fórmula. Euler solo necesita evaluar la derivada. Con masa variable (q = 0.15 kg/s), Euler (h = 0.1) da v(15) = 37.9215 m/s frente a 37.9212 m/s de referencia.
7. **Lección:** un método simple bien entendido resuelve problemas reales, pero hay que **verificarlo** (Glenn pidió que Katherine revisara los cálculos de la IBM) y controlar el error con el paso h.

## Ampliación (reentrada orbital)
El regreso de la cápsula se modela con gravedad newtoniana y arrastre con densidad exponencial (4 EDO). Euler necesita h ≤ 0.02 s para un error de amerizaje menor a 10 km. Con h = 1 s se equivoca en ≈ 209 km. Los detalles están en la página.
