/* Mapa esquemático de Santa Cruz de la Sierra (anillos + radiales). No es cartografía
 * real: en producción el proveedor de mapas va detrás de un adaptador por ciudad
 * (mapStyle: 'anillos' es solo el fallback offline/ligero de SCZ). */
window.QRutaMap = (function () {
  // Proyección local aprox. (metros → px) centrada en el 1er anillo (Plaza 24 de Septiembre)
  const CENTER = { lat: -17.7833, lng: -63.1821 };
  function project(lat, lng, w, h, scale) {
    const kx = 111320 * Math.cos(CENTER.lat * Math.PI / 180), ky = 110540;
    const dx = (lng - CENTER.lng) * kx, dy = (lat - CENTER.lat) * ky;
    return { x: w / 2 + dx * scale, y: h / 2 - dy * scale };
  }
  function base(w, h, scale, ink, line) {
    const rings = [0.9, 1.75, 2.75, 3.8, 5.0, 6.3]; // radios aprox. en km de los anillos 1º–6º
    let s = `<rect width="${w}" height="${h}" fill="url(#g)"/>`;
    rings.forEach((rk, i) => {
      const r = rk * 1000 * scale;
      s += `<circle cx="${w / 2}" cy="${h / 2}" r="${r}" fill="none" stroke="${line}" stroke-width="${i < 4 ? 2 : 1.2}"/>`;
      if (r < Math.min(w, h) / 2) s += `<text x="${w / 2 + r + 4}" y="${h / 2 - 4}" font-size="9" fill="${ink}" opacity=".55" font-family="Manrope, sans-serif" font-weight="700">${i + 1}º</text>`;
    });
    // Radiales principales
    [0, 30, 60, 90, 120, 150].forEach(a => {
      const t = a * Math.PI / 180, R = 7000 * scale;
      s += `<line x1="${w / 2 - Math.cos(t) * R}" y1="${h / 2 - Math.sin(t) * R}" x2="${w / 2 + Math.cos(t) * R}" y2="${h / 2 + Math.sin(t) * R}" stroke="${line}" stroke-width="1" opacity=".7"/>`;
    });
    return s;
  }
  function render(opts) {
    const w = opts.width || 354, h = opts.height || 200, scale = opts.scale || 0.03;
    const ink = opts.ink || '#101828', line = opts.line || '#cfd8e6';
    const p = project(opts.lat, opts.lng, w, h, scale);
    // Ruta animada (trazo aproximado del corredor de la línea) — opcional
    let route = '';
    if (opts.route) {
      const pts = opts.route.map(([la, ln]) => project(la, ln, w, h, scale));
      const d = pts.map((q, i) => (i ? 'L' : 'M') + q.x.toFixed(1) + ' ' + q.y.toFixed(1)).join(' ');
      route = `<path d="${d}" fill="none" stroke="${opts.routeColor || '#F2A93B'}" stroke-width="4" stroke-linecap="round" opacity=".9" stroke-dasharray="6 6"><animate attributeName="stroke-dashoffset" from="0" to="-24" dur="1.2s" repeatCount="indefinite"/></path>`;
    }
    const extra = (opts.markers || []).map(m => {
      const q = project(m.lat, m.lng, w, h, scale);
      return `<g transform="translate(${q.x} ${q.y})"><circle r="5" fill="${m.color || '#14306B'}" stroke="#fff" stroke-width="2"/></g>`;
    }).join('');
    return `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="Ubicación aproximada del vehículo">
      <defs><radialGradient id="g" cx="50%" cy="50%" r="70%"><stop offset="0" stop-color="#f7f9fc"/><stop offset="1" stop-color="#e6ecf5"/></radialGradient></defs>
      ${base(w, h, scale, ink, line)}
      ${route}${extra}
      <g transform="translate(${p.x} ${p.y})">
        <circle class="pulse" r="6" fill="#D7263D" opacity=".6"/>
        <circle r="${(opts.accuracyM || 12) * scale}" fill="#D7263D" opacity=".12"/>
        <circle r="7" fill="#D7263D" stroke="#fff" stroke-width="3"/>
      </g>
    </svg>`;
  }
  return { render, project };
})();
