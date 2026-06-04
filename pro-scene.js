// ============================================================
// SOLAR 3D · PRO SCENE LAYER
// Scene-level professional additions, patched onto the live sim after
// it is ready (no engine edits):
//   · Bright-star catalogue  — real RA/Dec/mag stars on the celestial shell
//   · Spacecraft trails       — past-track polylines behind each probe
// Both expose toggles on the sim instance and stay correct across scale
// modes by re-projecting cached coordinates on a light interval.
// ============================================================
(function () {
  const DEG = Math.PI / 180;
  const OBLIQ = 23.4393 * DEG;     // ecliptic obliquity

  function onReady(fn) {
    if (window.__solarSim && window.THREE) return fn(window.__solarSim);
    window.addEventListener('solar-sim-ready', () => fn(window.__solarSim), { once: true });
    // fallback poll
    let n = 0; const t = setInterval(() => {
      if (window.__solarSim && window.THREE) { clearInterval(t); fn(window.__solarSim); }
      else if (++n > 120) clearInterval(t);
    }, 80);
  }

  onReady(function (sim) {
    const THREE = window.THREE;
    buildBrightStars(sim, THREE);
    buildSpacecraftTrails(sim, THREE);
  });

  // ── Soft round point sprite ──
  function discTexture(THREE) {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.35, 'rgba(255,255,255,0.85)');
    g.addColorStop(0.7, 'rgba(255,255,255,0.18)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    const t = new THREE.CanvasTexture(c); t.needsUpdate = true; return t;
  }

  // RA(hours)/Dec(deg) → scene direction (Y-up), tilted onto the ecliptic frame
  function radecToVec(raH, decD) {
    const ra = raH * 15 * DEG, dec = decD * DEG;
    // equatorial unit vector, scene axes (X→equinox, Y up, Z)
    const ex = Math.cos(dec) * Math.cos(ra);
    const ey = Math.sin(dec);
    const ez = -Math.cos(dec) * Math.sin(ra);
    // rotate about X by -obliquity to bring equator near the ecliptic plane
    const y = ey * Math.cos(-OBLIQ) - ez * Math.sin(-OBLIQ);
    const z = ey * Math.sin(-OBLIQ) + ez * Math.cos(-OBLIQ);
    return { x: ex, y: y, z: z };
  }

  function hexToRGB(hex) {
    hex = hex.replace('#', '');
    return [parseInt(hex.slice(0, 2), 16) / 255, parseInt(hex.slice(2, 4), 16) / 255, parseInt(hex.slice(4, 6), 16) / 255];
  }

  function makeLabel(THREE, text, color) {
    const c = document.createElement('canvas'); c.width = 256; c.height = 64;
    const x = c.getContext('2d');
    x.fillStyle = color; x.font = '600 26px "Space Mono", monospace';
    x.textAlign = 'left'; x.textBaseline = 'middle';
    x.shadowColor = 'rgba(0,0,0,0.9)'; x.shadowBlur = 6;
    x.fillText(text, 8, 34);
    const t = new THREE.CanvasTexture(c);
    const m = new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false, depthWrite: false, opacity: 0.0 });
    const s = new THREE.Sprite(m); s.scale.set(2600, 650, 1); return s;
  }

  function buildBrightStars(sim, THREE) {
    const cat = window.BRIGHT_STARS || [];
    if (!cat.length) return;
    const R = 96000;          // far celestial shell, behind everything
    const grp = new THREE.Group();
    grp.userData = { type: 'bright_stars' };
    const pos = new Float32Array(cat.length * 3);
    const col = new Float32Array(cat.length * 3);
    const siz = new Float32Array(cat.length);
    const labels = [];
    cat.forEach((s, i) => {
      const [name, raH, decD, mag, hex] = s;
      const v = radecToVec(raH, decD);
      pos[i * 3] = v.x * R; pos[i * 3 + 1] = v.y * R; pos[i * 3 + 2] = v.z * R;
      const [r, g, b] = hexToRGB(hex);
      col[i * 3] = r; col[i * 3 + 1] = g; col[i * 3 + 2] = b;
      siz[i] = Math.max(0.5, 2.6 - mag * 0.42);
      if (mag < 1.35) {
        const lab = makeLabel(THREE, name.toUpperCase(), hex);
        lab.position.set(v.x * R * 0.992, v.y * R * 0.992, v.z * R * 0.992);
        labels.push(lab); grp.add(lab);
      }
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.setAttribute('psize', new THREE.BufferAttribute(siz, 1));
    const mat = new THREE.PointsMaterial({
      size: 70, map: discTexture(THREE), vertexColors: true,
      transparent: true, opacity: 0.95, depthWrite: false, depthTest: false,
      blending: THREE.AdditiveBlending, sizeAttenuation: true,
    });
    // scale per-point size via onBeforeCompile (multiply gl_PointSize by attribute)
    mat.onBeforeCompile = (sh) => {
      sh.vertexShader = 'attribute float psize;\n' + sh.vertexShader
        .replace('gl_PointSize = size;', 'gl_PointSize = size * psize;');
    };
    const points = new THREE.Points(geo, mat);
    points.renderOrder = -3;
    grp.add(points);
    grp.visible = false;
    sim.scene.add(grp);
    sim.brightStars = grp;

    sim.setShowBrightStars = function (v) {
      grp.visible = !!v;
      labels.forEach(l => { l.material.opacity = v ? 0.7 : 0; });
    };
  }

  function buildSpacecraftTrails(sim, THREE) {
    const craftList = window.SPACECRAFT || [];
    const OM = window.OrbitalMechanics;
    if (!craftList.length || !OM || !window.spacecraftPositionAU) return;
    const trails = {};
    const N = 64;
    craftList.forEach((craft) => {
      // cache AU samples from launch (or a few years back) to now
      const launch = craft.launched ? new Date(craft.launched) : new Date(Date.now() - 6 * 3.15e10);
      const samplesAU = [];
      for (let i = 0; i <= N; i++) {
        const t = i / N;
        const d = new Date(launch.getTime() + t * (Date.now() - launch.getTime()));
        const p = window.spacecraftPositionAU(craft, d);
        samplesAU.push(p);
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array((N + 1) * 3), 3));
      const mat = new THREE.LineBasicMaterial({
        color: new THREE.Color(craft.color || '#8fd0e0'),
        transparent: true, opacity: 0.32, depthWrite: false,
      });
      const line = new THREE.Line(geo, mat);
      line.renderOrder = 2;
      sim.scene.add(line);
      trails[craft.id] = { line, samplesAU, craft };
    });
    sim._spacecraftTrails = trails;

    function reproject() {
      const mode = sim.state.mode;
      const show = sim.state.showSpacecraft && (sim._trailsOn !== false);
      for (const id in trails) {
        const { line, samplesAU } = trails[id];
        line.visible = show;
        if (!show) continue;
        const arr = line.geometry.attributes.position.array;
        for (let i = 0; i < samplesAU.length; i++) {
          const s = OM.auToSceneVec(samplesAU[i].x, samplesAU[i].y, samplesAU[i].z, mode);
          arr[i * 3] = s.x; arr[i * 3 + 1] = s.y; arr[i * 3 + 2] = s.z;
        }
        line.geometry.attributes.position.needsUpdate = true;
        line.geometry.computeBoundingSphere();
      }
    }
    reproject();
    setInterval(reproject, 450);
    sim.setShowSpacecraftTrails = function (v) { sim._trailsOn = !!v; reproject(); };
  }
})();
