# 1 · Concepto, problema, solución y diferencial

> **QRuta** es un sistema de seguridad digital para el transporte público de Santa Cruz de la
> Sierra. Cada vehículo lleva una placa QR que es su identidad digital. Cuando ocurre un
> accidente, cualquier persona la escanea con la cámara del teléfono —sin app, sin cuenta— y en
> menos de tres segundos sabe **qué vehículo es, de qué línea, quién lo conduce, dónde está y a
> quién avisar**, con un protocolo de emergencia guiado.
>
> No es una app para pedir transporte. Es infraestructura: **identificar + informar + proteger + responder.**

## 1.1 El problema, con nombre y apellido

Un micro de la línea 23 choca con una vagoneta en Santos Dumont entre 4º y 5º anillo; 16
personas terminan internadas ([Red Uno, ago-2024](https://www.reduno.com.bo/noticias/video-camara-capto-el-choque-entre-vagoneta-y-micro-que-dejo-16-personas-internadas--202487132010)).
Otro micro vuelca en el Plan 3000 ([Red Uno, ago-2024](https://www.reduno.com.bo/noticias/accidente-en-el-plan-3000-otro-micro-termino-volcado-y-dejo-cinco-personas-heridas-202488191144)).
En los primeros minutos, la escena es siempre la misma:

| Quién llega | Qué necesita saber | Qué tiene hoy |
|---|---|---|
| Un vecino / transeúnte | A quién llamar, qué decir, si el conductor está identificado | El número pintado en el micro (a veces), nada más |
| El pasajero a bordo | Qué unidad es, cómo pedir ayuda sin discutir con nadie | Su memoria del número de línea |
| Policía / Tránsito | Placa, línea, sindicato, conductor, licencia, SOAT | Documentos dentro del vehículo, quizá inaccesibles |
| Ambulancia | Cuántos heridos, condiciones médicas del conductor si está inconsciente | Nada hasta llegar |
| El operador (línea / sindicato) | Que su unidad tuvo un accidente, dónde, quién manejaba | Se entera por WhatsApp o por la prensa |
| La familia del conductor | Que pasó algo y dónde está | Se entera horas después |

Contexto estructural que hace esto peor en Santa Cruz (ver [08-investigacion-fuentes.md](08-investigacion-fuentes.md)):

- **126 líneas y más de 10 000 micros; solo 5 448 con registro municipal y 9 líneas con licencia vigente** — la mayoría opera en un limbo administrativo ([El Deber](https://eldeber.com.bo/santa-cruz/de-las-126-lineas-de-micros-que-circulan-en-la-ciudad-solo-nueve-tienen-licencia/)).
- El municipio recién en **2024 relanzó el registro obligatorio de conductores** (Bs 60, antecedentes, licencia) tras 15 años sin registro; +7 000 vehículos registrados ([Unitel](https://unitel.bo/noticias/sociedad/alcaldia-de-santa-cruz-de-la-sierra-registra-a-conductores-de-servicio-publico-y-el-sector-se-declara-en-emergencia-DL13817400)). Ese registro **existe pero no es consultable en la calle**.
- Conductores reincidentes siguen manejando porque nadie puede vincular en el momento al conductor con el vehículo ([Correo del Sur, ene-2026](https://correodelsur.com/seguridad/20260129/santa-cruz-revelan-que-micrero-que-embistio-y-mato-a-sebastian-vespa-es-reincidente.html)).
- El departamento acumuló **170 fallecidos en siniestros viales en seis meses** ([El Deber](https://eldeber.com.bo/santa-cruz/seis-meses-170-personas-fallecieron-accidentes-transito-santa-cruz_1782691993)).

**El problema no es la falta de datos: es que los datos existen en oficinas y no en la vereda, en el minuto uno.**

## 1.2 La solución en una frase por capa

| Capa | Qué es |
|---|---|
| **Placa QR física** | Identidad del vehículo. Azul institucional + franja roja + "ESCANÉAME · EN CASO DE ACCIDENTE". Vinilo reflectivo, ECL H, reemplazable, versionada. |
| **Web de emergencia (PWA)** | Lo que abre el QR. Sin instalar. Primera pantalla: *Vehículo identificado* + 5 acciones. Modo emergencia de alto contraste. |
| **Identidad del conductor** | Vinculada al vehículo por jornada desde la app del conductor. Público: nombre + inicial, ID, estado. Privado: por niveles. |
| **Motor de incidentes** | `INC-2026-SCZ-000245`, seis estados, línea de tiempo, testigos, evidencias, notificaciones. |
| **Perfil de emergencia** | Datos médicos voluntarios cifrados; visibles solo a contactos autorizados y servicios acreditados. |
| **App del conductor** | Inicio/fin de jornada, SOS, reporte menor. Nada más. |
| **Panel del operador** | Flota, conductores, QR, incidentes, alertas, auditoría. Multi-ciudad. |
| **Backend + auditoría** | Un QR es una llave, no un dato. Todo escaneo y todo acceso queda registrado. |

## 1.3 Diferencial (qué hacemos distinto, no "qué inventamos")

Esto **ya existe por partes** (ver §8): QR en autos y taxis en Delhi, Mumbai, Bengaluru y
Peshawar; QR médicos para motociclistas (Sticker4life, LifeQR, QRescueID); QR de rescate en
autos Mercedes/GM; en Santa Cruz, las líneas 72 y 73 ya tienen cámaras y **pago** por QR.
Lo que no existe —ni en Santa Cruz ni, hasta donde encontramos, en ninguna ciudad de la región—
es la combinación:

1. **Diseñado para el accidente, no para el viaje.** Los QR de Delhi verifican al chofer *antes*
   de subir; los QR médicos identifican a la *víctima*. QRuta identifica al **vehículo + conductor
   + operador** cuando ya pasó algo, y dispara un protocolo.
2. **Cero fricción absoluta.** Sin app (Delhi exige Himmat Plus), sin registro, sin cuenta. La
   cámara nativa basta. En una emergencia, cada pantalla extra pierde gente.
3. **El conductor cambia, el QR no.** Un micro cruceño lo manejan 2–3 personas en turnos. El
   vínculo conductor↔unidad se hace por jornada desde la app del conductor, no está impreso.
4. **Privacidad por niveles.** Público / contacto autorizado / servicio de emergencia / operador.
   Nunca dirección, nunca teléfono privado, nunca datos médicos en abierto.
5. **Incidente como objeto de primera clase**, con ID citable por radio, WhatsApp o prensa, y
   con función de testigo que primero te pide ponerte a salvo.
6. **Pensado para el limbo regulatorio local.** Funciona por operador (sindicato/línea) sin
   esperar que el municipio termine de regularizar 126 líneas; y cuando el municipio quiera,
   se conecta con su registro 2024 como fuente de verdad.
7. **Funciona sin señal.** Ficha mínima cacheada, llamadas siempre disponibles, reporte en cola.

## 1.4 User journey (la situación real)

**Escena.** 18:40, Av. Santos Dumont y 4º anillo. Un micro de la línea 123, unidad 045, choca
con una vagoneta. Mariela (32) sale de una farmacia y ve gente bajando aturdida.

| t | Mariela hace | El sistema hace | Emoción que buscamos |
|---|---|---|---|
| 0:00 | Ve la placa azul junto a la puerta: "ESCANÉAME · EN CASO DE ACCIDENTE". | — | "Ah, hay algo que puedo hacer." |
| 0:05 | Abre la cámara, apunta. | El QR abre `qruta.bo/v/SCZ-Q7K3-M9V2`. `POST /qr/scan` valida, registra hora/ciudad, emite token de 15 min. | Sin decidir nada todavía. |
| 0:08 | Ve **✓ VEHÍCULO IDENTIFICADO — Línea 123 · Unidad 045 · Placa · Conductor registrado Juan Carlos M.** y un mapa con el punto. | Renderiza ficha pública; el micro 3D y el mapa comunican "esto es real y es este vehículo". | **Confianza.** "Está registrado. Hay alguien detrás." |
| 0:12 | Toca **REPORTAR ACCIDENTE**. | Modo emergencia: pantalla oscura, 4 acciones enormes. | Foco. Nada compite por su atención. |
| 0:20 | Elige *Choque* → *Hay heridos* → confirma. | Pide GPS (o usa la última posición del vehículo). Crea **INC-2026-SCZ-000245**. Notifica al operador. Pide confirmación al conductor por la app. | "Ya quedó registrado. No depende de mi memoria." |
| 0:35 | Toca **SOLICITAR AYUDA**. | Envía ficha estructurada (vehículo, ubicación ±12 m, tipo, heridos) al despacho; muestra 110/118/119 para llamar. | Alivio: no tiene que explicar "un micro amarillo por ahí". |
| 0:50 | Toca **CONTACTO DE EMERGENCIA → Avisar ahora**. | WhatsApp a la esposa del conductor con vehículo, lugar y hora; sin exponer números. | Humanidad. |
| 1:30 | Toca **SOY TESTIGO**. Lee "Si estás en peligro, alejate". Escribe dos frases, adjunta una foto desde la vereda. | Evidencia cifrada, asociada al incidente. | Utilidad sin morbo. |
| 4:00 | Ve el estado pasar a **Emergencia activa → Ayuda solicitada**. | El operador confirmó desde el panel; el conductor no respondió en 90 s. | "Alguien lo está atendiendo." |
| 25:00 | Recibe (si dejó su número) "Incidente en atención. Gracias." | Estado **En atención**. | Cierre. |

**Lo que cambió respecto a hoy:** el operador supo a los 20 s, no a las 2 h; la ambulancia
llegó con ubicación exacta y con el dato de que el conductor es hipertenso; la familia se
enteró por el sistema y no por la prensa; Tránsito tiene placa, conductor, licencia y SOAT sin
buscar papeles; y hay un ID único que policía, seguro, sindicato y hospital citan igual.

## 1.5 Innovación local: por qué así y no como en Silicon Valley

- **El micro cruceño es una cooperativa de dueños**, no una flota. El "operador" en QRuta es el
  sindicato/línea (ej. Sindicato 21 de Mayo, Andrés Ibáñez, 24 de Septiembre), y el dueño de la
  unidad es un rol adicional. Los precios y contratos se piensan **por unidad y por línea**, no
  por empresa.
- **Los conductores rotan y no todos tienen smartphone de gama alta**: la app del conductor es
  mínima, funciona en Android de entrada de gama, y un conductor sin teléfono puede iniciar
  jornada desde el teléfono del dueño o con un código en el punto de partida.
- **Conectividad desigual**: Tigo domina en el oriente; hay zonas periurbanas (Plan 3000, Pampa
  de la Isla, Villa 1º de Mayo) con 3G/E. Todo el diseño offline nace de ahí.
- **Cultura del número de línea**: la gente ya identifica los micros por número (23, 64, 123).
  El QR no compite con eso: lo amplifica (la ficha muestra la línea gigante).
- **Desconfianza hacia la app "que te pide todo"**: cero registro para el público, cero
  seguimiento de pasajeros, escaneos anónimos por defecto.
- **Sol de 35 °C y lluvia tropical**: placa reflectiva laminada UV, QR con ECL H, interfaz clara
  de alto contraste (no un modo oscuro bonito que no se ve al mediodía).
- **El municipio ya tiene un registro (2024)** y ya probó QR para pago en dos líneas: QRuta se
  presenta como **la capa de seguridad que usa lo que ya existe**, no como otro trámite.
