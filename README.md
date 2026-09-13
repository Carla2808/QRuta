# QRuta

**Sistema de seguridad digital para el transporte público de Santa Cruz de la Sierra.**
Cada micro lleva una placa QR que es su identidad digital. Ante un accidente, cualquier persona
la escanea con la cámara del teléfono —sin app, sin cuenta— y en segundos sabe **qué vehículo
es, de qué línea, quién lo conduce, dónde está y a quién avisar**, con un protocolo de
emergencia guiado, un ID de incidente y niveles de privacidad.

No es Yango, Uber ni inDrive. No sirve para pedir transporte. Sirve para
**identificar + informar + proteger + responder**.

## Contenido

| Ruta | Qué hay |
|---|---|
| [`docs/01-concepto-problema-solucion.md`](docs/01-concepto-problema-solucion.md) | Concepto, problema con datos locales, solución por capas, diferencial, user journey, innovación local |
| [`docs/02-experiencia-ux-ui.md`](docs/02-experiencia-ux-ui.md) | Principios para personas bajo estrés, sistema visual, flujos, **las 18 pantallas**, 12 momentos WOW, PWA, sin internet |
| [`docs/03-qr-seguridad.md`](docs/03-qr-seguridad.md) | Pipeline QR→token→backend, estático vs dinámico, UUID, tokens, revocación, clonado, manipulación, rate limiting, auditoría, seguridad general |
| [`docs/04-privacidad-medica-testigos-incidentes.md`](docs/04-privacidad-medica-testigos-incidentes.md) | Niveles de acceso del conductor, información médica (Privacy by Design), función testigo, Incident ID y 6 estados, geolocalización |
| [`docs/05-arquitectura-datos-api.md`](docs/05-arquitectura-datos-api.md) | Ecosistema, stack, modelo de datos (14 entidades), API completa del MVP, app del conductor, panel del operador, multi-ciudad |
| [`docs/06-diseno-fisico-e-identidad.md`](docs/06-diseno-fisico-e-identidad.md) | La placa (material, tamaño, legibilidad, reemplazo), 7 ubicaciones, 10 nombres y top 3, identidad |
| [`docs/07-mvp-roadmap-negocio-riesgos.md`](docs/07-mvp-roadmap-negocio-riesgos.md) | MVP 1/2/3/futuro, modelo de negocio, validación, riesgos y soluciones |
| [`docs/08-investigacion-fuentes.md`](docs/08-investigacion-fuentes.md) | Qué ya existe (Delhi, Mumbai, QR médicos, Mercedes/GM, líneas 72/73…) y contexto de Santa Cruz con fuentes |
| [`prototype/`](prototype/) | **Prototipo funcional** (PWA de emergencia + app del conductor + panel del operador) |

## Prototipo

```sh
cd prototype && python3 -m http.server 8000
# http://localhost:8000            → demo completa
# http://localhost:8000/?qr=SCZ-Q7K3-M9V2 → así llega un teléfono que escaneó la placa
```

Sin build ni dependencias de red: Three.js y el generador de QR están vendorizados. Simula los
9 puntos pedidos —escanear, identificar vehículo, conductor, información autorizada por nivel,
reportar accidente, ubicación, Incident ID, notificar contacto, estado— más testigo, modo
emergencia, red lenta/sin conexión, app del conductor y panel del operador. Una consola lateral
muestra el pipeline del backend simulado en cada acción.

**Real en la demo**: el QR de la placa (escanealo con tu teléfono), la geolocalización del
navegador, copiar/compartir y la vibración. **Simulado y marcado como DEMO**: backend, SMS,
llamadas y todas las personas, vehículos y placas (datos ficticios).

Estructura: `index.html` (documento completo) · `body.html` (mismo contenido, fragmento que se
publica como Artifact) · `css/app.css` · `js/{data,qr,map,bus3d,app}.js` · `sw.js` · `vendor/`.
