# 7 · MVP, roadmap, modelo de negocio, validación y riesgos

## 7.1 MVP (probar la idea con vehículos reales)

**Alcance**: 1 operador (una línea de ~40 unidades), 2 placas por micro (exterior puerta + interior), 8–10 semanas de desarrollo, piloto de 90 días.

| Incluye | Detalle |
|---|---|
| QR físico | Placas exteriores en aluminio reflectivo + interiores en vinilo; emisión/versionado/revocación desde el panel; instalación confirmada con foto. |
| Identificación del vehículo | Ficha pública: línea, unidad, placa, tipo, documentos vigentes sí/no, operador, última posición redondeada. |
| Identificación del conductor | Registro por operador (importación del registro municipal donde exista); vínculo por jornada desde la app del conductor (PWA Android); nombre + inicial público. |
| Información autorizada | Perfil médico voluntario del conductor con cifrado por campo; niveles público / contacto (OTP) / servicio (código de incidente); auditoría visible. |
| PWA de emergencia | SSR, sin app, modo emergencia, offline básico (shell + última ficha + teléfonos + cola de reporte). |
| Reporte de accidente | 3 pasos, GPS, Incident ID, 6 estados, línea de tiempo, verificación con el conductor (90 s). |
| Ubicación | GPS del reportante + última posición del vehículo; compartir enlace 24 h; mapa (MapLibre) con fallback esquemático. |
| Contacto de emergencia | Notificación por WhatsApp/SMS a contactos del conductor y al despacho del operador sin exponer números. |
| Dashboard básico | Mapa en tiempo real, vehículos, conductores, QR, bandeja de incidentes con transiciones, alertas, auditoría. |
| Soy testigo (básico) | Advertencia + texto + fotos + contacto opcional. |
| Números de emergencia por ciudad | Directorio configurable, validado con la autoridad. |

**No incluye** (a propósito): app iOS nativa, perfil del pasajero, integración con 911/CAD, pago, rutas, chat, valoraciones de conductores.

**Métricas de éxito del piloto** (definir umbrales con el operador): tiempo mediano Reportado→Operador enterado (<60 s); % de unidades con jornada abierta en horario (>80 %); escaneos espontáneos/unidad/semana; tasa de placas dañadas al mes (<3 %); % de incidentes reales con ID QRuta citado por Tránsito o el hospital; NPS de conductores sobre privacidad; cero fugas de datos.

## 7.2 Roadmap

| Fase | Qué agrega | Señal para avanzar |
|---|---|---|
| **MVP 1** (mes 0–5) | Lo de arriba, 1 línea, Santa Cruz. | Piloto de 90 días con métricas cumplidas y al menos 1 incidente real gestionado de punta a punta. |
| **MVP 2** (mes 6–10) | 3–5 líneas; placa trasera; **QR de respaldo por asiento**; nota de voz en testigo; perfil de emergencia del pasajero + tarjeta/llavero QR; SMS de respaldo para "sin datos"; app del conductor con Capacitor (SOS con pantalla bloqueada, GPS en segundo plano); integración con el registro municipal (importación periódica); código de incidente para SEDES/Policía formalizado con convenio. | 200+ unidades; convenio con al menos una institución de respuesta; el municipio reconoce el ID de incidente. |
| **MVP 3** (mes 11–18) | Ficha técnica del vehículo para rescatistas (GNV, cilindro, batería); webhooks para despachos propios; integración con cámaras/QR de pago existentes (líneas 72/73) para compartir placa física; detección de QR clonado con ML sobre escaneos; panel municipal multi-operador; segunda ciudad (La Paz/Cochabamba) con trufis/minibuses; API para seguros (SOAT) con consentimiento. | 1 000+ unidades; ingresos recurrentes cubren operación; segunda ciudad activa. |
| **Futuro** | Otros modos (mototaxis, transporte interprovincial, teleférico, escolar); integración con 911/CAD donde exista; NFC además de QR; alertas a pasajeros a bordo (si instalaron la PWA) cuando su unidad tiene incidente; datos abiertos agregados de seguridad por línea; expansión regional (Paraguay, Perú) por configuración. | — |

## 7.3 Modelo de negocio

El pagador **no es el pasajero** (el escaneo es y será gratis). Tres capas de ingreso, en orden de realismo local:

| Fuente | Cómo | Orden de magnitud (a validar) |
|---|---|---|
| **Operadores (sindicatos/líneas)** | Suscripción por unidad/mes que incluye placas, reposición, app del conductor y panel. Se vende como *cumplimiento + reputación + protección legal del conductor* (evidencia y trazabilidad en un accidente). | Bs 15–25 / unidad / mes. 5 000 unidades → Bs 1,0–1,5 M/año. |
| **Municipio / gobernación** | Licencia de plataforma para el panel municipal multi-operador, integración con el registro 2024 y datos agregados de siniestralidad; puede subsidiar la placa como requisito de la tarjeta de operación. | Contrato anual; convierte a QRuta en infraestructura, no en app. |
| **Aseguradoras (SOAT) y hospitales** | Acceso con consentimiento a la ficha de incidente (menos fraude, siniestros más rápidos); patrocinio de placas con marca discreta *fuera* de la zona de señal. | Por incidente o anual. |
| **Complementos** | Tarjeta/llavero de perfil de emergencia para pasajeros (Bs 20–30 una vez); placas para flotas privadas (escolares, empresas). | Marginal, pero acerca al público. |

Costos principales: placas (Bs 35–60 el juego por unidad, reposición ~10 %/año), mensajería
(WhatsApp/SMS por incidente, bajo), infraestructura (<US$ 500/mes en piloto), equipo de campo
(instalación, capacitación de conductores), soporte al operador.

Principio: **nunca monetizar datos de pasajeros ni de ubicación**; los datos agregados de seguridad se publican como bien público.

## 7.4 Validación

1. **Desk research** ✔ (ver §8): el patrón existe, el hueco local es real.
2. **Prueba de placa sin backend** (2 semanas, 3 micros): ¿la gente escanea espontáneamente? ¿se lee al sol? ¿la vandalizan?
3. **Prototipo con conductores** (este repo): comprensión de niveles de privacidad; disposición a iniciar jornada; reacción al SOS.
4. **Test bajo estrés simulado** con 10 personas: tiempo hasta crear incidente; errores; comprensión de "Ayuda solicitada".
5. **Mesa con Tránsito, SEDES y un hospital**: ¿aceptan el ID? ¿qué ficha necesitan? ¿qué credencial usarían?
6. **Piloto de 90 días** con la línea, con métricas del §7.1 y un comité (operador, municipio, QRuta) que revise cada incidente.
7. **Auditoría de seguridad externa** antes de abrir a más líneas.

## 7.5 Riesgos y soluciones

| Riesgo | Probabilidad / impacto | Mitigación |
|---|---|---|
| **Resistencia de los sindicatos** ("nos van a controlar/multar") | Alta / alto | Vender protección del conductor (evidencia, auditoría de quién ve sus datos, SOS), no control; empezar con una línea aliada; el operador es dueño de sus datos; sin compartir GPS con el municipio en el MVP. |
| **Conductor no inicia jornada** → QR muestra "sin conductor asignado" | Alta / medio | Inicio desde el teléfono del dueño o con código en cabecera; recordatorio al arrancar; incentivo del operador; el vehículo sigue identificado aunque falte el conductor. |
| **Conflicto político Alcaldía–transporte** (paros, cambios de reglas) | Alta / medio | Arquitectura por operador, independiente del municipio; el municipio se suma como cliente, no como requisito. |
| **Placas vandalizadas o robadas** | Media / bajo | Reflectivo laminado, "void", revocación instantánea, reposición <Bs 35, alerta automática por escaneos fallidos. |
| **QR falsos para phishing** | Media / alto | Dominio único, código impreso, reporte de QR sospechoso, campaña "mirá que diga qruta.bo", detección geográfica. |
| **Falsos reportes / bromas** | Media / medio | Token de sesión, GPS cruzado, confirmación del conductor, estado *Verificando* antes de escalar, bloqueo de dispositivo reincidente. |
| **Fuga de datos médicos** | Baja / crítico | Cifrado por campo, sin endpoint público, grants con vencimiento, auditoría encadenada, pentest, mínimo dato. |
| **Servicios de emergencia no adoptan el ID** | Media / alto | Convenios en MVP 2; mientras tanto la ficha se dicta por teléfono y el ID viaja en el WhatsApp del operador; el valor para el operador y la familia existe igual. |
| **Zonas sin datos** | Media / medio | Offline por diseño, SMS de respaldo, teléfonos siempre. |
| **Dependencia de WhatsApp Business** | Media / medio | SMS de respaldo; push si instalaron la PWA; el panel siempre recibe. |
| **Sostenibilidad económica** | Media / alto | Tres pagadores; el municipio como ancla; costos de infraestructura muy bajos por diseño (PWA estática + API pequeña). |
| **Marco legal de datos incierto en Bolivia** | Media / medio | Adoptar estándar GDPR-like por política interna; consentimientos explícitos; DPO designado; preparado para una futura ley. |
| **Uso indebido por el operador** (vigilar conductores) | Media / medio | El operador no ve perfil médico; GPS solo en jornada; retención 30 días; el conductor ve su auditoría; contrato con cláusulas de uso. |

## 7.6 Prototipo funcional

Está en [`/prototype`](../prototype) y publicado como Artifact. Simula los 9 puntos pedidos
(escanear, identificar, conductor, información autorizada, reportar, ubicación, Incident ID,
notificar contacto, estado) más testigo, offline, app del conductor y panel del operador.
Lo simulado está marcado como DEMO en pantalla y en la consola lateral; lo real (QR escaneable,
GPS, portapapeles, vibración) también.
