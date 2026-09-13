# 3 · El QR como sistema de seguridad

## 3.1 Pipeline

```
QR físico ──► identificador opaco ──► token de sesión ──► backend ──► vehículo ──► conductor (jornada) ──► información según nivel ──► protocolo de emergencia
  placa        SCZ-Q7K3-M9V2           scs_… (15 min)      valida     veh-045      drv-00452                 público / contacto /        incidente, notificaciones,
  vinilo       versión 3               HMAC, IP, UA,       + audita   estado       vínculo por turno         emergencia / operador       ayuda, testigos
                                       geo aprox.
```

**Regla de oro: el QR no contiene datos, contiene una llave.** El código impreso resuelve a una
URL corta `https://salvo.bo/v/SCZ-Q7K3-M9V2`. Todo lo demás vive en el servidor y se decide en
el momento del escaneo según quién escanea, el estado del QR, el estado del vehículo y si hay
un incidente abierto.

## 3.2 Decisiones y por qué

| Tema | Decisión | Por qué |
|---|---|---|
| **QR estático vs. dinámico** | **Híbrido.** El patrón impreso es estático (una URL con un código opaco). Lo que hay detrás es dinámico (el backend decide qué mostrar). | Un QR "dinámico" que cambia el patrón necesita pantallas o reimpresiones; el híbrido da control total sin tocar la placa. |
| **Identificador** | Código corto **opaco** de 10 caracteres (`SCZ-Q7K3-M9V2`), alfabeto sin ambigüedades (sin 0/O, 1/I), prefijo de ciudad. Internamente un **UUID v7**. | Se puede dictar por radio ("Q siete K tres…"), cabe grande en la placa, y no revela nada (no es la placa ni un correlativo). |
| **Tokens** | Al escanear, el backend emite un **token de sesión de escaneo** (JWT firmado, 15 min, atado al `scan_id`). Toda acción posterior (reportar, pedir ayuda, testigo) lo exige. | Impide que alguien fabrique reportes contra un vehículo sin haber estado frente al QR; permite rate limiting por sesión. |
| **Expiración** | Sesión 15 min renovable si hay incidente abierto. Acceso elevado (contacto/servicio) **30 min** y atado a un incidente. El QR físico **no expira**; se **versiona**. | Corto para el público, suficiente para una emergencia, siempre auditado. |
| **Revocación** | Cada placa tiene `version`. Reemplazar una placa crea v(n+1) y **revoca v(n)** al instante. Un QR revocado muestra "Este QR ya no es válido" + acciones de emergencia igual. | Placa robada, dañada o clonada queda inservible en segundos y sin tocar el vehículo. |
| **QR clonado** (foto de un QR pegada en otro micro) | Detección por **incoherencia geográfica y de patrón**: dos escaneos del mismo código a >3 km en <5 min, o escaneos sostenidos fuera del corredor de la línea; el GPS de la app del conductor sirve de referencia. Alerta al operador, estado `suspect`. | El clon no puede falsificar dónde está el vehículo real. |
| **QR manipulado** (sticker encima que apunta a otro sitio) | Dominio único `salvo.bo`; la placa lleva impreso el código en texto para cotejar; instrucción "verificá que la dirección diga salvo.bo". Campaña de campo. Los usuarios pueden **reportar QR sospechoso** desde el fallo de escaneo. | Contra phishing físico no hay criptografía que valga: se combate con diseño de placa, texto claro y reporte fácil. |
| **QR reemplazado físicamente** | Solo el operador (rol `fleet_admin`) puede emitir versiones; la instalación se confirma escaneando la placa nueva **desde la app del conductor** junto a la unidad (foto + GPS). | Cadena de custodia de la placa. |
| **Validación en servidor** | Siempre. La PWA no decide nada; recibe lo que el backend autoriza. Firma **HMAC** del `code` en el path (`/v/SCZ-Q7K3-M9V2.k9f2`) opcional para rechazar códigos inventados sin tocar la base. | Lo que está en el cliente se puede alterar. |
| **Registro de escaneos** | `scan_events`: código, versión, hora, ciudad, IP truncada, UA, geo aproximada (si la persona la dio), resultado (`ok/revoked/unknown/suspect`). **Sin identidad** del que escanea salvo que reporte. | Auditoría y detección de fraude sin vigilar pasajeros. |
| **Rate limiting** | Por IP: 30 escaneos/min. Por código: 60/min (un accidente genera muchos). Por sesión: 1 incidente, 3 testimonios, 5 notificaciones. Elevaciones de acceso: 3 intentos OTP/15 min. | Anti-scraping y anti-abuso sin bloquear a la multitud que escanea en un accidente real. |
| **Logs** | Estructurados (JSON), con `request_id`, `scan_id`, `incident_id`; sin PII en texto plano; retención 90 días operativos, 5 años los de auditoría de acceso a datos sensibles. | Trazabilidad forense y cumplimiento. |
| **Auditoría** | Tabla `audit_log` inmutable (append-only, hash encadenado). Todo acceso a perfil médico, toda elevación de nivel, toda revocación y todo cambio de estado de incidente. Visible al conductor ("quién vio mis datos y cuándo"). | Confianza del conductor = adopción. |

## 3.3 Cómo detectamos falsificaciones (resumen operativo)

1. **Código desconocido** → `unknown`: nunca existió. Se muestra alerta roja y botón *Reportar QR sospechoso*.
2. **Código revocado** → `revoked`: existió, se dio de baja. Alerta ámbar. Se registra dónde apareció (placa vieja reutilizada o robada).
3. **Código válido pero incoherente** → `suspect`: escaneos simultáneos lejanos; escaneos cuando el vehículo está "fuera de servicio"; escaneos masivos a la misma hora desde una IP. Operador recibe alerta; la ficha pública sigue mostrándose (no castigamos al que llega a un accidente) pero con aviso interno.
4. **Firma inválida** (si se usa HMAC en la URL) → 404 silencioso + contador.

## 3.4 Seguridad general de la plataforma

| Área | Medida |
|---|---|
| Transporte | HTTPS obligatorio, HSTS preload, TLS 1.2+, certificados automáticos. |
| Autenticación | Público: **ninguna** (por diseño). Contacto autorizado: OTP por SMS/WhatsApp al número que el conductor registró. Servicios de emergencia: cuentas institucionales (OIDC) o **códigos de acceso de incidente** emitidos por el operador/despacho. Conductor y operador: OAuth 2.1 + PKCE, refresh tokens rotativos, MFA opcional para admins. |
| Autorización | **RBAC + ABAC**: roles (`public`, `contact`, `responder`, `driver`, `owner`, `fleet_admin`, `city_admin`, `sysadmin`) × atributos (ciudad, operador, incidente abierto, consentimiento vigente). Política central (OPA/Cedar o equivalente en código), evaluada en el backend. |
| Cifrado | En reposo: base cifrada (AES-256) + **cifrado a nivel de campo** para perfil médico y teléfonos (KMS, claves por ciudad). En tránsito: TLS. Evidencias: objetos cifrados con clave por incidente. |
| JWT | Firmados (ES256), vida corta, `aud` por superficie (web pública, app conductor, panel), revocables por `jti` en lista corta. |
| Protección de ubicación | La ubicación del vehículo solo se muestra **redondeada a ~50 m** al público y solo mientras dura la sesión de escaneo; exacta para contacto/servicio con incidente abierto. Nunca historial de recorridos al público. GPS del pasajero nunca se guarda fuera de un incidente. |
| Scraping | Sin listados públicos; rate limit; códigos opacos no enumerables (36^8 espacio útil); respuestas idénticas en tiempo para `unknown` y `revoked`. |
| Spoofing de servicios | Los servicios de emergencia no se "auto-declaran": el acceso `responder` nace de credenciales institucionales o de un código que el despacho del operador emite y que expira con el incidente. |
| Falsos reportes | Token de sesión obligatorio; GPS del reportante comparado con la posición del vehículo; confirmación del conductor en 90 s; correlación con otros escaneos; reputación de dispositivo (fingerprint no identificable); estado `verifying` antes de escalar. Reincidencia → bloqueo de dispositivo y, si compartió número, bloqueo de número. |
| Abuso contra el conductor | Nombre público solo con inicial; sin foto pública; sin teléfono; el conductor ve la auditoría de quién accedió a su perfil. |
| Cadena de suministro | Dependencias fijadas y auditadas, SBOM, CI con escaneo de secretos, despliegues firmados. |
| Respuesta a incidentes de seguridad | Runbook: revocación masiva de tokens, rotación de claves KMS, notificación a operadores y autoridad en ≤72 h. |
| Privacidad legal | Bolivia no tiene aún ley general de protección de datos; se adopta como piso el estándar de la Ley 1173/Constitución (habeas data) + principios GDPR (minimización, finalidad, consentimiento, derecho de acceso/eliminación). |
