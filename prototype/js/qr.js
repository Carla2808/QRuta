/* Placa QR física — renderiza un QR REAL (qrcode-generator, MIT) que apunta a la URL de
 * esta demo con ?qr=<code>. Escanearlo con un teléfono abre la experiencia de emergencia
 * directamente, sin instalar nada: así funciona el producto real. */
window.QRutaQR = (function () {
  function svgFor(text, opts) {
    opts = opts || {};
    const qr = qrcode(0, opts.ecl || 'H'); // ECL H: sigue leyéndose con ~30 % de daño (rayones, sol)
    qr.addData(text);
    qr.make();
    const n = qr.getModuleCount();
    const quiet = 2;
    const size = n + quiet * 2;
    let d = '';
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (qr.isDark(r, c)) d += `M${c + quiet} ${r + quiet}h1v1h-1z`;
      }
    }
    // Zona central limpia para el símbolo (posible gracias al ECL H)
    const cx = size / 2, box = Math.round(n * 0.22);
    return `<svg viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges" role="img" aria-label="Código QR ${text}">
      <rect width="${size}" height="${size}" fill="#fff"/>
      <path d="${d}" fill="#0b1020"/>
      <rect x="${cx - box / 2}" y="${cx - box / 2}" width="${box}" height="${box}" rx="1.2" fill="#fff"/>
      <rect x="${cx - box / 2 + 0.8}" y="${cx - box / 2 + 0.8}" width="${box - 1.6}" height="${box - 1.6}" rx="0.8" fill="#14306B"/>
      <text x="${cx}" y="${cx + box * 0.18}" text-anchor="middle" font-family="Bricolage Grotesque, Manrope, sans-serif" font-weight="800" font-size="${box * 0.55}" fill="#fff">Q</text>
    </svg>`;
  }

  function plate(code, opts) {
    opts = opts || {};
    // URL pública que codifica la placa. En producción: https://qruta.bo/v/{code}. En la demo,
    // la del Artifact publicado (el sandbox del iframe no es una URL que un teléfono pueda abrir).
    const base = window.QRUTA_PUBLIC_URL || (location.origin + location.pathname);
    const url = opts.url || (base + (base.includes('?') ? '&' : '?') + 'qr=' + encodeURIComponent(code));
    const cls = 'plate' + (opts.small ? ' small' : '');
    const vehicle = opts.vehicle;
    return `<div class="${cls}" data-code="${code}">
      <div class="top">ESCANÉAME</div>
      <div class="qrbox">${svgFor(url, opts)}</div>
      <div class="redstrip">EN CASO DE ACCIDENTE · IDENTIFICA ESTE VEHÍCULO</div>
      <div class="cap">IDENTIFICACIÓN Y SEGURIDAD<br>DEL VEHÍCULO · SIN APP</div>
      <div class="serial"><span>${code}</span><span>${vehicle ? 'L' + vehicle.route + ' · U' + vehicle.unit : 'v' + (opts.version || 1)}</span></div>
      <div class="band"></div>
    </div>`;
  }

  return { svgFor, plate };
})();
