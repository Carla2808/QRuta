/* QRuta — datos de demostración.
 * TODO ES FICTICIO. Los nombres, placas, unidades y perfiles médicos no corresponden
 * a personas ni vehículos reales. El modelo de datos sí refleja el diseño del sistema
 * (ver docs/05-arquitectura-datos-api.md). */

window.QRUTA_DATA = {
  // Multi-ciudad desde el día 1: nada de rutas ni teléfonos hardcodeados en la UI.
  cities: {
    SCZ: {
      code: 'SCZ',
      name: 'Santa Cruz de la Sierra',
      country: 'BO',
      tz: 'America/La_Paz',
      center: { lat: -17.7833, lng: -63.1821 },
      // Directorio de emergencia por ciudad. Validar con la autoridad antes del piloto.
      emergencyNumbers: [
        { label: 'Policía (Radio Patrulla)', number: '110', icon: 'shield' },
        { label: 'Ambulancia', number: '118', icon: 'ambulance' },
        { label: 'Bomberos', number: '119', icon: 'fire' },
      ],
      // Distintivo visual de la ciudad para el mapa y la placa.
      mapStyle: 'anillos',
    },
  },

  operators: {
    'op-21mayo': { id: 'op-21mayo', name: 'Sindicato 21 de Mayo', cityCode: 'SCZ', phoneMasked: '+591 3 3•• ••12' },
  },

  routes: {
    'rt-123': { id: 'rt-123', cityCode: 'SCZ', operatorId: 'op-21mayo', number: '123', name: 'Línea 123', color: '#F2A93B',
      corridor: 'Plan 3000 — Centro — Equipetrol' },
  },

  drivers: {
    'drv-00452': {
      id: 'drv-00452', publicId: '00452',
      // Nombre completo NO es público. Se muestra nombre + inicial del apellido.
      firstName: 'Juan Carlos', lastName: 'Mamani Quispe',
      photo: null,
      status: 'active',            // active | suspended | unverified
      licenseCategory: 'C',
      licenseValidUntil: '2027-03-31',
      registeredAt: '2025-11-04',
      municipalCertificate: 'GAMSCZ-TT-2025-07811', // certificado del registro municipal 2024/25
      // Contactos del conductor: visibles solo a nivel autorizado / emergencia
      emergencyContacts: [
        { id: 'ec-1', name: 'Rosa Q.', relation: 'Esposa', phoneMasked: '+591 7•• ••• 41', channel: 'whatsapp' },
      ],
      emergencyProfile: {           // voluntario, consentimiento firmado 2025-11-04
        consentAt: '2025-11-04', bloodType: 'O+', allergies: ['Penicilina'],
        conditions: ['Hipertensión (tratada)'], medications: ['Losartán 50 mg'], notes: 'Usa lentes. Sin marcapasos.',
      },
    },
  },

  vehicles: {
    'veh-045': {
      id: 'veh-045', cityCode: 'SCZ', routeId: 'rt-123', operatorId: 'op-21mayo',
      unitNumber: '045', plate: '2847-KLP', type: 'Micro', typeDetail: 'Minibús 25 pasajeros',
      make: 'Toyota Coaster', year: 2016, color: 'Blanco / franja naranja',
      inspectionValidUntil: '2026-12-31', soatValidUntil: '2026-12-31',
      status: 'in_service',          // in_service | out_of_service | suspended
      currentDriverId: 'drv-00452',
      shiftStartedAt: null,          // se rellena en runtime
      lastKnownLocation: { lat: -17.7995, lng: -63.1610, label: 'Av. Santos Dumont y 4º anillo', accuracyM: 12, ageSec: 38 },
    },
  },

  // Un QR = una clave opaca, NO los datos. El código impreso es el `code`; el backend lo
  // resuelve a un vehículo. `secret` sólo existe en el servidor (aquí para simular HMAC).
  qrCodes: {
    'SCZ-Q7K3-M9V2': { code: 'SCZ-Q7K3-M9V2', vehicleId: 'veh-045', version: 3, status: 'active',
      placement: 'interior-puerta', installedAt: '2026-02-12', previousVersions: [1, 2] },
    'SCZ-A1B2-C3D4': { code: 'SCZ-A1B2-C3D4', vehicleId: 'veh-045', version: 1, status: 'revoked',
      revokedAt: '2025-12-03', revokedReason: 'Placa dañada — reemplazada por v2' },
  },

  incidentTypes: [
    { id: 'collision', label: 'Choque', icon: 'collision' },
    { id: 'rollover', label: 'Volcadura', icon: 'rollover' },
    { id: 'pedestrian', label: 'Atropello', icon: 'pedestrian' },
    { id: 'fire', label: 'Incendio / humo', icon: 'fire' },
    { id: 'medical', label: 'Emergencia médica a bordo', icon: 'medical' },
    { id: 'other', label: 'Otro', icon: 'other' },
  ],

  incidentStates: [
    { id: 'reported',  label: 'Reportado',        color: '#F2C94C', tone: 'yellow' },
    { id: 'verifying', label: 'Verificando',      color: '#F2994A', tone: 'orange' },
    { id: 'active',    label: 'Emergencia activa', color: '#D7263D', tone: 'red' },
    { id: 'help',      label: 'Ayuda solicitada',  color: '#2F80ED', tone: 'blue' },
    { id: 'attending', label: 'En atención',      color: '#9B51E0', tone: 'purple' },
    { id: 'resolved',  label: 'Resuelto',         color: '#0F8A5F', tone: 'green' },
  ],

  // Niveles de acceso (RBAC simplificado del MVP)
  accessLevels: {
    public:    { id: 'public',    label: 'Cualquier persona', desc: 'Escaneó el QR. Sin cuenta.' },
    contact:   { id: 'contact',   label: 'Contacto autorizado', desc: 'Designado por el conductor. Verifica con código por SMS/WhatsApp.' },
    responder: { id: 'responder', label: 'Servicio de emergencia', desc: 'Credencial institucional. Acceso auditado y con vencimiento.' },
    operator:  { id: 'operator',  label: 'Operador / Línea', desc: 'Gestiona flota y conductores. No ve datos médicos.' },
  },
};
