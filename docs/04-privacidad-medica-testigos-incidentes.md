# 4 · Conductor, información médica, testigos e incidentes

## 4.1 La información del conductor: niveles de acceso

El conductor es parte de la identidad del vehículo, pero es una **persona** que maneja 12 horas
al día expuesto a pasajeros enojados. El diseño protege ambas cosas.

| Dato | Cualquier persona (escaneó) | Contacto autorizado | Servicio de emergencia | Operador / línea | Nunca |
|---|---|---|---|---|---|
| Nombre | Nombre + inicial ("Juan Carlos M.") | Nombre y primer apellido | Completo | Completo | — |
| ID de conductor | ✓ | ✓ | ✓ | ✓ | — |
| Estado (registrado / suspendido) | ✓ | ✓ | ✓ | ✓ | — |
| Licencia (vigente sí/no, categoría) | ✓ | ✓ | ✓ + número | ✓ + número | — |
| Certificado municipal | Enmascarado | Enmascarado | ✓ | ✓ | — |
| Foto | ✗ | ✗ | ✓ | ✓ (app conductor la muestra al propio conductor) | Web pública |
| Teléfono | ✗ | Vía la app (no se muestra) | ✓ durante incidente | ✓ | Web pública |
| Dirección | ✗ | ✗ | ✗ | Solo RR. HH. del operador, fuera de QRuta | Siempre fuera |
| CI / documento | ✗ | ✗ | Últimos 3 dígitos | ✓ | Web pública |
| Contactos de emergencia | "Existen: podés pedir que se les avise" | Se ve a sí mismo | ✓ | ✓ nombres | Números al público |
| Perfil médico | ✗ (borroso + candado) | Tipo de sangre y alergias | Completo | ✗ | Operador, público |
| Historial de incidentes | ✗ | ✗ | Incidentes abiertos | ✓ | Público |
| Ubicación del vehículo | Redondeada, solo en sesión | Exacta si hay incidente | Exacta si hay incidente | En tiempo real | Historial al público |

**Cómo se eleva el nivel desde la misma página, sin cuenta previa:**

- *Contacto autorizado*: toca "Soy contacto del conductor" → el sistema envía un OTP **al número que el conductor registró**, no al que el usuario escriba. Si la persona lo recibe, es quien dice ser. 30 min, atado al incidente.
- *Servicio de emergencia*: (a) cuenta institucional (SEDES, Policía, Bomberos, hospitales) con OIDC; o (b) **código de incidente** que el despacho del operador o el operador de QRuta entrega por radio/llamada al equipo que va en camino. Todo acceso queda en auditoría visible al conductor.

## 4.2 Información médica: Privacy by Design aplicado

| Principio | Cómo se cumple |
|---|---|
| **Proactivo, no reactivo** | El perfil médico es *opt-in* con consentimiento explícito y fechado; se puede borrar en un toque; se renueva anualmente. |
| **Privacidad por defecto** | Sin perfil no hay datos. Con perfil, nadie lo ve sin elevación auditada. Público ve un candado, no un teaser. |
| **Embebida en el diseño** | Cifrado a nivel de campo con clave por ciudad (KMS); la API pública **no tiene endpoint** que devuelva el perfil: solo `/emergency-info` con token elevado. |
| **Funcionalidad total** | Servicios de emergencia ven todo lo relevante en una pantalla, en 2 s. |
| **Seguridad extremo a extremo** | TLS + cifrado en reposo + logs sin PII + retención limitada. |
| **Visibilidad y transparencia** | El conductor ve "quién vio mis datos, cuándo y por qué incidente". |
| **Respeto por el usuario** | Minimización: solo tipo de sangre, alergias, condiciones críticas, medicación crítica, notas cortas, contactos. Nada de historial clínico. |

**Qué nunca se hace público**: dirección, CI completo, teléfono, foto, historial clínico,
datos de familiares menores, historial de ubicaciones, historial de incidentes del conductor.

El mismo modelo aplica al **perfil de emergencia del pasajero** (opcional): sirve si la
víctima es quien tiene QRuta instalada o lleva una tarjeta/llavero con su propio QR.

## 4.3 Función "Soy testigo"

Flujo obligatorio:

1. **Pantalla de seguridad primero** (roja, no se puede saltar): *"Si estás en peligro, alejate del vehículo y pedí ayuda. No grabes desde la calzada ni te acerques a un vehículo con humo, combustible o cables."* Botones: "Estoy a salvo, quiero aportar" / "Ahora no".
2. **Relato en tus palabras** (texto libre; en MVP 2, nota de voz transcrita).
3. **Evidencia opcional**: fotos/video (máx. 60 s, comprimido), con aviso "solo si ya estás a salvo; se guardan cifradas y no se publican".
4. **Contacto opcional** (teléfono o correo) para que Tránsito/seguro puedan ubicarte.
5. **Ubicación adjunta** (activada por defecto, desactivable).
6. Confirmación: "Tu testimonio quedó asociado al incidente INC-…. Podés pedir su eliminación después."

Reglas:
- No hay "modo grabar" en vivo ni cámara dentro del flujo de testigo: se usa la galería. Evitamos incentivar grabar de cerca.
- Evidencias cifradas por incidente; acceso solo a operador, autoridad y seguro con incidente abierto; borrado a los 2 años salvo proceso judicial.
- Múltiples testigos se agregan al mismo incidente (deduplicación por vehículo + ventana de 15 min).
- Testimonio anónimo permitido; testimonios con contacto pesan más en la verificación.

## 4.4 Identificación del incidente

**Formato**: `INC-{año}-{ciudad}-{secuencial de 6}` → `INC-2026-SCZ-000245`. Legible, dictable,
ordenable, único por ciudad y año. Internamente UUID v7.

**Se registra**: vehículo, conductor de turno (o "sin asignar"), línea/operador, ubicación
(reportante y vehículo, con precisión), hora, persona que reportó (rol + número si lo compartió
+ fingerprint de dispositivo), tipo, heridos sí/no/no sé, estado, eventos (quién, cuándo, qué),
notificaciones (a quién, canal, entregado/visto), evidencias voluntarias, testigos, contactos
notificados, escaneos asociados (todos los que escanearon ese QR en la ventana).

**Estados y quién los mueve:**

| Estado | Color | Entra cuando | Lo mueve | Sale a |
|---|---|---|---|---|
| 🟡 **Reportado** | `#F2C94C` | Se crea el incidente (escaneo + reporte, SOS del conductor, o alerta del operador). | Sistema | Verificando (automático, ≤5 s) |
| 🟠 **Verificando** | `#F2994A` | Se pide confirmación al conductor (app, 90 s) y al operador (panel); se correlacionan otros escaneos y GPS. | Sistema / operador | Emergencia activa (heridos, SOS, sin respuesta + 2º escaneo) · Resuelto (falsa alarma confirmada) |
| 🔴 **Emergencia activa** | `#D7263D` | Confirmación de heridos, SOS, o silencio del conductor con señales coherentes. | Operador / sistema | Ayuda solicitada |
| 🔵 **Ayuda solicitada** | `#2F80ED` | Alguien pidió ayuda desde la web, el operador despachó, o se llamó al 118/110 desde el flujo. | Reportante / operador / servicio | En atención |
| 🟣 **En atención** | `#9B51E0` | Servicio de emergencia confirma llegada (código de incidente) o el operador lo registra. | Servicio / operador | Resuelto |
| 🟢 **Resuelto** | `#0F8A5F` | Cierre con nota (heridos trasladados, sin heridos, falsa alarma, derivado a Tránsito). | Operador / autoridad | — (reapertura solo por autoridad) |

El reportante **solo ve** la evolución; no puede cerrar. Cada transición genera evento, auditoría
y, si corresponde, notificación (contactos del conductor, reportante con número, operador).

## 4.5 Geolocalización

- **Tres fuentes**, con prioridad y etiqueta explícita: (1) GPS del teléfono de quien reporta (pedido en el momento, `enableHighAccuracy`, timeout 6 s); (2) última posición del vehículo desde la app del conductor (cada 30 s en jornada; 10 s si hay incidente); (3) posición del escaneo por IP/celda (solo como pista de fraude, nunca se muestra).
- **Precisión visible**: siempre se muestra "±12 m" y la fuente. Nunca se pretende más precisión de la que hay.
- **Redondeo por nivel**: público ~50 m (y solo durante la sesión); contacto/servicio exacta con incidente abierto; operador tiempo real.
- **Mapas**: proveedor detrás de un adaptador por ciudad (MapLibre + teselas propias o Google Maps según costo); **fallback offline esquemático** (los anillos de Santa Cruz en SVG, como en el prototipo) para que la pantalla nunca quede en blanco.
- **Geocodificación inversa local**: "Av. Santos Dumont y 4º anillo" vale más que coordenadas; se construye con la red vial abierta (OSM) y el catálogo de anillos/radiales.
- **Compartir ubicación**: enlace `qruta.bo/l/{token}` que muestra el punto y el vehículo por 24 h; mensaje prearmado; Web Share API.
- **Privacidad**: la ubicación del pasajero nunca se guarda fuera de un reporte/testimonio; la del vehículo solo durante la jornada; historial de recorridos disponible al operador 30 días y a la autoridad con requerimiento.
