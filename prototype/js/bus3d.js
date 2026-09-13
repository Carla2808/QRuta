/* Micro 3D low-poly (Three.js r128). Muestra dónde va la placa QR en el vehículo y
 * sirve como "vehículo identificado" en la pantalla de resultado. Geometría procedural:
 * no es un modelo CAD de un micro real. */
window.QRutaBus3D = (function () {
  function mount(container, opts) {
    opts = opts || {};
    if (!window.THREE) { container.innerHTML = '<div class="empty">3D no disponible</div>'; return { dispose() {}, highlight() {} }; }
    const T = THREE;
    const w = container.clientWidth || 354, h = container.clientHeight || 170;
    const renderer = new T.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.setSize(w, h);
    container.appendChild(renderer.domElement);
    const scene = new T.Scene();
    const cam = new T.PerspectiveCamera(30, w / h, 0.1, 100);
    cam.position.set(7.5, 4.2, 8.5); cam.lookAt(0, 0.9, 0);
    scene.add(new T.HemisphereLight(0xffffff, 0x9fb0c8, 1.0));
    const sun = new T.DirectionalLight(0xffffff, 0.9); sun.position.set(5, 8, 4); scene.add(sun);

    const g = new T.Group(); scene.add(g);
    const paint = new T.MeshStandardMaterial({ color: 0xf4f6fa, roughness: .5, metalness: .05 });
    const stripe = new T.MeshStandardMaterial({ color: opts.lineColor || 0xF2A93B, roughness: .6 });
    const glass = new T.MeshStandardMaterial({ color: 0x8fb7e6, roughness: .1, metalness: .4, transparent: true, opacity: .75 });
    const dark = new T.MeshStandardMaterial({ color: 0x1b2131, roughness: .9 });
    const rubber = new T.MeshStandardMaterial({ color: 0x14171f, roughness: 1 });

    const body = new T.Mesh(new T.BoxGeometry(5.6, 2.0, 2.2), paint); body.position.y = 1.35; g.add(body);
    const roof = new T.Mesh(new T.BoxGeometry(5.4, 0.18, 2.1), paint); roof.position.y = 2.42; g.add(roof);
    const band = new T.Mesh(new T.BoxGeometry(5.62, 0.34, 2.22), stripe); band.position.y = 0.85; g.add(band);
    // Ventanas laterales
    for (let i = 0; i < 4; i++) {
      const win = new T.Mesh(new T.BoxGeometry(0.95, 0.7, 2.24), glass); win.position.set(-1.9 + i * 1.25, 1.75, 0); g.add(win);
    }
    const front = new T.Mesh(new T.BoxGeometry(0.1, 0.9, 1.9), glass); front.position.set(2.82, 1.75, 0); g.add(front);
    const bumper = new T.Mesh(new T.BoxGeometry(0.2, 0.3, 2.2), dark); bumper.position.set(2.85, 0.5, 0); g.add(bumper);
    // Puerta (lado derecho, +z)
    const door = new T.Mesh(new T.BoxGeometry(0.9, 1.7, 0.04), new T.MeshStandardMaterial({ color: 0xe6eaf2, roughness: .6 }));
    door.position.set(1.7, 1.2, 1.12); g.add(door);
    // Ruedas
    [[-1.8, 1.05], [1.8, 1.05], [-1.8, -1.05], [1.8, -1.05]].forEach(([x, z]) => {
      const wh = new T.Mesh(new T.CylinderGeometry(0.42, 0.42, 0.3, 20), rubber);
      wh.rotation.x = Math.PI / 2; wh.position.set(x, 0.42, z); g.add(wh);
    });
    // Placa QR: textura canvas con el patrón real si se pasó el SVG, si no, patrón sintético
    const plates = {};
    function makePlate(key, pos, rot, scale) {
      const c = document.createElement('canvas'); c.width = 256; c.height = 340;
      const x = c.getContext('2d');
      x.fillStyle = '#14306B'; x.fillRect(0, 0, 256, 340);
      x.fillStyle = '#fff'; x.fillRect(10, 10, 236, 320); x.fillStyle = '#14306B'; x.fillRect(16, 16, 224, 308);
      x.fillStyle = '#fff'; x.font = 'bold 26px sans-serif'; x.textAlign = 'center'; x.fillText('ESCANÉAME', 128, 54);
      x.fillRect(38, 70, 180, 180);
      x.fillStyle = '#0b1020';
      let seed = 7; for (let r = 0; r < 21; r++) for (let q = 0; q < 21; q++) { seed = (seed * 9301 + 49297) % 233280; if (seed / 233280 < .45) x.fillRect(46 + q * 7.8, 78 + r * 7.8, 7.4, 7.4); }
      [[46, 78], [46 + 14 * 7.8, 78], [46, 78 + 14 * 7.8]].forEach(([a, b]) => { x.fillStyle = '#0b1020'; x.fillRect(a, b, 54, 54); x.fillStyle = '#fff'; x.fillRect(a + 8, b + 8, 38, 38); x.fillStyle = '#0b1020'; x.fillRect(a + 16, b + 16, 22, 22); });
      x.fillStyle = '#D7263D'; x.fillRect(30, 262, 196, 26); x.fillStyle = '#fff'; x.font = 'bold 12px sans-serif'; x.fillText('EN CASO DE ACCIDENTE', 128, 280);
      x.font = 'bold 11px sans-serif'; x.fillText('IDENTIFICACIÓN Y SEGURIDAD', 128, 308);
      const tex = new T.CanvasTexture(c);
      const m = new T.Mesh(new T.PlaneGeometry(0.6 * scale, 0.8 * scale), new T.MeshBasicMaterial({ map: tex }));
      m.position.set(pos[0], pos[1], pos[2]); m.rotation.set(rot[0], rot[1], rot[2]);
      const glow = new T.Mesh(new T.PlaneGeometry(0.72 * scale, 0.92 * scale), new T.MeshBasicMaterial({ color: 0x12a36f, transparent: true, opacity: 0 }));
      glow.position.copy(m.position); glow.rotation.copy(m.rotation); glow.translateZ(-0.005);
      g.add(glow); g.add(m); plates[key] = { mesh: m, glow };
    }
    // 1: exterior junto a la puerta; 2: interior respaldo (simbolizado atrás de la puerta); 3: exterior trasera; 4: exterior frontal
    makePlate('door', [1.05, 1.35, 1.121], [0, 0, 0], 1);
    makePlate('rear', [-2.815, 1.4, 0.55], [0, -Math.PI / 2, 0], 0.9);
    makePlate('front', [2.83, 1.0, -0.6], [0, Math.PI / 2, 0], 0.6);
    makePlate('interior', [0.2, 1.35, 1.121], [0, 0, 0], 0.7);

    let active = opts.highlight || 'door'; let t = 0; let raf; let spin = opts.spin !== false;
    function highlight(key) { active = key; }
    function tick() {
      t += 0.016;
      if (spin) g.rotation.y = -0.6 + Math.sin(t * 0.35) * 0.55;
      g.position.y = Math.sin(t * 1.2) * 0.02;
      Object.keys(plates).forEach(k => {
        const p = plates[k]; const on = k === active;
        p.glow.material.opacity = on ? 0.35 + Math.sin(t * 4) * 0.25 : 0;
        p.mesh.visible = on || opts.showAll;
      });
      renderer.render(scene, cam); raf = requestAnimationFrame(tick);
    }
    tick();
    function dispose() { cancelAnimationFrame(raf); renderer.dispose(); container.innerHTML = ''; }
    return { dispose, highlight, setSpin(v) { spin = v; } };
  }
  return { mount };
})();
