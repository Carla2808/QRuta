# 5 · Arquitectura, modelo de datos, API, app del conductor y panel

## 5.1 El ecosistema (no una app)

```
PASAJERO/TESTIGO ──escanea──► QR ──resuelve──► VEHÍCULO ──turno──► CONDUCTOR
        │                                          │                   │
        ▼                                          ▼                   ▼
   Web de emergencia (PWA) ───────────────► BACKEND (API + políticas + auditoría) ◄──── App del conductor
        │                                          │
        ▼                                          ├──► INCIDENTE (ID, estados, eventos, evidencias)
   CONTACTOS (WhatsApp/SMS)  ◄─────notifica────────┤
   OPERADOR (panel, despacho) ◄────alerta──────────┤
   SERVICIOS (110/118/119, hospitales) ◄─ficha─────┤
                                                   └──► RESPUESTA (estado, cierre, aprendizaje)
```

## 5.2 Stack propuesto (listo para desarrollo)

| Capa | Elección | Motivo |
|---|---|---|
| **Web de emergencia (PWA)** | **SvelteKit** (SSR + hidratación parcial) o Next.js si el equipo ya lo domina; TypeScript; CSS propio con tokens (sin framework pesado); Three.js cargado diferido; MapLibre GL diferido. Estado: stores por pantalla + máquina de estados XState para el flujo de reporte. Componentes: `VehicleCard`, `DriverRow`, `LocationMap`, `EmergencyActions`, `IncidentTimeline`, `AccessGate`, `WitnessForm`. | SSR = la ficha llega renderizada en <60 KB en 3G. Un flujo crítico modelado como máquina de estados es testeable y no se rompe con la red. |
| **App del conductor** | PWA instalable en Android (misma base) + wrapper **Capacitor** para: SOS con pantalla bloqueada, GPS en segundo plano durante la jornada, notificaciones. iOS después. | Un solo código; los conductores usan Android de gama media. |
| **Panel del operador** | SvelteKit/Next, tablas virtualizadas, MapLibre en tiempo real (WebSocket/SSE), RBAC en la UI reflejando el del backend. | — |
| **Backend** | **Node.js 22 + TypeScript + Fastify** (o NestJS si se prefiere estructura fuerte). API REST versionada (`/v1`) + SSE para tiempo real. Autenticación: OAuth 2.1/PKCE para conductor/operador (Keycloak o Auth.js), OTP para contactos, JWT ES256 de vida corta para sesiones de escaneo. Servicios: `qr`, `vehicles`, `drivers`, `shifts`, `incidents`, `notifications`, `access`, `audit`, `geo`, `cities`. Políticas: motor central (Cedar/OPA o lib propia). Colas: BullMQ/Redis para notificaciones, Background Sync y correlación de escaneos. | Ecosistema conocido en Bolivia, buen rendimiento, un solo lenguaje con el frontend. |
| **Base de datos** | **PostgreSQL 16 + PostGIS**; cifrado de columnas con `pgcrypto`/KMS; particionado por ciudad y mes en `scan_events` y `locations`. Redis para rate limiting, sesiones de escaneo y últimas posiciones. Objetos (evidencias, fotos de instalación) en S3 compatible con cifrado por incidente. | PostGIS resuelve "dentro del corredor", "a menos de 3 km", geocodificación inversa. |
| **Mensajería** | WhatsApp Business API (proveedor local o Twilio), SMS de respaldo (Tigo/Entel agregador), push web/FCM. | WhatsApp es el canal real en Bolivia. |
| **Infraestructura** | Contenedores en un proveedor con región cercana (AWS São Paulo o GCP; alternativa nacional para datos sensibles si el municipio lo exige), CDN (Cloudflare) para la PWA y la ruta `/v/*` con caché de la shell, WAF + rate limiting en el borde, IaC (Terraform), CI/CD con despliegue azul/verde. | Latencia <100 ms a Santa Cruz; independencia del proveedor. |
| **Observabilidad** | OpenTelemetry → Grafana/Tempo/Loki (o Datadog); métricas clave: p95 de `/qr/scan`, tasa `unknown/revoked/suspect`, tiempo Reportado→Ayuda solicitada, entregabilidad de notificaciones; alertas on-call. Logs sin PII. | Un sistema de emergencia se mide por latencia y por lo que falla. |
| **Multi-ciudad** | `city_id` en todas las entidades; configuración por ciudad (teléfonos, idioma/voseo, mapa, prefijo de código, política de datos, proveedor de SMS); rutas y líneas **en datos, nunca en código**; despliegue único con aislamiento lógico (RLS de PostgreSQL por ciudad/operador). | Santa Cruz → La Paz/Cochabamba → otros modos (trufis, teleférico) → otros países (solo cambia configuración y proveedor de mensajería). |

## 5.3 Modelo de datos

```
City ─┬─< Operator ─┬─< Route ─< Vehicle >─ QRCode (1..n, versionadas)
      │             └─< Driver ─< DriverEmergencyContact
      │                    │
      │                    └─< Shift >─ Vehicle         (vínculo conductor↔unidad por jornada)
      ├─< EmergencyNumber
      └─< Incident ─┬─< IncidentEvent
                    ├─< IncidentWitness ─< Evidence
                    ├─< Notification
                    └─< AccessGrant                    (elevaciones de nivel, con vencimiento)
User (opcional) ─ EmergencyProfile ─< EmergencyContact
ScanEvent (append-only)   Location (append-only, particionada)   AuditLog (append-only, hash encadenado)
```

| Entidad | Campos importantes | Notas |
|---|---|---|
| **City** | `id`, `code` (SCZ), `name`, `country`, `tz`, `locale`, `center`, `map_provider`, `policy_json` | Configuración, no código. |
| **EmergencyNumber** | `city_id`, `label`, `number`, `kind`, `verified_at` | Validado con autoridad. |
| **Operator** | `id`, `city_id`, `name`, `type` (sindicato/empresa/municipal), `dispatch_phone_enc`, `plan` | El sindicato/línea. |
| **Route** | `id`, `operator_id`, `number`, `name`, `corridor_geom` (PostGIS LineString), `color` | Corredor para detectar QR clonado. |
| **Vehicle** | `id`, `city_id`, `operator_id`, `route_id`, `unit_number`, `plate`, `type`, `make`, `year`, `color`, `inspection_until`, `soat_until`, `status`, `owner_id` | Índices: `(city_id, plate)` único, `(route_id, unit_number)`. |
| **QRCode** | `id`, `code` (único, opaco), `vehicle_id`, `version`, `placement`, `status` (active/revoked/suspect), `installed_at`, `installed_by`, `install_photo_key`, `revoked_at`, `revoked_reason`, `hmac_kid` | Varias placas por vehículo; una activa por `placement`. |
| **Driver** | `id`, `city_id`, `operator_id`, `public_id`, `first_name`, `last_name_enc`, `doc_last3`, `phone_enc`, `photo_key`, `license_category`, `license_until`, `municipal_cert`, `status`, `consent_profile_at` | Datos sensibles cifrados a nivel de campo. |
| **DriverEmergencyContact** | `driver_id`, `name`, `relation`, `phone_enc`, `channel`, `verified_at` | El OTP de "contacto autorizado" va a este número. |
| **Shift** | `id`, `driver_id`, `vehicle_id`, `started_at`, `ended_at`, `started_via` (app/owner/code), `last_location_at` | Único abierto por vehículo. Define "conductor registrado" en el escaneo. |
| **ScanEvent** | `id`, `qr_id`, `qr_version`, `city_id`, `at`, `result`, `ip_trunc`, `ua_hash`, `geo_approx`, `session_jti` | Sin identidad. Particionada por mes. |
| **Incident** | `id` (UUID v7), `public_id` (INC-…), `city_id`, `vehicle_id`, `shift_id`, `driver_id`, `route_id`, `type`, `injured` (yes/no/unknown), `state`, `reported_at`, `reporter_role`, `reporter_phone_enc?`, `reporter_device_hash`, `reporter_geom`, `vehicle_geom`, `accuracy_m`, `closed_at`, `closure_note`, `source` (scan/sos/operator) | Índices: `(vehicle_id, reported_at)`, `state`, GiST en geometrías. |
| **IncidentEvent** | `incident_id`, `at`, `actor_type`, `actor_id?`, `from_state`, `to_state`, `note`, `payload_json` | Historia completa. |
| **IncidentWitness** | `incident_id`, `at`, `text`, `contact_enc?`, `geom?`, `device_hash` | Anónimo permitido. |
| **Evidence** | `witness_id`, `kind`, `object_key`, `size`, `sha256`, `encrypted_with_kid`, `retention_until` | Cifrado por incidente. |
| **Notification** | `incident_id`, `to_type` (driver_contact/operator/reporter/service), `channel`, `template`, `sent_at`, `delivered_at`, `seen_at`, `status` | Nunca guarda el cuerpo con PII. |
| **AccessGrant** | `id`, `incident_id?`, `driver_id`, `level` (contact/responder), `granted_to` (otp phone hash / institution user), `method`, `expires_at`, `revoked_at` | Toda lectura de perfil médico referencia un grant. |
| **User / EmergencyProfile / EmergencyContact** | opcional, para pasajeros: `phone_verified`, `blood_type`, `allergies`, `conditions`, `medications`, `notes`, `consent_at` | Mismo cifrado y mismos niveles que el conductor. |
| **Location** | `vehicle_id`, `shift_id`, `at`, `geom`, `accuracy_m`, `speed` | Retención 30 días; muestreo 30 s / 10 s en incidente. |
| **AuditLog** | `id`, `at`, `actor`, `action`, `subject_type`, `subject_id`, `incident_id?`, `grant_id?`, `prev_hash`, `hash` | Append-only; visible al conductor lo que le concierne. |

## 5.4 API del MVP (REST, `/v1`, JSON, errores RFC 9457)

**Pública (sin cuenta; rate-limited; requiere sesión de escaneo donde se indica)**

| Método y ruta | Qué hace | Auth |
|---|---|---|
| `POST /qr/scan` `{code, geo?}` | Valida el código, registra el escaneo, devuelve `{result, session_token, vehicle_public, driver_public, city, open_incident?}` | — |
| `GET /vehicles/{id}/public-profile` | Ficha pública (línea, unidad, placa, tipo, docs vigentes sí/no, ubicación redondeada) | sesión |
| `GET /drivers/{id}/public-profile` | Nombre + inicial, ID, estado, licencia vigente | sesión |
| `GET /vehicles/{id}/emergency-info` | Perfil médico del conductor de turno según nivel del grant | sesión + grant |
| `POST /access/otp` `{driver_id}` → `POST /access/otp/verify` `{code}` | Elevación a *contacto autorizado* (OTP al número registrado por el conductor) | sesión |
| `POST /access/elevate` `{credential | incident_code}` | Elevación a *servicio de emergencia* | sesión |
| `POST /incidents` `{vehicle_id, type, injured, geo, accuracy, share_phone?}` | Crea incidente (o devuelve el abierto para sumarse) | sesión |
| `GET /incidents/{public_id}` | Estado y línea de tiempo (vista pública reducida) | sesión o enlace firmado |
| `POST /incidents/{id}/request-help` `{services[]}` | Marca *Ayuda solicitada*, envía ficha al despacho | sesión |
| `POST /incidents/{id}/notify` `{targets[]}` | Notifica contactos del conductor / operador (el sistema marca; el usuario no ve números) | sesión |
| `POST /incidents/{id}/witness` (multipart) | Testimonio + evidencias | sesión |
| `POST /incidents/{id}/share-location` | Enlace `qruta.bo/l/{token}` 24 h | sesión |
| `POST /qr/{code}/report-suspicious` | Reporta placa falsa/dañada | — |
| `GET /cities/{code}/emergency-numbers` | Directorio (cacheable, offline) | — |
| `POST /sync/queue` | Recibe reportes/testimonios encolados offline (idempotente por `client_id`) | sesión |

**Conductor (OAuth)**

| Ruta | Qué hace |
|---|---|
| `GET /me`, `GET /me/vehicle` | Identidad y unidad asignada |
| `POST /shifts` `{vehicle_id, qr_code}` · `POST /shifts/current/end` | Inicio/fin de jornada (vincula el QR al conductor) |
| `POST /shifts/current/locations` (batch) | GPS cada 30 s |
| `POST /incidents` `{source:'sos'}` · `POST /incidents/{id}/confirm` `{injured, note}` | SOS y confirmación de verificación |
| `GET /me/audit` | Quién vio mis datos |
| `PUT /me/emergency-profile` · `PUT /me/contacts` | Perfil y contactos |
| `POST /qr/{code}/confirm-install` (foto+geo) | Cadena de custodia de la placa |

**Operador / administración (OAuth + RBAC + RLS)**

| Ruta | Qué hace |
|---|---|
| `GET/POST /operators/{id}/vehicles`, `/drivers`, `/routes` | Flota (importación CSV/registro municipal) |
| `POST /vehicles/{id}/qr` `{placement}` · `POST /qr/{code}/revoke` `{reason}` | Emitir versión nueva / revocar |
| `GET /operators/{id}/live` (SSE) | Posiciones, escaneos, alertas en tiempo real |
| `GET /incidents?state=&from=&to=` · `POST /incidents/{id}/transition` `{to, note}` | Gestión de incidentes |
| `POST /incidents/{id}/access-code` | Código de incidente para servicios en camino |
| `GET /reports/summary?range=` | Estadísticas |
| `GET /audit?subject=` | Auditoría |
| `POST /cities`, `PUT /cities/{code}/config` | Multi-ciudad (solo `city_admin`/`sysadmin`) |

Convenciones: idempotencia con `Idempotency-Key` en todos los POST públicos; paginación por cursor;
`ETag` en fichas públicas; `Retry-After` en 429; webhooks firmados para operadores que integren su propio despacho.

## 5.5 App del conductor (extremadamente simple)

Una pantalla por estado, sin menús:

| Estado | Pantalla | Elementos |
|---|---|---|
| Fuera de servicio | **Iniciar jornada** | Mi identidad (foto, nombre, ID, ✓), unidad asignada (línea/unidad/placa/QR v3), botón verde "Iniciar jornada", acceso a "Ver/verificar el QR de mi unidad". |
| En servicio | **Jornada** | Cronómetro, "Línea 123 · U045", **botón SOS** (mantener 2 s; funciona con pantalla bloqueada en nativo), "Reportar incidente menor" (2 pasos: tipo + nota de voz), "Finalizar jornada". Nada más. Pantalla se atenúa en movimiento. |
| Incidente en verificación | **¿Estás bien?** (pantalla completa, 90 s) | Dos botones gigantes: "Estoy bien, sin heridos" / "Necesito ayuda". Si no responde, el sistema escala. |
| Cambio de unidad | Escanear el QR de la otra unidad → confirma. | El QR es también la llave del conductor para "subirse" a la unidad. |
| Fuera de app | Notificación "Tu perfil médico fue consultado por [SEDES] en INC-…". | Transparencia. |

Reglas: sin feed, sin chat, sin publicidad, sin mapa mientras maneja; texto ≥ 18 px; alto contraste; consumo de batería <3 %/h con GPS a 30 s.

## 5.6 Panel del operador

| Módulo | Contenido |
|---|---|
| **Mapa en tiempo real** | Unidades en servicio (GPS de la app del conductor), estado por color, incidentes con pulso, corredores de las líneas, filtros por línea/turno. |
| **Vehículos** | Lista, documentos (inspección/SOAT) con vencimientos, placas QR por ubicación y versión, historial de escaneos y de incidentes. |
| **Conductores** | Registro, licencia, certificado municipal, estado, jornada actual, auditoría de accesos a sus datos (solo metadatos, nunca el perfil médico). |
| **QR** | Emisión de versiones, revocación, cola de reemplazo, escaneos fallidos por placa, alertas de clonado/sospecha, exportación para imprenta. |
| **Incidentes** | Bandeja por estado, ficha completa (línea de tiempo, testigos, evidencias, notificaciones), transición de estados, código de incidente para servicios, cierre con nota. |
| **Alertas** | Incidentes nuevos, SOS, QR dañado/sospechoso, licencia por vencer, unidad sin conductor en horario, conductor sin respuesta. |
| **Reportes y estadísticas** | Incidentes por día/línea/tipo, tiempo Reportado→Ayuda, escaneos por unidad (interés ciudadano), placas con problemas, comparación entre líneas. |
| **Historial y estado de vehículos** | Todo lo anterior con rango de fechas y exportación; estado de servicio por unidad. |
| **Configuración** | Usuarios y roles del operador, números de despacho, plantillas de notificación, integración con su radio/WhatsApp. |
