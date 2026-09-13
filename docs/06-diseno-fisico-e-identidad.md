# 6 · Diseño físico del QR e identidad de marca

## 6.1 La placa

```
┌───────────────────────────────┐   15 × 21 cm (exterior) · 10 × 14 cm (interior)
│ ═══════════════════════════ │   Borde blanco de 6 mm sobre azul #14306B: se lee como señal, no como anuncio.
│        ESCANÉAME              │   Bricolage Grotesque 800, 22 mm de altura de x. Legible a 5 m.
│  ┌───────────────────────┐    │
│  │                       │    │   QR versión 4–6 (según largo de URL), ECL H, módulos ≥ 3,5 mm →
│  │      ▓▓▓  QR  ▓▓▓     │    │   lectura confiable a 2,5 m con cámara de gama media y a 1 m con gama baja.
│  │        ( Q )          │    │   Zona de silencio 4 módulos. Logo "Q" centrado (posible por ECL H).
│  └───────────────────────┘    │
│ ▌EN CASO DE ACCIDENTE ·       │   Franja roja #D7263D: la única palabra roja de la placa.
│ ▌IDENTIFICA ESTE VEHÍCULO     │
│  IDENTIFICACIÓN Y SEGURIDAD   │
│  DEL VEHÍCULO · SIN APP       │   Manrope 800, tracking +12 %.
│  SCZ-Q7K3-M9V2   L123 · U045  │   Código dictable + línea/unidad impresos: útil sin teléfono.
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │   Franja inferior roja de 6 mm.
└───────────────────────────────┘
```

| Aspecto | Especificación | Por qué |
|---|---|---|
| Material exterior | Vinilo reflectivo grado ingeniería (tipo señalética vial) + laminado UV antigrafiti, sobre chapa de aluminio 1 mm con adhesivo 3M VHB o remaches. | Sol cruceño, lluvia, lavados a presión, vandalismo. El reflectivo hace que el flash del teléfono lo encuentre de noche. |
| Material interior | Vinilo blanco mate laminado, autoadhesivo. | Sin reflejos bajo luz interior; barato de reponer. |
| Impresión | UV de alta resolución; QR negro `#0B1020` sobre blanco (nunca invertido, nunca sobre azul). | Contraste máximo para el decodificador. |
| Legibilidad de lejos | "ESCANÉAME" y la franja roja se distinguen a 10 m; el QR se lee a 2,5 m. | Quien llega ve **que hay algo** antes de acercarse. |
| Luz | Reflectivo + mate en el QR + laminado antirreflejo. Probar a mediodía, al atardecer (sol rasante) y de noche con flash. | La mayoría de fallos de escaneo son por reflejo, no por daño. |
| Desgaste | ECL H tolera ~30 % de módulos dañados. Umbral de reposición: 2 escaneos fallidos reportados o inspección mensual del operador. | El sistema avisa solo (panel: "QR U051 dañado"). |
| Reemplazo | Nueva placa = nueva versión (`v4`) → la anterior queda **revocada** al instalarse. Instalación confirmada desde la app del conductor con foto + GPS. Costo objetivo: < Bs 35 la exterior. | Reposición en minutos, sin reimprimir códigos únicos del vehículo. |
| Antimanipulación | Vinilo "void" que deja marca al despegarse; número de serie físico grabado; el código impreso permite cotejar con el que abre el teléfono. | Un sticker encima se nota; un QR falso no coincide con el texto. |
| Que no parezca publicidad | Sin marcas comerciales, sin descuentos, sin frases de marketing; paleta de señalética (azul marino/blanco/rojo); tipografía de señal, pictograma de escudo. | La gente ignora los QR de promociones; este debe leerse como "salida de emergencia". |

## 6.2 Los siete ejemplos y dónde va cada uno

| # | Ubicación | Función | Tamaño | Veredicto |
|---|---|---|---|---|
| 1 | **Exterior, junto a la puerta de subida** (a 1,4 m del suelo, lado derecho) | El accidente visto desde la vereda. La ubicación **principal**. | 15 × 21 cm | **A — obligatoria** |
| 2 | **Interior, sobre la puerta / mampara del conductor** | Pasajeros a bordo: emergencia médica, acoso, queja. Protegido del clima. | 10 × 14 cm | **A — obligatoria** |
| 3 | **Exterior trasero, bajo el número de línea** | Se ve desde otro vehículo o si el micro se retira (fuga). | 15 × 21 cm | B — recomendada |
| 4 | **Exterior frontal / parabrisas** | Complementaria; reflejos y polarizados dificultan. | 10 × 14 cm | C — opcional |
| 5 | **Respaldo de asientos (mini, cada 2 filas)** | Como Delhi/Mumbai: verificación del chofer y quejas. Poco útil en choque. | 6 × 8 cm | B — fase 2 |
| 6 | **QR de identificación del conductor** (credencial colgada o en la app) | Muestra el vínculo conductor↔unidad del turno; **no** es una placa fija: el conductor cambia. | Credencial 8,5 × 5,4 cm | A — vía app; física opcional |
| 7 | **QR de emergencia** (variante de la placa 1 con "EMERGENCIA" grande y solo teléfonos + reporte) | Para campañas o vehículos que aún no tienen conductor registrado: abre directo el modo emergencia. | 15 × 21 cm | Mismo QR, distinta URL de aterrizaje: `/e/{code}` |

**Recomendación**: 1 + 2 en el MVP; 3 desde el piloto ampliado; 5 cuando se agreguen los casos de acoso/queja.
Todas las placas de un vehículo comparten `vehicle_id` pero tienen **código y versión propios**,
así se revoca una sin tocar las demás y se sabe cuál se escaneó (útil para saber si la persona
estaba adentro o afuera).

## 6.3 Señalización complementaria

- Sticker de 4 × 4 cm junto a cada placa: "Apuntá la cámara · No hace falta app".
- Un cartel A4 en la sede del sindicato y en las paradas de cabecera con la placa gigante y "Así funciona en 3 pasos".
- Uniforme/credencial del conductor con el pictograma Q para reforzar que "este micro está en QRuta".

## 6.4 Identidad de marca: nombres

| Nombre | Concepto | A favor | En contra |
|---|---|---|---|
| **QRuta** | QR + ruta. "La ruta tiene QR". | Se explica solo; ya tiene tracción (este repo); dominio `qruta.bo`; escala a cualquier transporte. | Pronunciación "cu-ruta" dudosa; suena a app de rutas, no de seguridad. |
| **Sello** | El sello de seguridad del vehículo. "Micro sellado". | Corto, español universal, connota verificación oficial y confianza; funciona en marca de placa ("SELLO QRuta"). | Genérico para SEO; existe como palabra común. |
| **Faro** | Guía a la ayuda hacia el punto exacto. | Cortísimo, pronunciable en cualquier idioma, imagen potente (luz en la emergencia). | Colisiones de marca (Faro Technologies); menos explícito. |
| **Amparo** | Protección, cobijo. Palabra cálida. | Humano, boliviano, memorable. | Largo; connota seguros/asistencia legal. |
| **Tarja** | En Bolivia, "tarja" es la placa o etiqueta identificatoria. | Localismo preciso y con sabor; corto. | No escala internacionalmente sin explicación. |
| **Ayni** | Reciprocidad andina: hoy por vos, mañana por mí. | Profundo, boliviano, corto. | Más altiplánico que camba; muchas marcas ya lo usan. |
| **Punto Seguro** | El punto (QR) donde empieza la seguridad. | Descriptivo, claro para autoridades. | Dos palabras; genérico. |
| **Escudo** | Protección del pasajero y del conductor. | Fuerte, visual, señalético. | Usado por seguros y antivirus. |
| **Vía** | Vía segura, vía de emergencia. | Mínimo, escalable, elegante. | Demasiado genérico; difícil de registrar. |
| **Cruz** | Por Santa Cruz y por la cruz de emergencia. | Local y sanitario a la vez. | Confusión con Cruz Roja (y marca protegida). |

**Top 3**

1. **QRuta** — Es la que mejor explica el mecanismo sin una palabra más, ya está en uso y su
   debilidad (que suene a "rutas") se corrige con la bajada: *"QRuta · Identificación y seguridad
   del transporte público"*. El prototipo usa esta marca; cambiarla es una constante.
2. **Sello** — La mejor candidata si se busca una marca-categoría ("¿tiene Sello?") y un fuerte
   componente institucional para ciudades y operadores.
3. **Faro** — La más internacional y emocional; ideal si el producto crece hacia respuesta a
   emergencias en general (no solo transporte).

**Sistema de identidad** (aplicado en el prototipo): símbolo "Q" con punto de cierre rojo dentro
de un cuadrado azul (lee como módulo de QR y como escudo); azul `#14306B`, verde `#0F8A5F`,
rojo `#D7263D`; Bricolage Grotesque para titulares y Manrope para UI; voz directa, en voseo,
sin exclamaciones; el rojo aparece solo cuando algo es una emergencia.
