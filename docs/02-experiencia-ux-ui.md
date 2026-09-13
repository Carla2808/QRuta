# 2 · Experiencia: UX, UI, flujos y pantallas

## 2.1 Principios de interfaz para personas bajo estrés

Quien escanea acaba de ver un accidente. Tiene adrenalina, manos temblorosas, sol en la pantalla,
gente gritando y una sola pregunta: *¿qué hago?* De la literatura de diseño de emergencias y de
UI en cabinas/hospitales tomamos estas reglas y las aplicamos literalmente en el prototipo:

1. **Una pregunta por pantalla.** Reportar = tres pantallas de una decisión cada una (¿qué pasó? → ¿hay heridos? → confirmar).
2. **Objetivos táctiles ≥ 56 px**, separados ≥ 10 px; en modo emergencia ≥ 66 px. Nada requiere precisión.
3. **Jerarquía brutal.** Primera pantalla: un mensaje (VEHÍCULO IDENTIFICADO), cuatro datos, cinco acciones. Punto.
4. **Contraste alto y fondo claro por defecto** (legible al sol); modo emergencia oscuro con rojo solo en lo que importa.
5. **Sin jerga del sistema.** "Avisar a la familia del conductor", no "notificar contactos de emergencia registrados".
6. **Confirmaciones que dicen qué pasó** ("Ayuda solicitada. Ambulancia y policía recibieron los datos"), no "Éxito".
7. **Nada se pierde si cierran la página**: el incidente tiene ID; si vuelven a escanear, lo retoman.
8. **Feedback multisensorial**: vibración al identificar y al enviar; animación de reconocimiento; color de estado.
9. **Salida siempre visible.** Botón "Salir" del modo emergencia; "Ahora no" en testigo.
10. **Idioma local**: voseo cruceño ("escaneá", "alejate") en la web pública; neutro en el panel.

## 2.2 Sistema visual

| Token | Valor | Uso |
|---|---|---|
| Azul institucional | `#14306B` | Placa física, botones primarios, marca. Elegido porque **ningún anuncio en un micro es azul marino sobrio**: se lee como señalética. |
| Verde verificación | `#0F8A5F` | "Vehículo identificado", estados OK. |
| Rojo emergencia | `#D7263D` | Solo emergencia y peligro. Nunca decorativo. |
| Ámbar | `#F2A93B` | Estados intermedios, color de línea en la demo. |
| Tinta / papel | `#101828` / `#F4F6FA` | Texto y fondo (neutros con sesgo frío, no gris puro). |
| Display | **Bricolage Grotesque** 800 | Titulares cortos en mayúsculas: VEHÍCULO IDENTIFICADO, EMERGENCIA, número de línea. |
| UI | **Manrope** 500–800 | Todo lo demás; números tabulares. |
| Mono | **JetBrains Mono** | Placa, IDs (`INC-2026-SCZ-000245`), códigos QR. Lo que se dicta por teléfono va en mono. |
| Radio / sombra | 14–22 px / una sola sombra suave | Tarjetas flotan poco; solo el vehículo 3D y la placa tienen profundidad real. |
| Glassmorphism | Solo el chip de línea sobre el 3D | Con moderación, como se pidió. |

**3D y movimiento con función:** el micro 3D no es adorno: confirma *este tipo de vehículo* y,
en la pantalla de placa, **muestra dónde está el QR** (el highlight verde pulsa en la ubicación
elegida). El mapa hace zoom al punto. El QR "se traba" con esquinas verdes al reconocerse. Todo
respeta `prefers-reduced-motion`.

## 2.3 Flujos principales

```
[QR físico] → cámara nativa → https://salvo.bo/v/CODE
   ├─ ok        → VEHÍCULO IDENTIFICADO ─┬─ Reportar accidente → tipo → heridos → GPS → INCIDENTE CREADO → ayuda / notificar / testigo / estado
   │                                     ├─ Contactar emergencia (110 / 118 / 119 + operador)
   │                                     ├─ Información crítica (bloqueada → OTP contacto / credencial servicio)
   │                                     ├─ Contacto de emergencia → Avisar ahora
   │                                     ├─ Compartir ubicación → copiar / compartir nativo
   │                                     └─ Soy testigo → advertencia de seguridad → relato/fotos/contacto
   ├─ revoked   → "Este QR ya no es válido" + llamar + reportar QR sospechoso
   ├─ unknown   → "QR no reconocido" + llamar + reportar QR sospechoso
   └─ offline   → ficha cacheada (si la hay) + llamar + reporte en cola
```

## 2.4 Las 18 pantallas

Formato: **Objetivo · Elementos · CTA principal · CTA secundario · Estados · Errores · Loading · Vacío · Accesibilidad.**
Las pantallas 1–3 y 16–18 solo existen si la persona entra por la URL raíz o instala la PWA; el
camino del accidente empieza en la 4/5.

| # | Pantalla | Objetivo | Elementos clave | CTA principal | CTA secundaria | Estados / errores / loading / vacío | Accesibilidad |
|---|---|---|---|---|---|---|---|
| 1 | **Splash** | Marca en 1 s, nunca bloquear. | Logo S, "Identifica. Informa. Protege. Responde." | (auto) | — | Máx. 1,4 s; si hay `?qr=` se salta. | Sin animación con reduced-motion. |
| 2 | **Onboarding** (solo PWA instalada) | Explicar 3 cosas: qué es, qué NO guardamos, cómo escanear. | 3 tarjetas deslizables, ilustración de placa. | "Entendido" | "Crear perfil de emergencia (opcional)" | Se muestra una vez; vacío: no aplica. | Texto ≥ 16 px, orden de foco lineal. |
| 3 | **Home** | Punto de partida para quien no está en emergencia. | Hero "Escaneá el QR del micro…", accesos: placa física, app conductor, perfil, escaneos recientes. | "Escanear QR" (abre cámara) | Tiles secundarios | Vacío: "Todavía no escaneaste ningún vehículo. Los escaneos quedan en este teléfono." | Contraste AA en hero azul. |
| 4 | **Escaneo QR** | Leer el código sin pensar. | Visor, retícula, láser, texto "Apuntá al QR". | (auto al detectar) | Atrás · linterna | Estados: buscando → leído → validando → ok/fallo. Error cámara: "Permití la cámara o escribí el código". Sin red: valida contra caché. | Alternativa manual: campo de 10 caracteres. |
| 5 | **Vehículo identificado** | Responder en 3 s "qué es esto y qué puedo hacer". | Banda verde ✓, micro 3D con línea gigante, ficha (línea/unidad/placa/tipo), conductor (nombre + inicial, ID, ✓), mapa con pulso, 5 acciones, "Soy testigo". | **REPORTAR ACCIDENTE** (rojo) | 4 acciones + testigo | Loading: skeleton de ficha en <300 ms, 3D y mapa cargan después (progresivo). Sesión vencida: "Volvé a escanear". Vehículo `out_of_service`: banda ámbar "Fuera de servicio · sin conductor asignado". | Todo operable con lector de pantalla; el 3D es `aria-hidden` con texto equivalente. |
| 6 | **Información del conductor** | Confirmar identidad sin exponer a la persona. | Avatar iniciales (sin foto pública), nombre según nivel, ID, licencia vigente sí/no, registro municipal enmascarado, operador, tabla "qué ve cada nivel". | — (informativa) | Atrás | Conductor `suspended`: pill roja "Suspendido" + "igual podés pedir ayuda". Sin conductor de turno: "Sin conductor asignado a esta hora". | Nivel actual anunciado. |
| 7 | **Información del vehículo** | Datos que Tránsito/seguro necesitan. | 3D, placa, unidad, tipo, marca/año, color, inspección, SOAT, versión de QR. | — | Atrás | Documentos vencidos → pill ámbar (visible a todos: es interés público). | Tabla semántica. |
| 8 | **Información crítica** | Datos médicos **solo a quien corresponde**. | Grilla médica (borrosa si público), candado, botones de elevación. | "Soy personal de emergencia" | "Soy contacto del conductor" | Público: bloqueado. Contacto: parcial. Servicio: completo + aviso de auditoría. Sin perfil: "El conductor no registró información médica". OTP fallido ×3: espera 15 min. | Borroso + `aria-hidden`; texto alternativo "acceso restringido". |
| 9 | **Emergencia** | Cambiar la prioridad de toda la interfaz. | Fondo oscuro, baliza roja, 2 hechos (vehículo, ubicación), 4–5 acciones gigantes, números de la ciudad. | **REPORTAR ACCIDENTE** / **SOLICITAR AYUDA** | LLAMAR 110 · COMPARTIR · INFO CRÍTICA · ESTADO | Sin red: LLAMAR sigue; REPORTAR encola. Con incidente: muestra ID y estado. | Botones ≥ 66 px; sin texto <14 px; alto contraste 12:1. |
| 10 | **Reportar accidente** | Crear el incidente en 3 toques. | Paso 1 tipo (6 opciones), paso 2 heridos + compartir mi número, paso 3 GPS + resumen. | "Continuar" / "Enviar reporte" | Atrás | GPS: anillo girando → ✓; si falla, usa posición del vehículo marcada DEMO/aprox. Sin red: "Reporte guardado, se enviará solo". Duplicado (ya hay incidente abierto <15 min en ese vehículo): "Ya hay un reporte, ¿sumarte como testigo?" | Botón deshabilitado con motivo visible. |
| 11 | **Soy testigo** | Aportar sin exponerse. | **Primero**: advertencia roja "Si estás en peligro, alejate…"; luego texto libre, fotos/video, contacto opcional, ubicación. | "Estoy a salvo, quiero aportar" → "Enviar testimonio" | "Ahora no" | Vacío permitido (solo ubicación). Sin red: se guarda local. Video > 60 s: se recorta. | Textarea con label; instrucciones antes del campo. |
| 12 | **Compartir ubicación** | Enviar el lugar exacto a alguien. | Mapa, mensaje prearmado con vehículo/lugar/hora/ID, enlace. | "Copiar" | "Compartir" (Web Share) · "Usar mi GPS" | Sin `navigator.share`: solo copiar. Sin GPS: usa la del vehículo, dice cuál es. | Mensaje seleccionable, enlace legible. |
| 13 | **Incidente creado** | Dar un ancla: el ID. | Tarjeta negra con `INC-…`, hora, ciudad, tipo; acciones: solicitar ayuda, notificar contactos, testigo, estado, compartir; lista de notificados. | "Solicitar ayuda" (si hay heridos) | Notificar · testigo · estado | Encolado offline: badge "pendiente de envío". | ID en mono, copiable con un toque. |
| 14 | **Estado de emergencia** | Ver que alguien lo está atendiendo. | Línea de tiempo de 6 estados con hora y nota; acciones de simulación en demo. | "Solicitar ayuda" (si no se pidió) | Atrás | Resuelto: mensaje de cierre. Sin cambios en 10 min: "Seguimos esperando confirmación del operador". | Colores + texto + icono (no solo color). |
| 15 | **Confirmación de ayuda** | Bajar la ansiedad. | Banda verde "AYUDA SOLICITADA", qué se envió, ID, "quedate cerca si es seguro". | "Seguir el estado" | "Volver a emergencia" | — | Mensaje leído por lector al entrar (`aria-live`). |
| 16 | **Perfil del usuario** | Opcional: yo como posible víctima. | Tipo de sangre, alergias, condiciones, contactos; QR personal (tarjeta/llavero). | "Crear perfil" (OTP) | — | Vacío por defecto, explicado. | Formularios con autocompletar. |
| 17 | **Contactos** | Quién recibe aviso si me pasa algo. | Lista, relación, canal (WhatsApp/SMS), verificación del contacto. | "Agregar contacto" | "Probar aviso" | Contacto no verificado: pill ámbar. | — |
| 18 | **Historial** | Mis escaneos y reportes (solo local salvo cuenta). | Lista con fecha, línea/unidad, incidente si hubo. | — | "Borrar historial" | Vacío: "Sin escaneos ni reportes". | — |

## 2.5 Momentos WOW (cada uno con su función)

| # | Momento | Qué se ve | Para qué sirve |
|---|---|---|---|
| 1 | **Reconocimiento del QR** | Retícula blanca → esquinas verdes se cierran sobre el QR + vibración + check que estalla. | Feedback inequívoco de que "ya está", para que la persona deje de apuntar. |
| 2 | **✓ VEHÍCULO IDENTIFICADO** | Banda verde entra primero que todo; luego la ficha. | Genera confianza antes de pedir cualquier decisión. |
| 3 | **El micro aparece en 3D con la línea gigante** | Modelo low-poly girando suave, chip "LÍNEA 123" vidrioso. | Confirma tipo de vehículo y línea de un vistazo, incluso a quien no lee bien. |
| 4 | **El mapa hace zoom y late** | Anillos de Santa Cruz, ruta de la línea animada, punto rojo con pulso y radio de precisión. | Da certeza de "dónde" y de qué tan precisa es la posición. |
| 5 | **Modo emergencia** | La pantalla se vuelve negra/roja, baliza latiendo, cuatro botones enormes. | Recorta el mundo a lo esencial. |
| 6 | **Anillo de GPS que se cierra en ✓** | Spinner → check verde con precisión en metros. | Muestra que la ubicación se está obteniendo y cuándo terminó, sin texto técnico. |
| 7 | **La tarjeta negra del Incident ID** | `INC-2026-SCZ-000245` en mono grande. | Un número que se puede dictar por radio. Ancla mental. |
| 8 | **Línea de tiempo que avanza sola** | Reportado → Verificando → … con hora y nota de quién hizo qué. | Transparencia: "alguien está atendiendo". |
| 9 | **"AYUDA SOLICITADA" + qué se envió** | Banda verde y lista de datos enviados con precisión en metros. | Cierra el bucle de ansiedad: ya no hay que explicar nada por teléfono. |
| 10 | **La placa en el micro 3D** | Al tocar una ubicación, el QR en el modelo se ilumina en verde. | Explica a operadores/instaladores dónde va la placa y por qué. |
| 11 | **Consola del pipeline (solo demo)** | Cada toque muestra `POST /v1/qr/scan → 200 · QR v3 válido · token 15 min`. | Para el equipo técnico y para pitches: el sistema es real, no una maqueta. |
| 12 | **QR real en la demo** | Escanear la placa de la demo con un teléfono abre la demo directo en "identificado". | Prueba el flujo cero-fricción de verdad. |

## 2.6 PWA / web de emergencia

- **Ruta canónica**: `https://salvo.bo/v/{code}` (corta, imprimible, dictable). Sin `www`, sin parámetros.
- **Presupuesto de rendimiento**: primer render ≤ 1,5 s en 3G, ≤ 60 KB antes de mostrar la ficha; el 3D (Three.js) y fuentes se cargan **después** del primer render y se omiten en `Save-Data` o conexión lenta.
- **Progresiva**: HTML servido con la ficha pública ya renderizada (SSR) → hidrata → añade mapa y 3D. Sin JS funcionan: ficha, teléfonos (`tel:`), y un formulario de reporte HTML plano.
- **Instalable pero opcional**: manifest, ícono, `display: standalone`. Nunca se pide instalar durante una emergencia.
- **Service worker**: shell cache-first; `/v1/*` network-first con caché de la última ficha; **Background Sync** para reportes y testimonios encolados; notificaciones push solo si la persona dejó su número/instaló la app.
- **Permisos**: cámara (solo si se usa el escáner in-app), ubicación (se pide en el momento de reportar, con explicación), nunca contactos.
- **Compatibilidad**: Android 8+ / Chrome 90+, iOS 15+ Safari. Cámara nativa de ambos lee QR con URL sin app.

## 2.7 Sin internet / mala señal

| Condición | Qué pasa | Qué mínimo funciona |
|---|---|---|
| **Rápida (4G)** | Todo, incl. 3D y mapa. | — |
| **Lenta (3G)** | Ficha en <2 s; 3D omitido; mapa estático; imágenes de testigo comprimidas a 1280 px. Banner "Conexión lenta — versión ligera". | Todo el protocolo. |
| **Señal débil / timeouts** | Reintento automático ×2 con backoff; la UI nunca se queda en spinner >6 s: ofrece "llamar" mientras tanto. | Ficha, llamadas, reporte encolado. |
| **Sin conexión** | Si la placa se escaneó antes en ese teléfono: ficha cacheada con aviso "datos guardados, hora X". Si no: página offline con **el código escaneado, teléfonos de la ciudad (cacheados por prefijo `SCZ`) y formulario de reporte que se encola**. | `tel:` siempre; SMS prearmado al despacho del operador como canal alternativo (`sms:` con texto: "SALVO INC vehículo SCZ-Q7K3-M9V2 choque heridos ubicación …"). |

Ideas locales adicionales: **SMS de respaldo** (Bolivia mantiene buena cobertura 2G/SMS donde
no hay datos) con un número corto del operador que responde con línea/unidad/conductor de
turno; y **placa con datos mínimos impresos** (línea, unidad, código) para que aun sin ningún
teléfono la persona pueda dictarlos al 110.
