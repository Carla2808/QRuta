/* SALVO — prototipo funcional (DEMO).
 * Todo lo que toca red está SIMULADO en `api()`: registra en la consola lateral el mismo
 * pipeline que ejecutaría el backend real (QR → identificador → token → validación →
 * vehículo → conductor → información autorizada → protocolo). Lo que sí es real:
 * el QR (escaneable), la geolocalización del navegador, el portapapeles y la vibración. */
(function () {
  const D = window.SALVO_DATA;
  const $ = (s, el) => (el || document).querySelector(s);
  const pad = (n, l) => String(n).padStart(l || 2, '0');
  const now = () => new Date();
  const hhmm = d => pad(d.getHours()) + ':' + pad(d.getMinutes());
  const hhmmss = d => hhmm(d) + ':' + pad(d.getSeconds());

  // ------------------------------------------------------------ estado
  const S = {
    view: 'phone', screen: 'splash', prev: [],
    role: 'public', net: 'fast',
    qr: null, vehicle: null, driver: null, route: null, operator: null, city: null,
    incident: null, incidentSeq: 244, witness: null, geo: null, contactsNotified: [],
    shift: null, sessionToken: null, scanLog: [], counters: { scans: 1284, incidents: 37, vehicles: 5448 },
    bus3d: null, timers: [],
  };
  const NET = {
    fast: { label: 'Rápida (4G)', latency: [120, 260], fail: 0, bars: 4 },
    slow: { label: 'Lenta (3G)', latency: [1400, 2600], fail: 0.05, bars: 2 },
    weak: { label: 'Señal débil', latency: [2500, 5000], fail: 0.35, bars: 1 },
    offline: { label: 'Sin conexión', latency: [0, 0], fail: 1, bars: 0 },
  };
  const ICON = {
    back: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>',
    check: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg>',
    alert: '<svg viewBox="0 0 24 24" class="ico" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l10 18H2L12 3z"/><path d="M12 10v5M12 18h.01"/></svg>',
    phone: '<svg viewBox="0 0 24 24" class="ico" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z"/></svg>',
    med: '<svg viewBox="0 0 24 24" class="ico" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="15" rx="3"/><path d="M12 9v7M8.5 12.5h7"/></svg>',
    user: '<svg viewBox="0 0 24 24" class="ico" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0116 0"/></svg>',
    pin: '<svg viewBox="0 0 24 24" class="ico" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s7-6.5 7-12a7 7 0 10-14 0c0 5.5 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/></svg>',
    eye: '<svg viewBox="0 0 24 24" class="ico" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
    share: '<svg viewBox="0 0 24 24" class="ico" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7M12 15V3m0 0L8 7m4-4l4 4"/></svg>',
    lock: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/></svg>',
    bus: '<svg viewBox="0 0 24 24" class="ico" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="15" rx="3"/><path d="M4 11h16M8 18v2M16 18v2M8 14h.01M16 14h.01"/></svg>',
    qr: '<svg viewBox="0 0 24 24" class="ico" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><path d="M14 14h3v3h-3zM20 14v0M20 20h-3M17 20v1"/></svg>',
  };

  // ------------------------------------------------------------ consola
  function log(kind, msg) {
    const c = $('#console'); if (!c) return;
    const row = document.createElement('div'); row.className = 'log ' + kind;
    row.innerHTML = `<span class="t">${hhmmss(now())}</span><span class="m">${msg}</span>`;
    c.appendChild(row); c.scrollTop = c.scrollHeight;
    while (c.children.length > 160) c.removeChild(c.firstChild);
  }

  // ------------------------------------------------------------ API simulada
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function api(method, path, body, opts) {
    opts = opts || {};
    const n = NET[S.net];
    log('info', `→ <b>${method} ${path}</b>${body ? ' ' + JSON.stringify(body) : ''}`);
    return new Promise((res, rej) => {
      if (S.net === 'offline') { log('err', `✗ sin red · ${path} — se usa caché/fallback`); return setTimeout(() => rej(new Error('offline')), 300); }
      const ms = rnd(n.latency[0], n.latency[1]);
      setTimeout(() => {
        if (Math.random() < n.fail && !opts.noFail) { log('warn', `⚠ timeout (${Math.round(ms)} ms) · ${path} — reintento automático`); return api(method, path, body, { noFail: true }).then(res, rej); }
        const out = opts.handler ? opts.handler(body) : { ok: true };
        log('ok', `← 200 ${path} · ${Math.round(ms)} ms${out && out._log ? ' · ' + out._log : ''}`);
        res(out);
      }, ms);
    });
  }
  // HMAC ficticio para mostrar el concepto de firma del token de sesión de escaneo
  function fakeSig(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h.toString(16).padStart(8, '0'); }

  // ------------------------------------------------------------ navegación
  function go(screen, opts) {
    opts = opts || {};
    if (!opts.replace && S.screen !== screen) S.prev.push(S.screen);
    if (S.prev.length > 12) S.prev.shift();
    S.screen = screen; render();
  }
  function back() { const p = S.prev.pop(); S.screen = p || (S.vehicle ? 'identified' : 'home'); render(); }
  function haptic(ms) { try { navigator.vibrate && navigator.vibrate(ms || 30); } catch (e) {} const ph = $('#phone'); if (ph) { ph.classList.remove('haptic'); void ph.offsetWidth; ph.classList.add('haptic'); } }
  function toast(msg, ok) {
    const scr = $('#screen'); if (!scr) return;
    const t = document.createElement('div'); t.className = 'toast' + (ok ? ' ok' : ''); t.innerHTML = (ok ? ICON.check : '') + '<span>' + msg + '</span>';
    scr.appendChild(t); setTimeout(() => t.remove(), 2600);
  }
  function timer(fn, ms) { const id = setTimeout(fn, ms); S.timers.push(id); return id; }
  function clearTimers() { S.timers.forEach(clearTimeout); S.timers = []; }

  // ------------------------------------------------------------ dominio
  function resolveQR(code) {
    // Simula POST /qr/scan: el código es opaco; el backend valida, registra y emite token de sesión
    const qr = D.qrCodes[code];
    return api('POST', '/v1/qr/scan', { code, ua: 'mobile-web', geo: 'pending' }, {
      handler() {
        if (!qr) return { ok: false, reason: 'unknown', _log: 'código desconocido → posible QR falso' };
        if (qr.status === 'revoked') return { ok: false, reason: 'revoked', _log: 'QR revocado (' + qr.revokedReason + ')' };
        const v = D.vehicles[qr.vehicleId], d = D.drivers[v.currentDriverId];
        S.counters.scans++;
        const tok = 'scs_' + fakeSig(code + Date.now()) + '.' + fakeSig('srv');
        return { ok: true, token: tok, ttl: 900, vehicle: v, driver: d, _log: `QR v${qr.version} válido · scan_id #${S.counters.scans} · token 15 min` };
      },
    });
  }
  function publicDriverName(d) { return d.firstName + ' ' + d.lastName.split(' ')[0][0] + '.'; }
  function contactDriverName(d) { return d.firstName + ' ' + d.lastName.split(' ')[0]; }

  function startScan(code) {
    S.qr = code; go('scan');
    timer(() => {
      const el = $('#scanwrap'); if (!el) return;
      el.classList.add('locked'); haptic(40);
      $('#scanmsg').innerHTML = '<b>QR leído</b><span>Validando con el servidor…</span>';
      const cam = $('#cam'); const burst = document.createElement('div'); burst.className = 'checkburst'; burst.innerHTML = '<svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg>'; cam.appendChild(burst);
      resolveQR(code).then(r => {
        if (!r.ok) { S.scanFail = r.reason; return go('scanfail', { replace: true }); }
        S.sessionToken = r.token; S.vehicle = r.vehicle; S.driver = r.driver; S.route = D.routes[r.vehicle.routeId]; S.operator = D.operators[r.vehicle.operatorId]; S.city = D.cities[r.vehicle.cityCode];
        S.scanLog.unshift({ at: now(), code, vehicle: r.vehicle });
        log('ok', `identificado: ${S.route.name} · U${S.vehicle.unitNumber} · conductor ${S.driver.publicId} (${S.driver.status})`);
        go('identified', { replace: true }); haptic([30, 40, 30]);
      }).catch(() => { S.scanFail = 'offline'; go('scanfail', { replace: true }); });
    }, 1900);
  }

  // Geolocalización REAL con fallback a la última posición del vehículo (marcado DEMO)
  function locate() {
    return new Promise(res => {
      let done = false;
      const fallback = () => { if (done) return; done = true; const l = S.vehicle.lastKnownLocation; log('warn', 'GPS del teléfono no disponible → uso última posición reportada por el vehículo (DEMO)'); res({ lat: l.lat, lng: l.lng, accuracyM: 60, source: 'vehicle', label: l.label }); };
      if (!navigator.geolocation) return fallback();
      log('info', 'navigator.geolocation.getCurrentPosition() — pidiendo permiso…');
      navigator.geolocation.getCurrentPosition(p => { if (done) return; done = true; log('ok', `GPS ok ±${Math.round(p.coords.accuracy)} m`); res({ lat: p.coords.latitude, lng: p.coords.longitude, accuracyM: p.coords.accuracy, source: 'phone', label: 'Tu ubicación actual' }); }, fallback, { enableHighAccuracy: true, timeout: 6000, maximumAge: 20000 });
      setTimeout(fallback, 6500);
    });
  }

  function createIncident(kind, injured, byRole) {
    S.incidentSeq++;
    const id = `INC-${now().getFullYear()}-${S.city.code}-${pad(S.incidentSeq, 6)}`;
    const inc = { id, kind, injured, createdAt: now(), state: 'reported', events: [], reporter: byRole || 'anonymous', evidence: [], witnesses: [], notified: [] };
    const push = (state, note) => { inc.state = state; inc.events.push({ at: now(), state, note }); log('info', `incidente ${id} → <b>${D.incidentStates.find(s => s.id === state).label}</b>${note ? ' · ' + note : ''}`); if (S.screen === 'incident' || S.screen === 'status') render(); };
    push('reported', 'reporte recibido vía QR');
    S.incident = inc; S.counters.incidents++;
    // Evolución simulada del incidente (en producción: operador + servicios + confirmaciones)
    timer(() => push('verifying', 'operador ' + S.operator.name + ' notificado; se pide confirmación al conductor'), 4000);
    timer(() => push(injured ? 'active' : 'verifying', injured ? 'sin respuesta del conductor en 90 s + heridos reportados' : 'conductor confirma: sin heridos'), 9000);
    if (injured) timer(() => { if (!inc.helpRequested) return; push('help', 'ambulancia solicitada · ' + S.city.emergencyNumbers[1].number); }, 12000);
    return inc;
  }
  function notifyContacts() {
    const inc = S.incident; if (!inc) return Promise.resolve();
    return api('POST', `/v1/incidents/${inc.id}/notify`, { channels: ['whatsapp', 'sms'], to: ['driver.emergency_contacts', 'operator.dispatch'] }, {
      handler() { inc.notified = [
        { who: 'Rosa Q. (contacto del conductor)', via: 'WhatsApp', status: 'entregado' },
        { who: S.operator.name + ' · despacho', via: 'Panel + SMS', status: 'visto' },
        { who: 'Contactos del pasajero (si tiene perfil)', via: '—', status: 'no aplica' },
      ]; return { _log: '2 notificaciones entregadas' }; },
    });
  }

  // ------------------------------------------------------------ vistas: teléfono
  const V = {};
  V.splash = () => `<div class="splash"><div><div class="logo">S</div><h1>SALVO</h1><p>Identifica. Informa. Protege. Responde.</p></div></div>`;

  V.home = () => `<div class="s">
    <div class="appbar"><h1>SALVO</h1><div class="spacer"></div><span class="pill info">${S.city ? S.city.name : 'Santa Cruz de la Sierra'}</span></div>
    <div class="hero-scan">
      <div class="eyebrow" style="color:rgba(255,255,255,.7)">Ante un accidente</div>
      <h2>Escaneá el QR del micro y sabé quién es, de qué línea y a quién avisar.</h2>
      <p>No hace falta instalar nada ni crear cuenta. Esta pantalla es de demostración: en la vida real el QR físico abre la página directamente.</p>
      <button class="btn" data-action="scan" data-code="SCZ-Q7K3-M9V2">${ICON.qr}<span>Simular escaneo del QR</span></button>
    </div>
    <div class="tiles">
      <button class="tile" data-action="go" data-to="plate"><b>Ver la placa QR física</b><span>Cómo se ve en el micro y dónde va</span></button>
      <button class="tile" data-action="scan" data-code="SCZ-A1B2-C3D4"><b>Probar un QR revocado</b><span>Qué pasa con una placa vieja o clonada</span></button>
      <button class="tile" data-action="go" data-to="driverapp"><b>App del conductor</b><span>Jornada, vehículo, SOS</span></button>
      <button class="tile" data-action="go" data-to="profile"><b>Mi perfil de emergencia</b><span>${S.profile ? "✓ Activo · " + S.profile.contacts.length + " contacto(s)" : "Opcional. Datos médicos y contactos"}</span></button>
    </div>
    <div class="eyebrow">Escaneos recientes</div>
    ${S.scanLog.length ? S.scanLog.slice(0, 3).map(s => `<button class="tile" data-action="scan" data-code="${s.code}"><b>${D.routes[s.vehicle.routeId].name} · Unidad ${s.vehicle.unitNumber}</b><span>${hhmm(s.at)} · ${s.code}</span></button>`).join('') : `<div class="empty">Todavía no escaneaste ningún vehículo.<br>Los escaneos quedan en este teléfono, no en una cuenta.</div>`}
  </div>`;

  V.scan = () => `<div class="scan" id="scanwrap">
    <div class="appbar" style="padding:8px 12px 0;color:#fff"><button class="back" data-action="back" style="background:rgba(255,255,255,.12);color:#fff">${ICON.back}</button><h1 style="font-size:16px">Cámara</h1><div class="spacer"></div><span class="pill" style="background:rgba(255,255,255,.14);color:#fff">DEMO</span></div>
    <div class="cam" id="cam"><div class="plate-mini">${SalvoQR.plate(S.qr, { small: true })}</div><div class="reticle"><i></i><i></i><i></i><i></i></div><div class="laser"></div></div>
    <div class="msg" id="scanmsg"><b>Apuntá al QR del vehículo</b><span>Lectura automática · sin app · sin cuenta</span></div>
  </div>`;

  V.scanfail = () => {
    const r = S.scanFail;
    const m = r === 'revoked' ? { t: 'Este QR ya no es válido', d: 'La placa fue reemplazada o dada de baja. Puede tratarse de una placa vieja, dañada o de una copia. Igual podés pedir ayuda.', k: 'warn' }
      : r === 'unknown' ? { t: 'QR no reconocido', d: 'El código no pertenece al sistema. Si está pegado en un micro, podría ser una falsificación: reportalo.', k: 'red' }
      : { t: 'Sin conexión', d: 'No pudimos validar el QR. Podés llamar a emergencias igual; el reporte se enviará cuando vuelva la señal.', k: 'warn' };
    return `<div class="s">
      <div class="appbar"><button class="back" data-action="home">${ICON.back}</button><h1>Escaneo</h1></div>
      <div class="warnbox ${m.k === 'red' ? 'red' : ''}"><div><b>${m.t}</b>${m.d}</div></div>
      <div class="card kv"><span class="k">Código leído</span><span class="v mono">${S.qr}</span><span class="k">Registrado</span><span class="v">${r === 'revoked' ? 'Sí · revocado' : r === 'unknown' ? 'No' : 'Sin verificar'}</span></div>
      <div class="actions">
        <button class="btn danger" data-action="emergency-nocontext">${ICON.phone}<span class="txt">Llamar a emergencias<span class="sub">${(D.cities.SCZ.emergencyNumbers.map(n => n.number)).join(' · ')}</span></span></button>
        ${r !== 'offline' ? `<button class="btn ghost" data-action="report-fake">${ICON.alert}<span class="txt">Reportar QR sospechoso</span></button>` : `<button class="btn ghost" data-action="retry-scan">Reintentar</button>`}
      </div></div>`;
  };

  function vehicleHero() {
    return `<div class="vehicle-hero" id="hero3d"><span class="pill ok tag">${ICON.lock} Registro verificado</span><div class="line-chip"><small>Línea</small>${S.route.number}</div></div>`;
  }
  function mapCard(loc, h) {
    const l = loc || S.vehicle.lastKnownLocation;
    const routePts = [[-17.826, -63.135], [-17.808, -63.152], [-17.7995, -63.161], [-17.79, -63.172], [-17.7833, -63.1821], [-17.775, -63.19]];
    return `<div class="mapcard">${SalvoMap.render({ lat: l.lat, lng: l.lng, accuracyM: l.accuracyM || 12, height: h || 190, route: routePts, routeColor: S.route.color })}
      <div class="foot"><div><b>${l.label}</b><br>${l.source === 'phone' ? 'GPS de tu teléfono' : 'Última posición reportada por el vehículo · hace ' + (l.ageSec || 38) + ' s'}</div><span class="pill info">${hhmm(now())}</span></div></div>`;
  }

  V.identified = () => `<div class="s">
    <div class="appbar"><button class="back" data-action="home">${ICON.back}</button><div class="spacer"></div><span class="pill lock">${ICON.lock} sesión 15 min</span></div>
    <div class="idband"><div class="ck">${ICON.check}</div><div><b>VEHÍCULO IDENTIFICADO</b><span>Este vehículo está registrado en SALVO · ${S.city.name}</span></div></div>
    ${vehicleHero()}
    <div class="card kv">
      <span class="k">Línea</span><span class="v">${S.route.number} <span style="font-weight:600;color:var(--muted)">· ${S.operator.name}</span></span>
      <span class="k">Unidad</span><span class="v">${S.vehicle.unitNumber}</span>
      <span class="k">Placa</span><span class="v mono">${S.vehicle.plate}</span>
      <span class="k">Tipo</span><span class="v">${S.vehicle.type} · ${S.vehicle.make}</span>
    </div>
    <button class="card driver-row" data-action="go" data-to="driver" style="border:0;text-align:left;width:100%;cursor:pointer">
      <div class="avatar">${S.driver.firstName[0]}${S.driver.lastName[0]}</div>
      <div class="grow"><b>${publicDriverName(S.driver)}</b><span>Conductor · ID ${S.driver.publicId}</span></div>
      <span class="pill ${S.driver.status === 'active' ? 'ok' : 'bad'}">${S.driver.status === 'active' ? '✓ Registrado' : 'Suspendido'}</span>
    </button>
    ${mapCard()}
    <div class="actions">
      <button class="btn danger" data-action="go" data-to="emergency">${ICON.alert}<span class="txt">REPORTAR ACCIDENTE<span class="sub">Abre el modo emergencia</span></span></button>
      <button class="btn ghost left" data-action="go" data-to="call">${ICON.phone}<span class="txt">Contactar emergencia</span></button>
      <button class="btn ghost left" data-action="go" data-to="critical">${ICON.med}<span class="txt">Información crítica</span>${S.role === 'public' ? `<span class="pill lock">${ICON.lock}</span>` : ''}</button>
      <button class="btn ghost left" data-action="go" data-to="contacts">${ICON.user}<span class="txt">Contacto de emergencia</span></button>
      <button class="btn ghost left" data-action="go" data-to="share">${ICON.pin}<span class="txt">Compartir ubicación</span></button>
      <button class="btn line sm" data-action="go" data-to="witness">Soy testigo</button>
    </div>
    <p class="legalnote">Escaneo registrado (hora, ciudad, vehículo). No se guarda tu identidad salvo que reportes un incidente. Datos personales del conductor protegidos por niveles de acceso.</p>
  </div>`;

  V.driver = () => {
    const d = S.driver, lvl = S.role;
    const name = lvl === 'public' ? publicDriverName(d) : contactDriverName(d) + (lvl === 'responder' ? ' ' + d.lastName.split(' ')[1] : '');
    return `<div class="s">
      <div class="appbar"><button class="back" data-action="back">${ICON.back}</button><h1>Conductor</h1></div>
      <div class="card"><div class="driver-row"><div class="avatar" style="width:64px;height:64px;font-size:22px">${d.firstName[0]}${d.lastName[0]}</div><div class="grow"><b style="font-size:18px">${name}</b><span>ID de conductor ${d.publicId}</span><br><span class="pill ok" style="margin-top:6px">✓ Registrado · activo</span></div></div></div>
      <div class="card kv">
        <span class="k">Licencia</span><span class="v">Cat. ${d.licenseCategory} · vigente</span>
        <span class="k">Registro municipal</span><span class="v mono">${lvl === 'public' ? 'GAMSCZ-TT-•••••-7811' : d.municipalCertificate}</span>
        <span class="k">En SALVO desde</span><span class="v">${d.registeredAt}</span>
        <span class="k">Operador</span><span class="v">${S.operator.name}</span>
        <span class="k">Teléfono</span><span class="v">${lvl === 'public' ? `<span class="pill lock">${ICON.lock} protegido</span>` : lvl === 'contact' ? 'vía la app' : '+591 7•• ••• 09'}</span>
      </div>
      <div class="eyebrow">Qué ve cada nivel</div>
      <div class="levels">${Object.values(D.accessLevels).filter(l => l.id !== 'operator').map(l => `<div class="level ${l.id === lvl ? 'cur' : ''}"><b>${l.label}</b>${l.id === lvl ? '<span class="pill info">tu nivel</span>' : '<span></span>'}<span>${l.id === 'public' ? 'Nombre + inicial, ID, estado, licencia vigente sí/no. Nunca dirección ni teléfono.' : l.id === 'contact' ? 'Nombre, estado de jornada, ubicación del vehículo durante un incidente.' : 'Identidad completa, teléfono, perfil médico voluntario. Acceso auditado.'}</span></div>`).join('')}</div>
      <p class="legalnote">La foto del conductor se muestra solo en la app del conductor y al operador; en la web pública se omite para evitar acoso y suplantación.</p>
    </div>`;
  };

  V.vehicle = () => `<div class="s">
    <div class="appbar"><button class="back" data-action="back">${ICON.back}</button><h1>Vehículo</h1></div>
    ${vehicleHero()}
    <div class="card kv">
      <span class="k">Placa</span><span class="v mono">${S.vehicle.plate}</span><span class="k">Unidad</span><span class="v">${S.vehicle.unitNumber}</span>
      <span class="k">Tipo</span><span class="v">${S.vehicle.typeDetail}</span><span class="k">Marca / año</span><span class="v">${S.vehicle.make} · ${S.vehicle.year}</span>
      <span class="k">Color</span><span class="v">${S.vehicle.color}</span><span class="k">Inspección técnica</span><span class="v">vigente · ${S.vehicle.inspectionValidUntil}</span>
      <span class="k">SOAT</span><span class="v">vigente</span><span class="k">QR</span><span class="v mono">${S.qr} · v${D.qrCodes[S.qr].version}</span>
    </div></div>`;

  V.critical = () => {
    const p = S.driver.emergencyProfile, lvl = S.role;
    const locked = lvl === 'public';
    const partial = lvl === 'contact';
    return `<div class="s">
      <div class="appbar"><button class="back" data-action="back">${ICON.back}</button><h1>Información crítica</h1></div>
      <p class="lead">Datos médicos que el conductor registró voluntariamente para una emergencia. ${locked ? 'No son públicos.' : ''}</p>
      <div class="locked"><div class="medgrid ${locked ? 'blur' : ''}">
        <div class="med"><span class="k">Tipo de sangre</span><span class="v">${p.bloodType}</span></div>
        <div class="med"><span class="k">Alergias</span><span class="v">${p.allergies.join(', ')}</span></div>
        <div class="med wide"><span class="k">Condiciones</span><span class="v">${partial ? 'Visible para servicios de emergencia' : p.conditions.join(', ')}</span></div>
        <div class="med wide"><span class="k">Medicación</span><span class="v">${partial ? 'Visible para servicios de emergencia' : p.medications.join(', ')}</span></div>
        <div class="med wide"><span class="k">Notas</span><span class="v" style="font-size:14px">${partial ? '—' : p.notes}</span></div>
      </div>${locked ? `<div class="lockmsg"><div><span class="pill lock">${ICON.lock} Acceso restringido</span><p style="margin:10px 0 0;font-weight:600">Solo contactos autorizados por el conductor y servicios de emergencia acreditados.</p></div></div>` : ''}</div>
      ${locked ? `<div class="actions">
        <button class="btn primary" data-action="request-responder">Soy personal de emergencia<span class="sub">Acceso con credencial · queda auditado</span></button>
        <button class="btn ghost" data-action="request-contact">Soy contacto del conductor<span class="sub">Código por SMS/WhatsApp</span></button>
      </div>` : `<div class="card tight" style="font-size:12px;color:var(--muted)">Acceso concedido como <b>${D.accessLevels[lvl].label}</b> · registrado en auditoría con hora, incidente y credencial. Consentimiento del conductor: ${p.consentAt}.</div>`}
      <p class="legalnote">Nunca se muestran: dirección, documento de identidad, historial clínico completo, datos de familiares menores.</p>
    </div>`;
  };

  V.call = () => { const city = S.city || D.cities.SCZ; const v = S.vehicle; return `<div class="s">
    <div class="appbar"><button class="back" data-action="back">${ICON.back}</button><h1>Contactar emergencia</h1></div>
    <p class="lead">Números oficiales de ${city.name}. ${v ? `Al llamar, tené a mano: <b>línea ${S.route.number}, unidad ${v.unitNumber}, ${v.lastKnownLocation.label}</b>.` : S.person ? `Al llamar, mencioná que la persona tiene <b>perfil SALVO ${S.person.code}</b>.` : ''}</p>
    ${city.emergencyNumbers.map(n => `<a class="btn danger left" href="tel:${n.number}" data-action="tel" data-num="${n.number}">${ICON.phone}<span class="txt">${n.label}<span class="sub">Marcar ${n.number}</span></span><b style="font-family:var(--font-mono);font-size:22px">${n.number}</b></a>`).join('')}
    ${v ? `<button class="btn ghost left" data-action="notify-operator">${ICON.bus}<span class="txt">Avisar al operador de la línea<span class="sub">${S.operator.name} · despacho</span></span></button>` : ''}
    <p class="legalnote">Los números vienen del directorio de la ciudad, no están fijos en la app. Validados con la autoridad antes del piloto.</p>
  </div>`; };

  V.contacts = () => `<div class="s">
    <div class="appbar"><button class="back" data-action="back">${ICON.back}</button><h1>Contacto de emergencia</h1></div>
    <p class="lead">Podés pedir que SALVO avise a las personas que el conductor designó. No verás su número: el sistema los contacta por vos.</p>
    <div class="card">${S.driver.emergencyContacts.map(c => `<div class="contactline"><div class="avatar" style="width:36px;height:36px;font-size:13px">${c.name[0]}</div><div><b>${c.name}</b><br><span style="color:var(--muted)">${c.relation} · ${S.role === 'public' ? 'número protegido' : c.phoneMasked}</span></div><span class="st pill ${S.incident && S.incident.notified.length ? 'ok' : 'lock'}">${S.incident && S.incident.notified.length ? 'avisado' : 'no avisado'}</span></div>`).join('')}</div>
    <div class="actions"><button class="btn primary" data-action="notify-contacts">${ICON.user}<span class="txt">Avisar ahora<span class="sub">WhatsApp + SMS con vehículo, ubicación y hora</span></span></button></div>
    <p class="legalnote">El aviso incluye tu rol ("persona que escaneó el QR") pero no tu número, salvo que lo autorices al reportar.</p>
  </div>`;

  V.share = () => {
    const l = S.geo || S.vehicle.lastKnownLocation;
    const link = `${location.origin}${location.pathname}?loc=${l.lat.toFixed(5)},${l.lng.toFixed(5)}&v=${S.vehicle.id}${S.incident ? '&inc=' + S.incident.id : ''}`;
    return `<div class="s">
      <div class="appbar"><button class="back" data-action="back">${ICON.back}</button><h1>Compartir ubicación</h1></div>
      ${mapCard(S.geo, 170)}
      <div class="card"><div class="eyebrow">Mensaje listo para enviar</div><p style="font-size:14px;line-height:1.5;margin:6px 0 0" id="sharetext">🚨 Accidente con micro <b>Línea ${S.route.number} · Unidad ${S.vehicle.unitNumber}</b> (placa ${S.vehicle.plate}) en <b>${l.label}</b>, ${hhmm(now())}.${S.incident ? ' Incidente ' + S.incident.id + '.' : ''} Ubicación: <span class="mono" style="font-family:var(--font-mono);font-size:12px;word-break:break-all">${link}</span></p></div>
      <div class="actions two"><button class="btn primary" data-action="copy-share">Copiar</button><button class="btn ghost" data-action="native-share">${ICON.share}<span>Compartir</span></button></div>
      <button class="btn ghost sm" data-action="use-gps">${S.geo ? 'Actualizar con mi GPS' : 'Usar mi GPS en vez de la posición del vehículo'}</button>
    </div>`;
  };

  V.emergency = () => {
    const inc = S.incident;
    return `<div class="emergency">
      <div class="top"><button data-action="back">Salir</button><span class="pill" style="background:rgba(255,255,255,.14);color:#fff">${hhmm(now())}</span></div>
      <h1><span class="dot"></span>EMERGENCIA</h1>
      <div class="fact"><span>VEHÍCULO IDENTIFICADO ✓</span><b>Línea ${S.route.number} · Unidad ${S.vehicle.unitNumber}</b><span>Placa ${S.vehicle.plate} · conductor registrado ${S.driver.publicId}</span></div>
      <div class="fact"><span>📍 ${S.geo ? 'Ubicación confirmada (tu GPS)' : 'Ubicación del vehículo'}</span><b style="font-size:16px">${(S.geo || S.vehicle.lastKnownLocation).label}</b></div>
      ${inc ? `<div class="fact" style="border:1px solid rgba(255,255,255,.2)"><span>Incidente</span><b style="font-family:var(--font-mono);font-size:18px">${inc.id}</b><span class="statepill" style="--c:${D.incidentStates.find(s => s.id === inc.state).color};margin-top:4px">${D.incidentStates.find(s => s.id === inc.state).label}</span></div>` : ''}
      <div class="actions">
        ${inc ? `<button class="btn white" data-action="request-help"><span class="txt">SOLICITAR AYUDA<span class="sub" style="color:#7a1020">Ambulancia + policía con estos datos</span></span></button>` : `<button class="btn white" data-action="go" data-to="report"><span class="txt">REPORTAR ACCIDENTE<span class="sub" style="color:#7a1020">3 toques · genera un ID de incidente</span></span></button>`}
        <a class="btn danger" href="tel:${S.city.emergencyNumbers[0].number}" data-action="tel" data-num="${S.city.emergencyNumbers[0].number}">LLAMAR ${S.city.emergencyNumbers[0].number}</a>
        <button class="btn outline" data-action="go" data-to="share">COMPARTIR UBICACIÓN</button>
        <button class="btn outline" data-action="go" data-to="critical">VER INFORMACIÓN CRÍTICA</button>
        ${inc ? `<button class="btn outline" data-action="go" data-to="status">ESTADO DEL INCIDENTE</button>` : ''}
      </div>
      <div style="display:grid;gap:8px">${S.city.emergencyNumbers.slice(1).map(n => `<a class="num" href="tel:${n.number}" data-action="tel" data-num="${n.number}"><span>${n.label}</span><b>${n.number}</b></a>`).join('')}</div>
    </div>`;
  };

  V.report = () => {
    S.form = S.form || { kind: null, injured: null, contact: false, step: 1 };
    const f = S.form;
    return `<div class="s">
      <div class="appbar"><button class="back" data-action="back">${ICON.back}</button><h1>Reportar accidente</h1><div class="spacer"></div><span class="pill lock">${f.step}/3</span></div>
      ${f.step === 1 ? `<div class="eyebrow">¿Qué pasó?</div><div class="choices">${D.incidentTypes.map(t => `<button class="choice" data-action="pick-kind" data-kind="${t.id}" aria-pressed="${f.kind === t.id}">${t.label}</button>`).join('')}</div>
        <button class="btn primary" data-action="report-next" ${f.kind ? '' : 'disabled style="opacity:.5"'}>Continuar</button>` : ''}
      ${f.step === 2 ? `<div class="eyebrow">¿Hay personas heridas?</div><div class="choices">
          <button class="choice" data-action="pick-injured" data-v="yes" aria-pressed="${f.injured === true}">Sí<span style="font-weight:500;font-size:12px;color:var(--muted)">o no estoy seguro</span></button>
          <button class="choice" data-action="pick-injured" data-v="no" aria-pressed="${f.injured === false}">No<span style="font-weight:500;font-size:12px;color:var(--muted)">solo daños</span></button></div>
        <div class="toggle"><div><b>Compartir mi número</b><span>Para que emergencias o el operador puedan llamarte. Opcional.</span></div><button class="switch" role="switch" aria-checked="${f.contact}" data-action="toggle-contact"><span class="sr-only">Compartir mi número</span></button></div>
        <button class="btn primary" data-action="report-next" ${f.injured !== null ? '' : 'disabled style="opacity:.5"'}>Continuar</button>` : ''}
      ${f.step === 3 ? `<div class="geo card"><div class="ring ${S.geo ? 'done' : ''}" id="georing">${S.geo ? ICON.check : ''}</div><b style="text-align:center">${S.geo ? 'Ubicación obtenida' : 'Obteniendo tu ubicación…'}</b><div class="acc">${S.geo ? `${S.geo.lat.toFixed(5)}, ${S.geo.lng.toFixed(5)} · ±${Math.round(S.geo.accuracyM)} m · ${S.geo.source === 'phone' ? 'GPS teléfono' : 'posición del vehículo (DEMO)'}` : 'Si no das permiso usamos la última posición del vehículo.'}</div></div>
        <div class="card kv"><span class="k">Tipo</span><span class="v">${D.incidentTypes.find(t => t.id === f.kind).label}</span><span class="k">Heridos</span><span class="v">${f.injured ? 'Sí / no seguro' : 'No'}</span><span class="k">Vehículo</span><span class="v">L${S.route.number} · U${S.vehicle.unitNumber}</span><span class="k">Tu número</span><span class="v">${f.contact ? 'se comparte' : 'anónimo'}</span></div>
        <button class="btn danger" data-action="report-submit" ${S.geo ? '' : 'disabled style="opacity:.6"'}>${ICON.alert}<span>Enviar reporte</span></button>` : ''}
      <p class="legalnote">Un reporte falso se detecta por cruce de escaneos, GPS y confirmación del conductor; puede acarrear bloqueo del dispositivo.</p>
    </div>`;
  };

  V.incident = () => {
    const inc = S.incident; const st = D.incidentStates.find(s => s.id === inc.state);
    return `<div class="s">
      <div class="appbar"><h1>Incidente creado</h1><div class="spacer"></div><span class="statepill" style="--c:${st.color}">${st.label}</span></div>
      <div class="incid"><span class="eyebrow">Incident ID · guardalo o compartilo</span><span class="id">${inc.id}</span><span style="font-size:12px;opacity:.75">${hhmmss(inc.createdAt)} · ${S.city.name} · ${D.incidentTypes.find(t => t.id === inc.kind).label}${inc.injured ? ' · con heridos' : ''}</span></div>
      <div class="actions">
        ${inc.injured && !inc.helpRequested ? `<button class="btn danger" data-action="request-help">${ICON.alert}<span class="txt">Solicitar ayuda<span class="sub">Ambulancia y policía reciben vehículo, ubicación y conductor</span></span></button>` : ''}
        <button class="btn primary" data-action="notify-contacts">${ICON.user}<span class="txt">Notificar contactos del conductor</span></button>
        <button class="btn ghost left" data-action="go" data-to="witness">${ICON.eye}<span class="txt">Agregar lo que vi (testigo)</span></button>
        <button class="btn ghost left" data-action="go" data-to="status">Ver estado y línea de tiempo</button>
        <button class="btn ghost left" data-action="go" data-to="share">${ICON.pin}<span class="txt">Compartir ubicación</span></button>
      </div>
      ${inc.notified.length ? `<div class="card"><div class="eyebrow">Notificados</div>${inc.notified.map(n => `<div class="contactline"><div><b>${n.who}</b><br><span style="color:var(--muted)">${n.via}</span></div><span class="st pill ${n.status === 'no aplica' ? 'lock' : 'ok'}">${n.status}</span></div>`).join('')}</div>` : ''}
    </div>`;
  };

  V.status = () => {
    const inc = S.incident; const idx = D.incidentStates.findIndex(s => s.id === inc.state);
    return `<div class="s">
      <div class="appbar"><button class="back" data-action="back">${ICON.back}</button><h1>Estado del incidente</h1></div>
      <div class="incid"><span class="eyebrow">Incident ID</span><span class="id">${inc.id}</span></div>
      <div class="card timeline">${D.incidentStates.map((s, i) => { const ev = inc.events.filter(e => e.state === s.id).pop(); const cls = i < idx ? 'done' : i === idx ? 'on' : ''; return `<div class="tl ${cls}" style="--c:${s.color}"><div class="dot">${i < idx ? '✓' : i === idx ? '●' : ''}</div><div><b>${s.label}</b><span>${ev ? hhmmss(ev.at) + (ev.note ? ' · ' + ev.note : '') : i > idx ? 'pendiente' : ''}</span></div></div>`; }).join('')}</div>
      ${inc.state !== 'resolved' ? `<div class="actions two">${!inc.helpRequested ? `<button class="btn danger sm" data-action="request-help">Solicitar ayuda</button>` : `<button class="btn ghost sm" data-action="mark-attending">Simular llegada de ayuda</button>`}<button class="btn ghost sm" data-action="mark-resolved">Simular resolución</button></div>` : `<div class="card tight"><b>Resuelto.</b> El incidente queda en el historial del vehículo, del conductor y del operador, con auditoría completa.</div>`}
      <p class="legalnote">Los cambios de estado los hacen el operador, los servicios de emergencia o el conductor; la persona que reportó solo ve la evolución.</p>
    </div>`;
  };

  V.helped = () => `<div class="s" style="align-content:center;text-align:center;min-height:100%">
    <div class="idband" style="justify-content:center"><div class="ck">${ICON.check}</div><div><b>AYUDA SOLICITADA</b><span>Ambulancia y policía recibieron los datos</span></div></div>
    <h2 class="big">Quedate cerca si es seguro. Ya no tenés que explicar nada por teléfono.</h2>
    <p class="lead">Enviamos: vehículo, conductor, ubicación con precisión de ${Math.round((S.geo || { accuracyM: 60 }).accuracyM)} m, tipo de incidente y tu rol. Referencia: <b style="font-family:var(--font-mono)">${S.incident.id}</b></p>
    <div class="actions"><button class="btn primary" data-action="go" data-to="status">Seguir el estado</button><button class="btn ghost" data-action="go" data-to="emergency">Volver a emergencia</button></div>
  </div>`;

  V.witness = () => {
    S.witness = S.witness || { step: 0, text: '', photos: 0, contact: '' };
    const w = S.witness;
    if (w.step === 0) return `<div class="s">
      <div class="appbar"><button class="back" data-action="back">${ICON.back}</button><h1>Soy testigo</h1></div>
      <div class="warnbox red"><div><b>Si estás en peligro, alejate del vehículo y pedí ayuda.</b>No grabes desde la calzada ni te acerques a un vehículo con humo, combustible derramado o cables. Tu seguridad va primero; el testimonio puede esperar.</div></div>
      <p class="lead">Tu relato ayuda a los servicios de emergencia y evita versiones contradictorias. Es voluntario y podés dejarlo anónimo.</p>
      <div class="actions"><button class="btn primary" data-action="witness-start">Estoy a salvo, quiero aportar</button><button class="btn ghost" data-action="back">Ahora no</button></div>
    </div>`;
    return `<div class="s">
      <div class="appbar"><button class="back" data-action="back">${ICON.back}</button><h1>Tu testimonio</h1></div>
      <div class="field"><label for="wtext">¿Qué viste? (en tus palabras)</label><textarea id="wtext" placeholder="Ej.: el micro venía por Santos Dumont hacia el 4º anillo, una vagoneta cruzó en rojo…" data-action="witness-text">${w.text}</textarea></div>
      <div class="card tight"><div class="row"><div class="grow"><b style="font-size:14px">Fotos o video</b><br><span style="font-size:12px;color:var(--muted)">Solo si ya estás a salvo. Se guardan cifradas y no se publican.</span></div><button class="btn ghost sm" style="width:auto" data-action="witness-photo">Agregar (${w.photos})</button></div></div>
      <div class="field"><label for="wcontact">Contacto (opcional)</label><input id="wcontact" placeholder="Teléfono o correo" value="${w.contact}" data-action="witness-contact"></div>
      <div class="toggle"><div><b>Adjuntar mi ubicación actual</b><span>Ayuda a reconstruir el punto exacto.</span></div><button class="switch" role="switch" aria-checked="true" disabled><span class="sr-only">Adjuntar ubicación</span></button></div>
      <button class="btn primary" data-action="witness-submit">Enviar testimonio</button>
      <p class="legalnote">Se asocia al incidente ${S.incident ? S.incident.id : '(se crea uno nuevo si no existe)'}. Podés pedir su eliminación después.</p>
    </div>`;
  };

  V.plate = () => {
    S.plateSpot = S.plateSpot || 'door';
    const spots = [
      { id: 'door', n: 1, t: 'Exterior, junto a la puerta de subida', d: 'Visible desde la vereda. El que llega al accidente lo ve sin subir.', score: 'A' },
      { id: 'interior', n: 2, t: 'Interior, sobre la puerta / mampara', d: 'Para pasajeros a bordo. Protegido del sol y la lluvia.', score: 'A' },
      { id: 'rear', n: 3, t: 'Exterior trasero, bajo el número de línea', d: 'Se ve desde otro vehículo; útil si el micro se fue (fuga).', score: 'B' },
      { id: 'front', n: 4, t: 'Parabrisas, esquina inferior derecha', d: 'Reflejos y polarizado dificultan el escaneo. Solo complementario.', score: 'C' },
      { id: 'seat', n: 5, t: 'Respaldo de asientos (mini, por fila)', d: 'Como en Delhi/Mumbai. Bueno para acoso o quejas, poco útil en un choque.', score: 'B' },
    ];
    return `<div class="s">
      <div class="appbar"><button class="back" data-action="back">${ICON.back}</button><h1>Placa QR física</h1></div>
      <div class="vehicle-hero" id="hero3d" style="height:200px"><span class="pill info tag">Tocá una ubicación</span></div>
      <div class="hotspots">${spots.map(s => `<button class="hotspot" data-action="plate-spot" data-spot="${s.id}" aria-pressed="${S.plateSpot === s.id}"><span class="n">${s.n}</span><div><b>${s.t}</b><span>${s.d}</span></div><span class="score">${s.score}</span></button>`).join('')}</div>
      <div style="display:grid;place-items:center;padding:10px 0">${SalvoQR.plate('SCZ-Q7K3-M9V2', { version: 3, vehicle: { route: '123', unit: '045' } })}</div>
      <div class="card kv"><span class="k">Tamaño</span><span class="v">15 × 21 cm (exterior) · 10 × 14 cm (interior)</span><span class="k">Material</span><span class="v">Vinilo reflectivo + laminado UV</span><span class="k">Lectura</span><span class="v">≥ 2,5 m con cámara de gama media</span><span class="k">Corrección</span><span class="v">ECL H (30 % de daño)</span><span class="k">Reemplazo</span><span class="v">Nueva versión → la anterior se revoca</span></div>
      <p class="legalnote">El QR de arriba es real: escanealo con tu teléfono y abre esta demo directamente en "vehículo identificado". Azul institucional + franja roja: no parece publicidad.</p>
    </div>`;
  };

  V.driverapp = () => {
    const v = D.vehicles['veh-045'], d = D.drivers['drv-00452'];
    const on = !!S.shift;
    const elapsed = on ? Math.floor((now() - S.shift) / 1000) : 0;
    return `<div class="s">
      <div class="appbar"><button class="back" data-action="home">${ICON.back}</button><h1>Mi jornada</h1><div class="spacer"></div><span class="pill ${on ? 'ok' : 'lock'}">${on ? 'En servicio' : 'Fuera de servicio'}</span></div>
      <div class="card driver-row"><div class="avatar">${d.firstName[0]}${d.lastName[0]}</div><div class="grow"><b>${d.firstName} ${d.lastName}</b><span>ID ${d.publicId} · Licencia ${d.licenseCategory} vigente</span></div><span class="pill ok">✓</span></div>
      <div class="drv-status"><span class="eyebrow">Vehículo asignado</span><span class="big">Línea 123 · U045</span><span class="timer">${on ? 'jornada ' + pad(Math.floor(elapsed / 3600)) + ':' + pad(Math.floor(elapsed / 60) % 60) + ':' + pad(elapsed % 60) : 'placa ' + v.plate + ' · QR v3 activo'}</span></div>
      ${on ? `<button class="sos" data-action="driver-sos">SOS<small>MANTENER 2 s</small></button>` : ''}
      <div class="actions">
        ${on ? `<button class="btn ghost left" data-action="driver-report">${ICON.alert}<span class="txt">Reportar incidente menor<span class="sub">Sin heridos: choque leve, falla, pasajero</span></span></button><button class="btn line" data-action="shift-end">Finalizar jornada</button>`
             : `<button class="btn green" data-action="shift-start">Iniciar jornada<span class="sub">Vincula tu identidad al QR de la unidad por hoy</span></button><button class="btn ghost left" data-action="go" data-to="plate">${ICON.qr}<span class="txt">Ver / verificar el QR de mi unidad</span></button>`}
      </div>
      <p class="legalnote">Durante la conducción la app no muestra nada más. El SOS funciona con pantalla bloqueada en la versión nativa; aquí es una simulación.</p>
    </div>`;
  };

  // ------------------------------------------------------------ perfil de emergencia (pasajero)
  // Se guarda SOLO en este teléfono (localStorage). En producción: backend cifrado por campo,
  // teléfono verificado por OTP, consentimiento fechado. Aquí el OTP y la API son simulados.
  const PKEY = 'salvo_profile_v1';
  const BLOOD = ['O+', 'O−', 'A+', 'A−', 'B+', 'B−', 'AB+', 'AB−', 'No sé'];
  function loadProfile() { try { const raw = localStorage.getItem(PKEY); return raw ? JSON.parse(raw) : null; } catch (e) { return null; } }
  function saveProfile(pr) { try { localStorage.setItem(PKEY, JSON.stringify(pr)); } catch (e) { log('warn', 'no se pudo guardar en este navegador (modo privado?) — el perfil vive solo en memoria'); } }
  function personCode() { const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let c = ''; for (let i = 0; i < 4; i++) c += A[Math.floor(Math.random() * A.length)]; return 'SCZ-P-' + c; }
  function maskPhone(ph) { const d = (ph || '').replace(/\D/g, ''); return d.length >= 4 ? '+591 ' + d.slice(0, 1) + '•• ••• ' + d.slice(-2) : '—'; }
  function newForm(base) { return { step: 1, phone: '', otpSent: false, otpOk: false, otp: '', data: Object.assign({ firstName: '', lastName: '', birthYear: '', bloodType: '', allergies: '', conditions: '', medications: '', notes: '' }, base ? base.data : {}), contacts: base ? base.contacts.map(c => Object.assign({}, c)) : [], newContact: { name: '', relation: '', phone: '', channel: 'whatsapp' }, consent: false, editing: !!base }; }
  S.profile = loadProfile();

  V.profile = () => {
    const pr = S.profile;
    if (!pr) return `<div class="s">
      <div class="appbar"><button class="back" data-action="home">${ICON.back}</button><h1>Mi perfil de emergencia</h1></div>
      <p class="lead">Opcional. Sirve si <b>vos</b> sos quien sufre el accidente: los servicios de emergencia lo ven al escanear tu tarjeta SALVO o desde un incidente donde estés registrado.</p>
      <div class="card" style="display:grid;gap:10px">
        <div class="row"><span class="pill ok">${ICON.lock} Privado</span><span style="font-size:13px;color:var(--muted)">Solo lo ven servicios acreditados y contactos que vos elijas.</span></div>
        <div class="row"><span class="pill info">2 min</span><span style="font-size:13px;color:var(--muted)">Teléfono verificado, datos médicos mínimos, contactos.</span></div>
        <div class="row"><span class="pill lock">Reversible</span><span style="font-size:13px;color:var(--muted)">Lo podés editar o borrar en un toque, cuando quieras.</span></div>
      </div>
      <div class="medgrid"><div class="med"><span class="k">Tipo de sangre</span><span class="v" style="color:var(--muted)">—</span></div><div class="med"><span class="k">Alergias</span><span class="v" style="color:var(--muted)">—</span></div><div class="med wide"><span class="k">Contactos de emergencia</span><span class="v" style="color:var(--muted);font-size:14px">Nadie todavía</span></div></div>
      <div class="actions"><button class="btn primary" data-action="profile-start">${ICON.user}<span class="txt">Crear mi perfil<span class="sub">Empieza verificando tu teléfono</span></span></button></div>
      <div class="eyebrow">Historial en este teléfono</div>${historyList()}
    </div>`;
    const d = pr.data;
    return `<div class="s">
      <div class="appbar"><button class="back" data-action="home">${ICON.back}</button><h1>Mi perfil de emergencia</h1><div class="spacer"></div><span class="pill ok">✓ Activo</span></div>
      <div class="card driver-row"><div class="avatar">${(d.firstName[0] || '?')}${(d.lastName[0] || '')}</div><div class="grow"><b>${d.firstName} ${d.lastName}</b><span>Teléfono verificado ${maskPhone(pr.phone)} · desde ${pr.createdAt.slice(0, 10)}</span></div></div>
      <div class="medgrid">
        <div class="med"><span class="k">Tipo de sangre</span><span class="v">${d.bloodType || '—'}</span></div>
        <div class="med"><span class="k">Nacimiento</span><span class="v">${d.birthYear || '—'}</span></div>
        <div class="med wide"><span class="k">Alergias</span><span class="v">${d.allergies || 'Ninguna registrada'}</span></div>
        <div class="med wide"><span class="k">Condiciones</span><span class="v" style="font-size:15px">${d.conditions || '—'}</span></div>
        <div class="med wide"><span class="k">Medicación</span><span class="v" style="font-size:15px">${d.medications || '—'}</span></div>
        ${d.notes ? `<div class="med wide"><span class="k">Notas</span><span class="v" style="font-size:14px">${d.notes}</span></div>` : ''}
      </div>
      <div class="card"><div class="eyebrow">Contactos de emergencia</div>
        ${pr.contacts.length ? pr.contacts.map(c => `<div class="contactline"><div class="avatar" style="width:36px;height:36px;font-size:13px">${c.name[0]}</div><div><b>${c.name}</b><br><span style="color:var(--muted)">${c.relation || 'Contacto'} · ${maskPhone(c.phone)} · ${c.channel === 'sms' ? 'SMS' : 'WhatsApp'}</span></div><span class="st pill ${c.verified ? 'ok' : 'warn'}">${c.verified ? 'verificado' : 'sin verificar'}</span></div>`).join('') : '<div class="empty" style="margin-top:8px">Sin contactos. Agregá al menos uno.</div>'}
      </div>
      <button class="card" data-action="go" data-to="personcard" style="border:0;text-align:left;width:100%;cursor:pointer;display:grid;grid-template-columns:auto 1fr auto;gap:12px;align-items:center">
        <div style="width:54px">${SalvoQR.svgFor(personUrl(pr.code), { ecl: 'M' })}</div>
        <div><b style="font-size:14px">Mi tarjeta SALVO</b><br><span style="font-size:12px;color:var(--muted)">QR personal para billetera, casco o llavero · ${pr.code}</span></div>${ICON.back.replace('M15 6l-6 6 6 6', 'M9 6l6 6-6 6')}
      </button>
      <div class="card kv"><span class="k">Quién vio mis datos</span><span class="v">${pr.audit.length ? pr.audit.length + ' acceso(s)' : 'Nadie todavía'}</span>${pr.audit.map(a => `<span class="k">${a.at}</span><span class="v" style="font-weight:600;font-size:13px">${a.who}</span>`).join('')}</div>
      <div class="actions two"><button class="btn ghost sm" data-action="profile-edit">Editar</button><button class="btn line sm" style="color:var(--rojo);border-color:#f5b2bb" data-action="profile-delete">Borrar perfil</button></div>
      <p class="legalnote">Consentimiento dado el ${pr.consentAt.slice(0, 10)}. Guardado en este teléfono (DEMO). En producción: cifrado por campo en el servidor y auditoría de cada acceso.</p>
      <div class="eyebrow">Historial en este teléfono</div>${historyList()}
    </div>`;
  };
  function historyList() { return S.scanLog.length ? S.scanLog.map(s => `<div class="card tight kv"><span class="k">${hhmm(s.at)}</span><span class="v">L${D.routes[s.vehicle.routeId].number} · U${s.vehicle.unitNumber}</span></div>`).join('') : '<div class="empty">Sin escaneos ni reportes.</div>'; }
  function personUrl(code) { const base = window.SALVO_PUBLIC_URL || (location.origin + location.pathname); return base + (base.includes('?') ? '&' : '?') + 'p=' + encodeURIComponent(code); }

  V.profilecreate = () => {
    const f = S.pform; const d = f.data;
    const head = (t) => `<div class="appbar"><button class="back" data-action="profile-back">${ICON.back}</button><h1>${t}</h1><div class="spacer"></div><span class="pill lock">${f.step}/4</span></div>`;
    if (f.step === 1) return `<div class="s">${head(f.editing ? 'Confirmar teléfono' : 'Tu teléfono')}
      <p class="lead">Lo usamos para verificar que sos vos y para avisarte si alguien consulta tu perfil. No se muestra a nadie.</p>
      <div class="field"><label for="pf-phone">Número de celular</label><input id="pf-phone" inputmode="tel" placeholder="7xx xx xxx" value="${f.phone}" data-bind="phone" ${f.otpSent ? 'disabled' : ''}></div>
      ${f.otpSent ? `<div class="field"><label for="pf-otp">Código que te llegó por SMS / WhatsApp</label><input id="pf-otp" inputmode="numeric" maxlength="4" placeholder="••••" value="${f.otp}" data-bind="otp" style="font-family:var(--font-mono);font-size:22px;letter-spacing:.3em;text-align:center"></div>
        <div class="warnbox"><div><b>DEMO</b>No se envía ningún SMS real. El código es <b style="font-family:var(--font-mono)">${f.demoOtp}</b>.</div></div>
        <button class="btn primary" data-action="profile-otp-verify">Verificar</button><button class="btn ghost sm" data-action="profile-otp-resend">Reenviar código</button>`
      : `<button class="btn primary" data-action="profile-otp-send">Enviarme un código</button>`}
    </div>`;
    if (f.step === 2) return `<div class="s">${head('Tus datos')}
      <p class="lead">Solo lo que un médico necesita en el primer minuto. Todo es opcional salvo el nombre.</p>
      <div class="choices" style="grid-template-columns:1fr 1fr"><div class="field"><label for="pf-fn">Nombre</label><input id="pf-fn" value="${d.firstName}" data-bind="data.firstName" autocomplete="given-name"></div><div class="field"><label for="pf-ln">Apellido</label><input id="pf-ln" value="${d.lastName}" data-bind="data.lastName" autocomplete="family-name"></div></div>
      <div class="choices" style="grid-template-columns:1fr 1fr"><div class="field"><label for="pf-bt">Tipo de sangre</label><select id="pf-bt" data-bind="data.bloodType"><option value="">Elegir…</option>${BLOOD.map(b => `<option ${d.bloodType === b ? 'selected' : ''}>${b}</option>`).join('')}</select></div><div class="field"><label for="pf-by">Año de nacimiento</label><input id="pf-by" inputmode="numeric" maxlength="4" placeholder="1994" value="${d.birthYear}" data-bind="data.birthYear"></div></div>
      <div class="field"><label for="pf-al">Alergias (medicamentos, alimentos)</label><input id="pf-al" placeholder="Ej.: penicilina" value="${d.allergies}" data-bind="data.allergies"></div>
      <div class="field"><label for="pf-co">Condiciones que importan en una emergencia</label><input id="pf-co" placeholder="Ej.: diabetes tipo 1, epilepsia, embarazo" value="${d.conditions}" data-bind="data.conditions"></div>
      <div class="field"><label for="pf-me">Medicación habitual</label><input id="pf-me" placeholder="Ej.: insulina, anticoagulantes" value="${d.medications}" data-bind="data.medications"></div>
      <div class="field"><label for="pf-no">Notas para el personal médico (opcional)</label><textarea id="pf-no" placeholder="Ej.: usa audífono, marcapasos, idioma…" data-bind="data.notes" style="min-height:64px">${d.notes}</textarea></div>
      <button class="btn primary" data-action="profile-next">Continuar</button>
      <p class="legalnote">No pedimos CI, dirección ni historial clínico. Minimización de datos por diseño.</p>
    </div>`;
    if (f.step === 3) { const c = f.newContact; return `<div class="s">${head('Contactos de emergencia')}
      <p class="lead">A quién avisar si te pasa algo. Máximo 3. Les llegará un aviso con lugar, hora y vehículo; nunca tus datos médicos.</p>
      ${f.contacts.length ? `<div class="card">${f.contacts.map((k, i) => `<div class="contactline"><div class="avatar" style="width:36px;height:36px;font-size:13px">${k.name[0]}</div><div class="grow"><b>${k.name}</b><br><span style="color:var(--muted)">${k.relation || 'Contacto'} · ${maskPhone(k.phone)} · ${k.channel === 'sms' ? 'SMS' : 'WhatsApp'}</span></div><button class="btn ghost sm" style="width:auto;min-height:36px;padding:6px 10px" data-action="profile-contact-remove" data-i="${i}" aria-label="Quitar ${k.name}">Quitar</button></div>`).join('')}</div>` : ''}
      ${f.contacts.length < 3 ? `<div class="card" style="display:grid;gap:10px">
        <div class="choices" style="grid-template-columns:1fr 1fr"><div class="field"><label for="pc-name">Nombre</label><input id="pc-name" value="${c.name}" data-bind="newContact.name"></div><div class="field"><label for="pc-rel">Relación</label><input id="pc-rel" placeholder="Madre, pareja, amigo…" value="${c.relation}" data-bind="newContact.relation"></div></div>
        <div class="choices" style="grid-template-columns:1fr 1fr"><div class="field"><label for="pc-phone">Celular</label><input id="pc-phone" inputmode="tel" placeholder="7xx xx xxx" value="${c.phone}" data-bind="newContact.phone"></div><div class="field"><label for="pc-ch">Canal</label><select id="pc-ch" data-bind="newContact.channel"><option value="whatsapp" ${c.channel === 'whatsapp' ? 'selected' : ''}>WhatsApp</option><option value="sms" ${c.channel === 'sms' ? 'selected' : ''}>SMS</option></select></div></div>
        <button class="btn ghost sm" data-action="profile-contact-add">+ Agregar contacto</button></div>` : ''}
      <button class="btn primary" data-action="profile-next" ${f.contacts.length ? '' : 'disabled style="opacity:.5"'}>Continuar</button>
      <p class="legalnote">Cada contacto recibe un mensaje para confirmar que acepta ser tu contacto de emergencia (aquí: simulado).</p>
    </div>`; }
    return `<div class="s">${head('Consentimiento')}
      <div class="card" style="display:grid;gap:8px"><b style="font-size:15px">Quién ve qué</b>
        <div class="kv"><span class="k">Cualquier persona que escanee tu tarjeta</span><span class="v" style="font-size:13px">Nombre + inicial, "tiene perfil", botón para avisar a tus contactos</span>
        <span class="k">Tus contactos</span><span class="v" style="font-size:13px">Lugar y hora del incidente</span>
        <span class="k">Servicios de emergencia acreditados</span><span class="v" style="font-size:13px">Todo el perfil médico, con registro de acceso</span>
        <span class="k">Operadores de transporte</span><span class="v" style="font-size:13px">Nada</span></div></div>
      <div class="toggle"><div><b>Acepto que SALVO guarde estos datos para emergencias</b><span>Podés editarlos o borrarlos cuando quieras. Se conservan hasta que los borres o pasen 12 meses sin renovar.</span></div><button class="switch" role="switch" aria-checked="${f.consent}" data-action="profile-consent"><span class="sr-only">Acepto</span></button></div>
      <div class="card kv"><span class="k">Nombre</span><span class="v">${d.firstName} ${d.lastName}</span><span class="k">Sangre</span><span class="v">${d.bloodType || '—'}</span><span class="k">Alergias</span><span class="v">${d.allergies || '—'}</span><span class="k">Contactos</span><span class="v">${f.contacts.length}</span></div>
      <button class="btn green" data-action="profile-save" ${f.consent ? '' : 'disabled style="opacity:.5"'}>${ICON.check}<span>${f.editing ? 'Guardar cambios' : 'Crear perfil'}</span></button>
    </div>`;
  };

  V.personcard = () => { const pr = S.profile; return `<div class="s">
    <div class="appbar"><button class="back" data-action="back">${ICON.back}</button><h1>Mi tarjeta SALVO</h1></div>
    <div class="plate" style="width:100%;max-width:300px;margin:0 auto;aspect-ratio:auto;grid-template-rows:auto auto auto auto"><div class="top" style="font-size:18px">A SALVO</div><div class="qrbox">${SalvoQR.svgFor(personUrl(pr.code))}</div><div class="cap">${pr.data.firstName.toUpperCase()} ${pr.data.lastName[0] ? pr.data.lastName[0].toUpperCase() + '.' : ''} · PERFIL DE EMERGENCIA<br>ESCANEAR SI ESTÁ INCONSCIENTE</div><div class="serial"><span>${pr.code}</span><span>${pr.data.bloodType || ''}</span></div><div class="band"></div></div>
    <p class="lead">Imprimila del tamaño de una tarjeta o pegala en el casco. Quien la escanee ve solo tu nombre e inicial y puede avisar a tus contactos; el personal médico acreditado ve el perfil completo.</p>
    <div class="actions"><button class="btn primary" data-action="person-preview">${ICON.eye}<span class="txt">Ver cómo la ve otra persona</span></button></div>
    <p class="legalnote">En esta demo el perfil vive en este teléfono, así que la tarjeta solo se resuelve escaneándola desde este mismo dispositivo. En producción el código se resuelve en el servidor.</p>
  </div>`; };

  // Lo que ve quien escanea una tarjeta personal (?p=CODE)
  V.person = () => {
    const pr = S.person; const lvl = S.role;
    if (!pr) return `<div class="s"><div class="appbar"><button class="back" data-action="home">${ICON.back}</button><h1>Tarjeta SALVO</h1></div>
      <div class="warnbox"><div><b>No pudimos resolver esta tarjeta</b>El código <span style="font-family:var(--font-mono)">${S.personCode || ''}</span> no está en este teléfono (DEMO). En producción se consulta al servidor.</div></div>
      <div class="actions"><button class="btn danger" data-action="go" data-to="call">${ICON.phone}<span class="txt">Llamar a emergencias</span></button></div></div>`;
    const d = pr.data; const full = lvl === 'responder';
    return `<div class="s">
      <div class="appbar"><button class="back" data-action="home">${ICON.back}</button><div class="spacer"></div><span class="pill lock">${ICON.lock} ${D.accessLevels[lvl].label}</span></div>
      <div class="idband"><div class="ck">${ICON.check}</div><div><b>PERSONA CON PERFIL SALVO</b><span>Tiene contactos de emergencia registrados</span></div></div>
      <div class="card driver-row"><div class="avatar">${d.firstName[0]}${d.lastName[0] || ''}</div><div class="grow"><b>${d.firstName} ${d.lastName[0] ? d.lastName[0] + '.' : ''}</b><span>${d.birthYear ? (new Date().getFullYear() - +d.birthYear) + ' años aprox.' : 'Perfil de emergencia'} · ${pr.code}</span></div></div>
      <div class="locked"><div class="medgrid ${full ? '' : 'blur'}">
        <div class="med"><span class="k">Tipo de sangre</span><span class="v">${d.bloodType || '—'}</span></div><div class="med"><span class="k">Alergias</span><span class="v">${d.allergies || 'Ninguna'}</span></div>
        <div class="med wide"><span class="k">Condiciones</span><span class="v" style="font-size:15px">${d.conditions || '—'}</span></div><div class="med wide"><span class="k">Medicación</span><span class="v" style="font-size:15px">${d.medications || '—'}</span></div>
        ${d.notes ? `<div class="med wide"><span class="k">Notas</span><span class="v" style="font-size:14px">${d.notes}</span></div>` : ''}
      </div>${full ? '' : `<div class="lockmsg"><div><span class="pill lock">${ICON.lock} Solo personal de emergencia</span></div></div>`}</div>
      <div class="actions">
        <button class="btn primary" data-action="person-notify">${ICON.user}<span class="txt">Avisar a sus contactos<span class="sub">${pr.contacts.length} contacto(s) · reciben lugar y hora, no tus datos</span></span></button>
        <button class="btn danger left" data-action="go" data-to="call">${ICON.phone}<span class="txt">Llamar a emergencias</span></button>
        ${full ? '' : `<button class="btn ghost left" data-action="person-elevate">${ICON.med}<span class="txt">Soy personal de emergencia<span class="sub">Acceso con credencial · queda auditado</span></span></button>`}
      </div>
      ${full ? `<div class="card tight" style="font-size:12px;color:var(--muted)">Acceso registrado en la auditoría del titular (hora + credencial). Consentimiento: ${pr.consentAt.slice(0, 10)}.</div>` : ''}
    </div>`;
  };

  // ------------------------------------------------------------ render teléfono
  function render() {
    const scr = $('#viewport'); if (!scr) return;
    if (S.bus3d) { S.bus3d.dispose(); S.bus3d = null; }
    scr.innerHTML = (V[S.screen] || V.home)();
    scr.scrollTop = 0;
    const hero = $('#hero3d');
    if (hero && window.SalvoBus3D) S.bus3d = SalvoBus3D.mount(hero, { lineColor: 0xF2A93B, highlight: S.screen === 'plate' ? S.plateSpot : 'door', showAll: S.screen === 'plate' });
    if (S.screen === 'report' && S.form && S.form.step === 3 && !S.geo && !S.locating) { S.locating = true; locate().then(g => { S.geo = g; S.locating = false; if (S.screen === 'report') render(); }); }
    updateStatusbar();
  }
  function updateStatusbar() {
    const n = NET[S.net]; const sb = $('#statusbar'); if (!sb) return;
    sb.innerHTML = `<span>${hhmm(now())}</span><span class="net">${[1, 2, 3, 4].map(i => `<i style="height:${4 + i * 3}px;opacity:${i <= n.bars ? 1 : .25}"></i>`).join('')}<span style="font-size:11px;margin-left:4px">${S.net === 'offline' ? 'Sin red' : S.net === 'weak' ? 'E' : S.net === 'slow' ? '3G' : '4G'}</span></span>`;
    const nb = $('#netbanner'); nb.className = 'netbanner' + (S.net === 'fast' ? '' : ' show ' + (S.net === 'offline' ? 'offline' : 'slow'));
    nb.textContent = S.net === 'offline' ? 'Sin conexión — mostrando datos guardados. Las llamadas funcionan. El reporte se enviará al volver la señal.' : S.net === 'weak' ? 'Señal débil — cargando lo esencial primero.' : S.net === 'slow' ? 'Conexión lenta — versión ligera.' : '';
  }

  // ------------------------------------------------------------ acciones
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-action]'); if (!b) return;
    const a = b.dataset.action;
    const A = {
      go() { go(b.dataset.to); }, back, home() { S.prev = []; go('home', { replace: true }); },
      scan() { clearTimers(); S.geo = null; S.form = null; S.witness = null; S.incident = null; startScan(b.dataset.code); },
      'retry-scan'() { startScan(S.qr); },
      'emergency-nocontext'() { toast('En el producto real esto abre el marcador con 110', false); },
      'report-fake'() { api('POST', '/v1/qr/report-suspicious', { code: S.qr, geo: 'pending' }, { handler: () => ({ _log: 'alerta al operador de la zona + auditoría' }) }).then(() => toast('Gracias. Se avisó al equipo de campo.', true)); },
      tel() { e.preventDefault(); log('info', `tel:${b.dataset.num} — abre el marcador del teléfono (no se ejecuta en la demo)`); toast('Abriría el marcador con ' + b.dataset.num); },
      'notify-operator'() { api('POST', `/v1/vehicles/${S.vehicle.id}/alert-operator`, { by: 'scanner' }, { handler: () => ({ _log: 'despacho ' + S.operator.name + ' en panel' }) }).then(() => toast('Operador avisado', true)); },
      'notify-contacts'() { if (!S.incident) createIncident('other', false, S.role); notifyContacts().then(() => { toast('Contactos avisados', true); haptic(); if (S.screen === 'contacts') go('incident'); else render(); }).catch(() => toast('Sin red: se enviará al reconectar')); },
      'copy-share'() { const t = $('#sharetext').innerText; (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => toast('Copiado', true), () => toast('No se pudo copiar automáticamente')); },
      'native-share'() { const t = $('#sharetext').innerText; if (navigator.share) navigator.share({ text: t }).catch(() => {}); else toast('Tu navegador no tiene compartir nativo; usá Copiar'); },
      'use-gps'() { locate().then(g => { S.geo = g; render(); toast(g.source === 'phone' ? 'Ubicación de tu GPS' : 'GPS no disponible: se usa la del vehículo', g.source === 'phone'); }); },
      'request-responder'() { api('POST', '/v1/access/elevate', { level: 'responder', credential: 'SEDES-•••-1042', incident: S.incident ? S.incident.id : null }, { handler: () => ({ _log: 'credencial válida · acceso 30 min · auditado' }) }).then(() => { S.role = 'responder'; syncRoleUI(); render(); toast('Acceso de servicio de emergencia concedido', true); }); },
      'request-contact'() { api('POST', '/v1/access/otp', { level: 'contact', phone: '+591 7•• ••• 41' }, { handler: () => ({ _log: 'OTP enviado; el contacto debe estar en la lista del conductor' }) }).then(() => { S.role = 'contact'; syncRoleUI(); render(); toast('Verificado como contacto del conductor', true); }); },
      'pick-kind'() { S.form.kind = b.dataset.kind; render(); },
      'pick-injured'() { S.form.injured = b.dataset.v === 'yes'; render(); },
      'toggle-contact'() { S.form.contact = !S.form.contact; render(); },
      'report-next'() { S.form.step++; render(); },
      'report-submit'() {
        const f = S.form; haptic([40, 60, 40]);
        api('POST', '/v1/incidents', { vehicleId: S.vehicle.id, qr: S.qr, type: f.kind, injured: f.injured, geo: [S.geo.lat.toFixed(5), S.geo.lng.toFixed(5)], accuracy: Math.round(S.geo.accuracyM), reporter: f.contact ? 'phone-shared' : 'anonymous', token: S.sessionToken.slice(0, 12) + '…' }, { handler: () => ({ _log: 'incidente creado' }) })
          .then(() => { createIncident(f.kind, f.injured, f.contact ? 'phone-shared' : 'anonymous'); S.form = null; S.prev = ['identified']; go('incident', { replace: true }); })
          .catch(() => { createIncident(f.kind, f.injured, 'queued-offline'); S.incident.queued = true; log('warn', 'reporte encolado en el dispositivo (Background Sync) — se enviará al reconectar'); S.form = null; go('incident', { replace: true }); toast('Sin red: reporte guardado, se enviará solo'); });
      },
      'request-help'() { const inc = S.incident; inc.helpRequested = true; api('POST', `/v1/incidents/${inc.id}/request-help`, { services: ['ambulance', 'police'] }, { handler: () => ({ _log: 'despacho 118/110 con ficha del incidente' }) }).then(() => { inc.state = 'help'; inc.events.push({ at: now(), state: 'help', note: 'ayuda solicitada por quien reportó' }); go('helped'); }).catch(() => toast('Sin red: llamá al 118 directamente')); },
      'mark-attending'() { const inc = S.incident; inc.state = 'attending'; inc.events.push({ at: now(), state: 'attending', note: 'ambulancia en el lugar (simulado)' }); render(); },
      'mark-resolved'() { const inc = S.incident; inc.state = 'resolved'; inc.events.push({ at: now(), state: 'resolved', note: 'cerrado por operador (simulado)' }); clearTimers(); render(); },
      'witness-start'() { S.witness.step = 1; render(); },
      'witness-photo'() { S.witness.photos++; log('info', 'evidencia: foto cifrada en el dispositivo, se sube con el testimonio'); render(); },
      'witness-submit'() { const w = S.witness; if (!S.incident) createIncident('other', false, 'witness'); api('POST', `/v1/incidents/${S.incident.id}/witness`, { textLen: w.text.length, photos: w.photos, contact: !!w.contact, geo: true }, { handler: () => ({ _log: 'testimonio #' + (S.incident.witnesses.length + 1) }) }).then(() => { S.incident.witnesses.push(w); S.witness = null; toast('Gracias. Tu testimonio quedó asociado al incidente.', true); go('incident'); }); },
      'plate-spot'() { S.plateSpot = b.dataset.spot; document.querySelectorAll('.hotspot').forEach(h => h.setAttribute('aria-pressed', h.dataset.spot === S.plateSpot)); if (S.bus3d) S.bus3d.highlight(S.plateSpot); },
      'shift-start'() { api('POST', '/v1/shifts', { driverId: 'drv-00452', vehicleId: 'veh-045', qr: 'SCZ-Q7K3-M9V2' }, { handler: () => ({ _log: 'conductor ↔ unidad vinculados hasta fin de jornada' }) }).then(() => { S.shift = now(); render(); toast('Jornada iniciada', true); }); },
      'shift-end'() { api('POST', '/v1/shifts/current/end', {}, { handler: () => ({ _log: 'el QR vuelve a mostrar "sin conductor asignado"' }) }).then(() => { S.shift = null; render(); }); },
      'driver-sos'() { haptic([80, 60, 80]); api('POST', '/v1/incidents', { source: 'driver-sos', vehicleId: 'veh-045' }, { handler: () => ({ _log: 'SOS conductor: prioridad máxima, operador + 110' }) }).then(() => toast('SOS enviado al operador y a la policía', true)); },
      'driver-report'() { toast('Formulario corto de 2 pasos (tipo + nota de voz)'); },
      toast() { toast(b.dataset.msg); },
    };
    const P = {
      'profile-start'() { S.pform = newForm(null); go('profilecreate'); },
      'profile-edit'() { S.pform = newForm(S.profile); S.pform.phone = S.profile.phone; S.pform.step = 2; go('profilecreate'); },
      'profile-back'() { const f = S.pform; if (f.step > (f.editing ? 2 : 1)) { f.step--; render(); } else back(); },
      'profile-otp-send'() { const f = S.pform; if (f.phone.replace(/\D/g, '').length < 7) return toast('Escribí un número válido'); f.demoOtp = String(1000 + Math.floor(Math.random() * 9000)); api('POST', '/v1/profiles/otp', { phone: maskPhone(f.phone) }, { handler: () => ({ _log: 'OTP enviado por SMS/WhatsApp · válido 5 min · DEMO: ' + f.demoOtp }) }).then(() => { f.otpSent = true; render(); }).catch(() => toast('Sin red: no se pudo enviar el código')); },
      'profile-otp-resend'() { const f = S.pform; f.demoOtp = String(1000 + Math.floor(Math.random() * 9000)); f.otp = ''; log('info', 'OTP reenviado · DEMO: ' + f.demoOtp); render(); },
      'profile-otp-verify'() { const f = S.pform; if (f.otp.trim() !== f.demoOtp) { haptic(60); return toast('Código incorrecto. Revisá el mensaje.'); } log('ok', 'teléfono verificado'); f.otpOk = true; f.step = 2; render(); },
      'profile-next'() { const f = S.pform; if (f.step === 2 && !f.data.firstName.trim()) return toast('El nombre es necesario para identificarte'); f.step++; render(); },
      'profile-contact-add'() { const f = S.pform, c = f.newContact; if (!c.name.trim() || c.phone.replace(/\D/g, '').length < 7) return toast('Nombre y celular del contacto'); f.contacts.push({ name: c.name.trim(), relation: c.relation.trim(), phone: c.phone, channel: c.channel, verified: false }); f.newContact = { name: '', relation: '', phone: '', channel: 'whatsapp' }; log('info', `contacto agregado · se le envía confirmación por ${c.channel} (DEMO)`); render(); },
      'profile-contact-remove'() { S.pform.contacts.splice(+b.dataset.i, 1); render(); },
      'profile-consent'() { S.pform.consent = !S.pform.consent; render(); },
      'profile-save'() {
        const f = S.pform; const prev = S.profile;
        const pr = { code: prev ? prev.code : personCode(), phone: f.phone, data: f.data, contacts: f.contacts.map(c => Object.assign({}, c, { verified: true })), consentAt: prev ? prev.consentAt : now().toISOString(), createdAt: prev ? prev.createdAt : now().toISOString(), updatedAt: now().toISOString(), audit: prev ? prev.audit : [] };
        api(prev ? 'PUT' : 'POST', prev ? '/v1/me/emergency-profile' : '/v1/profiles', { fields: Object.keys(f.data).filter(k => f.data[k]).length, contacts: pr.contacts.length, consent: true }, { handler: () => ({ _log: 'campos médicos cifrados (KMS) · consentimiento fechado · código ' + pr.code }) })
          .then(() => { S.profile = pr; saveProfile(pr); S.pform = null; haptic([30, 40, 30]); S.prev = ['home']; go('profile', { replace: true }); toast(prev ? 'Perfil actualizado' : 'Perfil creado. Ya tenés tu tarjeta SALVO.', true); })
          .catch(() => { S.profile = pr; saveProfile(pr); S.pform = null; S.prev = ['home']; go('profile', { replace: true }); toast('Sin red: guardado en el teléfono, se sincroniza después'); });
      },
      'profile-delete'() { if (!confirm('¿Borrar tu perfil de emergencia? Se elimina de este teléfono y del servidor.')) return; api('DELETE', '/v1/me/emergency-profile', null, { handler: () => ({ _log: 'perfil y contactos eliminados · auditoría conservada 90 días' }) }).finally(() => { S.profile = null; try { localStorage.removeItem(PKEY); } catch (e) {} render(); toast('Perfil borrado'); }); },
      'person-preview'() { S.person = S.profile; S.personCode = S.profile.code; log('info', `simulando escaneo de la tarjeta ${S.profile.code} por otra persona`); go('person'); },
      'person-notify'() { api('POST', `/v1/persons/${S.person.code}/notify`, { contacts: S.person.contacts.length, incident: S.incident ? S.incident.id : null }, { handler: () => ({ _log: 'avisos enviados con lugar y hora' }) }).then(() => { toast('Contactos avisados', true); if (S.profile && S.profile.code === S.person.code) { S.profile.audit.push({ at: hhmm(now()), who: 'Aviso a contactos (persona que escaneó)' }); saveProfile(S.profile); } }); },
      'person-elevate'() { api('POST', '/v1/access/elevate', { level: 'responder', credential: 'SEDES-•••-1042', subject: S.person.code }, { handler: () => ({ _log: 'credencial válida · 30 min · auditado' }) }).then(() => { S.role = 'responder'; syncRoleUI(); if (S.profile && S.profile.code === S.person.code) { S.profile.audit.push({ at: hhmm(now()), who: 'SEDES-•••-1042 vio el perfil médico' }); saveProfile(S.profile); } render(); toast('Acceso concedido y registrado', true); }); },
    };
    if (A[a]) A[a](); else if (P[a]) P[a]();
  });
  document.addEventListener('change', e => { const t = e.target; if (t.tagName === 'SELECT' && t.dataset.bind && S.pform) { const path = t.dataset.bind.split('.'); let o = S.pform; while (path.length > 1) o = o[path.shift()]; o[path[0]] = t.value; } });
  document.addEventListener('input', e => {
    const t = e.target;
    if (t.dataset.bind && S.pform) { const path = t.dataset.bind.split('.'); let o = S.pform; while (path.length > 1) o = o[path.shift()]; o[path[0]] = t.value; return; }
    if (!t.dataset.action) return;
    if (t.dataset.action === 'witness-text') S.witness.text = t.value;
    if (t.dataset.action === 'witness-contact') S.witness.contact = t.value;
  });

  // ------------------------------------------------------------ shell (rol, red, vistas)
  function syncRoleUI() { document.querySelectorAll('[data-role]').forEach(x => x.setAttribute('aria-pressed', x.dataset.role === S.role)); }
  function syncNetUI() { document.querySelectorAll('[data-net]').forEach(x => x.setAttribute('aria-pressed', x.dataset.net === S.net)); updateStatusbar(); }
  document.addEventListener('click', e => {
    const r = e.target.closest('[data-role]'); if (r) { S.role = r.dataset.role; syncRoleUI(); log('info', `nivel de acceso de la demo → <b>${D.accessLevels[S.role].label}</b>`); render(); }
    const n = e.target.closest('[data-net]'); if (n) { S.net = n.dataset.net; syncNetUI(); log('warn', `red simulada → ${NET[S.net].label}`); }
    const v = e.target.closest('[data-view]'); if (v) { setView(v.dataset.view); }
    if (e.target.closest('#reset')) { clearTimers(); Object.assign(S, { screen: 'home', prev: [], role: 'public', net: 'fast', incident: null, geo: null, form: null, witness: null, shift: null, vehicle: null }); syncRoleUI(); syncNetUI(); $('#console').innerHTML = ''; log('info', 'demo reiniciada'); setView('phone'); }
  });
  function setView(v) {
    S.view = v; document.querySelectorAll('[data-view]').forEach(x => x.setAttribute('aria-selected', x.dataset.view === v));
    $('#stage').hidden = v !== 'phone'; $('#dash').hidden = v !== 'dashboard';
    if (v === 'dashboard') renderDash(); else render();
  }

  // ------------------------------------------------------------ dashboard operador
  function renderDash() {
    const inc = S.incident; const c = S.counters;
    const vehicles = [
      { unit: '045', plate: '2847-KLP', driver: '00452', state: S.shift || S.vehicle ? 'En servicio' : 'Fuera', lat: -17.7995, lng: -63.161, alert: !!inc },
      { unit: '012', plate: '1932-HTR', driver: '00118', state: 'En servicio', lat: -17.771, lng: -63.196 },
      { unit: '027', plate: '3310-PQA', driver: '00301', state: 'En servicio', lat: -17.812, lng: -63.14 },
      { unit: '033', plate: '2205-LMC', driver: '—', state: 'Sin conductor', lat: -17.79, lng: -63.21 },
      { unit: '051', plate: '4471-BBZ', driver: '00509', state: 'QR dañado', lat: -17.76, lng: -63.17, warn: true },
    ];
    const st = inc ? D.incidentStates.find(s => s.id === inc.state) : null;
    $('#dash').innerHTML = `
      <div class="kpis">
        <div class="kpi"><span class="k">Unidades en servicio</span><span class="v">38<span style="font-size:14px;color:var(--stage-muted)"> / 42</span></span><span class="d">Línea 123 · ${S.operator ? S.operator.name : 'Sindicato 21 de Mayo'}</span></div>
        <div class="kpi"><span class="k">Escaneos hoy</span><span class="v">${c.scans}</span><span class="d">+${Math.round(c.scans * 0.06)} vs. ayer</span></div>
        <div class="kpi"><span class="k">Incidentes abiertos</span><span class="v" style="color:${inc && inc.state !== 'resolved' ? 'var(--rojo)' : 'inherit'}">${inc && inc.state !== 'resolved' ? 1 : 0}</span><span class="d">${c.incidents} en el mes</span></div>
        <div class="kpi"><span class="k">QR con problemas</span><span class="v">1</span><span class="d">U051 · reemplazo programado</span></div>
        <div class="kpi"><span class="k">Conductores sin registro</span><span class="v">0</span><span class="d">42 verificados</span></div>
      </div>
      <div class="grid">
        <div class="panel"><h3>Mapa en tiempo real <span class="pill info">GPS de la app del conductor · 30 s</span></h3>
          ${SalvoMap.render({ lat: vehicles[0].lat, lng: vehicles[0].lng, accuracyM: 12, width: 720, height: 360, scale: 0.045, markers: vehicles.slice(1).map(v => ({ lat: v.lat, lng: v.lng, color: v.warn ? '#F2A93B' : '#14306B' })) })}
          <div class="tblwrap"><table class="tbl"><thead><tr><th>Unidad</th><th>Placa</th><th>Conductor</th><th>Estado</th><th>QR</th></tr></thead><tbody>
            ${vehicles.map(v => `<tr><td><b>${v.unit}</b></td><td class="mono">${v.plate}</td><td class="mono">${v.driver}</td><td>${v.alert ? '<span class="pill bad">Incidente</span>' : v.warn ? '<span class="pill warn">' + v.state + '</span>' : (v.state === 'Sin conductor' || v.state === 'Fuera') ? '<span class="pill lock">' + v.state + '</span>' : '<span class="pill ok">' + v.state + '</span>'}</td><td>${v.warn ? 'v2 · dañado' : 'v3 · activo'}</td></tr>`).join('')}
          </tbody></table></div>
        </div>
        <div style="display:grid;gap:16px;align-content:start">
          <div class="panel"><h3>Alertas</h3>
            ${inc ? `<div class="alert" style="--c:${st.color}"><div><b>${inc.id} · ${st.label}</b><span>L123 U045 · ${D.incidentTypes.find(t => t.id === inc.kind).label}${inc.injured ? ' · heridos' : ''} · ${hhmm(inc.createdAt)} · ${inc.witnesses.length} testigo(s)</span></div></div>` : '<div class="alert" style="--c:#0F8A5F"><div><b>Sin incidentes activos</b><span>Último: hace 3 días</span></div></div>'}
            <div class="alert" style="--c:#F2A93B"><div><b>QR U051 reportado dañado</b><span>2 escaneos fallidos hoy · reemplazo v3 en cola</span></div></div>
            <div class="alert" style="--c:#2F80ED"><div><b>Licencia por vencer</b><span>Conductor 00301 · vence en 21 días</span></div></div>
          </div>
          <div class="panel"><h3>Incidentes · últimos 30 días</h3>
            <svg viewBox="0 0 320 120" role="img" aria-label="Incidentes por día, últimos 30 días">
              <defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#14306B" stop-opacity=".35"/><stop offset="1" stop-color="#14306B" stop-opacity="0"/></linearGradient></defs>
              ${[0, 1, 2, 3].map(i => `<line x1="30" x2="310" y1="${100 - i * 30}" y2="${100 - i * 30}" stroke="currentColor" stroke-opacity=".12"/><text x="24" y="${103 - i * 30}" font-size="8" text-anchor="end" fill="currentColor" opacity=".6">${i}</text>`).join('')}
              ${(() => { const d = [0,1,0,0,2,1,0,0,1,0,0,3,1,0,0,0,1,2,0,0,1,0,0,0,1,1,0,2,0, inc ? 1 : 0]; const pts = d.map((v, i) => [30 + i * 280 / 29, 100 - v * 30]); const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1]).join(' '); return `<path d="${line} L310 100 L30 100Z" fill="url(#ag)"/><path d="${line}" fill="none" stroke="#14306B" stroke-width="2"/><circle cx="310" cy="${100 - d[29] * 30}" r="4" fill="#D7263D"/>`; })()}
              <text x="30" y="115" font-size="8" fill="currentColor" opacity=".6">hace 30 d</text><text x="310" y="115" font-size="8" text-anchor="end" fill="currentColor" opacity=".6">hoy</text>
            </svg>
          </div>
          <div class="panel"><h3>Auditoría reciente</h3><div class="tblwrap"><table class="tbl"><tbody>
            ${inc ? `<tr><td class="mono">${hhmmss(inc.createdAt)}</td><td>incident.created</td><td class="mono">${inc.id}</td></tr>` : ''}
            <tr><td class="mono">${hhmm(now())}:12</td><td>qr.scan</td><td class="mono">SCZ-Q7K3-M9V2 · ok</td></tr>
            <tr><td class="mono">${hhmm(now())}:02</td><td>qr.scan</td><td class="mono">SCZ-A1B2-C3D4 · revoked</td></tr>
            <tr><td class="mono">${pad(now().getHours() - 1)}:41:07</td><td>access.elevate</td><td class="mono">responder · SEDES-•••-1042</td></tr>
          </tbody></table></div></div>
        </div>
      </div>`;
  }

  // ------------------------------------------------------------ arranque
  function boot() {
    const q = new URLSearchParams(location.search);
    setInterval(updateStatusbar, 15000);
    syncRoleUI(); syncNetUI();
    log('info', 'SALVO demo lista · backend simulado · QR real · GPS real si das permiso');
    if ('serviceWorker' in navigator && location.protocol.startsWith('http') && !location.hostname.includes('claude')) {
      navigator.serviceWorker.register('sw.js').then(() => log('ok', 'service worker registrado: la ficha del último vehículo queda disponible sin red')).catch(() => {});
    }
    if (q.get('p')) { S.personCode = q.get('p'); S.person = S.profile && S.profile.code === q.get('p') ? S.profile : null; log('ok', `deep link ?p=${q.get('p')} — tarjeta personal SALVO`); go('person', { replace: true }); return; }
    if (q.get('qr')) { render(); log('ok', `deep link ?qr=${q.get('qr')} — así llega un teléfono real que escaneó la placa`); startScan(q.get('qr')); return; }
    render(); timer(() => { if (S.screen === 'splash') go('home', { replace: true }); }, 1400);
  }
  document.addEventListener('DOMContentLoaded', boot);
})();
